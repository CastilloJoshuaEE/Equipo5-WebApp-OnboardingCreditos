require('dotenv').config();
const { supabase } = require('./config/conexion.js');
const { supabaseAdmin, getUserByEmail } = require('./config/supabaseAdmin.js');

const datosIniciales = async () => {
  try {
    console.log('. Conectando a Supabase para inserción de datos iniciales...');

    // Verificar si ya existen usuarios en la tabla personalizada
    const { data: usuariosExistentes, error: countError } = await supabase
      .from('usuarios')
      .select('id, email, rol');

    if (countError && countError.code !== '42P01') {
      console.error('. Error verificando usuarios existentes:', countError);
      throw countError;
    }

    if (!usuariosExistentes || usuariosExistentes.length === 0) {
      console.log('. Insertando datos iniciales en Supabase...');

      // 1. Obtener o crear usuarios en Auth de Supabase
      console.log('. Procesando usuarios en sistema de autenticación...');
      const usuariosAuthIds = await crearUsuariosAuth();

      // 2. Insertar en tabla usuarios y tablas específicas
      console.log('. Insertando usuarios en tablas personalizadas...');
      
      await insertarUsuariosEnTablas(usuariosAuthIds);

    } else {
      console.log('. Ya existen usuarios en la base de datos, omitiendo inserción');
      console.log('. Usuarios existentes:', usuariosExistentes.map(u => `${u.email} (${u.rol})`));
    }

    console.log(' Datos iniciales procesados correctamente');
    return true;
  } catch (error) {
    console.error('. Error en datos iniciales:', error.message);
    console.log('.  Continuando sin datos iniciales...');
    return false;
  }
};

