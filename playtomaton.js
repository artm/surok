// can these be imported with ES6 syntax?
window.WaveSurfer = require("wavesurfer.js");
require("./wavesurfer.js/plugin/wavesurfer.minimap");
require("./wavesurfer.js/plugin/wavesurfer.regions");

import Segmentator from "./segmentator";
import React from "react";
import FlatButton from "material-ui/FlatButton";
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from "material-ui/Card";
import CircularProgress from "material-ui/CircularProgress";
import Slider from "material-ui/Slider";
import Drawer from "material-ui/Drawer";
import {HotKeys} from "react-hotkeys";

const wavesurferInitialSettings = {
  height: 100,
  barWidth: 2,
  hideScrollbar: true,
  interact: false,
  cursorColor: "rgba(255,255,255,0.1)"
};

const minimapInitialSettings = {
  height: 40,
  barWidth: null,
  showOverview: true,
  overviewBorderColor: "rgba(255,255,255,0.1)",
  overviewBorderSize: 2
};

const pauseStep = 100;

function LoadingPlaceholder(props) {
  return props.loading &&
    <center><CircularProgress size={props.size} /></center>;
}

function PauseProgress(props) {
  return props.visible &&
    <CircularProgress size={20} mode="determinate" max={props.max} value={props.value} />;
}

