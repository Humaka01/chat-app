const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;

const bootstrap = {
    servers: [
        {
            name: "⚡ Main Server  —  securechat.railway.app",
            url: "wss://chat-app-production-1ce9.up.railway.app",
        },
    ],
    motd: "🔒 All connections are TLS encrypted.",
};

const server = http.createServer((req, res) => {
    if (req.url === "/bootstrap") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(bootstrap));
        return;
    }
    res.writeHead(404);
    res.end();
});

const wss = new WebSocketServer({ server });
const clients = new Map(); // ws -> name

function broadcastSystem(message) {
    const packet = JSON.stringify({ type: "system", text: message, online: clients.size });
    console.log(message);
    clients.forEach((_, client) => {
        if (client.readyState === 1) client.send(packet);
    });
}

function broadcastMessage(name, text) {
    const packet = JSON.stringify({ type: "message", name, text, online: clients.size });
    console.log(`${name}: ${text}`);
    clients.forEach((_, client) => {
        if (client.readyState === 1) client.send(packet);
    });
}

wss.on("connection", (ws) => {
    ws.on("message", (data) => {
        const msg = data.toString().trim();
        if (!msg) return;

        if (!clients.has(ws)) {
            clients.set(ws, msg);
            // send the new user their own name and online count
            ws.send(JSON.stringify({ type: "welcome", name: msg, online: clients.size }));
            broadcastSystem(`${msg} joined the chat.`);
            return;
        }

        const name = clients.get(ws);
        broadcastMessage(name, msg);
    });

    ws.on("close", () => {
        const name = clients.get(ws);
        clients.delete(ws);
        if (name) broadcastSystem(`${name} left the chat.`);
    });
});

server.listen(PORT, () => console.log(`SecureChat server running on port ${PORT}`));
