import { Router } from 'express';
import { warehouseService } from '../services/warehouseService';

const router = Router();

router.get('/', async (req, res) => {
  try { res.json(await warehouseService.getAll()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/inventory', async (req, res) => {
  try {
    const { warehouseId } = req.query;
    res.json(await warehouseService.getAllInventory(warehouseId ? Number(warehouseId) : undefined));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/inventory/:id', async (req, res) => {
  try {
    const item = await warehouseService.getInventoryById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const w = await warehouseService.getById(Number(req.params.id));
    if (!w) return res.status(404).json({ error: 'Not found' });
    res.json(w);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await warehouseService.create(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try { res.json(await warehouseService.update(Number(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await warehouseService.delete(Number(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/inventory', async (req, res) => {
  try { res.status(201).json(await warehouseService.addInventory(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/inventory/:id', async (req, res) => {
  try { res.json(await warehouseService.updateInventory(Number(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/inventory/recalculate-costs', async (req, res) => {
  try { res.json(await warehouseService.recalculateCostsFromProduction()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/inventory/:id/adjust', async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    res.json(await warehouseService.adjustInventory(Number(req.params.id), quantity, notes));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/inventory/transfer', async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
    await warehouseService.transfer(productId, fromWarehouseId, toWarehouseId, quantity, notes);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
