<template>
  <div class="tabs-container">
    <div class="tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab" 
        :class="{ active: activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
        :data-tab="tab.id"
      >
        {{ tab.label }}
      </div>
    </div>
    
    <div class="tab-content-container">
      <div 
        v-for="tab in tabs" 
        :key="`content-${tab.id}`"
        :id="tab.id"
        class="tab-content"
        :class="{ active: activeTab === tab.id }"
      >
        <slot :name="tab.id"></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tabs',
  props: {
    initialTab: {
      type: String,
      default: 'settings-tab'
    },
    tabs: {
      type: Array,
      default: () => [
        { id: 'settings-tab', label: 'Settings' },
        { id: 'history-tab', label: 'History' }
      ]
    }
  },
  data() {
    return {
      activeTab: this.initialTab
    };
  },
  methods: {
    setActiveTab(tabId) {
      this.activeTab = tabId;
      this.$emit('tab-change', tabId);
    }
  }
}
</script> 