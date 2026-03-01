// backend/application/use-cases/auth/RegistrarUsuario.js
const Usuario = require('../../../domain/entities/Usuario');
const Solicitante = require('../../../domain/entities/Solicitante');
const Operador = require('../../../domain/entities/Operador');

class RegistrarUsuario {
  constructor(
    usuarioRepository,
    solicitanteRepository,
    operadorRepository,
    authService,
    emailService
  ) {
    this.usuarioRepository = usuarioRepository;
    this.solicitanteRepository = solicitanteRepository;
    this.operadorRepository = operadorRepository;
    this.authService = authService;
    this.emailService = emailService;
  }

  validarCampos(data, rol) {
    const errors = [];
    
    if (!data.email) errors.push('Email es requerido');
    if (!data.password) errors.push('Contraseña es requerida');
    if (!data.nombre_completo) errors.push('Nombre completo es requerido');
    if (!data.dni) errors.push('DNI es requerido');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.push('Formato de email inválido');
    }

    const usuarioTemp = new Usuario({ telefono: data.telefono });
    try {
      if (data.telefono) usuarioTemp.validarTelefono();
    } catch (error) {
      errors.push(error.message);
    }

    if (data.password) {
      if (data.password.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres');
      if (!/(?=.*[a-z])/.test(data.password)) errors.push('La contraseña debe contener al menos una letra minúscula');
      if (!/(?=.*[A-Z])/.test(data.password)) errors.push('La contraseña debe contener al menos una letra mayúscula');
      if (!/(?=.*\d)/.test(data.password)) errors.push('La contraseña debe contener al menos un número');
    }

    if (rol === 'solicitante') {
      const empresaErrors = Solicitante.validarEmpresaData(data);
      errors.push(...empresaErrors);
    }

    return errors;
  }

  filtrarCamposValidos(data, rol) {
    const camposPermitidos = [
      'email', 'password', 'nombre_completo', 'telefono', 'dni', 'rol'
    ];
    if (rol === 'solicitante') {
      camposPermitidos.push('nombre_empresa', 'cuit', 'representante_legal', 'domicilio');
    }
    const datosFiltrados = {};
    camposPermitidos.forEach(campo => {
      if (data[campo] !== undefined) {
        datosFiltrados[campo] = data[campo];
      }
    });
    return datosFiltrados;
  }

  async execute(reqData) {
    const { rol = 'solicitante' } = reqData;
    const datosFiltrados = this.filtrarCamposValidos(reqData, rol);
    const validacionErrores = this.validarCampos(datosFiltrados, rol);

    if (validacionErrores.length > 0) {
      return {
        success: false,
        status: 400,
        message: 'Errores de validación en el registro',
        errors: validacionErrores
      };
    }

    const { email, password, nombre_completo, telefono, dni } = datosFiltrados;

    const usuarioExistente = await this.usuarioRepository.findInactiveByEmail(email);
    if (usuarioExistente) {
      return await this.reactivarUsuario(usuarioExistente.id, datosFiltrados, rol);
    }

    const usuarioActivo = await this.usuarioRepository.exists(email);
    if (usuarioActivo) {
      return {
        success: false,
        status: 400,
        message: 'Ya existe una cuenta activa con este email'
      };
    }

    let authResult = await this.authService.signUp(email, password, {
      nombre_completo,
      telefono: telefono || '',
      dni,
      rol
    });

    if (!authResult.success) {
      if (authResult.error?.message?.includes('already registered') || authResult.error?.status === 42) {
        return await this.manejarUsuarioAuthExistente(email, datosFiltrados, rol);
      }
      return {
        success: false,
        status: 400,
        message: authResult.error?.message || 'Error en el registro del usuario'
      };
    }

    if (authResult.data && authResult.data.user) {
      return await this.completarRegistroNuevoUsuario(authResult.data.user, datosFiltrados, rol);
    }

    return {
      success: false,
      status: 500,
      message: 'Error inesperado en el registro'
    };
  }

