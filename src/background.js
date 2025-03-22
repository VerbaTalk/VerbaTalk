// Background script for AI Text to Speech extension

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('TTS Extension: Installed or updated');
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'speak-selection',
    title: 'Speak selected text',
    contexts: ['selection']
  });
  
  // Set default settings if not already set
  chrome.storage.sync.get({
    serverUrl: '',
    ttsModel: '',
    voice: '',
    speed: 0,
    openaiTtsModel: ''
  }, function(items) {
    console.log('TTS Extension: Current settings', items);
    
    // Only set defaults if values are not already set
    const defaults = {};
    if (items.serverUrl === '') defaults.serverUrl = 'http://localhost:3000';
    if (items.ttsModel === '') defaults.ttsModel = 'openai';
    if (items.voice === '') defaults.voice = 'alloy';
    if (items.speed === 0) defaults.speed = 1.0;
    if (items.openaiTtsModel === '') defaults.openaiTtsModel = 'gpt-4o-mini-tts';
    
    if (Object.keys(defaults).length > 0) {
      console.log('TTS Extension: Setting default values', defaults);
      chrome.storage.sync.set(defaults);
    }
    
    // Add debug: Log all settings after initialization
    setTimeout(() => {
      chrome.storage.sync.get(null, (allSettings) => {
        console.log('TTS Extension: All settings after initialization', allSettings);
      });
    }, 1000);
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'speak-selection') {
    console.log('TTS Extension: Context menu item clicked');
    const selectedText = info.selectionText;
    
    // Get settings
    chrome.storage.sync.get({
      serverUrl: 'http://localhost:3000',
      ttsModel: 'openai',
      voice: 'alloy',
      speed: 1.0,
      openaiTtsModel: 'gpt-4o-mini-tts'
    }, (settings) => {
      console.log('TTS Extension: Using settings for context menu', settings);
      
      // Send message to content script to process TTS
      chrome.tabs.sendMessage(tab.id, {
        action: 'speakText',
        text: selectedText,
        settings: settings
      });
    });
  }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('TTS Extension: Background script received message', message);
  
  if (message.action === 'playFromHistory') {
    // Forward message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        console.log('TTS Extension: Forwarding playFromHistory to content script');
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'playFromHistory',
          text: message.text,
          audioUrl: message.audioUrl
        });
      } else {
        console.error('TTS Extension: No active tab found');
      }
    });
  } else if (message.action === 'addToHistory') {
    // Add item to history
    chrome.storage.local.get({ history: [] }, (data) => {
      const history = data.history;
      
      // Add new item to history
      history.push({
        text: message.text,
        audioUrl: message.audioUrl,
        model: message.model,
        timestamp: Date.now()
      });
      
      // Keep only the most recent 50 items
      if (history.length > 50) {
        history.shift();
      }
      
      // Save updated history
      console.log('TTS Extension: Adding item to history');
      chrome.storage.local.set({ history: history });
    });
  } else {
    console.log('TTS Extension: Unknown message action', message.action);
  }
}); 