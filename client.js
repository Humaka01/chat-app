const https = require("https");
const readline = require("readline");
const WebSocket = require("ws");

const BOOTSTRAP_URL = "https://chat-app-production-1ce9.up.railway.app/bootstrap";

// Colors
const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[97m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    red: "\x1b[31m",
};

const divider = C.magenta + "─".repeat(50) + C.reset;

function print(text) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    console.log(text);
}

/* prettier-ignore */
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
    console.log(divider);
    if (subtitle) console.log(C.gray + "  " + subtitle + C.reset);
    console.log(divider);
    console.log();
}

// Fetch bootstrap config from server
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

// Arrow-key server selection menu
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

// Ask for name with styled prompt
function askName() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(C.magenta + C.bold + "  Choose a username: " + C.reset + C.white, (name) => {
            rl.close();
            process.stdout.write(C.reset);
            resolve(name.trim());
        });
    });
}

// Main chat loop
function startChat(serverUrl, motd, name) {
    header(`Connected as ${name}`);
    console.log(C.green + "  ✔ " + motd + C.reset);
    console.log(C.gray + "  Type a message and press Enter.  /quit to leave.\n" + C.reset);
    console.log(divider);
    console.log();

    const ws = new WebSocket(serverUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    function prompt() {
        process.stdout.write(C.magenta + C.bold + `  [${name}]: ` + C.reset);
    }

    ws.on("open", () => {
        ws.send(name);
        prompt();

        rl.on("line", (input) => {
            if (input.trim() === "/quit") {
                print(C.gray + "  Disconnecting..." + C.reset);
                ws.close();
                rl.close();
                process.exit();
            }
            if (input.trim()) ws.send(input);
            prompt();
        });
    });

    ws.on("message", (data) => {
        const msg = data.toString();
        if (msg.startsWith("Welcome! Type your name:")) return;
        print(C.white + msg + C.reset);
        prompt();
    });

    ws.on("close", () => {
        print(C.red + "\n  Disconnected from server." + C.reset);
        rl.close();
        process.exit();
    });

    ws.on("error", (err) => {
        print(C.red + "  Connection error: " + err.message + C.reset);
        process.exit(1);
    });
}

// Entry point
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
