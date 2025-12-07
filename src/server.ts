import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { WebSocketServer, WebSocket } from "ws";

/**
 * WebSocketサーバーのクラス
 * クライアントの接続管理とメッセージの処理を行います
 */
class ChatServer {
  private server: http.Server;
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;

  constructor(private port: number) {
    // 接続中のクライアントを管理するSet
    this.clients = new Set();

    // HTTPサーバーを作成（静的ファイルの配信用）
    this.server = http.createServer(this.handleHttpRequest.bind(this));

    // WebSocketサーバーを作成（HTTPサーバーに紐付け）
    this.wss = new WebSocketServer({ server: this.server });

    // WebSocket接続時のイベントを設定
    this.wss.on("connection", this.handleConnection.bind(this));
  }

  /**
   * HTTPリクエストの処理（静的ファイルの配信）
   */
  private handleHttpRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    // URLのパスを取得
    let filePath = req.url === "/" ? "/index.html" : req.url || "/index.html";

    // ファイルの実際のパスを構築
    // /dist/で始まるパスはdistディレクトリから、それ以外はpublicディレクトリから配信
    const isDistFile = filePath.startsWith("/dist/");
    const baseDir = isDistFile
      ? __dirname
      : path.join(__dirname, "..", "public");
    const relativePath = isDistFile ? filePath.replace("/dist/", "") : filePath;
    const fullPath = path.join(baseDir, relativePath);

    // ファイルの拡張子からContent-Typeを決定
    const extname = path.extname(fullPath);
    const contentType = this.getContentType(extname);

    // ファイルを読み込んで返す
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        // ファイルが見つからない場合は404エラー
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }

      // ファイルを正常に返す
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  }

  /**
   * ファイル拡張子からContent-Typeを取得
   */
  private getContentType(extname: string): string {
    const contentTypes: { [key: string]: string } = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpg",
      ".gif": "image/gif",
    };

    return contentTypes[extname] || "text/plain";
  }

  /**
   * WebSocket接続時の処理
   */
  private handleConnection(ws: WebSocket): void {
    console.log("新しいクライアントが接続しました");

    // クライアントをSetに追加
    this.clients.add(ws);

    // 接続通知を全クライアントにブロードキャスト
    this.broadcast({
      type: "system",
      message: "ユーザーが参加しました",
      timestamp: new Date().toISOString(),
      clientCount: this.clients.size,
    });

    // メッセージ受信時の処理
    ws.on("message", (data: Buffer) => {
      this.handleMessage(ws, data);
    });

    // 接続終了時の処理
    ws.on("close", () => {
      this.handleDisconnection(ws);
    });

    // エラー発生時の処理
    ws.on("error", (error: Error) => {
      console.error("WebSocketエラー:", error);
    });
  }

  /**
   * メッセージ受信時の処理
   */
  private handleMessage(ws: WebSocket, data: Buffer): void {
    try {
      // 受信したデータをJSONとしてパース
      const message = JSON.parse(data.toString());
      console.log("受信:", message);

      // メッセージの種類に応じて処理を分岐
      switch (message.type) {
        case "chat":
          // チャットメッセージを全クライアントに送信
          this.broadcast({
            type: "chat",
            message: message.message,
            timestamp: new Date().toISOString(),
            clientCount: this.clients.size,
          });
          break;

        case "ping":
          // Pingに対してPongを返す（接続確認用）
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
            })
          );
          break;

        default:
          console.log("未知のメッセージタイプ:", message.type);
      }
    } catch (error) {
      console.error("メッセージの処理に失敗:", error);
    }
  }

  /**
   * クライアント切断時の処理
   */
  private handleDisconnection(ws: WebSocket): void {
    console.log("クライアントが切断しました");

    // クライアントをSetから削除
    this.clients.delete(ws);

    // 切断通知を全クライアントにブロードキャスト
    this.broadcast({
      type: "system",
      message: "ユーザーが退出しました",
      timestamp: new Date().toISOString(),
      clientCount: this.clients.size,
    });
  }

  /**
   * 全クライアントにメッセージをブロードキャスト
   */
  private broadcast(data: any): void {
    const message = JSON.stringify(data);

    // 接続中の全クライアントに送信
    this.clients.forEach((client) => {
      // クライアントが接続中（OPEN状態）の場合のみ送信
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * サーバーを起動
   */
  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`サーバーが起動しました: http://localhost:${this.port}`);
      console.log(`WebSocketサーバー: ws://localhost:${this.port}`);
    });
  }
}

// サーバーのインスタンスを作成して起動
const PORT = 8080;
const server = new ChatServer(PORT);
server.start();
