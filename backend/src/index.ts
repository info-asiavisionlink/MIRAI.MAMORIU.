import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { analyzeRouter } from './routes/analyze';
import { chatRouter } from './routes/chat';

// __dirname = backend/src → ../ = backend/
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/analyze', analyzeRouter);
app.use('/api/chat', chatRouter);

app.listen(PORT, () => {
  console.log(`MIRAI.MAMORU backend running on port ${PORT}`);
});
