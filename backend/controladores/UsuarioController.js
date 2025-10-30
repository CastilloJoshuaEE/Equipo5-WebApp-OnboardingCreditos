const UsuarioModel= require('../modelos/UsuarioModel');
const SolicitanteModel= require('../modelos/SolicitanteModel');
const OperadorModel= require('../modelos/OperadorModel');
const{supabaseAdmin, getUserByEmail}= require('../config/supabaseAdmin');
const{enviarEmailBienvenida, enviarEmailConfirmacionCuenta}= require('../servicios/emailServicio');
const { supabase } = require('../config/conexion');
const bcrypt = require('bcryptjs');
const AuthController= require('../controladores/authController');

class UsuarioController{
static async validarTelefono(telefono) {
  if (!telefono) return true;
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  const telefonoRegex = /^(\+?\d{1,4})?[\s\-]?\(?(\d{1,4})?\)?[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})$/;
  if (!telefonoRegex.test(telefono)) return false;
  const soloNumeros = telefonoLimpio.replace(/\D/g, '');
  return soloNumeros.length >= 8 && soloNumeros.length <= 15;
}
static validarCamposRegistro(data, rol) {
    const errors = [];
    
    if (!data.email) errors.push('Email es requerido');
    if (!data.password) errors.push('Contraseña es requerida');
    if (!data.nombre_completo) errors.push('Nombre completo es requerido');
    if (!data.dni) errors.push('DNI es requerido');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
        errors.push('Formato de email inválido');
    }

    if (data.telefono && !UsuarioController.validarTelefono(data.telefono)) {
        errors.push('Formato de teléfono inválido');
    }

    // Validación robusta de contraseña
    if (data.password) {
        if (data.password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }
        if (!/(?=.*[a-z])/.test(data.password)) {
            errors.push('La contraseña debe contener al menos una letra minúscula');
        }
        if (!/(?=.*[A-Z])/.test(data.password)) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }
        if (!/(?=.*\d)/.test(data.password)) {
            errors.push('La contraseña debe contener al menos un número');
        }
    }

    if (rol === 'solicitante') {
        const empresaErrors = SolicitanteModel.validarEmpresaData(data);
        errors.push(...empresaErrors);
    }

    return errors;
}
  static filtrarCamposValidos(data, rol){
    const camposPermitidos= [
      'email', 'password', 'nombre_completo', 'telefono', 'dni', 'rol'
    ];
    if(rol==='solicitante'){
      camposPermitidos.push('nombre_empresa', 'cuit', 'representante_legal', 'domicilio');
    }
    const datosFiltrados= {};
    camposPermitidos.forEach(campo=>{
      if(data[campo]!== undefined){
        datosFiltrados[campo]= data[campo];
      }
    });
    return datosFiltrados;
  }
  static async registrar(req, res){
    try{
      console.log('Body recibido:', req.body);
      const{rol='solicitante'}= req.body;
      const datosFiltrados= UsuarioController.filtrarCamposValidos(req.body, rol);
      const validacionErrores= UsuarioController.validarCamposRegistro(datosFiltrados, rol);
      if(validacionErrores.length>0){
        return res.status(400).json({
          success:false,
          message: 'Errores de validación en el registro',
          errors: validacionErrores
        });
      }
      const{ email, password, nombre_completo, telefono, dni}= datosFiltrados;
      if(!password || password.length<8){
        return res.status(400).json({
          success:false,
          message: 'La contraseña debe tener al menos 8 caracteres'
        });
      }
      const passwordRegex= /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if(!passwordRegex.test(password)){
        return res.status(400).json({
          success:false,
          message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
        });
      }
      console.log('Registrando nuevo usuario:',{email, rol});
      const usuarioExistente= await UsuarioModel.findInactiveByEmail(email);
      if(usuarioExistente){
        console.log('Usuario existente inctivo encontrado, reactivando...');
        return await UsuarioController.reactivarUsuario(req, res, usuarioExistente.id);
      }
      const usuarioActivo= await UsuarioModel.exists(email);
      if(usuarioActivo){
        return res.status(400).json({
          success:false,
          message: 'Ya existe una cuenta activa con este email'
        });
      }
      let authData;
      let authError;
      try{
        const result= await supabase.auth.signUp({
          email,
          password,
          options: {
            data:{
              nombre_completo,
              telefono: telefono || '',
              dni,
              rol:rol
            }
          }
        });
        authData= result.data;
        authError= result.error;
      } catch(error){
        authError= error;
      }
      if(authError){
        if(authError.message.includes('already registered')|| authError.status===42){
          return await UsuarioController.manejarUsuarioAuthExistente(req, res, email);
        }
        throw authError;
      }
      if(authData && authData.user){
        console.log('Usuario creado en auth, completando registro...');
        return await UsuarioController.completarRegistroNuevoUsuario(req, res, authData.user, datosFiltrados);
      }


    } catch(error){
      console.error('Error en registro:', error);
      res.status(400).json({
        success:false,
        message: error.message || 'Error en el registro del usuario'
      });
    }
  }
  static async manejarUsuarioAuthExistente(req, res, email){
    try{
      const{data: existingAuthUser, error: getAuthError} = await getUserByEmail(email);
      if(getAuthError || !existingAuthUser || !existingAuthUser.user){
        throw new Error('No se pudo verificar el estado del usuario existente');
      }
      const existingUserId= existingAuthUser.user.id;
      console.log(`Usuario encontrado en auth con ID: ${existingUserId}`);
      try{
        const userInTable= await UsuarioModel.findById(existingUserId);
        if(userInTable && userInTable.cuenta_activa){
          throw new Error('Ya existe una cuenta activa con este email');

        } else{
          return await UsuarioController.completarRegistroNuevoUsuario(req, res, existingUserId, existingAuthUser.user);
        }

      }catch(error){ 
        if(error.message.includes('no encontrado')){
          return await UsuarioController.completarRegistroNuevoUsuario(req, res, existingUserId, existingAuthUser.user);
        }
        throw error;
      }
    } catch(error){ 
      throw error;
    }
  }
  static async completarRegistroUsuarioExistente(req, res, userId, authUser) {
    const datosFiltrados = UsuarioController.filtrarCamposValidos(req.body, req.body.rol);
    const { rol = 'solicitante' } = datosFiltrados;
    try {
        let userData;
        try {
            const existingUser = await UsuarioModel.findById(userId);
            console.log('Actualizando usuario existente inactivo...');
            userData = await UsuarioModel.update(userId, {
                nombre_completo: datosFiltrados.nombre_completo,
                telefono: datosFiltrados.telefono || '',
                dni: datosFiltrados.dni,
                rol: rol,
                password_hash: 'hashed_by_supabase', // ✅ AGREGAR ESTE CAMPO
                cuenta_activa: true,
                updated_at: new Date().toISOString()
            });

        } catch (error) {
            if (error.message.includes('no encontrado')) {
                console.log('Insertando nuevo registro para usuario existente...');
                const usuarioData = {
                    id: userId,
                    nombre_completo: datosFiltrados.nombre_completo,
                    email: authUser.email,
                    telefono: datosFiltrados.telefono || '',
                    dni: datosFiltrados.dni,
                    password_hash: 'hashed_by_supabase', // ✅ AGREGAR ESTE CAMPO
                    rol: rol,
                    cuenta_activa: true,
                    created_at: new Date().toISOString()
                };
                userData = await UsuarioModel.create(usuarioData);
            } else {
                throw error;
            }
        }
        
        await UsuarioController.insertarEnTablaEspecifica(rol, userId, datosFiltrados);
        await UsuarioController.enviarEmailBienvenidaSiEsPosible(authUser.email, datosFiltrados.nombre_completo, rol);
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente (cuenta reactivada)',
            data: {
                user: authUser,
                profile: userData,
                rol: rol
            }
        });
    } catch (error) {
        throw error;
    }
}
  static async completarRegistroNuevoUsuario(req, res, authUser, datos) {
    const { rol = 'solicitante' } = datos;
    try {
        const usuarioData = {
            id: authUser.id,
            nombre_completo: datos.nombre_completo,
            email: authUser.email,
            telefono: datos.telefono || '',
            dni: datos.dni, // ¡IMPORTANTE! Agregar el campo dni que falta
            rol: rol,
            password_hash: 'hashed_by_supabase', 
            cuenta_activa: false,
            created_at: new Date().toISOString(),
        };
        
        console.log('Datos para insertar en usuarios:', usuarioData);
        
        let userData;
        try {
            userData = await UsuarioModel.create(usuarioData);
        } catch (userError) {
            if (userError.message.includes('duplicate')) {
                console.log('ID ya existe, actualizando registro existente...');
                userData = await UsuarioModel.update(authUser.id, usuarioData);
            } else {
                console.error('Error creando usuario:', userError);
                // Intentar eliminar usuario de auth si falla
                try {
                    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
                } catch (deleteError) {
                    console.warn('No se pudo eliminar usuario de auth:', deleteError.message);
                }
                throw userError;
            }
        }
        
        console.log(`Usuario insertado en tabla usuarios con rol: ${rol} (ID: ${authUser.id})`);
        await UsuarioController.insertarEnTablaEspecifica(rol, authUser.id, datos);
        
        const emailResult = await UsuarioController.enviarEmailConfirmacionSiEsPosible(authUser.email, datos.nombre_completo, authUser.id);
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente. Por favor revisa tu email para confirmar tu cuenta',
            data: {
                user: authUser,
                profile: userData,
                rol: rol,
                emailConfirmed: false,
                emailEnviado: emailResult.emailEnviado
            }
        });

    } catch (error) {
        console.error('Error en completarRegistroNuevoUsuario:', error);
        throw error;
    }
}
  
  static async reactivarUsuario(req, res, userId){
    const datosFiltrados= UsuarioController.filtrarCamposValidos(req.body, req.body.rol);
    const{rol='solicitante'}= datosFiltrados;
    try{
      console.log(`Reactivando usuario ID: ${userId}`);
      const updateUser= await UsuarioModel.update(userId, {
        nombre_completo: datosFiltrados.nombre_completo,
        telefono: datosFiltrados.telefono || '',
        dni: datosFiltrados.dni,
        rol: rol,
        cuenta_activa: true,
        updated_at: new Date().toISOString()
      });
      await UsuarioController.insertarEnTablaEspecifica(rol, userId, datosFiltrados);
      const {data: authUser, error: authError}= await supabaseAdmin.auth.admin.getUserById(userId);
      if(authError) throw authError;
      await UsuarioController.enviarEmailBienvenidaSiEsPosible(authUser.user.email, datosFiltrados.nombre_completo, rol);
      res.status(200).json({
        success:true,
        message: 'Usuario reactivado correctamente',
        data: {
          user: authUser.user,
          profile: updateUser,
          rol: rol
        }
      });
    }catch(error){
      throw error;
    }
  }
  static async insertarEnTablaEspecifica(rol, userId, datos){
    const{nombre_completo, dni, nombre_empresa, cuit, representante_legal, domicilio}= datos;
    if(rol==='solicitante'){
      const solicitanteData= {
        id: userId,
        tipo: 'empresa',
        nombre_empresa: nombre_empresa || `Empresa de ${nombre_completo.split('')[0]}`,
        cuit: cuit || `30-${dni}-9`,
        representante_legal: representante_legal || nombre_completo,
        domicilio: domicilio || `Direccion de ${nombre_completo.split('')[0]}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      try{
        await SolicitanteModel.create(solicitanteData);
        console.log('Solicitante insertado/actualizado en tabla especifica');
      }catch (error){
        console.warn('Error creando/actualizando solicitante:', error.message);
      }
      

    }else if(rol==='operador'){
      const operadorData= {
        id: userId,
        nivel: 'analista',
        permisos: ['revision', 'aprobacion', 'rechazo'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      try{
        await OperadorModel.create(operadorData);
        console.log('Operador insertado/actualizado en tabla especifica');
      } catch(error){
        console.warn('error creando/actualizando operador:', error.message);
      }
    }
  }
  static async enviarEmailConfirmacionSiEsPosible(email, nombre, userId){
    console.log('[Confirmación] Iniciando envío de email de confirmación...');
    try{
      const emailResult= await enviarEmailConfirmacionCuenta(email, nombre, userId);
      if(!emailResult.success){
        console.warn('Email de confirmación no enviado:', emailResult.error);

      }else{
        console.log('Email de confirmación enviado existosamente');
      }
      return {emailEnviado: emailResult.success};
    }catch(emailError){
      console.warn('Error en envío de email de confirmación:', emailError.message);
      return{emailEnviado: false, error: emailError.message};
    }
  }
  static async enviarEmailBienvenidaSiEsPosible(email, nombre, rol){
    console.log('[SISTEMA] Iniciando envío de email de bienvenida...');
    try{
      const emailResult= await enviarEmailBienvenida(email, nombre, rol);
      if(!emailResult.success){
        console.warn('Email no enviado:', emailResult.error);
      }else{
        console.log('Email de bienvenida enviado existosamente');
      }
      return {emailEnviado: emailResult,success};
    }catch(emailError){
      console.warn('Error en envío de email:', emailError.message);
      return {emailEnviado: false, error: emailError.message};
    }
  }
  static async obtenerPerfil(req, res){
    try {
        const usuarioId = req.usuario.id;
        
        console.log('. Obteniendo perfil completo para usuario ID:', usuarioId);

        // Obtener datos base del usuario
        const usuario = await UsuarioModel.findById(usuarioId);
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Obtener datos específicos según el rol
        let datosEspecificos = {};
        
        if (usuario.rol === 'solicitante') {
            const solicitante = await SolicitanteModel.findByUserId(usuarioId);
            datosEspecificos = {
                nombre_empresa: solicitante?.nombre_empresa,
                cuit: solicitante?.cuit,
                representante_legal: solicitante?.representante_legal,
                domicilio: solicitante?.domicilio,
                tipo: solicitante?.tipo
            };
        } else if (usuario.rol === 'operador') {
            const operador = await OperadorModel.findByUserId(usuarioId);
            datosEspecificos = {
                nivel: operador?.nivel,
                permisos: operador?.permisos
            };
        }

        // Construir respuesta completa
        const perfilCompleto = {
            ...usuario,
            ...datosEspecificos
        };

        console.log('. Perfil completo obtenido exitosamente');

        res.json({
            success: true,
            data: perfilCompleto
        });

    } catch (error) {
        console.error('. Error en obtenerPerfilCompleto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil completo'
        });
    }
  }
  static async obtenerPerfilPorId(req, res){
    try{
      const{id}= req.params;
      console.log('Obteniendo perfil por ID:', id);
      if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario no válido'
        });
      }
      const userProfile= await UsuarioModel.getProfileWithRoleData(id);
      if(!userProfile){
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      console.log('Perfil por ID obtenido exitosamente');
      res.json({
        success: true,
        data: userProfile
      });

    } catch(error){
      console.error('Error en obtenerPerfilPorId:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
  static async actualizarPerfil(req, res){
    try {
        const usuarioId = req.usuario.id;
        const {
            nombre_completo,
            telefono,
            direccion,
            // Campos específicos de solicitante
            nombre_empresa,
            cuit,
            representante_legal,
            domicilio
        } = req.body;

        console.log('✏️ Editando perfil para usuario ID:', usuarioId);
        console.log('Datos recibidos:', {
            nombre_completo,
            telefono,
            direccion,
            nombre_empresa,
            cuit,
            representante_legal,
            domicilio
        });

        // Validar que al menos un campo sea proporcionado
        const camposVacios = !nombre_completo && !telefono && !direccion && 
                           !nombre_empresa && !cuit && !representante_legal && !domicilio;
        
        if (camposVacios) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar'
            });
        }

        // Obtener usuario actual para verificar rol
        const usuarioActual = await UsuarioModel.findById(usuarioId);
        
        if (!usuarioActual) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Preparar actualizaciones para la tabla usuarios
        const updatesUsuario = {
            updated_at: new Date().toISOString()
        };

        if (nombre_completo) {
            if (nombre_completo.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre completo debe tener al menos 2 caracteres'
                });
            }
            updatesUsuario.nombre_completo = nombre_completo.trim();
        }

        if (telefono) {
            if (!UsuarioController.validarTelefono(telefono)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de teléfono inválido'
                });
            }
            updatesUsuario.telefono = telefono;
        }

        if (direccion) {
            updatesUsuario.direccion = direccion;
        }

        // Actualizar tabla usuarios
        let usuarioActualizado;
        if (Object.keys(updatesUsuario).length > 1) { // Más de justo el updated_at
            usuarioActualizado = await UsuarioModel.update(usuarioId, updatesUsuario);
        }

        // Actualizar datos específicos según el rol
        if (usuarioActual.rol === 'solicitante') {
            const updatesSolicitante = {
                updated_at: new Date().toISOString()
            };

            if (nombre_empresa) {
                if (nombre_empresa.trim().length < 2) {
                    return res.status(400).json({
                        success: false,
                        message: 'El nombre de empresa debe tener al menos 2 caracteres'
                    });
                }
                updatesSolicitante.nombre_empresa = nombre_empresa.trim();
            }

            if (cuit) {
                if (!/^\d{2}-\d{8}-\d{1}$/.test(cuit)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Formato de CUIT inválido. Use: 30-12345678-9'
                    });
                }
                updatesSolicitante.cuit = cuit;
            }

            if (representante_legal) {
                if (representante_legal.trim().length < 2) {
                    return res.status(400).json({
                        success: false,
                        message: 'El representante legal debe tener al menos 2 caracteres'
                    });
                }
                updatesSolicitante.representante_legal = representante_legal.trim();
            }

            if (domicilio) {
                if (domicilio.trim().length < 5) {
                    return res.status(400).json({
                        success: false,
                        message: 'El domicilio debe tener al menos 5 caracteres'
                    });
                }
                updatesSolicitante.domicilio = domicilio.trim();
            }

            // Actualizar tabla solicitantes si hay cambios
            if (Object.keys(updatesSolicitante).length > 1) {
                await SolicitanteModel.update(usuarioId, updatesSolicitante);
            }
        }

        // Obtener perfil actualizado completo
        const perfilActualizado = await UsuarioModel.getProfileWithRoleData(usuarioId);

        console.log('. Perfil actualizado exitosamente');

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: perfilActualizado
        });

    } catch (error) {
        console.error('. Error en editarPerfil:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al actualizar el perfil'
        });
    }
  }
  //Actualizar perfil de cualquier usuario por ID (solo para operadores)
  static async actualizarPerfilPorId(req, res){
    try{
      const{ id }= req.params;
      const { nombre_completo, telefono, direccion, cuenta_activa, rol}= req.body;
      console.log('Actualizando perfil por ID:', id);
      console.log('Datos a actualizar:', {nombre_completo, telefono, direccion, cuenta_activa, rol});
      //Verificar que el ID sea un UUID válido
      if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario no válido'
        });
      }
      //Validar que al menos un campo sea proporcionado
      if(!nombre_completo && !telefono && !direccion && cuenta_activa===undefined && !rol){
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }
      const updates= {
        updated_at: new Date().toISOString()
      };
      if(nombre_completo) updates.nombre_completo=nombre_completo;
      if(telefono) updates.telefono= telefono;
      if(direccion) updates.direccion= direccion;
      if(cuenta_activa!==undefined) updates.cuenta_activa= cuenta_activa;
      if(rol) updates.rol= rol;
      const updatedUser= await UsuarioModel.update(id, updates);
      console.log('Perfil por ID actualizado exitosamente');
      res.json({
        success:true,
        message: 'Perfil actualizado exitosamente',
        data: updatedUser
      });
    }catch(error){
      console.error('Error en actualizarPerfilPorId:', error);
      res.status(400).json({
        success:false,
        message: error.message
      });
    }
  }
  //Cambiar contraseña
  static async cambiarContrasena(req, res){
    try{
      const{contrasena_actual, nueva_contrasena, confirmar_contrasena}= req.body;
      console.log('Solicitando cambio de contraseña para usuario ID:', req.usuario.id);
      console.log('Datos recibidos:',{
        contrasena_actual: !!contrasena_actual,
        nueva_contrasena: !!nueva_contrasena,
        confirmar_contrasena: !!confirmar_contrasena
      });
      //Validar campos obligatorios
      if(!contrasena_actual || !nueva_contrasena || !confirmar_contrasena){
        return res.status(400).json({
          success:false,
          message: ' Contraseña actual, nueva contraseña y confirmación son requeridos',
          detalles: {
            campos_recibidos: {
              contrasena_actual: !!contrasena_actual,
              nueva_contrasena: !!nueva_contrasena,
              confirmar_Contrasena: !!confirmar_contrasena
            },
            campos_esperados: ['contrasena_actual', 'nueva_contrasena', 'confirmar_contrasena']
          }
        });
      }

      //Validar que las contraseñas coincidan
      if(nueva_contrasena!== confirmar_contrasena){
        return res.status(400).json({
          success:false,
          message: 'Las nuevas contraseñas no coinciden'
        });
      }
      //Validar longitud mínima de contraseña
      if(nueva_contrasena.length<6){
        return res.status(400).json({
          success:false,
          message: 'La contraseña debe tener al menos 8 caracteres'
        });
      }
      //Verificar que la nueva contraseña sea diferente a la actual
      if(contrasena_actual===nueva_contrasena){
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe ser diferente a la actual'
        });
      }
              // Verificar que no sea una de las últimas 3 contraseñas
        const { data: historial, error: historialError } = await supabase
            .from('historial_contrasenas')
            .select('password_hash')
            .eq('usuario_id', req.usuario.id)
            .order('created_at', { ascending: false })
            .limit(3);

        if (!historialError && historial) {
            for (const item of historial) {
                // Verificar si la nueva contraseña coincide con alguna anterior
                // Nota: Esto requiere una función de comparación de hashes
                const esIgual = await UsuarioController.compararHashContrasena(nueva_contrasena, item.password_hash);
                if (esIgual) {
                    return res.status(400).json({
                        success: false,
                        message: 'No puede reutilizar una contraseña anterior. Por favor elija una contraseña diferente.'
                    });
                }
            }
        }
      console.log('Verificando contraseña actual para:', req.usuario.email);
      //Verificar contraseña actual con supabase auth
      const{data:verifyData, error: verifyError}= await supabase.auth.signInWithPassword({
        email: req.usuario.email,
        password: contrasena_actual
      });
      if(verifyError){
        console.error('Error verificando contraseña actual:', verifyError);
        let errorMessage= 'La contraseña actual es incorrecta';
        if(verifyError.message.includes('Invalid login credentials')){
          errorMessage='La contraseña actual es incorrecta';
        }else if(verifyError.message.includes('Email not confirmed')){
          errorMessage='Tu email no está confirmado. Por favor verifica tu cuenta';
        }
        return res.status(400).json({
          success:false,
          message: 'Error en el procesamiento de la solicitud',
          code: 'VALIDATION_ERROR'
        });
      }
      console.log('Contraseña actual verificada, actualizando...');
      //Actualizar contraseña en Supabase Auth
      const { data: updateData, error: updateError}= await supabase.auth.updateUser({
        password: nueva_contrasena
      });
      if(updateError){
        console.error('Error actualizando contraseña en Auth:', updateError);
        let errorMessage= 'Error al actualizar la contraseña';
        if(updateError.message.includes('password should be different')){
          errorMessage='La nueva contraseña debe ser diferente a la anterior';
        }else if(updateError.message.includes('weak_password')){
          errorMessage= 'La contraseña es demasiado débil. Usa una combinación más segura';
        }
        return res.status(400).json({
          sucess: false,
          message: 'Error en el procesamiento de la solicitud',
          code: 'VALIDATION_ERROR'
        });
      }
      console.log('Contraseña actualizada exitosamente para:', req.usuario.email);
      res.json({
        success:true,
        message: 'Contraseña actualizada exitosamente'
      });

      const nuevoHash = await UsuarioController.generarHashContrasena(nueva_contrasena);
        await supabase
            .from('historial_contrasenas')
            .insert([{
                usuario_id: req.usuario.id,
                password_hash: nuevoHash
            }]);

    }catch(error){
      console.error('Error en cambiarContrasena:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al cambiar la contraseña'
      });
    }
  }
  //Recuperar contraseña (Sin necesidad de estar autenticado)
static async recuperarContrasena(req, res) {
  try {
    const { email, nueva_contrasena, confirmar_contrasena } = req.body;
    console.log('Solicitando recuperación de contraseña para:', email);

    if (!email || !nueva_contrasena || !confirmar_contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Email, nueva contraseña y confirmación son requeridos'
      });
    }

    if (nueva_contrasena !== confirmar_contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    if (nueva_contrasena.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Verificar que el usuario existe en la base de datos
    const usuarioExistente = await UsuarioModel.findByEmail(email);

    if (!usuarioExistente) {
      console.log('Usuario no encontrado en tabla usuarios:', email);
      return res.status(404).json({
        success: false,
        message: 'No hay una cuenta registrada con este email'
      });
    }

    if (!usuarioExistente.cuenta_activa) {
      return res.status(400).json({
        success: false,
        message: 'La cuenta no está activa. Por favor contacta al administrador'
      });
    }

    // 🚫 Verificar que no sea una de las últimas 3 contraseñas usadas
    const { data: historial, error: historialError } = await supabase
      .from('historial_contrasenas')
      .select('password_hash')
      .eq('usuario_id', usuarioExistente.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!historialError && historial && historial.length > 0) {
      for (const item of historial) {
        const esIgual = await UsuarioController.compararHashContrasena(nueva_contrasena, item.password_hash);
        if (esIgual) {
          return res.status(400).json({
            success: false,
            message: 'No puede reutilizar una contraseña anterior. Por favor elija una contraseña diferente.'
          });
        }
      }
    }

    // . Actualizar la contraseña en Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      usuarioExistente.id,
      { password: nueva_contrasena }
    );

    if (updateError) {
      console.error('Error actualizando contraseña en auth:', updateError);
      console.log('Intentando método alternativo de recuperación...');
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/actualizar-contrasena`
      });
      
      if (resetError) {
        throw new Error('No se pudo procesar la recuperación de contraseña');
      }
      
      return res.json({
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu email. Por favor revisa tu bandeja de entrada'
      });
    }

    // . Guardar nueva contraseña en el historial
    const nuevoHash = await UsuarioController.generarHashContrasena(nueva_contrasena);
    await supabase
      .from('historial_contrasenas')
      .insert([{
        usuario_id: usuarioExistente.id,
        password_hash: nuevoHash
      }]);

    console.log('Contraseña recuperada exitosamente para:', email);
