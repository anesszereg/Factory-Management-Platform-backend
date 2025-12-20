import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import furnitureModelsRouter from './routes/furnitureModels';
import productionOrdersRouter from './routes/productionOrders';
import dailyProductionRouter from './routes/dailyProduction';
import rawMaterialsRouter from './routes/rawMaterials';
import materialPurchasesRouter from './routes/materialPurchases';
import materialConsumptionRouter from './routes/materialConsumption';
import dailyExpensesRouter from './routes/dailyExpenses';
import dashboardRouter from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Factory Management Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

app.use('/api/furniture-models', furnitureModelsRouter);
app.use('/api/production-orders', productionOrdersRouter);
app.use('/api/daily-production', dailyProductionRouter);
app.use('/api/raw-materials', rawMaterialsRouter);
app.use('/api/material-purchases', materialPurchasesRouter);
app.use('/api/material-consumption', materialConsumptionRouter);
app.use('/api/daily-expenses', dailyExpensesRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: '/api/*'
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error',
    message: NODE_ENV === 'production' ? 'Something went wrong' : err.message 
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API endpoints: http://localhost:${PORT}/api/*`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
