// Initialize tabs
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Load saved settings
  loadSettings();
  
  // Load history
  loadHistory();
  
  // Initialize language selector
  initLanguageSelector();
  
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
          content.classList.add('active');
        }
      });
    });
  });
  
  // Save settings
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  
  // Update available options when model changes
  document.getElementById('tts-model').addEventListener('change', function() {
    const selectedModel = this.value;
    console.log('Model changed to:', selectedModel);
    updateVoiceOptions(selectedModel);
    updateTtsModelOptions(selectedModel);
  });
  
  // Update speed value display when slider changes
  const speedSlider = document.getElementById('speed');
  const speedValue = document.querySelector('.speed-value');
  
  speedSlider.addEventListener('input', function() {
    speedValue.textContent = `${this.value}x`;
  });
});

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get({
    serverUrl: 'http://localhost:3000',
    ttsModel: 'openai',
    voice: 'alloy',
    speed: 1,
    openaiTtsModel: 'gpt-4o-mini-tts'
  }, function(items) {
    console.log('Loaded settings:', items);
    document.getElementById('server-url').value = items.serverUrl;
    document.getElementById('tts-model').value = items.ttsModel;
    document.getElementById('speed').value = items.speed;
    
    // Update speed display
    const speedValue = document.querySelector('.speed-value');
    if (speedValue) {
      speedValue.textContent = `${items.speed}x`;
    }
    
    // Initialize voice options for the saved model
    updateVoiceOptions(items.ttsModel);
    
    // Set voice selection after options are populated
    setTimeout(() => {
      if (document.getElementById('voice').querySelector(`option[value="${items.voice}"]`)) {
        document.getElementById('voice').value = items.voice;
      }
    }, 100);
    
    // Initialize TTS model options for OpenAI if needed
    updateTtsModelOptions(items.ttsModel);
    
    // Set OpenAI TTS model selection if present
    setTimeout(() => {
      if (document.getElementById('openai-tts-model')) {
        document.getElementById('openai-tts-model').value = items.openaiTtsModel;
      }
    }, 100);
  });
}

// Save settings to storage
function saveSettings() {
  const serverUrl = document.getElementById('server-url').value;
  const ttsModel = document.getElementById('tts-model').value;
  const voice = document.getElementById('voice').value;
  const speed = document.getElementById('speed').value;
  
  // Get OpenAI TTS model if present
  const openaiTtsModel = document.getElementById('openai-tts-model') ? 
    document.getElementById('openai-tts-model').value : 'tts-1';
  
  const settings = {
    serverUrl: serverUrl,
    ttsModel: ttsModel,
    voice: voice,
    speed: parseFloat(speed),
    openaiTtsModel: openaiTtsModel
  };
  
  console.log('Saving settings:', settings);
  
  chrome.storage.sync.set(settings, function() {
    // Show a saved notification
    const saveButton = document.getElementById('save-settings');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saved!';
    saveButton.disabled = true;
    
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 1500);
  });
}

// Load history from storage
function loadHistory() {
  chrome.storage.local.get({ history: [] }, function(data) {
    const historyContainer = document.getElementById('history-items');
    const emptyHistory = document.getElementById('empty-history');
    
    if (data.history.length === 0) {
      historyContainer.style.display = 'none';
      emptyHistory.style.display = 'block';
    } else {
      historyContainer.style.display = 'block';
      emptyHistory.style.display = 'none';
      
      // Clear existing items
      historyContainer.innerHTML = '';
      
      // Create a copy of the history array and reverse it for display (newest first)
      const displayHistory = [...data.history].reverse();
      
      // Add history items
      displayHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Truncate text if too long
        const displayText = item.text.length > 100 
          ? item.text.substring(0, 100) + '...' 
          : item.text;
        
        historyItem.innerHTML = `
          <div class="history-text">${displayText}</div>
          <div class="history-meta">
            ${new Date(item.timestamp).toLocaleString()} · ${item.model}
          </div>
          <div class="history-actions">
            <button class="action-button" data-index="${index}">
              <span class="icon">▶️</span> 播放
            </button>
          </div>
        `;
        
        historyContainer.appendChild(historyItem);
      });
      
      // Add event listeners to play buttons
      document.querySelectorAll('.action-button').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          const item = displayHistory[index]; // Use the same array we used for display
          
          // Send message to background script to play audio
          chrome.runtime.sendMessage({
            action: 'playFromHistory',
            text: item.text,
            audioUrl: item.audioUrl
          });
        });
      });
    }
  });
}

