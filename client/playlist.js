var Player = require('./player')
var Peers = require('./peers')
var $playlist = document.querySelector('.playlist')

var playlist = []
var position = 0

module.exports.addTrack = function(opt) {
    playlist.push(opt)
    var i = playlist.length - 1

    var $li = document.createElement('li')
    $li.innerText = opt.title
    $playlist.appendChild($li)

    var $a = document.createElement('a')
    $a.innerText = " [play]"
    $a.addEventListener('click', function(){
        Player.setAudio(opt.file);
        setTimeout(function(){
            module.exports.play(i);
        }, 500)
    })
    $li.appendChild($a)
}

module.exports.next = function() {
    position ++
    module.exports.playCurrent()
}

module.exports.getFilePosition = function(filename) {
    for (var i=0; i < playlist.length; i++) {
        if (playlist[i].file.name === filename) {
            return i
        }
    }
}

module.exports.playCurrent = function() {
    module.exports.play(position)
}

module.exports.play = function(trackNumber) {
    var track = playlist[trackNumber]
    Player.setAudio(track.file)
    Peers.broadcast({type: "trackChange", trackNumber: trackNumber})
    setTimeout(function(){
        Player.play()
    }, 500)
}

Peers.on("trackChange", function(data) {
    if (data.trackNumber !== position || Player.isPaused()) {
        position = data.trackNumber
        module.exports.playCurrent()
    }
})
