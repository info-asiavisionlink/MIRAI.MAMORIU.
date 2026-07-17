# MIRAI.MAMORU

iPhoneとAndroidをAI監視カメラに変えるアプリ。

## 構成

```
├── app/        Expo React Native モバイルアプリ
├── backend/    Node.js + Express API サーバー
├── ai/
│   └── prompts/  Claude へのシステムプロンプト
└── assets/     共有アセット
```

## セットアップ

### バックエンド
```bash
cd backend
cp ../.env.example .env   # ANTHROPIC_API_KEY を設定
npm install
npm run dev
```

### モバイルアプリ
```bash
cd app
cp ../.env.example .env
npm install
npm start   # Expo QRコードが表示される
```

## 主要ファイル

- `backend/src/services/claude.ts` — Claude API 統合（Vision解析・チャット）
- `backend/src/services/motionDetection.ts` — sharp によるピクセル差分動体検知
- `app/src/hooks/useMotionDetection.ts` — カメラフレーム取得と動体検知ループ
- `app/src/hooks/useVoiceInput.ts` — 音声録音と expo-speech TTS
- `app/src/screens/CameraScreen.tsx` — メイン監視画面
- `ai/prompts/surveillance.txt` — 監視解析プロンプト（危険度: 低/中/高）
- `ai/prompts/chat.txt` — AI会話プロンプト

## 技術スタック

- **フロントエンド**: Expo SDK 51 + React Native + TypeScript
- **バックエンド**: Node.js 20 + Express + TypeScript
- **AI**: Anthropic Claude Sonnet 4.6 (Vision + Chat)
- **動体検知**: サーバーサイド pixel diff (sharp ライブラリ)
- **音声出力**: expo-speech (日本語 TTS)
- **通知**: expo-notifications (ローカル + プッシュ)

## 動体検知フロー

1. 2秒ごとに 64x64 サムネイルを撮影
2. backend `/api/analyze/motion` でピクセル差分を計算
3. 変化率 > 4% (設定可能) で動体検知
4. 動体検知時に高解像度写真を撮影
5. `/api/analyze/image` で Claude Vision 解析
6. 異常検知時にプッシュ通知を送信

## 注意事項

- 実機テスト時は `EXPO_PUBLIC_API_URL` をPCのIPアドレスに変更する
- Anthropic API キーは `.env` に設定し Git にコミットしない
- 音声文字起こしはMVPでは未実装（テキスト入力でチャット可能）
