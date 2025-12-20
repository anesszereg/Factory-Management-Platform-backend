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

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/furniture-models', furnitureModelsRouter);
app.use('/api/production-orders', productionOrdersRouter);
app.use('/api/daily-production', dailyProductionRouter);
app.use('/api/raw-materials', rawMaterialsRouter);
app.use('/api/material-purchases', materialPurchasesRouter);
app.use('/api/material-consumption', materialConsumptionRouter);
app.use('/api/daily-expenses', dailyExpensesRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
