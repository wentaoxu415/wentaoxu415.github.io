
//-------------------- BEGIN MODULE SCOPE VARIABLES ------------------------ 
BarVis = function(_parentElement, _population, _district, _filteredData, _stateMap){
  this.parentElement = _parentElement;
  this.population = _population;
  this.districtData = _district;
  this.filteredData = _filteredData;
  this.displayData = jQuery.extend(true, {}, _filteredData);
  this.stateMap = _stateMap;
  this.crimeStats = [];
  this.countCrimes();
  this.initVis();
}
//-------------------- END MODULE SCOPE VARIABLES ----------------------------

//-------------------- BEGIN COUNT METHODS -----------------------------------
BarVis.prototype.countCrimes = function(){     
  var that = this;
  var zip, key, index, crime, y0, dataset;
  dataset = new Array();

  for (zip in this.population){
    this.crimeStats[zip] = {}
    for (key in this.stateMap.crimeType){
      this.crimeStats[zip][key] = 0;
    }
    this.crimeStats[zip]['total'] = 0;
  }

  for (key in this.stateMap.crimeType){
    if (key in this.filteredData && this.stateMap.crimeType[key]){
      crime = this.filteredData[key].features;
      crime.forEach(function(d, i){
        zip = d.properties.zip;
        if (zip !== 'N/A'){
          that.crimeStats[zip][key] += 1
          that.crimeStats[zip]['total'] += 1
          that.crimeStats['city'][key] += 1
          that.crimeStats['city']['total'] += 1
        }
      })
    }
  }
  index = 0;
  for (key in this.crimeStats){
    if (key != 'city' && key != 'N/A'){
      y0 = 0;
      dataset[index] = new Object();
      dataset[index].key = key 
      dataset[index].val = d3.keys(this.stateMap.crimeType).map(function(name){
        return {key: key, name: name, y0:y0, y1: y0 += +that.crimeStats[key][name]}; })
      dataset[index].total = dataset[index].val[dataset[index].val.length - 1].y1
      index += 1
    }
  }
  return dataset;
}

BarVis.prototype.countPerCapita = function(){
  var that = this;
  var format = d3.format('.2f')
  var dataset = this.countCrimes();

  dataset.forEach(function(d, i){
    var y0 = 0;
    d.val = d.val.map(function(data){
      return {key: data.key, name: data.name, y0: +format(y0), y1: y0 += +format((that.crimeStats[d.key][data.name]/(that.population[d.key]/1000)))};
    })
    d.total = +format(d.total/(that.population[d.key]/1000))
  })
  return dataset;
}

BarVis.prototype.countDayOfWeek = function(){
  var that = this;
  var time;
  var zip;
  var dataset = new Array();
  var display_dataset = new Array();
  var dow_map = new Array();
  dow_map = { 
    'Mon': 1,
    'Tue': 2,
    'Wed': 3,
    'Thu': 4,
    'Fri': 5,
    'Sat': 6,
    'Sun': 7
  }

  convert = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun',
  }

  for (var day in dow_map){
   dataset[day] = new Array();
    for (var crime in this.stateMap.crimeType){
      if (this.stateMap.crimeType.hasOwnProperty(crime)){
       dataset[day][crime] = 0   
      }
    }
  }

  var location = this.stateMap.location;
  for (var crime in this.filteredData){
    if (this.stateMap.crimeType[crime]){
      this.filteredData[crime].features.forEach(function(d, i){
        zip = d.properties.zip;
        if (location === 'city' || location === zip){
          time = convert[d.properties.dow] 
          dataset[time][crime] += 1
        }
      })
    }
  }

  var final_dataset = new Array();
  var idx = 0;
  for (var day in dataset){
    var y0 = 0;
    final_dataset[idx] = new Object();
    final_dataset[idx].key = day; 
    final_dataset[idx].val = that.color.domain().map(function(name){
      return {key: day, name: name, y0:y0, y1: y0 += +dataset[day][name] }
    }) 
    final_dataset[idx].total = final_dataset[idx].val[final_dataset[idx].val.length-1].y1; 
    idx += 1;
  }

  return final_dataset;
}

BarVis.prototype.countHourOfDay = function(){
  var that = this;
  var dataset = new Array();
  var final_dataset = new Array();
  var zip;
  var zero = d3.format("02d");
  var convertHour = d3.time.format("%H");
  var parseHour = d3.time.format("%H:%M").parse;
  
  for (var i = 0; i < 24; i++){
    dataset[zero(i)] = new Array();
    for (var key in this.stateMap.crimeType){
      dataset[zero(i)][key] = 0
    }
  }

  var location = this.stateMap.location;
  for (var key in this.filteredData){
    if(this.stateMap.crimeType[key]){
      this.filteredData[key].features.forEach(function(d, i){
        if (location === 'city' || location === d.properties.zip){
          time = convertHour(parseHour(d.properties.time))
          dataset[time][key] += 1
        }
      })
    }
  }

  var idx = 0;
  for (var i = 0; i < 24; i++){
    var hour = zero(i);
    var y0 = 0;
    final_dataset[idx] = new Object()
    final_dataset[idx].key = hour;
    final_dataset[idx].val = that.color.domain().map(function(name){
      return {key: hour, name: name, y0:y0, y1: y0 += +dataset[hour][name] }
    })
     final_dataset[idx].total = final_dataset[idx].val[final_dataset[idx].val.length - 1].y1;
    idx+=1;
  }
  
  return final_dataset;
}

