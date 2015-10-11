
/*-------------------------BEGIN MODULE OBJECT------------------------------*/
//Global variables;
var Map, crimeStats, population, districtName, centerLocation, stateMap, 
eventHandler, geographyData, numMarkers, numMarkerLayers, prev_district;

MapVis = function(_parentElement, _geography, _population, _districts, _center, _originalData, _stateMap, _eventHandler){
  this.parentElement = _parentElement;
  geographyData = _geography;
  population = _population;
  districtName = _districts;
  centerLocation = _center;
  this.filteredData = jQuery.extend(true, {}, _originalData);
  stateMap = _stateMap;
  eventHandler = _eventHandler;
  this.displayLayers = [];
  this.countCrimes();
  this.initVis();
}

/*-------------------------END MODULE OBJECT--------------------------------*/


/*-------------------------BEGIN COUNT METHOD-----------------------------*/
MapVis.prototype.countCrimes = function(){     
  var that = this;
  var zip, key, crime;

  crimeStats = {};
  for (zip in population){
    crimeStats[zip] = {}
    crimeStats[zip]['total'] = 0;
    for (key in stateMap.crimeType){
      crimeStats[zip][key] = 0;
    }
  }
  
  crimeStats['N/A'] = {};
  crimeStats['N/A']['total'] = 0;
  
  for (key in stateMap.crimeType){  
    crimeStats['N/A'][key] = 0;
  }

  for (key in stateMap.crimeType){
    if (key in this.filteredData && stateMap.crimeType[key]){
      crime = this.filteredData[key].features;
      crime.forEach(function(d, i){
        zip = d.properties.zip;
        crimeStats[zip][key] += 1
        crimeStats[zip]['total'] += 1
        crimeStats['city'][key] += 1
        crimeStats['city']['total'] += 1
      })
    }
  }
}

/*-------------------------END COUNT METHODS-------------------------------*/

/*-------------------------BEGIN EVENT HANDLERS-----------------------------*/

MapVis.prototype.onHeatChange = function(state_map){
  stateMap = state_map;
  this.displayLayers['neighborhood'].setStyle(getStyle);
}
MapVis.prototype.onTypeChange = function(bool, crime, state_map){
  var that = this;
  stateMap = state_map;
  // if (bool){
  //   this.map.addLayer(this.displayLayers[crime])
  //     .on('ready', this.map.spin(false))
  // }
  // else{
  //   this.map.removeLayer(this.displayLayers[crime])
  //     .on('ready', this.map.spin(false))
  // }
  this.countCrimes();  
  for (key in centerLocation){
    var each_icon = L.AwesomeMarkers.icon({
      icon: '',
      markerColor: 'darkblue',
      prefix: 'fa',
      extraClasses: 'hey',
      html: crimeStats[key]['total']
    });
    numMarkers[key] = each_icon;
  }
  for (key in centerLocation){
    this.map.removeLayer(numMarkerLayers[key]);
    var each_marker = L.marker(centerLocation[key], {icon: numMarkers[key]})
    numMarkerLayers[key] = each_marker;
    this.map.addLayer(numMarkerLayers[key])
  }
  this.map.on('ready', this.map.spin(false))

  $(eventHandler).trigger('typeChanged', stateMap);

  this.displayLayers['neighborhood'].setStyle(getStyle);
}

MapVis.prototype.onTimeChange = function(_filtered_data){
  var that = this;
  this.filteredData = _filtered_data;
  
  var key;
  for (key in stateMap.crimeType){
    if (stateMap.crimeType[key]){
      this.map.removeLayer(this.displayLayers[key])
    }
    this.displayLayers[key] = L.geoJson(this.filteredData[key], {
          pointToLayer: function(feature, latlng){
          return L.circle(latlng, 20, {className: key});
          }
    })

    if (stateMap.crimeType[key]){
      this.map.addLayer(this.displayLayers[key])
    }
  }
  this.countCrimes();

  this.displayLayers['neighborhood'].setStyle(getStyle);
}
/*-------------------------END EVENT HANDLERS-------------------------------*/

/*-------------------------BEGIN HELPER METHODS-----------------------------*/


function getColor(val){
  return  val >= 4.00  ? '#d73027' :
          val >= 2.00  ? '#f46d43' : 
          val >= 1.50  ? '#fdae61' :
          val >= 1.00  ? '#fee090' :
          val >= 0.75  ? '#e0f3f8' :
          val >= 0.50  ? '#abd9e9' :
          val >= 0.25  ? '#74add1' : '#4575b4';
}

function getRatio(d, pop){
  return (d/pop)/(crimeStats['city']['total']/population['city']);   
}

