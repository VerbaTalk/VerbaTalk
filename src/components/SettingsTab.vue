<template>
  <div class="settings-tab">
    <div class="setting-group">
      <label for="server-url">Server URL</label>
      <input 
        type="text" 
        id="server-url" 
        class="setting-input" 
        placeholder="e.g. http://localhost:3000"
        v-model="serverUrl"
        @input="updateServerUrl"
      >
    </div>
    
    <TtsModelSelector
      :model="ttsSettings.model"
      :voice="ttsSettings.voice"
      :openaiModel="ttsSettings.openaiModel"
      @update:model="updateTtsModel"
      @update:voice="updateTtsVoice"
      @update:openaiModel="updateTtsOpenaiModel"
      @model-change="handleTtsModelChange"
    />
    
    <TranslationProviderSelector
      :provider="translationSettings.provider"
      :models="translationSettings.models"
      :customModels="translationSettings.customModels"
      @provider-change="updateTranslationProvider"
      @model-change="handleTranslationModelChange"
    />
    
    <SpeedSelector
      :speed="ttsSettings.speed"
      @update:speed="updateSpeed"
    />
    
    <button id="save-settings" class="btn" @click="saveSettings">
      <span class="icon">💾</span> Save Settings
    </button>
  </div>
</template>

<script>
import TtsModelSelector from './TtsModelSelector.vue';
import TranslationProviderSelector from './TranslationProviderSelector.vue';
import SpeedSelector from './SpeedSelector.vue';

