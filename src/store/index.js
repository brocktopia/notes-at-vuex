import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import notebooks from './modules/notebooks'
import notes from './modules/notes'

Vue.use(Vuex);

// Setup AxiosJS object

let servicePort,
  serviceUrl = window.location.protocol + '//' + window.location.host;
if (serviceUrl.lastIndexOf(':') > 6) { // strip port # off of serviceUrl
  serviceUrl = serviceUrl.substr(0, serviceUrl.lastIndexOf(':'));
}
// determine port based on ssl
if (window.location.protocol.indexOf('https') != -1) {
  // IMPORTANT - This requires the use of server-ssl.js. server.js doesn't listen for port 3031
  servicePort = ':3031/'
} else {
  servicePort = ':3030/';
}
console.log('store/index.js axois serviceUrl [' + serviceUrl + servicePort + ']');
Vuex.Store.prototype.$axios = axios.create({
  baseURL: serviceUrl + servicePort
});

// Create Store

export default new Vuex.Store({
  strict: true,
  modules: {
    notebooks,
    notes
  }
})