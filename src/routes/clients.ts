import { Router } from 'express';
import { clientService } from '../services/clientService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    res.json(await clientService.getAll({ status: status as any }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await clientService.getById(Number(req.params.id));
    if (!client) return res.status(404).json({ error: 'Not found' });
    res.json(client);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/ledger', async (req, res) => {
  try { res.json(await clientService.getLedger(Number(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await clientService.create(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try { res.json(await clientService.update(Number(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await clientService.delete(Number(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/payments', async (req, res) => {
  try {
    res.status(201).json(await clientService.recordPayment({
      clientId: Number(req.params.id),
      ...req.body
    }));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
