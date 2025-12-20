import { Router } from 'express';
import { materialConsumptionController } from '../controllers/materialConsumptionController';

const router = Router();

router.get('/', materialConsumptionController.getAll);
router.get('/:id', materialConsumptionController.getById);
router.post('/', materialConsumptionController.create);
router.put('/:id', materialConsumptionController.update);
router.delete('/:id', materialConsumptionController.delete);

export default router;
