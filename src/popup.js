import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './components/App.vue';

// Create Pinia store
const pinia = createPinia();

// Create and mount Vue app
const app = createApp(App);
app.use(pinia);
app.mount('#app'); 