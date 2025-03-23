<template>
  <div class="setting-group">
    <label for="speed">Speech Rate</label>
    <div class="speed-container">
      <span>Slow</span>
      <input 
        type="range" 
        id="speed" 
        min="0.5" 
        max="2" 
        step="0.1" 
        v-model.number="speedValue"
        @input="handleSpeedChange"
      >
      <span>Fast</span>
      <div class="speed-value">{{ speedValue.toFixed(1) }}x</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpeedSelector',
  props: {
    speed: {
      type: Number,
      default: 1.0
    }
  },
  data() {
    return {
      speedValue: this.speed
    };
  },
  watch: {
    speed(newValue) {
      this.speedValue = newValue;
    }
  },
  methods: {
    handleSpeedChange() {
      this.$emit('update:speed', this.speedValue);
      this.$emit('speed-change', this.speedValue);
    }
  }
}
</script> 