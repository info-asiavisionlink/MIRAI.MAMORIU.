import { Router, Request, Response } from 'express';
import { chat } from '../services/claude';

export const chatRouter = Router();

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body as {
      message?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await chat(message, history);
    return res.json({ response });
  } catch (err) {
    console.error('[chat]', err);
    return res.status(500).json({ error: 'Chat failed' });
  }
});
