var concat = require('concat-stream')

var $player = document.querySelector('audio')

module.exports.setAudio = function(file) {
    file.createReadStream().pipe(concat(function (buf) {
        $player.src = URL.createObjectURL(new Blob([ buf ]))
    }))
}

module.exports.play = function() {
    $player.play()
}

module.exports.pause = function() {
    $player.pause()
}
