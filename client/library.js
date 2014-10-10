var Client = require('bittorrent-client')
var events = require('events')

var PouchDB = require('pouchdb')
window.PouchDB = PouchDB // TODO for testing

var dragDrop = require('drag-drop/buffer')
// TODO: this seems out of place
dragDrop('body', function (files) {
    files.forEach(function(file){
        Library._client.seed([file], onTorrent)
        Library.save(file, {own: true})
    })
})

var Peers = require('./peers')
var Playlist = require('./playlist')

var Library = module.exports = {
    init: function() {
        this._client = new Client({ peerId: Peers.peerId })
        Peers.on('sharetrack', onShareTrack)
        this.db = new PouchDB('SharpTunesLibrary')
        this.db.query({map: function(doc){emit(doc)}}, {}, function(err, resp) {
            resp.rows.forEach(function(row) {
                if (row.key._attachments) {
                    Library.emit('readyfile', row.id)
                }
            })
        })
    },
    download: function(infoHash) {
        this._client.add({
            infoHash: infoHash,
            announce: [ 'wss://tracker.webtorrent.io' ]
        }, onTorrent)
    },
    save: function(file, options) {
        console.log("need to save", file)
        var options = options||{}
        var track = {
            _id: file.name,
            title: file.name,
            type: file.type,
            owned: options.owned||false,
        }
        this.db.put(track, function(err, r){
            if (err) {
                console.error(err)
            } else {
                console.log(r)
                Library.db.putAttachment(track._id, "file", r.rev, new Blob([file.buffer]), file.type, function(err, r){
                    console.log(err, r)
                })
            }
        })
    },
    readTrackFile: function(trackId, cb) {
        this.db.getAttachment(trackId, "file", function(err, buffer) {
            cb(err, buffer)
        })
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
            var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
            console.log(torrent.infoHash, progress)
        })

        torrent.files.forEach(function (file) {
            Library.emit('newtrack', file)
        })
    }
}
