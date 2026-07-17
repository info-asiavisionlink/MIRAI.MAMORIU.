# MIRAI.MAMORU 未来守る

> iPhoneとAndroidをAI監視カメラに変えるアプリ

## 概要

MIRAI.MAMORUは、スマートフォンのカメラをAI搭載の見守りカメラに変えるアプリです。動体検知・AI映像解析・音声会話・プッシュ通知を組み合わせ、子育て・防犯・高齢者見守り・ペット見守りをサポートします。

## MVP 機能

| 機能 | 説明 |
|------|------|
| カメラ起動 | iPhone/Android の前面・背面カメラに対応 |
| リアルタイム映像表示 | フルスクリーンのライブビュー |
| 動体検知 | 2秒ごとのピクセル差分解析（感度調整可能） |
| 音声入力 | マイク録音 + テキスト入力 |
| AIとの音声会話 | Claude による会話 + expo-speech 音声出力 |
| 異常時のみAI解析 | 動体検知トリガー → Claude Vision 解析 |
| 通知機能 | ローカル通知（異常レベル別） |
| iPhone/Android 対応 | Expo React Native (managed workflow) |

## セットアップ

### 前提条件

- Node.js 20+
- npm 10+
- Expo Go アプリ (iOS/Android)
- Anthropic API キー

### 1. バックエンドを起動

```bash
cd backend
npm install

# .env を作成して API キーを設定
echo "ANTHROPIC_API_KEY=sk-ant-xxxx" > .env
echo "PORT=3001" >> .env

npm run dev
# → http://localhost:3001 で起動
```

### 2. モバイルアプリを起動

```bash
cd app
npm install

# .env を作成
echo "EXPO_PUBLIC_API_URL=http://localhost:3001" > .env
# ※ 実機テストの場合はPCのIPアドレスを指定
# echo "EXPO_PUBLIC_API_URL=http://192.168.1.x:3001" > .env

npm start
# → QRコードを Expo Go でスキャン
```

## アーキテクチャ

```
スマートフォン (Expo RN)
│
├── CameraView ← リアルタイム映像
├── useMotionDetection ← 2秒ごとフレーム取得
│   └── POST /api/analyze/motion → 動体検知
│       └── 検知時: POST /api/analyze/image → Claude Vision
│           └── 異常時: ローカル通知 + アラート表示
│
└── VoiceChat
    ├── expo-av (音声録音)
    ├── POST /api/chat → Claude 応答
    └── expo-speech (音声出力)

バックエンド (Express)
├── /api/analyze/motion ← sharp でピクセル差分
├── /api/analyze/image  ← Claude Vision 解析
├── /api/chat           ← Claude テキスト会話
└── /api/health         ← ヘルスチェック
```

## 危険度レベル

| レベル | 色 | 対応 |
|--------|-----|------|
| 低 | 緑 | 正常 - 通知なし |
| 中 | 黄 | 注意 - 通知送信 |
| 高 | 赤 | 警告 - 即時通知（最大音量） |

## 今後の拡張 (ロードマップ)

- [ ] 音声文字起こし (OpenAI Whisper 統合)
- [ ] クラウドストレージ (アラート映像の保存)
- [ ] 複数カメラ対応
- [ ] 家族間での共有通知
- [ ] 時間帯別監視スケジュール
- [ ] ネイティブビルド (EAS Build)

## ライセンス

MIT
