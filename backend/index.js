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

// ==================== CONFIGURACIÓN SWAGGER (VERSIÓN VERCEL) ====================

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
        url: "https://equipo5-web-app-onboarding-creditos-backend-dbe5xecrk.vercel.app",
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
  apis: ["./routes/*.js", "./controladores/*.js"],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Ruta para el JSON de Swagger
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Ruta principal de Swagger UI usando CDN (SOLUCIÓN PARA VERCEL)
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
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Configurar CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    });

    const PORT = process.env.PORT || 3001;

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`\n. ¡Servidor ejecutándose correctamente!`);
      console.log(`. Puerto: ${PORT}`);
      console.log(`. URL: http://localhost:${PORT}`);
      console.log(`. Documentación API: http://localhost:${PORT}/api-docs`);
      console.log(`\n. Endpoints disponibles:`);
      console.log(`   Health:    GET  http://localhost:${PORT}/api/health`);
      console.log(`   Registro:  POST http://localhost:${PORT}/api/usuarios/registro`);
      console.log(`   Login:     POST http://localhost:${PORT}/api/usuarios/login`);
      console.log(`   Session:   GET  http://localhost:${PORT}/api/usuarios/session`);
      console.log(`   Perfil:    GET  http://localhost:${PORT}/api/usuario/perfil`);
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