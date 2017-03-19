let WaveSurfer = require("wavesurfer");
let wavesurfer = WaveSurfer.create({
  container: "#wave",
  height: 60,
  barWidth: 2,
  hideScrollbar: true
});
wavesurfer.load("./tmp/harry.mp3");

require("wavesurfer/plugin/wavesurfer.minimap");
let minimap;
wavesurfer.on('ready', function () {
  minimap = wavesurfer.initMinimap({
    height: 30,
    barHeight: 10,
    barWidth: null
  });
  wavesurfer.zoom(25);
});

let $ = require("jquery");
let play = $("#play-button");
play.click(function() {
  wavesurfer.playPause();
  let label = wavesurfer.isPlaying() ? "pause" : "play";
  play.text(label);
});
