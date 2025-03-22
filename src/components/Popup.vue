<template>
  <div class="popup-container">
    <h2>AI Text to Speech</h2>
    
    <div v-if="activeTab === 'settings'" class="settings-section">
      <h3>Default Settings</h3>
      
      <div class="setting-item">
        <label for="model">Text-to-Speech Model</label>
        <select id="model" v-model="settings.defaultModel" @change="updateVoices">
          <option value="openai">OpenAI TTS</option>
          <option value="azure">Microsoft Azure TTS</option>
          <option value="baidu">Baidu TTS</option>
          <option value="xunfei">Xunfei TTS</option>
          <option value="aliyun">Aliyun TTS</option>
          <option value="google">Google TTS</option>
        </select>
      </div>
      
      <div class="setting-item">
        <label for="voice">Default Voice</label>
        <select id="voice" v-model="settings.defaultVoice">
          <option v-for="voice in availableVoices" :key="voice.id" :value="voice.id">
            {{ voice.name }}
          </option>
        </select>
      </div>
      
      <div class="setting-item">
        <label for="speed">Default Playback Speed</label>
        <select id="speed" v-model="settings.defaultSpeed">
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
      
      <div class="setting-item checkbox">
        <label>
          <input type="checkbox" v-model="settings.cacheAudio">
          Cache audio files for offline playback
        </label>
      </div>
    
      <!-- API Configuration Section -->
      <div class="settings-section">
        <h3>API Configuration</h3>
        <p class="api-note">Configure API keys for each service you want to use.</p>
        
        <div v-if="settings.defaultModel === 'openai'" class="api-config">
          <label for="openai-key">OpenAI API Key</label>
          <input type="password" id="openai-key" v-model="apiKeys.openai" placeholder="sk-...">
        </div>
        
        <div v-if="settings.defaultModel === 'azure'" class="api-config">
          <label for="azure-key">Azure API Key</label>
          <input type="password" id="azure-key" v-model="apiKeys.azure" placeholder="Enter Azure API key">
          <label for="azure-region">Azure Region</label>
          <input type="text" id="azure-region" v-model="apiConfig.azureRegion" placeholder="e.g., eastus">
        </div>
        
        <!-- Additional API config fields for other services -->
      </div>
      
      <div class="button-row">
        <button class="save-button" @click="saveSettings">Save Settings</button>
      </div>
    </div>
    
    <div v-if="activeTab === 'history'">
      <History @play-audio="handlePlayAudio" />
    </div>
    
    <div class="footer">
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          Settings
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          History
        </button>
      </div>
      <p>Need help? <a href="#" @click="openHelp">View documentation</a></p>
    </div>
  </div>
</template>

<script>
import { useAudioStore } from '../store';
import History from './History.vue';

export default {
  name: 'Popup',
  components: {
    History
  },
  
  data() {
    return {
      activeTab: 'settings',
      settings: {
        defaultModel: 'openai',
        defaultVoice: 'alloy',
        defaultSpeed: 1.0,
        cacheAudio: true
      },
      apiKeys: {
        openai: '',
        azure: '',
        baidu: '',
        xunfei: '',
        aliyun: '',
        google: ''
      },
      apiConfig: {
        azureRegion: 'eastus',
        baiduAppId: '',
        baiduApiKey: '',
        baiduSecretKey: ''
      },
      availableVoices: [],
      voicesByModel: {
        openai: [
          { id: 'alloy', name: 'Alloy' },
          { id: 'echo', name: 'Echo' },
          { id: 'fable', name: 'Fable' },
          { id: 'onyx', name: 'Onyx' },
          { id: 'nova', name: 'Nova' },
          { id: 'shimmer', name: 'Shimmer' }
        ],
        azure: [
          { id: 'en-US-JennyNeural', name: 'Jenny (US)' },
          { id: 'en-US-GuyNeural', name: 'Guy (US)' },
          { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)' }
        ],
        baidu: [
          { id: 'zh-F-0', name: '女声' },
          { id: 'zh-M-0', name: '男声' }
        ],
        xunfei: [
          { id: 'xiaoyan', name: '小燕' },
          { id: 'aisjiuxu', name: '许久' }
        ],
        aliyun: [
          { id: 'Xiaoyun', name: '小云' },
          { id: 'Sijia', name: '思佳' }
        ],
        google: [
          { id: 'en-US-Wavenet-A', name: 'Wavenet A (US)' },
          { id: 'en-US-Wavenet-B', name: 'Wavenet B (US)' }
        ]
      }
    };
  },
  
  setup() {
    const audioStore = useAudioStore();
    return { audioStore };
  },
  
  created() {
    this.loadSettings();
    this.updateVoices();
    this.audioStore.loadHistory();
  },
  
  methods: {
    loadSettings() {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response) {
          this.settings = { ...this.settings, ...response };
          
          // Load API keys from storage
          chrome.storage.sync.get(['apiKeys', 'apiConfig'], (data) => {
            if (data.apiKeys) {
              this.apiKeys = data.apiKeys;
            }
            if (data.apiConfig) {
              this.apiConfig = data.apiConfig;
            }
          });
        }
      });
    },
    
    updateVoices() {
      this.availableVoices = this.voicesByModel[this.settings.defaultModel] || [];
      
      // Check if the current voice is available in the new model
      const isCurrentVoiceAvailable = this.availableVoices.some(
        voice => voice.id === this.settings.defaultVoice
      );
      
      // If not, set the first available voice as default
      if (!isCurrentVoiceAvailable && this.availableVoices.length > 0) {
        this.settings.defaultVoice = this.availableVoices[0].id;
      }
    },
    
    saveSettings() {
      const settings = { ...this.settings };
      
      // Save main settings
      chrome.runtime.sendMessage({ 
        action: 'saveSettings', 
        settings 
      });
      
      // Save API keys and config separately
      chrome.storage.sync.set({
        apiKeys: this.apiKeys,
        apiConfig: this.apiConfig
      }, () => {
        alert('Settings saved successfully!');
      });
    },
    
    openHelp() {
      chrome.tabs.create({ url: 'https://github.com/yourusername/ai-text-to-speech/wiki' });
    },
    
    handlePlayAudio(audio) {
      // Send message to content script to play this audio
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'playAudio',
            audio
          });
        }
      });
      
      // Close popup after sending the play command
      window.close();
    }
  }
};
</script>

<style scoped>
.popup-container {
  max-width: 320px;
}

h2 {
  margin-top: 0;
  color: #4a8cff;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.settings-section {
  margin-bottom: 24px;
}

.setting-item {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
  font-size: 14px;
}

select, input[type="text"], input[type="password"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox label {
  display: flex;
  align-items: center;
  font-weight: normal;
}

.checkbox input {
  margin-right: 8px;
}

.button-row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.save-button {
  background-color: #4a8cff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.save-button:hover {
  background-color: #3a70d0;
}

.footer {
  margin-top: 16px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.footer a {
  color: #4a8cff;
  text-decoration: none;
}

.api-note {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.api-config {
  margin-bottom: 12px;
}

.tabs {
  display: flex;
  border-top: 1px solid #eee;
  margin-bottom: 8px;
  padding-top: 8px;
}

.tab-button {
  flex: 1;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button.active {
  color: #4a8cff;
  border-bottom-color: #4a8cff;
  font-weight: bold;
}
</style> 