const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const OpenAI = require('openai');
const AWS = require('aws-sdk');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use('/audio', express.static(audioDir));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Get available models
app.get('/models', (req, res) => {
  console.log('Models request received');
  const models = [
    { id: 'google', name: 'Google Cloud TTS', available: !!process.env.GOOGLE_APPLICATION_CREDENTIALS },
    { id: 'openai', name: 'OpenAI TTS', available: !!process.env.OPENAI_API_KEY },
    { id: 'elevenlabs', name: 'ElevenLabs TTS', available: !!process.env.ELEVENLABS_API_KEY },
    { id: 'amazon', name: 'Amazon Polly', available: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) }
  ];
  
  res.json(models);
});

// Get available voices for a model
app.get('/voices', (req, res) => {
  const model = req.query.model;
  console.log(`Voices request received for model: ${model}`);
  
  if (!model) {
    return res.status(400).json({ error: 'Model parameter is required' });
  }
  
  let voices = [];
  
  switch (model) {
    case 'google':
      voices = [
        { id: 'en-US-Standard-C', name: 'Female (Standard)' },
        { id: 'en-US-Standard-B', name: 'Male (Standard)' },
        { id: 'en-US-Wavenet-H', name: 'Female (Premium)' },
        { id: 'en-US-Wavenet-D', name: 'Male (Premium)' }
      ];
      break;
    case 'openai':
      voices = [
        { id: 'alloy', name: 'Alloy (中性)' },
        { id: 'echo', name: 'Echo (男声)' },
        { id: 'fable', name: 'Fable (男声)' },
        { id: 'onyx', name: 'Onyx (男声)' },
        { id: 'nova', name: 'Nova (女声)' },
        { id: 'shimmer', name: 'Shimmer (女声)' },
        { id: 'ash', name: 'Ash (男声)' },
        { id: 'sage', name: 'Sage (中性)' },
        { id: 'coral', name: 'Coral (女声)' },
        { id: 'ballad', name: 'Ballad (男声)' }
      ];
      break;
    case 'elevenlabs':
      voices = [
        { id: 'Adam', name: 'Adam' },
        { id: 'Antoni', name: 'Antoni' },
        { id: 'Bella', name: 'Bella' },
        { id: 'Domi', name: 'Domi' },
        { id: 'Elli', name: 'Elli' },
        { id: 'Josh', name: 'Josh' }
      ];
      break;
    case 'amazon':
      voices = [
        { id: 'Joanna', name: 'Joanna (Female)' },
        { id: 'Matthew', name: 'Matthew (Male)' },
        { id: 'Ivy', name: 'Ivy (Female Child)' },
        { id: 'Kendra', name: 'Kendra (Female)' },
        { id: 'Justin', name: 'Justin (Male Child)' }
      ];
      break;
    default:
      return res.status(400).json({ error: 'Unsupported model' });
  }
  
  res.json(voices);
});

// Get available TTS models for a provider
app.get('/tts-models', (req, res) => {
  const provider = req.query.provider;
  console.log(`TTS models request received for provider: ${provider}`);
  
  if (!provider) {
    return res.status(400).json({ error: 'Provider parameter is required' });
  }
  
  let models = [];
  
  switch (provider) {
    case 'openai':
      models = [
        { id: 'gpt-4o-mini-tts', name: 'GPT-4o mini TTS (最新模型 - 更智能)' },
        { id: 'tts-1', name: 'TTS-1 (较低延迟)' },
        { id: 'tts-1-hd', name: 'TTS-1-HD (高质量音频)' }
      ];
      break;
    default:
      return res.status(400).json({ error: 'Unsupported provider' });
  }
  
  res.json(models);
});

