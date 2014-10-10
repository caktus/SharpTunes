var concat = require('concat-stream')
var prettysize = require('prettysize')

var Playlist = require('./playlist')
var Player = require('./player')
var Peers = require('./peers')

// Audio

window.context = null;
window.addEventListener('load', init, false);
function init() {
    try {
      // Fix up for prefixing
      window.AudioContext = window.AudioContext||window.webkitAudioContext;
      window.context = new AudioContext();
    }
    catch(e) {
        alert('Web Audio API is not supported in this browser');
    }
}
