import { Router } from 'express';
import { dailyProductionController } from '../controllers/dailyProductionController';

const router = Router();

router.get('/', dailyProductionController.getAll);
router.get('/by-step', dailyProductionController.getByStep);
router.get('/finished', dailyProductionController.getFinishedProducts);
router.get('/:id', dailyProductionController.getById);
router.post('/', dailyProductionController.create);
router.put('/:id', dailyProductionController.update);
router.delete('/:id', dailyProductionController.delete);

export default router;
