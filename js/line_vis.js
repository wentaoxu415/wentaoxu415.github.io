//-------------------- BEGIN MODULE SCOPE VARIABLES --------------------------
LineVis = function(_parentElement, _population, _district, _filteredData, _stateMap){
  this.parentElement = _parentElement;
  this.population = _population;
  this.districtData = _district;
  this.filteredData = _filteredData;
  this.displayData = jQuery.extend(true, {}, _filteredData);
  this.stateMap = _stateMap;
  this.periodTotal = 0;
  this.initVis();
}

//-------------------- END MODULE SCOPE VARIABLES ----------------------------

//-------------------- BEGIN COUNT METHODS -----------------------------------
LineVis.prototype.countCrimes = function(){
  var that = this;
  var getYear, parseData, key, crime, location, zip, time, 
  dataset, final_dataset, index, start_date, end_date, periods, is_period_long;

  parse_date = d3.time.format("%m/%d/%Y").parse;
  parse_year_month = d3.time.format("%Y-%m").parse;
  get_year = d3.time.format("%Y");
  get_month = d3.time.format("%Y-%m");


  dataset = new Object();
  start_date = new Date(this.stateMap.startDate);
  end_date = new Date(this.stateMap.endDate);

  is_period_long = this.isPeriodLong();

  if(is_period_long){
    periods = d3.time.years(start_date, end_date);
    periods.forEach(function(d, i){
      d.date = get_year(d);
    })
  }
  else{
    periods = d3.time.months(start_date, end_date);
    periods.forEach(function(d, i){
      d.date = get_month(d);
    })
  }
  
  var count_data = new Array();
  periods.forEach(function(d){
    count_data[d.date] = new Object();
    count_data[d.date].date = d.date;
    count_data[d.date].total = 0;
    for (key in that.stateMap.crimeType){
      count_data[d.date][key] = 0;
    }
  })
  
  location = this.stateMap.location;
  for (key in this.stateMap.crimeType){
    if (key in this.filteredData && this.stateMap.crimeType[key]){
      crime = this.filteredData[key].features;
      crime.forEach(function(d, i){
        if (location === 'city' || location === d.properties.zip){
          if (is_period_long){
            time = get_year(parse_date(d.properties.date));
          }
          else{
           time = get_month(parse_date(d.properties.date)); 
          }
          count_data[time][key] += 1
          count_data[time].total += 1;
        }
      })
    }
  }

  this.periodTotal = d3.max(d3.keys(count_data).map(function(key){return count_data[key].total;}))

  var array = d3.keys(count_data).map(function (date){return count_data[date];})

  var stack = d3.layout.stack()
    .values(function(d){return d.values;})
  
  if (is_period_long){
    final_dataset = stack(d3.keys(this.stateMap.crimeType).map(function(name){
      return {
        name: name,
        values: array.map(function(d){
          return {date: new Date(d.date, 0, 1, 0), y: d[name]};
        })
      };
    }));
  }
  else{
    final_dataset = stack(d3.keys(this.stateMap.crimeType).map(function(name){
      return {
        name: name,
        values: array.map(function(d){
          var temp = parse_year_month(d.date)
          return {date: new Date(temp.getYear()+1900, temp.getMonth(), 1, 0), y: d[name]};
        })
      };
    })); 
  }
  return final_dataset;
}

//-------------------- END COUNT METHODS -------------------------------------

//-------------------- BEGIN HELPER METHODS ----------------------------------
LineVis.prototype.isPeriodLong = function(){
  var start_date, end_date, years_between, ms_per_year, ms_between, 
  criteria_length;

  start_date = new Date(this.stateMap.startDate);
  end_date = new Date(this.stateMap.endDate);
  ms_per_year =1000*60*60*24*365;
  ms_between = end_date.getTime() - start_date.getTime();
  years_between = ms_between/ms_per_year;
  criteria_length = 3;
  if (years_between > criteria_length) return true;
  else return false
}
//-------------------- END HELPER METHODS ------------------------------------
//-------------------- BEGIN EVENT HANDLERS ----------------------------------
LineVis.prototype.onTypeChange = function(state_map){
  this.stateMap = state_map;
  this.updateVis();
}

LineVis.prototype.onLocationChange = function(state_map){
  this.stateMap = state_map;
  this.updateVis();
}

LineVis.prototype.onTimeChange = function(state_map, filtered_data){
  this.stateMap = state_map;
  this.filteredData = filtered_data;
  this.updateVis();
}

LineVis.prototype.onTabChange = function(state_map){
  this.stateMap = state_map;
}

LineVis.prototype.getDisplayData = function(){
  var tab = this.stateMap.lineTab;
  if (tab === 'crime_type'){
    this.displayData = this.countCrimes();
  }
}
//-------------------- END EVENT HANDLERS ------------------------------------

