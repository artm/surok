export default class {
  constructor(wavesurfer) {
    this.wavesurfer = wavesurfer;
  }

  findSegments() {
    let ctx = this.wavesurfer.backend.ac;
    let peaks = this.wavesurfer.backend.getPeaks(100000, 0, 99999);
    let bits = this.threshold(this.normalize(peaks), 0.01);
    let peakLen = this.wavesurfer.getDuration() / peaks.length;
    let segments = this.segmentBits(bits, peakLen, 1, 0.4);
    for(let i in segments) {
      wavesurfer.addRegion(segments[i]);
    }
  }

  normalize(samples) {
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

  threshold(samples, threshold) {
    let bits = [];
    for(let i in samples) {
      let sample = Math.abs(samples[i]);
      let bit = sample > threshold;
      bits.push(bit);
    }
    return bits;
  }

  segmentBits(bits, bitLen, minSegLen, minGapLen) {
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

};
