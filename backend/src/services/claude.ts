import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// Lazy initialization so dotenv is loaded before the client is created
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY が設定されていません');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

const PROMPTS_DIR = path.join(__dirname, '../../../ai/prompts');

function loadPrompt(name: string): string {
  const filePath = path.join(PROMPTS_DIR, `${name}.txt`);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
}

const surveillancePrompt = loadPrompt('surveillance');
const chatPrompt = loadPrompt('chat');

export type Severity = 'low' | 'medium' | 'high';

export interface AnalysisResult {
  anomalyDetected: boolean;
  severity: Severity;
  description: string;
  action: string;
}

export async function analyzeImage(
  base64Image: string,
  context?: string
): Promise<AnalysisResult> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: surveillancePrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
          },
          {
            type: 'text',
            text: context
              ? `この監視映像を分析してください。状況: ${context}`
              : 'この監視映像を分析してください。',
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  const severityMatch = text.match(/危険度[：:]\s*(低|中|高)/);
  const severityMap: Record<string, Severity> = { 低: 'low', 中: 'medium', 高: 'high' };
  const severity: Severity = severityMap[severityMatch?.[1] ?? '低'] ?? 'low';

  const anomalyDetected = severity !== 'low';

  const actionMatch = text.match(/推奨アクション[：:]\s*(.+)/);
  const action = actionMatch?.[1]?.trim() ?? (anomalyDetected ? '状況を確認してください' : '異常なし');

  return { anomalyDetected, severity, description: text, action };
}

export async function chat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: chatPrompt,
    messages,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
