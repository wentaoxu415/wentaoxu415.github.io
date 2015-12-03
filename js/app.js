$(function(){
/*---------------------------BEGIN MODULE VARIABLES-------------------------*/
  var geography_data, district_data, center_data, population_data, 
  original_data = {
    "assault": null, 
    "burglary": null, 
    "drug": null, 
    "homicide": null, 
    "robbery": null, 
    "sexOffense": null, 
    "weaponLaw": null
  },
  state_map = {
    "crime_type": {
      "assault": true, 
      "burglary": true, 
      "drug": true, 
      "homicide": true,
      "robbery": true, 
      "sexOffense": true, 
      "weaponLaw": true               
    },
    "start_date": '01/01/2015', 
    "end_date": '09/25/2015',
    "start_time": '00:00', 
    "end_time": '23:59',
    "heat_map": true,
    "location": 'city',
    "bar_tab": 'crime_stat',
    "line_tab": 'crime_type',
    "zero_vis": false
  };

/*---------------------------END MODULE VARIABLES---------------------------*/

/*---------------------------BEGIN HELPER METHODS-------------------------*/ 
  
  
  // Parses time in string form and returns the time as Date object
  var parseTime = d3.time.format("%H:%M").parse;
  
  // Takes in a Date object and returns military time
  var getHourMin = d3.time.format("%H:%M");

  // Updates crime types in state_map when checkbox is updated
  function updateCrimeType(type, bool){
    state_map.crime_type[type] = bool;
  }

  // Updates both start and end date in state_map when date range is updated
  function updateDate(start_date, end_date){
    state_map.start_date = start_date;
    state_map.end_date = end_date;
  }

  // Updates both start and end time in state_map when time range is updated
  function updateTime(start_time, end_time){
    state_map.start_time = start_time;
    state_map.end_time = end_time;
  }

  // Updates location in state_map when a district on the map is selected
  function updateLocation(location){
    state_map.location = location;
  }

  // Updates bar tab in state_map when a new bar tab is selected
  function updateBarTab(tab){
    state_map.bar_tab = tab;
  }

  // Updates bar tab in state_map when a new bar tab is selected
  function updateLineTab(tab){
    state_map.line_tab = tab;
  }

  // Purpose: 
  // * Checks if a given date is within the date range stored in state_map
  // Arguments:
  // * 1) Date in question
  // Returns:
  // * True if date is in the state_map's daterange. False otherwise. 
  function isInDateRange(date){
    var start_date, end_date; 
    date =  new Date(date);
    start_date = new Date(state_map.start_date);
    end_date = new Date(state_map.end_date);
    if ((date >= start_date) && (date <= end_date)) return true;
    else return false;
  }

  // Purpose: 
  // * Checks if a given time is within the time range stored in state_map
  // Arguments:
  // * 1) Time in question
  // Returns:
  // * True if time is in the state_map's timerange. False otherwise. 
  function isInTimeRange(time){
    var start_time, end_time;
    time = getHourMin(parseTime(time))
    start_time = getHourMin(parseTime(state_map.start_time))
    end_time = getHourMin(parseTime(state_map.end_time))
    if ( (time >= start_time) && (time <= end_time)) return true;
    else return false;
  }

  // Purpose: 
  // * Filters the original data based on selected date and time range
  // Arguments:
  // * None
  // Returns:
  // * Returns filtered data that met the selected date and time rance
  function filterData(){
    var filtered_data = {};
    var key;
    for (key in original_data){
      filtered_data[key] = {features : null};
      var result = [];
      original_data[key].features.forEach(function(d, i){
        if (isInDateRange(d.properties.date) && 
            isInTimeRange(d.properties.time)){
            result.push(d)
          }
      })
      filtered_data[key].features = result;
    }
    return filtered_data;
  }
/*---------------------------END HELPER METHODS---------------------------*/

/*---------------------------BEGIN initModule METHOD------------------------*/

function initModule(error, geography, population, districts, center, assault, burglary, drug, homicide, robbery, sexOffense, weaponLaw){
// function initModule(error, geography, population, districts, center, homicide){
  var event_handler, map_vis, donut_vis, bar_vis, line_vis, filtered_data;

  // Event handler is used to detect and respond to user inputs 
  event_handler = new Object();

  if(error){
    console.log(error);
    throw error;
  }
  else{
    geography_data = geography;
    population_data = population;
    district_data = districts;
    center_data = center;
    original_data['assault'] = assault
    original_data['burglary'] = burglary
    original_data['drug'] = drug
    original_data['homicide'] = homicide;
    original_data['robbery'] = robbery
    original_data['sexOffense'] = sexOffense
    original_data['weaponLaw'] = weaponLaw
  }
 
  map_vis = new MapVis(d3.select("#map"), geography_data, population_data, 
            district_data, center_data, original_data, state_map, event_handler);
  donut_vis = new DonutVis(d3.select("#donut_vis"), population_data, 
            district_data, original_data, state_map);
  bar_vis = new BarVis(d3.select("#bar_vis"), population_data, 
            district_data, original_data, state_map);
  line_vis = new LineVis(d3.select("#line_chart"), population_data, 
            district_data, original_data, state_map);

  
  /*---------------------------BEGIN EVENT HANDLERS---------------------------*/ 
  $(event_handler).bind("locationChanged", function(event, location){
    updateLocation(location);
    donut_vis.onLocationChange(state_map);
    bar_vis.onLocationChange(state_map);
    line_vis.onLocationChange(state_map);
  })

  $(event_handler).bind('typeChanged', function(event){
    donut_vis.onTypeChange(state_map);
    bar_vis.onTypeChange(state_map);
    line_vis.onTypeChange(state_map);
  })

  $(event_handler).bind('timeChanged', function(event){
    filtered_data = filterData();
    setTimeout(function(){
      map_vis.onTimeChange(filtered_data);},10);
      donut_vis.onTimeChange(state_map, filtered_data);
      bar_vis.onTimeChange(state_map, filtered_data);
      line_vis.onTimeChange(state_map, filtered_data);
  })

  $('a[data-toggle="bar"]').on('click', function (e) {
    updateBarTab(e.target.id);
    bar_vis.onTabChange(state_map);
  });

  $('a[data-toggle="line"]').on('click', function (e) {
    updateLineTab(e.target.id);
    line_vis.onTabChange(state_map);
  });

  $(function(){
    $('li').click(function(){
      $(this).addClass('active').siblings().removeClass('active');
    });
  });

  $('.paper_switch').click(function(e){
    var is_checked, crime_type;
    is_checked = e.currentTarget.checked;
    crime_type = e.currentTarget.name;
    updateCrimeType(crime_type, is_checked);
    map_vis.map.spin(true);
    setTimeout(function(){
      map_vis.onTypeChange(is_checked, crime_type, state_map);
    }, 10);
    });

  $('#myonoffswitch').click(function(e){
    var is_checked = e.currentTarget.checked;
    state_map.heat_map = is_checked;
    map_vis.onHeatChange(state_map);
  })
  
  // Initializes the date range values and triggers timeChanged event 
  $(function() {
    $('input[name="daterange"]').daterangepicker({
      autoApply: true,
      linkedCalendars: false,
      startDate: "01/01/2015",
      endDate: "09/25/2015",
      minDate: "01/01/2015",
      maxDate: "09/25/2015",
      timeZone: 0
      }, 
      function(_start_date, _end_date) {
        start_date = new Date(_start_date);
        end_date = new Date(_end_date);
        updateDate(start_date, end_date);
        map_vis.map.spin(true);
        $(event_handler).trigger('timeChanged');
    });
  });

  // Initializes the time range values and triggers timeChanged event 
  $(function() {
  $('input[name="timerange"]').daterangepicker({
    timePicker: true,
    timePickerIncrement: 1,
    autoApply: false,
    locale: {
      format: 'hh:mm A'
    },
    ranges: {
      "All Day": ["12:00 AM","11:59 PM"],
      "Morning":["06:00 AM","11:59 AM"],
      "Afternoon":["12:00 PM","05:59 PM"],
      "Evening":["06:00 PM","11:59 PM"],
      "Late Night":["12:00 AM","05:59 AM"]
    },
    startDate: "12:00 AM", endDate: "11:59 PM",
    minDate: "12:00 AM", maxDate: "11:59 PM",
    },
    function(_start_time, _end_time){
      var start_time, end_time;
      start_time = new Date(_start_time);
      end_time = new Date(_end_time);
      start_time = getHourMin(parseTime(start_time.getHours()+
                ":"+start_time.getMinutes()));
      end_time = getHourMin(parseTime(end_time.getHours()+
                ":"+end_time.getMinutes()));
      updateTime(start_time, end_time);
      map_vis.map.spin(true);
      $(event_handler).trigger('timeChanged');
    });
  });
/*-------------------------- END EVENT HANDLERS ----------------------------*/  
  spinner.stop();
}; 
/*-------------------------- END PUBLIC METHODS ----------------------------*/
/*-------------------------- BEGIN DATA LOAD -------------------------------*/

var target = document.getElementById('map');
var spinner = new Spinner().spin(target);

  function loadData(){

    queue()
    .defer(d3.json, '../data/sf-neighborhoods.min.json')
    .defer(d3.json, '../data/population.json')
    .defer(d3.json, '../data/districts.json')
    .defer(d3.json, '../data/center.json')
    .defer(d3.json, '../data/assault_15.min.json')
    .defer(d3.json, '../data/burglary_15.min.json')
    .defer(d3.json, '../data/drug_15.min.json')
    .defer(d3.json, '../data/homicide_15.min.json')
    .defer(d3.json, '../data/robbery_15.min.json')
    .defer(d3.json, '../data/sexOffense_15.min.json')
    .defer(d3.json, '../data/weaponLaw_15.min.json')
    .await(initModule);
  }

  loadData();
});
/*-------------------------- END DATA LOAD ---------------------------------*/