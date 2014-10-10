var concat = require('concat-stream')

var Peers = require('./peers')
var Playlist = require('./playlist')

var $player = document.querySelector('audio')

$player.addEventListener('play', function() {
    Peers.broadcast({type: 'player', action: 'play'})
})
$player.addEventListener('pause', function() {
    Peers.broadcast({type: 'player', action: 'pause'})
})
$player.addEventListener('ended', function() {
    Peers.broadcast({type: 'player', action: 'ended'})
    Playlist.next()
})

module.exports.setAudio = function(file) {
    file.createReadStream().pipe(concat(function (buf) {
        $player.src = URL.createObjectURL(new Blob([ buf ]))
    }))
}

module.exports.play = function() {
    $player.play()
}

module.exports.pause = function() {
    $player.pause()
}

module.exports.isPaused = function() {
    return $player.paused
}
