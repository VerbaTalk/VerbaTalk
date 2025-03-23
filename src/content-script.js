// Global variables
let audioPlayer = null;
let isProcessing = false;
let shadowHost = null;
let shadowRoot = null;
let lastSelectionRect = null; // 保存最后一次选中文本的位置
let currentSelectedText = null; // 当前选中的文本

// 初始化Shadow DOM
function initShadowDOM() {
  // 检查是否已经初始化
  if (shadowHost && shadowRoot) {
    return;
  }
  
  // 创建Shadow DOM宿主元素
  shadowHost = document.createElement('div');
  shadowHost.id = 'ai-tts-extension-host';
  shadowHost.style.all = 'initial'; // 重置所有样式
  document.body.appendChild(shadowHost);
  
  // 创建Shadow DOM
  shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  
  // 添加基本样式
  const style = document.createElement('style');
  style.textContent = `
    * {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      box-sizing: border-box;
    }
    
    .button-container {
      position: absolute;
      display: flex;
      gap: 8px;
      z-index: 2147483647;
    }
    
    .action-button {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2f80ed, #1e88e5);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
    }
    
    .action-button:hover {
      background: linear-gradient(135deg, #1a73e8, #0d47a1);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .translation-panel {
      position: absolute;
      width: 340px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      z-index: 2147483647;
      border: 1px solid rgba(0,0,0,0.08);
      overflow: hidden;
    }
  `;
  shadowRoot.appendChild(style);
  
  console.log('Shadow DOM initialized');
}

// 全局设置
let settings = {
  serverUrl: 'http://localhost:3000',
  ttsModel: 'openai',
  voice: 'alloy',
  speed: 1,
  openaiTtsModel: 'gpt-4o-mini-tts',
  translationProvider: 'openai',
  translationModel: 'gpt-4o' // 添加翻译模型设置
};

// 加载保存的设置
chrome.storage.sync.get({
  serverUrl: 'http://localhost:3000',
  ttsModel: 'openai',
  voice: 'alloy',
  speed: 1,
  openaiTtsModel: 'gpt-4o-mini-tts',
  translationProvider: 'openai',
  translationModel: 'gpt-4o' // 添加翻译模型设置
}, function(items) {
  settings = items;
  console.log('Loaded settings:', settings);
});

// 监听来自popup的设置更新
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateSettings') {
    settings = request.settings;
    console.log('Updated settings:', settings);
  } else if (request.action === 'speakText') {
    processTextToSpeech(request.text);
  } else if (request.action === 'playFromHistory') {
    if (request.audioUrl) {
      playAudio(request.audioUrl);
    } else {
      processTextToSpeech(request.text);
    }
  } else if (request.action === 'translateFromHistory') {
    processTranslation(request.text);
  }
});

// Initialize content script
function initialize() {
  console.log('TTS Extension: Content script initialized');
  
  // 初始化Shadow DOM
  initShadowDOM();
  
  // Create audio player element
  audioPlayer = document.createElement('audio');
  audioPlayer.style.display = 'none';
  document.body.appendChild(audioPlayer);

  // 监听Escape键关闭面板
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      removeFloatingUI();
    }
  });
  
  // 清理所有现有的事件监听器
  document.removeEventListener('mouseup', handleTextSelection);
  
  // 重新添加文本选择监听器
  document.addEventListener('mouseup', handleTextSelection);
  
  // 监听鼠标点击事件，如果点击在UI外，则清理UI
  document.addEventListener('mousedown', function(e) {
    // 检查点击是否在我们的UI组件内，如果不是则移除UI
    if (!e.target.closest('#ai-tts-extension-host') && 
        shadowHost && !e.composedPath().includes(shadowHost)) {
      cleanupFloatingButtons();
    }
  });
  
  // 添加滚动监听器，滚动时移除浮动按钮
  window.addEventListener('scroll', function() {
    cleanupFloatingButtons();
  }, { passive: true });
  
  console.log('Extension initialized and event listeners added');
}

