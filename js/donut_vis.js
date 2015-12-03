//-------------------- BEGIN MODULE OBJECTS ------------------------ 
DonutVis = function(parent_element, population, districts, filtered_data, state_map){
  this.parent_element = parent_element;
  this.population = population;
  this.district_name = districts;
  this.filtered_data = filtered_data;
  this.display_data = jQuery.extend(true, {}, filtered_data);
  this.state_map = state_map;
  this.crime_stats = [];
  this.initVis();
}
//-------------------- END MODULE OBJECTS ------------------------------------
  
//-------------------- BEGIN UTILITY METHODS -------------------------------
DonutVis.prototype.countCrimes = function(){     
  var that = this, zip, key, crime;
  for (zip in this.population){
    this.crime_stats[zip] = {}
    this.crime_stats[zip]['total'] = 0;
    for (key in this.state_map.crime_type){
      this.crime_stats[zip][key] = 0;
    }
  }
  this.crime_stats['N/A'] = {};
  this.crime_stats['N/A']['total'] = 0;
  for (key in this.state_map.crime_type){  
    this.crime_stats['N/A'][key] = 0;
  }


  for (key in this.state_map.crime_type){
    if (key in this.filtered_data && this.state_map.crime_type[key]){
      crime = this.filtered_data[key].features;
      crime.forEach(function(d, i){
        zip = d.properties.zip;
        that.crime_stats[zip][key] += 1
        that.crime_stats[zip]['total'] += 1
        that.crime_stats['city'][key] += 1
        that.crime_stats['city']['total'] += 1
      })
      }
    }
}

DonutVis.prototype.getDisplayData = function(district){
    var dataset = new Array(), key, stat;
    if (this.crime_stats[district]['total'] == 0){
      return false;
    }
    else{
      for (key in this.crime_stats[district]){
        if(key != 'total'){
          stat = {label: key, count: this.crime_stats[district][key]};
          dataset.push(stat);
        }
      }
      return dataset;
  }
}

DonutVis.prototype.getCrimesPerCapita = function(district){
  var crime, population;
  crime = this.crime_stats[district]['total']
  population = this.population[district]/1000
  return crime/population;
}

DonutVis.prototype.getRelativeRisk = function(district){
  var district_risk, city_crime, city_population, city_risk;
  district_risk = this.getCrimesPerCapita(district);
  city_crime = this.crime_stats['city']['total']; 
  city_population = this.population['city']/1000;
  city_risk = city_crime/city_population;
  return district_risk/city_risk;
}

//-------------------- END UTILITY METHODS ---------------------------------
//---------------------BEGIN UPDATE METHODS-----------------------------------
DonutVis.prototype.zeroVis = function(){
  var that = this, capita, comma, district;
  capita = d3.format(".2f"); 
  comma = d3.format("0,000");
  district = this.state_map.location;
  
  d3.select('#donut_location').html('<b><u>'+this.district_name[district]+'</u></b>');
  d3.select('#donut_crimes').html(this.crime_stats[district]['total'])
  d3.select('#donut_population').html(comma(this.population[district]) + ' (2013)');
  d3.select('#donut_capita').html(capita(this.getCrimesPerCapita(district)) + ' (per 1000 People)');
  d3.select('#relative_risk').html(capita(this.getRelativeRisk(district)));
  d3.select('.svg-container').remove();

  this.state_map.zero_vis = true;

}

DonutVis.prototype.updateVis = function(){
  var that = this, capita, comma, district, total, percent, height, offset, 
  horz, vert, i;

  capita = d3.format(".2f"); 
  comma = d3.format("0,000");
  district = this.state_map.location;

  if (!this.display_data){
    this.zeroVis()
  }
  else if (this.state_map.zero_vis){
    this.initVis();
    this.state_map.zero_vis = false;
  }
  else{
    console.log("hey");  
    d3.select('#donut_location').html('<b><u>'+this.district_name[district]+'</u></b>');
    d3.select('#donut_crimes').html(this.crime_stats[district]['total'])
    d3.select('#donut_population').html(comma(this.population[district]) + ' (2013)');
    d3.select('#donut_capita').html(capita(this.getCrimesPerCapita(district)) + ' (per 1000 People)');
    d3.select('#relative_risk').html(capita(this.getRelativeRisk(district)));

    this.pie.value(function(d){return d.count;})
      
    this.path.data(this.pie(this.display_data))
      .transition()
      .duration(2000)
      .attrTween("d", arcTween);

    this.path.on('mouseover', function(d){
      total = d3.sum(that.display_data.map(function(d){return d.count;}));
      percent = Math.round(1000 * d.data.count / total)/10;
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
        height = that.legend_rect_size + that.legend_spacing;
        offset = height * that.color.domain().length / 2;
        horz = -2 * that.legend_rect_size;
        vert = i * height - offset;
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
      i = d3.interpolate(this._current, a);
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
    this.state_map = state_map;
    this.display_data = this.getDisplayData(this.state_map.location);
    this.updateVis();
  }

  DonutVis.prototype.onTypeChange = function(state_map){
    var that = this;
    this.state_map = state_map;
    this.countCrimes();
    this.display_data = this.getDisplayData(this.state_map.location);
    this.updateVis();
  }

  DonutVis.prototype.onTimeChange = function(state_map, filtered_data){
    this.state_map = state_map;
    this.filtered_data = filtered_data;
    this.countCrimes();
    this.display_data = this.getDisplayData(this.state_map.location);
    this.updateVis();
  }


  //-------------------- END EVENT HANDLERS ----------------------------------

  //-------------------- BEGIN INIT METHOD -----------------------------------  
 DonutVis.prototype.initVis = function(){
  var that = this;
  var capita, comma, district, total, percent, height, offset, vert, horz;
  
  capita = d3.format(".2f"); 
  comma = d3.format("0,000");
  district = this.state_map.location;
  
  this.countCrimes();

  d3.select('#donut_location').html('<b><u>'+that.district_name[district]+'</u></b>');
  d3.select('#donut_population').html(comma(that.population[district]) + ' (2013)');
  d3.select('#donut_crimes').html(that.crime_stats['city']['total'])
  d3.select('#donut_capita').html(capita(this.getCrimesPerCapita(district)) + ' (per 1000 People)');
  d3.select('#relative_risk').html(capita(this.getRelativeRisk(district)));

  this.display_data = this.getDisplayData(this.state_map.location);

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


  this.arc = d3.svg.arc()
    .innerRadius(this.radius - 25)
    .outerRadius(this.radius);

    this.pie = d3.layout.pie()
      .value(function(d){return d.count;})
      .sort(null);
    
  this.path = this.svg.selectAll('path')
      .data(this.pie(this.display_data))

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
    total = d3.sum(that.display_data.map(function(d){
      return d.count;
    }));
    percent = Math.round(1000 * d.data.count / total)/10;
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
      height = that.legend_rect_size + that.legend_spacing;
      offset = height * that.color.domain().length / 2;
      horz = -2 * that.legend_rect_size;
      vert = i * height - offset;
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
