import { Router } from 'express';
import { rawMaterialController } from '../controllers/rawMaterialController';

const router = Router();

router.get('/', rawMaterialController.getAll);
router.get('/low-stock', rawMaterialController.getLowStock);
router.get('/:id', rawMaterialController.getById);
router.post('/', rawMaterialController.create);
router.put('/:id', rawMaterialController.update);
router.delete('/:id', rawMaterialController.delete);

export default router;
