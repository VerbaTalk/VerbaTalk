import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio', {
  state: () => ({
    history: [], // Array of audio history items
    currentAudio: null, // Current audio being played
    isPlaying: false,
    settings: {
      defaultModel: 'openai',
      defaultVoice: 'alloy',
      defaultSpeed: 1.0,
      cacheAudio: true
    }
  }),
  
  actions: {
    // Add an item to the history
    addToHistory(item) {
      // Add at the beginning to show most recent first
      this.history.unshift({
        ...item,
        timestamp: new Date().toISOString()
      });
      
      // Limit history to last 20 items
      if (this.history.length > 20) {
        this.history = this.history.slice(0, 20);
      }
      
      // Save history to storage
      this.saveHistory();
    },
    
    // Load history from storage
    async loadHistory() {
      return new Promise((resolve) => {
        chrome.storage.local.get('audioHistory', (data) => {
          if (data.audioHistory) {
            this.history = data.audioHistory;
          }
          resolve();
        });
      });
    },
    
    // Save history to storage
    saveHistory() {
      chrome.storage.local.set({ audioHistory: this.history });
    },
    
    // Set current audio
    setCurrentAudio(audio) {
      this.currentAudio = audio;
      
      // Add to history if it's a new item
      if (audio) {
        this.addToHistory({
          text: audio.text,
          model: audio.model,
          voice: audio.voice,
          audioUrl: audio.audioUrl
        });
      }
    },
    
    // Update playback state
    setPlaybackState(isPlaying) {
      this.isPlaying = isPlaying;
    },
    
    // Load settings from storage
    async loadSettings() {
      return new Promise((resolve) => {
        chrome.storage.sync.get('settings', (data) => {
          if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
          }
          resolve();
        });
      });
    },
    
    // Save settings to storage
    saveSettings() {
      chrome.storage.sync.set({ settings: this.settings });
    },
    
    // Clear history
    clearHistory() {
      this.history = [];
      this.saveHistory();
    }
  }
}); 