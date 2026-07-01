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

router.get('/status', async (req, res) => {
  try {
    const { stdout: pythonVersion } = await execAsync('python3 --version');
    const { stdout: pipList } = await execAsync('python3 -m pip list');
    const hasEasyOcr = pipList.toLowerCase().includes('easyocr');
    res.json({
      python: pythonVersion.trim(),
      easyocrInstalled: hasEasyOcr,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Python environment check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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
      timeout: 600000,
    });

    if (stderr) {
      console.error('OCR stderr:', stderr);
    }

    let result: { text?: string; error?: string };
    try {
      result = JSON.parse(stdout);
    } catch {
      res.status(500).json({
        error: 'OCR returned invalid JSON',
        stdout,
        stderr,
      });
      return;
    }

    if (result.error) {
      res.status(500).json({ error: result.error, stderr });
      return;
    }

    res.json({ text: result.text });
  } catch (error) {
    const execError = error as any;
    console.error('OCR processing failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stderr = execError?.stderr ? String(execError.stderr) : undefined;
    res.status(500).json({
      error: 'OCR processing failed',
      message,
      stderr,
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
