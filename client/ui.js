var mustache = require('mustache')

var UI = module.exports = {
    "$player": document.querySelector('audio'),

    renderPlaylist: function(tracks) {
        var output = Mustache.render(templates.playlist, tracks)
    },

    loadTemplates: function() {

    },
}

var templates = {}
