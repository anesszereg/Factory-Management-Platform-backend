import { Router } from 'express';
import { productionOrderWorkerController } from '../controllers/productionOrderWorkerController';

const router = Router();

router.get('/order/:orderId', productionOrderWorkerController.getByOrderId);
router.post('/', productionOrderWorkerController.create);
router.put('/:id', productionOrderWorkerController.update);
router.delete('/:id', productionOrderWorkerController.delete);

export default router;
