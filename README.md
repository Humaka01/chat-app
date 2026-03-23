# SecureChat

A terminal-based encrypted chat application built with Node.js and WebSockets.

![Version](https://img.shields.io/github/v/release/Humaka01/chat-app)
![License](https://img.shields.io/github/license/Humaka01/chat-app)

## Features

- 🔒 Encrypted transport via WSS (TLS)
- 🎨 Per-user color coding
- ⚡ Real-time messaging
- 🖥️ Terminal-based UI with timestamps
- 🔄 Auto-reconnect on connection loss
- 📋 Server selection menu

## Security Model

SecureChat uses **transport-level encryption**, not end-to-end encryption.

- All chat traffic is encrypted in transit using `wss://` (WebSocket over TLS)
- The bootstrap endpoint is accessed over HTTPS for secure server discovery

This means:

- Data is protected against network interception (e.g. MITM on public Wi-Fi)
- However, messages are **not end-to-end encrypted**
- The server can access and read message contents

If true end-to-end encryption is required, additional client-side encryption must be implemented.

## Getting Started

### Option 1: Download the .exe (Windows)

1. Go to [Releases](https://github.com/Humaka01/chat-app/releases)
2. Download `SecureChat.exe` from the latest release
3. Double-click to run

> **Note:** Windows may show a SmartScreen warning saying "Windows protected your PC". This is expected for unsigned open source apps. Click **"More info"** → **"Run anyway"** to proceed.

### Option 2: Run from source

**Requirements:** Node.js v18 or higher

```bash
# Clone the repository
git clone https://github.com/Humaka01/chat-app.git
cd chat-app

# Install dependencies
npm install

# Run the client
node client.js
```

## Usage

1. Launch the app
2. Select a server using the **↑ ↓** arrow keys and press **Enter**
3. Choose a username (letters, numbers, `_` and `-` only, 2–20 characters)
4. Start chatting
5. Type `/exit` to leave

## Running Your Own Server

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server reads `process.env.PORT` for the port, defaulting to `3000`. It exposes a `/bootstrap` endpoint that clients fetch on startup to get the server list and message of the day.

To point clients at your server, update `BOOTSTRAP_URL` in `client.js`.

## Project Structure

```text
chat-app/
  server.js        # WebSocket server + bootstrap endpoint
  client.js        # Terminal chat client
  package.json
  .github/
    workflows/
      release.yml  # Auto-builds SecureChat.exe on version tag
```

## Deploying to Railway

1. Fork this repo
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repo
4. Railway auto-deploys on every push to `main`

## Releasing a New Version

1. Update `"version"` in `package.json`
2. Commit and push to `main`
3. Create a version tag in VS Code: `Ctrl+Shift+P` → `Git: Create Tag` → e.g. `v1.2.0`
4. Push the tag: `Ctrl+Shift+P` → `Git: Push Tags`
5. GitHub Actions will automatically build and publish `SecureChat.exe` under Releases

## License

MIT
