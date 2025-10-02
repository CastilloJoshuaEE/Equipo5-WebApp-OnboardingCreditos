require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors'); 
const bodyParser = require('body-parser');
const routes = require('./routes/routes');
const datosIniciales = require('./datos_iniciales');
const { verificarConexion } = require('./config/conexion');

const app = express();

// Configurar CORS 
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use('/img', express.static(path.join(__dirname, '../frontend/public/img')));
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Ruta de health check básica
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando',
    database: 'Supabase PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Conectar a Supabase y ejecutar datos iniciales
const iniciarServidor = async () => {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Verificar conexión a Supabase
    console.log('🔗 Verificando conexión a Supabase...');
    const conexionExitosa = await verificarConexion();
    
    if (!conexionExitosa) {
      throw new Error('No se pudo conectar a Supabase. Verifica las credenciales.');
    }

    console.log('. Conectado a Supabase PostgreSQL');

    // Ejecutar datos iniciales (manejar errores sin detener el servidor)
    console.log('📥 Cargando datos iniciales...');
    try {
      const datosInicialesExitosos = await datosIniciales();
      if (!datosInicialesExitosos) {
        console.log('.  Datos iniciales no se cargaron completamente, pero el servidor continuará');
      }
    } catch (error) {
      console.log('.  Error en datos iniciales, continuando sin ellos:', error.message);
    }

    // Usar rutas API
    app.use('/api', routes);

    // Ruta para servir la aplicación React (para producción)
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../frontend/build')));
      
      // Manejar todas las demás rutas devolviendo el index.html
      app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
      });
      
      // Para cualquier otra ruta que no sea /api, servir el frontend
      app.use((req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
      });
    } else {
      // En desarrollo, solo manejar rutas API
      app.use((req, res) => {
        if (req.path.startsWith('/api')) {
          res.status(404).json({ 
            error: 'Endpoint no encontrado',
            message: `La ruta ${req.path} no existe` 
          });
        } else {
          res.status(404).json({ 
            error: 'Ruta no encontrada',
            message: 'En desarrollo, el frontend debe ejecutarse por separado en puerto 3000' 
          });
        }
      });
    }

    const PORT = process.env.PORT || 3000;
    
    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`\n ¡Servidor ejecutándose correctamente!`);
      console.log(`Puerto: ${PORT}`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(`\n Endpoints disponibles:`);
      console.log(`   Health:    GET  http://localhost:${PORT}/api/health`);
      console.log(`   Registro:  POST http://localhost:${PORT}/api/usuarios/registro`);
      console.log(`   Login:     POST http://localhost:${PORT}/api/usuarios/login`);
      console.log(`   Session:   GET  http://localhost:${PORT}/api/usuarios/session`);
      console.log(`   Perfil:    GET  http://localhost:${PORT}/api/usuario/perfil`);
      console.log(`\n Usuarios creados:`);
      console.log(`   - jomeregildo64@gmail.com (operador) - contraseña: operador1234`);
      console.log(`   - joshuamerejildo846@gmail.com (solicitante) - contraseña: cliente123`);
    });

    // Manejo elegante de cierre
    process.on('SIGTERM', () => {
      console.log('Recibido SIGTERM, cerrando servidor...');
      server.close(() => {
        console.log('. Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log(' Recibido SIGINT, cerrando servidor...');
      server.close(() => {
        console.log('. Servidor cerrado correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('. Error crítico iniciando servidor:', error.message);
    
    console.log('\n🔧 Solución de problemas:');
    console.log('   1. Verifica que SUPABASE_URL y SUPABASE_ANON_KEY estén correctas');
    console.log('   2. Asegúrate de que el proyecto Supabase esté activo');
    console.log('   3. Verifica tu conexión a internet');
    console.log('   4. Revisa la consola de Supabase para posibles errores');
    
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('. Promise rechazada no manejada:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('. Excepción no capturada:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Iniciar servidor
iniciarServidor();
