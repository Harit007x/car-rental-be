import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vehicle Rental Platform API",
      version: "1.0.0",
      description: "API documentation for the Vehicle Rental Platform",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development server",
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
  },
  apis: ["./src/routes/*.ts", "./src/routes/*.js"], // Support both for now
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
