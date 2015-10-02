


  //-------------------- BEGIN MODULE SCOPE VARIABLES ------------------------ 
DonutVis = function(_parentElement, _population, _districts, _originalData, _stateMap){
  this.parentElement = _parentElement;
  this.population = _population;
  this.districtName = _districts;
  this.originalData = _originalData;
  this.filteredData = jQuery.extend(true, {}, _originalData);
  this.stateMap = _stateMap;
  this.crimeStats = [];
  this.initVis();
}
  //-------------------- END MODULE SCOPE VARIABLES --------------------------
  
  //-------------------- BEGIN UTILITY METHODS -------------------------------
DonutVis.prototype.countCrimes = function(){     
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
    if (key in that.originalData && that.stateMap.crimeType[key]){
      var crime = that.originalData[key].features;
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

DonutVis.prototype.getDonutData = function(district){
    var dataset= new Array();
    for (var key in this.crimeStats[district]){
      if(key != 'total'){
        var stat = {label: key, count: this.crimeStats[district][key]};
        dataset.push(stat);
      }
    }
    return dataset;
}
  //-------------------- END UTILITY METHODS ---------------------------------
  
  //---------------------BEGIN UPDATE METHODS---------------------------------
  DonutVis.prototype.updateLocation = function(district){
    var that, dataset;
    that = this;
    dataset = this.getDonutData(district);
    
  }
  //-------------------- END UPDATE METHODS-----------------------------------

  //---------------------BEGIN EVENT HANDLERS---------------------------------
  
  DonutVis.prototype.onLocationChange = function(state_map){
    var that = this;
    var district = state_map.location;
    var capita = d3.format(".2f") 
    that.stateMap = state_map;
    d3.select('#donut_location').html(that.districtName[district]);
    d3.select('#donut_population').html(that.population[district] + ' (2013)');
    d3.select('#donut_capita').html(capita(that.crimeStats[district]['total']/(that.population[district]/1000)) + 'Incidents per 1,000 Residents');
    this.updateLocation(district);
  }
  //-------------------- END EVENT HANDLERS ----------------------------------

  //-------------------- BEGIN PUBLIC METHODS --------------------------------  
 DonutVis.prototype.initVis = function(){
  var that = this;

  this.countCrimes();

  this.filteredData = this.getDonutData(this.stateMap.location);


  this.width = parseInt(d3.select("#donut_chart").style("width"));
  this.height = parseInt(d3.select("#donut_chart").style("height"));
  // width = 100;
  // height = 100;
  this.radius = Math.min(this.width, this.height) / 2;
  
  this.color = d3.scale.ordinal()
  .range(['#A60F2B', '#648C85', '#B3F2C9', '#528C18', '#C3F25C']); 

  this.svg = d3.select('#donut_chart')
    .append('svg')
    .attr('width', this.width)
    .attr('height', this.height)
    .append('g')
    .attr('transform', 'translate(' + (this.width / 2) + ',' + (this.height / 2) + ')')

  this.arc = d3.svg.arc()
    .innerRadius(this.radius - 25)
    .outerRadius(this.radius);

  this.pie = d3.layout.pie()
    .value(function(d){return d.count;})
    .sort(null);

  this.path = this.svg.selectAll('path')
    .data(this.pie(this.filteredData))
    .enter()
    .append('path')
    .attr('d', this.arc)
    .attr('fill', function(d, i){
      return (that.color(d.data.label));
    });

  this.path.on('mouseover', function(d){
    var total = d3.sum(that.filteredData.map(function(d){
      return d.count;
    }));
    var percent = Math.round(1000 * d.data.count / total)/10;
    that.tooltip.select('.label_donut').html(d.data.label);
    that.tooltip.select('.count').html(d.data.count);
    that.tooltip.select('.percent').html(percent + '%');
    that.tooltip.style('display', 'block')
  });

  this.path.on('mouseout', function(){
    that.tooltip.style('display', 'none');
  });


  this.legend_rect_size = 8;
  this.legend_spacing = 2;

  this.legend_donut = this.svg.selectAll('.legend_donut')
    .data(this.color.domain())
    .enter()
    .append('g')
    .attr('class', 'legend_donut')
    .attr('transform', function(d, i){
      var height = that.legend_rect_size + that.legend_spacing;
      var offset = height * that.color.domain().length / 2;
      var horz = -2 * that.legend_rect_size;
      var vert = i * height - offset;
      return 'translate(' + horz + ',' + vert + ')';
    });

  this.legend_donut.append('rect')
    .attr('width', this.legend_rect_size)
    .attr('height', this.legend_rect_size)
    .style('fill', this.color)
    .style('stroke', this.color);

  this.legend_donut.append('text')
    .attr('x', this.legend_rect_size + this.legend_spacing)
    .attr('y', this.legend_rect_size)
    .text(function(d){return d;})

  this.tooltip = d3.select('#donut_chart')
    .append('div')
    .attr('class', 'tooltip_donut');

  this.tooltip.append('div')
    .attr('class', 'label_donut');

  this.tooltip.append('div')
    .attr('class', 'count');

  this.tooltip.append('div')
    .attr('class', 'percent');

 }

  //-------------------- END PUBLIC METHODS --------------------------------  
