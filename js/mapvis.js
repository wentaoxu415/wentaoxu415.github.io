

MapVis = function(_parentElement, _data){
	this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.initVis();
}

MapVis.prototype.initVis = function(){
	// var that = this;
	// this.svg = this.parentElement.selectAll("svg")

	var map = L.map('map').setView([37.751006, -122.445024], 12);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'wentaoxu.cien3mu2z05evrskmbwjttxv8',
    accessToken: 'pk.eyJ1Ijoid2VudGFveHUiLCJhIjoiY2llbjNtdW13MDVmMHJza20wY3B0ZnFoaCJ9.bCIlhzQz6O58tT9s0_z2Mw'
})
    .addTo(map);

    var svg = d3.select(map.getPanes().overlayPane).append("svg");
    var g = svg.append("g").attr("class", "leaflet-zoom-hide");

    
}


