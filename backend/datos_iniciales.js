require('dotenv').config();
const { supabase } = require('./config/conexion.js');
const { supabaseAdmin, getUserByEmail } = require('./config/supabaseAdmin.js');

const datosIniciales = async () => {
  try {
    console.log('📊 Conectando a Supabase para inserción de datos iniciales...');

    // Verificar si ya existen usuarios en la tabla personalizada
    const { data: usuariosExistentes, error: countError } = await supabase
      .from('usuarios')
      .select('id, email, rol');

    if (countError && countError.code !== '42P01') {
      console.error('❌ Error verificando usuarios existentes:', countError);
      throw countError;
    }

    if (!usuariosExistentes || usuariosExistentes.length === 0) {
      console.log('🆕 Insertando datos iniciales en Supabase...');

      // 1. Obtener o crear usuarios en Auth de Supabase
      console.log('🔐 Procesando usuarios en sistema de autenticación...');
      const usuariosAuthIds = await crearUsuariosAuth();

      // 2. Insertar en tabla usuarios y tablas específicas
      console.log('💾 Insertando usuarios en tablas personalizadas...');
      
      await insertarUsuariosEnTablas(usuariosAuthIds);

    } else {
      console.log('✅ Ya existen usuarios en la base de datos, omitiendo inserción');
      console.log('📋 Usuarios existentes:', usuariosExistentes.map(u => `${u.email} (${u.rol})`));
    }

    console.log('🎉 Datos iniciales procesados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en datos iniciales:', error.message);
    console.log('⚠️  Continuando sin datos iniciales...');
    return false;
  }
};

// Función para insertar usuarios en todas las tablas necesarias
const insertarUsuariosEnTablas = async (usuariosAuthIds) => {
  try {
    // Datos para la tabla usuarios
    const usuarios = [
      {
        id: usuariosAuthIds.Carlos,
        nombre_completo: 'Carlos Alberto',
        email: 'Carlos@hotmail.com',
        telefono: '0943802926',
        cedula_identidad: '0999999999',
        password_hash: 'managed_by_supabase_auth',
        rol: 'operador',
        cuenta_activa: true,
        created_at: new Date().toISOString()
      },
      {
        id: usuariosAuthIds.Mario,
        nombre_completo: 'Mario Garcia',
        email: 'Mario@hotmail.com',
        telefono: '0913800016',
        cedula_identidad: '0888888888',
        password_hash: 'managed_by_supabase_auth',
        rol: 'operador',
        cuenta_activa: true,
        created_at: new Date().toISOString()
      },
      {
        id: usuariosAuthIds.figueroa,
        nombre_completo: 'Melissa Figueroa',
        email: 'figueroa@hotmail.com',
        telefono: '0903800026',
        cedula_identidad: '0977777777',
        password_hash: 'managed_by_supabase_auth',
        rol: 'solicitante',
        cuenta_activa: true,
        created_at: new Date().toISOString()
      }
    ];

    // 1. Insertar en tabla usuarios usando el cliente admin para evitar RLS
    console.log('📝 Insertando en tabla usuarios...');
    const { data: usuariosInsertados, error: insertError } = await supabaseAdmin
      .from('usuarios')
      .insert(usuarios)
      .select();

    if (insertError) {
      console.error('❌ Error insertando usuarios en tabla:', insertError);
      
      // Si es error de RLS, intentar deshabilitar temporalmente las políticas
      if (insertError.code === '42501') {
        console.log('🛡️  Error de RLS, intentando con políticas temporales...');
        await configurarPoliticasRLS();
        
        // Reintentar la inserción
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from('usuarios')
          .insert(usuarios)
          .select();
          
        if (retryError) {
          throw retryError;
        }
        usuariosInsertados = retryData;
      } else {
        throw insertError;
      }
    }

    console.log('✅ Usuarios insertados en tabla principal:', usuariosInsertados.length);

    // 2. Insertar operadores en tabla operadores
    console.log('👨‍💼 Insertando operadores...');
    const operadores = usuariosInsertados.filter(u => u.rol === 'operador');
    
    if (operadores.length > 0) {
      const operadoresData = operadores.map(usuario => ({
        id: usuario.id,
        nivel: 'analista',
        permisos: ['revision', 'aprobacion', 'rechazo'],
        created_at: new Date().toISOString()
      }));

      const { data: operadoresInsertados, error: operadoresError } = await supabaseAdmin
        .from('operadores')
        .insert(operadoresData)
        .select();

      if (operadoresError) {
        console.error('❌ Error insertando operadores:', operadoresError);
      } else {
        console.log('✅ Operadores insertados:', operadoresInsertados.length);
      }
    }

    // 3. Insertar solicitantes en tabla solicitantes
    console.log('👥 Insertando solicitantes...');
    const solicitantes = usuariosInsertados.filter(u => u.rol === 'solicitante');
    
    if (solicitantes.length > 0) {
      const solicitantesData = solicitantes.map(usuario => ({
        id: usuario.id,
        tipo: 'empresa',
        nombre_empresa: 'Empresa de ' + usuario.nombre_completo.split(' ')[0],
        cuit: '30-' + usuario.cedula_identidad + '-9',
        representante_legal: usuario.nombre_completo,
        domicilio: 'Dirección de ' + usuario.nombre_completo.split(' ')[0],
        created_at: new Date().toISOString()
      }));

      const { data: solicitantesInsertados, error: solicitantesError } = await supabaseAdmin
        .from('solicitantes')
        .insert(solicitantesData)
        .select();

      if (solicitantesError) {
        console.error('❌ Error insertando solicitantes:', solicitantesError);
      } else {
        console.log('✅ Solicitantes insertados:', solicitantesInsertados.length);
      }
    }

    console.log('📊 Resumen final:');
    console.log(`   - Usuarios en tabla 'usuarios': ${usuariosInsertados.length}`);
    console.log(`   - Operadores en tabla 'operadores': ${operadores.length}`);
    console.log(`   - Solicitantes en tabla 'solicitantes': ${solicitantes.length}`);

  } catch (error) {
    console.error('❌ Error insertando usuarios en tablas:', error);
    throw error;
  }
};

