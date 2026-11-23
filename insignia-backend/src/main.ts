import 'dotenv/config';
import { app } from './app.js';
import { adminService } from './services/admin.service.js';

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

// Only bootstrap server when running directly, not in test mode
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  bootstrap();
}

export { app };
