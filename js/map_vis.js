
// Construct an object for Map Visualization
MapVis = function(_parentElement, _geography, _originalData, _stateMap, _eventHandler){
  this.parentElement = _parentElement;
  this.geography = _geography;
  this.data = _originalData;
  this.stateMap = _stateMap;
  this.eventHandler = _eventHandler;
  this.displayData = [];
  this.initVis();
}

MapVis.prototype.initVis = function(){
  var that, this.svg, this.margin, 
  this.width, this.height, this.transform, 
  this.path, this.feature, this.layers, 
  this.reset, this.project_point, this.highlight_feature, 
  this.reset_highlight, this.zoom_to_feature, this.on_each_feature;

  that = this;
  this.svg = this.parentElement.selectAll("svg");
  this.margin = {top: 0, right: 0, bottom: 0, left: 0};
  this.width = this.svg.attr("width") - this.margin.left 
  - this.margin.right;
  this.height = this.svg.attr("height") - this.margin.top 
  - this.margin.bottom;

  this.transform = d3.geo.transform({point: this.project_point});
  this.path = d3.geo.path().projection(this.transform);

  this.feature = g.selectAll("this.path")
    .data(this.geography.features)
    .enter().append("this.path");

  map.on("viewreset", this.reset);
  this.reset();

  this.reset =function(){
    var bounds = this.path.bounds(geography),
    topLeft = bounds[0],
    bottomRight = bounds[1];

    this.svg.attr("width", this.bottomRight[0] - this.topLeft[0])
            .attr("height", this.bottomRight[1] - this.topLeft[1])
            .style("left", this.topLeft[0] + "px")
            .style("top", this.topLeft[1] + "px")

    g.attr("transform", "translate(" + (-this.topLeft[0]) + "," + (-this.topLeft[1]) + ")");
    this.feature.attr("d", this.path);
  }
  
  $(".switch_option").click(function(e){
    var is_checked, crime_type;
    is_checked = e.currentTarget.checked;
    crime_type = e.currentTarget.name;
    stateMap.crimeType[crime_type] = is_checked;
    map_vis.updateLayer(is_checked, crime_type);
  })  
  
}