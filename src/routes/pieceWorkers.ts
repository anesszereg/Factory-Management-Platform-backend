import { Router } from 'express';
import { pieceWorkerController } from '../controllers/pieceWorkerController';

const router = Router();

router.get('/', pieceWorkerController.getAll);
router.get('/:id', pieceWorkerController.getById);
router.post('/', pieceWorkerController.create);
router.put('/:id', pieceWorkerController.update);
router.delete('/:id', pieceWorkerController.delete);

export default router;
