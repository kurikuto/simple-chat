/**
 * WebSocketクライアントのクラス
 * サーバーとの接続、メッセージの送受信を管理します
 */
class ChatClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectInterval: number = 3000; // 3秒

  // DOM要素の参照
  private messagesDiv: HTMLElement;
  private messageInput: HTMLInputElement;
  private sendButton: HTMLButtonElement;
  private statusIndicator: HTMLElement;
  private statusText: HTMLElement;
  private clearButton: HTMLButtonElement;
  private pingButton: HTMLButtonElement;

  constructor() {
    // DOM要素を取得
    this.messagesDiv = document.getElementById("messages")!;
    this.messageInput = document.getElementById(
      "messageInput"
    ) as HTMLInputElement;
    this.sendButton = document.getElementById(
      "sendButton"
    ) as HTMLButtonElement;
    this.statusIndicator = document.getElementById("statusIndicator")!;
    this.statusText = document.getElementById("statusText")!;
    this.clearButton = document.getElementById(
      "clearButton"
    ) as HTMLButtonElement;
    this.pingButton = document.getElementById(
      "pingButton"
    ) as HTMLButtonElement;

    // イベントリスナーを設定
    this.setupEventListeners();

    // サーバーに接続
    this.connect();
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    // 送信ボタンのクリックイベント
    this.sendButton.addEventListener("click", () => {
      this.sendMessage();
    });

    // Enterキーで送信
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });

    // クリアボタンのクリックイベント
    this.clearButton.addEventListener("click", () => {
      this.clearMessages();
    });

    // Pingボタンのクリックイベント
    this.pingButton.addEventListener("click", () => {
      this.sendPing();
    });
  }

  /**
   * WebSocketサーバーに接続
   */
  private connect(): void {
    // 既存の再接続タイマーをクリア
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      // WebSocketオブジェクトを作成（ブラウザ標準のWebSocket API）
      this.ws = new WebSocket("ws://localhost:8080");

      // 接続が開かれたときのイベント
      this.ws.addEventListener("open", () => {
        this.onOpen();
      });

      // メッセージを受信したときのイベント
      this.ws.addEventListener("message", (event) => {
        this.onMessage(event);
      });

      // 接続が閉じられたときのイベント
      this.ws.addEventListener("close", () => {
        this.onClose();
      });

      // エラーが発生したときのイベント
      this.ws.addEventListener("error", (error) => {
        this.onError(error);
      });
    } catch (error) {
      console.error("接続エラー:", error);
      this.updateStatus(false);
      this.scheduleReconnect();
    }
  }

  /**
   * 接続が開かれたときの処理
   */
  private onOpen(): void {
    console.log("サーバーに接続しました");
    this.updateStatus(true);

    // 入力欄とボタンを有効化
    this.messageInput.disabled = false;
    this.sendButton.disabled = false;

    // システムメッセージを表示
    this.addSystemMessage("サーバーに接続しました");
  }

  /**
   * メッセージを受信したときの処理
   */
  private onMessage(event: MessageEvent): void {
    try {
      // 受信したJSONをパース
      const data = JSON.parse(event.data);
      console.log("受信:", data);

      // メッセージタイプに応じて処理
      switch (data.type) {
        case "chat":
          // チャットメッセージを表示
          this.addChatMessage(data.message, data.timestamp, data.clientCount);
          break;

        case "system":
          // システムメッセージを表示
          this.addSystemMessage(data.message, data.clientCount);
          break;

        case "pong":
          // Pong応答を表示（接続確認の結果）
          this.addSystemMessage("接続テスト成功 (Pong受信)");
          break;

        default:
          console.log("未知のメッセージタイプ:", data.type);
      }
    } catch (error) {
      console.error("メッセージの解析に失敗:", error);
    }
  }

  /**
   * 接続が閉じられたときの処理
   */
  private onClose(): void {
    console.log("サーバーから切断されました");
    this.updateStatus(false);

    // 入力欄とボタンを無効化
    this.messageInput.disabled = true;
    this.sendButton.disabled = true;

    // システムメッセージを表示
    this.addSystemMessage(
      "サーバーから切断されました。再接続を試みています..."
    );

    // 再接続をスケジュール
    this.scheduleReconnect();
  }

  /**
   * エラーが発生したときの処理
   */
  private onError(error: Event): void {
    console.error("WebSocketエラー:", error);
  }

  /**
   * 再接続をスケジュール
   */
  private scheduleReconnect(): void {
    this.reconnectTimer = window.setTimeout(() => {
      console.log("再接続を試みています...");
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * メッセージを送信
   */
  private sendMessage(): void {
    const message = this.messageInput.value.trim();

    // 空のメッセージは送信しない
    if (!message) {
      return;
    }

    // WebSocketが接続されているか確認
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.addSystemMessage("エラー: サーバーに接続されていません");
      return;
    }

    // メッセージをJSONとして送信
    const data = {
      type: "chat",
      message: message,
    };

    this.ws.send(JSON.stringify(data));

    // 入力欄をクリア
    this.messageInput.value = "";
  }

  /**
   * Pingメッセージを送信（接続確認用）
   */
  private sendPing(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.addSystemMessage("エラー: サーバーに接続されていません");
      return;
    }

    const data = {
      type: "ping",
    };

    this.ws.send(JSON.stringify(data));
    this.addSystemMessage("接続テストを送信しました (Ping)");
  }

  /**
   * チャットメッセージをUIに追加
   */
  private addChatMessage(
    message: string,
    timestamp?: string,
    clientCount?: number
  ): void {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message chat";

    const messageText = document.createElement("div");
    messageText.textContent = message;
    messageDiv.appendChild(messageText);

    if (timestamp || clientCount) {
      const metaDiv = document.createElement("div");
      metaDiv.className = "timestamp";

      if (timestamp) {
        const time = new Date(timestamp).toLocaleTimeString("ja-JP");
        metaDiv.textContent = time;
      }

      if (clientCount) {
        const countSpan = document.createElement("span");
        countSpan.className = "client-count";
        countSpan.textContent = `${clientCount}人接続中`;
        metaDiv.appendChild(countSpan);
      }

      messageDiv.appendChild(metaDiv);
    }

    this.messagesDiv.appendChild(messageDiv);
    this.scrollToBottom();
  }

  /**
   * システムメッセージをUIに追加
   */
  private addSystemMessage(message: string, clientCount?: number): void {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message system";

    const messageText = document.createElement("div");
    messageText.textContent = message;
    messageDiv.appendChild(messageText);

    if (clientCount) {
      const metaDiv = document.createElement("div");
      metaDiv.className = "timestamp";

      const countSpan = document.createElement("span");
      countSpan.className = "client-count";
      countSpan.textContent = `${clientCount}人接続中`;
      metaDiv.appendChild(countSpan);

      messageDiv.appendChild(metaDiv);
    }

    this.messagesDiv.appendChild(messageDiv);
    this.scrollToBottom();
  }

  /**
   * メッセージエリアを最下部にスクロール
   */
  private scrollToBottom(): void {
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  /**
   * メッセージをクリア
   */
  private clearMessages(): void {
    this.messagesDiv.innerHTML = "";
  }

  /**
   * 接続状態の表示を更新
   */
  private updateStatus(connected: boolean): void {
    if (connected) {
      this.statusIndicator.classList.add("connected");
      this.statusText.textContent = "接続中";
    } else {
      this.statusIndicator.classList.remove("connected");
      this.statusText.textContent = "切断";
    }
  }
}

// ページ読み込み完了後にクライアントを起動
window.addEventListener("DOMContentLoaded", () => {
  new ChatClient();
});
