// Initialize tabs
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tabs
  initTabs();
  
  // Load settings
  loadSettings();
  
  // Add event listeners
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('translation-provider').addEventListener('change', handleTranslationProviderChange);
  document.getElementById('ollama-translation-model').addEventListener('change', handleOllamaModelChange);
  document.getElementById('tts-model').addEventListener('change', function() {
    updateVoiceOptions(this.value);
    
    // Handle OpenAI TTS model visibility
    if (this.value === 'openai') {
      document.getElementById('openai-tts-model-container').style.display = 'block';
    } else {
      document.getElementById('openai-tts-model-container').style.display = 'none';
    }
  });

  // Add export history event listener
  document.getElementById('export-history').addEventListener('click', exportHistory);
  
  // Load history
  loadHistory();
});

// Initialize tabs
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Show current tab content
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Load settings
function loadSettings() {
  chrome.storage.sync.get({
    serverUrl: 'http://localhost:3000',
    ttsModel: 'openai',
    voice: 'alloy',
    speed: 1,
    openaiTtsModel: 'gpt-4o-mini-tts',
    translationProvider: 'openai',
    translationModel: 'gpt-4o',
    ollamaCustomModel: ''
  }, function(items) {
    console.log('Loaded settings:', items);
    
    // Set form values
    document.getElementById('server-url').value = items.serverUrl;
    document.getElementById('tts-model').value = items.ttsModel;
    document.getElementById('speed').value = items.speed;
    document.querySelector('.speed-value').textContent = items.speed + 'x';
    
    // Set openai tts model
    if (items.ttsModel === 'openai') {
      document.getElementById('openai-tts-model-container').style.display = 'block';
      document.getElementById('openai-tts-model').value = items.openaiTtsModel;
    } else {
      document.getElementById('openai-tts-model-container').style.display = 'none';
    }
    
    // Update voice options based on model
    updateVoiceOptions(items.ttsModel, function() {
      setTimeout(function() {
        document.getElementById('voice').value = items.voice;
      }, 100);
    });
    
    // Set translation provider
    document.getElementById('translation-provider').value = items.translationProvider;
    
    // Handle translation model selection
    handleTranslationProviderChange();
    
    // Set translation model based on provider
    switch (items.translationProvider) {
      case 'openai':
        document.getElementById('openai-translation-model').value = items.translationModel;
        break;
      case 'gemini':
        document.getElementById('gemini-translation-model').value = items.translationModel;
        break;
      case 'zhipu':
        document.getElementById('zhipu-translation-model').value = items.translationModel;
        break;
      case 'ollama':
        if (items.translationModel === 'llama3' || items.translationModel === 'mistral') {
          document.getElementById('ollama-translation-model').value = items.translationModel;
        } else {
          document.getElementById('ollama-translation-model').value = 'custom';
          document.getElementById('ollama-custom-model').value = items.translationModel || items.ollamaCustomModel;
        }
        handleOllamaModelChange();
        break;
    }
  });
}

// Save settings
function saveSettings() {
  const serverUrl = document.getElementById('server-url').value.trim();
  const ttsModel = document.getElementById('tts-model').value;
  const voice = document.getElementById('voice').value;
  const speed = document.getElementById('speed').value;
  const translationProvider = document.getElementById('translation-provider').value;
  
  // Get OpenAI TTS model if present
  let openaiTtsModel = 'gpt-4o-mini-tts';
  if (document.getElementById('openai-tts-model')) {
    openaiTtsModel = document.getElementById('openai-tts-model').value;
  }
  
  // Get translation model based on provider
  let translationModel = '';
  
  switch (translationProvider) {
    case 'openai':
      translationModel = document.getElementById('openai-translation-model').value;
      break;
    case 'gemini':
      translationModel = document.getElementById('gemini-translation-model').value;
      break;
    case 'zhipu':
      translationModel = document.getElementById('zhipu-translation-model').value;
      break;
    case 'ollama':
      if (document.getElementById('ollama-translation-model').value === 'custom') {
        translationModel = document.getElementById('ollama-custom-model').value.trim();
      } else {
        translationModel = document.getElementById('ollama-translation-model').value;
      }
      break;
  }
  
  // Save custom Ollama model name
  const ollamaCustomModel = translationProvider === 'ollama' && 
                           document.getElementById('ollama-translation-model').value === 'custom' ? 
                           document.getElementById('ollama-custom-model').value.trim() : '';
  
  chrome.storage.sync.set({
    serverUrl,
    ttsModel,
    voice,
    speed,
    openaiTtsModel,
    translationProvider,
    translationModel,
    ollamaCustomModel
  }, function() {
    console.log('Settings saved:', {
      serverUrl,
      ttsModel,
      voice,
      speed,
      openaiTtsModel,
      translationProvider,
      translationModel,
      ollamaCustomModel
    });
    
    // Update content script settings
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateSettings',
        settings: {
          serverUrl,
          ttsModel,
          voice,
          speed,
          openaiTtsModel,
          translationProvider,
          translationModel
        }
      });
    });
    
    // Show save confirmation
    showSaveConfirmation();
  });
}

