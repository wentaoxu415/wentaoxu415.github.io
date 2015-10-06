
//-------------------- BEGIN MODULE SCOPE VARIABLES ------------------------ 
BarVis = function(_parentElement, _population, _district, _filteredData, _stateMap){
  this.parentElement = _parentElement;
  this.population = _population;
  this.districtData = _district;
  this.filteredData = _filteredData;
  this.displayData = jQuery.extend(true, {}, _filteredData);
  this.stateMap = _stateMap;
  this.crimeStats = [];
  this.initVis();
}
//-------------------- END MODULE SCOPE VARIABLES --------------------------

//-------------------- BEGIN UTILITY METHODS -------------------------------
BarVis.prototype.countCrimes = function(){     
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

BarVis.prototype.countPerCapita = function(){
  var that = this;
  var format = d3.format('.2f')
  for (var key in this.crimeStats){
    for (var crime in this.crimeStats[key]){
      this.crimeStats[key][crime] = format(this.crimeStats[key][crime]/(this.population[key]/1000)) 
    }
  }
}

BarVis.prototype.countDayOfWeek = function(){
  var that = this;
  var time;
  var data = new Array();
  var data_test = new Array();
  var final_data = new Array();
  var dow_map = { 
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
  }


  for (var day in dow_map){
    data_test[day] = new Array();
    for (var crime in this.stateMap.crimeType){
      if (this.stateMap.crimeType.hasOwnProperty(crime)){
        data_test[day][crime] = 0   
      }
    }
  }
  
  for (var key in this.filteredData){
    if (this.stateMap.crimeType[key]){
      this.filteredData[key].features.forEach(function(d, i){
        time = d.properties.dow 
        data_test[time][key] += 1
      })
    }
  }

  var final_data_test = new Array();
  var idx = 0;
  for (var day in data_test){
    var y0 = 0;
    final_data_test[idx] = new Object();
    final_data_test[idx].val = that.color.domain().map(function(name){
      return {day: day, name: name, y0:y0, y1: y0 += +data_test[day][name] }
    }) 
    final_data_test[idx].dow = day; 
    final_data_test[idx].total = final_data_test[idx].val[final_data_test[idx].val.length-1].y1; 
    idx += 1;
  }
  // console.log(final_data_test);




  // // for (var key in this.filteredData){
  // //   if (this.stateMap.crimeType[key]){
  // //     this.filteredData[key].features.forEach(function(d, i){
  // //       time = d.properties.dow
  // //       if (time in dataset_test){
  // //         data[time]
  // //       }
  // //     })
  // //   }
  // // }

  // // var idx = 0;
  // // for (var day in dow_map){
  // //   data_test[idx] = new Object();
  // //   data_test[idx].val = 
  // //     data_test[idx].date = 
  // // }

  // console.log(this.stateMap.crimeType, data_test);

  // for (var key in this.filteredData){
  //   if (this.stateMap.crimeType[key]){
  //     this.filteredData[key].features.forEach(function(d, i){
  //       time = d.properties.dow 
  //       if (time in data){
  //         data[time]['val'] += 1
  //       }
  //       else{
  //         data[time] = {'date': time, 'val': 1}
  //       }
  //     })
  //   }
  // }

  // var idx = 0;
  // for (var key in data){
  //   final_data[idx] = {}
  //   final_data[idx].date = key;
  //   final_data[idx].val = data[key]['val'];
  //   idx+=1;
  // }

  
  // final_data.sort(function(a, b){return dow_map[a.date] - dow_map[b.date]})
  this.displayData = final_data_test;
}

BarVis.prototype.getDisplayData = function(){
  var that = this;
  // this.crimeStats.forEach(function(d){
  //   var y0 = 0;
  //   d.val = that.color.domain().map(function(name){
  //     return {name: name, y0:y0, y1: y0 += +d[name]}; })
  //   d.total = d.val[d.val.length - 1].y1;

  // });
  // var dataset = new Array();
  // var idx = 0;
  // for (var key in this.crimeStats){
  //   if (key != 'city' && key != 'N/A'){
  //   dataset[idx] = {};
  //   dataset[idx].key = key;
  //   dataset[idx].val = this.crimeStats[key].val;
  //   dataset[idx].total = this.crimeStats[key].total;
  //   idx +=1
  //   }
  // }
  var dataset_test = new Array();
  var index = 0;
  for(var key in this.crimeStats){
    if (key != 'city' && key != 'N/A'){
      var y0 = 0;
      dataset_test[index] = new Object();
      dataset_test[index].val = that.color.domain().map(function(name){
        return {district: key, name: name, y0:y0, y1: y0 += +that.crimeStats[key][name]}; })
      dataset_test[index].total = dataset_test[index].val[dataset_test[index].val.length - 1].y1; 
      dataset_test[index].key = key;
      index += 1;
    }
  }

  return dataset_test;

}

BarVis.prototype.updateVis = function(){
  var that = this;
  this.color.domain(d3.keys(this.crimeStats['city']).filter(
    function(key){ return key!== 'total'}));
  
  this.displayData = this.getDisplayData();
  
  this.displayData.sort(function(a, b){return b.total - a.total});
  
  console.log(d3.max(this.displayData, function(d){return d.val}));
  this.x.domain(this.displayData.map(function(d){return d.key}))
  this.y.domain([0, d3.max(that.displayData, function(d){return d.total;})])
  
  this.svg.selectAll(".g")
    .remove();

  
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d){
      var count = d.y1 - d.y0;
      return '<strong>District: </strong> <span>' + that.districtData[d.district] + '</span><br>'
      + '<strong>Crime: </strong> <span>' + d.name + '</span> <br>' 
      + '<strong>Incidents: </strong> <span>' + count + '</span> ' ;
    });

  this.svg.call(tip);

  this.svg.select(".y.axis").transition()
    .duration(500).call(this.yAxis)
  
  this.district = this.svg.selectAll('.district')
    .data(this.displayData, function(d){return d.key})
    .enter().append('g')
    .attr('class', 'g')
    .classed('test_border', function(d){ if(d.key == that.stateMap.location) return true;})
    .attr('transform', function(d){return 'translate(' + that.x(d.key) + ',0)';});


  this.district.selectAll('rect')
    .data(function(d){return d.val;})
    .enter().append('rect')
    .attr('width', this.x.rangeBand())
    .attr('y', function(d){return that.y(d.y1);})
    .attr('height', function(d){return that.y(d.y0) - that.y(d.y1);})
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .transition()
    .duration(500)
    .style('fill', function(d){return that.color(d.name);});



  // this.district.selectAll('rect')
  //   .on('mouseover', function(d){
  //   var count = d.y1 - d.y0;
  //   that.tooltip.select('.label_district').html(that.districtData[d.district]);
  //   that.tooltip.select('.label_crime').html(d.name);
  //   that.tooltip.select('.count').html(count);
  //   that.tooltip.style('display', 'block')
  //   that.tooltip.style('left', (d3.event.pageX)+ 'px')
  //   that.tooltip.style('top', (d3.event.pageY) + 'px')

  // })

}

