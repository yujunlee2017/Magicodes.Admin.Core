(function() {
  var svg;

  //save off default references
  var d3 = window.d3, topojson = window.topojson;

  var defaultOptions = {
    scope: 'world',
    responsive: false,
    aspectRatio: 0.5625,
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    data: {},
    done: function() {},
    fills: {
      defaultFill: '#ABDDA4'
    },
    filters: {},
    geographyConfig: {
        dataUrl: null,
        hideAntarctica: true,
        hideHawaiiAndAlaska : false,
        borderWidth: 1,
        borderColor: '#FDFDFD',
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
        },
        popupOnHover: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2
    },
    projectionConfig: {
      rotation: [97, 0]
    },
    bubblesConfig: {
        borderWidth: 2,
        borderColor: '#FFFFFF',
        popupOnHover: true,
        radius: null,
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + data.name + '</strong></div>';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightFillOpacity: 0.85,
        exitDelay: 100,
        key: JSON.stringify
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600
    }
  };

  /*
    Getter for value. If not declared on datumValue, look up the chain into optionsValue
  */
  function val( datumValue, optionsValue, context ) {
    if ( typeof context === 'undefined' ) {
      context = optionsValue;
      optionsValues = undefined;
    }
    var value = typeof datumValue !== 'undefined' ? datumValue : optionsValue;

    if (typeof value === 'undefined') {
      return  null;
    }

    if ( typeof value === 'function' ) {
      var fnContext = [context];
      if ( context.geography ) {
        fnContext = [context.geography, context.data];
      }
      return value.apply(null, fnContext);
    }
    else {
      return value;
    }
  }

  function addContainer( element, height, width ) {
    this.svg = d3.select( element ).append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('data-width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    if (this.options.responsive) {
      d3.select(this.options.element).style({'position': 'relative', 'padding-bottom': (this.options.aspectRatio*100) + '%'});
      d3.select(this.options.element).select('svg').style({'position': 'absolute', 'width': '100%', 'height': '100%'});
      d3.select(this.options.element).select('svg').select('g').selectAll('path').style('vector-effect', 'non-scaling-stroke');

    }

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection( element, options ) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;

    if ( options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if ( options.scope === 'usa' ) {
      projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
    }
    else if ( options.scope === 'world' ) {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / (options.projection === "mercator" ? 1.45 : 1.8)]);
    }

    if ( options.projection === 'orthographic' ) {

      svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

      svg.append("use")
          .attr("class", "stroke")
          .attr("xlink:href", "#sphere");

      svg.append("use")
          .attr("class", "fill")
          .attr("xlink:href", "#sphere");
      projection.scale(250).clipAngle(90).rotate(options.projectionConfig.rotation)
    }

    path = d3.geo.path()
      .projection( projection );

    return {path: path, projection: projection};
  }

  function addStyleBlock() {
    if ( d3.select('.datamaps-style-block').empty() ) {
      d3.select('head').append('style').attr('class', 'datamaps-style-block')
      .html('.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path {stroke: #FFFFFF; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; left: 4px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }');
    }
  }

  function drawSubunits( data ) {
    var fillData = this.options.fills,
        colorCodeData = this.options.data || {},
        geoConfig = this.options.geographyConfig;


    var subunits = this.svg.select('g.datamaps-subunits');
    if ( subunits.empty() ) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature( data, data.objects[ this.options.scope ] ).features;
    if ( geoConfig.hideAntarctica ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "ATA";
      });
    }

    if ( geoConfig.hideHawaiiAndAlaska ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "HI" && feature.id !== 'AK';
      });
    }

    var geo = subunits.selectAll('path.datamaps-subunit').data( geoData );

    geo.enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function(d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function(d) {
        return JSON.stringify( colorCodeData[d.id]);
      })
      .style('fill', function(d) {
        //if fillKey - use that
        //otherwise check 'fill'
        //otherwise check 'defaultFill'
        var fillColor;

        var datum = colorCodeData[d.id];
        if ( datum && datum.fillKey ) {
          fillColor = fillData[ val(datum.fillKey, {data: colorCodeData[d.id], geography: d}) ];
        }

        if ( typeof fillColor === 'undefined' ) {
          fillColor = val(datum && datum.fillColor, fillData.defaultFill, {data: colorCodeData[d.id], geography: d});
        }

        return fillColor;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig () {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    if ( options.highlightOnHover || options.popupOnHover ) {
      svg.selectAll('.datamaps-subunit')
        .on('mouseover', function(d) {
          var $this = d3.select(this);
          var datum = self.options.data[d.id] || {};
          if ( options.highlightOnHover ) {
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));

            //as per discussion on https://github.com/markmarkoh/datamaps/issues/19
            if ( ! /((MSIE)|(Trident))/.test(navigator.userAgent) ) {
             moveToFront.call(this);
            }
          }

          if ( options.popupOnHover ) {
            self.updatePopup($this, d, options, svg);
          }
        })
        .on('mouseout', function() {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }
          $this.on('mousemove', null);
          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        });
    }

    function moveToFront() {
      this.parentNode.appendChild(this);
    }
  }

  //plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if ( !this.options.fills ) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if ( data.legendTitle ) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for ( var fillKey in this.options.fills ) {

      if ( fillKey === 'defaultFill') {
        if (! data.defaultFillName ) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label= fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html += '<dd style="background-color:' +  this.options.fills[fillKey] + '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3.select( this.options.element ).append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

    function addGraticule ( layer, options ) {
      var graticule = d3.geo.graticule();
      this.svg.insert("path", '.datamaps-subunits')
        .datum(graticule)
        .attr("class", "datamaps-graticule")
        .attr("d", this.path);
  }

  function handleArcs (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    // For some reason arc options were put in an `options` object instead of the parent arc
    // I don't like this, so to match bubbles and other plugins I'm moving it
    // This is to keep backwards compatability
    for ( var i = 0; i < data.length; i++ ) {
      data[i] = defaults(data[i], data[i].options);
      delete data[i].options;
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    var path = d3.geo.path()
        .projection(self.projection);

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          return val(datum.strokeColor, options.strokeColor, datum);
        })
        .style('fill', 'none')
        .style('stroke-width', function(datum) {
            return val(datum.strokeWidth, options.strokeWidth, datum);
        })
        .attr('d', function(datum) {
            var originXY = self.latLngToXY(val(datum.origin.latitude, datum), val(datum.origin.longitude, datum))
            var destXY = self.latLngToXY(val(datum.destination.latitude, datum), val(datum.destination.longitude, datum));
            var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];
            if (options.greatArc) {
                  // TODO: Move this to inside `if` clause when setting attr `d`
              var greatArc = d3.geo.greatArc()
                  .source(function(d) { return [val(d.origin.longitude, d), val(d.origin.latitude, d)]; })
                  .target(function(d) { return [val(d.destination.longitude, d), val(d.destination.latitude, d)]; });

              return path(greatArc(datum))
            }
            var sharpness = val(datum.arcSharpness, options.arcSharpness, datum);
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * sharpness)) + "," + (midXY[1] - (75 * sharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .transition()
          .delay(100)
          .style('fill', function(datum) {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + val(datum.animationSpeed, options.animationSpeed, datum) + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          })

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }

  function handleLabels ( layer, options ) {
    var self = this;
    options = options || {};
    var labelStartCoodinates = this.projection([-67.707617, 42.722131]);
    this.svg.selectAll(".datamaps-subunit")
      .attr("data-foo", function(d) {
        var center = self.path.centroid(d);
        var xOffset = 7.5, yOffset = 5;

        if ( ["FL", "KY", "MI"].indexOf(d.id) > -1 ) xOffset = -2.5;
        if ( d.id === "NY" ) xOffset = -1;
        if ( d.id === "MI" ) yOffset = 18;
        if ( d.id === "LA" ) xOffset = 13;

        var x,y;

        x = center[0] - xOffset;
        y = center[1] + yOffset;

        var smallStateIndex = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"].indexOf(d.id);
        if ( smallStateIndex > -1) {
          var yStart = labelStartCoodinates[1];
          x = labelStartCoodinates[0];
          y = yStart + (smallStateIndex * (2+ (options.fontSize || 12)));
          layer.append("line")
            .attr("x1", x - 3)
            .attr("y1", y - 5)
            .attr("x2", center[0])
            .attr("y2", center[1])
            .style("stroke", options.labelColor || "#000")
            .style("stroke-width", options.lineWidth || 1)
        }

        layer.append("text")
          .attr("x", x)
          .attr("y", y)
          .style("font-size", (options.fontSize || 10) + 'px')
          .style("font-family", options.fontFamily || "Verdana")
          .style("fill", options.labelColor || "#000")
          .text( d.id );
        return "bar";
      });
  }


  function handleBubbles (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        filterData = this.options.filters,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, options.key );

    bubbles
      .enter()
        .append('svg:circle')
        .attr('class', 'datamaps-bubble')
        .attr('cx', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
          }
          if ( latLng ) return latLng[0];
        })
        .attr('cy', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
          }
          if ( latLng ) return latLng[1];
        })
        .attr('r', function(datum) {
          // if animation enabled start with radius 0, otherwise use full size.
          return options.animate ? 0 : val(datum.radius, options.radius, datum);
        })
        .attr('data-info', function(d) {
          return JSON.stringify(d);
        })
        .attr('filter', function (datum) {
          var filterKey = filterData[ val(datum.filterKey, options.filterKey, datum) ];

          if (filterKey) {
            return filterKey;
          }
        })
        .style('stroke', function ( datum ) {
          return val(datum.borderColor, options.borderColor, datum);
        })
        .style('stroke-width', function ( datum ) {
          return val(datum.borderWidth, options.borderWidth, datum);
        })
        .style('fill-opacity', function ( datum ) {
          return val(datum.fillOpacity, options.fillOpacity, datum);
        })
        .style('fill', function ( datum ) {
          var fillColor = fillData[ val(datum.fillKey, options.fillKey, datum) ];
          return fillColor || fillData.defaultFill;
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //save all previous attributes for mouseout
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));
          }

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            //reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })

    bubbles.transition()
      .duration(400)
      .attr('r', function ( datum ) {
        return val(datum.radius, options.radius, datum);
      });

    bubbles.exit()
      .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();

    function datumHasCoords (datum) {
      return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
    }
  }

  //stolen from underscore.js
  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap( options ) {

    if ( typeof d3 === 'undefined' || typeof topojson === 'undefined' ) {
      throw new Error('Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map');
   }
    //set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(options.geographyConfig, defaultOptions.geographyConfig);
    this.options.projectionConfig = defaults(options.projectionConfig, defaultOptions.projectionConfig);
    this.options.bubblesConfig = defaults(options.bubblesConfig, defaultOptions.bubblesConfig);
    this.options.arcConfig = defaults(options.arcConfig, defaultOptions.arcConfig);

    //add the SVG container
    if ( d3.select( this.options.element ).select('svg').length > 0 ) {
      addContainer.call(this, this.options.element, this.options.height, this.options.width );
    }

    /* Add core plugins to this instance */
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);

    //append style block with basic hoverover styles
    if ( ! this.options.disableDefaultStyles ) {
      addStyleBlock();
    }

    return this.draw();
  }

  // resize map
  Datamap.prototype.resize = function () {

    var self = this;
    var options = self.options;

    if (options.responsive) {
      var newsize = options.element.clientWidth,
          oldsize = d3.select( options.element).select('svg').attr('data-width');

      d3.select(options.element).select('svg').selectAll('g').attr('transform', 'scale(' + (newsize / oldsize) + ')');
    }
  }

  // actually draw the features(states & countries)
  Datamap.prototype.draw = function() {
    //save off in a closure
    var self = this;
    var options = self.options;

    //set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(self, [options.element, options] );

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    //if custom URL for topojson data, retrieve it and render
    if ( options.geographyConfig.dataUrl ) {
      d3.json( options.geographyConfig.dataUrl, function(error, results) {
        if ( error ) throw new Error(error);
        self.customTopo = results;
        draw( results );
      });
    }
    else {
      draw( this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

      function draw (data) {
        // if fetching remote data, draw the map first then call `updateChoropleth`
        if ( self.options.dataUrl ) {
          //allow for csv or json data types
          d3[self.options.dataType](self.options.dataUrl, function(data) {
            //in the case of csv, transform data to object
            if ( self.options.dataType === 'csv' && (data && data.slice) ) {
              var tmpData = {};
              for(var i = 0; i < data.length; i++) {
                tmpData[data[i].id] = data[i];
              }
              data = tmpData;
            }
            Datamaps.prototype.updateChoropleth.call(self, data);
          });
        }
        drawSubunits.call(self, data);
        handleGeographyConfig.call(self);

        if ( self.options.geographyConfig.popupOnHover || self.options.bubblesConfig.popupOnHover) {
          hoverover = d3.select( self.options.element ).append('div')
            .attr('class', 'datamaps-hoverover')
            .style('z-index', 10001)
            .style('position', 'absolute');
        }

        //fire off finished callback
        self.options.done(self);
      }
  };
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = '__WORLD__';
  Datamap.prototype.abwTopo = '__ABW__';
  Datamap.prototype.afgTopo = '__AFG__';
  Datamap.prototype.agoTopo = '__AGO__';
  Datamap.prototype.aiaTopo = '__AIA__';
  Datamap.prototype.albTopo = '__ALB__';
  Datamap.prototype.aldTopo = '__ALD__';
  Datamap.prototype.andTopo = '__AND__';
  Datamap.prototype.areTopo = '__ARE__';
  Datamap.prototype.argTopo = '__ARG__';
  Datamap.prototype.armTopo = '__ARM__';
  Datamap.prototype.asmTopo = '__ASM__';
  Datamap.prototype.ataTopo = '__ATA__';
  Datamap.prototype.atcTopo = '__ATC__';
  Datamap.prototype.atfTopo = '__ATF__';
  Datamap.prototype.atgTopo = '__ATG__';
  Datamap.prototype.ausTopo = '__AUS__';
  Datamap.prototype.autTopo = '__AUT__';
  Datamap.prototype.azeTopo = '__AZE__';
  Datamap.prototype.bdiTopo = '__BDI__';
  Datamap.prototype.belTopo = '__BEL__';
  Datamap.prototype.benTopo = '__BEN__';
  Datamap.prototype.bfaTopo = '__BFA__';
  Datamap.prototype.bgdTopo = '__BGD__';
  Datamap.prototype.bgrTopo = '__BGR__';
  Datamap.prototype.bhrTopo = '__BHR__';
  Datamap.prototype.bhsTopo = '__BHS__';
  Datamap.prototype.bihTopo = '__BIH__';
  Datamap.prototype.bjnTopo = '__BJN__';
  Datamap.prototype.blmTopo = '__BLM__';
  Datamap.prototype.blrTopo = '__BLR__';
  Datamap.prototype.blzTopo = '__BLZ__';
  Datamap.prototype.bmuTopo = '__BMU__';
  Datamap.prototype.bolTopo = '__BOL__';
  Datamap.prototype.braTopo = '__BRA__';
  Datamap.prototype.brbTopo = '__BRB__';
  Datamap.prototype.brnTopo = '__BRN__';
  Datamap.prototype.btnTopo = '__BTN__';
  Datamap.prototype.norTopo = '__NOR__';
  Datamap.prototype.bwaTopo = '__BWA__';
  Datamap.prototype.cafTopo = '__CAF__';
  Datamap.prototype.canTopo = '__CAN__';
  Datamap.prototype.cheTopo = '__CHE__';
  Datamap.prototype.chlTopo = '__CHL__';
  Datamap.prototype.chnTopo = '__CHN__';
  Datamap.prototype.civTopo = '__CIV__';
  Datamap.prototype.clpTopo = '__CLP__';
  Datamap.prototype.cmrTopo = '__CMR__';
  Datamap.prototype.codTopo = '__COD__';
  Datamap.prototype.cogTopo = '__COG__';
  Datamap.prototype.cokTopo = '__COK__';
  Datamap.prototype.colTopo = '__COL__';
  Datamap.prototype.comTopo = '__COM__';
  Datamap.prototype.cpvTopo = '__CPV__';
  Datamap.prototype.criTopo = '__CRI__';
  Datamap.prototype.csiTopo = '__CSI__';
  Datamap.prototype.cubTopo = '__CUB__';
  Datamap.prototype.cuwTopo = '__CUW__';
  Datamap.prototype.cymTopo = '__CYM__';
  Datamap.prototype.cynTopo = '__CYN__';
  Datamap.prototype.cypTopo = '__CYP__';
  Datamap.prototype.czeTopo = '__CZE__';
  Datamap.prototype.deuTopo = '__DEU__';
  Datamap.prototype.djiTopo = '__DJI__';
  Datamap.prototype.dmaTopo = '__DMA__';
  Datamap.prototype.dnkTopo = '__DNK__';
  Datamap.prototype.domTopo = '__DOM__';
  Datamap.prototype.dzaTopo = '__DZA__';
  Datamap.prototype.ecuTopo = '__ECU__';
  Datamap.prototype.egyTopo = '__EGY__';
  Datamap.prototype.eriTopo = '__ERI__';
  Datamap.prototype.esbTopo = '__ESB__';
  Datamap.prototype.espTopo = '__ESP__';
  Datamap.prototype.estTopo = '__EST__';
  Datamap.prototype.ethTopo = '__ETH__';
  Datamap.prototype.finTopo = '__FIN__';
  Datamap.prototype.fjiTopo = '__FJI__';
  Datamap.prototype.flkTopo = '__FLK__';
  Datamap.prototype.fraTopo = '__FRA__';
  Datamap.prototype.froTopo = '__FRO__';
  Datamap.prototype.fsmTopo = '__FSM__';
  Datamap.prototype.gabTopo = '__GAB__';
  Datamap.prototype.psxTopo = '__PSX__';
  Datamap.prototype.gbrTopo = '__GBR__';
  Datamap.prototype.geoTopo = '__GEO__';
  Datamap.prototype.ggyTopo = '__GGY__';
  Datamap.prototype.ghaTopo = '__GHA__';
  Datamap.prototype.gibTopo = '__GIB__';
  Datamap.prototype.ginTopo = '__GIN__';
  Datamap.prototype.gmbTopo = '__GMB__';
  Datamap.prototype.gnbTopo = '__GNB__';
  Datamap.prototype.gnqTopo = '__GNQ__';
  Datamap.prototype.grcTopo = '__GRC__';
  Datamap.prototype.grdTopo = '__GRD__';
  Datamap.prototype.grlTopo = '__GRL__';
  Datamap.prototype.gtmTopo = '__GTM__';
  Datamap.prototype.gumTopo = '__GUM__';
  Datamap.prototype.guyTopo = '__GUY__';
  Datamap.prototype.hkgTopo = '__HKG__';
  Datamap.prototype.hmdTopo = '__HMD__';
  Datamap.prototype.hndTopo = '__HND__';
  Datamap.prototype.hrvTopo = '__HRV__';
  Datamap.prototype.htiTopo = '__HTI__';
  Datamap.prototype.hunTopo = '__HUN__';
  Datamap.prototype.idnTopo = '__IDN__';
  Datamap.prototype.imnTopo = '__IMN__';
  Datamap.prototype.indTopo = '__IND__';
  Datamap.prototype.ioaTopo = '__IOA__';
  Datamap.prototype.iotTopo = '__IOT__';
  Datamap.prototype.irlTopo = '__IRL__';
  Datamap.prototype.irnTopo = '__IRN__';
  Datamap.prototype.irqTopo = '__IRQ__';
  Datamap.prototype.islTopo = '__ISL__';
  Datamap.prototype.isrTopo = '__ISR__';
  Datamap.prototype.itaTopo = '__ITA__';
  Datamap.prototype.jamTopo = '__JAM__';
  Datamap.prototype.jeyTopo = '__JEY__';
  Datamap.prototype.jorTopo = '__JOR__';
  Datamap.prototype.jpnTopo = '__JPN__';
  Datamap.prototype.kabTopo = '__KAB__';
  Datamap.prototype.kasTopo = '__KAS__';
  Datamap.prototype.kazTopo = '__KAZ__';
  Datamap.prototype.kenTopo = '__KEN__';
  Datamap.prototype.kgzTopo = '__KGZ__';
  Datamap.prototype.khmTopo = '__KHM__';
  Datamap.prototype.kirTopo = '__KIR__';
  Datamap.prototype.knaTopo = '__KNA__';
  Datamap.prototype.korTopo = '__KOR__';
  Datamap.prototype.kosTopo = '__KOS__';
  Datamap.prototype.kwtTopo = '__KWT__';
  Datamap.prototype.laoTopo = '__LAO__';
  Datamap.prototype.lbnTopo = '__LBN__';
  Datamap.prototype.lbrTopo = '__LBR__';
  Datamap.prototype.lbyTopo = '__LBY__';
  Datamap.prototype.lcaTopo = '__LCA__';
  Datamap.prototype.lieTopo = '__LIE__';
  Datamap.prototype.lkaTopo = '__LKA__';
  Datamap.prototype.lsoTopo = '__LSO__';
  Datamap.prototype.ltuTopo = '__LTU__';
  Datamap.prototype.luxTopo = '__LUX__';
  Datamap.prototype.lvaTopo = '__LVA__';
  Datamap.prototype.macTopo = '__MAC__';
  Datamap.prototype.mafTopo = '__MAF__';
  Datamap.prototype.marTopo = '__MAR__';
  Datamap.prototype.mcoTopo = '__MCO__';
  Datamap.prototype.mdaTopo = '__MDA__';
  Datamap.prototype.mdgTopo = '__MDG__';
  Datamap.prototype.mdvTopo = '__MDV__';
  Datamap.prototype.mexTopo = '__MEX__';
  Datamap.prototype.mhlTopo = '__MHL__';
  Datamap.prototype.mkdTopo = '__MKD__';
  Datamap.prototype.mliTopo = '__MLI__';
  Datamap.prototype.mltTopo = '__MLT__';
  Datamap.prototype.mmrTopo = '__MMR__';
  Datamap.prototype.mneTopo = '__MNE__';
  Datamap.prototype.mngTopo = {"type":"Topology","objects":{"mng":{"type":"GeometryCollection","geometries":[{"type":"Polygon","properties":{"name":"Bayan-Ölgiy"},"id":"MN.BO","arcs":[[0,1,2]]},{"type":"Polygon","properties":{"name":"Dornogovi"},"id":"MN.DG","arcs":[[3,4,5,6,7,8]]},{"type":"Polygon","properties":{"name":"Ömnögovi"},"id":"MN.OG","arcs":[[-6,9,10,11,12]]},{"type":"Polygon","properties":{"name":"Hentiy"},"id":"MN.HN","arcs":[[13,-9,14,15,16,17,18,19]]},{"type":"Polygon","properties":{"name":"Arhangay"},"id":"MN.AR","arcs":[[20,21,22,23,24]]},{"type":"Polygon","properties":{"name":"Bayanhongor"},"id":"MN.BH","arcs":[[25,-11,26,27,28,-23]]},{"type":"Polygon","properties":{"name":"Dzavhan"},"id":"MN.DZ","arcs":[[29,-24,-29,30,31,32,33]]},{"type":"Polygon","properties":{"name":"Govi-Altay"},"id":"MN.GA","arcs":[[-28,34,35,-31]]},{"type":"Polygon","properties":{"name":"Hovd"},"id":"MN.HD","arcs":[[-32,-36,36,-1,37]]},{"type":"Polygon","properties":{"name":"Hövsgöl"},"id":"MN.HG","arcs":[[38,-25,-30,39]]},{"type":"Polygon","properties":{"name":"Uvs"},"id":"MN.UV","arcs":[[-33,-38,-3,40]]},{"type":"Polygon","properties":{"name":"Bulgan"},"id":"MN.BU","arcs":[[41,42,43,44,45,-21,-39,46]]},{"type":"Polygon","properties":{"name":"Orhon"},"id":"MN.ER","arcs":[[47,-43]]},{"type":"Polygon","properties":{"name":"Dundgovi"},"id":"MN.DU","arcs":[[-13,48,49,-7]]},{"type":"Polygon","properties":{"name":"Selenge"},"id":"MN.SL","arcs":[[-18,50,-44,-48,-42,51],[52]]},{"type":"Polygon","properties":{"name":"Övörhangay"},"id":"MN.OH","arcs":[[-46,53,-49,-12,-26,-22]]},{"type":"Polygon","properties":{"name":"Darhan-Uul"},"id":"MN.DA","arcs":[[-53]]},{"type":"Polygon","properties":{"name":"Töv"},"id":"MN.TO","arcs":[[-17,54,-15,-8,-50,-54,-45,-51],[55]]},{"type":"Polygon","properties":{"name":"Govĭ-Sümber"},"id":"MN.GS","arcs":[[-16,-55]]},{"type":"Polygon","properties":{"name":"Ulaanbaatar"},"id":"MN.UB","arcs":[[-56]]},{"type":"Polygon","properties":{"name":"Dornod"},"id":"MN.DD","arcs":[[56,-20,57]]},{"type":"Polygon","properties":{"name":"Sühbaatar"},"id":"MN.SB","arcs":[[58,-4,-14,-57]]}]}},"arcs":[[[1122,6747],[-15,0],[-31,15],[-31,-14],[-94,-88],[-33,-13],[-1,-12],[1,-8],[2,-8],[4,-8],[21,-19],[6,-11],[4,-17],[11,-72],[2,-18],[-2,-14],[-12,-37],[-4,-22],[-1,-23],[2,-29],[3,-26],[7,-82],[1,-22],[1,-14],[2,-16],[6,-11],[15,-23],[5,-10],[9,-22],[3,-10],[4,-17],[12,-89],[26,-158],[9,-33],[6,-15],[7,-20],[5,-24],[21,-132],[2,-19],[1,-25],[-1,-18],[-3,-17],[-2,-11],[-1,-14],[1,-17],[8,-29],[42,-108],[20,-64],[-1,-31],[-14,-78],[-3,-21],[-1,-21],[0,-19],[4,-22],[6,-26],[14,-24],[10,-13],[12,-11],[25,-36],[32,-62],[22,-66],[25,-35],[-1,-23],[-1,-18],[-8,-14],[-5,-6],[-46,13],[-39,-10],[-5,5],[-9,13],[-6,-3],[-4,-8],[-3,-15],[-7,-35],[-5,-14],[-8,-6],[-10,5],[-10,15],[-7,19],[-12,43],[-7,13],[-9,0],[-9,-3],[-10,2],[-20,19],[-24,11],[-7,-1]],[[1019,4840],[0,13],[-3,35],[-9,32],[-11,24],[-5,13],[-1,20],[1,7],[3,15],[1,7],[-1,10],[-2,5],[-3,5],[-2,6],[-3,18],[-2,16],[-3,16],[-5,15],[-6,12],[-7,9],[-7,4],[-7,-1],[-13,6],[-9,21],[-76,279],[0,7],[0,7],[2,7],[4,13],[1,16],[-1,16],[-4,12],[-8,12],[-2,26],[1,30],[-1,29],[-4,13],[-11,17],[-4,13],[-9,47],[-4,14],[-3,19],[3,13],[3,11],[-1,10],[-7,11],[-6,8],[-29,16],[-14,14],[-14,19],[-11,24],[-4,13],[-4,19],[-2,20],[1,17],[3,21],[-2,17],[-4,11],[-13,0],[-13,8],[-5,-5],[-2,-12],[-1,-12],[-1,-13],[-4,-12],[-10,-7],[-33,-5],[-10,5],[-3,11],[-3,27],[-2,13],[-5,10],[-11,5],[-5,6],[-4,12],[-2,16],[-3,14],[-4,5],[-6,3],[-4,9],[-2,13],[0,16],[-1,26],[-10,10],[-12,-1],[-8,-7],[-16,-1],[-5,2],[-12,14],[-5,0],[-6,-6],[-15,-25],[-6,-12],[-7,-12],[-8,-3],[-16,6],[-29,1],[-9,8],[-35,99],[-5,8],[-8,5],[-18,-6],[-9,1],[-9,14],[-20,43],[-9,7],[-8,-2],[-6,4],[-13,21],[-4,14],[-3,17],[-1,18],[-2,18],[-1,19],[4,35],[-2,17],[-20,47],[-7,7],[-6,-2],[-6,-4],[-7,0],[-11,14],[-16,43],[-8,14],[-22,23],[-5,2],[-11,-2],[-5,1],[-6,5],[-10,16],[-8,10],[-6,12],[-2,4],[-4,0],[-7,-4],[-4,1],[-10,11],[-10,22],[-3,23],[11,16],[4,8],[2,10],[2,10],[2,7],[14,19],[3,9],[-1,24],[-8,20],[-18,26],[-8,4],[-14,-2],[-20,20],[-6,8],[-5,12],[-1,8],[-1,20],[-1,9],[-3,7],[-3,4],[-7,6],[-5,11],[-1,17],[2,17],[5,15],[24,24],[12,21],[-1,34],[-4,11],[-6,4],[-5,8],[-2,21],[2,20],[2,14],[2,14],[-1,22],[-4,28],[-1,11],[6,-5],[6,-1],[32,9],[6,7],[5,15],[11,22],[25,31],[11,22],[1,24],[-6,28],[-4,29],[6,28],[3,11],[5,31],[4,13],[8,10],[56,20],[7,0],[15,-10],[8,-1],[20,2],[6,5],[13,17],[4,3],[1,1],[5,-2],[5,-7],[8,-23],[6,-12],[8,-4],[47,-6],[1,5],[-6,30],[0,36],[1,15],[3,10],[6,4],[6,-6],[4,-12],[2,-15],[4,-14],[3,-9],[2,-10],[2,-10],[4,-6],[12,5],[46,40],[11,18],[6,22],[-4,24],[-8,27],[3,22],[9,12],[11,-5],[19,-34],[8,-12],[11,1],[8,16],[6,24],[7,18],[11,0],[14,19],[30,21],[20,22],[6,11],[3,14],[-3,17],[-6,8],[-13,13],[-4,12],[0,9],[4,10],[1,11],[-1,5],[-6,10],[-2,6],[0,12],[2,37],[1,9],[3,5],[10,18],[17,12],[45,3],[17,8],[15,15],[9,25],[0,10]],[[703,7983],[7,-7],[17,-20],[3,-7],[2,-4],[2,-7],[8,-41],[9,-59],[3,-29],[0,-6],[1,-23],[0,-6],[1,-12],[2,-8],[20,-65],[5,-21],[5,-46],[1,-5],[2,-10],[3,-10],[1,-10],[2,-10],[2,-6],[3,-6],[9,-16],[57,-58],[33,-55],[4,-15],[3,-15],[-2,-10],[-1,-6],[1,-7],[1,-4],[1,-10],[5,-24],[2,-4],[1,-3],[8,-9],[18,-1],[31,-9],[8,-2],[2,-3],[2,-5],[1,-10],[2,-27],[0,-6],[-1,-5],[-1,-10],[0,-5],[0,-6],[1,-5],[1,-8],[1,-8],[20,-61],[2,-5],[3,-5],[1,-3],[8,-42],[18,-84],[5,-9],[8,-11],[22,-15],[4,-4],[2,-5],[3,-6],[7,-25],[10,-19],[3,-8],[1,-6],[5,-21],[10,-78],[2,-7],[1,-8],[0,-7],[-2,-24],[0,-19]],[[7302,4404],[115,-112],[6,-14],[4,-18],[4,-37],[28,-130],[7,-44],[4,-48],[-5,-252],[0,-29],[2,-7],[5,-12],[8,-11],[10,-20],[4,-23],[3,-59],[6,-20],[7,-13],[8,-12],[7,-13],[7,-22],[3,-18],[1,-21],[-1,-47],[0,-43],[2,-54],[0,-5]],[[7537,3320],[-4,0],[-5,-2],[-3,-7],[-3,-8],[-3,-8],[-7,-6],[-13,-8],[-6,-6],[-18,-29],[-8,-19],[-7,-21],[-58,-259],[-3,-24],[0,-15],[1,-33],[0,-16],[-2,-16],[-3,-13],[-6,-22],[-8,-39],[-3,-10],[-1,-2],[-7,-16],[-8,-27],[-5,-30],[-3,-27],[0,-39],[4,-20],[20,-25],[5,-16],[2,-17],[2,-37],[5,-35],[8,-30],[28,-86],[10,-24],[35,-52],[10,-21],[8,-24],[29,-112],[4,-32],[1,-28],[-1,-32],[-3,-25],[-7,-12],[-6,-2],[-14,-15],[-23,3],[-6,-6],[-49,-133],[-9,-20],[-10,-11],[-33,-6],[-9,-8],[-19,-36],[-75,-67],[-39,-49],[-12,-26],[-42,-132],[-37,-86],[-4,-20],[-8,-47],[-10,-41],[-13,-32],[-29,-53],[-7,-16],[-8,-50],[-6,-16],[-83,-81],[-10,-15],[-4,-9],[-3,-7],[-3,-6],[-4,-5],[-6,-2],[-17,0],[-23,-7],[-77,-76],[-46,-77],[-2,-3],[-2,0],[-2,-1],[-1,-8],[-2,-4],[-1,-1],[-49,-9],[-15,-11],[-8,-3],[-81,23],[-10,-2],[-31,-37],[-10,-8],[-10,-2],[-81,35],[-67,-2],[-27,16],[-18,4],[-39,-14]],[[6314,809],[-10,454],[1,23],[4,40],[4,44],[2,43],[-1,37],[-1,37],[-15,181],[-4,87],[-1,114],[-2,143],[-65,437],[-28,122],[-2,21],[-2,17],[1,29],[13,136]],[[6208,2774],[16,26],[4,18],[5,28],[9,154],[4,36],[6,17],[8,8],[24,5],[110,31],[30,39],[15,62],[9,33],[12,19],[5,4],[5,1],[12,-1],[7,5],[3,10],[-1,20],[-6,52],[-23,308],[-6,193],[1,70],[8,97],[17,113],[-11,2],[-43,-33],[-8,10],[-9,19],[-11,43],[-4,12],[-4,13],[-3,33],[1,29],[9,142],[1,63],[-1,19],[-3,29],[-7,45],[-12,40],[-50,112],[-5,16],[-1,13],[3,14],[7,18],[30,54],[3,8],[-15,5],[-22,0],[-13,7],[-9,8],[-9,18],[-7,18],[-4,41]],[[6285,4920],[14,18],[15,9],[20,8],[27,0],[48,-19],[38,-10],[50,49],[22,27],[11,22],[4,11],[22,110]],[[6556,5145],[37,-35],[6,-38],[1,-14],[1,-20],[-1,-68],[1,-6],[3,-7],[3,2],[2,3],[11,35],[5,11],[6,6],[5,-3],[5,-14],[3,-25],[2,-27],[0,-26],[-1,-19],[-2,-25],[-5,-31],[-23,-91],[-4,-19],[-1,-20],[-1,-12],[0,-18],[1,-9],[2,-16],[1,-8],[10,-44],[29,-61],[8,-30],[10,-54],[7,-21],[8,-18],[46,-68],[31,-7],[77,17],[14,10],[15,20],[49,86],[2,7],[10,48],[12,87],[1,18],[0,17],[-9,87],[0,29],[4,12],[13,3],[18,-2],[7,-9],[9,-19],[9,-37],[17,-56],[51,-112],[6,-19],[6,-28],[9,-57],[10,-36],[27,-56],[65,-84],[20,-17],[18,-1],[21,32],[59,116]],[[6314,809],[-133,-48],[-133,-48],[-133,-49],[-139,-139],[-140,-139],[-123,-145],[-22,-27],[-14,-25],[-4,-4],[-6,-4],[-16,-20],[-17,-7],[-6,-5],[-58,-140],[-12,-9],[-12,34],[-7,16],[-7,6],[-90,0],[-30,11],[-2,9],[1,194],[-122,-55],[-121,-54],[-9,3],[-91,111],[-91,111],[-10,11],[-108,57],[-107,57],[-108,57],[-19,22],[-27,66],[-47,174],[-30,51],[-35,21],[-36,7],[-59,-14],[-125,46],[-124,47],[-125,46],[-14,0],[-109,-75]],[[3694,959],[-32,573],[-15,787],[1,59],[2,13],[2,6],[94,55],[4,0],[4,-1],[5,-7],[53,-107],[34,-103],[46,-102],[21,-17],[28,12],[239,-8],[8,3],[15,12],[154,209]],[[4357,2343],[24,23],[91,64],[156,26],[116,-21],[1,16],[-3,25],[-19,116],[0,31],[4,27],[15,30],[4,15],[6,27],[5,46],[5,30],[54,254],[9,35],[64,76],[53,88],[9,22],[7,20],[21,91],[3,17],[2,15]],[[4984,3416],[102,-4],[7,-20],[1,-7],[1,-4],[0,-6],[-1,-17],[0,-12],[1,-37],[0,-6],[-1,-6],[0,-5],[-3,-13],[-1,-5],[0,-6],[0,-6],[0,-7],[1,-10],[1,-8],[1,-8],[0,-11],[-2,-22],[-1,-11],[0,-7],[0,-10],[13,-56],[7,-21],[8,-14],[23,-16],[138,-48],[128,-30],[89,-19],[18,-11],[6,-9],[40,-157],[20,-63],[9,-39],[4,-23],[0,-18],[0,-20],[4,-25],[6,-19],[25,-45],[24,-31],[24,-23],[9,-5],[97,34],[28,10],[14,9],[23,22],[27,49],[22,25],[178,134],[9,1],[15,-5],[22,-24],[6,-2],[31,10],[51,35]],[[7755,5903],[-22,-9],[-3,-2],[-7,-10],[-5,-3],[-16,-4],[-95,-75],[-18,-25],[-6,-13],[-6,-13],[-4,-14],[-4,-13],[-2,-14],[-2,-15],[-1,-20],[-2,-47],[0,-29],[2,-44],[6,-56],[-38,5],[-39,16],[-6,-1],[-5,-2],[-13,-13],[-14,-18],[-9,-17],[-32,-76],[-10,-38],[-5,-24],[-4,-28],[-10,-177],[-8,-65],[-22,-90],[-29,-106],[-8,-34],[-4,-36],[-2,-75],[1,-20],[3,-31],[10,-71],[2,-21],[1,-19],[-1,-19],[-3,-14],[-20,-62],[-3,-16],[-1,-12],[1,-29]],[[6556,5145],[-22,34],[-10,21],[-10,27],[-4,18],[-5,37],[-13,75],[-4,13],[-10,22],[-3,12],[-6,53],[-1,11],[-1,6],[-20,42],[-2,7],[-4,19],[-6,42],[-2,7],[-3,5],[-4,4],[-3,6],[-2,11],[2,17],[5,13],[4,15]],[[6432,5662],[0,24],[-2,10],[-4,13],[0,12],[1,10],[2,5],[4,5],[2,6],[12,46],[2,16],[0,10],[1,21],[0,5],[1,9],[-2,8],[-3,6],[-1,9],[0,30],[0,13],[-4,39],[1,10],[6,19],[1,13]],[[6449,6001],[21,8],[15,11],[7,6],[13,16],[6,7],[13,26],[19,38],[11,19],[5,7],[11,11],[3,5],[4,11],[4,20],[5,46],[7,38],[7,23],[5,11],[4,7],[6,22],[5,31],[1,23],[-1,24],[-6,56],[-8,46],[-4,38],[-8,56],[-11,110],[-4,31],[-7,32],[-2,14],[-4,48],[-2,15],[-12,44],[-13,65],[-11,40],[-12,28],[-19,37],[-6,13],[-7,12],[-6,14],[-8,14],[-10,24]],[[6460,7148],[5,97],[10,95]],[[6475,7340],[12,-2],[45,17],[33,-1],[22,8],[32,-20],[8,1],[32,17],[39,-8],[8,-6],[8,-8],[17,-14],[6,-5],[12,2],[4,-5],[1,-6],[1,-17],[1,-7],[6,-6],[7,-6],[66,10],[18,-15],[10,-22],[5,-1],[25,-12],[83,-49],[14,3],[13,11],[13,18],[11,23],[5,14],[3,6],[4,-1],[16,-36],[5,-7],[18,-10],[29,-37],[13,-8],[14,-2],[13,3],[34,23],[39,43],[54,80],[42,29],[5,8],[9,23],[6,9],[7,3],[7,-5],[14,-15],[8,-4],[8,1],[7,3],[35,38],[14,9],[115,15],[30,26]],[[7581,7448],[1,-3],[22,-66],[2,-6],[0,-4],[-1,-6],[-3,-9],[-5,-10],[-1,-4],[-2,-5],[2,-42],[10,-128],[11,-71],[2,-25],[-1,-19],[-7,-46],[-3,-21],[5,-34],[12,-57],[60,-227],[19,-96],[6,-39],[4,-52],[-1,-57],[-7,-40],[-5,-64],[8,-161],[16,-65],[4,-14],[13,-55],[13,-119]],[[4326,7031],[4,-35],[3,-18],[12,-28],[7,-12],[6,-13],[15,-19],[12,-2],[8,-4],[3,-3],[7,-8],[8,-19],[4,-13],[3,-19],[3,-11],[5,-8],[6,-5],[7,0],[10,6],[12,17],[13,14],[9,-42],[12,-85],[8,-109],[0,-15],[0,-27],[2,-21],[2,-13],[5,-12],[6,-11],[14,-22],[8,-20],[5,-23],[3,-53],[9,-22],[5,-10],[21,-31],[7,-5],[6,-4],[15,-1],[19,-4],[15,-30],[16,-45],[6,-29],[9,-27],[8,-33],[4,-23],[5,-48],[2,-70],[2,-16],[2,-8],[5,-13],[6,-8],[21,-20],[18,-17],[3,-28],[3,-13],[10,-47],[7,-26],[15,-2],[8,-3],[6,-6],[8,-12],[15,-41],[10,-35],[7,-33],[10,-35],[8,-20],[10,-29],[13,-27],[13,-20],[20,-38],[14,-21],[20,-43],[4,-44],[2,-39]],[[4955,5372],[-33,-43],[-15,-9],[-48,-3],[-55,13],[-12,9],[-7,12],[-16,76],[-6,22],[-9,18],[-54,41],[-8,2],[-17,0],[-25,30],[-4,3],[-9,1],[-5,-8],[-2,-15],[1,-19],[3,-18],[4,-16],[5,-12],[7,-7],[7,-6],[5,-9],[-1,-28],[-19,-87],[-12,-44],[-25,-33],[-3,-14],[-3,-20],[-2,-46],[-5,-53],[-16,-14],[-8,4],[-8,12],[-6,14],[-13,40],[-7,16],[-8,6],[-9,-1],[-36,-32],[-65,-39],[-22,-33],[-8,-21],[-14,-20],[-167,-79]],[[4205,4962],[-20,41],[-7,6],[-39,-18],[-14,-2],[-34,13],[-12,-1],[-22,-17],[-24,0],[-6,8],[-5,13],[-4,22],[-6,43],[-6,19],[-10,17],[-10,8],[-16,9],[-3,3],[-3,10],[-5,34],[-3,22],[-8,27],[-5,23],[-3,59],[-4,8],[-6,2],[-10,-3],[-108,-69],[-28,-14],[-6,1],[-6,9],[-4,15],[-2,23],[0,19],[1,18],[0,13],[-2,15],[-4,17],[-2,17],[-2,26],[0,24],[3,47],[1,25],[-2,23],[-3,25],[-8,22],[-23,39],[-10,19],[-5,14],[-4,24],[-3,29],[1,75],[-8,-2],[-22,-27],[-8,-17],[-5,-15],[-6,-10],[-6,-7],[-20,-7],[-8,-6],[-7,-10],[-15,-42],[-7,-10],[-5,-5],[-9,-8],[-26,-9],[-38,-1],[-9,0],[-9,7],[-54,73],[-6,14],[-3,18],[-1,61],[-7,41],[-5,10],[-4,7],[-5,7],[-5,3],[-6,2],[-25,-7],[-31,-18],[-12,-16],[-20,-39]],[[3312,5751],[-46,10],[-9,7],[-9,12],[-4,15],[-1,18],[1,22],[13,90],[2,21],[-1,26],[-4,33],[-11,56],[-3,25],[8,49],[5,12],[5,14],[8,8],[9,6],[65,3],[24,17],[14,17],[9,22],[11,44],[9,20],[9,9],[19,5],[96,91]],[[3531,6403],[27,-59],[10,-12],[7,-2],[8,4],[10,14],[5,15],[5,14],[3,8],[5,3],[6,-5],[6,-7],[7,-7],[7,-3],[69,13],[7,3],[4,10],[4,21],[4,78],[3,20],[3,14],[7,10],[7,5],[29,-3],[11,-10],[47,-57],[8,-6],[10,-3],[11,2],[9,10],[5,23],[-1,17],[-2,20],[3,18],[9,11],[29,11],[27,18],[14,21],[-7,20],[-3,7],[-2,3],[-2,2],[-6,1],[-4,4],[-2,2],[-1,3],[-3,7],[-3,13],[-1,10],[-1,14],[-1,10],[-3,15],[-1,7],[1,12],[1,11],[4,17],[2,9],[0,9],[0,5],[-1,5],[0,4],[1,4],[6,11],[2,4],[-1,4],[-1,3],[-5,4],[0,5],[2,8],[5,15],[5,12],[4,10],[2,6],[0,6],[-1,4],[0,5],[1,4],[6,8],[5,4],[12,18],[4,4],[4,2],[1,0],[3,1],[2,3],[7,12],[2,5],[2,9],[0,6],[0,3],[-6,19],[-37,41],[-3,5],[-3,6],[-1,10],[1,6],[1,13],[1,11],[4,9],[6,-14],[7,-1],[36,18],[2,7],[0,9],[1,6],[5,12],[11,17],[6,13],[4,13],[1,8],[0,18],[1,5],[1,4],[1,4],[2,6],[4,7],[7,4],[9,-10],[96,-102],[72,-106],[10,-12],[35,-4],[63,27]],[[4205,4962],[11,-49],[4,-12],[35,-73],[29,-77],[3,-76],[1,-16],[3,-17],[4,-13],[2,-14],[-2,-16],[-27,-75],[-5,-26],[3,-17],[4,-9],[4,-16],[4,-22],[2,-48],[0,-39],[-2,-18],[-2,-12],[-6,-16],[-8,-14],[-9,-10],[-17,-14],[-6,-11],[-6,-17],[-5,-20],[-4,-22],[-2,-23],[1,-81],[4,-49],[1,-32],[0,-37],[-14,-102],[1,-50],[0,-23],[-12,-60],[-14,-44],[-18,-36],[-3,-12],[-2,-16],[0,-18],[4,-49],[0,-21],[0,-29],[0,-13],[2,-16],[4,-100],[2,-37],[4,-43],[3,-20],[4,-18],[6,-16],[8,-11],[39,-27],[20,-26],[12,-22],[28,-39],[6,-26],[-8,-54],[-12,-65],[-1,-10],[-1,-14],[2,-17],[4,-24],[14,-68],[9,-56],[51,-446]],[[3694,959],[-46,-31],[-126,37],[-126,38],[-126,38],[-126,37]],[[3144,1078],[-17,498],[0,29],[3,26],[15,74],[24,175],[3,30],[0,29],[-3,86],[14,261],[0,28],[-11,243],[1,85],[2,20],[4,13],[40,47],[15,25],[7,14],[5,12],[7,27],[5,29],[5,44],[2,27],[0,98],[-6,125],[0,31],[1,33],[3,22],[5,17],[4,11],[12,23],[4,10],[10,43],[36,265],[4,50],[1,38],[-17,267],[-6,57],[-9,40],[-59,178],[-11,29],[-5,5],[-9,6],[-10,4],[-15,10],[-7,8],[-7,12],[-11,34],[-9,21],[-27,41],[-6,17],[-6,43],[-6,19],[-6,11],[-14,16],[-5,12],[-2,11],[-8,43],[-3,22],[-2,22],[0,23],[2,77],[-3,66]],[[3078,4760],[-1,53],[2,20],[13,68],[48,315],[3,28],[1,30],[2,26],[5,19],[10,11],[10,4],[30,0],[19,9],[18,18],[26,78],[9,38],[4,28],[-2,20],[-3,17],[1,22],[4,15],[14,32],[9,30],[5,23],[4,19],[2,17],[2,26],[0,10],[0,7],[-1,8]],[[2906,7795],[0,-4],[1,-9],[1,-10],[2,-9],[3,-11],[11,-33],[2,-11],[-3,-11],[-7,-14],[-27,-37],[-25,-46],[-15,-37],[-4,-14],[-5,-21],[-2,-16],[-3,-29],[0,-22],[0,-16],[5,-35],[8,-23],[65,-120],[16,-21],[25,-13],[59,-8],[32,-2],[18,-17],[94,-139],[7,-7],[15,-2],[20,12],[10,9],[9,5],[30,4],[43,-11],[22,-16],[12,-13],[13,-21],[7,-8],[7,-3],[12,2],[8,4],[18,24],[16,47],[15,66],[97,20],[5,-11],[3,-13],[2,-22],[6,-116],[4,-56],[8,-49],[3,-18],[0,-12],[-6,-44],[-5,-27],[-5,-24],[-23,-74],[-2,-13],[-1,-15],[-1,-21],[1,-28],[3,-34],[19,-137],[2,-62]],[[3078,4760],[-25,13],[-23,30],[-15,21],[-13,1],[-5,-4],[-3,-3],[-1,-3],[-4,-17],[-3,-7],[-17,-31],[-10,-14],[-5,-3],[-8,-2],[-4,1],[-3,2],[-8,9],[-4,4],[-3,1],[-33,1],[-16,5],[-1,9],[-2,14],[1,33],[-3,15],[-22,52],[-9,30],[-5,31],[-3,25],[-3,60],[-27,27],[-10,15],[-11,3],[-81,-52],[-11,1],[-2,56],[-5,21],[-7,40],[-6,66],[-7,24],[-18,48],[-7,35],[-7,48],[-5,13],[-6,15],[-11,12],[-4,3],[-9,8],[-113,150],[-21,32],[-19,38],[-3,4],[-10,6],[-11,11],[-13,21],[-79,10],[-9,-8],[-13,-16],[-11,4],[-6,9],[-3,8],[-4,11],[-4,19],[-5,18],[-7,19],[-6,14],[-9,9],[-27,17],[-9,-1],[-10,2],[-2,-1],[-12,-10],[-5,-2],[-37,-2],[-41,8],[-36,26],[-22,7],[-3,2],[-4,5],[-10,18],[-8,10],[-13,11],[-17,7],[-10,1],[-10,-4],[-29,-42],[-41,-45],[-38,-31],[-76,-18]],[[1788,5733],[-28,101],[-37,105],[-3,18],[0,26],[-1,26],[-4,35],[-7,35],[-13,88],[23,29],[16,28],[37,81],[10,30],[5,21],[1,6],[0,9],[0,17],[1,9],[0,7],[2,9],[1,4],[0,3],[1,3],[0,4],[0,6],[-1,4],[-3,8],[-10,15]],[[1778,6460],[19,101],[16,38],[12,18],[11,21],[14,48],[9,20],[128,138],[14,0],[88,-73],[13,-6],[38,3],[9,-6],[14,-18],[2,-3],[29,-7],[52,12],[41,23],[38,42],[22,24],[24,45],[14,6],[25,1],[10,10],[11,44],[5,36],[0,10],[-1,31],[1,21],[3,20],[5,24],[1,22],[-1,25],[-3,26],[0,31],[3,28],[27,108],[1,51],[-2,28],[-4,16],[-6,19],[-7,13],[-20,21],[-9,13],[-5,16],[-2,12],[-4,37],[-4,21],[-8,36],[-3,29],[0,24],[3,22],[5,32],[1,8],[1,4],[0,15],[-2,51],[-5,41],[0,31],[5,16]],[[2406,7879],[1,-2],[6,-5],[7,3],[5,10],[8,26],[6,8],[30,9],[13,12],[12,33],[9,18],[12,7],[12,-4],[8,-21],[4,-27],[6,-19],[7,-6],[9,13],[3,12],[4,11],[4,8],[5,8],[4,4],[5,1],[5,-2],[4,-3],[47,-42],[14,-22],[13,-26],[7,-9],[8,-3],[9,6],[15,21],[8,7],[9,1],[6,-6],[5,-14],[4,-21],[5,-17],[5,-4],[6,5],[7,10],[17,35],[7,4],[83,-26],[11,-20],[12,-40],[4,-10],[9,-7]],[[3144,1078],[-102,31],[-103,30],[-112,-26],[-111,-26],[-30,-11],[-4,2],[-2,2],[-2,15],[-5,119],[-2,22],[-3,20],[-8,22],[-120,266],[-10,31],[-6,36],[-3,39],[-2,44],[-2,35],[-44,210],[-32,226],[-17,84],[-8,20],[-11,8],[-16,1],[-29,18],[-3,9],[0,23],[3,54],[-2,48],[0,9],[1,10],[5,18],[2,26],[4,16],[9,28],[2,18],[-5,7],[-107,-31],[-13,4],[-28,33],[-57,40],[-7,7],[-4,12],[-4,17],[-5,14],[-21,45],[-40,54],[-9,11],[-20,-1],[-9,8],[-5,15],[-8,41],[-6,17],[-25,62],[-4,6],[-6,5],[-5,1],[-14,-15],[-14,0],[-26,8],[-15,12],[-16,40],[-50,152],[-8,15],[-51,57],[-32,4],[-7,5],[-12,17],[-6,6],[-7,1],[-15,-5],[-8,1],[-24,25],[-9,2],[-19,-4]],[[1660,3243],[0,4],[16,302],[2,113],[-8,209],[3,33],[6,22],[8,17],[35,45],[8,14],[6,19],[11,53],[4,13],[8,11],[4,16],[1,17],[-3,49],[1,17],[30,159],[35,135],[5,27],[1,30],[-2,31],[-5,30],[-20,82],[-3,17],[-1,20],[4,8],[7,1],[7,-4],[33,-7],[9,3],[18,12],[34,69],[27,37],[64,60],[13,21],[8,26],[3,17],[1,35],[-12,48],[-28,86],[-17,68],[-6,36],[-4,34],[0,27],[1,24],[-2,20],[-5,15],[-21,21],[-43,59],[-66,123],[-23,46],[-12,36],[-2,18],[-1,15],[-1,51]],[[1660,3243],[-8,-2],[-6,4],[-6,1],[-6,0],[-6,-4],[-9,1],[-9,8],[-17,22],[-4,2],[-11,-5],[-4,-1],[-15,5],[-35,-22],[-21,-2],[-30,-15],[-5,1],[-14,12],[-5,2],[-16,-5],[-5,0],[-14,11],[-5,0],[-16,-9],[-7,4],[-27,42],[-10,10],[-10,6],[-11,1],[-10,-3],[-18,-7],[-53,6],[-7,-1],[-13,-9],[-6,-2],[-31,17],[-4,-2],[-3,-3],[-2,-1],[-4,6],[-21,57],[-5,8],[-7,0],[-5,-9],[-5,-12],[-6,-9],[-6,-1],[-30,16],[-20,22],[-5,10],[-7,22],[-3,10],[-11,12],[-14,7],[-14,1],[-11,-4],[-22,-27],[-10,0],[-5,28],[1,15],[2,11],[0,10],[-4,16],[-5,9],[-13,12],[-1,11],[-1,32],[-3,26],[-5,25],[-3,28],[-5,19],[-20,33],[-7,16],[14,225],[5,21],[64,188],[18,35],[3,5],[5,28],[1,44],[-3,43],[-6,25],[-8,27],[-16,107],[-1,19],[3,15],[10,25],[12,69],[3,18],[5,37],[4,18],[7,34],[3,21],[0,14],[-4,13],[-7,5],[-5,9],[1,24],[4,41],[1,25]],[[1122,6747],[15,12],[17,31],[31,82],[19,66],[10,19],[31,39],[14,11],[11,4],[11,-4],[8,-11],[5,-10],[4,-17],[21,-164],[6,-7],[5,-1],[8,7],[6,2],[7,-3],[9,-20],[7,-27],[11,-64],[6,-25],[6,-10],[8,2],[14,22],[5,4],[113,-55],[34,-16],[15,11],[15,27],[12,30],[16,24],[12,9],[10,2],[15,-6],[4,-3],[2,-3],[1,-3],[4,-7],[26,-27],[5,-13],[2,-6],[1,-6],[1,-5],[1,-6],[1,-24],[2,-23],[2,-11],[1,-5],[2,-8],[1,-4],[1,0],[7,-11],[20,-43],[7,-12],[28,-31]],[[4626,8358],[0,-1],[-17,-20],[-20,-21],[-14,-24],[-12,-28],[-2,-9],[-4,-19],[-2,-12],[-4,-39],[-6,-30],[-3,-8],[-10,-23],[-7,-12],[-6,-13],[-8,-15],[-9,-23],[-1,-13],[-14,-37],[-12,-27],[-7,-23],[-2,-17],[-1,-16],[2,-15],[1,-7],[3,-9],[5,-8],[17,-20],[26,-23],[25,-15],[41,-38],[22,-13],[25,-24],[25,-28],[9,-16],[11,-25],[-25,-40],[-11,-11],[-3,-2],[-7,0],[-17,6],[-7,1],[-6,-3],[-6,-7],[-3,-5],[-3,-12],[-10,-55],[-9,-35],[-3,-11],[-13,-28],[-13,-24],[-6,-7],[-14,-14],[-25,-16],[-13,-3],[-15,-10],[-23,-11],[-18,-15],[-7,-10],[-6,-11],[-12,-28],[-15,-22],[-2,-14],[-4,-13],[-8,-18],[-7,-9],[-5,-3],[-13,-4],[-10,-24],[-5,-15],[-11,-59],[-2,-16],[-1,-16],[1,-24],[5,-61],[1,-7]],[[2906,7795],[5,-3],[6,-8],[2,-17],[8,-24],[16,-16],[18,-7],[12,-1],[13,8],[15,15],[26,37],[21,32],[10,24],[2,29],[-3,17],[-3,12],[1,7],[24,13],[28,27],[7,3],[7,-5],[10,-24],[6,-7],[6,6],[8,23],[10,18],[44,47],[18,39],[49,209],[2,14],[1,19],[-1,16],[-2,30],[1,31],[10,57],[1,31],[-3,24],[-5,18],[-8,13],[-8,6],[-19,7],[-9,6],[-23,36],[-7,13],[-5,18],[-15,77],[-9,49],[1,20],[13,38],[-2,11],[-9,15],[-5,11],[-3,11],[-3,10],[-15,19],[-11,23],[-8,28],[-1,29],[20,81],[5,32],[2,32],[2,13],[9,45],[1,14],[-1,20],[-4,33],[0,14],[2,17],[4,12],[8,23],[4,12],[15,63],[6,21],[3,9],[5,3],[14,14],[8,2],[26,-11],[3,17],[1,23],[-3,41],[1,22],[3,17],[8,32],[3,19],[18,60],[29,26],[60,33],[11,16],[9,21],[9,24],[21,81],[4,45],[3,14],[12,31],[2,13],[1,17],[0,32],[2,15],[10,21],[13,1],[3,-5],[7,-11],[4,-31],[6,-21],[10,-12],[54,-37],[10,-11],[8,-16],[5,-17],[7,-15],[9,-9],[72,-41],[38,-2],[10,-8],[23,-41],[20,-46],[21,-37],[28,-17],[28,6],[35,-12],[94,1],[18,-21],[21,-12],[134,-131],[15,-25],[13,-6],[13,0],[13,-6],[12,-21],[11,-28],[10,-12],[12,0],[29,21],[14,3],[14,-5],[23,-19],[16,2],[9,-2],[5,-5],[17,-25],[8,-5],[25,3],[6,-4],[11,-18],[5,-6],[24,-3],[8,-9],[5,-9],[29,-39],[3,-16],[-5,-20],[-14,-43],[0,-9],[2,-10],[2,-17],[1,-16],[0,-16],[-2,-32],[1,-36],[6,-38],[8,-35],[9,-26],[3,-13],[0,-14],[-1,-13],[-4,-12],[8,-24],[-3,-27],[-5,-26],[-3,-26],[4,-29],[9,-19],[19,-29],[7,-28],[-3,-21],[-7,-21],[-7,-23],[-1,-28],[3,-29],[7,-25],[7,-17],[14,-12],[31,-8],[13,-20],[23,-84],[9,-15],[1,0]],[[703,7983],[0,20],[2,25],[5,18],[10,13],[40,18],[13,11],[38,57],[6,5],[13,3],[6,4],[15,26],[14,3],[27,-11],[13,0],[6,4],[5,5],[5,9],[4,12],[2,13],[0,28],[3,10],[11,13],[24,15],[11,17],[23,55],[8,16],[11,11],[37,1],[10,6],[30,32],[12,0],[26,-11],[11,6],[5,16],[2,19],[4,20],[7,16],[32,24],[8,17],[16,57],[8,16],[22,26],[23,17],[23,5],[51,-20],[30,3],[26,29],[16,68],[1,17],[0,17],[1,15],[4,12],[7,7],[8,5],[7,-3],[5,-14],[6,-37],[7,-24],[10,-15],[13,-9],[12,-17],[18,-52],[11,-13],[7,1],[7,6],[7,10],[6,12],[3,16],[3,31],[2,15],[11,17],[19,7],[20,-3],[12,-14],[4,-34],[0,-45],[6,-38],[3,-19],[3,-10],[3,-7],[6,-6],[20,-11],[10,1],[16,0],[72,9],[36,-23],[109,-9],[109,-10],[6,-7],[5,-12],[1,-15],[1,-34],[12,-61],[3,-23],[1,-98],[4,-49],[3,-25],[5,-19],[7,-17],[26,-22],[5,-9],[2,-12],[1,-14],[2,-14],[4,-12],[13,-25],[4,-12],[5,-27],[4,-10],[6,-4],[8,2],[30,22],[54,5],[10,-5],[9,-15],[7,-30],[6,-22],[2,-6],[15,-17],[86,2],[14,-9],[14,-23],[5,-11],[5,-8]],[[5164,8237],[30,-52],[23,-63],[4,-15],[5,-32],[1,-16],[1,-33],[19,-38],[-2,-8],[-3,-7],[-6,-6],[-6,-3],[-15,-1],[0,-52],[1,-30],[2,-20],[3,-19],[12,-33],[35,-75],[7,-22],[8,-30],[-19,-39],[0,-99],[-1,-31],[-2,-21],[-7,-50],[-8,-30],[-6,-36],[-5,-62],[-8,-64],[-5,-72],[-5,-47]],[[5217,7131],[-16,16],[-8,6],[-13,3],[-8,-2],[-7,-5],[-4,-4],[-18,-37],[-44,29],[-12,9],[-13,-24],[-19,-52],[0,-52],[58,-32],[17,-6],[18,-16],[11,-15],[14,-14]],[[5173,6935],[14,-28],[14,-24],[11,-27],[12,-24],[-2,-6],[-3,-13],[-3,-10],[2,-6],[-4,-16],[3,-67],[2,-38]],[[5219,6676],[3,-83],[1,-73],[-2,-40],[-6,-42],[-3,-15],[-2,-7],[-18,-24],[-13,-26],[-11,-40],[-7,-45],[-4,-18],[-12,-44],[13,-30],[15,-47],[3,-21],[1,-49],[13,-17],[19,-14],[18,-6],[32,-4],[3,4],[3,3],[5,-1],[2,-3],[2,-4],[2,-10],[0,-24],[-6,-12],[1,-47],[1,-28],[13,-104],[6,-43],[-31,-6],[-41,-2],[-4,-22],[-9,-29],[-25,0],[-16,-2],[-8,-3],[-13,-11],[-40,-55],[-13,-27],[-15,-27],[6,-35],[3,-12],[4,-12],[7,-13],[10,-22],[2,-11],[1,-13],[0,-12],[-8,-31]],[[5101,5417],[-23,-15],[-38,-17],[-27,-6],[-7,1],[-10,4],[-8,1],[-10,-3],[-23,-10]],[[4626,8358],[44,-23],[39,-57],[13,-11],[14,-7],[49,13],[22,-12],[12,-50],[4,-28],[7,-16],[10,-7],[31,6],[10,-4],[11,-10],[18,-27],[21,-19],[21,-2],[36,52],[19,-1],[40,-35],[20,-7],[26,7],[24,21],[15,34],[7,21],[16,25],[9,16]],[[5217,7131],[3,-25],[9,-36],[3,-14],[0,-14],[-2,-14],[-4,-10],[-10,-21],[-14,-24],[-29,-38]],[[4984,3416],[-1,62],[3,20],[3,20],[8,35],[-4,27],[-34,68],[-12,37],[-7,23],[-3,21],[-2,23],[-1,22],[0,19],[1,17],[4,17],[11,36],[18,37],[7,11],[8,8],[21,7],[69,17],[16,54],[1,67],[14,138],[0,14],[2,66],[2,9],[3,12],[6,6],[8,6],[40,6],[20,17],[7,17],[4,18],[4,21],[19,50],[3,21],[0,46],[2,21],[2,15],[17,38]],[[5243,4585],[8,-23],[7,-15],[41,75],[18,27],[11,23],[27,74],[29,-23],[30,-20],[22,-18],[19,-23],[7,-13],[12,-18],[15,-29],[25,96],[23,64],[6,15],[28,82],[13,10],[20,11],[11,2],[7,-3],[4,-3],[6,-8],[19,-40],[15,-20],[10,-10],[33,-21],[7,-8],[6,-11],[2,-7],[4,-20],[59,0],[59,-2],[27,1],[21,-1],[31,-13],[11,-7],[19,-23],[13,-26],[18,-39],[14,-26],[19,-26],[25,6],[49,3],[8,3],[16,9],[31,27],[6,8],[5,10],[16,50],[2,6],[6,9],[15,11],[26,7],[8,5],[3,4],[6,12],[2,7],[3,15],[1,15],[2,58],[3,36],[1,38],[32,12]],[[6460,7148],[-12,2],[-10,-1],[-35,-10],[-11,-6],[-23,-21],[-19,-24],[-5,-10],[-8,-17],[-11,-22],[-30,42],[-7,8],[-11,8],[-8,4],[-13,3],[-23,-1],[-8,-2],[-19,-10],[-10,-7],[-22,-33],[-22,-43],[16,-60],[5,-13],[9,-15],[19,-19],[6,-7],[3,-6],[4,-13],[1,-15],[-1,-23],[-7,-38],[-5,-38],[-7,-31],[-4,-28],[-4,-12],[-2,-6],[-7,-7],[-7,-1],[-16,5],[-6,-1],[-5,-5],[-10,-14],[-13,-12],[-19,-13],[-37,-24],[-13,33],[-5,9],[-6,6],[-8,6],[-11,3],[-12,-3],[-24,-12],[-6,-2],[-22,3],[-11,-3],[-5,-7],[-9,-15],[-8,-17],[-13,-25],[-9,-9],[-11,-6],[-10,1],[-28,12],[-12,10],[-18,19],[-3,16],[-6,11],[-48,48],[-38,44],[-10,-15],[-7,-10],[-15,-12],[-16,20],[-6,10],[-3,8],[7,34],[5,39],[0,24],[-2,15],[-2,8],[-5,13],[-10,15],[-11,7],[-30,13],[-57,-28],[-21,-15],[-7,-7],[-15,-20],[-21,-33],[4,-26],[6,-50],[6,-30],[-21,-23],[-22,-20],[-17,-20],[-10,-14],[-7,-5],[-18,-7],[-7,-4],[-20,-21],[-8,-10],[-6,-6],[-7,-3],[-7,1],[-16,9],[-21,18],[-22,12],[-15,11],[-22,20],[-55,44]],[[5164,8237],[8,17],[9,10],[21,12],[32,-3],[11,4],[7,9],[12,24],[8,4],[28,0],[9,5],[19,24],[7,6],[10,3],[36,-9],[9,2],[9,4],[8,8],[34,57],[11,14],[16,3],[97,-51],[43,6],[9,-4],[14,-13],[16,-7],[17,0],[8,-3],[17,-27],[1,-7],[0,-8],[0,-9],[2,-8],[2,-4],[25,-6],[8,-7],[12,-19],[7,-7],[7,-2],[60,35],[34,8],[34,-8],[28,-19],[13,-15],[46,-78],[11,-12],[3,-9],[5,-36],[2,-9],[7,-13],[2,-7],[2,-10],[2,-22],[3,-10],[4,-8],[10,-9],[4,-6],[16,-30],[8,-12],[10,-8],[10,1],[8,9],[7,2],[19,-32],[113,-4],[5,-5],[2,-1],[11,-17],[7,-4],[9,3],[4,-1],[15,-10],[15,-2],[3,-9],[-1,-25],[-3,-16],[-3,-13],[-2,-15],[1,-20],[6,-45],[1,-35],[0,-12],[-1,-12],[-7,-35],[0,-13],[3,-6],[8,-2],[12,2],[4,-7],[-2,-21],[-1,-15],[3,-15],[5,-12],[23,-33],[7,-7],[25,-7],[9,-7],[4,-10],[3,-12],[2,-13],[3,-12],[18,-44],[43,-76],[20,-27],[10,-2]],[[5689,7121],[8,2],[7,4],[4,4],[6,9],[11,25],[20,24],[19,13],[7,3],[17,2],[10,-29],[15,-22],[10,-11],[41,-31],[35,21],[26,21],[-1,73],[-5,53],[3,50],[3,49],[1,60],[-1,36],[-2,19],[-4,18],[-4,11],[-9,16],[-5,7],[-11,10],[-10,13],[-10,9],[-36,26],[-11,-36],[-7,-16],[-12,-20],[-6,-5],[-8,-1],[-10,3],[-15,11],[-14,13],[-12,18],[-15,13],[-10,14],[-14,11],[-11,5],[3,23],[6,29],[17,41],[3,10],[1,6],[1,13],[1,21],[-2,53],[-26,-16],[-3,-5],[-1,-3],[-9,-36],[-7,-19],[-4,-9],[-5,-4],[-18,-27],[-2,-7],[-8,-28],[-3,-10],[-8,-14],[2,-30],[6,-26],[1,-19],[1,-18],[6,-21],[2,-10],[1,-11],[0,-2],[1,-21],[-2,-41],[-1,-17],[-8,-96],[-5,-74],[-7,-67],[-5,-26],[19,-15],[12,-7],[34,-11],[7,-1]],[[5101,5417],[-1,-32],[1,-25],[5,-56],[5,-29],[3,-11],[12,-28],[19,-36],[12,-27],[3,-12],[3,-14],[2,-15],[1,-21],[-1,-24],[-2,-42],[-9,-3],[-6,-5],[-7,-14],[-13,-29],[12,-31],[10,-31],[6,-15],[6,-30],[8,-26],[4,-18],[2,-18],[1,-16],[0,-92],[2,-15],[2,-15],[3,-9],[5,-8],[40,-59],[14,-26]],[[6449,6001],[-41,4],[-22,-46],[-10,-24],[-4,-18],[-7,-40],[-4,-31],[-1,-26],[1,-17],[5,-40],[3,-39],[11,-30],[5,-11],[7,-6],[40,-15]],[[5883,5808],[46,10],[37,13],[8,1],[24,-3],[12,-4],[12,-10],[11,-16],[24,-43],[8,-10],[8,-5],[19,-4],[24,1],[14,5],[16,9],[1,23],[9,89],[3,45],[8,63],[0,14],[-2,15],[-4,12],[-9,11],[-20,15],[-20,9],[-8,5],[-7,8],[-6,11],[-6,13],[-8,24],[-9,20],[-19,63],[-16,40],[-7,24],[-8,34],[-30,-26],[-26,-16],[-11,-2],[-8,3],[-17,17],[-9,4],[-26,10],[-32,17],[1,1],[-73,28],[7,-42],[4,-45],[10,-64],[2,-124],[8,-20],[4,-15],[6,-29],[4,-32],[0,-75],[1,-17],[3,-15],[3,-7],[7,-10],[26,-12],[11,-11]],[[8966,4469],[-26,64],[-64,218],[-4,12],[-5,7],[-6,5],[-132,-13],[-59,-26],[-143,-10],[-28,-17],[-52,-56],[-37,145],[-19,58],[-9,22],[-10,18],[-9,13],[-9,12],[-35,29],[-6,7],[-4,9],[-4,15],[-3,19],[-2,24],[1,77],[11,172],[-3,25],[-4,11],[-7,12],[-54,62],[-142,236],[-189,86],[-60,59],[-16,7],[-9,0],[-10,-2],[-10,-7],[-53,-60],[3,114],[-3,87]],[[7581,7448],[95,85],[13,5],[34,-8],[27,-29],[9,-4],[11,1],[13,9],[28,28],[18,33],[7,9],[7,7],[7,4],[16,1],[5,7],[4,21],[0,34],[1,14],[3,18],[22,85],[8,24],[9,19],[63,95],[9,22],[5,11],[16,22],[5,12],[16,25],[54,56],[7,3],[13,-5],[6,0],[4,4],[39,76],[6,7],[13,8],[6,7],[20,38],[25,30],[27,20],[15,-4],[28,-29],[15,-8],[58,17],[29,-15],[76,-87],[6,-11],[4,-12],[6,-27],[5,-13],[45,-100],[49,-73],[6,-4],[20,0],[7,-4],[11,0],[22,7],[32,-16],[10,0],[11,7],[94,108],[26,15],[25,0],[26,-20],[86,-68],[13,-23],[11,-32],[9,-38],[-65,-291],[-5,-23],[-65,-295],[-66,-295],[-1,-17],[4,-33],[1,-17],[-7,-31],[-70,-224],[-3,-16],[-2,-20],[0,-19],[7,-189],[-2,-30],[-10,-17],[-72,-71],[-7,-16],[0,-10],[10,-122],[5,-57],[4,-22],[7,-21],[79,-173],[19,-20],[18,24],[35,93],[30,40],[19,13],[58,-27],[22,1],[78,36],[22,2],[10,-4],[37,-32],[23,-18],[7,-8],[77,-148],[14,-3],[12,33],[11,42],[11,25],[17,28],[67,181],[8,15],[15,11],[49,-6],[7,2],[21,18],[18,8],[19,0],[7,-4],[15,-20],[8,-4],[60,-8],[22,-22],[19,-49],[34,-115],[17,-36],[64,-57],[27,-21],[7,-11],[4,-14],[2,-18],[4,-68],[2,-17],[4,-10],[7,-10],[29,-23],[13,-8],[5,-8],[3,-13],[-2,-10],[-7,-22],[-2,-13],[12,-8],[48,-92],[5,-12],[4,-17],[3,-16],[3,-11],[20,-12],[13,-21],[22,-53],[9,-30],[7,-32],[2,-19],[1,-56],[1,-11],[1,-5],[0,-5],[5,-14],[10,-22],[5,-13],[1,-8],[1,-7],[1,-7],[3,-7],[3,-2],[5,-1],[5,-2],[1,-7],[-2,-10],[-2,-7],[-1,-7],[0,-12],[1,-5],[1,-4],[1,-2],[2,-2],[2,-4],[-1,-5],[-1,-6],[0,-6],[0,-21],[-4,-31],[0,-16],[1,-8],[5,-17],[1,-8],[-1,-9],[-2,-7],[-2,-6],[-6,-21],[-5,-12],[-7,-9],[-5,1],[-6,7],[-5,-3],[-4,-12],[-4,-18],[-5,-10],[-6,-10],[-7,-8],[-6,-3],[-6,4],[-11,19],[-7,4],[-8,-1],[-23,9],[-15,-1],[-28,-14],[-14,-1],[-80,47],[-7,7],[-8,14],[-9,39],[-5,15],[-6,-3],[-8,-21],[-5,-5],[-5,4],[-3,13],[-2,15],[-2,14],[-7,7],[-9,-7],[-7,-19],[-12,-45],[-11,-13],[-11,6],[-11,14],[-12,7],[-5,-2],[-8,-13],[-5,-4],[-25,0],[-11,5],[-20,22],[-11,8],[-11,2],[-10,-1],[-10,-8],[-10,-13],[-11,-22],[-4,-3],[-17,-2],[-6,-4],[-24,-39],[-10,-4],[-15,-8],[-8,-7],[-7,-10],[-5,-16],[-9,-35],[-5,-15],[-6,-7],[-31,-7],[-7,3],[-15,19],[-6,14],[-8,39],[-4,11],[-4,-2],[-14,-21],[-3,-2],[-3,2],[-6,5],[-24,-12],[5,-30],[1,-15],[-2,-13],[-12,-33],[-3,-26],[-2,-65],[-5,-21],[-11,-7],[-107,15],[-39,19],[-5,1],[-3,-4],[-6,-16],[-20,-35],[-4,-5],[-20,-5],[-13,-9],[-6,-10]],[[8966,4469],[-5,-7],[-6,-30],[-3,-17],[-4,-14],[-52,-115],[-45,-187],[-2,-26],[4,-30],[7,-21],[3,-23],[-7,-31],[-19,-58],[-8,-14],[-15,-17],[-5,-3],[-5,0],[-16,5],[-3,-3],[-6,-15],[-67,-123],[-23,-58],[-8,-14],[-9,-9],[-51,-30],[-42,-17],[-66,0],[-58,-20],[-11,4],[-52,45],[-10,2],[-11,-4],[-42,-36],[-3,-5],[-1,-9],[-3,-43],[-3,-21],[-9,-42],[-17,-54],[-64,-132],[-15,-21],[-5,-10],[-3,-10],[-6,-25],[-9,-30],[-11,-20],[-12,-12],[-13,-8],[-19,-4],[-7,-6],[-16,-39],[-32,-49],[-20,-45],[-11,-21],[-10,-6],[-22,5],[-5,4],[-9,16],[-5,4],[-114,23],[-27,25],[-14,0],[-70,42],[-42,41],[-8,14],[-7,19],[-13,47],[-25,56],[-9,13],[-11,5],[-84,-4],[-30,20],[-8,-1]]],"transform":{"scale":[0.0032174535405540532,0.001054449357735778],"translate":[87.73570886300013,41.58614491800003]}};
  Datamap.prototype.mnpTopo = '__MNP__';
  Datamap.prototype.mozTopo = '__MOZ__';
  Datamap.prototype.mrtTopo = '__MRT__';
  Datamap.prototype.msrTopo = '__MSR__';
  Datamap.prototype.musTopo = '__MUS__';
  Datamap.prototype.mwiTopo = '__MWI__';
  Datamap.prototype.mysTopo = '__MYS__';
  Datamap.prototype.namTopo = '__NAM__';
  Datamap.prototype.nclTopo = '__NCL__';
  Datamap.prototype.nerTopo = '__NER__';
  Datamap.prototype.nfkTopo = '__NFK__';
  Datamap.prototype.ngaTopo = '__NGA__';
  Datamap.prototype.nicTopo = '__NIC__';
  Datamap.prototype.niuTopo = '__NIU__';
  Datamap.prototype.nldTopo = '__NLD__';
  Datamap.prototype.nplTopo = '__NPL__';
  Datamap.prototype.nruTopo = '__NRU__';
  Datamap.prototype.nulTopo = '__NUL__';
  Datamap.prototype.nzlTopo = '__NZL__';
  Datamap.prototype.omnTopo = '__OMN__';
  Datamap.prototype.pakTopo = '__PAK__';
  Datamap.prototype.panTopo = '__PAN__';
  Datamap.prototype.pcnTopo = '__PCN__';
  Datamap.prototype.perTopo = '__PER__';
  Datamap.prototype.pgaTopo = '__PGA__';
  Datamap.prototype.phlTopo = '__PHL__';
  Datamap.prototype.plwTopo = '__PLW__';
  Datamap.prototype.pngTopo = '__PNG__';
  Datamap.prototype.polTopo = '__POL__';
  Datamap.prototype.priTopo = '__PRI__';
  Datamap.prototype.prkTopo = '__PRK__';
  Datamap.prototype.prtTopo = '__PRT__';
  Datamap.prototype.pryTopo = '__PRY__';
  Datamap.prototype.pyfTopo = '__PYF__';
  Datamap.prototype.qatTopo = '__QAT__';
  Datamap.prototype.rouTopo = '__ROU__';
  Datamap.prototype.rusTopo = '__RUS__';
  Datamap.prototype.rwaTopo = '__RWA__';
  Datamap.prototype.sahTopo = '__SAH__';
  Datamap.prototype.sauTopo = '__SAU__';
  Datamap.prototype.scrTopo = '__SCR__';
  Datamap.prototype.sdnTopo = '__SDN__';
  Datamap.prototype.sdsTopo = '__SDS__';
  Datamap.prototype.senTopo = '__SEN__';
  Datamap.prototype.serTopo = '__SER__';
  Datamap.prototype.sgpTopo = '__SGP__';
  Datamap.prototype.sgsTopo = '__SGS__';
  Datamap.prototype.shnTopo = '__SHN__';
  Datamap.prototype.slbTopo = '__SLB__';
  Datamap.prototype.sleTopo = '__SLE__';
  Datamap.prototype.slvTopo = '__SLV__';
  Datamap.prototype.smrTopo = '__SMR__';
  Datamap.prototype.solTopo = '__SOL__';
  Datamap.prototype.somTopo = '__SOM__';
  Datamap.prototype.spmTopo = '__SPM__';
  Datamap.prototype.srbTopo = '__SRB__';
  Datamap.prototype.stpTopo = '__STP__';
  Datamap.prototype.surTopo = '__SUR__';
  Datamap.prototype.svkTopo = '__SVK__';
  Datamap.prototype.svnTopo = '__SVN__';
  Datamap.prototype.sweTopo = '__SWE__';
  Datamap.prototype.swzTopo = '__SWZ__';
  Datamap.prototype.sxmTopo = '__SXM__';
  Datamap.prototype.sycTopo = '__SYC__';
  Datamap.prototype.syrTopo = '__SYR__';
  Datamap.prototype.tcaTopo = '__TCA__';
  Datamap.prototype.tcdTopo = '__TCD__';
  Datamap.prototype.tgoTopo = '__TGO__';
  Datamap.prototype.thaTopo = '__THA__';
  Datamap.prototype.tjkTopo = '__TJK__';
  Datamap.prototype.tkmTopo = '__TKM__';
  Datamap.prototype.tlsTopo = '__TLS__';
  Datamap.prototype.tonTopo = '__TON__';
  Datamap.prototype.ttoTopo = '__TTO__';
  Datamap.prototype.tunTopo = '__TUN__';
  Datamap.prototype.turTopo = '__TUR__';
  Datamap.prototype.tuvTopo = '__TUV__';
  Datamap.prototype.twnTopo = '__TWN__';
  Datamap.prototype.tzaTopo = '__TZA__';
  Datamap.prototype.ugaTopo = '__UGA__';
  Datamap.prototype.ukrTopo = '__UKR__';
  Datamap.prototype.umiTopo = '__UMI__';
  Datamap.prototype.uryTopo = '__URY__';
  Datamap.prototype.usaTopo = '__USA__';
  Datamap.prototype.usgTopo = '__USG__';
  Datamap.prototype.uzbTopo = '__UZB__';
  Datamap.prototype.vatTopo = '__VAT__';
  Datamap.prototype.vctTopo = '__VCT__';
  Datamap.prototype.venTopo = '__VEN__';
  Datamap.prototype.vgbTopo = '__VGB__';
  Datamap.prototype.virTopo = '__VIR__';
  Datamap.prototype.vnmTopo = '__VNM__';
  Datamap.prototype.vutTopo = '__VUT__';
  Datamap.prototype.wlfTopo = '__WLF__';
  Datamap.prototype.wsbTopo = '__WSB__';
  Datamap.prototype.wsmTopo = '__WSM__';
  Datamap.prototype.yemTopo = '__YEM__';
  Datamap.prototype.zafTopo = '__ZAF__';
  Datamap.prototype.zmbTopo = '__ZMB__';
  Datamap.prototype.zweTopo = '__ZWE__';

  /**************************************
                Utilities
  ***************************************/

  //convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function(lat, lng) {
     return this.projection([lng, lat]);
  };

  //add <g> layer to root SVG
  Datamap.prototype.addLayer = function( className, id, first ) {
    var layer;
    if ( first ) {
      layer = this.svg.insert('g', ':first-child')
    }
    else {
      layer = this.svg.append('g')
    }
    return layer.attr('id', id || '')
      .attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function(data) {
    var svg = this.svg;
    for ( var subunit in data ) {
      if ( data.hasOwnProperty(subunit) ) {
        var color;
        var subunitData = data[subunit]
        if ( ! subunit ) {
          continue;
        }
        else if ( typeof subunitData === "string" ) {
          color = subunitData;
        }
        else if ( typeof subunitData.color === "string" ) {
          color = subunitData.color;
        }
        else {
          color = this.options.fills[ subunitData.fillKey ];
        }
        //if it's an object, overriding the previous data
        if ( subunitData === Object(subunitData) ) {
          this.options.data[subunit] = defaults(subunitData, this.options.data[subunit] || {});
          var geo = this.svg.select('.' + subunit).attr('data-info', JSON.stringify(this.options.data[subunit]));
        }
        svg
          .selectAll('.' + subunit)
          .transition()
            .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function() {
      var position = d3.mouse(self.options.element);
      d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover')
        .style('top', ( (position[1] + 30)) + "px")
        .html(function() {
          var data = JSON.parse(element.attr('data-info'));
          try {
            return options.popupTemplate(d, data);
          } catch (e) {
            return "";
          }
        })
        .style('left', ( position[0]) + "px");
    });

    d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover').style('display', 'block');
  };

  Datamap.prototype.addPlugin = function( name, pluginFn ) {
    var self = this;
    if ( typeof Datamap.prototype[name] === "undefined" ) {
      Datamap.prototype[name] = function(data, options, callback, createNewLayer) {
        var layer;
        if ( typeof createNewLayer === "undefined" ) {
          createNewLayer = false;
        }

        if ( typeof options === 'function' ) {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, self.options[name + 'Config']);

        //add a single layer, reuse the old layer
        if ( !createNewLayer && this.options[name + 'Layer'] ) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        }
        else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if ( callback ) {
          callback(layer);
        }
      };
    }
  };

  // expose library
  if (typeof exports === 'object') {
    d3 = require('d3');
    topojson = require('topojson');
    module.exports = Datamap;
  }
  else if ( typeof define === "function" && define.amd ) {
    define( "datamaps", ["require", "d3", "topojson"], function(require) {
      d3 = require('d3');
      topojson = require('topojson');

      return Datamap;
    });
  }
  else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if ( window.jQuery ) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if ( typeof callback === "function" ) {
        callback(datamap, options);
      }
      return this;
    };
  }
})();