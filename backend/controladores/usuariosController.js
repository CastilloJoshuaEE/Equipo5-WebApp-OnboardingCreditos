const { supabase } = require('../config/conexion.js');
const { supabaseAdmin, getUserByEmail } = require('../config/supabaseAdmin.js'); 
const { enviarEmailBienvenida } = require('../servicios/emailServicio');
const { enviarEmailConfirmacionCuenta } = require('../servicios/emailServicio');
const { validateEmailBeforeAuth } = require('../middleware/emailValidation');
const validarTelefono = (telefono) => {
  if (!telefono) return true; // Teléfono es opcional
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  
  // Validar formato internacional (Ej: +593987654321) o nacional
  const telefonoRegex = /^(\+?\d{1,4})?[\s\-]?\(?(\d{1,4})?\)?[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})$/;
  
  if (!telefonoRegex.test(telefono)) {
    return false;
  }
  
  const soloNumeros = telefonoLimpio.replace(/\D/g, '');
  return soloNumeros.length >= 8 && soloNumeros.length <= 15;
};

const   validarCamposRegistro=(data, rol)=>{
  const errors=[];
  if(!data.email) errors.push('Email es requerido');
  if(!data.password) errors.push('Contraseña es requerida');
  if(!data.nombre_completo) errors.push('Nombre completo es requerido');
  if(!data.dni) errors.push('DNI es requerido');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(data.email && !emailRegex.test(data.email)){
    errors.push('Formato de email inválido');
  }
  if(data.telefono && !validarTelefono(data.telefono)){
    errors.push('Formato de teléfono inválido. Use formato: +593987654321');
  }
  if(rol=== 'solicitante'){
    if(!data.nombre_empresa) errors.push('Nombre de empresa es requerido para solicitantes');
    if(!data.cuit) errors.push('CUIT es requerido para solicitantes');
    if(!data.representante_legal) errors.push('Representante legal es requerido para solicitantes');
    if(!data.domicilio) errors.push('Domicilio es requerido para solicitantes');
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    if(data.cuit && !cuitRegex.test(data.cuit)){
      errors.push('Formato de CUIT inválido (debe ser: 30-12345678-9)');
    }

  }
  return errors;
}
const filtrarCamposValidos=(data, rol)=>{
  const camposPermitidos=[
    'email', 'password', 'nombre_completo', 'telefono', 'dni', 'rol'
  ];
  if(rol==='solicitante'){
    camposPermitidos.push('nombre_empresa', 'cuit', 'representante_legal', 'domicilio');
  }
  const datosFiltrados={};
  camposPermitidos.forEach(campo =>{
    if(data[campo]!== undefined){
      datosFiltrados[campo]= data[campo];
    }
  });
  return datosFiltrados;


};


