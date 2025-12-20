import { Router } from 'express';
import { productionOrderController } from '../controllers/productionOrderController';

const router = Router();

router.get('/', productionOrderController.getAll);
router.get('/:id', productionOrderController.getById);
router.get('/:id/progress', productionOrderController.getProgress);
router.post('/', productionOrderController.create);
router.put('/:id', productionOrderController.update);
router.patch('/:id/status', productionOrderController.updateStatus);
router.delete('/:id', productionOrderController.delete);

export default router;
