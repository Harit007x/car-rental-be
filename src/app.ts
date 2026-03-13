import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import { errorHandler } from './middlewares/errorMiddleware';
import routes from './routes';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

export default app;