function getStyle(feature){
  var district_crime, district_pop, ratio;
  district_crime = crimeStats[feature.id]['total']
  district_pop = population[feature.id]
  ratio = getRatio(district_crime, district_pop)
  if (stateMap.heatMap){
    return {
      fillColor: getColor(ratio), 
      fillOpacity: 1,
      weight: 2,
      color: 'white',
      dashArray: ''
    };
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
  
MapVis.prototype.returnHome = function(){
  var that = this;
  if (prev_district){
    this.map.addLayer(numMarkerLayers[prev_district])
  }
  for (key in that.filteredData){
    if (stateMap.crimeType[key]){
      if (prev_district){
        this.map.removeLayer(that.displayLayers[key][prev_district])
      }
    }
  }
  prev_district = null;
}
/*-------------------------END HELPER METHODS-----------------------------*/

/*-------------------------BEGIN INIT METHODS------------------------------*/
MapVis.prototype.initVis = function(){
  var that = this;
  var home_location, content, one_circle, city_sf, svg, g, home_button,
  transform, path, feature, legend, search;
  
  this.map = new L.Map("map", { center: [37.756503, -122.439788], 
                                zoom: 12, 
                                attributionControl: true });

  city_sf = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', 
  { attribution: 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'wentaoxu.cien3mu2z05evrskmbwjttxv8',
    accessToken: 'pk.eyJ1Ijoid2VudGFveHUiLCJhIjoiY2llbjNtdW13MDVmMHJza20wY3B0ZnFoaCJ9.bCIlhzQz6O58tT9s0_z2Mw',
    minZoom: 11 })
  .addTo(this.map);
  
  svg = d3.select(this.map.getPanes().overlayPane).append("svg")
  g = svg.append("g").attr("class", "leaflet-zoom-hide");

  home_location = {
    lat: 37.756503,
    lng: -122.439788,
    zoom: 12
  }; 

  home_button = L.easyButton('fa-home', function(btn){
    that.map.setView([home_location.lat, home_location.lng], home_location.zoom);
    that.returnHome();
    $(eventHandler).trigger("locationChanged", 'city');},'Zoom To Home')
    .addTo(this.map);

  
  transform = d3.geo.transform({point: project_point});
  
  path = d3.geo.path().projection(transform);
  
  feature = g.selectAll("path")
                    .data(geographyData.features)
                    .enter().append("path")

  this.map.on("viewreset", reset);
  // reset();
  

  function reset(){
    var bounds, topLeft, bottomRight;
    bounds = path.bounds(geographyData);
    topLeft = bounds[0];
    bottomRight = bounds[1];
    svg.attr("width", bottomRight[0] - topLeft[0])
      .attr("height", bottomRight[1] - topLeft[1])
      .style("left", topLeft[0] + "px")
      .style("top", topLeft[0] + "px")

    // g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
    // feature.attr("d", path);
  }

  function project_point(x, y){
    var point = that.map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
  
  function zoomToFeature(e){

    var district = e.target.feature.properties.id;
    this._map.fitBounds(e.target.getBounds());

    stateMap.location = districtName[district];
    if (district != prev_district){
      this._map.removeLayer(numMarkerLayers[district])
      if (prev_district){
        this._map.addLayer(numMarkerLayers[prev_district])
      }
      for (key in that.filteredData){
        if (stateMap.crimeType[key]){
          if (prev_district){
            this._map.removeLayer(that.displayLayers[key][prev_district])
          }
          if (crimeStats[district][key] > 0){
            this._map.addLayer(that.displayLayers[key][district])  
          }
        }
      }
      prev_district = district;
      $(eventHandler).trigger("locationChanged", district);
    }
  }
    
  function onEachFeature(feature, layer){
    layer.on({
        click: zoomToFeature
    });
  }

  var key, zip, temp_data = [];
  for (key in this.filteredData){
    this.displayLayers[key] = [];
    temp_data[key] = [];
    for (zip in centerLocation){
        this.displayLayers[key][zip] = []
        temp_data[key][zip] = {features: [], type: 'Feature Collection'};
    }
  }

  this.displayLayers["neighborhood"] = L.geoJson(geographyData, {
      onEachFeature: onEachFeature, 
      style: getStyle, 
      className: "neighborhood"})
      .setZIndex(0)
      .addTo(this.map);

  for (key in this.filteredData){
      this.filteredData[key].features.forEach(function(d){
        zip = d.properties.zip
        if (zip != 'N/A'){
          temp_data[key][zip].features.push(d);
        }  
      })
  }

  for (key in that.filteredData){
    for (zip in population){
      if (zip != 'city'){
        this.displayLayers[key][zip] = L.geoJson(temp_data[key][zip], {
          pointToLayer: function(feature, latlng){
            content = "<span><b>Incident ID:</b> " + feature.id + "</span> <br>\
            <span><b>Crime Type:</b> " + feature.properties.crime +"</span> <br>\
            <span><b>Date:</b> " + feature.properties.date +"</span> <br>\
            <span><b>Day of Week:</b> " + feature.properties.dow +"</span> <br>\
            <span><b>Time:</b> " + feature.properties.time +"</span> <br>"

            one_circle = L.circle(latlng, 20, {className: key})
                              .bindPopup(content);
            return one_circle
          }
        })
      }
    }
  }

  numMarkers = []
  for (key in centerLocation){
    var each_icon = L.AwesomeMarkers.icon({
      icon: '',
      markerColor: 'darkblue',
      prefix: 'fa',
      extraClasses: 'hey',
      html: crimeStats[key]['total']
    });
    numMarkers[key] = each_icon;
  }

  numMarkerLayers = [];
  for (key in centerLocation){
    var each_marker = L.marker(centerLocation[key], {icon: numMarkers[key]})
    numMarkerLayers[key] = each_marker;
    this.map.addLayer(numMarkerLayers[key])
  }

  legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map) {
    var that = this;
    var div, grades, count;
    div = L.DomUtil.create('div', 'info legend'),
    grades = [4.00, 2.00, 1.50, 1.00, 0.75, 0.5, 0.25, 0];
    count = grades.length
    div.innerHTML = '<h6>Ratio of Crimes per Capita <br>\
                    (District Vs. City Average)</h6>'
    
    var i;
    for (i = 0; i < count; i++) {
        div.innerHTML += 
            '<i style="background:' + getColor(grades[i]) + '"></i> ' +
          (grades[i-1] ? (grades[i] + '&ndash;' + grades[i-1] + '<br>'): 
          (grades[i]+'+'+'<br>'))
    }
    return div;
  };
  legend.addTo(this.map);

  search = new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google(),
    position: 'topcenter',
    showMarker: true,
    retainZoomLevel: true})
  .addTo(this.map);
}




