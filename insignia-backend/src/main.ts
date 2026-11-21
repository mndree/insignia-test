import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { walletRouter } from './routes/wallet.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { adminService } from './services/admin.service.js';
import { swaggerDocument } from './swagger.js';

const app = express();

// Increase payload limit for photo uploads
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Swagger Documentation Setup
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Redirect root '/' directly to Swagger UI
app.get('/', (_req: Request, res: Response) => {
  res.redirect('./docs');
});

// Mount Routes
app.use('/', walletRouter);
app.use('/admin', adminRouter);

// Alias /auth/login for direct login compatibility
app.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.login(req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const error = err.error || (
    statusCode === 400 ? 'Bad Request' :
    statusCode === 401 ? 'Unauthorized' :
    statusCode === 404 ? 'Not Found' :
    statusCode === 409 ? 'Conflict' :
    'Internal Server Error'
  );

  return res.status(statusCode).json({
    message,
    error,
    statusCode,
  });
});

const port = Number(process.env.PORT) || 3001;

async function bootstrap() {
  try {
    // Ensure default admin exists
    await adminService.ensureDefaultAdmin();

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Native Node.js Express server running on: http://localhost:${port}`);
      console.log(`📖 Swagger documentation available at: http://localhost:${port}/docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
