

shell = (function(){
	//-------------------- BEGIN MODULE SCOPE VARIABLES ------------------------ 
	var configMap = {
		anchor_schema_map : {
			crimeTypes : {homicide: true, sexOffense: false}
		}
	},
	stateMap = {
		$container : null,
		anchor_map : {},
	},
	jqueryMap = {},
	copyAnchorMap, setJqueryMap, onHashchange,
	onClickSwitches, initModule;
  //-------------------- END MODULE SCOPE VARIABLES --------------------------
  
  //-------------------- BEGIN UTILITY METHODS -------------------------------
  copyAnchorMap = function(){
    return $.extend( true, {}, stateMap.anchor_map );
  };
  //-------------------- END UTILITY METHODS ---------------------------------
  
  //-------------------- BEGIN DOM METHODS -----------------------------------
  // Begin DOM method /changeAnchorPart/
  // Purpose: Change part of the URI anchor component
  // Arguments: 
  //  * arg_map - The map describing what part of the URI anchor we want 
  //  changed
  // Returns: boolean
  //  * true - the Anchor portion of the URI was updated
  //  * false - the Anchor portion of the URI could not be updated
  // Actions:
  // The current anchor map stored in stateMap.anchor_map.
  // This method 
  //  * Creates a copy of this map using copyAnchorMap()
  //  * Modifies the key-values using arg_map.
  //  * Manages the distinction between independent and dependent values in
  //  the encoding
  //  * Attempts to change the URI using urAnchor
  //  * Returns true on successs and false o failure.

  changeAnchorPart = function(arg_map){
    var 
    anchor_map_revise = copyAnchorMap(),
    bool_return = true,
    key_name, key_name_dep;

    KEYVAL:
    // Begin merge chages into anchor map
    for (key_name in arg_map){
      if (arg_map.hasOwnProperty(key_name)){
        
        // skip dependent keys during iteration 
        if (key_name.indexOf('_') === 0){ continue KEYVAL; }

        // update independent key value 
        anchor_map_revise[key_name] = arg_map[key_name];

        // update matching dependent key
        key_name_dep = '_' + key_name;
        if (arg_map[key_name_dep]){
          anchor_map_revise[key_name_dep] = arg_map[key_name_dep]
        }
        else{
          delete anchor_map_revise[key_name_dep];
          delete anchor_map_revise['_s' + key_name_dep];
        }
      }
    }
    // End merge changes into anchor map

    // Begin attempt to update URI; revert if not successful
    try {
      $.uriAnchor.setAnchor(anchor_map_revise)
    }
    catch(error){
      //replace URI with existing state
      $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
      bool_return = false;
    }
    // End attempt to update URI
    return bool_return;
  };
  // END DOM method /changeAnchorPart/
  //-------------------- END DOM METHODS -------------------------------------

  //-------------------- BEGIN EVENT HANDLERS --------------------------------
  // Begin Event handler /onHashChange/
  // Purpose: Handles the hashchange event 
  // Arguments:
  //  * event - jQuery event object
  // Returns: false
  // Actions:
  //  * Parses the URI anchor component
  //  * ompares proposed application state with current
  //  * Adjust the application only where proposed state differs from existing
  onHashchange = function(event){
    var 
    anchor_map_previous = copyAnchorMap(),
    anchor_map_proposed,
    _s_data_previous, _s_data_proposed,
    s_data_proposed;

    // attempt to parse anchor
    try {anchor_map_proposed = $.uri.Anchor.makeAnchorMap();}
    catch(error){
      $.uriAnchor.setAnchor( anchor_map_previous, null, true);
      return false;
    }
    stateMap.anchor_map = anchor_map_proposed;

    // convenience vars 
    _s_data_previous = anchor_map_previous._s_data;
    _s_data_proposed = anchor_map_proposed._s_data;

    // Begin adjusting data if changed; 
    if (! anchor_map_previous || _s_data_previous !== _s_data_proposed){
      s_data_proposed = anchor_map_proposed.data;
      console.log("Update the data here");
    }
    // End adjusting data if changed;
    return false;
  };
  // End Event handler /onHashChange/
  //-------------------- END EVENT HANDLERS ----------------------------------

  //-------------------- BEGIN PUBLIC METHODS --------------------------------  
  initModule = function($container){
    // Configure uriAnchor to use our schema
    $.uriAnchor.configModule({
      schema_map : configMap.anchor_schema_map
    });

    // Handle URI anchor change events.
    $(window)
      .bind('hashchange', onHashChange)
      .trigger('hashchange'); 
  };
  // End PUBLIC method /initModule/
  console.log("Shell");
  return { initModule: initModule};
  //-------------------- END PUBLIC METHODS ---------------------------------- 
}());