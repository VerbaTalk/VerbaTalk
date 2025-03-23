<template>
  <div class="setting-group">
    <label :for="id">{{ label }}</label>
    <select 
      :id="id" 
      class="setting-input"
      v-model="selectedValue"
      @change="handleValueChange"
    >
      <option 
        v-for="option in options" 
        :key="option.id" 
        :value="option.id"
      >
        {{ option.name }}
      </option>
      <option value="custom">Custom</option>
    </select>
    
    <input 
      v-if="selectedValue === 'custom'" 
      type="text" 
      class="setting-input custom-input"
      :placeholder="customPlaceholder"
      v-model="customValueInput"
      @input="handleCustomValueChange"
    />
  </div>
</template>

<script>
export default {
  name: 'ModelSelector',
  props: {
    id: String,
    label: String,
    options: Array,
    value: String,
    customValue: String,
    customPlaceholder: String
  },
  data() {
    return {
      selectedValue: this.value,
      customValueInput: this.customValue
    };
  },
  watch: {
    value(newValue) {
      this.selectedValue = newValue;
    },
    customValue(newValue) {
      this.customValueInput = newValue;
    }
  },
  methods: {
    handleValueChange() {
      this.$emit('update:value', this.selectedValue);
    },
    handleCustomValueChange() {
      this.$emit('update:customValue', this.customValueInput);
    }
  }
};
</script>

<style scoped>
.custom-input:focus {
  border-color: var(--primary-light);
  border-left: 3px solid var(--primary-light);
  box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.25);
}
</style> 