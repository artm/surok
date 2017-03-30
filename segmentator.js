export default class {
  findSegments(peaks, duration) {
    peaks = this.unpairPeaks(peaks);
    let bits = this.threshold(this.normalize(peaks), 0.01);
    let peakLen = duration / peaks.length;
    let segments = this.segmentBits(bits, peakLen, 1, 0.4);
    return segments;
  }

  unpairPeaks(peaks) {
    let unpaired = []
    for(let i = 0; i<peaks.length; i+=2) {
      unpaired[i/2] = Math.max(Math.abs(peaks[i]), Math.abs(peaks[i+1]));
    }
    return unpaired;
  }

  normalize(samples) {
    let max = 0;
    for(let i in samples) {
      let sample = samples[i];
      max = Math.max(max, sample);
    }
    let normalized = [];
    for(let i in samples) {
      let sample = samples[i];
      normalized.push(sample / max);
    }
    return normalized;
  }

  threshold(samples, threshold) {
    let bits = [];
    for(let i in samples) {
      let sample = samples[i];
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
            resize: false,
            data: {}
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
            addSegment(currentSegment);
            currentSegment = null;
          }
        }
      }
    }
    if (currentSegment) {
      currentSegment.end = offset;
      addSegment(currentSegment);
    }
    return segments;

    function addSegment(currentSegment) {
      currentSegment.id = "segment_" + segments.length;
      if (segments.length) {
        let lastSegment = segments[segments.length-1];
        lastSegment.data.nextRegion = currentSegment.id;
        currentSegment.data.prevRegion = lastSegment.id;
      }
      segments.push(currentSegment);
    }
  }

};
