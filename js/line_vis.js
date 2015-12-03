//-------------------- BEGIN MODULE SCOPE VARIABLES --------------------------
LineVis = function(parent_element, population, district, filtered_data, state_map){
  this.parent_element = parent_element;
  this.district_data = district;
  this.filtered_data = filtered_data;
  this.display_data = jQuery.extend(true, {}, filtered_data);
  this.state_map = state_map;
  this.period_total = 0;
  this.initVis();
  this.population_data = {
  "94105": "5846",
  "94107": "26599",
  "94108": "13768",
  "94109": "55984",
  "94112": "79407",
  "94114": "31124",
  "94122": "56023",
  "94124": "33996",
  "94127": "19289",
  "94132": "28129",
  "94131": "26881",
  "94133": "26237",
  "94102": "31176",
  "94103": "27170",
  "94110": "69333",
  "94111": "3713",
  "94115": "33021",
  "94116": "43698",
  "94117": "39169",
  "94118": "38319",
  "94121": "41203",
  "94123": "23088",
  "94134": "40798"
}

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
  start_date = new Date(this.state_map.start_date);
  end_date = new Date(this.state_map.end_date);

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
    for (key in that.state_map.crime_type){
      count_data[d.date][key] = 0;
    }
  })
  location = this.state_map.location;
  for (key in this.state_map.crime_type){
    if (key in this.filtered_data && this.state_map.crime_type[key]){
      crime = this.filtered_data[key].features;

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

  this.period_total = d3.max(d3.keys(count_data).map(function(key){return count_data[key].total;}))

  var array = d3.keys(count_data).map(function (date){return count_data[date];})

  var stack = d3.layout.stack()
    .values(function(d){return d.values;})
  
  if (is_period_long){
    final_dataset = stack(d3.keys(this.state_map.crime_type).map(function(name){
      return {
        name: name,
        values: array.map(function(d){
          return {date: new Date(d.date, 0, 1, 0), y: d[name]};
        })
      };
    }));
  }
  else{
    final_dataset = stack(d3.keys(this.state_map.crime_type).map(function(name){
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

LineVis.prototype.countDistrict = function(){
  var that = this;
  var getYear, parseData, key, crime, location, zip, time, location,
  dataset, final_dataset, index, start_date, end_date, periods, is_period_long;

  parse_date = d3.time.format("%m/%d/%Y").parse;
  parse_year_month = d3.time.format("%Y-%m").parse;
  get_year = d3.time.format("%Y");
  get_month = d3.time.format("%Y-%m");


  dataset = new Object();
  start_date = new Date(this.state_map.start_date);
  end_date = new Date(this.state_map.end_date);

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
    for (key in that.population_data){
      if (key != 'city'){
        count_data[d.date][key] = 0;
      }
    }
  })
  
  for (key in this.state_map.crime_type){
    if (key in this.filtered_data && this.state_map.crime_type[key]){
      crime = this.filtered_data[key].features;
      crime.forEach(function(d, i){
        location = d.properties.zip;
        if (location != 'N/A'){
          if (is_period_long){
            time = get_year(parse_date(d.properties.date));
          }
          else{
           time = get_month(parse_date(d.properties.date)); 
          }
          count_data[time][location] += 1
          count_data[time].total += 1;
        }
      })
    }
  }

  this.period_total = d3.max(d3.keys(count_data).map(function(key){return count_data[key].total;}))

  var array = d3.keys(count_data).map(function (date){return count_data[date];})

  var stack = d3.layout.stack()
    .values(function(d){return d.values;})
  
  if (is_period_long){
    final_dataset = stack(d3.keys(this.population_data).map(function(name){
      
      if (name != 'city'){
        return {
          name: name,
          values: array.map(function(d){
            return {date: new Date(d.date, 0, 1, 0), y: d[name]};
          })
        };
      }
    }));
  }
  else{
    final_dataset = stack(d3.keys(this.population_data).map(function(name){
      if (name != 'city'){
        return {
          name: name,
          values: array.map(function(d){
            var temp = parse_year_month(d.date)
            return {date: new Date(temp.getYear()+1900, temp.getMonth(), 1, 0), y: d[name]};
          })
        };
      }
    })); 
  }
  return final_dataset;
}

LineVis.prototype.countDayOfWeek = function(){
  var that = this;
  var getYear, parseData, key, crime, location, zip, time, location,
  dataset, final_dataset, index, start_date, end_date, periods, is_period_long;

  parse_date = d3.time.format("%m/%d/%Y").parse;
  parse_year_month = d3.time.format("%Y-%m").parse;
  get_year = d3.time.format("%Y");
  get_month = d3.time.format("%Y-%m");


  dataset = new Object();
  start_date = new Date(this.state_map.start_date);
  end_date = new Date(this.state_map.end_date);

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
  
  var dow_map = { 
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
  }

  var count_data = new Array();
  periods.forEach(function(d){
    count_data[d.date] = new Object();
    count_data[d.date].date = d.date;
    count_data[d.date].total = 0;
    for (key in dow_map){
      if (key != 'city'){
        count_data[d.date][key] = 0;
      }
    }
  })
  
  location = this.state_map.location;
  for (key in this.state_map.crime_type){
    if (key in this.filtered_data && this.state_map.crime_type[key]){
      crime = this.filtered_data[key].features;
      crime.forEach(function(d, i){
        dow = d.properties.dow;
        if (location === 'city' || location === d.properties.zip){
          if (is_period_long){
            time = get_year(parse_date(d.properties.date));
          }
          else{
           time = get_month(parse_date(d.properties.date)); 
          }
          count_data[time][dow] += 1
          count_data[time].total += 1;
        }
      })
    }
  }

  this.period_total = d3.max(d3.keys(count_data).map(function(key){return count_data[key].total;}))

  var array = d3.keys(count_data).map(function (date){return count_data[date];})

  var stack = d3.layout.stack()
    .values(function(d){return d.values;})
  

  if (is_period_long){
    final_dataset = stack(d3.keys(dow_map).map(function(name){
      if (name != 'city'){
        return {
          name: name,
          values: array.map(function(d){
            return {date: new Date(d.date, 0, 1, 0), y: d[name]};
          })
        };
      }
    }));
  }
  else{
    final_dataset = stack(d3.keys(dow_map).map(function(name){
      if (name != 'city'){
        return {
          name: name,
          values: array.map(function(d){
            var temp = parse_year_month(d.date)
            return {date: new Date(temp.getYear()+1900, temp.getMonth(), 1, 0), y: d[name]};
          })
        };
      }
    })); 
  }
  return final_dataset;
}

LineVis.prototype.countHourOfDay = function(){
  var that = this;
  var getYear, parseData, key, crime, location, zip, time, location,
  dataset, final_dataset, index, start_date, end_date, periods, is_period_long;

  parse_date = d3.time.format("%m/%d/%Y").parse;
  parse_year_month = d3.time.format("%Y-%m").parse;
  get_year = d3.time.format("%Y");
  get_month = d3.time.format("%Y-%m");
  get_hour = d3.time.format("%H");
  parse_hour = d3.time.format("%H:%M").parse;
  var zero = d3.format("02d");
  dataset = new Object();
  start_date = new Date(this.state_map.start_date);
  end_date = new Date(this.state_map.end_date);

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
  
  var hour_map = []
  for (var i = 0; i < 24; i++){
    hour_map.push(zero(i))
  }

  var count_data = new Array();
  periods.forEach(function(d){
    count_data[d.date] = new Object();
    count_data[d.date].date = d.date;
    count_data[d.date].total = 0;
    for (var i = 0; i < 24; i++){
        count_data[d.date][hour_map[i]] = 0;
    }
  })
  
  location = this.state_map.location;
  for (key in this.state_map.crime_type){
    if (key in this.filtered_data && this.state_map.crime_type[key]){
      crime = this.filtered_data[key].features;
      crime.forEach(function(d, i){
        var hour = get_hour(parse_hour(d.properties.time));
        if (location === 'city' || location === d.properties.zip){
          if (is_period_long){
            time = get_year(parse_date(d.properties.date));
          }
          else{
           time = get_month(parse_date(d.properties.date)); 
          }
          count_data[time][hour] += 1
          count_data[time].total += 1;
        }
      })
    }
  }

  this.period_total = d3.max(d3.keys(count_data).map(function(key){return count_data[key].total;}))

  var array = d3.keys(count_data).map(function (date){return count_data[date];})

  var stack = d3.layout.stack()
    .values(function(d){return d.values;})
  

  
  if (is_period_long){
    final_dataset = stack(hour_map.map(function(name){
      if (name != 'city'){
        return {
          name: name,
          values: array.map(function(d){
            return {date: new Date(d.date, 0, 1, 0), y: d[name]};
          })
        };
      }
    }));
  }
  else{
    final_dataset = stack(hour_map.map(function(name){
      if (name != 'city'){
        return {
          name: name,
          values: array.map(function(d){
            var temp = parse_year_month(d.date)
            return {date: new Date(temp.getYear()+1900, temp.getMonth(), 1, 0), y: d[name]};
          })
        };
      }
    })); 
  }
  return final_dataset;
}
//-------------------- END COUNT METHODS -------------------------------------

//-------------------- BEGIN HELPER METHODS ----------------------------------
LineVis.prototype.isPeriodLong = function(){
  var start_date, end_date, years_between, ms_per_year, ms_between, 
  criteria_length;

  start_date = new Date(this.state_map.start_date);
  end_date = new Date(this.state_map.end_date);
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
  this.state_map = state_map;
  this.updateVis();
}

LineVis.prototype.onLocationChange = function(state_map){
  this.state_map = state_map;
  this.updateVis();
}

LineVis.prototype.onTimeChange = function(state_map, filtered_data){
  this.state_map = state_map;
  this.filtered_data = filtered_data;
  this.updateVis();
}

LineVis.prototype.onTabChange = function(state_map){
  this.state_map = state_map;
  this.updateVis();
}

LineVis.prototype.getDisplayData = function(){
  var tab = this.state_map.line_tab;
  if (tab === 'crime_type'){
    this.display_data = this.countCrimes();
  }
  else if (tab === 'district'){
    this.display_data = this.countDistrict();
  }
  else if (tab === 'day_of_week'){
   this.display_data = this.countDayOfWeek(); 
  }
  else if (tab === 'hour_of_day'){
   this.display_data = this.countHourOfDay(); 
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

  this.color.domain(d3.keys(this.state_map.crime_type))

  this.getDisplayData();

  start_date = new Date(this.state_map.start_date);
  end_date = new Date(this.state_map.end_date);
  is_period_long = this.isPeriodLong();
  if (is_period_long){
    period = d3.time.years(start_date, end_date)
  }
  else{
   period = d3.time.months(start_date, end_date) 
  }

  this.x.domain(d3.extent(period, function(d){return d}));
  this.y.domain([0, this.period_total]);

  var tooltip = d3.select('#line_chart')
    .append('div')
    .attr('class', 'line_tip')
    .style("position", "absolute")
    .style("z-index", "20")
    .style("visibility", "hidden")
  

  this.crime = this.svg.selectAll('.crime')
    .data(this.display_data)
    .enter().append('g')
    .attr('class', 'crime')


  this.crime = this.crime.append('path')
    .attr('class', 'area')
    .attr('d', function(d){return that.area(d.values)})
    
  var tab = this.state_map.line_tab;
  var day_color = d3.scale.category20();
  var hour_color = d3.scale.ordinal()
                    .range([])
  var other_color = d3.scale.category20c();
  if (tab == 'crime_type'){
    this.crime
      .style('fill', function(d){return that.color(d.name);})
  }
  else if (tab === 'day_of_week'){
    this.crime
      .style('fill', function(d){return day_color(d.name);}) 
  }
  else{
    this.crime
      .style('fill', function(d){return other_color(d.name);}) 
  }
  
  this.svg.select('.x.axis')
    .transition()
    .duration(500)
    .call(this.xAxis)
  
  this.svg.select('.y.axis')
    .transition()
    .duration(500)
    .call(this.yAxis)


  var name_label;
  var name;
  if (tab == 'crime_type'){
    name_label = 'Crime'
  }
  else if (tab == 'district'){
    name_label = 'District'
  }
  else if (tab === 'day_of_week'){
    name_label = 'Day of Week'
  }
  else if (tab === 'hour_of_day'){
    name_label = 'Hour of Day'
  }
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
      if (tab === 'district'){
      tooltip
      .html( "<p><strong>Period: </strong>" + period + 
            "<br><strong>"+name_label +": </strong>" + that.district_data[d.name] + 
            "<br><strong>Incidents: </strong>" + incidents + "</p>" ).style("visibility", "visible");
      }
      else{
      tooltip
      .html( "<p><strong>Period: </strong>" + period + 
            "<br><strong>"+name_label +": </strong>" + d.name + 
            "<br><strong>Incidents: </strong>" + incidents + "</p>" ).style("visibility", "visible");
      }
    })
    .on("mouseout", function(d, i) {
      that.svg.selectAll(".crime")
      .transition()
      .duration(250)
      .attr("opacity", 1);
      d3.select(this)
      .classed("hover", false)
      .attr("stroke-width", "0px")

      if (tab === 'district'){
      tooltip
      .html( "<p><strong>Period: </strong>" + period + 
            "<br><strong>"+name_label +": </strong>" + that.district_data[d.name] + 
            "<br><strong>Incidents: </strong>" + incidents + "</p>" ).style("visibility", "hidden");
      }
      else{
      tooltip
      .html( "<p><strong>Period: </strong>" + period + 
            "<br><strong>"+name_label +": </strong>" + d.name + 
            "<br><strong>Incidents: </strong>" + incidents + "</p>" ).style("visibility", "hidden");
      }
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

  this.margin = {top: 0, right: 0, bottom: 20, left: 40}
  
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
    .ticks(4)

  this.yAxis = d3.svg.axis()
    .scale(this.y)
    .orient('left')
    .ticks(5)
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

  this.svg = d3.select('#line_chart')
    .append('div')
    .classed('svg-container', true)
    .append('svg')
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + (this.width+50)+ " " + (this.height+20))
    .classed("svg-content-responsive", true)
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