export default {
  name: 'SettingsTab',
  components: {
    TtsModelSelector,
    TranslationProviderSelector,
    SpeedSelector
  },
  data() {
    return {
      serverUrl: 'http://localhost:3000',
      ttsSettings: {
        model: 'openai',
        voice: 'alloy',
        speed: 1.0,
        openaiModel: 'gpt-4o-mini-tts'
      },
      translationSettings: {
        provider: 'openai',
        models: {
          openai: 'gpt-4o',
          gemini: 'gemini-2.0-pro',
          zhipu: 'glm-4',
          ollama: 'llama3.3'
        },
        customModels: {
          openai: '',
          gemini: '',
          zhipu: '',
          ollama: ''
        }
      }
    };
  },
  mounted() {
    // Load settings from storage
    this.loadSettings();
  },
  methods: {
    loadSettings() {
      chrome.storage.sync.get({
        serverUrl: 'http://localhost:3000',
        ttsModel: 'openai',
        voice: 'alloy',
        speed: 1,
        openaiTtsModel: 'gpt-4o-mini-tts',
        translationProvider: 'openai',
        translationModel: 'gpt-4o',
        openaiCustomModel: '',
        geminiCustomModel: '',
        zhipuCustomModel: '',
        ollamaCustomModel: ''
      }, (items) => {
        console.log('Loaded settings:', items);
        
        // Update server URL
        this.serverUrl = items.serverUrl;
        
        // Update TTS settings
        this.ttsSettings.model = items.ttsModel;
        this.ttsSettings.voice = items.voice;
        this.ttsSettings.speed = items.speed;
        this.ttsSettings.openaiModel = items.openaiTtsModel;
        
        // Update translation settings
        this.translationSettings.provider = items.translationProvider;
        
        // Determine if we have a custom model
        const isCustomOpenAI = items.translationModel === 'custom' || 
          !['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-vision-preview', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'].includes(items.translationModel);
          
        const isCustomGemini = items.translationModel === 'custom' || 
          !['gemini-2.0-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-ultra'].includes(items.translationModel);
          
        const isCustomZhipu = items.translationModel === 'custom' || 
          !['glm-4', 'glm-4v', 'glm-4-9b-chat', 'glm-4-9b-chat-1m', 'glm-3-turbo', 'chatglm-turbo'].includes(items.translationModel);
          
        const isCustomOllama = items.translationModel === 'custom' || 
          !['llama3.3', 'llama3.2', 'llama3.1', 'gemma3:1b', 'mixtral', 'gemma2'].includes(items.translationModel);
        
        // Set the model based on provider
        if (items.translationProvider === 'openai') {
          if (isCustomOpenAI) {
            this.translationSettings.models.openai = 'custom';
            this.translationSettings.customModels.openai = items.translationModel || items.openaiCustomModel;
          } else {
            this.translationSettings.models.openai = items.translationModel;
          }
        } else if (items.translationProvider === 'gemini') {
          if (isCustomGemini) {
            this.translationSettings.models.gemini = 'custom';
            this.translationSettings.customModels.gemini = items.translationModel || items.geminiCustomModel;
          } else {
            this.translationSettings.models.gemini = items.translationModel;
          }
        } else if (items.translationProvider === 'zhipu') {
          if (isCustomZhipu) {
            this.translationSettings.models.zhipu = 'custom';
            this.translationSettings.customModels.zhipu = items.translationModel || items.zhipuCustomModel;
          } else {
            this.translationSettings.models.zhipu = items.translationModel;
          }
        } else if (items.translationProvider === 'ollama') {
          if (isCustomOllama) {
            this.translationSettings.models.ollama = 'custom';
            this.translationSettings.customModels.ollama = items.translationModel || items.ollamaCustomModel;
          } else {
            this.translationSettings.models.ollama = items.translationModel;
          }
        }
        
        // Store custom model values
        this.translationSettings.customModels.openai = items.openaiCustomModel;
        this.translationSettings.customModels.gemini = items.geminiCustomModel;
        this.translationSettings.customModels.zhipu = items.zhipuCustomModel;
        this.translationSettings.customModels.ollama = items.ollamaCustomModel;
      });
    },
    
    updateServerUrl() {
      // This method is called when the server URL is changed
    },
    
    updateTtsModel(model) {
      this.ttsSettings.model = model;
    },
    
    updateTtsVoice(voice) {
      this.ttsSettings.voice = voice;
    },
    
    updateTtsOpenaiModel(model) {
      this.ttsSettings.openaiModel = model;
    },
    
    updateTranslationProvider(provider) {
      this.translationSettings.provider = provider;
    },
    
    handleTtsModelChange(settings) {
      this.ttsSettings.model = settings.model;
      this.ttsSettings.voice = settings.voice;
      this.ttsSettings.openaiModel = settings.openaiModel;
    },
    
    handleTranslationModelChange(settings) {
      // Update the current provider's model
      if (settings.model === 'custom') {
        this.translationSettings.models[settings.provider] = 'custom';
        this.translationSettings.customModels[settings.provider] = settings.customModel;
      } else {
        this.translationSettings.models[settings.provider] = settings.model;
      }
    },
    
    updateSpeed(speed) {
      this.ttsSettings.speed = speed;
    },
    
    saveSettings() {
      // Get the actual translation model based on provider
      const provider = this.translationSettings.provider;
      let translationModel = this.translationSettings.models[provider];
      let openaiCustomModel = this.translationSettings.customModels.openai;
      let geminiCustomModel = this.translationSettings.customModels.gemini;
      let zhipuCustomModel = this.translationSettings.customModels.zhipu;
      let ollamaCustomModel = this.translationSettings.customModels.ollama;
      
      // If using a custom model, use the custom model name
      if (translationModel === 'custom') {
        translationModel = this.translationSettings.customModels[provider];
      }
      
      // Save all settings to storage
      chrome.storage.sync.set({
        serverUrl: this.serverUrl,
        ttsModel: this.ttsSettings.model,
        voice: this.ttsSettings.voice,
        speed: this.ttsSettings.speed,
        openaiTtsModel: this.ttsSettings.openaiModel,
        translationProvider: this.translationSettings.provider,
        translationModel,
        openaiCustomModel,
        geminiCustomModel,
        zhipuCustomModel,
        ollamaCustomModel
      }, () => {
        console.log('Settings saved');
        
        // Update content script settings
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'updateSettings',
              settings: {
                serverUrl: this.serverUrl,
                ttsModel: this.ttsSettings.model,
                voice: this.ttsSettings.voice,
                speed: this.ttsSettings.speed,
                openaiTtsModel: this.ttsSettings.openaiModel,
                translationProvider: this.translationSettings.provider,
                translationModel
              }
            });
          }
        });
        
        // Show save confirmation
        this.showSaveConfirmation();
      });
    },
    
    showSaveConfirmation() {
      const existingMessage = document.querySelector('.save-confirmation');
      if (existingMessage) {
        existingMessage.remove();
      }
      
      const message = document.createElement('div');
      message.className = 'save-confirmation';
      message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transition: opacity 0.3s;
      `;
      message.textContent = 'Settings saved successfully';
      
      document.body.appendChild(message);
      
      setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
      }, 2000);
    }
  }
}
</script> 