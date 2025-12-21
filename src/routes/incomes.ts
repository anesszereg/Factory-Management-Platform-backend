import { Router } from 'express';
import { incomeController } from '../controllers/incomeController';

const router = Router();

router.get('/', incomeController.getAll);
router.get('/summary', incomeController.getSummary);
router.get('/:id', incomeController.getById);
router.post('/', incomeController.create);
router.put('/:id', incomeController.update);
router.delete('/:id', incomeController.delete);

export default router;
