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
      src: "tmp/harry.mp3",
      playing: false,
      loopRegion: null,
      loopCount: 0,
      maxLoopCount: 3,
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
            <FlatButton onClick={this.handlePrev} label="Prev" disabled={!this.state.prevRegion} />
            <FlatButton onClick={this.handlePlayPause} label={this.playButtonLabel()} />
            <FlatButton onClick={this.handleNext} label="Next" disabled={!this.state.nextRegion} />
          </CardActions>
        </Card>
      </HotKeys>
    );
  }

  playButtonLabel() {
    return this.state.playing ? "Pause" : "Play";
  }

  repetitionLabel() {
    return this.state.loopRegion ? `${this.state.loopCount + 1}/${this.state.maxLoopCount}` : "-";
  }

  handlePlayPause = () => {
    this.ws.playPause();
  }

  handlePrev = () => {
    this.seekToRegion(this.state.prevRegion);
  }

  handleNext = () => {
    this.seekToRegion(this.state.nextRegion);
  }

  seekToRegion(region) {
    if (!region) return;
    let progress = region.start / this.ws.getDuration();
    this.ws.seekTo(progress);
  }

  regionById(id) {
    return this.ws.regions.list[id];
  }

  prevRegion(region) {
    return this.regionById(region.data.prevRegion);
  }

  nextRegion(region) {
    return this.regionById(region.data.nextRegion);
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
    this.ws.on("audioprocess", this.handleWsAudioprocess);
    this.ws.on("seek", this.handleWsSeek);
    this.ws.on("play", this.handleWsPlay);
    this.ws.on("pause", this.handleWsPause);
    this.ws.on("finish", this.handleWsFinish);
    this.ws.on("region-click", this.handleWsRegionClick);
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

  handleWsAudioprocess = () => {
    this.updateVicinity();
  }

  handleWsSeek = () => {
    this.updateVicinity();
  }

  handleWsPlay = () => {
    this.setState({playing: true});
  }

  handleWsPause = () => {
    this.setState({playing: false});
  }

  handleWsFinish = () => {
    this.setState({playing: false});
  }

  handleWsRegionClick = (region, event) => {
    this.seekToRegion(region);
  }

  findVicinity(pos) {
    for(let id in this.ws.regions.list) {
      let region = this.ws.regions.list[id];
      let prev = this.prevRegion(region);
      let next = this.nextRegion(region);

      if (region.start <= pos && pos <= region.end) {
        return {
          prevRegion: prev || region,
          loopRegion: region,
          nextRegion: next
        };
      } else if (pos < region.start && (!prev || prev.end < pos)) {
        // between prev and region
        return {
          prevRegion: prev,
          loopRegion: null,
          nextRegion: region
        };
      } else if (pos > region.end && (!next || pos < next.start)) {
        // between region and next
        return {
          prevRegion: region,
          loopRegion: null,
          nextRegion: next
        };
      }
    }
    console.log("this will never happen");
  }

  updateVicinity() {
    let newVicinity = this.findVicinity(this.ws.getCurrentTime());
    if (this.sameVicinity(newVicinity, this.state)) {
      return;
    }
    this.setState(newVicinity);
  }

  sameVicinity(newVicinity, oldVicinity) {
    return newVicinity.loopRegion === oldVicinity.loopRegion &&
      newVicinity.nextRegion === oldVicinity.nextRegion &&
      newVicinity.prevRegion === oldVicinity.prevRegion;
  }
};
