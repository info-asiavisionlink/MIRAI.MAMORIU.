import { Router, Request, Response } from 'express';
import { analyzeImage } from '../services/claude';
import { detectMotion } from '../services/motionDetection';

export const analyzeRouter = Router();

analyzeRouter.post('/image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, context } = req.body as {
      imageBase64?: string;
      context?: string;
    };

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const result = await analyzeImage(imageBase64, context);
    return res.json(result);
  } catch (err) {
    console.error('[analyze/image]', err);
    return res.status(500).json({ error: 'Analysis failed' });
  }
});

analyzeRouter.post('/motion', async (req: Request, res: Response) => {
  try {
    const { previousFrame, currentFrame } = req.body as {
      previousFrame?: string;
      currentFrame?: string;
    };

    if (!previousFrame || !currentFrame) {
      return res.status(400).json({ error: 'previousFrame and currentFrame are required' });
    }

    const result = await detectMotion(previousFrame, currentFrame);
    return res.json(result);
  } catch (err) {
    console.error('[analyze/motion]', err);
    return res.status(500).json({ error: 'Motion detection failed' });
  }
});