// 处理鼠标选中文本 - 简化逻辑
function handleTextSelection(e) {
  console.log('Mouse up event detected');
  
  // 如果鼠标右键，忽略
  if (e.button === 2) {
    console.log('Right click detected - ignoring');
    return;
  }
  
  // 如果事件发生在我们的UI组件内，忽略它
  if (e.target.closest('#ai-tts-extension-host') || 
      e.target.id === 'ai-tts-extension-host' ||
      (shadowHost && e.composedPath().includes(shadowHost))) {
    console.log('Click inside extension UI - ignoring');
    return;
  }
  
  // 获取选中文本
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  // 如果没有选中任何文本，则不做任何操作
  if (selectedText.length === 0) {
    return;
  }
  
  console.log('Selected text:', selectedText);
  currentSelectedText = selectedText;
  
  // 首先移除任何现有的浮动按钮，但保留翻译面板
  cleanupFloatingButtons();
  
  // 获取选中文本的位置
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // 保存这个位置，以便在显示翻译结果时使用
  lastSelectionRect = {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    bottom: rect.bottom + window.scrollY,
    right: rect.right + window.scrollX
  };
  
  const x = lastSelectionRect.left;
  const y = lastSelectionRect.bottom + 10;
  
  console.log('Creating floating button at position:', x, y);
  
  // 立即创建浮动按钮
  createFloatingButton(selectedText, x, y);
}

// 只清理浮动按钮
function cleanupFloatingButtons() {
  if (shadowRoot) {
    const buttons = shadowRoot.querySelectorAll('.button-container');
    buttons.forEach(button => button.remove());
  }
}

