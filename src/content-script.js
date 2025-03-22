// Global variables
let floatingButton = null;
let audioPlayer = null;
let currentSelection = '';
let isProcessing = false;

// Initialize content script
function initialize() {
  console.log('TTS Extension: Content script initialized');
  
  // Create audio player element
  audioPlayer = document.createElement('audio');
  audioPlayer.style.display = 'none';
  document.body.appendChild(audioPlayer);
  
  // Setup event listeners
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keydown', handleKeyDown);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Handle text selection
function handleTextSelection(event) {
  // Don't process if the click was on our button
  if (event.target && (event.target.id === 'tts-floating-btn' || event.target.closest('#tts-floating-btn'))) {
    console.log('TTS Extension: Click on button - not handling selection');
    return;
  }
  
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  // Remove floating button if selection is empty
  if (!selectedText) {
    removeFloatingButton();
    currentSelection = '';
    return;
  }
  
  // Show floating button near selection if text has changed
  if (selectedText !== currentSelection) {
    console.log('TTS Extension: Text selected:', selectedText.substring(0, 50) + '...');
    currentSelection = selectedText;
    showFloatingButton(event);
  }
}

// Handle key down events (for accessibility)
function handleKeyDown(event) {
  // If Esc key is pressed, remove the floating button
  if (event.key === 'Escape') {
    removeFloatingButton();
    currentSelection = '';
  }
}

// Button click handler function
function handleButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('TTS Extension: Button clicked');
  if (!isProcessing) {
    // Show loading state
    isProcessing = true;
    floatingButton.classList.add('loading');
    
    // Get settings
    chrome.storage.sync.get({
      serverUrl: 'http://localhost:3000',
      ttsModel: 'openai',
      voice: 'alloy',
      speed: 1.0,
      openaiTtsModel: 'gpt-4o-mini-tts'
    }, (settings) => {
      console.log('TTS Extension: Retrieved settings', settings);
      // Process selected text
      processTextToSpeech(currentSelection, settings);
    });
  }
  return false;
}

// Show floating button near the text selection
function showFloatingButton(event) {
  // First remove any existing floating button
  removeFloatingButton();
  
  // Create new floating button
  floatingButton = document.createElement('div');
  floatingButton.id = 'tts-floating-btn';
  floatingButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `;
  
  // Button styles
  floatingButton.style.cssText = `
    position: absolute;
    z-index: 9999;
    background-color: #4F46E5;
    color: white;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1);
    animation: tts-fade-in 0.3s ease-out;
    transition: transform 0.2s, background-color 0.2s;
  `;
  
  // Add button animation styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes tts-fade-in {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    @keyframes tts-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    #tts-floating-btn:hover {
      background-color: #4338CA;
      transform: scale(1.1);
    }
    
    #tts-floating-btn.loading svg {
      animation: tts-rotate 1s linear infinite;
    }
  `;
  document.head.appendChild(styleSheet);
  
  // Position the button near the selection
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position button at the end of the selection
    floatingButton.style.left = `${rect.right + window.scrollX + 10}px`;
    floatingButton.style.top = `${rect.top + window.scrollY - 5}px`;
    
    // Ensure button is visible in viewport
    const buttonRect = { width: 36, height: 36 };
    
    // Check if button would be outside viewport on right edge
    if (rect.right + buttonRect.width + 10 > window.innerWidth) {
      floatingButton.style.left = `${rect.left + window.scrollX - buttonRect.width - 10}px`;
    }
    
    // Check if button would be outside viewport on bottom edge
    if (rect.top + buttonRect.height > window.innerHeight) {
      floatingButton.style.top = `${rect.bottom + window.scrollY - buttonRect.height}px`;
    }
  }
  
  // Use onclick for better compatibility
  floatingButton.onclick = handleButtonClick;
  
  // Add button to document
  document.body.appendChild(floatingButton);
  console.log('TTS Extension: Floating button added to page');
}

// Remove floating button from page
function removeFloatingButton() {
  if (floatingButton && floatingButton.parentNode) {
    floatingButton.parentNode.removeChild(floatingButton);
    floatingButton = null;
  }
}

