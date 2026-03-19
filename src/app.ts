import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import { errorHandler } from './middlewares/errorMiddleware';
import { resolveTenantFromSubdomain } from "./middlewares/tenantResolutionMiddleware";
import routes from './routes';

const app: Express = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use(resolveTenantFromSubdomain);
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

export default app;
