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

// Obtener el dominio actual dinámicamente
const getCurrentDomain = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.VERCEL_ENV === 'production') {
    // En producción, usar el dominio principal
    return 'https://equipo5-web-app-onboarding-creditos-rosy.vercel.app';
  }
  return `http://localhost:${process.env.PORT || 3001}`;
};

const currentDomain = getCurrentDomain();
console.log('🌐 Dominio actual:', currentDomain);

// Configurar CORS - SOLUCIÓN DEFINITIVA
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com',
      'https://equipo5-web-app-onboarding-creditos-rosy.vercel.app',
      'https://equipo5-web-app-onboarding-creditos-backend-evq7diu0r.vercel.app',
      'https://equipo5-web-app-onboarding-creditos-backend-703b9gq7j.vercel.app',
      /\.vercel\.app$/,
      /\.onrender\.com$/
    ];

    // Verificar si el origin está permitido
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    })) {
      callback(null, true);
    } else {
      console.log('🚫 CORS bloqueado para origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Manejar preflight OPTIONS requests explícitamente
app.options('*', cors(corsOptions));

// ==================== CONFIGURACIÓN SWAGGER DINÁMICA ====================

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
        url: currentDomain,
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
  apis: [
    path.join(__dirname, './routes/routes.js'),
    path.join(__dirname, './controladores/*.js')
  ],
};

console.log('🔄 Generando documentación Swagger...');
console.log('📄 Servidor configurado:', currentDomain);

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Log del resultado
console.log('📊 Swagger - Paths encontrados:', Object.keys(swaggerSpec.paths || {}).length);

// Ruta para el JSON de Swagger
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Ruta de diagnóstico
app.get('/api-docs/debug', (req, res) => {
  res.json({
    success: true,
    domain: currentDomain,
    totalPaths: Object.keys(swaggerSpec.paths || {}).length,
    paths: Object.keys(swaggerSpec.paths || {}),
    cors: {
      enabled: true,
      currentOrigin: req.get('origin')
    }
  });
});

// Ruta principal de Swagger UI
app.get('/api-docs', (req, res) => {
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
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: '/api-docs/swagger.json',
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
          validatorUrl: null
        });
        window.ui = ui;
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
  // Headers CORS adicionales
  const origin = req.get('origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Headers de seguridad
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

// Ruta de health check mejorada
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor funcionando correctamente",
    domain: currentDomain,
    database: "Supabase PostgreSQL",
    cors: "Configurado correctamente",
    timestamp: new Date().toISOString(),
  });
});

// ==================== INICIO DEL SERVIDOR ====================

const iniciarServidor = async () => {
  try {
    console.log("🚀 Iniciando servidor...");
    console.log("🌐 Dominio:", currentDomain);

    // Verificar conexión a Supabase
    console.log("🔌 Verificando conexión a Supabase...");
    const conexionExitosa = await verificarConexion();

    if (!conexionExitosa) {
      throw new Error("No se pudo conectar a Supabase. Verifica las credenciales.");
    }

    console.log("✅ Conectado a Supabase PostgreSQL");

    // Ejecutar datos iniciales
    console.log("📥 Cargando datos iniciales...");
    try {
      await datosIniciales();
    } catch (error) {
      console.log("⚠️ Error en datos iniciales:", error.message);
    }

    console.log('🔧 Verificando configuración de Storage...');
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
      console.error('❌ Error del servidor:', err);
      
      // Manejar errores CORS
      if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado por política CORS',
          domain: currentDomain,
          origin: req.get('origin')
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
      console.log(`🌐 URL: ${currentDomain}`);
      console.log(`📚 Documentación: ${currentDomain}/api-docs`);
      console.log(`🔍 Diagnóstico: ${currentDomain}/api-docs/debug`);
      console.log(`❤️ Health Check: ${currentDomain}/api/health`);
      console.log(`\n🚀 Endpoints principales:`);
      console.log(`   Health:    GET  ${currentDomain}/api/health`);
      console.log(`   Registro:  POST ${currentDomain}/api/usuarios/registro`);
      console.log(`   Login:     POST ${currentDomain}/api/usuarios/login`);
    });

    // Manejo elegante de cierre
    process.on("SIGTERM", () => {
      console.log("📞 Recibido SIGTERM, cerrando servidor...");
      server.close(() => {
        console.log("✅ Servidor cerrado correctamente");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("📞 Recibido SIGINT, cerrando servidor...");
      server.close(() => {
        console.log("✅ Servidor cerrado correctamente");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("💥 Error crítico iniciando servidor:", error.message);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Promise rechazada no manejada:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("💥 Excepción no capturada:", error);
  process.exit(1);
});

// Iniciar servidor
iniciarServidor();