//-------------------- BEGIN UDDATE METHOD -----------------------------------
LineVis.prototype.updateVis = function(){
  var that = this;
  var start_date, end_date, period, datearray, is_period_long;
  
  this.svg.selectAll(".crime")
    .remove();

  d3.select('.remove')
    .remove();

  this.color.domain(d3.keys(this.stateMap.crimeType))

  this.getDisplayData();

  start_date = new Date(this.stateMap.startDate);
  end_date = new Date(this.stateMap.endDate);
  is_period_long = this.isPeriodLong();
  if (is_period_long){
    period = d3.time.years(start_date, end_date)
  }
  else{
   period = d3.time.months(start_date, end_date) 
  }

  this.x.domain(d3.extent(period, function(d){return d}));
  this.y.domain([0, this.periodTotal]);

  var tooltip = d3.select('#line_chart')
    .append('div')
    .attr('class', 'line_tip')
    .style("position", "absolute")
    .style("z-index", "20")
    .style("visibility", "hidden")
  

  this.crime = this.svg.selectAll('.crime')
    .data(this.displayData)
    .enter().append('g')
    .attr('class', 'crime')


  this.crime.append('path')
    .attr('class', 'area')
    .attr('d', function(d){return that.area(d.values)})
    .style('fill', function(d){return that.color(d.name);})

  
  this.svg.select('.x.axis')
    .transition()
    .duration(500)
    .call(this.xAxis)
  
  this.svg.select('.y.axis')
    .transition()
    .duration(500)
    .call(this.yAxis)

  datearray = []
  this.svg.selectAll('.crime')
    .attr('opacity', 1)
    .on("mouseover", function(d, i) {
      that.svg.selectAll(".crime")
      .transition()
      .duration(250)
      .attr("opacity", function(d, j) {
        return j != i ? 0.6 : 1;
    })})
    .on("mousemove", function(d, i){
      mousex = d3.mouse(this)
      mousex = mousex[0]
      var invertedx = that.x.invert(mousex);
      if (is_period_long){
        invertedx = invertedx.getYear();
        var selected = (d.values);
        for (var k = 0; k < selected.length; k++){
          datearray[k] = selected[k].date.getYear();
        }
        mousedate = datearray.indexOf(invertedx);
        incidents = d.values[mousedate].y;
        period = 1900 + d.values[mousedate].date.getYear();
      }
      else{
        var formatMonth = d3.time.format('%Y-%m')
        invertedx = formatMonth(invertedx)
        var selected = (d.values);
        for (var k = 0; k < selected.length; k++){
          datearray[k] = formatMonth(selected[k].date)
        }
        mousedate = datearray.indexOf(invertedx);
        incidents = d.values[mousedate].y;
        period = formatMonth(d.values[mousedate].date);
      }
      d3.select(this)
      .classed('hover', true)
      .attr('stroke', '#cc0000')
      .attr('stroke-width', '0.5px')
      tooltip
      .html( "<p><strong>Period: </strong>" + period + 
            "<br><strong>Crime: </strong>" + d.name + 
            "<br><strong>Incidents: </strong>" + incidents + "</p>" ).style("visibility", "visible");
    })
    .on("mouseout", function(d, i) {
      that.svg.selectAll(".crime")
      .transition()
      .duration(250)
      .attr("opacity", 1);
      d3.select(this)
      .classed("hover", false)
      .attr("stroke-width", "0px"), 

    tooltip.html( "<p><strong>Period: </strong>" + period + 
            "<br><strong>Crime: </strong>" + d.name + 
            "<br><strong>Incidents: </strong>" + incidents + "</p>").style("visibility", "hidden");
  })

  var vertical = d3.select("#line_chart")
        .append("div")
        .attr("class", "remove")
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "1px")
        .style("height", that.height)
        .style("top", "10px")
        .style("bottom", "30px")
        .style("left", "0px")
        .style("background", "#fff");

  d3.select("#line_chart")
      .on("mousemove", function(){  
         mousex = d3.mouse(this);
         mousex = mousex[0] - 5;
         vertical.style("left", mousex + "px" )})
      .on("mouseover", function(){  
         mousex = d3.mouse(this);
         mousex = mousex[0] + 5;
         vertical.style("left", mousex + "px")});

}
//-------------------- END UPDATE METHOD -------------------------------------

//-------------------- BEGIN INIT METHOD -------------------------------------
LineVis.prototype.initVis = function(){
  var that = this;

  this.margin = {top: 10, right: 40, bottom: 30, left: 40}
  
  this.width = parseInt(d3.select("#line_chart").style("width")) 
  - this.margin.left - this.margin.right;

  this.height = parseInt(d3.select("#line_chart").style("height")) 
  - this.margin.top - this.margin.bottom;

  this.x = d3.time.scale()
    .range([0, this.width])

  this.y = d3.scale.linear()
    .range([this.height, 0])

  this.xAxis = d3.svg.axis()
    .scale(this.x)
    .orient('bottom')
    .ticks(6);

  this.yAxis = d3.svg.axis()
    .scale(this.y)
    .orient('left')
    .tickFormat(d3.format('d'))

  this.color = d3.scale.ordinal()
    .range(['#fdb462', '#b3de69', '#8dd3c7', '#fed976', 
    '#fccde5', '#bebada', '#bc80bd']);

  this.area = d3.svg.area()
    .x(function(d){return that.x(d.date);})
    .y0(function(d){return that.y(d.y0);})
    .y1(function(d){return that.y(d.y0 + d.y)})

  this.stack = d3.layout.stack()
    .values(function(d){return d.values;})

  this.svg = d3.select('#line_chart').append('svg')
    .attr('width', this.width + this.margin.left + this.margin.right)
    .attr('height', this.height + this.margin.top + this.margin.bottom)
    .append('g')
    .attr('transform', 'translate(' 
      + this.margin.left + ',' + this.margin.top + ')');

  this.svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + this.height + ')')

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
//-------------------- END INIT METHOD ---------------------------------------