// 处理服务器错误响应
function handleServerError(error) {
  console.error('Server error:', error);
  removeLoadingIndicator();
  
  // 解析错误信息
  let errorMessage = 'An error occurred';
  if (error.response) {
    // 服务器返回的错误
    if (error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.response.data && error.response.data.error) {
      errorMessage = error.response.data.error;
    } else {
      errorMessage = `Server error: ${error.response.status}`;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  // 显示错误通知
  showNotification(errorMessage, 'error');
}

// 处理文本转语音
function processTextToSpeech(text) {
  console.log('Processing text to speech:', text);
  
  // 获取设置
  console.log('Using settings:', settings);
  
  // 创建加载指示器
  createLoadingIndicator();
  
  // 发送请求到服务器
  fetch(`${settings.serverUrl}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      model: settings.ttsModel,
      voice: settings.voice,
      speed: settings.speed,
      openaiTtsModel: settings.openaiTtsModel
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw { response: { status: response.status, data: data } };
      });
    }
    return response.json();
  })
  .then(data => {
    removeLoadingIndicator();
    
    if (data.audioUrl) {
      console.log('Audio URL received:', data.audioUrl);
      
      // 播放音频
      playAudio(`${settings.serverUrl}${data.audioUrl}`);
      
      // 保存到历史记录
      addToHistory(text, 'tts', settings.ttsModel, `${settings.serverUrl}${data.audioUrl}`);
    } else {
      console.error('No audio URL in response:', data);
      showNotification('Failed to generate speech', 'error');
    }
  })
  .catch(handleServerError);
}

// Play audio from URL
function playAudio(audioUrl) {
  console.log('TTS Extension: Playing audio from URL', audioUrl);
  
  if (!audioUrl) {
    console.error('TTS Extension: Invalid audio URL (null or empty)');
    showNotification('Invalid audio URL', 'error');
    return;
  }
  
  if (!audioUrl.startsWith('http')) {
    console.error('TTS Extension: Invalid audio URL format', audioUrl);
    showNotification('Invalid audio URL format', 'error');
    return;
  }
  
  // First clear any existing audio
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    audioPlayer.load();
  } else {
    // Create audio player if it doesn't exist
    audioPlayer = document.createElement('audio');
    audioPlayer.style.display = 'none';
    document.body.appendChild(audioPlayer);
  }
  
  // Add loading indicator
  showNotification('Loading audio...', 'info');
  
  // Set up event listeners
  audioPlayer.oncanplaythrough = () => {
    console.log('TTS Extension: Audio loaded successfully');
    showNotification('Playing audio...', 'info');
    audioPlayer.play()
      .then(() => {
        console.log('TTS Extension: Audio playback started');
      })
      .catch(error => {
        console.error('TTS Extension: Error playing audio:', error);
        showNotification('Error playing audio: ' + error.message, 'error');
      });
  };
  
  audioPlayer.onerror = (e) => {
    console.error('TTS Extension: Error loading audio', e);
    console.error('TTS Extension: Audio error code:', audioPlayer.error ? audioPlayer.error.code : 'unknown');
    console.error('TTS Extension: Audio error message:', audioPlayer.error ? audioPlayer.error.message : 'unknown');
    showNotification('Error loading audio', 'error');
    
    // Try to verify if the file exists
    fetch(audioUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          console.error(`TTS Extension: Audio file not found (${response.status})`);
          showNotification(`Audio file not found (${response.status})`, 'error');
        } else {
          console.log('TTS Extension: Audio file exists but cannot be played');
          showNotification('Audio file exists but cannot be played', 'error');
        }
      })
      .catch(error => {
        console.error('TTS Extension: Error checking audio file:', error);
        showNotification('Error checking audio file: ' + error.message, 'error');
      });
  };
  
  // Handle ending
  audioPlayer.onended = () => {
    console.log('TTS Extension: Audio playback completed');
  };
  
  // Set the source and load the audio
  try {
    audioPlayer.src = audioUrl;
    audioPlayer.load();
    console.log('TTS Extension: Audio loading initiated');
  } catch (error) {
    console.error('TTS Extension: Error setting audio source:', error);
    showNotification('Error setting audio source: ' + error.message, 'error');
  }
}

// 创建浮动按钮 - 使用更直观的UI
function createFloatingButton(selectedText, x, y) {  
  // 确保Shadow DOM已初始化
  initShadowDOM();
  
  console.log('Creating floating buttons in Shadow DOM for text:', selectedText);
  
  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  buttonContainer.style.left = `${x}px`;
  buttonContainer.style.top = `${y}px`;
  
  // 创建TTS按钮 - 使用麦克风图标
  const ttsButton = document.createElement('button');
  ttsButton.className = 'action-button';
  ttsButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16C14.2091 16 16 14.2091 16 12V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V12C8 14.2091 9.79086 16 12 16Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 19V22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  ttsButton.title = '将文本转换为语音';
  
  ttsButton.addEventListener('mousedown', function(e) {
    e.stopPropagation();
  });
  
  ttsButton.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log('TTS button clicked for text:', selectedText);
    processTextToSpeech(selectedText);
  });
  
  // 创建翻译按钮 - 使用翻译图标
  const translateButton = document.createElement('button');
  translateButton.className = 'action-button';
  translateButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.87 3H21.15M21.15 3V10M21.15 3L13.59 10.56M10.45 6.69H2.84M2.84 6.69L6.64 14.29M2.84 6.69L14.19 21.15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  translateButton.title = '翻译所选文本';
  
  translateButton.addEventListener('mousedown', function(e) {
    e.stopPropagation();
  });
  
  translateButton.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log('Translation button clicked for text:', selectedText);
    processTranslation(selectedText);
  });
  
  // 容器也需要阻止事件冒泡
  buttonContainer.addEventListener('mousedown', function(e) {
    e.stopPropagation();
  });
  
  buttonContainer.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // 添加按钮到容器
  buttonContainer.appendChild(ttsButton);
  buttonContainer.appendChild(translateButton);
  
  // 添加容器到Shadow DOM
  shadowRoot.appendChild(buttonContainer);
  
  console.log('Buttons added to Shadow DOM');
}

// 移除浮动UI组件
function removeFloatingUI() {
  console.log('Removing all floating UI');
  
  if (shadowRoot) {
    // 移除除了样式之外的所有子元素
    const children = Array.from(shadowRoot.children);
    for (const child of children) {
      if (child.tagName !== 'STYLE') {
        shadowRoot.removeChild(child);
      }
    }
  }
  
  // 移除文档点击监听器
  if (currentSelectedText) {
    document.removeEventListener('mousedown', handleTextSelection);
    currentSelectedText = null;
  }
}

// 处理翻译
function processTranslation(text) {
  console.log('Processing translation for:', text);
  console.log('Using provider:', settings.translationProvider);
  console.log('Using translation model:', settings.translationModel);
  
  // 创建加载指示器
  createLoadingIndicator();
  
  // 调用服务器API进行翻译
  fetch(`${settings.serverUrl}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      provider: settings.translationProvider,
      model: settings.translationModel // 添加模型参数
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw { response: { status: response.status, data: data } };
      });
    }
    return response.json();
  })
  .then(data => {
    removeLoadingIndicator();
    
    if (data.translation) {
      console.log('Translation received:', data.translation);
      
      // 显示翻译结果
      showTranslationResult(text, data.translation);
      
      // 保存到历史记录
      addToHistory(text, 'translation', settings.translationProvider, null, data.translation);
      
      // 通知popup翻译完成
      chrome.runtime.sendMessage({
        action: 'translationComplete',
        text: text,
        translation: data.translation,
        provider: settings.translationProvider,
        model: settings.translationModel
      });
    } else {
      console.error('Translation failed:', data);
      showNotification('Translation failed', 'error');
    }
  })
  .catch(handleServerError);
}

