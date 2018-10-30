import Vue from 'vue'
import App from './App'
import router from './router'
import moment from 'moment'
import * as VueGoogleMaps from 'vue2-google-maps'
import googleConfig from './google-maps-config'
import store from './store'
import './css/style.scss'
import './assets/svg/symbols.svg'

Vue.config.productionTip = false;

// Moved map config to external file to reduce chances of committing secret key
Vue.use(VueGoogleMaps, {
  load: googleConfig
});

Vue.prototype.$moment = moment;

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
});
