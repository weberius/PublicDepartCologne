var map, featureList, stopSearch = [];
var locationLat, locationLng;


$(window).resize(function() {
  sizeLayerControl();
});

$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
});

if ( !("ontouchstart" in window) ) {
  $(document).on("mouseover", ".feature-row", function(e) {
    highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
  });
}

$(document).on("mouseout", ".feature-row", clearHighlight);

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#legend-btn").click(function() {
  $("#legendModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(stops.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#list-btn").click(function() {
  animateSidebar();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  animateSidebar();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  animateSidebar();
  return false;
});

function animateSidebar() {
  $("#sidebar").animate({
    width: "toggle"
  }, 350, function() {
    map.invalidateSize();
  });
}

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

function clearHighlight() {
  highlight.clearLayers();
}

/* Basemap Layers */
var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, '
	  + '&copy; <a href="https://cartodb.com/attributions">CartoDB</a>, '
	  + '<a href="https://www.offenedaten-koeln.de">Offene Daten Köln</a>, '
	  + '<a href="https://github.com/bmcbride/bootleaf">bryanmcbride.com</a>'
});

/* Overlay Layers */
var highlight = L.geoJson(null);
var highlightStyle = {
  stroke: false,
  fillColor: "#00FFFF",
  fillOpacity: 0.7,
  radius: 10
};

/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 13
});


/* Empty layer placeholder to add to layer control for listening when to add/remove stops to markerClusters layer */
var stopLayer = L.geoJson(null);
var stops = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/" + feature.properties.typ + ".png",
        iconSize: [20, 20],
        iconAnchor: [0, 0],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.name,
      riseOnHover: true
    }).bindTooltip(feature.properties.name, {
    			permanent: map.getZoom() > 14, 
    			direction: 'top', 
    			offset: [10, 0]
    		}).openTooltip();
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      layer.on({
        click: function (e) {
          $("#stopsTitle").html(feature.properties.name);
          $("#stopsModal").modal("show");

          var routingUrl = "https://tom.cologne.codefor.de/publicTransportDepartureTimeCologne/service/stop/" + feature.id + "/?fromTo=" + locationLat + "," + locationLng + ","+feature.geometry.coordinates[1]+","+feature.geometry.coordinates[0];

          $.getJSON(routingUrl, function(publicTransportDepartureTimeCologne) {

        	  var distanceToDestination =  '<div id="distanceToDestination">' 
        		  + publicTransportDepartureTimeCologne.distanceToDestination + ' m oder ' 
        		  + publicTransportDepartureTimeCologne.timeToDestination + ' min '
        		  + 'zu Fuss zur Haltestelle ('
        		  + publicTransportDepartureTimeCologne.lastcall
        		  + ')'
        		  + '</div>';

        	  $("#distanceToDestination").replaceWith(distanceToDestination);
        	  $("#distanceToDestination").insertAfter($("#feature-title"));

              var departuretable = $('#departuretable').DataTable();
              departuretable.destroy();
              $('#departuretable').empty(); // empty in case the columns change

	          departuretable = $('#departuretable').DataTable({
	        	  "data": publicTransportDepartureTimeCologne.data,
	        	  "retrieve": true,
	        	  "destroy":  true,
	        	  "paging":   false,
	        	  "ordering": false,
	        	  "info":     false,
				"columns" : [ {
					"data" : "route",
					"bSearchable": true
				}, {
					"data" : "destination",
					"bSearchable": true
				}, {
					"data" : "time",
					"bSearchable": false
				}, {
					"data" : "leave",
					"bSearchable": false
				} ]
			  });
			  $('#departuretable tbody').on('click', 'tr', function() {
				  	var tabledata = departuretable.row(this).data();
				  	departuretable.search(tabledata.destination).draw();
				  	console.log('departuretable tr touched ' + JSON.stringify(tabledata));
			  });
          });
        }
      });
    }
  }
});

