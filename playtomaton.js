// can these be imported with ES6 syntax?
window.WaveSurfer = require("wavesurfer");
require("wavesurfer/plugin/wavesurfer.minimap");
require("wavesurfer/plugin/wavesurfer.regions");

import Segmentator from "./segmentator";
import React from "react";

export default class Playtomaton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      src: this.props.src,
      repeatRegion: (Number(this.props.repeatRegion) || 3),
      playing: false,
      loopRegion: null,
      loopCount: 0,
      nextRegion: "region_0"
    };
  }

  render() {
    return (
      <div className="playtomaton">
        <button onClick={this.handlePrev}>prev</button>
        <button onClick={this.handlePlayPause}>{this.playButtonLabel()}</button>
        <button onClick={this.handleNext}>next</button>
        <div>Repetition: {this.repetitionLabel()}</div>
        <div ref={(node) => { this.wsNode = node; }}></div>
      </div>
    );
  }

  playButtonLabel() {
    return this.state.playing ? "pause" : "play";
  }

  repetitionLabel() {
    return this.state.loopRegion ? `${this.state.loopCount + 1}/${this.state.repeatRegion}` : "-";
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

  handleWsReady = () => {
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

  handleWsRegionClick = (region, event) => {
    this.clearLoopRegion();
    this.seekToRegion(region);
  }

  handleWsRegionIn = (region, event) => {
    this.setLoopRegion(region);
  }

  setLoopRegion(region) {
    if (this.state.loopRegion !== region) {
      this.setState({
        loopRegion: region,
        loopCount: 0,
        prevRegion: region.data.prevRegion,
        nextRegion: region.data.nextRegion
      });
    }
  }

  handleWsRegionOut = (region, event) => {
    if (this.state.loopRegion === region) {
      let newLoopCount = this.state.loopCount + 1;
      this.setState({loopCount: newLoopCount});
      if (newLoopCount === this.state.repeatRegion) {
        this.setState({
          loopRegion: null,
          prevRegion: region.id,
          loopCount: 0
        });
      } else {
        this.seekToRegion(region);
      }
    }
  }

  handlePlayPause = () => {
    this.ws.playPause();
    this.setState({
      playing: this.ws.isPlaying()
    });
  }

  handlePrev = () => {
    let prevRegion = this.regionById(this.state.prevRegion);
    if (prevRegion) {
      this.clearLoopRegion();
      this.seekToRegion(prevRegion);
    }
  }

  handleNext = () => {
    let nextRegion = this.regionById(this.state.nextRegion);
    if (nextRegion) {
      this.clearLoopRegion();
      this.seekToRegion(nextRegion);
    }
  }

  seekToRegion(region) {
    let progress = region.start / this.ws.getDuration();
    this.ws.seekTo(progress);
    this.setLoopRegion(region);
  }

  regionById(id) {
    return this.ws.regions.list[id];
  }

  clearLoopRegion() {
    this.setState({
      loopRegion: null,
      loopCount: 0
    });
  }
};
