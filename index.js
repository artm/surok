// no idea how to import these with ES6 syntax
let WaveSurfer = require("wavesurfer");
require("wavesurfer/plugin/wavesurfer.minimap");
require("wavesurfer/plugin/wavesurfer.regions");

import $ from "jquery";
import Segmentator from "./segmentator";
import Playtomaton from "./playtomaton";

let wavesurfer = WaveSurfer.create({
  container: "#wave",
  height: 60,
  barWidth: 2,
  hideScrollbar: true,
  interact: false
});
wavesurfer.load("./tmp/harry.mp3");

let minimap;
let segmentator;
wavesurfer.on("ready", () => {
  minimap = wavesurfer.initMinimap({
    height: 30,
    barHeight: 10,
    barWidth: null,
    interact: true
  });
  wavesurfer.zoom(25);
  let peaks = wavesurfer.backend.getPeaks(100000, 0, 99999);
  let segmentator = new Segmentator();
  let segments = segmentator.findSegments(peaks, wavesurfer.getDuration());
  for(let i in segments) {
    wavesurfer.addRegion(segments[i]);
  }
});

let playtomaton = new Playtomaton(wavesurfer);

let play = $("#play-button");
play.click(() => {
  playtomaton.playPause();
  let label = wavesurfer.isPlaying() ? "pause" : "play";
  play.text(label);
});
