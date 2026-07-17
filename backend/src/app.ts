import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { analyzeRouter } from './routes/analyze';
import { chatRouter } from './routes/chat';

// ローカル開発: backend/.env を読む（Vercel では環境変数が直接注入される）
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (_, res) => {
  res.json({ name: 'MIRAI.MAMORU API', version: '1.0.0', status: 'running' });
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/analyze', analyzeRouter);
app.use('/api/chat', chatRouter);

export default app;
