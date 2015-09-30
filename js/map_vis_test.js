MapVis = function(_parentElement, _geography, _population, _originalData, _stateMap, _eventHandler){
  this.parentElement = _parentElement;
  this.geography = _geography;
  this.population = _population;
  this.data = _originalData;
  this.filteredData = _originalData;
  this.stateMap = _stateMap;
  this.eventHandler = _eventHandler;
  this.displayLayers = [];
  this.crimeStats = [];
  this.countCrimes();
  this.initVis();

}

MapVis.prototype.initVis = function(){
  var that = this;
  this.map = new L.Map("map", {center: [37.756503, -122.439788], zoom: 12, attributionControl: true});
  this.sf = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
     attribution: 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
     maxZoom: 18,
     id: 'wentaoxu.cien3mu2z05evrskmbwjttxv8',
     accessToken: 'pk.eyJ1Ijoid2VudGFveHUiLCJhIjoiY2llbjNtdW13MDVmMHJza20wY3B0ZnFoaCJ9.bCIlhzQz6O58tT9s0_z2Mw',
     minZoom: 11
  }).addTo(this.map);

  this.svg = d3.select(this.map.getPanes().overlayPane).append("this.svg")
  this.g = this.svg.append("this.g").attr("class", "leaflet-zoom-hide");

  this.addFeatures()
}

MapVis.prototype.addFeatures = function(){
  var that = this;
  var transform = d3.geo.transform({point: projectPoint});
  var path = d3.geo.path().projection(transform);
  this.feature = that.g.selectAll("path")
    .data(that.geography.features)
    .enter().append("path")

  this.map.on("viewreset", reset);
  reset();
  
  
  function reset() {

    var bounds = path.bounds(that.geography),
      topLeft = bounds[0];
      bottomRight = bounds[1];
  console.log(bounds);
    that.svg.attr("width", bottomRight[0] - topLeft[0])
      .attr("height", bottomRight[1] - topLeft[1])
      .style("left", topLeft[0] + "px")
      .style("top", topLeft[0] + "px")

    that.g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
    that.feature.attr("d", path);
  }
  function projectPoint(x, y){
    var point = that.map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }

  function highlightFeature(e){
    var layer = e.target;
    layer.setStyle({
        fillColor: '#CC0000',
        fillOpacity: 0.5
    });
  }

  function resetHighlight(e){
    that.displayLayers["neighborhood"].resetStyle(e.target);
  }

  function zoomToFeature(e){
    that.stateMap.location = e.target.feature.properties.id;
    that.map.fitBounds(e.target.getBounds());
  }

  function onEachFeature(feature, layer){
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  function getColor(d, pop){
    var val = (d/pop)/(that.crimeStats['city']['total']/that.population['city'])
    return val > 4.00  ? '#08306b' :
    val > 2.00  ? '#08519c' : 
    val > 1.50  ? '#2171b5' :
    val > 1.00  ? '#4292c6' :
    val > 0.75  ? '#6baed6' :
    val > 0.50  ? '#9ecae1' :
    val > 0.25  ? '#c6dbef' : '#deebf7';
  }

  function style(feature){
    if (that.crimeStats['city']['total'] > 0){
      return {
        fillColor: getColor(that.crimeStats[feature.id]['total'], that.population[feature.id]),
        fillOpacity: 1,
        weight: 2,
        color: 'white',
        dashArray: '',
      }
    }
    else{
      return {
        fillColor: "#cccccc",
        weight: 2,
        color: 'white',
        dashArray: ''
      };
    }
  }

  this.displayLayers["neighborhood"] = L.geoJson(that.geography, {
      onEachFeature: onEachFeature, style: style, className: "neighborhood"
      })
        .setZIndex(0)
        .addTo(that.map);

  for (var key in stateMap.crimeType){
    that.displayLayers[key] = L.geoJson(that.filteredData[key], {
      pointToLayer: function(feature, latlng){
        return L.circle(latlng, 30, {className: key});
      }
    })
  }
  this.displayLayers['homicide'].addTo(that.map);
}

MapVis.prototype.countCrimes = function(){     
  var that = this;
  for (var zip in that.population){
    that.crimeStats[zip] = {}
    that.crimeStats[zip]['total'] = 0;
    for (var key in that.stateMap.crimeType){
      that.crimeStats[zip][key] = 0;
    }
  }
  that.crimeStats['N/A'] = {};
  that.crimeStats['N/A']['total'] = 0;
  for (var key in that.stateMap.crimeType){  
    that.crimeStats['N/A'][key] = 0;
  }

  for (var key in that.stateMap.crimeType){
    if (key in that.filteredData && that.stateMap.crimeType[key]){
      var crime = that.filteredData[key].features;
      crime.forEach(function(d, i){
        var zip = d.properties.zip;
        that.crimeStats[zip][key] += 1
        that.crimeStats[zip]['total'] += 1
        that.crimeStats['city'][key] += 1
        that.crimeStats['city']['total'] += 1
      })
      }
    }
}