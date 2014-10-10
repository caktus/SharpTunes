var concat = require('concat-stream')
var events = require('events')

var Peers = require('./peers')
var Playlist = require('./playlist')

var $player = document.querySelector('audio')

$player.addEventListener('ended', function() {
    Peers.broadcast({type: 'player', action: 'ended'})
    Player.emit('trackend')
})

var Player = module.exports = {
    setAudio: function(file) {
        file.createReadStream().pipe(concat(function (buf) {
            $player.src = URL.createObjectURL(new Blob([ buf ]))
        }))
    },

    play: function() {
        $player.play()
    },

    pause: function() {
        $player.pause()
    },

    isPaused: function() {
        return $player.paused
    },

    _ee: new events.EventEmitter(),
    on: function() {
        this._ee.on.apply(this, arguments)
    },
    emit: function() {
        this._ee.emit.apply(this, arguments)
    },
}
