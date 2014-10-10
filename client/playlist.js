var Player = require('./player')
var $playlist = document.querySelector('.playlist')

module.exports.addTrack = function(opt) {
    var $li = document.createElement('li')
    $li.innerText = opt.title
    $playlist.appendChild($li)

    var $a = document.createElement('a')
    $a.innerText = " [play]"
    $a.addEventListener('click', function(){
        Player.setAudio(opt.file);
        setTimeout(function(){
            Player.play();
        }, 500)
    })
    $li.appendChild($a)
}
