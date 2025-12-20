import { Router } from 'express';
import { materialPurchaseController } from '../controllers/materialPurchaseController';

const router = Router();

router.get('/', materialPurchaseController.getAll);
router.get('/:id', materialPurchaseController.getById);
router.post('/', materialPurchaseController.create);
router.put('/:id', materialPurchaseController.update);
router.delete('/:id', materialPurchaseController.delete);

export default router;
