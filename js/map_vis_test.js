
/*-------------------------BEGIN MODULE OBJECT------------------------------*/
MapVis = function(_parentElement, _geography, _population, _originalData, _stateMap, _eventHandler){
  this.parentElement = _parentElement;
  this.geography = _geography;
  this.population = _population;
  this.originalData = _originalData;
  this.filteredData = jQuery.extend(true, {}, _originalData);
  this.stateMap = _stateMap;
  this.eventHandler = _eventHandler;
  this.displayLayers = [];
  this.crimeStats = [];
  this.countCrimes();
  this.styleNeighborhoods;
  this.initVis();
}
/*-------------------------END MODULE OBJECT--------------------------------*/


/*-------------------------BEGIN HELPER METHODS-----------------------------*/
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

/*-------------------------END HELPER METHODS-------------------------------*/

/*-------------------------BEGIN UPDATE METHODS-----------------------------*/


MapVis.prototype.updateCrimeTypes = function(bool, crime){
  var that = this;
  if (bool){
    that.map.addLayer(that.displayLayers[crime])
        .on('ready', that.map.spin(false));
  }
  else{
    that.map.removeLayer(that.displayLayers[crime])
        .on('ready', that.map.spin(false));
  }
  that.countCrimes()
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
  function getColor(d, pop){
    var val = (d/pop)/(that.crimeStats['city']['total']/that.population['city'])
    return val >= 4.00  ? '#d73027' :
    val >= 2.00  ? '#f46d43' : 
    val >= 1.50  ? '#fdae61' :
    val >= 1.00  ? '#fee090' :
    val >= 0.75  ? '#e0f3f8' :
    val >= 0.50  ? '#abd9e9' :
    val >= 0.25  ? '#74add1' : '#4575b4';
  }
  this.displayLayers['neighborhood'].setStyle(style);
}
  
  
// Begin update method /updateDateAndTime/ 
// Purpose:
// *
// Arguments:
// *
// *
// *
// *
// Returns:
// *
MapVis.prototype.updateDateAndTime = function(start_date, end_date, start_time, end_time){
  var that = this;
  var filtered_data = jQuery.extend(true, {}, that.originalData);
  for (var key in filtered_data){
    console.log(that.originalData[key].features.length);
    var result = new Array();
    filtered_data[key].features.forEach(function(d){
      var crime_date = new Date(d.properties.date);
      var crime_time = d.properties.time;
      if (crime_date >= new Date(start_date) && crime_date <= new Date(end_date) 
      && crime_time >= start_time && crime_time <= end_time){
        result.push(d);
      }
    })
    this.filteredData[key].features = result;
  }

  for (var key in this.stateMap.crimeType){
    if (this.stateMap.crimeType[key]){
      this.map.removeLayer(this.displayLayers[key])
    }
    this.displayLayers[key] = L.geoJson(this.filteredData[key], {
          pointToLayer: function(feature, latlng){
          return L.circle(latlng, 20, {className: key});
          }
    })
    
    if (this.stateMap.crimeType[key]){
      this.map.addLayer(this.displayLayers[key])
    }
  }
}


/*-------------------------END UPDATE METHODS-------------------------------*/
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

  var home = {
    lat: 37.756503,
    lng: -122.439788,
    zoom: 12
  }; 

L.easyButton('fa-comment', 
              function (){alert('hello!')},
             ''
            );

  L.easyButton('fa-home', function(btn){
    that.map.setView([home.lat, home.lng], home.zoom);
  },'Zoom To Home').addTo(that.map);
  

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
    console.log(e.target);
    // layer.setStyle({
    //     // fillColor: '#CC0000',
    //     // fillOpacity: 0.5
    // });
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
      // mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  // function getColor(d, pop){
  //   var val = (d/pop)/(that.crimeStats['city']['total']/that.population['city'])
  //   return val > 4.00  ? '#08306b' :
  //   val > 2.00  ? '#08519c' : 
  //   val > 1.50  ? '#2171b5' :
  //   val > 1.00  ? '#4292c6' :
  //   val > 0.75  ? '#6baed6' :
  //   val > 0.50  ? '#9ecae1' :
  //   val > 0.25  ? '#c6dbef' : '#dee';
  // }
    function getColor(d, pop){
    var val = (d/pop)/(that.crimeStats['city']['total']/that.population['city'])
    return val >= 4.00  ? '#d73027' :
    val >= 2.00  ? '#f46d43' : 
    val >= 1.50  ? '#fdae61' :
    val >= 1.00  ? '#fee090' :
    val >= 0.75  ? '#e0f3f8' :
    val >= 0.50  ? '#abd9e9' :
    val >= 0.25  ? '#74add1' : '#4575b4';
  }

    function getLegend(val){
    return val >= 4.00  ? '#d73027' :
    val >= 2.00  ? '#f46d43' : 
    val >= 1.50  ? '#fdae61' :
    val >= 1.00  ? '#fee090' :
    val >= 0.75  ? '#e0f3f8' :
    val >= 0.50  ? '#abd9e9' :
    val >= 0.25  ? '#74add1' : '#4575b4';
  }
  // function getLegend(val){
  //   return val > 4.00  ? '#08306b' :
  //   val > 2.00  ? '#08519c' : 
  //   val > 1.50  ? '#2171b5' :
  //   val > 1.00  ? '#4292c6' :
  //   val > 0.75  ? '#6baed6' :
  //   val > 0.50  ? '#9ecae1' :
  //   val > 0.25  ? '#c6dbef' : '#dee';
  // }

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
        var content = "<span><b>Incident ID:</b> " + feature.id + "</span> <br>\
        <span><b>Crime Type:</b> " + feature.properties.crime +"</span> <br>\
        <span><b>Date:</b> " + feature.properties.date +"</span> <br>\
        <span><b>Day of Week:</b> " + feature.properties.dow +"</span> <br>\
        <span><b>Time:</b> " + feature.properties.time +"</span> <br>"

        var one_circle = L.circle(latlng, 40, {className: key})
                          .bindPopup(content);
        return one_circle
      }
    })
  }
  this.displayLayers['homicide'].addTo(that.map);


  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        // grades = [0, 0.25, 0.5, 0.75, 1.00, 1.50, 2.00, 4.00];
        grades = [4.00, 2.00, 1.50, 1.00, 0.75, 0.5, 0.25, 0];

    // loop through our density intervals and generate a label with a colored square for each interval
    var count = grades.length
    div.innerHTML = '<h6>Ratio of Crimes per Capita <br>(District Vs. City Average)</h6>'
    for (var i = 0; i < count; i++) {
        div.innerHTML += 
            '<i style="background:' + getLegend(grades[i]) + '"></i> ' +
          (grades[i-1] ? (grades[i] + '&ndash;' + grades[i-1] + '<br>'): (grades[i]+'+'+'<br>'))
    }

    return div;
  };
  legend.addTo(that.map);

  new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google(),
    position: 'topcenter',
    showMarker: true,
    retainZoomLevel: true,
}).addTo(that.map);

  var testObj = new Object();
  function test(){
    console.log("test");
  };
  return {test: test};
}




