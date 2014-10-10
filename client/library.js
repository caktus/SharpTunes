var Client = require('bittorrent-client')

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
}

function onShareTrack(msg) {
    Library.download(msg.infoHash);
}

function onTorrent(torrent) {
    console.log('SHARE', torrent.infoHash)
    if (torrent.infoHash in Library._torrents) {
        Peers.broadcast({type: "sharetrack", infoHash: torrent.infoHash})
    } else {
        Library._torrents[torrent.infoHash] = torrent;
        Peers.broadcast({type: "sharetrack", infoHash: torrent.infoHash})

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
