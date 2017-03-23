export default class {
  constructor(wavesurfer) {
    this.ws = wavesurfer;
    this.settings = {
      repeatRegion: 3
    };
    this.state = {
      loopRegion: null,
      loopCount: 0
    };

    wavesurfer.on("region-click", (region, event) => {
      this.clearLoopRegion();
      this.seekToRegion(region);
    });

    wavesurfer.on("region-in", (region, event) => {
      if (this.state.loopRegion !== region) {
        this.state.loopRegion = region;
        this.state.loopCount = 0;
      }
    });

    wavesurfer.on("region-out", (region, event) => {
      if (this.state.loopRegion === region) {
        this.state.loopCount += 1;
        if (this.state.loopCount === this.settings.repeatRegion) {
          this.clearLoopRegion();
        } else {
          this.seekToRegion(region);
        }
      }
    });
  }

  seekToRegion(region) {
    let progress = region.start / this.ws.getDuration();
    wavesurfer.seekTo(progress);
  }

  clearLoopRegion() {
    this.state.loopRegion = null;
    this.state.loopCount = 0;
  }

  playPause() {
    this.ws.playPause();
  }
};
