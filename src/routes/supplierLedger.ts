import { Router } from 'express';
import { supplierLedgerService } from '../services/supplierLedgerService';

const router = Router();

router.get('/:supplierId/ledger', async (req, res) => {
  try { res.json(await supplierLedgerService.getLedger(Number(req.params.supplierId))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:supplierId/summary', async (req, res) => {
  try { res.json(await supplierLedgerService.getSupplierSummary(Number(req.params.supplierId))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:supplierId/payments', async (req, res) => {
  try {
    res.status(201).json(await supplierLedgerService.recordPayment({
      supplierId: Number(req.params.supplierId),
      ...req.body
    }));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

export default router;
