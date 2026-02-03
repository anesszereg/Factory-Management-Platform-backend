import { Router } from 'express';
import { supplierController } from '../controllers/supplierController';

const router = Router();

// Suppliers
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.get('/:id/summary', supplierController.getSummary);
router.post('/', supplierController.create);
router.put('/:id', supplierController.update);
router.delete('/:id', supplierController.delete);

// Orders
router.get('/orders/all', supplierController.getAllOrders);
router.get('/orders/:id', supplierController.getOrderById);
router.post('/orders', supplierController.createOrder);
router.put('/orders/:id', supplierController.updateOrder);
router.delete('/orders/:id', supplierController.deleteOrder);

// Payments
router.post('/orders/:orderId/payments', supplierController.addPayment);
router.delete('/payments/:id', supplierController.deletePayment);

export default router;
