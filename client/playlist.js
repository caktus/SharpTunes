var Player = require('./player')
var Peers = require('./peers')
var $playlist = document.querySelector('.playlist')

var playlist = []
var position = 0

module.exports.addTrack = function(opt) {
    playlist.push(opt)
    module.exports.alphabetizePlaylist()
    var i = playlist.length - 1

    $playlist.innerText = ""

    playlist.forEach(function(entry) {
        var $li = document.createElement('li')
        $li.innerText = entry.title
        $playlist.appendChild($li)

        var $a = document.createElement('a')
        $a.innerText = " [play]"
        $a.addEventListener('click', function(){
            Player.setAudio(entry.file);
            setTimeout(function(){
                module.exports.play(module.exports.getFilePosition(entry.file.name));
            }, 500)
        })
        $li.appendChild($a)
    })
}

module.exports.alphabetizePlaylist = function() {
    playlist.sort(function(a, b) {
        return a.file.name > b.file.name;
    })
}

module.exports.next = function() {
    position ++
    if (position === playlist.length) {
        position = 0;
    }
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
