import { Router } from 'express';
import { financialTransactionService } from '../services/financialTransactionService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { moneyBoxId, type, category, startDate, endDate } = req.query;
    res.json(await financialTransactionService.getAll({
      moneyBoxId: moneyBoxId ? Number(moneyBoxId) : undefined,
      type: type as any,
      category: category as any,
      startDate: startDate as string,
      endDate: endDate as string,
    }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/daily-summary', async (req, res) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    res.json(await financialTransactionService.getDailySummary(date));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/monthly-report', async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    res.json(await financialTransactionService.getMonthlyReport(year, month));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const tx = await financialTransactionService.getById(Number(req.params.id));
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json(tx);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await financialTransactionService.create(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try { res.json(await financialTransactionService.update(Number(req.params.id), req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await financialTransactionService.delete(Number(req.params.id)); res.status(204).send(); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