BarVis.prototype.drawDayOfWeek = function(){
  var that = this;
  this.margin = {top: 5, right: 40, bottom: 20, left: 40}
  this.width = parseInt(d3.select("#bar_chart").style("width"))- this.margin.left - this.margin.right;
  this.height = parseInt(d3.select("#bar_chart").style("height")) - this.margin.top - this.margin.bottom;

  this.svg.selectAll('rect')
    .remove();

  d3.select('#crime_svg')
    .remove();

  // this.x = d3.scale.ordinal()
  //   .domain(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
  //   .rangePoints([0, this.width]);

  // this.y = d3.scale.linear()
  //   .range([this.height, 0])

  // this.xAxis = d3.svg.axis()
  //   .scale(this.x)
  //   .orient("bottom")

  // this.yAxis = d3.svg.axis()
  //   .scale(this.y)
  //   .orient("left")

  // this.line = d3.svg.line()
  //   .x(function(d){return that.x(d.date);})
  //   .y(function(d){return that.y(d.val);})

  // this.svg = d3.select('#time').append('svg')
  //   .attr("width", this.width + this.margin.left + this.margin.right)
  //   .attr("height", this.height + this.margin.top + this.margin.bottom)
  //   .append('g')
  //   .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

  // this.y.domain([0, d3.max(that.displayData, function(d){return d.val;})]);
  //   this.svg.append('g')
  //     .attr('class', 'x axis')
  //     .attr('transform', 'translate(0,' + this.height + ')')
  //     .call(that.xAxis)

  // this.svg.append('g')
  //   .attr('class', 'y axis')
  //   .call(that.yAxis)
  //   .append('text')
  //   .attr('transform', 'rotate(-90)')
  //   .attr('y', 0 - this.margin.left)
  //   .attr('x', 0 - (this.height/2))
  //   .attr('dy', '.71em')
  //   .style('text-anchor', 'middle')
  //   .text('Incidents')

  // this.svg.append('path')
  //   .datum(that.displayData)
  //   .attr('class', 'line')
  //   .attr('d', that.line);

  this.x = d3.scale.ordinal()
    .domain(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
    .rangeRoundBands([0, this.width], .1);

  this.y = d3.scale.linear()
    .range([this.height, 0]);

  this.y.domain([0, d3.max(this.displayData, function(d){return d.total})]);

  this.xAxis = d3.svg.axis()
    .scale(this.x)
    .orient("bottom");

  this.yAxis = d3.svg.axis()
    .scale(this.y)
    .orient("left");

  this.svg = d3.select("#bar_chart").append("svg")
    .attr('width', this.width + this.margin.left + this.margin.right)
    .attr('height', this.height + this.margin.top + this.margin.bottom)
    .attr('id', 'dow_svg')
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
      
  this.svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + this.height + ')')

  this.svg.append('g')
    .attr('class', 'y axis')
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0-this.margin.left)
    .attr('x', 0-(this.height/2))
    .attr('dy', '.71em')
    .style('text-anchor', 'middle')
    .text('Crime Incidents')

  this.color = d3.scale.ordinal()
    .range(['#fdb462', '#b3de69', '#8dd3c7', '#fed976', '#fccde5', '#bebada', '#bc80bd']);

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d){
      var count = d.y1 - d.y0;
      return '<strong>Day: </strong> <span>' + d.day + '</span><br>'
      + '<strong>Crime: </strong> <span>' + d.name + '</span> <br>' 
      + '<strong>Incidents: </strong> <span>' + count + '</span> ' ;
    });

  this.svg.call(tip);

  this.svg.select('.x.axis').transition()
    .duration(500)
    .call(this.xAxis)

  this.svg.select('.y.axis').transition()
    .duration(500)
    .call(this.yAxis)

  this.dow = this.svg.selectAll('.dow')
    .data(this.displayData, function(d){return d.dow})
    .enter().append('g')
    .attr('class', 'g')
    .attr('transform', function(d){return 'translate(' + that.x(d.dow) + ',0)';});

  this.dow.selectAll('rect')
    .data(function(d){return d.val})
    .enter().append('rect')
    .attr('width', this.x.rangeBand())
    .attr('y', function(d){return that.y(d.y1)})
    .attr("height", function(d){return that.y(d.y0)- that.y(d.y1);})
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .style('fill', function(d){return that.color(d.name)})


}