const registrar = async (req, res) => {
  try {
    console.log('. Body recibido:', req.body);

    const { 
      email, 
      password, 
      nombre_completo, 
      telefono, 
      dni, 
      rol = 'solicitante'
    } = req.body;
    const validacionErrores= validarCampoRegistro(req.body, rol);
    if(validacionErrores.length>0){
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: validacionErrores
      });
    }
    const datosFiltrados= filtrarCamposValidos(req.body, rol);
    console.log('Campos filtrados para registro: ', datosFiltrados);
    if(!password || password.length<8){
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;    // Validaciones básicas
    if(!passwordRegex.test(password)){
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
      });
    }

    console.log('. Registrando nuevo usuario:', { email, rol });

    // VERIFICAR SI EL USUARIO EXISTE PERO ESTÁ INACTIVO
    const { data: usuarioExistente, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, cuenta_activa, rol')
      .eq('email', email)
      .maybeSingle();

    if (usuarioError && usuarioError.code !== 'PGRST116') {
      console.error('. Error verificando usuario existente:', usuarioError);
    }

    // Si existe pero está inactivo, reactivar
    if (usuarioExistente && !usuarioExistente.cuenta_activa) {
      console.log('. Usuario existente inactivo encontrado, reactivando...');
      return await reactivarUsuario(req, res, usuarioExistente.id);
    }

    // Si existe y está activo, rechazar
    if (usuarioExistente && usuarioExistente.cuenta_activa) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cuenta activa con este email'
      });
    }

    // CREAR USUARIO EN SUPABASE AUTH (SIN CONFIRMACIÓN AUTOMÁTICA)
    let authData;
    let authError;

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo,
            telefono: telefono || '',
            dni,
            rol: rol
          }
        }
      });
      
      authData = result.data;
      authError = result.error;
    } catch (error) {
      authError = error;
    }

    // MANEJAR ERRORES DE AUTH
    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        // Usuario ya existe en Auth, obtenerlo
        const { data: existingAuthUser, error: getAuthError } = await getUserByEmail(email);
        
        if (getAuthError || !existingAuthUser || !existingAuthUser.user) {
          throw new Error('No se pudo verificar el estado del usuario existente');
        }

        const existingUserId = existingAuthUser.user.id;
        console.log(`. Usuario encontrado en Auth con ID: ${existingUserId}`);

        // Verificar si existe en nuestra tabla
        const { data: userInTable, error: tableError } = await supabaseAdmin
          .from('usuarios')
          .select('id, cuenta_activa')
          .eq('id', existingUserId)
          .maybeSingle();

        // Si no existe en nuestra tabla o está inactivo, proceder
        if (!userInTable || !userInTable.cuenta_activa) {
          return await completarRegistroUsuarioExistente(req, res, existingUserId, existingAuthUser.user);
        } else {
          throw new Error('Ya existe una cuenta activa con este email');
        }
      } else {
        throw authError;
      }
    }

    // REGISTRO EXITOSO
    if (authData && authData.user) {
      console.log('. Usuario creado en Auth, completando registro...');
      return await completarRegistroNuevoUsuario(req, res, authData.user);
    }

  } catch (error) {
    console.error('. Error en registro:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error en el registro del usuario'
    });
  }
};
const completarRegistroNuevoUsuario = async (req, res, authUser) => {
  const datosFiltrados= filtrarCamposValidos(req.body, req.body.rol);
  const { 
    nombre_completo, 
    telefono, 
    dni, 
    rol = 'solicitante',
    nombre_empresa, 
    cuit, 
    representante_legal, 
    domicilio 
  } = datosFiltrados;

  try {
    // 1. Insertar en tabla usuarios PERO con cuenta INACTIVA hasta confirmación
    const usuarioData = {
      id: authUser.id,
      nombre_completo,
      email: authUser.email,
      telefono: telefono || '',
      dni,
      password_hash: 'hashed_by_supabase',
      rol: rol,
      cuenta_activa: false, // . CAMBIO IMPORTANTE: Inactivo hasta confirmación
      created_at: new Date().toISOString()
    };

    let userData;
    let userError;

    const result = await supabaseAdmin
      .from('usuarios')
      .insert([usuarioData])
      .select();

    userData = result.data;
    userError = result.error;

    if (userError) {
      console.error('. Error insertando en tabla usuarios:', userError);
      
      // Si es error de duplicado, puede ser por inconsistencia previa
      if (userError.code === '23505') { // unique_violation
        console.log('. ID ya existe, actualizando registro existente...');
        
        const updateResult = await supabaseAdmin
          .from('usuarios')
          .update(usuarioData)
          .eq('id', authUser.id)
          .select();

        if (updateResult.error) {
          console.error('. Error actualizando usuario existente:', updateResult.error);
          await supabaseAdmin.auth.admin.deleteUser(authUser.id);
          throw updateResult.error;
        }
        
        userData = updateResult.data;
      } else {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        throw userError;
      }
    }

    console.log(`. Usuario insertado en tabla 'usuarios' con rol: ${rol} (ID: ${authUser.id})`);
    
    // 2. Insertar en tabla específica según el rol
    await insertarEnTablaEspecifica(rol, authUser.id, {
      nombre_completo, dni, nombre_empresa, cuit, representante_legal, domicilio
    });

    // 3. . ENVIAR EMAIL DE CONFIRMACIÓN en lugar de bienvenida
    const emailResult = await enviarEmailConfirmacionSiEsPosible(authUser.email, nombre_completo, authUser.id);
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente. Por favor revisa tu email para confirmar tu cuenta.',
      data: {
        user: authUser,
        profile: userData ? userData[0] : null,
        rol: rol,
        emailConfirmed: false, // Indicar que necesita confirmación
        emailEnviado: emailResult.emailEnviado
      }
    });

  } catch (error) {
    throw error;
  }
};

