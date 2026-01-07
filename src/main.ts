import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css"; // Ensure styles are loaded
import "vue-sonner/style.css";
import i18n from "./i18n";

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
app.mount("#app");
