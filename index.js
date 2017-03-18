let WaveSurfer = require("wavesurfer");
let wavesurfer = WaveSurfer.create({
  container: "#wave",
  height: 30
});
wavesurfer.load("./tmp/harry.mp3");

let $ = require("jquery");
let play = $("#play-button");
play.click(function() {
  wavesurfer.playPause();
  let label = wavesurfer.isPlaying() ? "pause" : "play";
  play.text(label);
});
