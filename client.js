const https = require("https");
const readline = require("readline");
const WebSocket = require("ws");

const BOOTSTRAP_URL = "https://chat-app-production-1ce9.up.railway.app/bootstrap";

const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[97m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    red: "\x1b[31m",
};

const USER_COLORS = [
    "\x1b[38;5;81m", // sky blue
    "\x1b[38;5;214m", // orange
    "\x1b[38;5;120m", // light green
    "\x1b[38;5;213m", // pink
    "\x1b[38;5;123m", // aqua
    "\x1b[38;5;228m", // yellow
    "\x1b[38;5;171m", // purple
    "\x1b[38;5;203m", // coral
    "\x1b[38;5;51m", // bright cyan
    "\x1b[38;5;208m", // deep orange
    "\x1b[38;5;155m", // lime
    "\x1b[38;5;219m", // light pink
];

const colorMap = new Map();

function colorFor(name) {
    if (!colorMap.has(name)) {
        const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
        colorMap.set(name, color);
    }
    return colorMap.get(name);
}

function timestamp() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return C.gray + `[${h}:${m}]` + C.reset;
}

const DIVIDER = C.magenta + "─".repeat(50) + C.reset;

function print(text) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    console.log(text);
}

function prompt(name) {
    process.stdout.write(C.magenta + C.bold + `  [${name}]: ` + C.reset);
}

// prettier-ignore
function header(subtitle) {
    console.clear();
    console.log();
    console.log(C.bold + C.magenta + "  ███████╗███████╗ ██████╗██╗   ██╗██████╗ ███████╗    ██████╗██╗  ██╗ █████╗ ████████╗" + C.reset);
    console.log(C.bold + C.magenta + "  ██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██╔════╝   ██╔════╝██║  ██║██╔══██╗╚══██╔══╝" + C.reset);
    console.log(C.bold + C.magenta + "  ███████╗█████╗  ██║     ██║   ██║██████╔╝█████╗     ██║     ███████║███████║   ██║   " + C.reset);
    console.log(C.bold + C.magenta + "  ╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗██╔══╝     ██║     ██╔══██║██╔══██║   ██║   " + C.reset);
    console.log(C.bold + C.magenta + "  ███████║███████╗╚██████╗╚██████╔╝██║  ██║███████╗   ╚██████╗██║  ██║██║  ██║   ██║   " + C.reset);
    console.log(C.bold + C.magenta + "  ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝  " + C.reset);
    console.log();
    console.log(DIVIDER);
    if (subtitle) console.log(C.gray + "  " + subtitle + C.reset);
    console.log(DIVIDER);
    console.log();
}

function fetchBootstrap() {
    return new Promise((resolve, reject) => {
        https
            .get(BOOTSTRAP_URL, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => resolve(JSON.parse(data)));
            })
            .on("error", reject);
    });
}

function selectServer(servers) {
    return new Promise((resolve) => {
        let selected = 0;

        function render() {
            header("Select a server");
            console.log(C.gray + "  ↑ ↓ to move,  Enter to connect\n" + C.reset);
            servers.forEach((s, i) => {
                if (i === selected) {
                    console.log(C.magenta + C.bold + `  ▶  ${s.name}` + C.reset);
                } else {
                    console.log(C.gray + `     ${s.name}` + C.reset);
                }
            });
            console.log();
        }

        render();

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);

        process.stdin.on("keypress", function handler(_, key) {
            if (key.name === "up") selected = (selected - 1 + servers.length) % servers.length;
            if (key.name === "down") selected = (selected + 1) % servers.length;
            if (key.name === "return") {
                process.stdin.removeListener("keypress", handler);
                if (process.stdin.isTTY) process.stdin.setRawMode(false);
                resolve(servers[selected]);
            }
            if (key.ctrl && key.name === "c") process.exit();
            render();
        });
    });
}

