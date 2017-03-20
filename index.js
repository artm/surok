// no idea how to import these with ES6 syntax
let WaveSurfer = require("wavesurfer");
require("wavesurfer/plugin/wavesurfer.minimap");
require("wavesurfer/plugin/wavesurfer.regions");

import $ from "jquery";
import Segmentator from "./segmentator";

let wavesurfer = WaveSurfer.create({
  container: "#wave",
  height: 60,
  barWidth: 2,
  hideScrollbar: true
});
wavesurfer.load("./tmp/harry.mp3");

let minimap;
let segmentator;
wavesurfer.on('ready', () => {
  minimap = wavesurfer.initMinimap({
    height: 30,
    barHeight: 10,
    barWidth: null
  });
  wavesurfer.zoom(25);
  segmentator = new Segmentator(wavesurfer);
  segmentator.findSegments();
});

let play = $("#play-button");
play.click(() => {
  wavesurfer.playPause();
  let label = wavesurfer.isPlaying() ? "pause" : "play";
  play.text(label);
});