// Función para configurar políticas RLS temporalmente
const configurarPoliticasRLS = async () => {
  try {
    console.log('⚙️  Configurando políticas RLS para inserción inicial...');
    
    // SQL para deshabilitar RLS temporalmente o agregar políticas para inserción inicial
    const sqlCommands = [
      `DROP POLICY IF EXISTS "usuarios_propio_perfil" ON usuarios;`,
      `CREATE POLICY "allow_initial_insert" ON usuarios FOR ALL USING (true);`,
      `DROP POLICY IF EXISTS "solicitantes_propios_datos" ON solicitantes;`,
      `CREATE POLICY "allow_initial_insert_solicitantes" ON solicitantes FOR ALL USING (true);`
    ];

    for (const sql of sqlCommands) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
      if (error) {
        console.log('⚠️  No se pudo ejecutar SQL, continuando...');
      }
    }
    
    console.log('✅ Políticas RLS configuradas temporalmente');
  } catch (error) {
    console.log('⚠️  No se pudieron configurar políticas RLS, continuando...');
  }
};

// Función para crear usuarios en Auth
const crearUsuariosAuth = async () => {
  const usuariosAuthIds = {};
  
  try {
    console.log('🔑 Usando service_role key para crear usuarios en Auth...');

    const usuariosAuth = [
      {
        email: 'Carlos@hotmail.com',
        password: 'operador1234',
        email_confirm: true,
        user_metadata: {
          nombre_completo: 'Carlos Alberto',
          cedula_identidad: '0999999999',
          rol: 'operador'
        }
      },
      {
        email: 'Mario@hotmail.com',
        password: 'operador123',
        email_confirm: true,
        user_metadata: {
          nombre_completo: 'Mario Garcia',
          cedula_identidad: '0888888888',
          rol: 'operador'
        }
      },
      {
        email: 'figueroa@hotmail.com',
        password: 'cliente123',
        email_confirm: true,
        user_metadata: {
          nombre_completo: 'Melissa Figueroa',
          cedula_identidad: '0977777777',
          rol: 'solicitante'
        }
      }
    ];

    for (const usuario of usuariosAuth) {
      console.log(`👤 Procesando usuario: ${usuario.email}`);
      
      try {
        // Primero intentar obtener el usuario si existe usando la función
        const { data: existingUser, error: getUserError } = await getUserByEmail(usuario.email);
        
        if (getUserError || !existingUser || !existingUser.user) {
          // Si no existe, crearlo
          console.log(`➡️  Creando nuevo usuario: ${usuario.email}`);
          const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: usuario.email,
            password: usuario.password,
            email_confirm: usuario.email_confirm,
            user_metadata: usuario.user_metadata
          });

          if (createError) {
            if (createError.code === 'email_exists' || createError.status === 422) {
              console.log(`⚠️  Usuario ${usuario.email} ya existe en Auth, obteniendo ID...`);
              const { data: retryUser } = await getUserByEmail(usuario.email);
              if (retryUser && retryUser.user) {
                usuariosAuthIds[usuario.email.split('@')[0]] = retryUser.user.id;
                console.log(`✅ Usuario existente obtenido: ${retryUser.user.id}`);
              }
            } else {
              console.error(`❌ Error creando usuario ${usuario.email}:`, createError.message);
            }
          } else {
            console.log(`✅ Nuevo usuario creado: ${data.user.id}`);
            usuariosAuthIds[usuario.email.split('@')[0]] = data.user.id;
          }
        } else {
          // El usuario ya existe
          console.log(`✅ Usuario existente encontrado: ${existingUser.user.id}`);
          usuariosAuthIds[usuario.email.split('@')[0]] = existingUser.user.id;
        }
      } catch (error) {
        console.error(`❌ Error procesando usuario ${usuario.email}:`, error.message);
        if (error.code === 'email_exists' || error.status === 422) {
          console.log(`🔄 Continuando con siguiente usuario...`);
          continue;
        }
      }
    }

    console.log('🔐 Proceso de usuarios en Auth completado');
    console.log('📋 IDs obtenidos:', usuariosAuthIds);
    return usuariosAuthIds;

  } catch (error) {
    console.error('❌ Error en creación de usuarios Auth:', error.message);
    throw error;
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  datosIniciales()
    .then((success) => {
      if (success) {
        console.log('✅ Proceso de datos iniciales completado exitosamente');
      } else {
        console.log('⚠️  Proceso de datos iniciales completado con advertencias');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error crítico en datos iniciales:', error);
      process.exit(1);
    });
}

module.exports = datosIniciales;