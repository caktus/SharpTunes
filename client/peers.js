var Tracker = require('webtorrent-tracker')
var concat = require('concat-stream')
var hat = require('hat')

var Playlist = require('./playlist')
var Player = require('./player')
var Library = require('./library')
var UI = require('./ui')

// WebTorrent

var peers = []
module.exports.peerId = new Buffer(hat(160), 'hex')
var tracker = new Tracker(module.exports.peerId, {
    announce: [ 'wss://tracker.webtorrent.io' ], // TODO run local
    infoHash: new Buffer(20) // all zeroes in the browser
})
tracker.start();

tracker.on('peer', function (peer) {
    peers.push(peer)
    UI.$peerCount.innerText = peers.length
    peer.send({ type: "welcome", peer: module.exports.peerId })
    for (var hash in Library._torrents) {
        var torrent = Library._torrents[hash];
        var files = [];
        torrent.files.forEach(function(file) {
            file.createReadStream().pipe(concat(function (buf) {
                var f = {
                    buffer: buf,
                    lastModifiedDate: new Date(),
                    name: file.name,
                    size: file.length,
                    type: "audio/mp3",
                }
                Library.seedFile(f)
            }))

        })
    }
    peer.on('message', onMessage.bind(undefined, peer))

    function onClose () {
        peers.splice(peers.indexOf(peer), 1)
        UI.$peerCount.innerText = peers.length
    }
    peer.on('close', onClose)
    peer.on('error', onClose)
})


function onMessage (peer, data) {
    if (typeof data === "string") {
        data = JSON.parse(data)
    }
    console.log(data)

    if (data.type === 'welcome') {
        // data.hzxhdx.forEach(function(infoHash) {
        //     download(infoHash)
        // })
    } else {
        var callbacks = messageCallbacks[data.type]
        if (callbacks) {
            callbacks.forEach(function(cb) {
                cb(data)
            })
        }
    }
}
messageCallbacks = {}

function broadcast (obj) {
    peers.forEach(function (peer) {
        peer.send(obj)
    })
}

module.exports.broadcast = broadcast
module.exports.on = function(type, cb) {
    var callbacks = messageCallbacks[type];
    if (!callbacks) {
        callbacks = messageCallbacks[type] = []
    }
    callbacks.push(cb)
}
