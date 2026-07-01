import { Router } from 'express';
import { salesService } from '../services/salesService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { clientId, status } = req.query;
    res.json(await salesService.getAll({
      clientId: clientId ? Number(clientId) : undefined,
      status: status as any,
    }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await salesService.getById(Number(req.params.id));
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await salesService.create(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/confirm', async (req, res) => {
  try { res.json(await salesService.confirm(Number(req.params.id))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try { res.json(await salesService.update(Number(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await salesService.delete(Number(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/payments', async (req, res) => {
  try {
    res.status(201).json(await salesService.recordPayment({
      orderId: Number(req.params.id),
      ...req.body
    }));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