// 显示翻译结果 - 在选中文本位置附近
function showTranslationResult(originalText, translatedText) {
  // 移除现有翻译面板，但保留按钮
  if (shadowRoot) {
    const panels = shadowRoot.querySelectorAll('.translation-panel');
    panels.forEach(panel => panel.remove());
  }
  
  // 确保Shadow DOM已初始化
  initShadowDOM();
  
  // 创建翻译面板
  const panel = document.createElement('div');
  panel.className = 'translation-panel';
  
  // 使用最后选中文本的位置显示翻译结果
  // 如果文本在屏幕下半部分，则在文本上方显示；否则在文本下方显示
  if (lastSelectionRect) {
    const viewportHeight = window.innerHeight;
    const textMiddleY = (lastSelectionRect.top - window.scrollY) + 
                        (lastSelectionRect.bottom - lastSelectionRect.top) / 2;
    
    // 如果文本在屏幕下半部分，则在上方显示翻译结果
    if (textMiddleY > viewportHeight / 2) {
      panel.style.bottom = `${window.innerHeight - (lastSelectionRect.top - window.scrollY) + 10}px`;
      panel.style.left = `${lastSelectionRect.left}px`;
    } else {
      // 否则在下方显示
      panel.style.top = `${lastSelectionRect.bottom + 10}px`;
      panel.style.left = `${lastSelectionRect.left}px`;
    }
  } else {
    // 如果没有位置信息，回退到中心位置
    panel.style.top = '50%';
    panel.style.left = '50%';
    panel.style.transform = 'translate(-50%, -50%)';
  }
  
  // 创建HTML内容
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #333;">
        <span>${getProviderIcon()}</span>
        <span>${getProviderName()}</span>
      </div>
      <button id="close-btn" style="background: none; border: none; color: #666; cursor: pointer; font-size: 14px; padding: 5px;">✕</button>
    </div>
    
    <div style="padding: 12px 15px;">
      <div style="display: flex; border-bottom: 1px solid rgba(0,0,0,0.05); margin-bottom: 15px;">
        <div id="source-tab" style="flex: 1; text-align: center; padding: 8px; font-size: 14px; color: #333; cursor: pointer; border-bottom: 2px solid transparent;">原文</div>
        <div id="target-tab" style="flex: 1; text-align: center; padding: 8px; font-size: 14px; color: #333; cursor: pointer; border-bottom: 2px solid #4F46E5;">翻译</div>
      </div>
      
      <div id="source-container" style="display: none; font-size: 14px; line-height: 1.5; color: #333;">${originalText}</div>
      <div id="target-container" style="font-size: 14px; line-height: 1.5; color: #333;">${translatedText}</div>
      
      <div style="display: flex; gap: 10px; margin-top: 15px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 12px;">
        <button id="play-btn" style="display: flex; align-items: center; gap: 6px; background: none; border: none; color: #666; cursor: pointer; padding: 5px; font-size: 13px;">
          <span>🔊</span><span>朗读</span>
        </button>
        <button id="copy-btn" style="display: flex; align-items: center; gap: 6px; background: none; border: none; color: #666; cursor: pointer; padding: 5px; font-size: 13px;">
          <span>📋</span><span>复制</span>
        </button>
        <button id="save-btn" style="display: flex; align-items: center; gap: 6px; background: none; border: none; color: #666; cursor: pointer; padding: 5px; font-size: 13px; margin-left: auto;">
          <span>💾</span><span>保存</span>
        </button>
      </div>
    </div>
  `;
  
  // 添加到Shadow DOM
  shadowRoot.appendChild(panel);
  
  // 添加事件监听
  const closeBtn = shadowRoot.getElementById('close-btn');
  const sourceTab = shadowRoot.getElementById('source-tab');
  const targetTab = shadowRoot.getElementById('target-tab');
  const sourceContainer = shadowRoot.getElementById('source-container');
  const targetContainer = shadowRoot.getElementById('target-container');
  const playBtn = shadowRoot.getElementById('play-btn');
  const copyBtn = shadowRoot.getElementById('copy-btn');
  const saveBtn = shadowRoot.getElementById('save-btn');
  
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.remove();
  });
  
  sourceTab.addEventListener('click', (e) => {
    e.stopPropagation();
    sourceTab.style.borderBottom = '2px solid #4F46E5';
    targetTab.style.borderBottom = '2px solid transparent';
    sourceContainer.style.display = 'block';
    targetContainer.style.display = 'none';
  });
  
  targetTab.addEventListener('click', (e) => {
    e.stopPropagation();
    sourceTab.style.borderBottom = '2px solid transparent';
    targetTab.style.borderBottom = '2px solid #4F46E5';
    sourceContainer.style.display = 'none';
    targetContainer.style.display = 'block';
  });
  
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const textToRead = sourceContainer.style.display === 'block' ? originalText : translatedText;
    processTextToSpeech(textToRead);
  });
  
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const textToCopy = sourceContainer.style.display === 'block' ? originalText : translatedText;
    
    // 使用替代方法复制文本
    try {
      // 首先尝试使用clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          // 显示复制成功提示
          copyBtn.innerHTML = '<span>✓</span><span>已复制</span>';
          setTimeout(() => {
            copyBtn.innerHTML = '<span>📋</span><span>复制</span>';
          }, 2000);
        });
      } else {
        // 如果clipboard API不可用，使用document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          copyBtn.innerHTML = '<span>✓</span><span>已复制</span>';
          setTimeout(() => {
            copyBtn.innerHTML = '<span>📋</span><span>复制</span>';
          }, 2000);
        } else {
          console.error('Failed to copy text');
          showNotification('复制失败', 'error');
        }
      }
    } catch (err) {
      console.error('Copy error:', err);
      showNotification('复制失败', 'error');
    }
  });
  
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // 保存到历史记录
    addToHistory(originalText, 'translation', settings.translationProvider, null, translatedText);
    // 显示保存成功提示
    saveBtn.innerHTML = '<span>✓</span><span>已保存</span>';
    setTimeout(() => {
      saveBtn.innerHTML = '<span>💾</span><span>保存</span>';
    }, 2000);
  });
  
  // 添加拖动功能
  makeDraggable(panel);
  
  function getProviderIcon() {
    switch(settings.translationProvider) {
      case 'gemini': return '✨';
      case 'zhipu': return '🔮';
      case 'ollama': return '🤖';
      case 'openai':
      default: return '⚡';
    }
  }
  
  function getProviderName() {
    switch(settings.translationProvider) {
      case 'gemini': return `Gemini 翻译 (${settings.translationModel})`;
      case 'zhipu': return `智谱翻译 (${settings.translationModel})`;
      case 'ollama': return `Ollama 翻译 (${settings.translationModel})`;
      case 'openai':
      default: return `OpenAI 翻译 (${settings.translationModel})`;
    }
  }
}

// 让元素可拖动 - 为Shadow DOM内的元素
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  // 查找面板标题作为拖动句柄
  const handle = element.querySelector('div:first-child');
  if (!handle) return;
  
  handle.style.cursor = 'move';
  handle.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    // 获取鼠标位置
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // 设置拖动事件
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // 计算新位置
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // 设置元素新位置
    const newTop = element.offsetTop - pos2;
    const newLeft = element.offsetLeft - pos1;
    
    // 确保面板不会拖出视口
    const maxTop = window.innerHeight - 50;
    const maxLeft = window.innerWidth - 50;
    
    element.style.top = Math.min(Math.max(newTop, 0), maxTop) + 'px';
    element.style.left = Math.min(Math.max(newLeft, 0), maxLeft) + 'px';
  }
  
  function closeDragElement() {
    // 停止拖动
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// 创建加载指示器 - 使用Shadow DOM
function createLoadingIndicator() {
  // 确保Shadow DOM已初始化
  initShadowDOM();
  
  // 移除现有的加载指示器
  const existingIndicator = shadowRoot.querySelector('.loading-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // 创建新的加载指示器
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 2147483647;
  `;
  loadingIndicator.textContent = '正在处理...';
  
  // 添加到Shadow DOM
  shadowRoot.appendChild(loadingIndicator);
}

