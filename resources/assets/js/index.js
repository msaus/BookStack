import "babel-polyfill"
import "./dom-polyfills"

import jQuery from "jquery"
window.jQuery = window.$ = jQuery;

import "./pages/page-show"
import Translations from "./translations"
import vues from "./vues/vues"
import components from "./components"

import Vue from "vue"
import axios from "axios"

// Url retrieval function
window.baseUrl = function(path) {
    let basePath = document.querySelector('meta[name="base-url"]').getAttribute('content');
    if (basePath[basePath.length-1] === '/') basePath = basePath.slice(0, basePath.length-1);
    if (path[0] === '/') path = path.slice(1);
    return basePath + '/' + path;
};

// Global Event System
class EventManager {
    constructor() {
        this.listeners = {};
        this.stack = [];
    }

    emit(eventName, eventData) {
        this.stack.push({name: eventName, data: eventData});
        if (typeof this.listeners[eventName] === 'undefined') return this;
        let eventsToStart = this.listeners[eventName];
        for (let i = 0; i < eventsToStart.length; i++) {
            let event = eventsToStart[i];
            event(eventData);
        }
        return this;
    }

    listen(eventName, callback) {
        if (typeof this.listeners[eventName] === 'undefined') this.listeners[eventName] = [];
        this.listeners[eventName].push(callback);
        return this;
    }
}

window.$events = new EventManager();

let axiosInstance = axios.create({
    headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name=token]').getAttribute('content'),
        'baseURL': window.baseUrl('')
    }
});
axiosInstance.interceptors.request.use(resp => {
    return resp;
}, err => {
    if (typeof err.response === "undefined" || typeof err.response.data === "undefined") return Promise.reject(err);
    if (typeof err.response.data.error !== "undefined") window.$events.emit('error', err.response.data.error);
    if (typeof err.response.data.message !== "undefined") window.$events.emit('error', err.response.data.message);
});
window.$http = axiosInstance;

Vue.prototype.$http = axiosInstance;
Vue.prototype.$events = window.$events;

// Translation setup
// Creates a global function with name 'trans' to be used in the same way as Laravel's translation system
let translator = new Translations(window.translations);
window.trans = translator.get.bind(translator);
window.trans_choice = translator.getPlural.bind(translator);

// Load vues and components
vues();
components();


//Global jQuery Config & Extensions

/**
 * Scroll the view to a specific element.
 * @param {HTMLElement} element
 */
window.scrollToElement = function(element) {
    if (!element) return;
    let offset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    let top = element.getBoundingClientRect().top + offset;
    $('html, body').animate({
        scrollTop: top - 60 // Adjust to change final scroll position top margin
    }, 300);
};

/**
 * Scroll and highlight an element.
 * @param {HTMLElement} element
 */
window.scrollAndHighlight = function(element) {
    if (!element) return;
    window.scrollToElement(element);
    let color = document.getElementById('custom-styles').getAttribute('data-color-light');
    let initColor = window.getComputedStyle(element).getPropertyValue('background-color');
    element.style.backgroundColor = color;
    setTimeout(() => {
        element.classList.add('selectFade');
        element.style.backgroundColor = initColor;
    }, 10);
    setTimeout(() => {
        element.classList.remove('selectFade');
        element.style.backgroundColor = '';
    }, 3000);
};

// Smooth scrolling
jQuery.fn.smoothScrollTo = function () {
    if (this.length === 0) return;
    window.scrollToElement(this[0]);
    return this;
};

// Making contains text expression not worry about casing
jQuery.expr[":"].contains = $.expr.createPseudo(function (arg) {
    return function (elem) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

// Detect IE for css
if(navigator.userAgent.indexOf('MSIE')!==-1
    || navigator.appVersion.indexOf('Trident/') > 0
    || navigator.userAgent.indexOf('Safari') !== -1){
    document.body.classList.add('flexbox-support');
}
