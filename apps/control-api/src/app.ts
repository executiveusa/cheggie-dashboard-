import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { defaultRateLimiter } from './middleware/rateLimiter';
import { auditLogMiddleware } from './middleware/auditLog';
import routes from './routes/index';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? '*', credentials: true }));
  app.use(morgan('combined'));
  app.use(defaultRateLimiter);

  // Parse raw body for webhook HMAC signature verification
  app.use(
    express.json({
      verify: (req: Request & { rawBody?: string }, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  app.use(auditLogMiddleware);

  // OpenAPI / Swagger docs
  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Cheggie Control Plane API',
        version: '1.0.0',
        description: 'Multi-tenant AI agent control plane',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.ts'],
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/', routes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const isDev = process.env['NODE_ENV'] === 'development';
    console.error('[Error]', err.message);
    res.status(500).json({
      error: isDev ? err.message : 'Internal server error',
    });
  });

  return app;
}
