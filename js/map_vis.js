
/*-------------------------BEGIN MODULE OBJECT------------------------------*/
//Global variables;
var map_vars = {
  "crime_stats": null,
  "population_stats": null,
  "district_name": null,
  "center_location": null,
  "state_map": null,
  "event_handler": null,
  "geography_data": null,
  "num_markers": null,
  "num_marker_layers": null,
  "prev_district": null
};

MapVis = function(parent_element, geography, population, districts, center, original_data, state_map, event_handler){
  this.parentElement = parent_element;
  map_vars["geography_data"] = geography;
  map_vars["population_stats"] = population;
  map_vars["district_name"] = districts;
  map_vars["center_location"] = center;
  this.filteredData = jQuery.extend(true, {}, original_data);
  map_vars["state_map"] = state_map;
  map_vars["event_handler"] = event_handler;
  this.displayLayers = [];
  this.countCrimes();
  this.initVis();
}

/*-------------------------END MODULE OBJECT--------------------------------*/


/*-------------------------BEGIN COUNT METHOD-----------------------------*/
MapVis.prototype.countCrimes = function(){     
  var that = this;
  var zip, key, crime;

  map_vars["crime_stats"] = {};
  for (zip in map_vars["population_stats"]){
    map_vars["crime_stats"][zip] = {}
    map_vars["crime_stats"][zip]['total'] = 0;
    for (key in map_vars["state_map"].crime_type){
      map_vars["crime_stats"][zip][key] = 0;
    }
  }
  
  map_vars["crime_stats"]['N/A'] = {};
  map_vars["crime_stats"]['N/A']['total'] = 0;
  
  for (key in map_vars["state_map"].crime_type){  
    map_vars["crime_stats"]['N/A'][key] = 0;
  }

  for (key in map_vars["state_map"].crime_type){
    if (key in this.filteredData && map_vars["state_map"].crime_type[key]){
      crime = this.filteredData[key].features;
      crime.forEach(function(d, i){
        zip = d.properties.zip;
        map_vars["crime_stats"][zip][key] += 1
        map_vars["crime_stats"][zip]['total'] += 1
        map_vars["crime_stats"]['city'][key] += 1
        map_vars["crime_stats"]['city']['total'] += 1
      })
    }
  }
}

/*-------------------------END COUNT METHODS-------------------------------*/

/*-------------------------BEGIN EVENT HANDLERS-----------------------------*/

MapVis.prototype.onHeatChange = function(state_map){
  map_vars["state_map"] = state_map; 
  this.setLegend();
  this.displayLayers['neighborhood'].setStyle(getStyle);
}
MapVis.prototype.onTypeChange = function(bool, crime, state_map){
  var that = this;
  map_vars["state_map"] = state_map;

  this.countCrimes();  
  
  for (key in map_vars["center_location"]){
    var each_icon = L.AwesomeMarkers.icon({
      icon: '',
      markerColor: 'darkblue',
      prefix: 'fa',
      extraClasses: 'hey',
      html: map_vars["crime_stats"][key]['total']
    });
    map_vars["num_markers"][key] = each_icon;
  
    this.map.removeLayer(map_vars["num_marker_layers"][key]);
    var each_marker = L.marker(map_vars["center_location"][key], {icon: map_vars["num_markers"][key]})
    map_vars["num_marker_layers"][key] = each_marker;
    this.map.addLayer(map_vars["num_marker_layers"][key])
  }
  var district = map_vars["state_map"].location
  if (district != 'city'){
    if (bool){
      this.map.removeLayer(map_vars["num_marker_layers"][district])  
      this.map.addLayer(this.displayLayers[crime][district])
    }
    else{
      this.map.removeLayer(map_vars["num_marker_layers"][district])  
      this.map.removeLayer(this.displayLayers[crime][district])
    }
  }
  this.map.on('ready', this.map.spin(false))

  $(map_vars["event_handler"]).trigger('typeChanged', map_vars["state_map"]);

  this.displayLayers['neighborhood'].setStyle(getStyle);
}

MapVis.prototype.onTimeChange = function(_filtered_data){
  var that = this;
  this.filteredData = _filtered_data;
  for (key in that.filteredData){
    if (map_vars["state_map"].crime_type[key]){
      if (map_vars["prev_district"]){
        that.map.removeLayer(that.displayLayers[key][map_vars["prev_district"]])
      }
    }
  }
  this.countCrimes();
  this.getDisplayData();

  for (key in map_vars["center_location"]){
    var each_icon = L.AwesomeMarkers.icon({
      icon: '',
      markerColor: 'darkblue',
      prefix: 'fa',
      extraClasses: 'hey',
      html: map_vars["crime_stats"][key]['total']
    });
    map_vars["num_markers"][key] = each_icon;
    this.map.removeLayer(map_vars["num_marker_layers"][key]);
    var each_marker = L.marker(map_vars["center_location"][key], {icon: map_vars["num_markers"][key]})
    map_vars["num_marker_layers"][key] = each_marker;
    this.map.addLayer(map_vars["num_marker_layers"][key])
  }
  var district = map_vars["state_map"].location
  if (district != 'city'){
    for (key in that.filteredData){
      if (map_vars["state_map"].crime_type[key]){
        if (map_vars["prev_district"]){
          that.map.addLayer(that.displayLayers[key][map_vars["prev_district"]])
        }
      }
    }
    // Remove number marker for the current district
    this.map.removeLayer(map_vars["num_marker_layers"][district])
  }
  this.map.on('ready', this.map.spin(false))

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
  return (d/pop)/(map_vars["crime_stats"]['city']['total']/map_vars["population_stats"]['city']);   
}

