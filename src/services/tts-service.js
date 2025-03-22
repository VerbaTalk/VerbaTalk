/**
 * Text-to-Speech Service
 * Handles communication with the TTS backend server
 */

// Default server URL
const DEFAULT_SERVER_URL = 'http://localhost:3000';

/**
 * Generate speech from text
 * @param {string} text - Text to convert to speech
 * @param {Object} options - TTS options
 * @param {string} options.serverUrl - URL of the TTS server
 * @param {string} options.model - TTS model to use
 * @param {string} options.voice - Voice to use
 * @param {number} options.speed - Speech rate
 * @returns {Promise<Object>} - Promise resolving to response with audioUrl
 */
export async function generateSpeech(text, options = {}) {
  const serverUrl = options.serverUrl || DEFAULT_SERVER_URL;
  
  try {
    const response = await fetch(`${serverUrl}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model: options.model || 'google',
        voice: options.voice || 'en-US-Standard-C',
        speed: options.speed || 1.0
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('TTS API Error:', error);
    throw error;
  }
}

/**
 * Get available voices for a specific model
 * @param {string} model - TTS model name
 * @param {string} serverUrl - Server URL
 * @returns {Promise<Array>} - Promise resolving to array of voices
 */
export async function getAvailableVoices(model, serverUrl = DEFAULT_SERVER_URL) {
  try {
    const response = await fetch(`${serverUrl}/voices?model=${model}`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
}

/**
 * Get health status of the TTS server
 * @param {string} serverUrl - Server URL
 * @returns {Promise<boolean>} - Promise resolving to server status
 */
export async function checkServerStatus(serverUrl = DEFAULT_SERVER_URL) {
  try {
    const response = await fetch(`${serverUrl}/health`, { 
      method: 'GET',
      // Set a timeout for the request
      signal: AbortSignal.timeout(3000) 
    });
    
    return response.ok;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
}

/**
 * Get supported TTS models
 * @param {string} serverUrl - Server URL
 * @returns {Promise<Array>} - Promise resolving to array of supported models
 */
export async function getSupportedModels(serverUrl = DEFAULT_SERVER_URL) {
  try {
    const response = await fetch(`${serverUrl}/models`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching models:', error);
    // Return default models if server is not available
    return [
      { id: 'google', name: 'Google Cloud TTS' },
      { id: 'openai', name: 'OpenAI TTS' },
      { id: 'elevenlabs', name: 'ElevenLabs TTS' },
      { id: 'amazon', name: 'Amazon Polly' }
    ];
  }
} 