// Show save confirmation
function showSaveConfirmation() {
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

// Load history
function loadHistory() {
  chrome.storage.local.get({ history: [] }, function(data) {
    const historyItems = document.getElementById('history-items');
    const emptyHistory = document.getElementById('empty-history');
    
    // Clear existing items
    historyItems.innerHTML = '';
    
    // Check if history is empty
    if (data.history.length === 0) {
      emptyHistory.style.display = 'block';
      return;
    }
    
    // Hide empty message
    emptyHistory.style.display = 'none';
    
    // Get reversed copy of history (newest first)
    const reversedHistory = [...data.history].reverse();
    
    // Add each history item
    reversedHistory.forEach((item, index) => {
      historyItems.appendChild(createHistoryItem(item, index));
    });
  });
}

// Create history item
function createHistoryItem(item, index) {
  const container = document.createElement('div');
  container.className = 'history-item';
  
  const meta = document.createElement('div');
  meta.className = 'history-meta';
  
  const date = new Date(item.timestamp);
  meta.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  
  const tag = document.createElement('span');
  tag.className = 'history-tag';
  tag.textContent = item.type === 'tts' ? 'TTS' : 'Translation';
  meta.appendChild(tag);
  
  const text = document.createElement('div');
  text.className = 'history-text';
  text.textContent = item.text;
  
  const actions = document.createElement('div');
  actions.className = 'history-actions';
  
  // Play button - Available for all history items
  const playButton = document.createElement('button');
  playButton.className = 'action-button';
  playButton.innerHTML = '<span>🔊</span> Play';
  playButton.addEventListener('click', function() {
    if (item.audioUrl) {
      // Play from cached URL
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'playFromHistory',
          audioUrl: item.audioUrl
        });
      });
    } else {
      // Process text again
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'playFromHistory',
          text: item.text
        });
      });
    }
  });
  
  // Translation button - Available for all history items
  const translateButton = document.createElement('button');
  translateButton.className = 'action-button';
  translateButton.innerHTML = '<span>🔄</span> Translate';
  // If this is already translated, change the button text
  if (item.translation) {
    translateButton.innerHTML = '<span>🔄</span> Re-translate';
  }
  translateButton.addEventListener('click', function() {
    // Show loading state
    translateButton.disabled = true;
    translateButton.innerHTML = '<span>⏳</span> Loading...';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Save button reference and history index for callback
      const btnRef = translateButton;
      const itemIndex = index;
      
      // Add message listener to receive translation results
      chrome.runtime.onMessage.addListener(function listener(message) {
        if (message.action === 'translationComplete' && message.text === item.text) {
          // Received translation result, update UI and history
          btnRef.disabled = false;
          btnRef.innerHTML = '<span>🔄</span> Re-translate';
          
          // Update translation result in current view
          let translationDiv = container.querySelector('.history-translation');
          if (!translationDiv) {
            translationDiv = document.createElement('div');
            translationDiv.className = 'history-translation';
            container.insertBefore(translationDiv, actions);
          }
          translationDiv.textContent = message.translation;
          
          // Remove listener to prevent repeated processing
          chrome.runtime.onMessage.removeListener(listener);
          
          // Reload history to reflect update
          loadHistory();
        }
      });
      
      // Send translation request
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'translateFromHistory',
        text: item.text
      });
    });
  });
  
  // Copy button
  const copyButton = document.createElement('button');
  copyButton.className = 'action-button';
  copyButton.innerHTML = '<span>📋</span> Copy';
  copyButton.addEventListener('click', function() {
    let textToCopy = item.text;
    
    // If translation exists, copy that instead
    if (item.translation) {
      textToCopy = item.translation;
    }
    
    navigator.clipboard.writeText(textToCopy).then(function() {
      copyButton.innerHTML = '<span>✓</span> Copied';
      setTimeout(() => {
        copyButton.innerHTML = '<span>📋</span> Copy';
      }, 2000);
    });
  });
  
  actions.appendChild(playButton);
  actions.appendChild(translateButton);
  actions.appendChild(copyButton);
  
  container.appendChild(meta);
  container.appendChild(text);
  
  // Add translation if it exists
  if (item.translation) {
    const translationDiv = document.createElement('div');
    translationDiv.className = 'history-translation';
    translationDiv.textContent = item.translation;
    container.appendChild(translationDiv);
  }
  
  container.appendChild(actions);
  
  return container;
}

