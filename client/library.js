var Client = require('bittorrent-client')
var events = require('events')

var PouchDB = require('pouchdb')
window.PouchDB = PouchDB

var dragDrop = require('drag-drop/buffer')
// TODO: this seems out of place
dragDrop('body', function (files) {
    files.forEach(function(file){
        Library._client.seed([file], onTorrent)
    })
})

var Peers = require('./peers')
var Playlist = require('./playlist')

var Library = module.exports = {
    init: function() {
        this._client = new Client({ peerId: Peers.peerId })
        Peers.on('sharetrack', onShareTrack)
    },
    download: function(infoHash) {
        this._client.add({
            infoHash: infoHash,
            announce: [ 'wss://tracker.webtorrent.io' ]
        }, onTorrent)
    },
    seedFile: function(f) {
        this._client.seed([f], onTorrent)
    },
    seedAllFiles: function() {
        var allFiles = Playlist.getAllFiles()
        this._client.seed(allFiles, onTorrent)
    },

    _client: null,
    _tracks: {},
    _torrents: [],

    _ee: new events.EventEmitter(),
    on: function() {
        this._ee.on.apply(this, arguments)
    },
    emit: function() {
        this._ee.emit.apply(this, arguments)
    },
}

function onShareTrack(msg) {
    Library.download(msg.infoHash);
}

function onTorrent(torrent) {
    if (torrent.infoHash in Library._torrents) {
        Peers.broadcast({type: "sharetrack", infoHash: torrent.infoHash})
    } else {
        Library._torrents[torrent.infoHash] = torrent;
        Peers.broadcast({type: "sharetrack", infoHash: torrent.infoHash})

        torrent.swarm.on('download', function () {
            // var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
            // console.log(torrent.infoHash, progress)
        })

        torrent.files.forEach(function (file) {
            Library.emit('newtrack', file)
        })
    }
}