BarVis.prototype.getDisplayData = function(){
  var tab, dataset;
  tab = this.stateMap.barTab;
  if (tab === 'crime_stat'){
    this.displayData = this.countCrimes();
  }
  else if (tab === 'per_capita'){
    this.displayData = this.countPerCapita();
  }
  else if (tab === 'day_of_week'){
    this.displayData = this.countDayOfWeek();
  }
  else if (tab === 'hour_of_day'){
    this.displayData = this.countHourOfDay();
  }
}
//-------------------- END COUNT METHODS -----------------------------------
//-------------------- BEGIN EVENT HANDLERS-----------------------------------
BarVis.prototype.onTypeChange = function(state_map){
  this.stateMap = state_map;
  this.updateVis();
}

BarVis.prototype.onLocationChange = function(state_map){
  var that = this;
  this.stateMap = state_map;
  var tab = this.stateMap.barTab;
  if (tab === 'crime_stat' || tab === 'per_capita'){
    this.bar.classed('test_border', function(d)
      { if(d.key == that.stateMap.location) return true;})
  }
  else if (tab === 'day_of_week' || tab === 'hour_of_day'){
    this.updateVis();
  }
}

BarVis.prototype.onTimeChange = function(state_map, filtered_data){
  this.stateMap = state_map;
  this.filteredData = filtered_data;
  this.updateVis();
}

BarVis.prototype.onTabChange = function(state_map){
  this.stateMap = state_map;
  this.updateVis();
}

//-------------------- END EVENT HANDLERS ------------------------------------
//-------------------- BEGIN UPDATE METHODS ----------------------------------
BarVis.prototype.updateVis = function(){
  var that = this;
  var decimal = d3.format('.2f');
  var tab = this.stateMap.barTab;
  var expand = {
    'Mon':'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday', 
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun':'Sunday'
  }
  this.svg.selectAll(".g")
    .remove();

  this.xAxis = d3.svg.axis()
    .scale(this.x)
    .orient('bottom')

  this.yAxis = d3.svg.axis()
    .scale(this.y)
    .orient('left')
    .ticks(5)

  this.color.domain(d3.keys(this.crimeStats['city']).filter(
    function(key){ return key!== 'total'}));
  
  this.getDisplayData();
  if (tab === 'crime_stat' || tab === 'per_capita'){
    this.displayData.sort(function(a, b){return b.total - a.total});  
  }
  
  if (tab === 'hour_of_day'){
    this.xAxis.tickValues(['00', '06', '12', '18', '23']);  
  }
  else if (tab === 'crime_stat' || tab === 'per_capita'){
    this.xAxis.tickValues([]);
  }

  if (tab === 'day_of_week'){
    this.x.domain(d3.keys(expand))
  }
  else{
    this.x.domain(this.displayData.map(function(d){return d.key}))
  }
  this.y.domain([0, d3.max(this.displayData, function(d){return d.total;})])
  

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d){
      var count = d.y1 - d.y0;
      var label_key, label_val;
      if (tab === 'crime_stat'){
        label_key = 'District: '
        label_val = that.districtData[d.key]
      }
      else if (tab === 'per_capita'){
        label_key = 'District: '
        label_val = that.districtData[d.key]
        count = decimal(count);
      }
      else if (tab === 'day_of_week'){
        label_key = 'Day: '
        label_val = expand[d.key]
      }
      else if (tab === 'hour_of_day'){
        label_key = 'Hour: '
        label_val = d.key
      }
      return '<strong>' + label_key + '</strong> <span>' + label_val + '</span><br>'
      + '<strong>Crime: </strong> <span>' + d.name + '</span> <br>' 
      + '<strong>Incidents: </strong> <span>' + count + '</span> ' ;
    });

  this.svg.call(tip);

  
  this.svg.select('.x.axis')
    .transition()
    .duration(500)
    .call(this.xAxis)
  
  this.svg.select(".y.axis")
    .transition()
    .duration(500)
    .call(this.yAxis)
  

  this.bar = this.svg.selectAll('.bar')
    .data(this.displayData, function(d){return d.key})
    .enter().append('g')
    .attr('class', 'g')
    .classed('test_border', function(d){ if(d.key === that.stateMap.location) return true;})
    .attr('transform', function(d){return 'translate(' + that.x(d.key) + ',0)';});

  this.bar.selectAll('rect')
    .data(function(d){return d.val;})
    .enter().append('rect')
    .attr('width', this.x.rangeBand())
    .attr('y', function(d){return that.y(d.y1);})
    .attr('height', function(d){return that.y(d.y0) - that.y(d.y1);})
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .style('fill', function(d){return that.color(d.name);});
}

//-------------------- END UPDATE METHODS ------------------------------------
//-------------------- BEGIN INIT METHODS ------------------------------------  
BarVis.prototype.initVis = function(){
  var that = this;
  
  this.margin = {top: 0, right: 0, bottom: 20, left: 40}
  
  this.width = parseInt(d3.select("#bar_chart").style("width")) 
  - this.margin.left - this.margin.right;

  this.height = parseInt(d3.select("#bar_chart").style("height")) 
  - this.margin.top - this.margin.bottom;

  this.x = d3.scale.ordinal()
    .rangeRoundBands([0, this.width], .1);

  this.y = d3.scale.linear()
    .rangeRound([this.height-10, 0]);

  this.color = d3.scale.ordinal()
    .range(['#fdb462', '#b3de69', '#8dd3c7', '#fed976', 
    '#fccde5', '#bebada', '#bc80bd']);

  this.svg = d3.select("#bar_chart")
    .append('div')
    .classed('svg-container', true)
    .append("svg")
    // .attr('width', this.width)
    // .attr('height', this.height)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + (this.width+70)+ " " + (this.height+20))
    .classed("svg-content-responsive", true)
    .append('g')
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

  this.svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (this.height-5) + ')')

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