// Export history
function exportHistory() {
  chrome.storage.local.get({ history: [] }, function(data) {
    if (data.history.length === 0) {
      alert('No history to export');
      return;
    }
    
    // Create JSON file
    const json = JSON.stringify(data.history, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `tts-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  });
}

// Update voice options based on selected model
function updateVoiceOptions(model, callback) {
  const voiceSelect = document.getElementById('voice');
  
  // Clear current options
  voiceSelect.innerHTML = '';
  
  // Set options based on model
  switch (model) {
    case 'openai':
      addVoiceOptions(voiceSelect, [
        { id: 'alloy', name: 'Alloy' },
        { id: 'echo', name: 'Echo' },
        { id: 'fable', name: 'Fable' },
        { id: 'onyx', name: 'Onyx' },
        { id: 'nova', name: 'Nova' },
        { id: 'shimmer', name: 'Shimmer' },
        { id: 'ballad', name: 'Ballad' }
      ]);
      break;
      
    case 'google':
      addVoiceOptions(voiceSelect, [
        { id: 'en-US-Standard-C', name: 'Female (Standard)' },
        { id: 'en-US-Standard-B', name: 'Male (Standard)' },
        { id: 'en-US-Wavenet-H', name: 'Female (Premium)' },
        { id: 'en-US-Wavenet-D', name: 'Male (Premium)' }
      ]);
      break;
      
    case 'elevenlabs':
      addVoiceOptions(voiceSelect, [
        { id: 'Adam', name: 'Adam' },
        { id: 'Antoni', name: 'Antoni' },
        { id: 'Bella', name: 'Bella' },
        { id: 'Domi', name: 'Domi' },
        { id: 'Elli', name: 'Elli' },
        { id: 'Josh', name: 'Josh' }
      ]);
      break;
      
    case 'microsoft':
      addVoiceOptions(voiceSelect, [
        { id: 'en-US-AriaNeural', name: 'Aria (Female)' },
        { id: 'en-US-GuyNeural', name: 'Guy (Male)' },
        { id: 'en-US-JennyNeural', name: 'Jenny (Female)' }
      ]);
      break;
      
    case 'amazon':
      addVoiceOptions(voiceSelect, [
        { id: 'Joanna', name: 'Joanna (Female)' },
        { id: 'Matthew', name: 'Matthew (Male)' },
        { id: 'Ivy', name: 'Ivy (Female Child)' }
      ]);
      break;
  }
  
  if (callback) callback();
}

// Add voice options to select element
function addVoiceOptions(selectElement, options) {
  options.forEach(option => {
    const optElement = document.createElement('option');
    optElement.value = option.id;
    optElement.textContent = option.name;
    selectElement.appendChild(optElement);
  });
}

// Handle translation provider change
function handleTranslationProviderChange() {
  const provider = document.getElementById('translation-provider').value;
  
  // Hide all model containers
  document.getElementById('openai-translation-model-container').style.display = 'none';
  document.getElementById('gemini-translation-model-container').style.display = 'none';
  document.getElementById('zhipu-translation-model-container').style.display = 'none';
  document.getElementById('ollama-translation-model-container').style.display = 'none';
  document.getElementById('ollama-custom-model-container').style.display = 'none';
  
  // Show relevant container
  switch (provider) {
    case 'openai':
      document.getElementById('openai-translation-model-container').style.display = 'block';
      break;
    case 'gemini':
      document.getElementById('gemini-translation-model-container').style.display = 'block';
      break;
    case 'zhipu':
      document.getElementById('zhipu-translation-model-container').style.display = 'block';
      break;
    case 'ollama':
      document.getElementById('ollama-translation-model-container').style.display = 'block';
      handleOllamaModelChange();
      break;
  }
}

// Handle Ollama model change
function handleOllamaModelChange() {
  const ollamaModel = document.getElementById('ollama-translation-model').value;
  
  if (ollamaModel === 'custom') {
    document.getElementById('ollama-custom-model-container').style.display = 'block';
  } else {
    document.getElementById('ollama-custom-model-container').style.display = 'none';
  }
} 