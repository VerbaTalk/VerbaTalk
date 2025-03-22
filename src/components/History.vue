<template>
  <div class="history-container">
    <div class="history-header">
      <h3>History</h3>
      <button v-if="audioStore.history.length > 0" class="clear-button" @click="clearHistory">
        Clear
      </button>
    </div>
    
    <div v-if="audioStore.history.length === 0" class="empty-history">
      <p>Your history will appear here</p>
    </div>
    
    <div v-else class="history-list">
      <div 
        v-for="(item, index) in audioStore.history" 
        :key="index" 
        class="history-item"
        @click="playAudio(item)"
      >
        <div class="history-content">
          <div class="history-text">{{ truncateText(item.text, 60) }}</div>
          <div class="history-meta">
            <span class="model-info">{{ item.model.toUpperCase() }} - {{ item.voice }}</span>
            <span class="time-info">{{ formatTime(item.timestamp) }}</span>
          </div>
        </div>
        <div class="history-actions">
          <button class="play-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 3l8 5-8 5V3z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAudioStore } from '../store';

export default {
  name: 'History',
  
  setup() {
    const audioStore = useAudioStore();
    return { audioStore };
  },
  
  methods: {
    truncateText(text, length) {
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      // For older entries, show the date
      return date.toLocaleDateString();
    },
    
    playAudio(item) {
      // Create a new audio object from the history item
      const audio = {
        text: item.text,
        model: item.model,
        voice: item.voice,
        audioUrl: item.audioUrl
      };
      
      // Set as current audio in the store
      this.audioStore.setCurrentAudio(audio);
      
      // Emit an event to notify parent component to play the audio
      this.$emit('play-audio', audio);
    },
    
    clearHistory() {
      if (confirm('Are you sure you want to clear your history?')) {
        this.audioStore.clearHistory();
      }
    }
  }
};
</script>

<style scoped>
.history-container {
  margin-top: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
}

.clear-button {
  background: none;
  border: none;
  color: #4a8cff;
  cursor: pointer;
  font-size: 14px;
}

.empty-history {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
  border: 1px dashed #ddd;
  border-radius: 4px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background-color: #f5f8ff;
}

.history-content {
  flex: 1;
}

.history-text {
  font-size: 14px;
  margin-bottom: 4px;
}

.history-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #777;
}

.play-button {
  background-color: #4a8cff;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.play-button:hover {
  background-color: #3a70d0;
}
</style> 