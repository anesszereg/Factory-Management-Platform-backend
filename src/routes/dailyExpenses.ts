import { Router } from 'express';
import { dailyExpenseController } from '../controllers/dailyExpenseController';

const router = Router();

router.get('/', dailyExpenseController.getAll);
router.get('/summary', dailyExpenseController.getSummary);
router.get('/:id', dailyExpenseController.getById);
router.post('/', dailyExpenseController.create);
router.put('/:id', dailyExpenseController.update);
router.delete('/:id', dailyExpenseController.delete);

export default router;