// Función para insertar usuarios en todas las tablas necesarias
const insertarUsuariosEnTablas = async (usuariosAuthIds) => {
  try {
    console.log('. IDs recibidos para inserción:', usuariosAuthIds);

    
    const usuarios = [
      {
        id: usuariosAuthIds.jomeregildo64, 
        nombre_completo: 'Jostin Meregildo',
        email: 'jomeregildo64@gmail.com',
        telefono: '0943802926',
        dni: '0999999999',
        password_hash: 'managed_by_supabase_auth',
        rol: 'operador',
        cuenta_activa: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: usuariosAuthIds.joshuamerejildo846,
        nombre_completo: 'Javier Castillo',
        email: 'joshuamerejildo846@gmail.com',
        telefono: '0903800026',
        dni: '0977777777',
        password_hash: 'managed_by_supabase_auth',
        rol: 'solicitante',
        cuenta_activa: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // . VERIFICAR QUE LOS IDs NO SEAN NULL
    console.log('. Verificando IDs antes de inserción:');
    usuarios.forEach(usuario => {
      console.log(`   ${usuario.email}: ${usuario.id}`);
      if (!usuario.id) {
        throw new Error(`ID es null para usuario: ${usuario.email}`);
      }
    });

    // 1. Insertar en tabla usuarios usando el cliente admin
    console.log('. Insertando en tabla usuarios...');
    const { data: usuariosInsertados, error: insertError } = await supabaseAdmin
      .from('usuarios')
      .insert(usuarios)
      .select();

    if (insertError) {
      console.error('. Error insertando usuarios en tabla:', insertError);
      throw insertError;
    }

    console.log('. Usuarios insertados en tabla principal:', usuariosInsertados.length);

    // 2. Insertar operadores en tabla operadores
    const operadores = usuariosInsertados.filter(u => u.rol === 'operador');
    
    if (operadores.length > 0) {
      const operadoresData = operadores.map(usuario => ({
        id: usuario.id,
        nivel: 'analista',
        permisos: ['revision', 'aprobacion', 'rechazo'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data: operadoresInsertados, error: operadoresError } = await supabaseAdmin
        .from('operadores')
        .insert(operadoresData)
        .select();

      if (operadoresError) {
     //   console.error('. Error insertando operadores:', operadoresError);
      } else {
        console.log('. Operadores insertados:', operadoresInsertados.length);
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
        cuit: '30-' + usuario.dni + '-9',
        representante_legal: usuario.nombre_completo,
        domicilio: 'Dirección de ' + usuario.nombre_completo.split(' ')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data: solicitantesInsertados, error: solicitantesError } = await supabaseAdmin
        .from('solicitantes')
        .insert(solicitantesData)
        .select();

      if (solicitantesError) {
   //     console.error('. Error insertando solicitantes:', solicitantesError);
      } else {
        console.log('. Solicitantes insertados:', solicitantesInsertados.length);
      }
    }

    console.log('. Resumen final:');
    console.log(`   - Usuarios en tabla 'usuarios': ${usuariosInsertados.length}`);
    console.log(`   - Operadores en tabla 'operadores': ${operadores.length}`);
    console.log(`   - Solicitantes en tabla 'solicitantes': ${solicitantes.length}`);

  } catch (error) {
    console.error('. Error insertando usuarios en tablas:', error);
    throw error;
  }
};

// Función para crear usuarios en Auth - . .
const crearUsuariosAuth = async () => {
  const usuariosAuthIds = {};
  
  try {
    console.log('. Usando service_role key para crear usuarios en Auth...');

    const usuariosAuth = [
      {
        email: 'jomeregildo64@gmail.com',
        password: 'operador1234',
        email_confirm: true,
        user_metadata: {
          nombre_completo: 'Jostin Meregildo',
          dni: '0999999999',
          rol: 'operador'
        }
      },
      {
        email: 'joshuamerejildo846@gmail.com',
        password: 'cliente123',
        email_confirm: true,
        user_metadata: {
          nombre_completo: 'Javier Castillo',
          dni: '0977777777',
          rol: 'solicitante'
        }
      }
    ];

    for (const usuario of usuariosAuth) {
      console.log(`. Procesando usuario: ${usuario.email}`);
      
      try {
        // . .: Usar la función getUserByEmail correctamente
        const { data: existingUser, error: getUserError } = await getUserByEmail(usuario.email);
        
        let userId;
        
        if (getUserError || !existingUser || !existingUser.user) {
          // Si no existe, crearlo
          const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: usuario.email,
            password: usuario.password,
            email_confirm: usuario.email_confirm,
            user_metadata: usuario.user_metadata
          });

          if (createError) {
            console.error(`. Error creando usuario ${usuario.email}:`, createError.message);
            
            // Si es error de usuario existente, intentar obtenerlo de nuevo
            if (createError.code === 'email_exists' || createError.status === 422) {
              console.log(`. Usuario ya existe, obteniendo ID...`);
              const { data: retryUser } = await getUserByEmail(usuario.email);
              if (retryUser && retryUser.user) {
                userId = retryUser.user.id;
                console.log(`. Usuario existente obtenido: ${userId}`);
              }
            }
          } else {
            userId = data.user.id;
            console.log(`. Nuevo usuario creado: ${userId}`);
          }
        } else {
          // El usuario ya existe
          userId = existingUser.user.id;
          console.log(`. Usuario existente encontrado: ${userId}`);
        }

        // . ASIGNAR ID USANDO CLAVE CONSISTENTE
        if (userId) {
          // Usar el nombre del email sin dominio como clave
          const clave = usuario.email.split('@')[0];
          usuariosAuthIds[clave] = userId;
          console.log(`. Asignado: ${clave} -> ${userId}`);
        } else {
          console.error(`. No se pudo obtener ID para: ${usuario.email}`);
        }

      } catch (error) {
        console.error(`. Error procesando usuario ${usuario.email}:`, error.message);
      }
    }

    console.log('. Proceso de usuarios en Auth completado');
    console.log('. IDs obtenidos:', usuariosAuthIds);
    
    // . VERIFICAR QUE TODOS LOS IDs ESTÉN PRESENTES
    const emailsEsperados = ['jomeregildo64', 'joshuamerejildo846'];
    const faltantes = emailsEsperados.filter(email => !usuariosAuthIds[email]);
    
    if (faltantes.length > 0) {
      throw new Error(`Faltan IDs para: ${faltantes.join(', ')}`);
    }
    
    return usuariosAuthIds;

  } catch (error) {
    console.error('. Error en creación de usuarios Auth:', error.message);
    throw error;
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  datosIniciales()
    .then((success) => {
      if (success) {
        console.log('. Proceso de datos iniciales completado exitosamente');
      } else {
        console.log('.  Proceso de datos iniciales completado con advertencias');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('. Error crítico en datos iniciales:', error);
      process.exit(1);
    });
}

module.exports = datosIniciales;