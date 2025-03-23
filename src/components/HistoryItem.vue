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
        <span>🔊</span>
      </button>
      
      <button class="action-button" @click.stop="translate">
        <span>🔄</span>
      </button>
      
      <button class="action-button" @click.stop="copyText">
        <span>{{ copying ? '✓' : '📋' }}</span>
      </button>
      
      <button class="action-button delete-button" @click.stop="deleteItem">
        <span>🗑️</span>
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
    },
    
    deleteItem() {
      if (confirm('Delete this history item?')) {
        this.$emit('delete', { index: this.index });
      }
    }
  }
}
</script>

<style scoped>
.delete-button {
  background-color: #e53935;
}

.delete-button:hover {
  background-color: #c62828;
}
</style> 