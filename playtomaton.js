import React from "react";

export default class Playtomaton extends React.Component {
  constructor(props) {
    super(props);
    // FIXME
    this.ws = this.props.wavesurfer;
    this.handlePlayPause = this.handlePlayPause.bind(this);
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
        this.setState({
          loopRegion: region,
          loopCount: 0
        });
      }
    });

    wavesurfer.on("region-out", (region, event) => {
      if (this.state.loopRegion === region) {
        let newLoopCount = this.state.loopCount + 1;
        this.setState({loopCount: newLoopCount});
        if (newLoopCount === this.settings.repeatRegion) {
          this.clearLoopRegion();
        } else {
          this.seekToRegion(region);
        }
      }
    });
  }

  render() {
    return (
      <div className="playtomaton">
        <button onClick={this.handlePlayPause}>play</button>
      </div>
    );
  }

  handlePlayPause() {
    this.ws.playPause();
  }

  seekToRegion(region) {
    let progress = region.start / this.ws.getDuration();
    wavesurfer.seekTo(progress);
  }

  clearLoopRegion() {
    this.setState({
      loopRegion: null,
      loopCount: 0
    });
  }
};
