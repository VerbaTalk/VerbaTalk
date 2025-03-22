# Development Guide for AI Text to Speech Extension

This document provides detailed instructions for developers working on the AI Text to Speech browser extension.

## Project Structure

```
ai-text-to-speech/
├── public/                  # Static assets
│   └── icons/               # Extension icons
├── server/                  # Backend API server
│   ├── index.js             # Server entry point
│   ├── package.json         # Server dependencies
│   └── .env.example         # Environment variables template
├── src/                     # Extension source code
│   ├── assets/              # Extension assets
│   ├── components/          # Vue components
│   │   ├── History.vue      # History component
│   │   └── Popup.vue        # Popup component
│   ├── services/            # Service modules
│   │   └── tts-service.js   # TTS API service
│   ├── store/               # State management
│   │   └── index.js         # Pinia store
│   ├── background.js        # Extension background script
│   ├── content-script.js    # Content script for text selection
│   ├── index.html           # Main HTML page
│   ├── popup.html           # Popup HTML
│   └── popup.js             # Popup entry point
├── build.js                 # Build helper script
├── package.json             # Project dependencies
├── vite.config.js           # Vite configuration
└── README.md                # Project documentation
```

## Development Setup

### 1. Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Chrome or Firefox browser
- ImageMagick (optional, for icon generation)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-text-to-speech.git
cd ai-text-to-speech

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configuration

Create a `.env` file in the server directory:

```bash
cd server
cp .env.example .env
# Edit .env with your API keys
cd ..
```

### 4. Development Workflow

#### Run in Development Mode

```bash
# Terminal 1: Start the extension dev server
npm run dev

# Terminal 2: Start the backend API server
cd server
npm run dev
```

#### Load the Extension in Browser

##### Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder

##### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select the `manifest.json` file in the `dist` folder

#### Building for Production

```bash
npm run build
```

## Testing

### Manual Testing

1. Start the backend server
2. Load the extension in your browser
3. Navigate to any webpage
4. Select text and click the floating button or use the context menu
5. Verify that the audio plays correctly
6. Check the extension popup for settings and history

### Automated Testing

Currently, the project doesn't have automated tests. Future development should consider adding:

- Unit tests for Vue components using Vitest
- Integration tests for the extension functionality
- API tests for the backend server

## Debugging

### Extension Debugging

1. **Content Script Issues**:
   - Open browser developer tools on the webpage where you're using the extension
   - Check the console for error messages
   - Use `console.log()` statements in content-script.js

2. **Background Script Issues**:
   - In Chrome, go to the extensions page, find your extension, and click "background page" to open its console
   - In Firefox, click "Inspect" on the extension in about:debugging

3. **Popup Issues**:
   - Right-click on the popup and select "Inspect" to open developer tools

### Server Debugging

1. Check the terminal where the server is running for error messages
2. Use tools like Postman to test API endpoints directly
3. Enable more verbose logging in server/index.js if needed

## Common Development Tasks

### Adding a New TTS Provider

1. Add the provider's configuration to server/.env.example
2. Create a new endpoint in server/index.js
3. Add the provider in src/services/tts-service.js
4. Update the voice options in src/components/Popup.vue
5. Update the model selection in src/content-script.js

### Customizing the UI

1. Edit the Vue components in src/components/
2. Update CSS styles in the <style> section of each component
3. Modify HTML templates in the <template> section

### Creating Custom Icons

1. Design icons in sizes 16x16, 48x48, and 128x128 pixels
2. Save them as icon16.png, icon48.png, and icon128.png in public/icons/

## Architecture Overview

### Frontend (Extension)

- **Vue.js**: UI components
- **Pinia**: State management
- **Content Script**: Text selection and audio playback
- **Background Script**: Context menu and settings management

### Backend (Server)

- **Express.js**: Server framework
- **Various TTS APIs**: Speech synthesis

### Data Flow

1. User selects text on a webpage
2. Content script captures the selection and shows the floating button
3. When activated, the text is sent to the backend server
4. Server calls the appropriate TTS API
5. Server saves the audio file and returns the URL
6. Extension plays the audio and adds it to history

## Contribution Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## Resources

- [Vue.js Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Chrome Extensions Development](https://developer.chrome.com/docs/extensions/)
- [Firefox Add-ons Development](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) 