// Process text to speech
function processTextToSpeech(text, settings) {
  // Show loading state in button
  if (floatingButton) {
    floatingButton.classList.add('loading');
  }
  
  console.log('TTS Extension: Processing text to speech', {
    serverUrl: settings.serverUrl,
    model: settings.ttsModel,
    voice: settings.voice,
    openaiTtsModel: settings.openaiTtsModel || 'gpt-4o-mini-tts'
  });
  
  // Log the full request URL and body for debugging
  const requestUrl = `${settings.serverUrl}/tts`;
  const requestBody = {
    text: text,
    model: settings.ttsModel,
    voice: settings.voice,
    speed: settings.speed
  };
  
  // Add OpenAI specific parameters
  if (settings.ttsModel === 'openai' && settings.openaiTtsModel) {
    requestBody.ttsModel = settings.openaiTtsModel;
  }
  
  console.log('TTS Extension: Sending request to', requestUrl, 'with data', JSON.stringify(requestBody));
  
  // Use XMLHttpRequest instead of fetch for better compatibility
  const xhr = new XMLHttpRequest();
  xhr.open('POST', requestUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      console.log('TTS Extension: XHR response received', {
        status: xhr.status,
        response: xhr.responseText.substring(0, 100) + '...'
      });
      
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('TTS Extension: Audio data received', data);
          
          if (data.audioUrl) {
            // Play the audio
            playAudio(data.audioUrl);
            
            // Add to history
            chrome.runtime.sendMessage({
              action: 'addToHistory',
              text: text,
              audioUrl: data.audioUrl,
              model: settings.ttsModel
            });
          } else {
            throw new Error('No audio URL returned from server');
          }
        } catch (error) {
          console.error('TTS Extension: Error parsing response:', error);
          showErrorMessage('Invalid server response');
        }
      } else {
        console.error('TTS Extension: Server error', xhr.status, xhr.responseText);
        showErrorMessage(`Server returned ${xhr.status}: ${xhr.responseText}`);
      }
      
      // Reset processing state
      isProcessing = false;
      if (floatingButton) {
        floatingButton.classList.remove('loading');
      }
    }
  };
  
  xhr.onerror = function() {
    console.error('TTS Extension: Network error occurred');
    showErrorMessage('Network error connecting to TTS server');
    
    isProcessing = false;
    if (floatingButton) {
      floatingButton.classList.remove('loading');
    }
  };
  
  xhr.send(JSON.stringify(requestBody));
}

// Play audio from URL
function playAudio(audioUrl) {
  console.log('TTS Extension: Playing audio from URL', audioUrl);
  if (audioPlayer) {
    audioPlayer.src = audioUrl;
    audioPlayer.oncanplaythrough = () => {
      audioPlayer.play()
        .catch(error => {
          console.error('TTS Extension: Error playing audio:', error);
          showErrorMessage('Could not play audio');
        });
    };
    audioPlayer.onerror = (e) => {
      console.error('TTS Extension: Error loading audio', e);
      showErrorMessage('Could not load audio');
    };
  }
}

// Show error message near floating button
function showErrorMessage(message) {
  console.error('TTS Extension: Error:', message);
  
  if (!floatingButton) return;
  
  const errorPopup = document.createElement('div');
  errorPopup.style.cssText = `
    position: absolute;
    left: ${parseInt(floatingButton.style.left) + 40}px;
    top: ${floatingButton.style.top};
    background-color: #FEF2F2;
    color: #DC2626;
    border: 1px solid #DC2626;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 14px;
    z-index: 10000;
    max-width: 300px;
  `;
  errorPopup.textContent = message;
  
  document.body.appendChild(errorPopup);
  
  // Remove error message after a few seconds
  setTimeout(() => {
    if (errorPopup.parentNode) {
      errorPopup.parentNode.removeChild(errorPopup);
    }
  }, 3000);
}

// Handle messages from background script
function handleMessage(message, sender, sendResponse) {
  console.log('TTS Extension: Message received', message);
  if (message.action === 'speakText') {
    processTextToSpeech(message.text, message.settings);
  } else if (message.action === 'playFromHistory') {
    playAudio(message.audioUrl);
  }
}

// Initialize the content script
initialize();