// Update available voices based on selected model
function updateVoiceOptions(model) {
  console.log('Updating voice options for model:', model);
  const voiceSelect = document.getElementById('voice');
  
  // Clear current options
  voiceSelect.innerHTML = '';
  
  // Add appropriate options based on model
  switch(model) {
    case 'google':
      addVoiceOptions(voiceSelect, [
        { value: 'en-US-Standard-C', text: 'Female (Standard)' },
        { value: 'en-US-Standard-B', text: 'Male (Standard)' },
        { value: 'en-US-Wavenet-H', text: 'Female (Premium)' },
        { value: 'en-US-Wavenet-D', text: 'Male (Premium)' }
      ]);
      break;
    case 'openai':
      addVoiceOptions(voiceSelect, [
        { value: 'alloy', text: 'Alloy (中性)' },
        { value: 'echo', text: 'Echo (男声)' },
        { value: 'fable', text: 'Fable (男声)' },
        { value: 'onyx', text: 'Onyx (男声)' },
        { value: 'nova', text: 'Nova (女声)' },
        { value: 'shimmer', text: 'Shimmer (女声)' },
        { value: 'ash', text: 'Ash (男声)' },
        { value: 'sage', text: 'Sage (中性)' },
        { value: 'coral', text: 'Coral (女声)' },
        { value: 'ballad', text: 'Ballad (男声)' }
      ]);
      break;
    case 'elevenlabs':
      addVoiceOptions(voiceSelect, [
        { value: 'Adam', text: 'Adam' },
        { value: 'Antoni', text: 'Antoni' },
        { value: 'Bella', text: 'Bella' },
        { value: 'Domi', text: 'Domi' },
        { value: 'Elli', text: 'Elli' },
        { value: 'Josh', text: 'Josh' }
      ]);
      break;
    case 'amazon':
      addVoiceOptions(voiceSelect, [
        { value: 'Joanna', text: 'Joanna (Female)' },
        { value: 'Matthew', text: 'Matthew (Male)' },
        { value: 'Ivy', text: 'Ivy (Female Child)' },
        { value: 'Kendra', text: 'Kendra (Female)' },
        { value: 'Justin', text: 'Justin (Male Child)' }
      ]);
      break;
  }
  
  // Set default value
  if (voiceSelect.options.length > 0) {
    voiceSelect.value = voiceSelect.options[0].value;
  }
}

// Update TTS model options based on selected provider
function updateTtsModelOptions(model) {
  console.log('Updating TTS model options for provider:', model);
  
  // Remove previous TTS model selection if exists
  const existingContainer = document.getElementById('tts-model-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Only show TTS model options for OpenAI
  if (model === 'openai') {
    // Find the insertion point - after the TTS model selection
    const ttsModelGroup = document.querySelector('[for="tts-model"]').closest('.setting-group');
    
    // Create container
    const container = document.createElement('div');
    container.id = 'tts-model-container';
    container.className = 'setting-group';
    
    // Create label
    const label = document.createElement('label');
    label.htmlFor = 'openai-tts-model';
    label.textContent = 'OpenAI TTS 模型:';
    
    // Create select element
    const select = document.createElement('select');
    select.id = 'openai-tts-model';
    select.className = 'setting-input';
    
    // Add options - updated with the latest models
    const models = [
      { value: 'gpt-4o-mini-tts', text: 'GPT-4o mini TTS (最新模型 - 更智能)' },
      { value: 'tts-1', text: 'TTS-1 (较低延迟)' },
      { value: 'tts-1-hd', text: 'TTS-1-HD (高质量音频)' }
    ];
    
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.value;
      option.textContent = model.text;
      select.appendChild(option);
    });
    
    // Get saved value
    chrome.storage.sync.get({ openaiTtsModel: 'gpt-4o-mini-tts' }, function(data) {
      select.value = data.openaiTtsModel;
    });
    
    // Add to container
    container.appendChild(label);
    container.appendChild(select);
    
    // Insert after the TTS model selection
    ttsModelGroup.after(container);
  }
}

// Helper function to add voice options
function addVoiceOptions(selectElement, options) {
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    selectElement.appendChild(optionElement);
  });
}

// 语言翻译数据
const translations = {
  'en': {
    'settings': 'Settings',
    'history': 'History',
    'serverUrl': 'Server URL',
    'ttsEngine': 'TTS Engine',
    'ttsModel': 'OpenAI TTS Model:',
    'voice': 'Voice',
    'speechRate': 'Speech Rate',
    'slow': 'Slow',
    'fast': 'Fast',
    'saveSettings': 'Save Settings',
    'noHistory': 'No history yet',
    'play': 'Play',
    'followSystem': 'Follow System',
    'gpt4oMini': 'GPT-4o mini TTS (Latest model - More intelligent)',
    'tts1': 'TTS-1 (Lower latency)',
    'tts1hd': 'TTS-1-HD (High quality audio)'
  },
  'zh-CN': {
    'settings': '设置',
    'history': '历史记录',
    'serverUrl': '服务器 URL',
    'ttsEngine': '语音引擎',
    'ttsModel': 'OpenAI TTS 模型:',
    'voice': '声音',
    'speechRate': '语速调节',
    'slow': '慢',
    'fast': '快',
    'saveSettings': '保存设置',
    'noHistory': '尚无历史记录',
    'play': '播放',
    'followSystem': '跟随系统',
    'gpt4oMini': 'GPT-4o mini TTS (最新模型 - 更智能)',
    'tts1': 'TTS-1 (较低延迟)',
    'tts1hd': 'TTS-1-HD (高质量音频)'
  },
  'zh-TW': {
    'settings': '設置',
    'history': '歷史記錄',
    'serverUrl': '伺服器 URL',
    'ttsEngine': '語音引擎',
    'ttsModel': 'OpenAI TTS 模型:',
    'voice': '聲音',
    'speechRate': '語速調節',
    'slow': '慢',
    'fast': '快',
    'saveSettings': '保存設置',
    'noHistory': '尚無歷史記錄',
    'play': '播放',
    'followSystem': '跟隨系統',
    'gpt4oMini': 'GPT-4o mini TTS (最新模型 - 更智能)',
    'tts1': 'TTS-1 (較低延遲)',
    'tts1hd': 'TTS-1-HD (高質量音頻)'
  }
};

