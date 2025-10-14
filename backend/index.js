require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const routes = require("./routes/routes");
const datosIniciales = require("./datos_iniciales");
const { verificarConexion } = require("./config/conexion");
const {configurarStorage}= require("./config/configStorage");
const { createCanvas, Canvas, Image, ImageData } = require('canvas');
globalThis.Canvas = Canvas;
globalThis.Image = Image;
globalThis.ImageData = ImageData;
globalThis.createCanvas = createCanvas;

const app = express();

// Configuración de Swagger
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
      servers: [
        {
          url: process.env.NODE_ENV === "production" 
            ? "https://equipo5-web-app-onboarding-creditos-backend.vercel.app/api"
            : `http://localhost:${process.env.PORT || 3001}/api`,
          description: process.env.NODE_ENV === "production" 
            ? "Servidor de Producción" 
            : "Servidor de Desarrollo",
        },
      ],
    },
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
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API Sistema de Créditos",
  swaggerOptions: {
    persistAuthorization: true,
  }
};
// Configurar Swagger UI con manejo mejorado de rutas
app.use(
  "/api-docs",
  swaggerUI.serve,
  (req, res, next) => {
    // Middleware para prevenir que Vercel sirva React en rutas de Swagger
    if (req.path.includes('.js') || req.path.includes('.css') || req.path.includes('.png')) {
      return res.status(404).json({ 
        success: false, 
        message: 'Recurso de Swagger no encontrado' 
      });
    }
    next();
  },
  swaggerUI.setup(swaggerSpec, swaggerUiOptions)
);
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

// Conectar a Supabase y ejecutar datos iniciales
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

    // Configuración para producción - SOLUCIÓN DEFINITIVA PARA EXPRESS 5
    if (process.env.NODE_ENV === "production") {
      // Servir archivos estáticos del frontend
      app.use(express.static(path.join(__dirname, "../frontend/build")));

      // Ruta principal
      app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
      });

      // SOLUCIÓN: Crear rutas específicas para las rutas conocidas del frontend
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
      // En desarrollo - SIN USAR PATRONES DE RUTA COMPLEJOS
      
      // Middleware para rutas API no encontradas
      app.use((req, res, next) => {
        if (req.path.startsWith("/api") && !req.path.startsWith("/api-docs")) {
          return res.status(404).json({
            success: false,
            message: `Endpoint API no encontrado: ${req.path}`
          });
        }
        next();
      });

      // Para rutas no API en desarrollo
      app.use((req, res) => {
        if (!req.path.startsWith("/api") && !req.path.startsWith("/api-docs")) {
          return res.status(404).json({
            success: false,
            message: "Ruta no encontrada. En desarrollo, el frontend debe ejecutarse en puerto 3000"
          });
        }
        // Si llega aquí, es una ruta API que debería haber sido manejada
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