// Text to speech endpoint
app.post('/tts', async (req, res) => {
  const { text, model, voice, speed } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    let audioBuffer;
    let format = 'mp3';
    
    console.log(`TTS request: model=${model}, voice=${voice}, text length=${text.length}`);
    
    switch (model) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          return res.status(401).json({ 
            error: 'API key missing',
            message: 'OpenAI API key is required. Please set it in your server environment.' 
          });
        }
        
        const openaiModel = req.body.openaiTtsModel || 'gpt-4o-mini-tts';
        audioBuffer = await generateOpenAITTS(text, voice, speed, openaiModel);
        break;
        
      case 'google':
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          return res.status(401).json({ 
            error: 'API key missing',
            message: 'Google credentials are required. Please set GOOGLE_APPLICATION_CREDENTIALS in your server environment.' 
          });
        }
        
        audioBuffer = await generateGoogleTTS(text, voice, speed);
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported TTS model' });
    }
    
    // Ensure audio directory exists
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    // Save audio file
    const filename = `${uuidv4()}.${format}`;
    const filePath = path.join(audioDir, filename);
    
    console.log(`Saving audio file to: ${filePath} (size: ${audioBuffer.length} bytes)`);
    fs.writeFileSync(filePath, audioBuffer);
    
    // Verify file was created successfully
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to create audio file');
    }
    
    const fileSize = fs.statSync(filePath).size;
    console.log(`Audio file created successfully. Size: ${fileSize} bytes`);
    
    // Return audio URL
    const audioUrl = `/audio/${filename}`;
    console.log(`Generated audio URL: ${audioUrl}`);
    
    res.json({ 
      audioUrl,
      fileSize,
      format
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google TTS implementation
async function generateGoogleTTS(text, voice, speed) {
  try {
    // Check if credentials are available
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('Google credentials not configured');
    }
    
    // Create client
    const client = new TextToSpeechClient();
    
    // Build request
    const request = {
      input: { text },
      voice: {
        languageCode: voice.split('-')[0] + '-' + voice.split('-')[1],
        name: voice
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: parseFloat(speed)
      }
    };
    
    // Call Google TTS API
    const [response] = await client.synthesizeSpeech(request);
    
    return response.audioContent;
  } catch (error) {
    console.error('Google TTS Error:', error);
    throw new Error(`Google TTS Error: ${error.message}`);
  }
}

// OpenAI TTS implementation
async function generateOpenAITTS(text, voice, speed, customModel) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('OpenAI TTS: Using API key starting with:', process.env.OPENAI_API_KEY.substring(0, 7) + '...');
    
    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Validate voice parameter - must be one of the allowed values
    const validVoices = ['nova', 'shimmer', 'echo', 'onyx', 'fable', 'alloy', 'ash', 'sage', 'coral', 'ballad'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';
    
    if (voice && !validVoices.includes(voice)) {
      console.log(`OpenAI TTS: Invalid voice "${voice}" specified, using default "alloy" instead`);
    }
    
    // Validate model parameter
    const validModels = ['gpt-4o-mini-tts', 'tts-1', 'tts-1-hd'];
    const selectedModel = validModels.includes(customModel) ? customModel : 'gpt-4o-mini-tts';
    
    console.log('OpenAI TTS: Client created, calling speech API with params:', {
      model: selectedModel,
      voice: selectedVoice,
      textLength: text.length,
      speed: parseFloat(speed)
    });
    
    // Call OpenAI TTS API
    try {
      const mp3 = await openai.audio.speech.create({
        model: selectedModel,
        voice: selectedVoice,
        input: text,
        speed: parseFloat(speed)
      });
      
      console.log('OpenAI TTS: Response received successfully');
      
      // Get audio content as buffer
      const buffer = Buffer.from(await mp3.arrayBuffer());
      console.log('OpenAI TTS: Audio buffer created, size:', buffer.length);
      return buffer;
    } catch (apiError) {
      console.error('OpenAI API Error:', apiError.message);
      console.error('OpenAI API Error Details:', apiError.response?.data || 'No details available');
      throw new Error(`OpenAI API Error: ${apiError.message}`);
    }
  } catch (error) {
    console.error('OpenAI TTS Error:', error);
    console.error('OpenAI TTS Error Stack:', error.stack);
    throw new Error(`OpenAI TTS Error: ${error.message}`);
  }
}

// ElevenLabs TTS implementation
async function generateElevenLabsTTS(text, voice, speed) {
  try {
    // Check if API key is available
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }
    
    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice || 'Adam'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true,
            speed: parseFloat(speed)
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || `ElevenLabs API Error: ${response.status}`);
    }
    
    // Get audio content as buffer
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('ElevenLabs TTS Error:', error);
    throw new Error(`ElevenLabs TTS Error: ${error.message}`);
  }
}

