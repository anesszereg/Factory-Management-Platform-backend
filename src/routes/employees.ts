import { Router } from 'express';
import { employeeController } from '../controllers/employeeController';

const router = Router();

router.get('/', employeeController.getAll);
router.get('/salary-summary', employeeController.getSalarySummary);
router.get('/:id', employeeController.getById);
router.get('/:id/salary-info', employeeController.getSalaryInfo);
router.post('/', employeeController.create);
router.put('/:id', employeeController.update);
router.delete('/:id', employeeController.delete);

export default router;
