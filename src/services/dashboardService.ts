import { dailyProductionService } from './dailyProductionService';
import { rawMaterialService } from './rawMaterialService';
import { dailyExpenseService } from './dailyExpenseService';

export const dashboardService = {
  async getStats(date?: Date) {
    const targetDate = date || new Date();

    const [
      productionByStep,
      finishedProducts,
      lowStockMaterials,
      dailyExpenseTotal,
      monthlyExpenseTotal
    ] = await Promise.all([
      dailyProductionService.getByStep(targetDate),
      dailyProductionService.getFinishedProducts(targetDate),
      rawMaterialService.getLowStock(),
      dailyExpenseService.getDailyTotal(targetDate),
      dailyExpenseService.getMonthlyTotal(targetDate)
    ]);

    const finishedProductsCount = finishedProducts.reduce(
      (sum, prod) => sum + prod.quantityCompleted, 
      0
    );

    return {
      date: targetDate,
      production: {
        byStep: productionByStep,
        finishedToday: finishedProductsCount,
        finishedProducts: finishedProducts
      },
      materials: {
        lowStockCount: lowStockMaterials.length,
        lowStockItems: lowStockMaterials
      },
      expenses: {
        today: dailyExpenseTotal,
        thisMonth: monthlyExpenseTotal
      }
    };
  }
};
