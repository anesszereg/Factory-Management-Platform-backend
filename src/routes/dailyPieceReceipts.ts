import { Router } from 'express';
import { dailyPieceReceiptController } from '../controllers/dailyPieceReceiptController';

const router = Router();

router.get('/', dailyPieceReceiptController.getAll);
router.get('/summary', dailyPieceReceiptController.getSummary);
router.get('/:id', dailyPieceReceiptController.getById);
router.post('/', dailyPieceReceiptController.create);
router.put('/:id', dailyPieceReceiptController.update);
router.post('/:id/payment', dailyPieceReceiptController.addPayment);
router.delete('/:id', dailyPieceReceiptController.delete);

export default router;