const limpiezaExitosa = await AuthController.limpiarIntentosFallidos(email);
console.log('. Resultado limpieza intentos:', limpiezaExitosa ? 'ÉXITO' : 'FALLO');
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña',
      intentos_limpiados: limpiezaExitosa
    });

  } catch (error) {
    console.error('Error en recuperarContrasena:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al recuperar la contraseña'
    });
  }
}

  // Solicitar recuperación de cuenta
  static async solicitarRecuperacionCuenta(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email es requerido'
        });
      }

      console.log('. Solicitando enlace de recuperación para:', email);

      // Verificar que el usuario existe
      const usuarioExistente = await UsuarioModel.findByEmail(email);

      if (!usuarioExistente) {
        // Por seguridad, no revelar si el email existe o no
        console.log('ℹ️ Solicitud de recuperación para email no registrado:', email);
        return res.json({
          success: true,
          message: 'Si el email está registrado, recibirás un enlace de recuperación'
        });
      }

      if (!usuarioExistente.cuenta_activa) {
        return res.status(400).json({
          success: false,
          message: 'La cuenta no está activa. Por favor contacta al administrador.'
        });
      }

      console.log(`. Usuario encontrado: ${usuarioExistente.nombre_completo}`);

      // OPCIÓN 1: Usar email personalizado (recomendado)
      let emailPersonalizadoEnviado = false;
      try {
        const { enviarEmailRecuperacionCuenta } = require('../servicios/emailServicio');
        const emailResult = await enviarEmailRecuperacionCuenta(
          usuarioExistente.email, 
          usuarioExistente.nombre_completo, 
          usuarioExistente.id
        );

        if (emailResult.success) {
          console.log('. Email de recuperación personalizado enviado exitosamente a:', email);
          emailPersonalizadoEnviado = true;
          return res.json({
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu email. Por favor revisa tu bandeja de entrada.',
            tipo: 'personalizado'
          });
        } else {
          console.warn('. No se pudo enviar email personalizado:', emailResult.error);
          console.log('. Usando Supabase Auth como fallback...');
        }
      } catch (emailError) {
        console.warn('. Error en email personalizado:', emailError.message);
        console.log('. Usando Supabase Auth como fallback...');
      }

      // OPCIÓN 2: Usar Supabase Auth (fallback)
      console.log('. Enviando email de recuperación via Supabase Auth...');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restablecer-contrasena`
      });

      if (resetError) {
        console.error('. Error enviando email de recuperación:', resetError);
        throw resetError;
      }

      console.log('. Email de recuperación (Supabase Auth) enviado exitosamente a:', email);

      res.json({
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu email. Por favor revisa tu bandeja de entrada.',
        tipo: 'supabase_auth'
      });

    } catch (error) {
      console.error('. Error en solicitarRecuperacionCuenta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error al solicitar recuperación de cuenta'
      });
    }
  }

  // Desactivar cuenta del usuario autenticado
static async desactivarCuenta(req, res) {
  try {
    console.log('🚫 Desactivando cuenta para usuario ID:', req.usuario.id);
    const { password, motivo } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña es requerida para desactivar la cuenta'
      });
    }

    // IMPORTANTE: Importar supabase correctamente
    const { supabase } = require('../config/conexion.js');

    // Verificar contraseña
    const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.usuario.email,
      password: password
    });


if (verifyError) {
    console.error('Error verificando contraseña actual:', verifyError);
    
    let errorMessage = 'La contraseña actual es incorrecta';
    if (verifyError.message.includes('Invalid login credentials')) {
        errorMessage = 'La contraseña actual es incorrecta. Verifique e intente nuevamente.';
    } else if (verifyError.message.includes('Email not confirmed')) {
        errorMessage = 'Su email no está confirmado. Por favor verifique su cuenta antes de cambiar la contraseña.';
    }
    
    return res.status(400).json({
        success: false,
        message: errorMessage, // Mensaje específico y claro
        code: 'CONTRASENA_ACTUAL_INCORRECTA'
    });
}

    // Desactivar cuenta en la base de datos
    const usuarioDesactivado = await UsuarioModel.deactivateAccount(req.usuario.id, motivo);

    // Salir en Supabase Auth
    await supabase.auth.signOut();

    console.log('. Cuenta desactivada exitosamente para:', req.usuario.email);
    
    res.json({
      success: true,
      message: 'Cuenta desactivada exitosamente. Puedes reactivarla iniciando sesión nuevamente.',
      data: {
        usuario: usuarioDesactivado,
        fecha_desactivacion: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('. Error en desactivarCuenta:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al desactivar la cuenta'
    });
  }
}

  // Actualizar email de recuperación
static async actualizarEmailRecuperacion(req, res) {
    try {
        const { email_recuperacion } = req.body;
        
        console.log('Solicitud recibida para actualizar email de recuperación:', {
            usuario: req.usuario.id,
            email_recuperacion
        });

        if (!email_recuperacion) {
            return res.status(400).json({
                success: false,
                message: 'El email de recuperación es requerido'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email_recuperacion)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del email de recuperación no es válido'
            });
        }

        // No permitir el mismo email principal
        if (email_recuperacion === req.usuario.email) {
            return res.status(400).json({
                success: false,
                message: 'El email de recuperación no puede ser igual al email principal'
            });
        }

        console.log('Actualizando email de recuperación para usuario ID:', req.usuario.id);
        
        const updatedUser = await UsuarioModel.updateRecoveryEmail(req.usuario.id, email_recuperacion);

        console.log('Email de recuperación actualizado exitosamente:', updatedUser.email_recuperacion);
        
        res.json({
            success: true,
            message: 'Email de recuperación actualizado exitosamente',
            data: {
                email_recuperacion: updatedUser.email_recuperacion
            }
        });

    } catch (error) {
        console.error('Error en actualizarEmailRecuperacion:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
}

  // Verificar estado de cuenta
  static async verificarEstadoCuenta(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const usuario = await UsuarioModel.findById(usuarioId);
      
      res.json({
        success: true,
        data: {
          cuenta_activa: usuario.cuenta_activa,
          fecha_desactivacion: usuario.fecha_desactivacion,
          email_recuperacion: usuario.email_recuperacion,
          tiene_email_recuperacion: !!usuario.email_recuperacion
        }
      });
    } catch (error) {
      console.error('Error en verificarEstadoCuenta:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando estado de la cuenta'
      });
    }
  }

  // Método auxiliar para corregir inconsistencia de IDs
  static async corregirInconsistenciaIDs(authId, tablaId, email) {
    try {
      console.log('. Corrigiendo inconsistencia de IDs:', { authId, tablaId, email });
      
      // Actualizar ID en tabla usuarios
      await UsuarioModel.update(tablaId, { id: authId });

      console.log('. ID actualizado en tabla usuarios');

      // Intentar actualizar en tabla solicitantes si existe
      try {
        await SolicitanteModel.update(tablaId, { id: authId });
        console.log('. ID actualizado en tabla solicitantes');
      } catch (solicitanteError) {
        console.warn('. No se pudo actualizar tabla solicitantes:', solicitanteError.message);
      }

      // Intentar actualizar en tabla operadores si existe
      try {
        await OperadorModel.update(tablaId, { id: authId });
        console.log('. ID actualizado en tabla operadores');
      } catch (operadorError) {
        console.warn('. No se pudo actualizar tabla operadores:', operadorError.message);
      }

      console.log('. Inconsistencia de IDs . exitosamente');
      return true;
    } catch (error) {
      console.error('. Error en corregirInconsistenciaIDs:', error);
      return false;
    }
  }

  // Obtener todos los usuarios (solo para operadores)
  static async obtenerTodosUsuarios(req, res) {
    try {
      const { rol, cuenta_activa, page = 1, limit = 10 } = req.query;

      let query = supabase
        .from('usuarios')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (rol) {
        query = query.eq('rol', rol);
      }
      if (cuenta_activa !== undefined) {
        query = query.eq('cuenta_activa', cuenta_activa === 'true');
      }

      // Paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query.range(from, to);

      const { data: usuarios, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: usuarios,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('. Error obteniendo todos los usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios'
      });
    }
  }

  // Buscar usuarios por criterios (solo para operadores)
  static async buscarUsuarios(req, res) {
    try {
      const { query: searchQuery, rol, campo = 'nombre_completo' } = req.query;

      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda es requerido'
        });
      }

      let supabaseQuery = supabase
        .from('usuarios')
        .select('*')
        .ilike(campo, `%${searchQuery}%`)
        .limit(20);

      if (rol) {
        supabaseQuery = supabaseQuery.eq('rol', rol);
      }

      const { data: usuarios, error } = await supabaseQuery;

      if (error) throw error;

      res.json({
        success: true,
        data: usuarios
      });

    } catch (error) {
      console.error('. Error buscando usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar usuarios'
      });
    }
  }
  static async obtenerConfiguracionCuenta(req, res) {
  try {
    const usuarioId = req.usuario.id;
    
    console.log('Obteniendo configuración de cuenta para usuario ID:', usuarioId);

    const usuario = await UsuarioModel.findById(usuarioId);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        email_principal: usuario.email,
        email_recuperacion: usuario.email_recuperacion,
        cuenta_activa: usuario.cuenta_activa,
        fecha_desactivacion: usuario.fecha_desactivacion
      }
    });

  } catch (error) {
    console.error('Error en obtenerConfiguracionCuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de cuenta'
    });
  }
}
// Obtener perfil público de usuario por ID (para operadores)
static async obtenerPerfilUsuario(req, res) {
    try {
        const { id } = req.params;
        
        console.log('👤 Obteniendo perfil de usuario ID:', id);

        // Verificar que el ID sea un UUID válido
        if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario no válido'
            });
        }

        // Obtener perfil completo
        const perfilCompleto = await UsuarioModel.getProfileWithRoleData(id);
        
        if (!perfilCompleto) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Filtrar información sensible para perfil público
        const perfilPublico = {
            id: perfilCompleto.id,
            nombre_completo: perfilCompleto.nombre_completo,
            email: perfilCompleto.email,
            telefono: perfilCompleto.telefono,
            rol: perfilCompleto.rol,
            cuenta_activa: perfilCompleto.cuenta_activa,
            created_at: perfilCompleto.created_at
        };

        // Agregar información específica según el rol
        if (perfilCompleto.rol === 'solicitante' && perfilCompleto.solicitantes) {
            perfilPublico.datos_empresa = {
                nombre_empresa: perfilCompleto.solicitantes.nombre_empresa,
                cuit: perfilCompleto.solicitantes.cuit,
                representante_legal: perfilCompleto.solicitantes.representante_legal,
                domicilio: perfilCompleto.solicitantes.domicilio,
                tipo: perfilCompleto.solicitantes.tipo
            };
        } else if (perfilCompleto.rol === 'operador' && perfilCompleto.operadores) {
            perfilPublico.datos_operador = {
                nivel: perfilCompleto.operadores.nivel,
                permisos: perfilCompleto.operadores.permisos
            };
        }

        console.log('. Perfil de usuario obtenido exitosamente');

        res.json({
            success: true,
            data: perfilPublico
        });

    } catch (error) {
        console.error('. Error en obtenerPerfilUsuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil del usuario'
        });
    }
}
  // Generar hash de contraseña
  static async generarHashContrasena(contrasena) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(contrasena, salt);
  }

  // Comparar contraseña con hash guardado
  static async compararHashContrasena(contrasena, hash) {
    return await bcrypt.compare(contrasena, hash);
  }
}
  
module.exports= UsuarioController;