function askName() {
    return new Promise((resolve) => {
        function ask() {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question(
                C.magenta + C.bold + "  Choose a username: " + C.reset + C.white,
                (name) => {
                    rl.close();
                    process.stdout.write(C.reset);
                    const cleaned = name.trim();

                    if (!cleaned) {
                        print(C.red + "  Username cannot be blank." + C.reset);
                        return ask();
                    }
                    if (cleaned.length < 2) {
                        print(C.red + "  Username must be at least 2 characters." + C.reset);
                        return ask();
                    }
                    if (cleaned.length > 20) {
                        print(C.red + "  Username must be 20 characters or less." + C.reset);
                        return ask();
                    }
                    if (!/^[a-zA-Z0-9_\-]+$/.test(cleaned)) {
                        print(C.red + "  Only letters, numbers, _ and - are allowed." + C.reset);
                        return ask();
                    }

                    resolve(cleaned);
                },
            );
        }
        ask();
    });
}

function startChat(serverUrl, motd, myName) {
    let onlineCount = 1;
    let reconnectAttempts = 0;
    let hasConnectedBefore = false;
    const MAX_RECONNECT_DELAY = 30000; // cap at 30 seconds

    function drawChatHeader() {
        header(`Connected as ${myName}  •  ${onlineCount} online`);
        console.log(C.green + "  ✔  " + motd + C.reset);
        console.log(C.gray + "  Type a message and press Enter.  /exit to leave.\n" + C.reset);
        console.log(DIVIDER);
        console.log();
    }

    function connect() {
        const ws = new WebSocket(serverUrl);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        ws.on("open", () => {
            reconnectAttempts = 0; // reset on successful connection
            if (!hasConnectedBefore) {
                drawChatHeader();
                hasConnectedBefore = true;
            } else {
                print(C.green + "  ✔  Reconnected." + C.reset);
            }
            ws.send(myName);
            prompt(myName);

            rl.on("line", (input) => {
                const text = input.trim();
                process.stdout.moveCursor(0, -1);
                process.stdout.clearLine(0);
                if (text === "/exit") {
                    print(C.gray + "  Disconnecting..." + C.reset);
                    ws.close();
                    rl.close();
                    process.exit();
                }
                if (text) ws.send(text);
                prompt(myName);
            });
        });

        ws.on("message", (raw) => {
            let packet;
            try {
                packet = JSON.parse(raw);
            } catch {
                return;
            }

            if (packet.online !== undefined) onlineCount = packet.online;
            if (packet.type === "welcome") return;

            if (packet.type === "system") {
                print(
                    `${timestamp()}  ${C.cyan}◈ ${packet.text}${C.reset}  ${C.gray}(${onlineCount} online)${C.reset}`,
                );
                prompt(myName);
                return;
            }

            if (packet.type === "message") {
                const color = colorFor(packet.name);
                const nameTag = C.bold + color + packet.name + C.reset;
                print(
                    `${timestamp()}  ${nameTag}${C.gray}:${C.reset} ${C.white + packet.text + C.reset}`,
                );
                prompt(myName);
                return;
            }
        });

        ws.on("close", () => {
            rl.close();
            reconnectAttempts++;
            const delay = Math.min(1000 * reconnectAttempts, MAX_RECONNECT_DELAY);
            print(
                C.red +
                    `\n  Connection lost. Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttempts})` +
                    C.reset,
            );
            setTimeout(connect, delay);
        });

        ws.on("error", (err) => {
            rl.close();
            // error event always fires before close, so just log it
            print(C.red + `  Connection error: ${err.message}` + C.reset);
        });
    }

    connect();
}

(async () => {
    header("Connecting...");
    console.log(C.gray + "  Fetching server list...\n" + C.reset);

    let config;
    try {
        config = await fetchBootstrap();
    } catch (err) {
        console.error(C.red + "  Could not reach bootstrap server: " + err.message + C.reset);
        process.exit(1);
    }

    const server = await selectServer(config.servers);
    header(server.url);
    const name = await askName();
    startChat(server.url, config.motd, name);
})();
