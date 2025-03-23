<template>
  <div class="translation-provider-container">
    <div class="setting-group">
      <label for="translation-provider">Translation Provider</label>
      <select 
        id="translation-provider" 
        class="setting-input"
        v-model="selectedProvider"
        @change="handleProviderChange"
      >
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
        <option value="zhipu">Zhipu</option>
        <option value="ollama">Ollama</option>
      </select>
    </div>
    
    <!-- OpenAI Models -->
    <div v-if="selectedProvider === 'openai'">
      <ModelSelector
        id="openai-translation-model"
        label="OpenAI Translation Model"
        :options="modelOptions.openai"
        :value="modelValues.openai"
        :customValue="customValues.openai"
        customPlaceholder="e.g. gpt-4-turbo, gpt-4-turbo-preview"
        @update:value="updateModel('openai', $event)"
        @update:customValue="updateCustomValue('openai', $event)"
      />
    </div>
    
    <!-- Gemini Models -->
    <div v-if="selectedProvider === 'gemini'">
      <ModelSelector
        id="gemini-translation-model"
        label="Gemini Translation Model"
        :options="modelOptions.gemini"
        :value="modelValues.gemini"
        :customValue="customValues.gemini"
        customPlaceholder="e.g. gemini-1.0-pro, gemini-1.5-experimental"
        @update:value="updateModel('gemini', $event)"
        @update:customValue="updateCustomValue('gemini', $event)"
      />
    </div>
    
    <!-- Zhipu Models -->
    <div v-if="selectedProvider === 'zhipu'">
      <ModelSelector
        id="zhipu-translation-model"
        label="Zhipu Translation Model"
        :options="modelOptions.zhipu"
        :value="modelValues.zhipu"
        :customValue="customValues.zhipu"
        customPlaceholder="e.g. cogview-3, glm-4v"
        @update:value="updateModel('zhipu', $event)"
        @update:customValue="updateCustomValue('zhipu', $event)"
      />
    </div>
    
    <!-- Ollama Models -->
    <div v-if="selectedProvider === 'ollama'">
      <ModelSelector
        id="ollama-translation-model"
        label="Ollama Translation Model"
        :options="modelOptions.ollama"
        :value="modelValues.ollama"
        :customValue="customValues.ollama"
        customPlaceholder="e.g. mixtral, mistral-medium"
        @update:value="updateModel('ollama', $event)"
        @update:customValue="updateCustomValue('ollama', $event)"
      />
    </div>
  </div>
</template>

<script>
import ModelSelector from './ModelSelector.vue';

export default {
  name: 'TranslationProviderSelector',
  components: {
    ModelSelector
  },
  props: {
    provider: {
      type: String,
      default: 'openai'
    },
    models: {
      type: Object,
      default: () => ({
        openai: 'gpt-4o',
        gemini: 'gemini-2.0-pro',
        zhipu: 'glm-4',
        ollama: 'llama3.3'
      })
    },
    customModels: {
      type: Object,
      default: () => ({
        openai: '',
        gemini: '',
        zhipu: '',
        ollama: ''
      })
    }
  },
  data() {
    return {
      selectedProvider: this.provider,
      modelValues: { ...this.models },
      customValues: { ...this.customModels },
      
      // Options for each provider
      providerOptions: [
        { id: 'openai', name: 'OpenAI' },
        { id: 'gemini', name: 'Gemini' },
        { id: 'zhipu', name: 'Zhipu' },
        { id: 'ollama', name: 'Ollama' }
      ],
      modelOptions: {
        openai: [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
          { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
          { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' }
        ],
        gemini: [
          { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro' },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
          { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-1.5-ultra', name: 'Gemini 1.5 Ultra' }
        ],
        zhipu: [
          { id: 'glm-4', name: 'GLM-4' },
          { id: 'glm-4v', name: 'GLM-4V' },
          { id: 'glm-4-9b-chat', name: 'GLM-4-9B-Chat' },
          { id: 'glm-4-9b-chat-1m', name: 'GLM-4-9B-Chat-1M' },
          { id: 'glm-3-turbo', name: 'GLM-3-Turbo' },
          { id: 'chatglm-turbo', name: 'ChatGLM-Turbo' }
        ],
        ollama: [
          { id: 'llama3.3', name: 'Llama 3.3' },
          { id: 'llama3.2', name: 'Llama 3.2' },
          { id: 'llama3.1', name: 'Llama 3.1' },
          { id: 'gemma3:1b', name: 'Gemma 3.1B' },
          { id: 'mixtral', name: 'Mixtral 8x7B' },
          { id: 'gemma2', name: 'Gemma 2' }
        ]
      }
    }
  },
  watch: {
    provider(newValue) {
      this.selectedProvider = newValue;
    },
    modelValues: {
      handler(newValue) {
        this.modelValues = { ...newValue };
      },
      deep: true
    },
    customValues: {
      handler(newValue) {
        this.customValues = { ...newValue };
      },
      deep: true
    }
  },
  methods: {
    handleProviderChange() {
      this.$emit('update:provider', this.selectedProvider);
      this.$emit('provider-change', this.selectedProvider);
      
      // Emit the current model for this provider
      const currentModel = this.getCurrentModel();
      this.$emit('model-change', {
        provider: this.selectedProvider,
        model: currentModel.model,
        customModel: currentModel.customModel
      });
    },
    
    updateModel(provider, value) {
      this.modelValues[provider] = value;
      
      if (provider === this.selectedProvider) {
        const currentModel = this.getCurrentModel();
        this.$emit('model-change', {
          provider: this.selectedProvider,
          model: currentModel.model,
          customModel: currentModel.customModel
        });
      }
    },
    
    updateCustomValue(provider, value) {
      this.customValues[provider] = value;
      
      if (provider === this.selectedProvider) {
        const currentModel = this.getCurrentModel();
        this.$emit('model-change', {
          provider: this.selectedProvider,
          model: currentModel.model,
          customModel: currentModel.customModel
        });
      }
    },
    
    getCurrentModel() {
      const provider = this.selectedProvider;
      const modelValue = this.modelValues[provider];
      
      // If custom is selected, use the custom value
      if (modelValue === 'custom') {
        return {
          model: 'custom',
          customModel: this.customValues[provider]
        };
      }
      
      return {
        model: modelValue,
        customModel: this.customValues[provider]
      };
    }
  }
}
</script> 