var bikesLayer = L.geoJson(null);
var bikes = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/Fahrrad.png",
        iconSize: [20, 20],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.name,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<div id='information'>Daten werden geladen ...</div>" ;
      layer.on({
        click: function (e) {
          $("#bikesTitle").html(feature.properties.name);
          $("#bikesInfo").html(content);
          $("#bikesModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));

          var routingUrl = "https://tom.cologne.codefor.de/publicTransportDepartureTimeCologne/service/bike/" + feature.properties.number + "?fromTo=" + locationLat + "," + locationLng + ","+feature.geometry.coordinates[1]+","+feature.geometry.coordinates[0];
          $.getJSON(routingUrl, function(data) {
        	  console.log(data);

	          var html = "";
	          html += '<h3>';
	          html += data.distanceToDestination + " m oder ca. " + data.timeToDestination + " Min. zu Fu&szlig; zum Fahrrad.";
	          html += '</h3>';
	          html += '<p>';
	          html += 'Bitte beachten Sie: das Rad kann, wenn Sie den Punkt erreichen, bereits ausgeliehen sein.';
	          html += '</p>';

	          $("#information").html(html);
          });
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/Fahrrad.png"></td><td class="feature-name">' + layer.feature.properties.name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
    }
  }
});

map = L.map("map", {
  zoom: 15,
  minZoom: 14,
  center: [50.94135, 6.95819],
  layers: [cartoLight, markerClusters, highlight],
  zoomControl: false,
  attributionControl: false
});

map.locate({
		setView: true, 
		maxZoom: 15,
		enableHighAccuracy: true
		});

function onLocationFound(e) {
	locationLat = e.latlng.lat;
	locationLng = e.latlng.lng;

    var radius = e.accuracy / 2;
    L.circle(e.latlng, radius).addTo(map);
  
    var stationurl = "https://tom.cologne.codefor.de/publicTransportStation/service/stops?latlng=" + e.latlng.lat +"," + e.latlng.lng + "&geojson";
    $.getJSON(stationurl, function (data) {
      stops.addData(data);
      map.addLayer(stopLayer);
    });
    
}

map.on('locationfound', onLocationFound);

/* Layer control listeners that allow for a single markerClusters layer */
map.on("overlayadd", function(e) {
  if (e.layer === stopLayer) {
    markerClusters.addLayer(stops);
  }
  if (e.layer === bikesLayer) {
	markerClusters.addLayer(bikes);
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === stopLayer) {
    markerClusters.removeLayer(stops);
  }
  if (e.layer === bikesLayer) {
	markerClusters.removeLayer(bikes);
  }
});

/* Filter sidebar feature list to only show features in current map bounds */
map.on("moveend", function (e) {
    // remove layers from markerCluster
	markerClusters.eachLayer(function(layer){
		markerClusters.removeLayer(layer);
	});
	// read values from map
	var north = map.getBounds().getNorth();
	var west = map.getBounds().getWest();
	var south = map.getBounds().getSouth();
	var east = map.getBounds().getEast();
	// for stops
    var stationurl = "https://tom.cologne.codefor.de/publicTransportStation/service/stops?bbox=" + north +"," + west + "," + south +"," + east + "&geojson";
    $.getJSON(stationurl, function (data) {
    	// clear layers
      stops.clearLayers(); 
      // add data
      stops.addData(data);
  	  if (map.hasLayer(stopLayer)) {
	    console.log('map has stopLayer');
	    markerClusters.addLayer(stops);
	  }
    });
    // for bikes
    var bikesurl = "https://tom.cologne.codefor.de/kvbradpositions/service/allbikeslatestposition?bbox=" + north +"," + west + "," + south +"," + east + "&geojson";
    $.getJSON(bikesurl, function (bikeData) {
        // clear layers
    	bikes.clearLayers();
        // add data
        bikes.addData(bikeData);
    	if (map.hasLayer(bikesLayer)) {
    		console.log('map has bikesLayer');
    		markerClusters.addLayer(bikes);
    	}
    });

});

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>Developed by <a href='https://github.com/codeforcologne'>Code for Cologne</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Street Map": cartoLight
};

var groupedOverlays = {
  "Haltestellen": {
    "<img src='assets/img/Stadtbahn.png' width='20' height='20'>&nbsp;Stationen": stopLayer
  },
  "Fahrräder": {
	"<img src='assets/img/Fahrrad.png' width='20' height='20'>&nbsp;Fahrräder": bikesLayer
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

$("#featureModal").on("hidden.bs.modal", function (e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
});

// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {
  L.DomEvent
  .disableClickPropagation(container)
  .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}
