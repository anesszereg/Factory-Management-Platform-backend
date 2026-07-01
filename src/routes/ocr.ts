import { Router } from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image uploaded' });
    return;
  }

  const tempPath = path.join(process.cwd(), `tmp-ocr-${Date.now()}.png`);

  try {
    await fs.writeFile(tempPath, req.file.buffer);

    const scriptPath = path.join(process.cwd(), 'scripts', 'ocr.py');
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${tempPath}"`, {
      timeout: 120000,
    });

    if (stderr) {
      console.error('OCR stderr:', stderr);
    }

    const result = JSON.parse(stdout);
    if (result.error) {
      res.status(500).json({ error: result.error });
      return;
    }

    res.json({ text: result.text });
  } catch (error) {
    console.error('OCR processing failed:', error);
    res.status(500).json({
      error: 'OCR processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    try {
      await fs.unlink(tempPath);
    } catch {
      // ignore cleanup errors
    }
  }
});

export default router;
