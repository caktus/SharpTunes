var concat = require('concat-stream')
var events = require('events')

var Peers = require('./peers')
var Library = require('./library')

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

    playTrack: function(trackId) {
        Library.readTrackFile(trackId, function(err, buf) {
            $player.src = URL.createObjectURL(new Blob([ buf ]))
            Player.play();
        })
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
