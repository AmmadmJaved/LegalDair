let ws: WebSocket | null = null;

export const connectWebSocket = () => {
  if (ws?.readyState === WebSocket.OPEN) return ws;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Handle real-time updates here
      console.log("WebSocket message:", data);
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
    // Attempt to reconnect after 3 seconds
    setTimeout(() => {
      connectWebSocket();
    }, 3000);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return ws;
};

export const sendWebSocketMessage = (message: any) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};
