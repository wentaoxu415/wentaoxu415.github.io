$(function(){
/*---------------------------BEGIN MODULE VARIABLES-------------------------*/
  var geographyData, districtData, centerData, populationData, parseTime, getHourMin,
  originalData = {
    assault: null, burglary: null, drug: null, homicide: null, 
    robbery: null, sexOffense: null, weaponLaw: null
    // homicide: null
  },
  stateMap = {
    crimeType: {
      assault: false, burglary: false, drug: false, homicide: true,
      robbery: false, sexOffense: false, weaponLaw: false               
    },
    // crimeType: {
    //   homicide: true,
           
    // },
    startDate: '01/01/2015', endDate: '09/25/2015',
    startTime: '00:00', endTime: '23:59',
    heatMap: true,
    location: 'city',
    barTab: 'crime_stat',
    lineTab: 'crime_type',
    zeroVis: false
  };

/*---------------------------END MODULE VARIABLES---------------------------*/

/*---------------------------BEGIN HELPER METHODS-------------------------*/ 
  
  
  // Parses time in string form and returns the time as Date object
  parseTime = d3.time.format("%H:%M").parse;
  
  // Takes in a Date object and returns military time
  getHourMin = d3.time.format("%H:%M");

  // Updates crime types in stateMap when checkbox is updated
  function updateCrimeType(type, bool){
    stateMap.crimeType[type] = bool;
  }

  // Updates both start and end date in stateMap when date range is updated
  function updateDate(start_date, end_date){
    stateMap.startDate = start_date;
    stateMap.endDate = end_date;
  }

  // Updates both start and end time in stateMap when time range is updated
  function updateTime(start_time, end_time){
    stateMap.startTime = start_time;
    stateMap.endTime = end_time;
  }

  // Updates location in stateMap when a district on the map is selected
  function updateLocation(location){
    stateMap.location = location;
  }

  // Updates bar tab in stateMap when a new bar tab is selected
  function updateBarTab(tab){
    stateMap.barTab = tab;
  }

  // Updates bar tab in stateMap when a new bar tab is selected
  function updateLineTab(tab){
    stateMap.lineTab = tab;
  }

  // Purpose: 
  // * Checks if a given date is within the date range stored in stateMap
  // Arguments:
  // * 1) Date in question
  // Returns:
  // * True if date is in the stateMap's daterange. False otherwise. 
  function isInDateRange(date){
    var start_date, end_date; 
    date =  new Date(date);
    start_date = new Date(stateMap.startDate);
    end_date = new Date(stateMap.endDate);
    if ((date >= start_date) && (date <= end_date)) return true;
    else return false;
  }

  // Purpose: 
  // * Checks if a given time is within the time range stored in stateMap
  // Arguments:
  // * 1) Time in question
  // Returns:
  // * True if time is in the stateMap's timerange. False otherwise. 
  function isInTimeRange(time){
    var start_time, end_time;
    time = getHourMin(parseTime(time))
    start_time = getHourMin(parseTime(stateMap.startTime))
    end_time = getHourMin(parseTime(stateMap.endTime))
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
    for (key in originalData){
      filtered_data[key] = {features : null};
      var result = [];
      originalData[key].features.forEach(function(d, i){
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
    geographyData = geography;
    populationData = population;
    districtData = districts;
    centerData = center;
    originalData['assault'] = assault
    originalData['burglary'] = burglary
    originalData['drug'] = drug
    originalData['homicide'] = homicide;
    originalData['robbery'] = robbery
    originalData['sexOffense'] = sexOffense
    originalData['weaponLaw'] = weaponLaw
  }
 
  map_vis = new MapVis(d3.select("#map"), geographyData, populationData, 
            districtData, centerData, originalData, stateMap, event_handler);
  donut_vis = new DonutVis(d3.select("#donut_vis"), populationData, 
            districtData, originalData, stateMap);
  bar_vis = new BarVis(d3.select("#bar_vis"), populationData, 
            districtData, originalData, stateMap);
  line_vis = new LineVis(d3.select("#line_chart"), populationData, 
            districtData, originalData, stateMap);

  
  /*---------------------------BEGIN EVENT HANDLERS---------------------------*/ 
  $(event_handler).bind("locationChanged", function(event, location){
    updateLocation(location);
    donut_vis.onLocationChange(stateMap);
    bar_vis.onLocationChange(stateMap);
    line_vis.onLocationChange(stateMap);
  })

  $(event_handler).bind('typeChanged', function(event){
    donut_vis.onTypeChange(stateMap);
    bar_vis.onTypeChange(stateMap);
    line_vis.onTypeChange(stateMap);
  })

  $(event_handler).bind('timeChanged', function(event){
    filtered_data = filterData();
    setTimeout(function(){
      map_vis.onTimeChange(filtered_data);},10);
    donut_vis.onTimeChange(stateMap, filtered_data);
    bar_vis.onTimeChange(stateMap, filtered_data);
    line_vis.onTimeChange(stateMap, filtered_data);
  })

  $('a[data-toggle="bar"]').on('click', function (e) {
    updateBarTab(e.target.id);
    bar_vis.onTabChange(stateMap);
  });

  $('a[data-toggle="line"]').on('click', function (e) {
    updateLineTab(e.target.id);
    line_vis.onTabChange(stateMap);
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
      map_vis.onTypeChange(is_checked, crime_type, stateMap);
    }, 10);
    });

  $('#myonoffswitch').click(function(e){
    var is_checked = e.currentTarget.checked;
    stateMap.heatMap = is_checked;
    map_vis.onHeatChange(stateMap);
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
        var start_date, end_date;
        // start_date = _start_date.format('MM/DD/YYYY'), 
        // end_date = _end_date.format('MM/DD/YYYY');
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

var target = document.getElementById('map')
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