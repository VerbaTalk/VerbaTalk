<template>
  <div class="history-tab">
    <div class="tab-header">
      <h2>History</h2>
      <button id="export-history" class="secondary-button" @click="exportHistory">
        Export
      </button>
    </div>
    
    <div v-if="history.length === 0" id="empty-history" class="empty-history">
      <p>No history items yet</p>
    </div>
    
    <div v-else id="history-items" class="history-items">
      <HistoryItem
        v-for="(item, index) in sortedHistory"
        :key="index"
        :item="item"
        :index="index"
        @play="playAudio"
        @translate="translateText"
        @copy="copyText"
      />
    </div>
  </div>
</template>

<script>
import HistoryItem from './HistoryItem.vue';

export default {
  name: 'HistoryTab',
  components: {
    HistoryItem
  },
  data() {
    return {
      history: []
    };
  },
  computed: {
    sortedHistory() {
      // Return reversed copy of history (newest first)
      return [...this.history].reverse();
    }
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    loadHistory() {
      chrome.storage.local.get({ history: [] }, (data) => {
        this.history = data.history;
      });
    },
    
    playAudio({ item }) {
      if (item.audioUrl) {
        // Play from cached URL
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'playFromHistory',
              audioUrl: item.audioUrl
            });
          }
        });
      } else {
        // Process text again
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'playFromHistory',
              text: item.text
            });
          }
        });
      }
    },
    
    translateText({ item, index }) {
      // Set up message listener for translation results
      const messageListener = (message) => {
        if (message.action === 'translationComplete' && message.text === item.text) {
          // Update the item with translation result
          const historyIndex = this.history.length - 1 - index;
          if (historyIndex >= 0 && historyIndex < this.history.length) {
            // Create a new copy of the history item with translation
            const updatedItem = {
              ...this.history[historyIndex],
              translation: message.translation
            };
            
            // Create a new history array with the updated item
            const updatedHistory = [...this.history];
            updatedHistory[historyIndex] = updatedItem;
            
            // Update the history array
            this.history = updatedHistory;
            
            // Save to storage
            chrome.storage.local.set({ history: this.history });
          }
          
          // Remove the message listener
          chrome.runtime.onMessage.removeListener(messageListener);
        }
      };
      
      // Add the message listener
      chrome.runtime.onMessage.addListener(messageListener);
      
      // Send translation request
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'translateFromHistory',
            text: item.text
          });
        }
      });
    },
    
    exportHistory() {
      if (this.history.length === 0) {
        alert('No history to export');
        return;
      }
      
      // Create JSON file
      const json = JSON.stringify(this.history, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `tts-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    }
  }
}
</script> 