// 移除加载指示器
function removeLoadingIndicator() {
  if (shadowRoot) {
    const loadingIndicator = shadowRoot.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }
}

// 显示通知 - 使用Shadow DOM
function showNotification(message, type = 'info') {
  // 确保Shadow DOM已初始化
  initShadowDOM();
  
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 2147483647;
    transition: opacity 0.3s;
  `;
  
  if (type === 'error') {
    notification.style.background = '#f44336';
    notification.style.color = 'white';
  } else {
    notification.style.background = '#4caf50';
    notification.style.color = 'white';
  }
  
  notification.textContent = message;
  
  // 添加到Shadow DOM
  shadowRoot.appendChild(notification);
  
  // 设置自动消失
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// 添加到历史记录
function addToHistory(text, type, model, audioUrl, translation) {
  // 检查chrome.storage是否已定义
  if (!chrome || !chrome.storage || !chrome.storage.local) {
    console.error('Chrome storage API not available');
    return;
  }
  
  chrome.storage.local.get({ history: [] }, function(data) {
    if (chrome.runtime.lastError) {
      console.error('Error accessing chrome.storage.local:', chrome.runtime.lastError);
      return;
    }
    
    const history = data.history || [];
    
    const historyItem = {
      text,
      timestamp: Date.now(),
      model,
      type
    };
    
    if (audioUrl) {
      historyItem.audioUrl = audioUrl;
    }
    
    if (translation) {
      historyItem.translation = translation;
    }
    
    // 限制历史记录数量为50条
    if (history.length >= 50) {
      history.shift();
    }
    
    history.push(historyItem);
    
    chrome.storage.local.set({ history }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving to chrome.storage.local:', chrome.runtime.lastError);
      } else {
        console.log('History item saved successfully');
      }
    });
  });
}

// 初始化
initialize();