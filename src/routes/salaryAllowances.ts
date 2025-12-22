import { Router } from 'express';
import { salaryAllowanceController } from '../controllers/salaryAllowanceController';

const router = Router();

router.get('/', salaryAllowanceController.getAll);
router.get('/summary', salaryAllowanceController.getSummary);
router.get('/:id', salaryAllowanceController.getById);
router.post('/', salaryAllowanceController.create);
router.put('/:id', salaryAllowanceController.update);
router.delete('/:id', salaryAllowanceController.delete);

export default router;
