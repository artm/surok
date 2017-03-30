// can these be imported with ES6 syntax?
window.WaveSurfer = require("wavesurfer");
require("wavesurfer/plugin/wavesurfer.minimap");
require("wavesurfer/plugin/wavesurfer.regions");

import Segmentator from "./segmentator";
import React from "react";

export default class Playtomaton extends React.Component {
  constructor(props) {
    super(props);
    this.handlePlayPause = this.handlePlayPause.bind(this);
    this.handleWsReady = this.handleWsReady.bind(this);
    this.handleWsRegionClick = this.handleWsRegionClick.bind(this);
    this.handleWsRegionIn = this.handleWsRegionIn.bind(this);
    this.handleWsRegionOut = this.handleWsRegionOut.bind(this);

    this.settings = {
      repeatRegion: 3
    };
    this.state = {
      src: this.props.src,
      playing: false,
      loopRegion: null,
      loopCount: 0
    };
  }

  render() {
    return (
      <div className="playtomaton">
        <button onClick={this.handlePlayPause}>{this.playButtonLabel()}</button>
        <div>Repetition: {this.repetitionLabel()}</div>
        <div ref={(node) => { this.wsNode = node; }}></div>
      </div>
    );
  }

  playButtonLabel() {
    return this.state.playing ? "pause" : "play";
  }

  repetitionLabel() {
    return this.state.loopRegion ? `${this.state.loopCount + 1}/${this.settings.repeatRegion}` : "-";
  }

  componentDidMount() {
    this.ws = WaveSurfer.create({
      container: this.wsNode,
      height: 60,
      barWidth: 2,
      hideScrollbar: true,
      interact: false
    });
    if (this.state.src) {
      this.ws.load(this.state.src);
    }
    this.ws.on("ready", this.handleWsReady);
    this.ws.on("region-click", this.handleWsRegionClick);
    this.ws.on("region-in", this.handleWsRegionIn);
    this.ws.on("region-out", this.handleWsRegionOut);
  }

  handleWsReady() {
    let minimap = this.ws.initMinimap({
      height: 30,
      barHeight: 10,
      barWidth: null,
      interact: true
    });
    this.ws.zoom(25);
    let peaks = this.ws.backend.getPeaks(100000, 0, 99999);
    let segmentator = new Segmentator();
    let segments = segmentator.findSegments(peaks, this.ws.getDuration());
    for(let i in segments) {
      this.ws.addRegion(segments[i]);
    }
  }

  handleWsRegionClick(region, event) {
    this.clearLoopRegion();
    this.seekToRegion(region);
  }

  handleWsRegionIn(region, event) {
    if (this.state.loopRegion !== region) {
      this.setState({
        loopRegion: region,
        loopCount: 0
      });
    }
  }

  handleWsRegionOut(region, event) {
    if (this.state.loopRegion === region) {
      let newLoopCount = this.state.loopCount + 1;
      this.setState({loopCount: newLoopCount});
      if (newLoopCount === this.settings.repeatRegion) {
        this.clearLoopRegion();
      } else {
        this.seekToRegion(region);
      }
    }
  }

  handlePlayPause() {
    this.ws.playPause();
    this.setState({
      playing: this.ws.isPlaying()
    });
  }

  seekToRegion(region) {
    let progress = region.start / this.ws.getDuration();
    this.ws.seekTo(progress);
  }

  clearLoopRegion() {
    this.setState({
      loopRegion: null,
      loopCount: 0
    });
  }
};
