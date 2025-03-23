<template>
  <div class="history-item">
    <div class="history-meta">
      {{ formattedTimestamp }}
      <span class="history-tag">{{ item.type === 'tts' ? 'TTS' : 'Translation' }}</span>
    </div>
    
    <div class="history-text">{{ item.text }}</div>
    
    <div v-if="item.translation" class="history-translation">
      {{ item.translation }}
    </div>
    
    <div class="history-actions">
      <button class="action-button" @click.stop="playAudio">
        <span>🔊</span> Play
      </button>
      
      <button class="action-button" @click.stop="translate">
        <span>🔄</span> {{ item.translation ? 'Re-translate' : 'Translate' }}
      </button>
      
      <button class="action-button" @click.stop="copyText">
        <span>📋</span> {{ copying ? 'Copied' : 'Copy' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistoryItem',
  props: {
    item: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      copying: false,
      translating: false
    };
  },
  computed: {
    formattedTimestamp() {
      const date = new Date(this.item.timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
  },
  methods: {
    playAudio() {
      this.$emit('play', { item: this.item, index: this.index });
    },
    
    translate() {
      this.translating = true;
      this.$emit('translate', { item: this.item, index: this.index });
    },
    
    copyText() {
      // Copy item text or translation if available
      const textToCopy = this.item.translation || this.item.text;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.copying = true;
        setTimeout(() => {
          this.copying = false;
        }, 2000);
      });
    }
  }
}
</script> 