  async manejarUsuarioAuthExistente(email, datosFiltrados, rol) {
    const authUser = await this.authService.getUserByEmail(email);
    if (!authUser) {
      throw new Error('No se pudo verificar el estado del usuario existente');
    }

    const existingUserId = authUser.id;

    try {
      const userInTable = await this.usuarioRepository.findById(existingUserId);
      if (userInTable && userInTable.cuenta_activa) {
        throw new Error('Ya existe una cuenta activa con este email');
      } else {
        return await this.completarRegistroNuevoUsuario({ id: existingUserId, email: authUser.email }, datosFiltrados, rol);
      }
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        return await this.completarRegistroNuevoUsuario({ id: existingUserId, email: authUser.email }, datosFiltrados, rol);
      }
      throw error;
    }
  }

  async completarRegistroNuevoUsuario(authUser, datos, rol) {
    const usuarioData = {
      id: authUser.id,
      nombre_completo: datos.nombre_completo,
      email: authUser.email,
      telefono: datos.telefono || '',
      dni: datos.dni,
      rol: rol,
      password_hash: 'hashed_by_supabase',
      cuenta_activa: false,
      created_at: new Date().toISOString(),
    };

    let userData;
    try {
      userData = await this.usuarioRepository.create(usuarioData);
    } catch (userError) {
      if (userError.message.includes('duplicate')) {
        userData = await this.usuarioRepository.update(authUser.id, usuarioData);
      } else {
        try {
          await this.authService.deleteUser(authUser.id);
        } catch (deleteError) {
          console.warn('No se pudo eliminar usuario de auth:', deleteError.message);
        }
        throw userError;
      }
    }

    await this.insertarEnTablaEspecifica(rol, authUser.id, datos);

    const emailResult = await this.emailService.enviarEmailConfirmacionCuenta(authUser.email, datos.nombre_completo, authUser.id);

    return {
      success: true,
      status: 201,
      message: 'Usuario registrado correctamente. Por favor revisa tu email para confirmar tu cuenta',
      data: {
        user: authUser,
        profile: userData,
        rol: rol,
        emailConfirmed: false,
        emailEnviado: emailResult.success
      }
    };
  }

  async reactivarUsuario(userId, datos, rol) {
    const userData = await this.usuarioRepository.update(userId, {
      nombre_completo: datos.nombre_completo,
      telefono: datos.telefono || '',
      dni: datos.dni,
      rol: rol,
      cuenta_activa: true,
      updated_at: new Date().toISOString()
    });

    await this.insertarEnTablaEspecifica(rol, userId, datos);

    const authUser = await this.authService.getUserById(userId);
    await this.emailService.enviarEmailBienvenida(authUser.email, datos.nombre_completo, rol);

    return {
      success: true,
      status: 200,
      message: 'Usuario reactivado correctamente',
      data: {
        user: authUser,
        profile: userData,
        rol: rol
      }
    };
  }

  async insertarEnTablaEspecifica(rol, userId, datos) {
    const { nombre_completo, nombre_empresa, cuit, representante_legal, domicilio } = datos;

    if (rol === 'solicitante') {
      const solicitanteData = {
        id: userId,
        tipo: 'empresa',
        nombre_empresa: nombre_empresa || '',
        cuit: cuit || '',
        representante_legal: representante_legal || nombre_completo,
        domicilio: domicilio || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        await this.solicitanteRepository.create(solicitanteData);
      } catch (error) {
        try {
          await this.solicitanteRepository.update(userId, solicitanteData);
        } catch (updateError) {
          console.error('Error actualizando solicitante:', updateError.message);
        }
      }
    } else if (rol === 'operador') {
      const operadorData = {
        id: userId,
        nivel: 'analista',
        permisos: ['revision', 'aprobacion', 'rechazo'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      try {
        await this.operadorRepository.create(operadorData);
      } catch (error) {
        try {
          await this.operadorRepository.update(userId, operadorData);
        } catch (updateError) {
          console.error('Error actualizando operador:', updateError.message);
        }
      }
    }
  }
}

module.exports = RegistrarUsuario;