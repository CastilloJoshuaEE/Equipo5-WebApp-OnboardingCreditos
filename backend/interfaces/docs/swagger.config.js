// docs/swagger.config.js
const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Nexia",
      version: "1.0.0",
      description: "API para el sistema de onboarding y gestión de créditos",
      contact: {
        name: "Equipo de Desarrollo",
        email: "castle2004josh2@gmail.com",
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production"
          ? "https://tu-dominio.com"
          : `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.NODE_ENV === "production"
          ? "Servidor de Producción"
          : "Servidor de Desarrollo",
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
    "./interfaces/routes/*.js",
    "./interfaces/controllers/*.js",
    "./interfaces/docs/swagger.schemas.js"
  ],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = swaggerSpec;