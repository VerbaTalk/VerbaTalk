# AI Text to Speech Extension Installation Guide

This guide will help you set up and install the AI Text to Speech extension for both development and production use.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A browser (Chrome or Firefox)

## Extension Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-text-to-speech.git
cd ai-text-to-speech
```

### 2. Install Dependencies

```bash
npm install
# or if you use yarn
yarn install
```

### 3. Build the Extension

For development build:
```bash
npm run dev
# or
yarn dev
```

For production build:
```bash
npm run build
# or
yarn build
```

### 4. Load the Extension in Your Browser

#### Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the `dist` folder from your project directory
4. The extension should now be installed and visible in your extensions list

#### Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to your project directory and select the `manifest.json` file in the `dist` folder
4. The extension should now be installed and visible in your add-ons list

## Backend Server Setup

The extension requires a backend server to proxy API requests to various text-to-speech services.

### 1. Navigate to the Server Directory

```bash
cd server
```

### 2. Install Server Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env` file in the server directory with your API keys:

```
PORT=3000
OPENAI_API_KEY=your_openai_api_key
AZURE_API_KEY=your_azure_api_key
AZURE_REGION=eastus
```

### 4. Start the Server

For development:
```bash
npm run dev
# or
yarn dev
```

For production:
```bash
npm start
# or
yarn start
```

The server will start on port 3000 by default (or the port specified in your .env file).

## Usage

1. After installing the extension, navigate to any webpage
2. Select text you want to convert to speech
3. Click the floating button that appears, or use the context menu (right-click and select "Convert to speech")
4. Configure your preferred TTS model and voice in the extension settings

## Troubleshooting

- If the floating button doesn't appear, try refreshing the page
- If audio doesn't play, check your API keys in the extension settings
- Make sure the backend server is running if you're using real TTS services
- Check browser console for any error messages

## Additional Configuration

For more advanced configuration options, see the [README.md](README.md) file. 