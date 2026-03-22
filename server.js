const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;

// Bootstrap config — edit this to update all clients
const bootstrap = {
    servers: [{ name: "Main Server", url: "wss://chat-app-production-1ce9.up.railway.app" }],
    motd: "Welcome to the chat!",
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
const clients = new Map();

wss.on("connection", (ws) => {
    ws.send("Welcome! Type your name: ");

    ws.on("message", (data) => {
        const msg = data.toString().trim();

        if (!clients.has(ws)) {
            clients.set(ws, msg);
            broadcast(`${msg} joined the chat!`, ws);
            return;
        }

        const name = clients.get(ws);
        broadcast(`${name}: ${msg}`, ws);
    });

    ws.on("close", () => {
        const name = clients.get(ws);
        clients.delete(ws);
        if (name) broadcast(`${name} left the chat.`, ws);
    });
});

function broadcast(message, sender) {
    console.log(message);
    clients.forEach((_, client) => {
        if (client !== sender && client.readyState === 1) {
            client.send(message);
        }
    });
}

server.listen(PORT, () => console.log(`Chat server running on port ${PORT}`));
