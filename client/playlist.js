var Player = require('./player')
var Peers = require('./peers')
var Library = require('./library')
var $playlist = document.querySelector('.playlist')

var playlist = []
var position = 0

var Playlist = module.exports = {
    addTrack: function(opt) {
        playlist.push(opt)
        module.exports.alphabetizePlaylist()
        this.redrawPlaylist()
    },

    redrawPlaylist: function() {
        $playlist.innerText = ""

        playlist.forEach(function(entry, i) {
            var $li = document.createElement('li')
            if (i === position) {
                $li.classList.add('current')
            }
            $li.innerText = entry.title
            $playlist.appendChild($li)

            var $a = document.createElement('a')
            $a.innerText = " [play]"
            $a.addEventListener('click', function(){
                Player.playTrack(entry.id);
                Playlist.redrawPlaylist()
            })
            $li.appendChild($a)
        })
    },

    alphabetizePlaylist: function() {
        playlist.sort(function(a, b) {
            return a.title > b.title;
        })
    },

    next: function() {
        position ++
        if (position === playlist.length) {
            position = 0;
        }
        module.exports.playCurrent()
    },

    getFilePosition: function(filename) {
        for (var i=0; i < playlist.length; i++) {
            if (playlist[i].file.name === filename) {
                return i
            }
        }
    },

    playCurrent: function() {
        module.exports.play(position)
    },

    play: function(trackNumber) {
        var track = playlist[trackNumber]
        Player.setAudio(track.file)
        Peers.broadcast({type: "trackChange", trackNumber: trackNumber})
        setTimeout(function(){
            Player.play()
        }, 500)

        this.redrawPlaylist()
    },
}

document.querySelector('#mute').addEventListener('click', function() {
    var audio = document.querySelector('audio')
    audio.muted = !audio.muted
    var mute = document.querySelector('#mute')
    mute.innerText = mute.innerText == 'Mute' ? 'Unmute' : 'Mute'
})

Peers.on("trackChange", function(data) {
    if (data.trackNumber !== position || Player.isPaused()) {
        position = data.trackNumber
        module.exports.playCurrent()
        Playlist.redrawPlaylist()
    }
})

Library.on("newtrack", function(track) {
    Playlist.addTrack({
        title: track.name,
        // file: track,
    })
})

Library.on("readyfile", function(trackId) {
    Playlist.addTrack({
        id: trackId,
        title: trackId,
        // file: track,
    })
})

Player.on('trackend', function() {
    Playlist.next()
})
