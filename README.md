# WebSocket & TypeScript 学習プロジェクト

WebSocket と TypeScript の基礎を学ぶためのシンプルなチャットアプリケーションです。初学者でも理解しやすいように、コード内に詳細なコメントを記載しています。

## 📚 学習内容

### WebSocket について

- **リアルタイム双方向通信**: サーバーとクライアント間でリアルタイムにデータをやり取り
- **イベント駆動**: 接続、メッセージ受信、切断などのイベントに応じた処理
- **自動再接続**: 接続が切れた場合の自動再接続機能

### TypeScript について

- **型安全性**: 型定義による安全なコード
- **クラス設計**: オブジェクト指向プログラミングの実践
- **モジュールシステム**: import/export によるコード分割
- **コンパイル**: TypeScript から JavaScript への変換

## 🏗️ プロジェクト構造

```
typescript/
├── src/                    # TypeScriptソースコード
│   ├── server.ts          # WebSocketサーバー（Node.js）
│   └── client.ts          # WebSocketクライアント（ブラウザ）
├── public/                # 静的ファイル
│   └── index.html         # フロントエンドのHTML
├── dist/                  # コンパイル後のJavaScriptファイル（自動生成）
├── node_modules/          # 依存パッケージ（自動生成）
├── package.json           # プロジェクト設定と依存関係
├── tsconfig.json          # TypeScriptコンパイラ設定
└── .gitignore            # Gitで無視するファイル
```

## 🚀 セットアップと起動

### 1. 依存関係のインストール

```powershell
npm install
```

これにより以下がインストールされます:

- `ws`: Node.js 用の WebSocket ライブラリ
- `typescript`: TypeScript コンパイラ
- `@types/node`, `@types/ws`: 型定義ファイル

### 2. TypeScript のコンパイル

```powershell
npm run build
```

`src/`内の`.ts`ファイルが`dist/`に`.js`ファイルとして出力されます。

### 3. サーバーの起動

```powershell
npm start
```

サーバーが起動したら、ブラウザで以下の URL にアクセス:

```
http://localhost:8080
```

### 開発時の便利なコマンド

```powershell
# ファイル変更を監視して自動コンパイル
npm run build:watch

# コンパイルと起動を一度に実行
npm run dev

# ビルドファイルを削除
npm run clean
```

## 💡 コードの解説

### サーバー側 (`src/server.ts`)

```typescript
// 主要なクラス
class ChatServer {
  private server: http.Server; // HTTPサーバー
  private wss: WebSocketServer; // WebSocketサーバー
  private clients: Set<WebSocket>; // 接続中のクライアント管理
}
```

**主な機能:**

1. **HTTP サーバー**: 静的ファイル（HTML、JS）を配信
2. **WebSocket サーバー**: リアルタイム通信を処理
3. **クライアント管理**: 接続中のクライアントを Set で管理
4. **ブロードキャスト**: 全クライアントへメッセージを配信

**メッセージタイプ:**

- `chat`: チャットメッセージ
- `ping`: 接続確認リクエスト
- `pong`: 接続確認レスポンス
- `system`: システム通知

### クライアント側 (`src/client.ts`)

```typescript
// 主要なクラス
class ChatClient {
  private ws: WebSocket | null = null; // WebSocket接続
  private reconnectTimer: number | null; // 再接続タイマー
}
```

**主な機能:**

1. **WebSocket 接続**: ブラウザ標準の WebSocket API 使用
2. **イベント処理**: open、message、close、error イベントに対応
3. **自動再接続**: 切断時に 3 秒後に自動再接続
4. **UI 更新**: メッセージ表示と状態表示

**イベントフロー:**

```
接続 → open → メッセージ送受信 → close → 再接続
```

## 🎯 拡張のアイデア

このプロジェクトをベースに、以下のような拡張が可能です:

### 初級

- [ ] ユーザー名の設定機能
- [ ] メッセージの色分け（ユーザーごと）
- [ ] タイムスタンプの表示形式変更

### 中級

- [ ] プライベートメッセージ（DM）機能
- [ ] チャットルーム機能
- [ ] メッセージの保存（データベース連携）
- [ ] ファイル送信機能

### 上級

- [ ] ユーザー認証（ログイン機能）
- [ ] 暗号化通信（WSS）
- [ ] メッセージの編集・削除
- [ ] リアクション機能
- [ ] 既読・未読管理

## 📖 TypeScript の主要概念

### 1. 型定義

```typescript
// 変数の型を明示
private port: number;
private clients: Set<WebSocket>;

// 関数の引数と戻り値の型
private handleConnection(ws: WebSocket): void {
  // ...
}
```

### 2. アクセス修飾子

```typescript
public start(): void { }      // 外部から呼び出し可能
private connect(): void { }   // クラス内部でのみ使用
```

### 3. インターフェース（拡張例）

```typescript
interface Message {
  type: "chat" | "system" | "ping" | "pong";
  message?: string;
  timestamp?: string;
  clientCount?: number;
}
```

### 4. Null 安全性

```typescript
// null許容型の定義
private ws: WebSocket | null = null;

// null チェック
if (this.ws && this.ws.readyState === WebSocket.OPEN) {
  this.ws.send(data);
}
```

## 🔧 tsconfig.json の重要な設定

```json
{
  "target": "ES2020", // 出力するJavaScriptのバージョン
  "module": "commonjs", // Node.js用モジュール形式
  "strict": true, // 厳密な型チェック
  "esModuleInterop": true, // モジュール互換性
  "outDir": "./dist", // 出力先ディレクトリ
  "rootDir": "./src" // ソースディレクトリ
}
```

## 🐛 トラブルシューティング

### ポートが既に使用されている

```powershell
# 8080ポートを使用しているプロセスを確認
netstat -ano | findstr :8080

# プロセスを終了（タスクマネージャーでも可）
taskkill /PID <プロセスID> /F
```

### TypeScript コンパイルエラー

```powershell
# node_modulesを削除して再インストール
Remove-Item -Recurse -Force node_modules
npm install
```

### ブラウザで接続できない

1. サーバーが起動しているか確認
2. `http://localhost:8080`でアクセスしているか確認
3. ブラウザのコンソールでエラーメッセージを確認

## 📚 学習リソース

### WebSocket

- [MDN - WebSocket API](https://developer.mozilla.org/ja/docs/Web/API/WebSocket)
- [ws ライブラリ公式ドキュメント](https://github.com/websockets/ws)

### TypeScript

- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/docs/)
- [TypeScript ハンドブック（日本語）](https://typescript-jp.gitbook.io/deep-dive/)

## ⚖️ ライセンス

MIT License - 自由に学習・改変・配布できます

## 🤝 貢献

このプロジェクトは学習目的です。改善案やバグ報告は歓迎します！

---

**Happy Coding! 🎉**
