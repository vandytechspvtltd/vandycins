import swaggerJSDoc from "swagger-jsdoc";
import { swaggerPaths } from "./swagger-paths.js";

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Vandycin Smart Doctor & Pharmacy API",
      version: "1.0.0",
      description:
        "Backend API documentation for Vandycin Smart Doctor & Pharmacy",
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },

        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },

    paths: swaggerPaths,
  },

  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);