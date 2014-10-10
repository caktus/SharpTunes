var concat = require('concat-stream')
var dragDrop = require('drag-drop/buffer')
var prettysize = require('prettysize')
var hat = require('hat')
var Tracker = require('webtorrent-tracker')
var Client = require('bittorrent-client')

var Playlist = require('./playlist')
var Player = require('./player')

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

window.player = document.querySelector('audio')
player.addEventListener('play', function() {
    broadcast({type: 'player', action: 'play'})
})
player.addEventListener('pause', function() {
    broadcast({type: 'player', action: 'pause'})
})

// WebTorrent

var peers = []
var peerId = new Buffer(hat(160), 'hex')
window.client = new Client({ peerId: peerId })
window.tracker = new Tracker(peerId, {
    announce: [ 'wss://tracker.webtorrent.io' ], // TODO run local
    infoHash: new Buffer(20) // all zeroes in the browser
})
tracker.start();
var hash = window.location.hash.replace('#', '')

tracker.on('peer', function (peer) {
    peers.push(peer)
    peer.send({ type: "welcome" })
    peer.on('message', onMessage.bind(undefined, peer))

    function onClose () {
        peers.splice(peers.indexOf(peer), 1)
    }

    peer.on('close', onClose)
    peer.on('error', onClose)
})

function onMessage (peer, data) {
    console.log(data);
    if (data.type == 'newfile') {
        download(data.infoHash);
    } else if (data.type == 'player') {
        switch (data.action) {
            case "play":
                Player.play()
                break;
            case "pause":
                Player.pause()
                break;
            default:
                console.error("unknown player event: " + data.action)
                break;
        }
    }
}

function broadcast (obj) {
    peers.forEach(function (peer) {
        peer.send(obj)
    })
}

dragDrop('body', function (files) {
    client.seed(files, onTorrent)
})

function download(infoHash) {
    client.add({
        infoHash: infoHash,
        announce: [ 'wss://tracker.webtorrent.io' ]
    }, onTorrent)
}

function onTorrent (torrent) {
    broadcast({type: "newfile", infoHash: torrent.infoHash})

    torrent.swarm.on('download', function () {
        var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
        logReplace('progress: ' + progress + '% -- download speed: ' + prettysize(torrent.swarm.downloadSpeed()) + '/s<br>')
    })

    torrent.swarm.on('upload', function () {
        logReplace('upload speed:' + prettysize(client.uploadSpeed()) + '/s<br>')
    })

    torrent.files.forEach(function (file) {
        Playlist.addTrack({
            title: file.name,
            file: file,
        })
    })
}