function getStyle(feature){
  var district_crime, district_pop, ratio;
  district_crime = map_vars["crime_stats"][feature.id]['total']
  district_pop = map_vars["population_stats"][feature.id]
  ratio = getRatio(district_crime, district_pop)
  if (map_vars["state_map"].heat_map){
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
  if (map_vars["prev_district"]){
    this.map.addLayer(map_vars["num_marker_layers"][map_vars["prev_district"]])
  }
  for (key in that.filteredData){
    if (map_vars["state_map"].crime_type[key]){
      if (map_vars["prev_district"]){
        this.map.removeLayer(that.displayLayers[key][map_vars["prev_district"]])
      }
    }
  }
  map_vars["prev_district"] = null;
}
/*-------------------------END HELPER METHODS-----------------------------*/
MapVis.prototype.getDisplayData = function(){
  var that = this;
  var key, zip, temp_data = [];
  for (key in this.filteredData){
    this.displayLayers[key] = [];
    temp_data[key] = [];
    for (zip in map_vars["center_location"]){
        this.displayLayers[key][zip] = []
        temp_data[key][zip] = {features: [], type: 'Feature Collection'};
    }
  }

  // Format the data in a crime-zip-values pair
  for (key in this.filteredData){
      this.filteredData[key].features.forEach(function(d){
        zip = d.properties.zip
        if (zip != 'N/A'){
          temp_data[key][zip].features.push(d);
        }  
      })
  }

  // Format the data as circles and push them into display layer
  for (key in that.filteredData){
    for (zip in map_vars["population_stats"]){
      if (zip != 'city'){
        this.displayLayers[key][zip] = L.geoJson(temp_data[key][zip], {
          pointToLayer: function(feature, latlng){
            content = "<span><b>Incident ID:</b> " + feature.id + "</span> <br>\
            <span><b>Crime Type:</b> " + feature.properties.crime +"</span> <br>\
            <span><b>Date:</b> " + feature.properties.date +"</span> <br>\
            <span><b>Day of Week:</b> " + feature.properties.dow +"</span> <br>\
            <span><b>Time:</b> " + feature.properties.time +"</span> <br>"

            one_circle = L.circle(latlng, 40, {className: key})
                              .bindPopup(content);
            return one_circle
          }
        })
      }
    }
  }
}

MapVis.prototype.setLegend = function(){
  var that = this;
  if (map_vars["state_map"].heat_map){
    var legend = L.control({position: 'bottomright'});
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
    legend.addTo(that.map);
  }
  else{
    d3.select('.info').remove();
  }
}
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
    $(map_vars["event_handler"]).trigger("locationChanged", 'city');},'Zoom To Home')
    .addTo(this.map);

  
  transform = d3.geo.transform({point: project_point});
  
  path = d3.geo.path().projection(transform);
  
  feature = g.selectAll("path")
                    .data(map_vars["geography_data"].features)
                    .enter().append("path")

  this.map.on("viewreset", reset);
  // reset();
  

  function reset(){
    var bounds, topLeft, bottomRight;
    bounds = path.bounds(map_vars["geography_data"]);
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

    this._map.spin(true);
    setTimeout(function(){
      var district = e.target.feature.properties.id;
      that.map.fitBounds(e.target.getBounds());

      map_vars["state_map"].location = map_vars["district_name"][district];
      if (district != map_vars["prev_district"]){
        that.map.removeLayer(map_vars["num_marker_layers"][district])
        if (map_vars["prev_district"]){
          that.map.addLayer(map_vars["num_marker_layers"][map_vars["prev_district"]])
        }
        for (key in that.filteredData){
          if (map_vars["state_map"].crime_type[key]){
            if (map_vars["prev_district"]){
              that.map.removeLayer(that.displayLayers[key][map_vars["prev_district"]])
            }
            if (map_vars["crime_stats"][district][key] > 0){
              that.map.addLayer(that.displayLayers[key][district])  
            }
          }
        }
        map_vars["prev_district"] = district;
        $(map_vars["event_handler"]).trigger("locationChanged", district);
        that.map.on('ready', that.map.spin(false));
      }
      else{
        that.map.on('ready', that.map.spin(false)); 
      }
    }, 10)
  }
    
  function onEachFeature(feature, layer){
    layer.on({
        click: zoomToFeature
    });
  }

  this.getDisplayData();

  this.displayLayers["neighborhood"] = L.geoJson(map_vars["geography_data"], {
      onEachFeature: onEachFeature, 
      style: getStyle, 
      className: "neighborhood"})
      .setZIndex(0)
      .addTo(this.map);


  map_vars["num_markers"] = []
  for (key in map_vars["center_location"]){
    var each_icon = L.AwesomeMarkers.icon({
      icon: '',
      markerColor: 'darkblue',
      prefix: 'fa',
      html: map_vars["crime_stats"][key]['total']
    });
    map_vars["num_markers"][key] = each_icon;
  }

  map_vars["num_marker_layers"] = [];
  for (key in map_vars["center_location"]){
    var each_marker = L.marker(map_vars["center_location"][key], {icon: map_vars["num_markers"][key]})
    map_vars["num_marker_layers"][key] = each_marker;
    this.map.addLayer(map_vars["num_marker_layers"][key])
  }

  this.setLegend();
  search = new L.Control.GeoSearch({
    provider: new L.GeoSearch.Provider.Google(),
    position: 'topcenter',
    showMarker: true,
    retainZoomLevel: true})
  .addTo(this.map);
}




