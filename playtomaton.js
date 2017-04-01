// can these be imported with ES6 syntax?
window.WaveSurfer = require("wavesurfer");
require("wavesurfer/plugin/wavesurfer.minimap");
require("wavesurfer/plugin/wavesurfer.regions");

import Segmentator from "./segmentator";
import React from "react";
import FlatButton from "material-ui/FlatButton";
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from "material-ui/Card";
import {HotKeys} from "react-hotkeys";

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
    const keyMap = {
      "playPause": "space",
      "prevRegion": "left",
      "nextRegion": "right"
    };
    const handlers = {
      "playPause": this.handlePlayPause,
      "prevRegion": this.handlePrev,
      "nextRegion": this.handleNext
    }

    return (
      <HotKeys className="HotKeys" keyMap={keyMap} handlers={handlers} focused={true} attach={window}>
        <Card rounded={false} expanded={true}>
          <CardHeader
            title="Harry Potter og de vises stein"
            subtitle={`Repetition: ${this.repetitionLabel()}`}
          />
          <CardMedia>
            <div ref="wavesurfer" />
          </CardMedia>
          <CardActions>
            <FlatButton onClick={this.handlePrev} label="Prev" />
            <FlatButton onClick={this.handlePlayPause} label={this.playButtonLabel()} />
            <FlatButton onClick={this.handleNext} label="Next" />
          </CardActions>
        </Card>
      </HotKeys>
    );
  }

  playButtonLabel() {
    return this.state.playing ? "Pause" : "Play";
  }

  repetitionLabel() {
    return this.state.loopRegion ? `${this.state.loopCount + 1}/${this.state.repeatRegion}` : "-";
  }

  componentDidMount() {
    this.ws = WaveSurfer.create({
      container: this.refs.wavesurfer,
      height: 60,
      barWidth: 2,
      hideScrollbar: true,
      interact: false,
      cursorColor: 'rgba(255,255,255,0.1)',
      scrollParent: false
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
    this.ws.zoom(25);
    let minimap = this.ws.initMinimap({
      height: 30,
      barWidth: null,
      showOverview: true,
      overviewBorderColor: 'rgba(255,255,255,0.1)',
      overviewBorderSize: 2
    });
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

  clearLoopRegion() {
    this.setState({
      loopRegion: null,
      loopCount: 0
    });
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

  seekToRegion(region) {
    let progress = region.start / this.ws.getDuration();
    this.ws.seekTo(progress);
    this.setLoopRegion(region);
  }

  regionById(id) {
    return this.ws.regions.list[id];
  }
};
