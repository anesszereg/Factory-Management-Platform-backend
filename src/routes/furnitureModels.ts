import { Router } from 'express';
import { furnitureModelController } from '../controllers/furnitureModelController';

const router = Router();

router.get('/', furnitureModelController.getAll);
router.get('/:id', furnitureModelController.getById);
router.post('/', furnitureModelController.create);
router.put('/:id', furnitureModelController.update);
router.delete('/:id', furnitureModelController.delete);

export default router;
