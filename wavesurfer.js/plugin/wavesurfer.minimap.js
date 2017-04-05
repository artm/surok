'use strict';

/* Minimap */
WaveSurfer.Minimap = WaveSurfer.util.extend({}, WaveSurfer.Drawer, WaveSurfer.Drawer.Canvas, {
    init: function (wavesurfer, params) {
        this.wavesurfer = wavesurfer;
        this.container = this.wavesurfer.drawer.container;
        this.lastPos = this.wavesurfer.drawer.lastPos;
        this.params = wavesurfer.util.extend(
            {}, this.wavesurfer.drawer.params, {
                showRegions: false,
                showOverview: false,
                overviewBorderColor: 'green',
                overviewBorderSize: 2
            }, params, {
                scrollParent: false,
                fillParent: true
            }
        );

        this.width = 0;
        this.height = this.params.height * this.params.pixelRatio;

        this.createWrapper();
        this.createElements();

        if (WaveSurfer.Regions && this.params.showRegions) {
            this.regions();
        }

        this.onOverviewDrag = this.onOverviewDrag.bind(this);
        this.onOverviewDragEnd = this.onOverviewDragEnd.bind(this);
        this.bindWaveSurferEvents();
        this.bindMinimapEvents();
    },
    regions: function() {
        var my = this;
        this.regions = {};

        this.wavesurfer.on('region-created', function(region) {
            my.regions[region.id] = region;
            my.renderRegions();
        });

        this.wavesurfer.on('region-updated', function(region) {
            my.regions[region.id] = region;
            my.renderRegions();
        });

        this.wavesurfer.on('region-removed', function(region) {
            delete my.regions[region.id];
            my.renderRegions();
        });
    },
    renderRegions: function() {
        var my = this;
        var regionElements = this.wrapper.querySelectorAll('region');
        for (var i = 0; i < regionElements.length; ++i) {
          this.wrapper.removeChild(regionElements[i]);
        }

        Object.keys(this.regions).forEach(function(id){
            var region = my.regions[id];
            var width = (my.width * ((region.end - region.start) / my.wavesurfer.getDuration()));
            var left = (my.width * (region.start / my.wavesurfer.getDuration()));
            var regionElement = my.style(document.createElement('region'), {
                height: 'inherit',
                backgroundColor: region.color,
                width: width + 'px',
                left: left + 'px',
                display: 'block',
                position: 'absolute'
            });
            regionElement.classList.add(id);
            my.wrapper.appendChild(regionElement);
        });
    },
    createElements: function() {
        WaveSurfer.Drawer.Canvas.createElements.call(this);

        if (this.params.showOverview) {
            this.overviewRegion =  this.style(document.createElement('overview'), {
                height: (this.wrapper.offsetHeight - (this.params.overviewBorderSize * 2)) + 'px',
                width: '0px',
                display: 'block',
                position: 'absolute',
                cursor: 'move',
                border: this.params.overviewBorderSize + 'px solid ' + this.params.overviewBorderColor,
                zIndex: 2,
                opacity: this.params.overviewOpacity
            });

            this.wrapper.appendChild(this.overviewRegion);
        }
    },

    bindWaveSurferEvents: function () {
        var my = this;
        // render on load
        this.render();
        this.wavesurfer.on('audioprocess', function (currentTime) {
            my.progress(my.wavesurfer.backend.getPlayedPercents());
        });
        this.wavesurfer.on('seek', function(progress) {
            my.progress(my.wavesurfer.backend.getPlayedPercents());
        });

        if (this.params.showOverview) {
            this.wavesurfer.on('scroll', function(event) {
                if (!my.draggingOverview) {
                    my.moveOverviewRegion(event.target.scrollLeft / my.ratio);
                }
            });
        }

        var prevWidth = 0;
        var onResize = this.wavesurfer.util.debounce(function () {
            if (prevWidth != my.wrapper.clientWidth) {
                prevWidth = my.wrapper.clientWidth;
                my.render();
                my.progress(my.wavesurfer.backend.getPlayedPercents());
            }
        }, 100);
        window.addEventListener('resize', onResize, true);
        window.addEventListener('orientationchange', onResize, true);

        this.wavesurfer.on('destroy', function () {
            my.destroy.bind(this);
            window.removeEventListener('resize', onResize, true);
        });
    },

    bindMinimapEvents: function () {
        var my = this;
        if (this.params.showOverview) {
            this.overviewRegion.addEventListener('mousedown', function(event) {
                my.draggingOverview = true;
                my.captureMouse();
            });
        }

    },

    captureMouse: function() {
        document.addEventListener('mousemove', this.onOverviewDrag);
        document.addEventListener('mouseup', this.onOverviewDragEnd);
    },

    releaseMouse: function() {
        document.removeEventListener('mousemove', this.onOverviewDrag);
        document.removeEventListener('mouseup', this.onOverviewDragEnd);
    },

    onOverviewDrag: function(event) {
        this.moveOverviewRegion(event.clientX - this.container.getBoundingClientRect().left);
    },

    onOverviewDragEnd: function(event) {
        this.draggingOverview = false;
        this.releaseMouse();
    },

    render: function () {
        var len = this.getWidth();
        var peaks = this.wavesurfer.backend.getPeaks(len, 0, len);
        this.drawPeaks(peaks, len, 0, len);
        if (this.params.showOverview) {
          this.renderOverview();
        }
    },

    renderOverview: function () {
        //get proportional width of overview region considering the respective
        //width of the drawers
        this.ratio = this.wavesurfer.drawer.width / this.width;
        this.overviewWidth = (this.width / this.ratio);
        this.overviewRegion.style.width = (this.overviewWidth - (this.params.overviewBorderSize * 2)) + 'px';
    },

    moveOverviewRegion: function(pixels) {
        var actualWidth = this.wrapper.offsetWidth;
        var overviewPosition = Math.min(Math.max(pixels, 0), actualWidth - this.overviewWidth);
        this.overviewRegion.style.left = overviewPosition + 'px';
        this.wavesurfer.drawer.wrapper.scrollLeft = overviewPosition * this.ratio;
    }
});


WaveSurfer.initMinimap = function (params) {
    var map = Object.create(WaveSurfer.Minimap);
    map.init(this, params);
    return map;
};

// vim:sw=4 sts=4:
