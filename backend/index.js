require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerJsDoc = require("swagger-jsdoc");
const routes = require("./routes/routes");
const datosIniciales = require("./datos_iniciales");
const { verificarConexion } = require("./config/conexion");
const { configurarStorage } = require("./config/configStorage");
const { createCanvas, Canvas, Image, ImageData } = require('canvas');

// Configuración de Canvas para global
globalThis.Canvas = Canvas;
globalThis.Image = Image;
globalThis.ImageData = ImageData;
globalThis.createCanvas = createCanvas;

const app = express();

// ==================== CONFIGURACIÓN CORS CORREGIDA ====================

// Configurar CORS PRIMERO - antes de cualquier middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com',
  'https://equipo5-web-app-onboarding-creditos-rosy.vercel.app',
  'https://equipo5-web-app-onboarding-creditos-backend-evq7diu0r.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // También permitir cualquier subdominio de vercel.app
      if (origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Manejar preflight OPTIONS requests
app.options('*', cors());

// ==================== CONFIGURACIÓN SWAGGER CORREGIDA ====================

// Función para diagnóstico de archivos
const diagnosticarSwagger = () => {
  const fs = require('fs');
  console.log('\n🔍 DIAGNÓSTICO SWAGGER:');
  console.log('📁 Directorio actual:', __dirname);
  
  const rutasCriticas = [
    './routes/routes.js',
    './controladores/',
    './routes/'
  ];
  
  rutasCriticas.forEach(ruta => {
    const rutaCompleta = path.join(__dirname, ruta);
    try {
      const existe = fs.existsSync(rutaCompleta);
      console.log(`   ${ruta}: ${existe ? '✅ EXISTE' : '❌ NO EXISTE'}`);
      
      if (existe && fs.statSync(rutaCompleta).isDirectory()) {
        const archivos = fs.readdirSync(rutaCompleta);
        console.log(`     Archivos: ${archivos.slice(0, 5).join(', ')}${archivos.length > 5 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`   ${ruta}: ❌ ERROR - ${error.message}`);
    }
  });
};

// Ejecutar diagnóstico
diagnosticarSwagger();

// URL dinámica para Swagger - usa la URL actual del deployment
const getCurrentBackendUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === 'production') {
    // En producción, usa la URL conocida o déjala relativa
    return ''; // Relativo al mismo dominio
  }
  return `http://localhost:${process.env.PORT || 3001}`;
};

const backendUrl = getCurrentBackendUrl();
console.log('🌐 Backend URL detectada:', backendUrl);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Sistema de Créditos",
      version: "1.0.0",
      description: "API para el sistema de onboarding y gestión de créditos",
      contact: {
        name: "Equipo de Desarrollo",
        email: "castle2004josh2@gmail.com",
      },
    },
    servers: [
      {
        url: backendUrl || "https://equipo5-web-app-onboarding-creditos-backend-evq7diu0r.vercel.app",
        description: "Servidor de Producción",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // RUTAS CORREGIDAS
  apis: [
    path.join(__dirname, './routes/routes.js'),
    path.join(__dirname, './controladores/*.js')
  ],
};

console.log('\n🔄 Generando documentación Swagger...');
console.log('📄 Archivos a escanear:');
swaggerOptions.apis.forEach(api => console.log(`   - ${api}`));

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Log del resultado
console.log('\n📊 RESULTADO SWAGGER:');
console.log(`   - Total de paths encontrados: ${Object.keys(swaggerSpec.paths || {}).length}`);
console.log(`   - Tags: ${(swaggerSpec.tags || []).map(t => t.name).join(', ') || 'Ninguno'}`);

if (swaggerSpec.paths && Object.keys(swaggerSpec.paths).length > 0) {
  console.log('   - Paths encontrados:');
  Object.keys(swaggerSpec.paths).forEach(path => {
    console.log(`     ${path}`);
  });
} else {
  console.log('   ⚠️  NO SE ENCONTRARON PATHS - Revisa la documentación JSDoc en tus archivos');
}

// ==================== RUTAS SWAGGER ====================

// Ruta para el JSON de Swagger
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(swaggerSpec);
});

// Ruta de diagnóstico para verificar en producción
app.get('/api-docs/debug', (req, res) => {
  res.json({
    success: true,
    totalPaths: Object.keys(swaggerSpec.paths || {}).length,
    paths: Object.keys(swaggerSpec.paths || {}),
    config: {
      apis: swaggerOptions.apis,
      baseDir: __dirname
    },
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin
    },
    timestamp: new Date().toISOString()
  });
});

// Ruta principal de Swagger UI
app.get('/api-docs', (req, res) => {
  const totalPaths = Object.keys(swaggerSpec.paths || {}).length;
  
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>API Sistema de Créditos - Documentación</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-16x16.png" sizes="16x16" />
    <style>
      html {
        box-sizing: border-box;
        overflow: -moz-scrollbars-vertical;
        overflow-y: scroll;
      }
      *,
      *:before,
      *:after {
        box-sizing: inherit;
      }
      body {
        margin: 0;
        background: #fafafa;
      }
      .topbar { 
        display: none !important; 
      }
      .swagger-ui .info .title {
        color: #3b4151;
        font-family: sans-serif;
        font-size: 36px;
        margin: 0;
      }
      .swagger-ui .info hgroup.main a {
        display: none;
      }
      .diagnostic-banner {
        background: ${totalPaths > 0 ? '#e8f5e8' : '#ffeaa7'};
        border: 1px solid ${totalPaths > 0 ? '#4caf50' : '#fdcb6e'};
        border-radius: 4px;
        padding: 10px 15px;
        margin: 10px 0;
        font-family: monospace;
      }
    </style>
  </head>
  <body>
    ${totalPaths === 0 ? `
    <div class="diagnostic-banner">
      ⚠️ <strong>Diagnóstico:</strong> No se encontraron endpoints documentados. 
      <a href="/api-docs/debug" target="_blank">Ver detalles del problema</a>
    </div>
    ` : ''}
    
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        console.log('🚀 Inicializando Swagger UI...');
        console.log('Total de paths en spec:', ${totalPaths});
        
        // URL dinámica para el JSON de Swagger
        const swaggerJsonUrl = '/api-docs/swagger.json';
        
        const ui = SwaggerUIBundle({
          url: swaggerJsonUrl,
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          persistAuthorization: true,
          validatorUrl: null,
          displayRequestDuration: true,
          docExpansion: 'list',
          filter: true,
          showExtensions: true,
          tryItOutEnabled: true
        });
        
        window.ui = ui;
        
        // Verificar después de cargar
        setTimeout(() => {
          const operations = document.querySelectorAll('.opblock-tag-section');
          console.log('Operaciones cargadas:', operations.length);
          
          if (operations.length === 0) {
            console.warn('❌ No se cargaron operaciones. Posible problema con el spec.');
            fetch('/api-docs/debug')
              .then(r => r.json())
              .then(debug => {
                console.log('🔍 Debug info:', debug);
              });
          }
        }, 1000);
      }
    </script>
  </body>
  </html>
  `;
  res.send(html);
});

// ==================== CONFIGURACIÓN GENERAL ====================

// Headers de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware para parsear JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir archivos estáticos
app.use("/img", express.static(path.join(__dirname, "../frontend/public/img")));

// Ruta de health check básica
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor funcionando",
    database: "Supabase PostgreSQL",
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.headers.origin,
      allowed: allowedOrigins.includes(req.headers.origin) || req.headers.origin?.endsWith('.vercel.app')
    }
  });
});

// ==================== INICIO DEL SERVIDOR ====================

const iniciarServidor = async () => {
  try {
    console.log(". Iniciando servidor...");

    // Verificar conexión a Supabase
    console.log(". Verificando conexión a Supabase...");
    const conexionExitosa = await verificarConexion();

    if (!conexionExitosa) {
      throw new Error(
        "No se pudo conectar a Supabase. Verifica las credenciales."
      );
    }

    console.log(". Conectado a Supabase PostgreSQL");

    // Ejecutar datos iniciales
    console.log("📥 Cargando datos iniciales...");
    try {
      await datosIniciales();
    } catch (error) {
      console.log(". Error en datos iniciales:", error.message);
    }

    console.log(' Verificando configuración de Storage...');
    await configurarStorage();
    
    // Usar rutas API
    app.use("/api", routes);

    // Configuración para producción
    if (process.env.NODE_ENV === "production") {
      // Servir archivos estáticos del frontend
      app.use(express.static(path.join(__dirname, "../frontend/build")));

      // Ruta principal
      app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
      });

      // Rutas específicas para el frontend
      const frontendRoutes = [
        '/login', '/register', '/solicitante', '/operador', 
        '/confirmacion', '/confirmacion-exitosa', '/error'
      ];
      
      frontendRoutes.forEach(route => {
        app.get(route, (req, res) => {
          res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
        });
      });

      // Middleware final para capturar cualquier otra ruta que no sea API
      app.use((req, res, next) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({
            success: false,
            message: `Endpoint API no encontrado: ${req.path}`
          });
        }
        // Para cualquier otra ruta no-API, servir el frontend
        res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
      });

    } else {
      // En desarrollo
      app.use((req, res, next) => {
        if (req.path.startsWith("/api") && !req.path.startsWith("/api-docs")) {
          return res.status(404).json({
            success: false,
            message: `Endpoint API no encontrado: ${req.path}`
          });
        }
        next();
      });

      app.use((req, res) => {
        if (!req.path.startsWith("/api") && !req.path.startsWith("/api-docs")) {
          return res.status(404).json({
            success: false,
            message: "Ruta no encontrada. En desarrollo, el frontend debe ejecutarse en puerto 3000"
          });
        }
        res.status(404).json({
          success: false,
          message: `Endpoint no encontrado: ${req.path}`
        });
      });
    }

    // Manejo de errores global
    app.use((err, req, res, next) => {
      console.error('Error del servidor:', err);
      
      // Manejar errores de CORS
      if (err.message.includes('CORS')) {
        return res.status(403).json({
          success: false,
          message: 'Acceso bloqueado por CORS',
          origin: req.headers.origin,
          allowedOrigins: allowedOrigins
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    const PORT = process.env.PORT || 3001;

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`\n🎉 ¡Servidor ejecutándose correctamente!`);
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`🌐 URL Local: http://localhost:${PORT}`);
      console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Diagnóstico: http://localhost:${PORT}/api-docs/debug`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`\n✅ CORS Configurado para:`);
      allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
      console.log(`\n📊 Swagger encontró: ${Object.keys(swaggerSpec.paths || {}).length} endpoints`);
    });

    // Manejo elegante de cierre
    process.on("SIGTERM", () => {
      console.log("Recibido SIGTERM, cerrando servidor...");
      server.close(() => {
        console.log(". Servidor cerrado correctamente");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log(" Recibido SIGINT, cerrando servidor...");
      server.close(() => {
        console.log(". Servidor cerrado correctamente");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error(". Error crítico iniciando servidor:", error.message);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error(". Promise rechazada no manejada:", reason);
});

process.on("uncaughtException", (error) => {
  console.error(". Excepción no capturada:", error);
  process.exit(1);
});

// Iniciar servidor
iniciarServidor();