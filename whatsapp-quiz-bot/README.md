# WhatsApp Quiz Bot

A WhatsApp bot that processes questions and provides intelligent answers using AI. The bot can detect different types of questions (general knowledge, math, true/false) and respond appropriately with a fallback mechanism.

## Features

- **Question Detection**: Identifies questions in incoming messages
- **Question Type Classification**: Categorizes questions as general knowledge, math, or true/false
- **AI-Powered Responses**: Uses Google Gemini to generate answers
- **Fallback System**: Responds with "Nx" when confidence is low or answer is unknown
- **Response Formatting**: Formats responses for optimal WhatsApp display
- **Interaction Logging**: Stores questions and answers in MongoDB for analytics

## Architecture

The bot follows a modular architecture:

```
+----------------+    +-------------------------+    +------------------+
| WhatsApp User  | -> | WhatsApp Bot Node.js   | -> | Message          |
+----------------+    | - Receives messages    |    | Preprocessor     |
                      | - Sends responses      |    | - Cleans text    |
                      +-------------------------+    | - Detects type   |
                                                   | - Extracts Q     |
                                                   +------------------+
                                                                    |
                                                                    v
+------------------+    +------------------+    +--------------------+
| Response         | <- | LLM Module       | <- | Response           |
| Formatter        |    | - Generates      |    | Formatter          |
| - Formats for    |    |   answers        |    | - Formats for      |
|   WhatsApp       |    | - Handles        |    |   WhatsApp         |
| - Adds emojis    |    |   fallback "Nx"  |    | - Adds emojis      |
+------------------+    +------------------+    +--------------------+
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGODB_URI=your_mongodb_connection_string_here
   ```


## Run on Replit (Chromium)

`whatsapp-web.js` needs a Chromium/Chrome executable. On Replit, set one of these env vars:

```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# or
CHROME_BIN=/usr/bin/chromium
```

If Chromium is installed at a different path, point the variable to that binary.
The bot now auto-detects common Chromium paths and logs the path used at startup.
The repo now includes `replit.nix`, `.replit`, and `start-replit.sh` so Replit can provision Chromium and start the bot with the right environment automatically.

## Usage

1. Start the bot:
   ```bash
   npm start
   ```
2. Scan the QR code with your WhatsApp to log in
3. Send questions to the bot via WhatsApp

## Question Types

The bot recognizes and handles different types of questions:

- **General Knowledge**: Questions about facts, history, science, etc.
- **Math**: Mathematical problems and calculations
- **True/False**: Yes/no or true/false type questions

## Fallback Mechanism

When the AI is uncertain about an answer, the bot responds with "Nx" to indicate it cannot provide a reliable answer.

## Technologies Used

- Node.js
- whatsapp-web.js
- Google Gemini API
- MongoDB
- dotenv for environment configuration

## Configuration

- `GEMINI_API_KEY`: Your Google Gemini API key for accessing Gemini models
- `MONGODB_URI`: Connection string for MongoDB database
- `PUPPETEER_EXECUTABLE_PATH` (optional): Explicit path to Chromium/Chrome binary (recommended on Replit)
- `CHROME_BIN` / `CHROMIUM_PATH` (optional): Alternate Chromium path variables

## License

ISC