const enviarEmailConfirmacionSiEsPosible = async (email, nombre, userId) => {
  console.log('. [CONFIRMACIÓN] Iniciando envío de email de confirmación...');
  try {
    const emailResult = await enviarEmailConfirmacionCuenta(email, nombre, userId);
    
    if (!emailResult.success) {
      if (emailResult.skip) {
        console.log('. Email de confirmación no enviado (configuración faltante)');
      } else {
        console.warn('. Email de confirmación no enviado (error de envío):', emailResult.error);
      }
    } else {
      console.log('. Email de confirmación enviado exitosamente');
    }
    
    return { emailEnviado: emailResult.success };
    
  } catch (emailError) {
    console.warn('. Error en envío de email de confirmación:', emailError.message);
    return { emailEnviado: false, error: emailError.message };
  }
};

// FUNCIÓN PARA COMPLETAR REGISTRO DE USUARIO EXISTENTE EN AUTH
const completarRegistroUsuarioExistente = async (req, res, userId, authUser) => {
  const datosFiltrados= filtrarCamposValidos(req.body, req.body.rol);
  const { 
    nombre_completo, 
    telefono, 
    dni, 
    rol = 'solicitante',
    nombre_empresa, 
    cuit, 
    representante_legal, 
    domicilio 
  } = datosFiltrados;

  try {
    // Verificar si ya existe en nuestra tabla (pero inactivo)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    let userData;

    if (existingUser) {
      // Actualizar usuario existente
      console.log('. Actualizando usuario existente inactivo...');
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update({
          nombre_completo,
          telefono: telefono || '',
          dni,
          rol: rol,
          cuenta_activa: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (updateError) throw updateError;
      userData = updatedUser[0];
    } else {
      // Insertar nuevo registro
      console.log('. Insertando nuevo registro para usuario Auth existente...');
      const usuarioData = {
        id: userId,
        nombre_completo,
        email: authUser.email,
        telefono: telefono || '',
        dni,
        password_hash: 'hashed_by_supabase',
        rol: rol,
        cuenta_activa: true,
        created_at: new Date().toISOString()
      };

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('usuarios')
        .insert([usuarioData])
        .select();

      if (insertError) throw insertError;
      userData = newUser[0];
    }

    // Insertar/actualizar en tabla específica
    await insertarEnTablaEspecifica(rol, userId, {
      nombre_completo, dni, nombre_empresa, cuit, representante_legal, domicilio
    });

    // Enviar email de bienvenida
await enviarEmailBienvenidaSiEsPosible(authUser.email, nombre_completo, rol);

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
};

// FUNCIÓN PARA REACTIVAR USUARIO INACTIVO
const reactivarUsuario = async (req, res, userId) => {
  const datosFiltrados = filtrarCamposValidos(req.body, req.body.rol);

  const { 
    nombre_completo, 
    telefono, 
    dni, 
    rol = 'solicitante',
    nombre_empresa, 
    cuit, 
    representante_legal, 
    domicilio 
  } = datosFiltrados;

  try {
    console.log(`. Reactivando usuario ID: ${userId}`);

    // Actualizar usuario en tabla principal
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        nombre_completo,
        telefono: telefono || '',
        dni,
        rol: rol,
        cuenta_activa: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (updateError) throw updateError;

    // Actualizar/insertar en tabla específica
    await insertarEnTablaEspecifica(rol, userId, {
      nombre_completo, dni, nombre_empresa, cuit, representante_legal, domicilio
    });

    // Obtener datos del usuario de Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError) throw authError;

    // Enviar email de bienvenida
    await enviarEmailBienvenidaSiEsPosible(authUser.user.email, nombre_completo, rol);

    res.status(200).json({
      success: true,
      message: 'Usuario reactivado correctamente',
      data: {
        user: authUser.user,
        profile: updatedUser[0],
        rol: rol
      }
    });

  } catch (error) {
    throw error;
  }
};

// FUNCIÓN AUXILIAR PARA INSERTAR EN TABLA ESPECÍFICA
const insertarEnTablaEspecifica = async (rol, userId, datos) => {
  const { nombre_completo, dni, nombre_empresa, cuit, representante_legal, domicilio } = datos;

  if (rol === 'solicitante') {
    const solicitanteData = {
      id: userId,
      tipo: 'empresa',
      nombre_empresa: nombre_empresa || `Empresa de ${nombre_completo.split(' ')[0]}`,
      cuit: cuit || `30-${dni}-9`,
      representante_legal: representante_legal || nombre_completo,
      domicilio: domicilio || `Dirección de ${nombre_completo.split(' ')[0]}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Usar upsert para insertar o actualizar
    const { error: solicitanteError } = await supabaseAdmin
      .from('solicitantes')
      .upsert([solicitanteData], { onConflict: 'id' });

    if (solicitanteError) {
      console.warn('. Error creando/actualizando solicitante:', solicitanteError);
    } else {
      console.log('. Solicitante insertado/actualizado en tabla específica');
    }

  } else if (rol === 'operador') {
    const operadorData = {
      id: userId,
      nivel: 'analista',
      permisos: ['revision', 'aprobacion', 'rechazo'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: operadorError } = await supabaseAdmin
      .from('operadores')
      .upsert([operadorData], { onConflict: 'id' });

    if (operadorError) {
      console.warn('. Error creando/actualizando operador:', operadorError);
    } else {
      console.log('. Operador insertado/actualizado en tabla específica');
    }
  }
};

// FUNCIÓN AUXILIAR PARA ENVÍO DE EMAIL
const enviarEmailBienvenidaSiEsPosible = async (email, nombre, rol) => {
  console.log('. [SISTEMA] Iniciando envío de email de bienvenida...');
  try {
    const emailResult = await enviarEmailBienvenida(email, nombre, rol);
    
    if (!emailResult.success) {
      if (emailResult.skip) {
        console.log('. Email no enviado (configuración faltante), pero usuario creado exitosamente');
      } else {
        console.warn('. Email no enviado (error de envío), pero usuario creado:', emailResult.error);
      }
    } else {
      console.log('. Email de bienvenida enviado exitosamente');
    }
    
    // Siempre retornar éxito para no bloquear el registro
    return { emailEnviado: emailResult.success };
    
  } catch (emailError) {
    console.warn('. Error en envío de email, pero usuario creado:', emailError.message);
    return { emailEnviado: false, error: emailError.message };
  }
};

const obtenerPerfil = async (req, res) => {
  try {
    console.log('. Obteniendo perfil para usuario ID:', req.usuario.id);
    
    // . Usar el ID del middleware (ya . si era necesario)
    let userProfile;
    const { data: profileData, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.usuario.id)
      .single();

    if (error) {
      console.error('. Error obteniendo perfil:', error);
      
      // . Fallback por email
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', req.usuario.email)
        .single();

      if (fallbackError || !fallbackProfile) {
        throw new Error('Perfil de usuario no encontrado');
      }

      console.log('. Perfil obtenido por email exitosamente');
      userProfile = fallbackProfile;
    } else {
      userProfile = profileData;
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de usuario no encontrado'
      });
    }

    console.log('. Perfil obtenido exitosamente');
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('. Error en obtenerPerfil:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener perfil de cualquier usuario por ID (solo para operadores)
const obtenerPerfilPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('. Obteniendo perfil por ID:', id);
    
    // Verificar que el ID sea un UUID válido
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario no válido'
      });
    }

    const { data: userProfile, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('. Error obteniendo perfil por ID:', error);
      
      if (error.code === 'PGRST116') { // No encontrado
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      throw error;
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('. Perfil por ID obtenido exitosamente');
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('. Error en obtenerPerfilPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
// Actualizar perfil del usuario autenticado
const actualizarPerfil = async (req, res) => {
  try {
    const { nombre_completo, telefono, direccion } = req.body;
    
    console.log('✏️ Actualizando perfil para usuario ID:', req.usuario.id);
    console.log('. Datos a actualizar:', { nombre_completo, telefono, direccion });

    // Validar que al menos un campo sea proporcionado
    if (!nombre_completo && !telefono && !direccion) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    // Solo agregar campos que fueron proporcionados
    if (nombre_completo) updates.nombre_completo = nombre_completo;
    if (telefono) updates.telefono = telefono;
    if (direccion) updates.direccion = direccion;

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', req.usuario.id)
      .select();

    if (error) {
      console.error('. Error actualizando perfil:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('. Perfil actualizado exitosamente');
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: data[0]
    });
  } catch (error) {
    console.error('. Error en actualizarPerfil:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar perfil de cualquier usuario por ID (solo para operadores)
const actualizarPerfilPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, telefono, direccion, cuenta_activa, rol } = req.body;
    
    console.log('✏️ Actualizando perfil por ID:', id);
    console.log('. Datos a actualizar:', { nombre_completo, telefono, direccion, cuenta_activa, rol });

    // Verificar que el ID sea un UUID válido
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario no válido'
      });
    }

    // Validar que al menos un campo sea proporcionado
    if (!nombre_completo && !telefono && !direccion && cuenta_activa === undefined && !rol) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    // Solo agregar campos que fueron proporcionados
    if (nombre_completo) updates.nombre_completo = nombre_completo;
    if (telefono) updates.telefono = telefono;
    if (direccion) updates.direccion = direccion;
    if (cuenta_activa !== undefined) updates.cuenta_activa = cuenta_activa;
    if (rol) updates.rol = rol;

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('. Error actualizando perfil por ID:', error);
      
      if (error.code === 'PGRST116') { // No encontrado
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('. Perfil por ID actualizado exitosamente');
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: data[0]
    });
  } catch (error) {
    console.error('. Error en actualizarPerfilPorId:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Cambiar contraseña
const cambiarContrasena = async (req, res) => {
  try {
    const { contrasena_actual, nueva_contrasena, confirmar_contrasena} = req.body;

    console.log('. Solicitando cambio de contraseña para usuario ID:', req.usuario.id);
    console.log('. Datos recibidos:', { 
      contrasena_actual: !!contrasena_actual, 
      nueva_contrasena: !!nueva_contrasena, 
      confirmar_contrasena: !!confirmar_contrasena
    });

    // . CORRECCIÓN: Aceptar ambos nombres de campo para mayor compatibilidad
    const confirmacion = confirmar_contrasena || confirmar_contrasena;

    // Validar campos obligatorios
    if (!contrasena_actual || !nueva_contrasena || !confirmacion) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual, nueva contraseña y confirmación son requeridos',
        detalles: {
          campos_recibidos: {
            contrasena_actual: !!contrasena_actual,
            nueva_contrasena: !!nueva_contrasena,
            confirmar_contrasena: !!confirmar_contrasena,
            confirmar_contrasena: !!confirmar_contrasena
          },
          campos_esperados: ['contrasena_actual', 'nueva_contrasena', 'confirmar_contrasena']
        }
      });
    }

    // Validar que las contraseñas coincidan
    if (nueva_contrasena !== confirmacion) {
      return res.status(400).json({
        success: false,
        message: 'Las nuevas contraseñas no coinciden'
      });
    }

    // Validar longitud mínima de contraseña
    if (nueva_contrasena.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    if (contrasena_actual === nueva_contrasena) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    console.log('. Verificando contraseña actual para:', req.usuario.email);

    // Verificar contraseña actual con Supabase Auth
    const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.usuario.email,
      password: contrasena_actual
    });

    if (verifyError) {
      console.error('. Error verificando contraseña actual:', verifyError);
      
      // Mensajes de error más específicos
      let errorMessage = 'La contraseña actual es incorrecta';
      if (verifyError.message.includes('Invalid login credentials')) {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (verifyError.message.includes('Email not confirmed')) {
        errorMessage = 'Tu email no está confirmado. Por favor verifica tu cuenta.';
      }
      
      return res.status(400).json({
        success: false,
        message: 'Error en el procesamiento de la solicitud',
        code: 'VALIDATION_ERROR'
      });
    }

    console.log('. Contraseña actual verificada, actualizando...');

    // Actualizar contraseña en Supabase Auth
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: nueva_contrasena
    });

    if (updateError) {
      console.error('. Error actualizando contraseña en Auth:', updateError);
      
      let errorMessage = 'Error al actualizar la contraseña';
      if (updateError.message.includes('password should be different')) {
        errorMessage = 'La nueva contraseña debe ser diferente a la anterior';
      } else if (updateError.message.includes('weak_password')) {
        errorMessage = 'La contraseña es demasiado débil. Usa una combinación más segura.';
      }
      
      return res.status(400).json({
        success: false,
        message: 'Error en el procesamiento de la solicitud',
        code: 'VALIDATION_ERROR'
      });
    }

    console.log('. Contraseña actualizada exitosamente para:', req.usuario.email);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('. Error en cambiarContrasena:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cambiar la contraseña'
    });
  }
};
//Recuperar contraseña(sin necesidad de estar autenticado)
const recuperarContrasena = async(req, res)=>{
  try{
    const{email, nueva_contrasena, confirmar_contrasena}= req.body;
    console.log('Solicitando recuperación de contraseña para:', email);
    if(!email || !nueva_contrasena || !confirmar_contrasena){
      return res.status(400).json({
        success:false,
        message: 'Email, nueva contraseña y confirmación son requeridos'
      });
    }
    if(nueva_contrasena !== confirmar_contrasena){
      return res.status(400).json({
        success:false,
        message: 'Las contraseñas no coinciden'
      });
    }
    if(nueva_contrasena.length<6){
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    //Verificar que el usuario existe en nuestra tabla
    const{data: usuarioExistente, error: usuarioError}=await supabase
    .from('usuarios')
    .select('id, email, cuenta_activa')
    .eq('email', email)
    .single();
    if(usuarioError || !usuarioExistente){
      console.log('Usuario no encontrado en tabla usuarios:', email);
      return res.status(404).json({
        success:false,
        message: 'No hay una cuenta registrada con este email'
      });
    }
    if(!usuarioExistente.cuenta_activa){
      return res.status(400).json({
        success: false,
        message: 'La cuenta no está activa. Por favor contacta al administrador'
      });
    }
    const {data:updateData, error: updateError}= await supabaseAdmin.auth.admin.updateUserById(
      usuarioExistente.id,
      {password: nueva_contrasena}
    );
    if(updateError){
      console.error('Error actualizando contraseña en auth:', updateError);
      console.log('Intentando método alternativo de recuperación...');
      const{error: resetError}= await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/actualizar-contrasena`
      });
      if(resetError){
        throw new Error('No se pudo procesar la recuperación de contraseña');
      }
      return res.json({
        success:true,
        message:'Se ha enviado un enlace de recuperación a tu email. Por favor revisa tu bandeja de entrada'
      });
    }
    console.log('Contraseña recuperada exitosamente para:', email);
    res.json({
      success:true,
      message: 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña'
    });
  }catch(error){
    console.error('Error en recuperarContrasena:', error);
    res.status(400).json({
      success:false,
      message: error.message || 'Error al recuperar la contraseña'
    });
  }
};
const solicitarRecuperacionCuenta = async (req, res) => {
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
    const { data: usuarioExistente, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, email, cuenta_activa, nombre_completo, email_recuperacion')
      .eq('email', email)
      .single();

    if (usuarioError || !usuarioExistente) {
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
};

// Desactivar cuenta del usuario autenticado
const desactivarCuenta = async (req, res) => {
  try {
    console.log('🚫 Desactivando cuenta para usuario ID:', req.usuario.id);
    const {password, motivo}= req.body;
    if(!password){
      return res.status(400).json({
        success:false,
        message: 'La contraseña es requerida para desactivar la cuenta'
      });
    }
    const {data: verifyData, error: verifyError}= await supabase.auth.signInWithPassword({
      email: req.usuario.email,
      password: password
    });
    if(verifyError){
      return res.status(400).json({
        success: false,
        message: 'Contraseña incorrecta. No se pudo desactivar la cuenta'
      });
    }
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        cuenta_activa: false,
        fecha_desactivacion: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.usuario.id)
      .select();

    if (error) {
      console.error('. Error desactivando cuenta:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Cerrar sesión
    await supabase.auth.signOut();

    console.log('. Cuenta desactivada exitosamente');
    res.json({
      success: true,
      message: 'Cuenta desactivada exitosamente. Puedes desactivarla iniciando sesión nuevamente',
      data: {
        usuario: data[0],
        fecha_desactivacion: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('. Error en desactivarCuenta:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
const actualizarEmailRecuperacion= async(req, res)=>{
  try{
    const{ email_recuperacion}= req.body;
    if(!email_recuperacion){
      return res.status(400).json({
        success: false,
        message: 'El email de recuperación es requerido'
      });
    }
    const emailRegex= /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_recuperacion)){
      return res.status(400).json({
        success: false,
        message: 'El formato del email de recuperación no es válido'
      });
    }
    console.log('Actualizando email de recuperación para usuario ID:', req.usuario.id);
    const{data, error}= await supabase
    .from('usuarios')
    .update({
      email_recuperacion,
      update_at: new Date().toISOString()
    })
    .eq('id', req.usuario.id)
    .select();
    if(error){
      console.error('Error actualizando email de recuperación:', error);
      throw error;
    }
    if(!data || data.length ===0){
      return res.status(404).json({
        success:false,
        message: 'Usuario no encontrado'
      });
    }
    console.log('Email de recuperación actualizado exitosamente');
    res.json({
      success:true,
      message: 'Email de recuperación actualizado exitosamente',
      data: data[0]
    });


  }catch(error){
    console.error(' Error en actualizarEmailRecuperacion:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
const verificarEstadoCuenta= async(req, res)=>{
  try{
    const usuarioId= req.usuario.id;
    const {data:usuario, error}= await supabase
    .from('usuarios')
    .select('cuenta_activa, fecha_desactivacion, email_recuperacion')
    .eq('id', usuarioId)
    .single();
    if(error) throw error;
    res.json({
      success:true,
      data:{
        cuenta_activa: usuario.cuenta_activa,
        fecha_desactivacion: usuario.fecha_desactivacion,
        email_recuperacion: usuario.email_recuperacion,
        tiene_email_recuperacion: !!usuario.email_recuperacion
      }
    });
  }catch(error){
    console.error('Error en verificarEstadoCuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando estado de la cuenta'
    });
  }
};

module.exports = {
  registrar,
  obtenerPerfil,
  obtenerPerfilPorId,
  actualizarPerfil,
  actualizarPerfilPorId,
  cambiarContrasena,
  recuperarContrasena,
  solicitarRecuperacionCuenta,
  desactivarCuenta,
  actualizarEmailRecuperacion,
  verificarEstadoCuenta,
  validarCamposRegistro,
  validarTelefono,
  filtrarCamposValidos
};