BarVis.prototype.onTypeChange = function(state_map){
  this.stateMap = state_map;
  this.countCrimes();
  this.updateVis();
}

BarVis.prototype.onLocationChange = function(state_map){
  var that = this;
  this.stateMap = state_map;
  this.district.classed('test_border', function(d){ if(d.key == that.stateMap.location) return true;})
}

BarVis.prototype.onTimeChange = function(state_map, filtered_data){
  var that = this;
  this.stateMap = state_map;
  this.filteredData = filtered_data;
  this.countCrimes();
  this.updateVis();
}

BarVis.prototype.onTabChange = function(e, state_map){
  this.stateMap = state_map
  if (e.target.id === 'crime_stat'){
    this.countCrimes();
    this.updateVis()
  }
  else if (e.target.id === 'per_capita'){
    this.countCrimes();
    this.countPerCapita();
    console.log(this.crimeStats);
    this.updateVis()
  }
  else if (e.target.id === 'day_of_week'){
    this.countDayOfWeek();
    this.drawDayOfWeek();
  }
}
//-------------------- END UTILITY METHODS ---------------------------------


//-------------------- BEGIN PUBLIC METHODS --------------------------------  
BarVis.prototype.initVis = function(){
  var that = this;
  this.countCrimes();
  this.margin = {top: 5, right: 40, bottom: 5, left: 40}
  this.width = parseInt(d3.select("#bar_chart").style("width"))- this.margin.left - this.margin.right;
  this.height = parseInt(d3.select("#bar_chart").style("height")) - this.margin.top - this.margin.bottom;

  this.x = d3.scale.ordinal()
    .rangeRoundBands([0, this.width], .1);

  this.y = d3.scale.linear()
    .rangeRound([this.height, 0]);

  this.color = d3.scale.ordinal()
    .range(['#fdb462', '#b3de69', '#8dd3c7', '#fed976', '#fccde5', '#bebada', '#bc80bd']);

  // var xAxis = d3.svg.axis()
  //   .scale(this.x)
  //   .orient('bottom')

  this.yAxis = d3.svg.axis()
    .scale(this.y)
    .orient('left')
    .ticks(5)

  this.svg = d3.select("#bar_chart").append("svg")
    .attr('width', this.width + this.margin.left + this.margin.right)
    .attr('height', this.height + this.margin.top + this.margin.bottom)
    .attr('id','crime_svg')
    .append('g')
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

  this.svg.append('g')
    .attr('class', 'y axis')
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - this.margin.left)
    .attr('x', 0 - (this.height/2))
    .attr('dy', '.71em')
    .style('text-anchor', 'middle')
    .text('Crime Incidents')

  this.updateVis();

}

//-------------------- END PUBLIC METHODS --------------------------------  