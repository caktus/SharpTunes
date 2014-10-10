var Tracker = require('webtorrent-tracker')
var Client = require('bittorrent-client')
var hat = require('hat')
var concat = require('concat-stream')
var dragDrop = require('drag-drop/buffer')
dragDrop('body', function (files) {
    files.forEach(function(file){
        client.seed([file], onTorrent)
    })
})

var Playlist = require('./playlist')
var Player = require('./player')

// WebTorrent

var torrents = {}
var peers = []
var peerId = new Buffer(hat(160), 'hex')
var client = new Client({ peerId: peerId })
var tracker = new Tracker(peerId, {
    announce: [ 'wss://tracker.webtorrent.io' ], // TODO run local
    infoHash: new Buffer(20) // all zeroes in the browser
})
tracker.start();

tracker.on('peer', function (peer) {
    peers.push(peer)
    peer.send({ type: "welcome" })
    for (var hash in torrents) {
        var torrent = torrents[hash];
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
                client.seed([f], onTorrent)
            }))

        })
    }
    peer.on('message', onMessage.bind(undefined, peer))

    function onClose () {
        peers.splice(peers.indexOf(peer), 1)
    }

    peer.on('close', onClose)
    peer.on('error', onClose)
})

function download(infoHash) {
    client.add({
        infoHash: infoHash,
        announce: [ 'wss://tracker.webtorrent.io' ]
    }, onTorrent)
}

function onTorrent(torrent) {
    if (torrent.infoHash in torrents) {
        broadcast({type: "existingfile", infoHash: torrent.infoHash})
    } else {
        torrents[torrent.infoHash] = torrent;
        broadcast({type: "newfile", infoHash: torrent.infoHash})

        torrent.swarm.on('download', function () {
            var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
            // logReplace('progress: ' + progress + '% -- download speed: ' + prettysize(torrent.swarm.downloadSpeed()) + '/s<br>')
        })

        torrent.swarm.on('upload', function () {
            // logReplace('upload speed:' + prettysize(client.uploadSpeed()) + '/s<br>')
        })

        torrent.files.forEach(function (file) {
            Playlist.addTrack({
                title: file.name,
                file: file,
            })
        })
    }
}

function onMessage (peer, data) {
    if (typeof data === "string") {
        data = JSON.parse(data)
    }
    console.log(data)

    if (data.type == 'newfile') {
        download(data.infoHash);
    } else if (data.type == 'existingfile') {
        download(data.infoHash);
    } else if (data.type === 'welcome') {
        // data.hzxhdx.forEach(function(infoHash) {
        //     download(infoHash)
        // })
    } else if (data.type == 'player') {
        switch (data.action) {
            case "play":
                Player.play()
                break;
            case "pause":
                Player.pause()
                break;
            case "change":
                console.log("change", data)
                break;
            default:
                console.error("unknown player event: " + data.action)
                break;
        }
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

module.exports.seedAllFiles = function() {
    var allFiles = Playlist.getAllFiles()
    client.seed(allFiles, onTorrent)
}

module.exports.broadcast = broadcast
module.exports.on = function(type, cb) {
    var callbacks = messageCallbacks[type];
    if (!callbacks) {
        callbacks = messageCallbacks[type] = []
    }
    callbacks.push(cb)
}
module.exports.client = client;