export default class Playtomaton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      src: "tmp/harry.mp3",
      playing: false,
      loopRegion: null,
      loopCount: 0,
      maxLoopCount: 3,
      nextRegion: "region_0",
      loading: true,
      settingsOpen: false,
      pauseAfterSegment: 25,
      pauseProgress: 0,
      pauseDuration: 0,
      isPaused: false
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
    const wavesurferHeight = wavesurferInitialSettings.height + minimapInitialSettings.height;
    return (
      <HotKeys className="HotKeys" keyMap={keyMap} handlers={handlers} focused={true} attach={window}>
        <Card rounded={false} expanded={true}>
          <CardHeader
            title="Harry Potter og de vises stein"
            subtitle={`Repetition: ${this.repetitionLabel()}`}
          />
          <CardMedia>
            <div ref="wavesurfer" style={{ height: `${wavesurferHeight}px` }}>
              <LoadingPlaceholder size={wavesurferHeight} loading={this.state.loading} />
            </div>
          </CardMedia>
          <CardActions>
            <FlatButton onClick={this.handlePrev} label="Prev" disabled={!this.state.prevRegion} />
            <FlatButton onClick={this.handlePlayPause} label={this.playButtonLabel()} />
            <FlatButton onClick={this.handleNext} label="Next" disabled={!this.state.nextRegion} />
            <FlatButton onClick={this.handleToggleSettings} label="Settings" />
            <PauseProgress visible={this.state.isPaused}
                           max={this.state.pauseDuration}
                           value={this.state.pauseProgress} />
          </CardActions>
        </Card>
        <Drawer
            open={this.state.settingsOpen}
            docked={false}
            containerClassName="settings-container"
            onRequestChange={(open, reason) => this.setState({settingsOpen: open})} >
          <div>Pause after segment: {this.state.pauseAfterSegment}%</div>
          <Slider min={0} step={25} max={250} value={this.state.pauseAfterSegment} onChange={this.handlePauseAfterSegmentChange}/>
        </Drawer>
      </HotKeys>
    );
  }

  playButtonLabel() {
    return this.state.playing ? "Pause" : "Play";
  }

  repetitionLabel() {
    return this.state.loopRegion ? `${this.state.loopCount + 1}/${this.state.maxLoopCount}` : "-";
  }

  handlePlayPause = (event) => {
    event.preventDefault();
    if (this.state.playing) {
      this.ws.pause();
      this.clearPauseProgress();
    } else {
      this.ws.play();
    }
    this.setState((oldState) => { return {playing: !oldState.playing}; });
  }

  handlePrev = (event) => {
    event.preventDefault();
    this.jumpToRegion(this.state.prevRegion);
  }

  handleNext = (event) => {
    event.preventDefault();
    this.jumpToRegion(this.state.nextRegion);
  }

  handleToggleSettings = () => this.setState({settingsOpen: !this.state.settingsOpen});

  handlePauseAfterSegmentChange = (event, newValue) => {
    this.setState({pauseAfterSegment: newValue});
  }

  seekToRegion(region) {
    if (!region) return;
    let progress = region.start / this.ws.getDuration();
    this.ws.seekTo(progress);
  }

  jumpToRegion(region) {
    if (!region) return;
    this.seekToRegion(region);
    this.setState({loopCount: 0});
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
    this.ws = WaveSurfer.create(
      WaveSurfer.util.extend({}, {container: this.refs.wavesurfer}, wavesurferInitialSettings)
    );
    if (this.state.src) {
      this.ws.load(this.state.src);
    }
    this.ws.on("ready", this.handleWsReady);
    this.ws.on("audioprocess", this.handleWsAudioprocess);
    this.ws.on("seek", this.handleWsSeek);
    this.ws.on("region-click", this.handleWsRegionClick);
  }

  handleWsReady = () => {
    this.ws.zoom(25);
    let minimap = this.ws.initMinimap(
      WaveSurfer.util.extend({}, minimapInitialSettings)
    );
    let peaks = this.ws.backend.getPeaks(100000, 0, 99999);
    let segmentator = new Segmentator();
    let segments = segmentator.findSegments(peaks, this.ws.getDuration());
    for(let i in segments) {
      this.ws.addRegion(segments[i]);
    }
    this.setState({loading: false});
  }

  handleWsAudioprocess = () => {
    this.updateVicinity();
  }

  handleWsSeek = () => {
    this.updateVicinity();
  }

  handleWsRegionClick = (region, event) => {
    this.jumpToRegion(region);
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
    if (this.justPlayedOutOfRegion(newVicinity) && this.handleRegionExit()) {
      return;
    }

    this.setState((oldState) => {
      if (this.sameVicinity(newVicinity, oldState)) {
        return {};
      } else {
        return newVicinity;
      }
    });
  }

  justPlayedOutOfRegion(newVicinity) {
    return this.state.loopRegion && !newVicinity.loopRegion;
  }

  // return true if handled and new vicinity don't need to be set
  handleRegionExit() {
    let incLoopCount = this.state.loopCount + 1;
    let stayInOldVicinity = true;
    if (this.state.pauseAfterSegment > 0) {
      this.pauseFor(this.currentPauseDuration());
    }
    if (incLoopCount < this.state.maxLoopCount) {
      this.setState({loopCount: incLoopCount});
      this.seekToRegion(this.state.loopRegion);
    } else {
      this.setState({loopCount: 0});
      stayInOldVicinity = false;
    }
    return stayInOldVicinity;
  }

  pauseFor(duration) {
    this.ws.pause();
    this.setState({
      pauseDuration: duration,
      pauseProgress: 0,
      isPaused: true
    });
    this.pauseStepId = window.setInterval(this.pauseStep, pauseStep);
  }

  pauseStep = () => {
    if (this.state.pauseProgress < this.state.pauseDuration) {
      this.setState((oldState) => {
        return {
          pauseProgress: (oldState.pauseProgress + pauseStep)
        };
      })
    } else {
      this.clearPauseProgress()
      if (this.state.playing) {
        this.ws.play();
      }
    }
  }

  clearPauseProgress() {
    if (this.pauseStepId) {
      window.clearInterval(this.pauseStepId);
      this.pauseStepId = null;
    }
    this.setState({
      pauseProgress: 0,
      pauseDuration: 0,
      isPaused: false
    });
  }

  currentPauseDuration() {
    let region = this.state.loopRegion;
    return (region.end - region.start) * this.state.pauseAfterSegment * 10;
  }

  sameVicinity(newVicinity, oldVicinity) {
    return newVicinity.loopRegion === oldVicinity.loopRegion &&
      newVicinity.nextRegion === oldVicinity.nextRegion &&
      newVicinity.prevRegion === oldVicinity.prevRegion;
  }
};
