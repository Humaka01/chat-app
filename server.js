const https = require("https");
const fs = require("fs");
const { WebSocketServer } = require("ws");

// TLS certificates (we'll generate these in the next step)
const server = https.createServer({
    cert: fs.readFileSync("cert.pem"),
    key: fs.readFileSync("key.pem"),
});

const wss = new WebSocketServer({ server });
const clients = new Map(); // socket -> name

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

server.listen(443, () => console.log("Secure chat server running on port 443"));
