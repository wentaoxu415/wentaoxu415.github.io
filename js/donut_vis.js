


  //-------------------- BEGIN MODULE SCOPE VARIABLES ------------------------ 
DonutVis = function(_parentElement, _population, _districts, _filteredData, _stateMap){
  this.parentElement = _parentElement;
  this.population = _population;
  this.districtName = _districts;
  this.filteredData = _filteredData;
  this.displayData = jQuery.extend(true, {}, _filteredData);
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

DonutVis.prototype.getDisplayData = function(district){
    var dataset= new Array();
    if (this.crimeStats[district]['total'] == 0){
      return false;
    }
    else{
      for (var key in this.crimeStats[district]){
        if(key != 'total'){
          var stat = {label: key, count: this.crimeStats[district][key]};
          dataset.push(stat);
        }
      }
      return dataset;
  }
}

DonutVis.prototype.getCrimesPerCapita = function(district){
  var crime, population;
  crime = this.crimeStats[district]['total']
  population = this.population[district]/1000
  return crime/population;
}

DonutVis.prototype.getRelativeRisk = function(district){
  var district_risk, city_crime, city_population, city_risk
  district_risk = this.getCrimesPerCapita(district);
  city_crime = this.crimeStats['city']['total'] 
  city_population = this.population['city']/1000
  city_risk = city_crime/city_population
  return district_risk/city_risk;
}

  //-------------------- END UTILITY METHODS ---------------------------------
  DonutVis.prototype.zeroVis = function(){
    var that = this;
    var capita = d3.format(".2f"); 
    var comma = d3.format("0,000");
    var district = this.stateMap.location;
    
    d3.select('#donut_location').html('<b><u>'+this.districtName[district]+'</u></b>');
    d3.select('#donut_crimes').html(this.crimeStats[district]['total'])
    d3.select('#donut_population').html(comma(this.population[district]) + ' (2013)');
    d3.select('#donut_capita').html(capita(this.getCrimesPerCapita(district)) + ' (per 1000 People)');
    d3.select('#relative_risk').html(capita(this.getRelativeRisk(district)));
    // d3.select('.donut_detach').remove() 
    d3.select('.svg-container').remove();

    this.stateMap.zeroVis = true;

  }

  //---------------------BEGIN UPDATE METHODS---------------------------------
  DonutVis.prototype.updateVis = function(){
    if (!this.displayData){
      this.zeroVis()
    }
    else if (this.stateMap.zeroVis){
      this.initVis();
      this.stateMap.zeroVis = false;
    }
    else{
    var that = this;
    var capita = d3.format(".2f"); 
    var comma = d3.format("0,000");
    var district = this.stateMap.location;
    
    d3.select('#donut_location').html('<b><u>'+this.districtName[district]+'</u></b>');
    d3.select('#donut_crimes').html(this.crimeStats[district]['total'])
    d3.select('#donut_population').html(comma(this.population[district]) + ' (2013)');
    d3.select('#donut_capita').html(capita(this.getCrimesPerCapita(district)) + ' (per 1000 People)');
    d3.select('#relative_risk').html(capita(this.getRelativeRisk(district)));

    this.pie.value(function(d){return d.count;})
      
    this.path.data(this.pie(this.displayData))
      .transition()
      .duration(2000)
      .attrTween("d", arcTween);

  this.path.on('mouseover', function(d){
    var total = d3.sum(that.displayData.map(function(d){
      return d.count;
    }));
    var percent = Math.round(1000 * d.data.count / total)/10;
    that.tooltip.select('.label_donut').html('<strong>Crime: </strong><span>' + d.data.label + '</span><br>');
    that.tooltip.select('.count').html('<strong>Incidents: </strong><span>' + d.data.count + '</span><br>')
    that.tooltip.select('.percent').html('<strong>Proportion: </strong><span>' + percent + '%</span><br>');
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

  function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return that.arc(i(t));
    };
  }
  }
}
  //-------------------- END UPDATE METHODS-----------------------------------

  //---------------------BEGIN EVENT HANDLERS---------------------------------
  
  DonutVis.prototype.onLocationChange = function(state_map){
    var that = this;
    this.stateMap = state_map;
    this.displayData = this.getDisplayData(this.stateMap.location);
    this.updateVis();
  }

  DonutVis.prototype.onTypeChange = function(state_map){
    var that = this;
    this.stateMap = state_map;
    this.countCrimes();
    this.displayData = this.getDisplayData(this.stateMap.location);
    this.updateVis();
  }

  DonutVis.prototype.onTimeChange = function(state_map, filtered_data){
    this.stateMap = state_map;
    this.filteredData = filtered_data
    this.countCrimes();
    this.displayData = this.getDisplayData(this.stateMap.location);
    this.updateVis();
  }


  //-------------------- END EVENT HANDLERS ----------------------------------

  //-------------------- BEGIN INIT METHOD -----------------------------------  
 DonutVis.prototype.initVis = function(){
  var that = this;
  var capita, comma, district;
  
  capita = d3.format(".2f"); 
  comma = d3.format("0,000");
  district = this.stateMap.location;
  
  this.countCrimes();

  d3.select('#donut_location').html('<b><u>'+that.districtName[district]+'</u></b>');
  d3.select('#donut_population').html(comma(that.population[district]) + ' (2013)');
  d3.select('#donut_crimes').html(that.crimeStats['city']['total'])
  d3.select('#donut_capita').html(capita(this.getCrimesPerCapita(district)) + ' (per 1000 People)');
  d3.select('#relative_risk').html(capita(this.getRelativeRisk(district)));

  this.displayData = this.getDisplayData(this.stateMap.location);

  this.margin = {top: 0, right: 20, bottom: 20, left: 0}
  this.width = parseInt(d3.select("#donut_chart").style("width")) -
              this.margin.left - this.margin.right;
  this.height = parseInt(d3.select("#donut_chart").style("height")) - 
              this.margin.top - this.margin.bottom;
  
  this.radius = Math.min(this.width, this.height) / 2;
  
  this.color = d3.scale.ordinal()
  .range(['#fdb462', '#b3de69', '#8dd3c7', '#fed976', '#fccde5', '#bebada', '#bc80bd']); 

  this.svg = d3.select('#donut_chart')
    .append('div')
    .classed("svg-container", true)
    .append('svg')
    // .attr('width', this.width)
    // .attr('height', this.height)
    .attr("viewBox", "0 0 " + (this.width)+ " " + (this.height))
    .attr("preserveAspectRatio", "xMinYMin meet")
    .classed("svg-content-responsive", true)
    .append('g')
    .attr('transform', 'translate(' + (this.width / 2) + ',' + (this.height / 2) + ')')
    .attr('class', 'donut_detach')


   
  // function updateWindow(){
  //   that.svg
  //     .attr('width', parseInt(d3.select("#donut_chart").style("width")) -
  //             that.margin.left - that.margin.right)
  //     .attr('height', parseInt(d3.select("#donut_chart").style("height")) - 
  //             that.margin.top - that.margin.bottom)
  // }
  // window.onresize = updateWindow()




  this.arc = d3.svg.arc()
    .innerRadius(this.radius - 25)
    .outerRadius(this.radius);

    this.pie = d3.layout.pie()
      .value(function(d){return d.count;})
      .sort(null);
    
  // var tip = d3.tip()
  //   .attr('class', 'd3-tip')
  //   .offset([-10, 0])
  //   .html(function(d){
  //     return d.data.label;
  //   })

  // this.svg.call(tip);

  this.path = this.svg.selectAll('path')
      .data(this.pie(this.displayData))

  // this.path.exit()
  //     .remove();

  this.path.enter()
    .append('path')
    .attr('d', this.arc)
    .attr('fill', function(d, i){
      return (that.color(d.data.label));
    })
    .each(function(d) {this._current = d; }) 
    .classed("donut", true)
   

  this.tooltip = d3.select('#donut_chart')
    .append('div')
    .attr('class', 'tooltip_donut');

  this.tooltip.append('div')
    .attr('class', 'label_donut');

  this.tooltip.append('div')
    .attr('class', 'count');

  this.tooltip.append('div')
    .attr('class', 'percent');

  this.path.on('mouseover', function(d){
    var total = d3.sum(that.displayData.map(function(d){
      return d.count;
    }));
    var percent = Math.round(1000 * d.data.count / total)/10;
    that.tooltip.select('.label_donut').html('<strong>Crime: </strong><span>' + d.data.label + '</span><br>');
    that.tooltip.select('.count').html('<strong>Incidents: </strong><span>' + d.data.count + '</span><br>')
    that.tooltip.select('.percent').html('<strong>Proportion: </strong><span>' + percent + '%</span><br>');
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

 }

  //-------------------- END PUBLIC METHODS --------------------------------  
