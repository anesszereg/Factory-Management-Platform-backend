import { Router } from 'express';
import { moneyBoxService } from '../services/moneyBoxService';

const router = Router();

router.get('/', async (req, res) => {
  try { res.json(await moneyBoxService.getAll()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const box = await moneyBoxService.getById(Number(req.params.id));
    if (!box) return res.status(404).json({ error: 'Not found' });
    res.json(box);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await moneyBoxService.create(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try { res.json(await moneyBoxService.update(Number(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await moneyBoxService.delete(Number(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/transfer', async (req, res) => {
  try {
    const { fromId, toId, amount, description } = req.body;
    res.json(await moneyBoxService.transfer(fromId, toId, amount, description));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
