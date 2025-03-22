# AI Text to Speech Browser Extension

A browser extension that allows users to convert selected text to speech using various AI voice models.

## Features

- Select text on any webpage and convert it to speech
- Choose from multiple AI TTS providers:
  - Google Cloud TTS
  - OpenAI TTS
  - ElevenLabs TTS
  - Amazon Polly
- Customize voice settings
- View and replay speech history
- Context menu integration
- Floating button interface

## Installation

### Development Mode

1. Clone this repository
```bash
git clone https://github.com/yourusername/ai-text-to-speech.git
cd ai-text-to-speech
```

2. Install dependencies
```bash
npm install
```

3. Build the extension
```bash
npm run build
```

4. Load the extension in your browser
   - **Chrome**: Open `chrome://extensions/`, enable Developer mode, click "Load unpacked", and select the `dist` folder
   - **Firefox**: Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on...", and select the `manifest.json` file in the `dist` folder

### Server Setup

1. Navigate to the server directory
```bash
cd server
```

2. Install server dependencies
```bash
npm install
```

3. Create a `.env` file based on the example
```bash
cp .env.example .env
```

4. Edit the `.env` file with your API keys

5. Start the server
```bash
npm run dev
```

## Usage

1. Select text on any webpage
2. Click the floating button that appears near the selection, or use the context menu
3. The text will be converted to speech and played
4. Access additional options through the extension popup

## Development

For development information, see [DEVELOPMENT.md](DEVELOPMENT.md).

If you encounter issues, check [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## License

MIT 
Contributions are welcome! Please feel free to submit a Pull Request. 