// Amazon Polly TTS implementation
async function generateAmazonTTS(text, voice, speed) {
  try {
    // Check if AWS credentials are available
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured');
    }
    
    // Configure AWS
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    // Create Polly service
    const polly = new AWS.Polly();
    
    // Build parameters
    const params = {
      OutputFormat: 'mp3',
      Text: text,
      VoiceId: voice || 'Joanna',
      Engine: 'neural',
      TextType: 'text',
      SampleRate: '24000'
    };
    
    // Call Amazon Polly
    const data = await polly.synthesizeSpeech(params).promise();
    
    return data.AudioStream;
  } catch (error) {
    console.error('Amazon Polly TTS Error:', error);
    throw new Error(`Amazon Polly TTS Error: ${error.message}`);
  }
}

// Translation API endpoint
app.post('/translate', async (req, res) => {
  const { text, provider, model } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }
  
  console.log(`Translation request - Provider: ${provider}, Model: ${model}, Text length: ${text.length}`);
  
  try {
    // Detect language and set target language
    const detectedLanguage = detectLanguage(text);
    let targetLanguage = detectedLanguage === 'zh' ? 'en' : 'zh';
    
    // Process translation based on provider
    let translation;
    
    switch (provider) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          return res.status(401).json({ 
            error: 'API key missing',
            message: 'OpenAI API key is required. Please set it in your server environment.' 
          });
        }
        translation = await translateWithOpenAI(text, targetLanguage, model);
        break;
        
      case 'gemini':
        if (!process.env.GEMINI_API_KEY) {
          return res.status(401).json({ 
            error: 'API key missing',
            message: 'Gemini API key is required. Please set it in your server environment.' 
          });
        }
        translation = await translateWithGemini(text, targetLanguage, model);
        break;
        
      case 'zhipu':
        if (!process.env.ZHIPU_API_KEY) {
          return res.status(401).json({ 
            error: 'API key missing',
            message: 'Zhipu API key is required. Please set it in your server environment.' 
          });
        }
        translation = await translateWithZhipu(text, targetLanguage, model);
        break;
        
      case 'ollama':
        translation = await translateWithOllama(text, targetLanguage, model);
        break;
        
      default:
        if (!process.env.OPENAI_API_KEY) {
          return res.status(401).json({ 
            error: 'API key missing',
            message: 'OpenAI API key is required. Please set it in your server environment.' 
          });
        }
        translation = await translateWithOpenAI(text, targetLanguage, model);
    }
    
    res.json({
      translation,
      provider,
      model: model || 'default',
      source: detectedLanguage,
      target: targetLanguage
    });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: error.message });
  }
});

// OpenAI translation
async function translateWithOpenAI(text, targetLanguage, model = 'gpt-4o') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  const targetLangName = targetLanguage === 'zh' ? 'Chinese' : 'English';
  const prompt = `Translate the following text to ${targetLangName}. Only provide the translation, no explanations or additional text:\n\n${text}`;
  
  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are a professional translator that provides high-quality translations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: text.length * 2 + 50
  });
  
  return response.choices[0].message.content.trim();
}

// Gemini translation
async function translateWithGemini(text, targetLanguage, model = 'gemini-1.5-pro') {
  // Placeholder for Gemini API
  // Actual implementation would depend on the Gemini API structure
  throw new Error('Gemini translation not fully implemented yet');
}

// Zhipu translation
async function translateWithZhipu(text, targetLanguage, model = 'glm-4') {
  // Placeholder for Zhipu API
  // Actual implementation would depend on the Zhipu API structure
  throw new Error('Zhipu translation not implemented yet');
}

// Ollama translation
async function translateWithOllama(text, targetLanguage, model = 'llama3') {
  try {
    const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    
    const targetLangName = targetLanguage === 'zh' ? 'Chinese' : 'English';
    const response = await axios.post(`${ollamaEndpoint}/api/generate`, {
      model: model,
      prompt: `Translate the following text to ${targetLangName}. Only provide the translation, no explanations or additional text:\n\n${text}`,
      stream: false
    });
    
    return response.data.response.trim();
  } catch (error) {
    console.error('Ollama translation error:', error);
    throw new Error(`Ollama translation error: ${error.message}. Make sure Ollama is running at ${process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'}`);
  }
}

// Language detection function (simple version)
function detectLanguage(text) {
  // Simple language detection: check if text contains Chinese characters
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(text) ? 'zh' : 'en';
}

// Start server
app.listen(PORT, () => {
  console.log(`TTS Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 