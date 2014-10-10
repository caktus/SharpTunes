var events = require('events')

var PouchDB = require('pouchdb')
window.PouchDB = PouchDB // TODO for testing

var dragDrop = require('drag-drop/buffer')
// TODO: this seems out of place
dragDrop('body', function (files) {
    files.forEach(function(file){
        Library.save(file, {own: true})
    })
})

var Peers = require('./peers')
var Playlist = require('./playlist')

var Library = module.exports = {
    init: function() {
        Peers.on('sharetrack', onShareTrack)
        this.db = new PouchDB('SharpTunesLibrary')
        this.db.query({map: function(doc){emit(doc)}}, {}, function(err, resp) {
            resp.rows.forEach(function(row) {
                if (row.key._attachments) {
                    Library.emit('readyfile', row.id)
                } else {
                    Library.db.remove(row.id)
                }
            })
        })
    },

    save: function(file, options) {
        var options = options||{}
        var track = {
            _id: file.name,
            title: file.name,
            type: file.type,
            owned: options.owned||false,
        }
        this.db.get(file.name, function(err, r) {
            if (err) {
                Library.db.put(track, storeFile)
            } else {
                storeFile(err, r)
            }
            function storeFile(err, r){
                if (err) {
                    console.error(err)
                } else {
                    Library.db.putAttachment(r._id, "file", r._rev, new Blob([file.buffer]), file.type, function(err, r){
                        console.log(err, r)
                    })
                }
            }
        })
    },
    readTrackFile: function(trackId, cb) {
        this.db.getAttachment(trackId, "file", function(err, buffer) {
            cb(err, buffer)
        })
    },

    _ee: new events.EventEmitter(),
    on: function() {
        this._ee.on.apply(this, arguments)
    },
    emit: function() {
        this._ee.emit.apply(this, arguments)
    },
}

function onShareTrack(msg) {

}
