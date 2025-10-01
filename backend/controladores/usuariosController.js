// controladores/usuariosController.js
const { supabase } = require('../config/conexion.js');
const { supabaseAdmin, getUserByEmail } = require('../config/supabaseAdmin.js'); // Importar aquí también
const { enviarEmailBienvenida } = require('../servicios/emailServicio');

const registrar = async (req, res) => {
  try {
    console.log('📨 Body recibido:', req.body);

    // Validar que req.body existe
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Datos no proporcionados en el cuerpo de la solicitud'
      });
    }

    const { 
      email, 
      password, 
      nombre_completo, 
      telefono, 
      cedula_identidad, 
      rol = 'solicitante',
      nombre_empresa, 
      cuit, 
      representante_legal, 
      domicilio 
    } = req.body;

    // Validar campos obligatorios
    if (!email || !password || !nombre_completo || !cedula_identidad) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: email, password, nombre_completo, cedula_identidad'
      });
    }

    console.log('📝 Registrando nuevo usuario:', { 
      email, 
      rol, 
      nombre_completo: nombre_completo.substring(0, 10) + '...' 
    });

    // PRIMERO: Verificar si el usuario existe pero está inactivo en nuestra tabla personalizada
    const { data: usuarioExistente, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, cuenta_activa, rol')
      .eq('email', email)
      .maybeSingle(); // Usar maybeSingle para evitar error si no existe

    if (usuarioError && usuarioError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error verificando usuario existente:', usuarioError);
    }

    // Si el usuario existe pero está inactivo, reactivar en lugar de crear nuevo
    if (usuarioExistente && !usuarioExistente.cuenta_activa) {
      console.log('🔄 Usuario existente inactivo encontrado, reactivando...');
      return await reactivarUsuario(req, res, usuarioExistente.id);
    }

    // INTENTAR REGISTRO NORMAL
    let authData;
    let authError;

    try {
      // Intentar registro normal primero
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo,
            telefono: telefono || '',
            cedula_identidad,
            rol: rol
          }
        }
      });
      
      authData = result.data;
      authError = result.error;
    } catch (error) {
      authError = error;
    }

    // MANEJAR ERROR DE EMAIL EXISTENTE
    if (authError) {
      if (authError.message.includes('already registered') || 
          authError.code === 'email_exists' ||
          authError.status === 422) {
        
        console.log('🔄 Usuario existe en Auth, verificando estado...');
        
        // Buscar el usuario existente en Auth
        const { data: existingAuthUser, error: getAuthError } = await getUserByEmail(email);
        
        if (getAuthError || !existingAuthUser || !existingAuthUser.user) {
          console.error('❌ Error obteniendo usuario existente:', getAuthError);
          throw new Error('No se pudo verificar el estado del usuario existente');
        }

        const existingUserId = existingAuthUser.user.id;
        console.log(`✅ Usuario encontrado en Auth con ID: ${existingUserId}`);

        // Verificar si existe en nuestra tabla personalizada
        const { data: userInTable, error: tableError } = await supabaseAdmin
          .from('usuarios')
          .select('id, cuenta_activa')
          .eq('id', existingUserId)
          .maybeSingle();

        if (tableError && tableError.code !== 'PGRST116') {
          console.error('❌ Error verificando tabla usuarios:', tableError);
        }

        // Si no existe en nuestra tabla o está inactivo, proceder
        if (!userInTable || !userInTable.cuenta_activa) {
          console.log('🔄 Continuando con registro para usuario existente en Auth...');
          return await completarRegistroUsuarioExistente(
            req, res, existingUserId, existingAuthUser.user
          );
        } else {
          // El usuario ya existe y está activo
          throw new Error('Ya existe una cuenta activa con este email');
        }
      } else {
        // Otro tipo de error
        throw authError;
      }
    }

    // REGISTRO NORMAL EXITOSO
    if (authData && authData.user) {
      console.log('✅ Usuario creado en Auth, insertando en tablas personalizadas...');
      return await completarRegistroNuevoUsuario(req, res, authData.user);
    }

  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error en el registro del usuario'
    });
  }
};

// FUNCIÓN PARA COMPLETAR REGISTRO DE NUEVO USUARIO
const completarRegistroNuevoUsuario = async (req, res, authUser) => {
  const { 
    nombre_completo, 
    telefono, 
    cedula_identidad, 
    rol = 'solicitante',
    nombre_empresa, 
    cuit, 
    representante_legal, 
    domicilio 
  } = req.body;

  try {
    // 1. Insertar en tabla usuarios
    const usuarioData = {
      id: authUser.id,
      nombre_completo,
      email: authUser.email,
      telefono: telefono || '',
      cedula_identidad,
      password_hash: 'hashed_by_supabase',
      rol: rol,
      cuenta_activa: true,
      created_at: new Date().toISOString()
    };

    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .insert([usuarioData])
      .select();

    if (userError) {
      console.error('❌ Error insertando en tabla usuarios:', userError);
      
      // Revertir: eliminar usuario de Auth si falla
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      throw userError;
    }

    console.log(`✅ Usuario insertado en tabla 'usuarios' con rol: ${rol}`);

    // 2. Insertar en tabla específica según el rol
    await insertarEnTablaEspecifica(rol, authUser.id, {
      nombre_completo, cedula_identidad, nombre_empresa, cuit, representante_legal, domicilio
    });

    // 3. Enviar email de bienvenida
    await enviarEmailBienvenidaSiEsPosible(authUser.email, nombre_completo, rol);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: {
        user: authUser,
        profile: userData[0],
        rol: rol
      }
    });

  } catch (error) {
    throw error;
  }
};