// 当前语言
let currentLang = 'auto';

// 获取用户浏览器语言
function getSystemLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  if (lang.startsWith('zh')) {
    return lang.includes('TW') || lang.includes('HK') ? 'zh-TW' : 'zh-CN';
  }
  return 'en';
}

// 应用语言设置
function applyLanguage(lang) {
  // 如果是自动设置，使用系统语言
  let effectiveLang = lang;
  if (lang === 'auto') {
    effectiveLang = getSystemLanguage();
  }
  
  // 保存当前语言选择
  currentLang = lang;
  
  // 如果没有该语言的翻译，回退到英文
  if (!translations[effectiveLang]) {
    effectiveLang = 'en';
  }
  
  const trans = translations[effectiveLang];
  
  // 更新所有需要翻译的文本
  document.querySelector('.tab[data-tab="settings-tab"]').textContent = trans.settings;
  document.querySelector('.tab[data-tab="history-tab"]').textContent = trans.history;
  document.querySelector('label[for="server-url"]').textContent = trans.serverUrl;
  document.querySelector('label[for="tts-model"]').textContent = trans.ttsEngine;
  document.querySelector('label[for="voice"]').textContent = trans.voice;
  document.querySelector('label[for="speed"]').textContent = trans.speechRate;
  document.querySelector('.speed-container span:first-child').textContent = trans.slow;
  document.querySelector('.speed-container span:nth-child(3)').textContent = trans.fast;
  document.querySelector('#save-settings').innerHTML = `<span class="icon">💾</span> ${trans.saveSettings}`;
  document.querySelector('#empty-history').textContent = trans.noHistory;
  
  // 更新OpenAI TTS模型标签（如果存在）
  const ttsModelLabel = document.querySelector('label[for="openai-tts-model"]');
  if (ttsModelLabel) {
    ttsModelLabel.textContent = trans.ttsModel;
  }
  
  // 更新模型选项（如果存在）
  const openaiModelSelect = document.getElementById('openai-tts-model');
  if (openaiModelSelect) {
    Array.from(openaiModelSelect.options).forEach(option => {
      if (option.value === 'gpt-4o-mini-tts') {
        option.textContent = trans.gpt4oMini;
      } else if (option.value === 'tts-1') {
        option.textContent = trans.tts1;
      } else if (option.value === 'tts-1-hd') {
        option.textContent = trans.tts1hd;
      }
    });
  }
  
  // 更新播放按钮
  document.querySelectorAll('.action-button').forEach(button => {
    const icon = button.querySelector('.icon');
    if (icon) {
      button.innerHTML = '';
      button.appendChild(icon);
      button.append(` ${trans.play}`);
    } else {
      button.textContent = trans.play;
    }
  });
  
  // 高亮当前选中的语言
  document.querySelectorAll('.language-option').forEach(option => {
    option.classList.remove('active');
    if (option.getAttribute('data-lang') === lang) {
      option.classList.add('active');
    }
  });
  
  // 保存语言设置
  chrome.storage.sync.set({ language: lang });
}

// 初始化语言选择下拉菜单
function initLanguageSelector() {
  const languageButton = document.getElementById('language-button');
  const languageDropdown = document.getElementById('language-dropdown');
  const languageOptions = document.querySelectorAll('.language-option');
  
  // 点击语言选择按钮显示/隐藏下拉菜单
  languageButton.addEventListener('click', () => {
    languageDropdown.classList.toggle('active');
  });
  
  // 点击页面其他地方关闭下拉菜单
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#language-selector')) {
      languageDropdown.classList.remove('active');
    }
  });
  
  // 点击语言选项改变语言
  languageOptions.forEach(option => {
    option.addEventListener('click', () => {
      const lang = option.getAttribute('data-lang');
      applyLanguage(lang);
      languageDropdown.classList.remove('active');
    });
  });
  
  // 加载已保存的语言设置
  chrome.storage.sync.get({ language: 'auto' }, (data) => {
    applyLanguage(data.language);
  });
} 