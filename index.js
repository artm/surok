let WaveSurfer = require("wavesurfer");
let wavesurfer = WaveSurfer.create({
  container: "#wave",
  height: 60,
  barWidth: 2,
  hideScrollbar: true
});
wavesurfer.load("./tmp/harry.mp3");

require("wavesurfer/plugin/wavesurfer.minimap");
require("wavesurfer/plugin/wavesurfer.regions");
let minimap;
wavesurfer.on('ready', function () {
  minimap = wavesurfer.initMinimap({
    height: 30,
    barHeight: 10,
    barWidth: null
  });
  wavesurfer.zoom(25);
  findSegments(wavesurfer);
});

let $ = require("jquery");
let play = $("#play-button");
play.click(function() {
  wavesurfer.playPause();
  let label = wavesurfer.isPlaying() ? "pause" : "play";
  play.text(label);
});

function findSegments(ws) {
  let ctx = ws.backend.ac;
  let peaks = ws.backend.getPeaks(100000, 0, 99999);
  let bits = threshold(normalize(peaks), 0.01);
  let peakLen = ws.getDuration() / peaks.length;
  let segments = segmentBits(bits, peakLen, 1, 0.4);
  for(let i in segments) {
    wavesurfer.addRegion(segments[i]);
  }
}

function normalize(samples) {
  let max = 0;
  for(let i in samples) {
    let sample = samples[i];
    max = Math.max(max, Math.abs(sample));
  }

  let normalized = [];
  for(let i in samples) {
    let sample = Math.abs(samples[i]);
    normalized.push(sample / max);
  }

  return normalized;
}

function threshold(samples, threshold) {
  let bits = [];
  for(let i in samples) {
    let sample = Math.abs(samples[i]);
    let bit = sample > threshold;
    bits.push(bit);
  }

  return bits;
}

function segmentBits(bits, bitLen, minSegLen, minGapLen) {
  let segments = [];
  let currentSegment, currentGap;
  for(let i in bits) {
    let offset = i * bitLen;
    let bit = bits[i];
    if (bit) {
      currentGap = null;
      if (!currentSegment) {
        currentSegment = {
          start: offset,
          drag: false,
          resize: false
        };
      }
    } else {
      if (currentSegment) {
        if (!currentGap) {
          currentGap = {
            start: offset
          }
        }
        let gapLen = offset - currentGap.start;
        let segLen = offset - currentSegment.start - gapLen;
        if (segLen > minSegLen && gapLen > minGapLen) {
          currentSegment.end = currentGap.start;
          segments.push(currentSegment);
          currentSegment = null;
        }
      }
    }
  }
  if (currentSegment) {
    currentSegment.end = offset;
    segments.push(currentSegment);
  }
  return segments;
}