// FUNCIÓN PARA COMPLETAR REGISTRO DE USUARIO EXISTENTE EN AUTH
const completarRegistroUsuarioExistente = async (req, res, userId, authUser) => {
  const { 
    nombre_completo, 
    telefono, 
    cedula_identidad, 
    rol = 'solicitante',
    nombre_empresa, 
    cuit, 
    representante_legal, 
    domicilio 
  } = req.body;

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
      console.log('🔄 Actualizando usuario existente inactivo...');
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update({
          nombre_completo,
          telefono: telefono || '',
          cedula_identidad,
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
      console.log('🔄 Insertando nuevo registro para usuario Auth existente...');
      const usuarioData = {
        id: userId,
        nombre_completo,
        email: authUser.email,
        telefono: telefono || '',
        cedula_identidad,
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
      nombre_completo, cedula_identidad, nombre_empresa, cuit, representante_legal, domicilio
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
  const { 
    nombre_completo, 
    telefono, 
    cedula_identidad, 
    rol = 'solicitante',
    nombre_empresa, 
    cuit, 
    representante_legal, 
    domicilio 
  } = req.body;

  try {
    console.log(`🔄 Reactivando usuario ID: ${userId}`);

    // Actualizar usuario en tabla principal
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        nombre_completo,
        telefono: telefono || '',
        cedula_identidad,
        rol: rol,
        cuenta_activa: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (updateError) throw updateError;

    // Actualizar/insertar en tabla específica
    await insertarEnTablaEspecifica(rol, userId, {
      nombre_completo, cedula_identidad, nombre_empresa, cuit, representante_legal, domicilio
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
  const { nombre_completo, cedula_identidad, nombre_empresa, cuit, representante_legal, domicilio } = datos;

  if (rol === 'solicitante') {
    const solicitanteData = {
      id: userId,
      tipo: 'empresa',
      nombre_empresa: nombre_empresa || `Empresa de ${nombre_completo.split(' ')[0]}`,
      cuit: cuit || `30-${cedula_identidad}-9`,
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
      console.warn('⚠️ Error creando/actualizando solicitante:', solicitanteError);
    } else {
      console.log('✅ Solicitante insertado/actualizado en tabla específica');
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
      console.warn('⚠️ Error creando/actualizando operador:', operadorError);
    } else {
      console.log('✅ Operador insertado/actualizado en tabla específica');
    }
  }
};

// FUNCIÓN AUXILIAR PARA ENVÍO DE EMAIL
const enviarEmailBienvenidaSiEsPosible = async (email, nombre, rol) => {
  console.log('📧 Enviando email de bienvenida...');
  try {
    const emailResult = await enviarEmailBienvenida(email, nombre, rol);
    
    if (!emailResult.success) {
      console.warn('⚠️ Email no enviado, pero usuario creado:', emailResult.error);
    } else {
      console.log('🎉 Email de bienvenida enviado exitosamente');
    }
  } catch (emailError) {
    console.warn('⚠️ Error en envío de email, pero usuario creado:', emailError.message);
  }
};

const obtenerPerfil = async (req, res) => {
  try {
    console.log('👤 Obteniendo perfil para usuario ID:', req.usuario.id);
    
    const { data: userProfile, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.usuario.id)
      .single();

    if (error) {
      console.error('❌ Error obteniendo perfil:', error);
      throw error;
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de usuario no encontrado'
      });
    }

    console.log('✅ Perfil obtenido exitosamente');
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('❌ Error en obtenerPerfil:', error);
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
    
    console.log('👤 Obteniendo perfil por ID:', id);
    
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
      console.error('❌ Error obteniendo perfil por ID:', error);
      
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

    console.log('✅ Perfil por ID obtenido exitosamente');
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('❌ Error en obtenerPerfilPorId:', error);
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
    console.log('📝 Datos a actualizar:', { nombre_completo, telefono, direccion });

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
      console.error('❌ Error actualizando perfil:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('✅ Perfil actualizado exitosamente');
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: data[0]
    });
  } catch (error) {
    console.error('❌ Error en actualizarPerfil:', error);
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
    console.log('📝 Datos a actualizar:', { nombre_completo, telefono, direccion, cuenta_activa, rol });

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
      console.error('❌ Error actualizando perfil por ID:', error);
      
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

    console.log('✅ Perfil por ID actualizado exitosamente');
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: data[0]
    });
  } catch (error) {
    console.error('❌ Error en actualizarPerfilPorId:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Cambiar contraseña
const cambiarContrasena = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // TODO: Implementar lógica de cambio de contraseña
    console.log('🔐 Solicitando cambio de contraseña para usuario ID:', req.usuario.id);

    res.json({
      success: true,
      message: 'Funcionalidad de cambio de contraseña en desarrollo'
    });
  } catch (error) {
    console.error('❌ Error en cambiarContrasena:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Desactivar cuenta del usuario autenticado
const desactivarCuenta = async (req, res) => {
  try {
    console.log('🚫 Desactivando cuenta para usuario ID:', req.usuario.id);

    const { data, error } = await supabase
      .from('usuarios')
      .update({
        cuenta_activa: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.usuario.id)
      .select();

    if (error) {
      console.error('❌ Error desactivando cuenta:', error);
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

    console.log('✅ Cuenta desactivada exitosamente');
    res.json({
      success: true,
      message: 'Cuenta desactivada exitosamente',
      data: data[0]
    });
  } catch (error) {
    console.error('❌ Error en desactivarCuenta:', error);
    res.status(400).json({
      success: false,
      message: error.message
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
  desactivarCuenta
};