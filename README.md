# VerbaTalk

![VerbaTalk Logo](https://github.com/VerbaTalk/VerbaTalk/blob/main/public/icons/icon128.png)

**Every Word Understood, Every Voice Heard**

VerbaTalk is a powerful Chrome extension that combines text-to-speech and translation capabilities to break language barriers. It allows you to select text on any webpage, listen to it in various voices, or translate it between languages instantly.

## Features

- **Text-to-Speech**: Convert selected text to natural-sounding speech using OpenAI's and other providers' TTS models
- **Translation**: Translate text between languages using various AI providers (OpenAI, Gemini, Zhipu, Ollama)
- **Model Selection**: Choose from different AI models for both TTS and translation, including the latest models like GPT-4o and Gemini 2.0
- **Voice Options**: Multiple voice options to personalize your listening experience
- **Speed Control**: Adjust speech speed to suit your preferences
- **History Management**: Save and manage your translation and TTS history
- **Floating UI**: Convenient floating buttons that appear when you select text on any webpage

## Installation

### User Installation

1. Download the latest release from the [Chrome Web Store](#) or [Releases](#) page
2. If using a local version:
   - Extract the downloaded ZIP file
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the extracted folder
3. The VerbaTalk icon should appear in your Chrome toolbar

### Developer Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/VerbaTalk.git
   ```
2. Install dependencies:
   ```bash
   cd VerbaTalk
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension into Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

## Server Setup

VerbaTalk requires a backend server to handle API requests. The server code is located in the `server` directory.

### Requirements

- Node.js (v14+)
- npm or yarn

### Setup Steps

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your API keys:
   ```
   PORT=3000
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ZHIPU_API_KEY=your_zhipu_api_key
   OLLAMA_ENDPOINT=http://localhost:11434
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server will start on port 3000 by default.

## API Documentation

The server provides two main endpoints:

### 1. Text-to-Speech Endpoint

**URL:** `/tts`

**Method:** `POST`

**Request Body:**
```json
{
  "text": "Text to convert to speech",
  "model": "openai",
  "voice": "alloy",
  "speed": 1.0,
  "openaiTtsModel": "tts-1"
}
```

**Parameters:**
- `text` (required): The text to convert to speech
- `model` (required): The TTS provider to use (currently supports `openai` and `google`)
- `voice`: The voice to use (depends on the model)
- `speed`: Speech rate (0.5 to 2.0)
- `openaiTtsModel`: Specific OpenAI model to use (when `model` is `openai`)

**Response:**
```json
{
  "audioUrl": "/audio/123e4567-e89b-12d3-a456-426614174000.mp3",
  "fileSize": 12345,
  "format": "mp3"
}
```

### 2. Translation Endpoint

**URL:** `/translate`

**Method:** `POST`

**Request Body:**
```json
{
  "text": "Text to translate",
  "provider": "openai",
  "model": "gpt-4o"
}
```

**Parameters:**
- `text` (required): The text to translate
- `provider`: The translation provider to use (`openai`, `gemini`, `zhipu`, or `ollama`)
- `model`: The specific model to use for translation

**Response:**
```json
{
  "translation": "Translated text",
  "provider": "openai",
  "model": "gpt-4o",
  "source": "en",
  "target": "zh"
}
```

### Language Support

The server automatically detects the source language and chooses the appropriate target language:
- If text contains Chinese characters, it will translate to English
- Otherwise, it will translate to Chinese

## Adding New Translation Providers

To add a new translation provider:

1. Create a new translation function in `server/index.js`:
   ```javascript
   async function translateWithNewProvider(text, targetLanguage, model) {
     // Implementation for the new provider
     // Return the translated text
   }
   ```

2. Add the provider to the switch statement in the `/translate` endpoint handler

3. Update the frontend UI in `src/components/TranslationProviderSelector.vue` to include the new provider option

4. Add the corresponding logic to handle the new provider selection

## Adding New TTS Providers

To add a new TTS provider:

1. Create a new TTS function in `server/index.js`:
   ```javascript
   async function generateNewProviderTTS(text, voice, speed) {
     // Implementation for the new provider
     // Return the audio buffer
   }
   ```

2. Add the provider to the switch statement in the `/tts` endpoint handler

3. Update the frontend UI in `src/components/TtsModelSelector.vue` to include the new provider option

4. Add the corresponding logic to handle the new provider selection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for their GPT and TTS models
- Google for their Gemini models
- Zhipu AI for their GLM models
- Ollama for their open source model hosting platform
- The amazing open-source community 