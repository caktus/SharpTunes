var concat = require('concat-stream')
var hat = require('hat')

var Playlist = require('./playlist')
var Player = require('./player')
var Library = require('./library')
var UI = require('./ui')


var peers = []
var peerId = hat(160)
var self = new Peer(peerId, {key: "z6jdti67t359udi"})


function onMessage (peer, data) {
    if (typeof data === "string") {
        data = JSON.parse(data)
    }
    console.log(data)

    if (data.type === 'welcome') {
        Library.seedAllFiles()
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
