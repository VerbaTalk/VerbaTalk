<template>
  <div class="tts-model-container">
    <div class="setting-group">
      <label for="tts-model">TTS Engine</label>
      <select 
        id="tts-model" 
        class="setting-input"
        v-model="selectedModel"
        @change="handleModelChange"
      >
        <option value="openai">OpenAI TTS</option>
        <option value="google">Google TTS</option>
        <option value="elevenlabs">ElevenLabs</option>
        <option value="amazon">Amazon Polly</option>
      </select>
    </div>
    
    <!-- OpenAI specific settings -->
    <div v-if="selectedModel === 'openai'" class="setting-group">
      <label for="openai-tts-model">OpenAI TTS Model</label>
      <select 
        id="openai-tts-model" 
        class="setting-input"
        v-model="openaiTtsModel"
        @change="handleOpenaiModelChange"
      >
        <option value="gpt-4o-mini-tts">GPT-4o mini TTS</option>
        <option value="tts-1">TTS-1</option>
        <option value="tts-1-hd">TTS-1-HD</option>
      </select>
    </div>
    
    <!-- Voice selection -->
    <div class="setting-group">
      <label for="voice">Voice</label>
      <select 
        id="voice" 
        class="setting-input"
        v-model="selectedVoice"
        @change="handleVoiceChange"
      >
        <option 
          v-for="voice in availableVoices" 
          :key="voice.id" 
          :value="voice.id"
        >
          {{ voice.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TtsModelSelector',
  props: {
    model: {
      type: String,
      default: 'openai'
    },
    voice: {
      type: String,
      default: 'alloy'
    },
    openaiModel: {
      type: String,
      default: 'gpt-4o-mini-tts'
    }
  },
  data() {
    return {
      selectedModel: this.model,
      selectedVoice: this.voice,
      openaiTtsModel: this.openaiModel,
      voicesByModel: {
        openai: [
          { id: 'alloy', name: 'Alloy' },
          { id: 'echo', name: 'Echo' },
          { id: 'fable', name: 'Fable' },
          { id: 'onyx', name: 'Onyx' },
          { id: 'nova', name: 'Nova' },
          { id: 'shimmer', name: 'Shimmer' },
          { id: 'ballad', name: 'Ballad' }
        ],
        google: [
          { id: 'en-US-Standard-C', name: 'Female (Standard)' },
          { id: 'en-US-Standard-B', name: 'Male (Standard)' },
          { id: 'en-US-Wavenet-H', name: 'Female (Premium)' },
          { id: 'en-US-Wavenet-D', name: 'Male (Premium)' }
        ],
        elevenlabs: [
          { id: 'Adam', name: 'Adam' },
          { id: 'Antoni', name: 'Antoni' },
          { id: 'Bella', name: 'Bella' },
          { id: 'Domi', name: 'Domi' },
          { id: 'Elli', name: 'Elli' },
          { id: 'Josh', name: 'Josh' }
        ],
        amazon: [
          { id: 'Joanna', name: 'Joanna (Female)' },
          { id: 'Matthew', name: 'Matthew (Male)' },
          { id: 'Ivy', name: 'Ivy (Female Child)' }
        ]
      }
    };
  },
  computed: {
    availableVoices() {
      return this.voicesByModel[this.selectedModel] || [];
    }
  },
  watch: {
    model(newValue) {
      this.selectedModel = newValue;
      this.updateVoice();
    },
    voice(newValue) {
      this.selectedVoice = newValue;
    },
    openaiModel(newValue) {
      this.openaiTtsModel = newValue;
    }
  },
  created() {
    // Make sure voice is valid for the current model
    this.updateVoice();
  },
  methods: {
    updateVoice() {
      const voices = this.voicesByModel[this.selectedModel] || [];
      
      // Check if the current voice is valid for this model
      if (!voices.some(voice => voice.id === this.selectedVoice) && voices.length > 0) {
        this.selectedVoice = voices[0].id;
        this.$emit('update:voice', this.selectedVoice);
      }
    },
    
    handleModelChange() {
      this.$emit('update:model', this.selectedModel);
      this.updateVoice();
      
      // Emit all current values
      this.$emit('model-change', {
        model: this.selectedModel,
        voice: this.selectedVoice,
        openaiModel: this.openaiTtsModel
      });
    },
    
    handleVoiceChange() {
      this.$emit('update:voice', this.selectedVoice);
      
      // Emit all current values
      this.$emit('model-change', {
        model: this.selectedModel,
        voice: this.selectedVoice,
        openaiModel: this.openaiTtsModel
      });
    },
    
    handleOpenaiModelChange() {
      this.$emit('update:openaiModel', this.openaiTtsModel);
      
      // Emit all current values
      this.$emit('model-change', {
        model: this.selectedModel,
        voice: this.selectedVoice,
        openaiModel: this.openaiTtsModel
      });
    }
  }
}
</script> 