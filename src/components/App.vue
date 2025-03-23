<template>
  <div class="container">
    <header class="header">
      <h1>VerbaTalk</h1>
      <p class="slogan">Every Word Understood, Every Voice Heard</p>
      <div id="language-selector" class="language-selector">
        <button id="language-button" class="icon-button" @click="toggleLanguageDropdown">
          🌐
        </button>
        <div id="language-dropdown" class="language-dropdown" :class="{ active: showLanguageDropdown }">
          <div 
            v-for="language in languages" 
            :key="language.code"
            class="language-option" 
            :class="{ active: selectedLanguage === language.code }"
            :data-lang="language.code"
            @click="selectLanguage(language.code)"
          >
            {{ language.name }}
          </div>
        </div>
      </div>
    </header>
    
    <Tabs 
      :initial-tab="activeTab" 
      @tab-change="handleTabChange"
    >
      <template #settings-tab>
        <SettingsTab />
      </template>
      
      <template #history-tab>
        <HistoryTab />
      </template>
    </Tabs>
  </div>
</template>

<script>
import Tabs from './Tabs.vue';
import SettingsTab from './SettingsTab.vue';
import HistoryTab from './HistoryTab.vue';

export default {
  name: 'App',
  components: {
    Tabs,
    SettingsTab,
    HistoryTab
  },
  data() {
    return {
      activeTab: 'settings-tab',
      showLanguageDropdown: false,
      selectedLanguage: 'auto',
      languages: [
        { code: 'auto', name: 'Auto' },
        { code: 'zh-CN', name: '简体中文' },
        { code: 'zh-TW', name: '繁體中文' },
        { code: 'en', name: 'English' }
      ]
    };
  },
  mounted() {
    // Load selected language from storage
    chrome.storage.sync.get({ language: 'auto' }, (data) => {
      this.selectedLanguage = data.language;
    });
    
    // Close language dropdown when clicking outside
    document.addEventListener('click', this.closeDropdownOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdownOutside);
  },
  methods: {
    handleTabChange(tabId) {
      this.activeTab = tabId;
    },
    
    toggleLanguageDropdown(event) {
      event.stopPropagation();
      this.showLanguageDropdown = !this.showLanguageDropdown;
    },
    
    selectLanguage(language) {
      this.selectedLanguage = language;
      this.showLanguageDropdown = false;
      
      // Save selected language to storage
      chrome.storage.sync.set({ language });
      
      // Notify content script of language change
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateLanguage',
            language
          });
        }
      });
    },
    
    closeDropdownOutside(event) {
      const dropdown = document.getElementById('language-dropdown');
      const button = document.getElementById('language-button');
      
      if (dropdown && button) {
        if (!dropdown.contains(event.target) && !button.contains(event.target)) {
          this.showLanguageDropdown = false;
        }
      }
    }
  }
}
</script> 