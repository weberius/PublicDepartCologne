var map, featureList, stopSearch = [];
var locationLat, locationLng;


$(window).resize(function() {
  sizeLayerControl();
});

$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  sidebarClick(parseInt($(this).attr("id"), 10));
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

function sidebarClick(id) {
  var layer = markerClusters.getLayer(id);
  map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function syncSidebar() {
  /* Empty sidebar features */
  $("#feature-list tbody").empty();
  /* Loop through stops layer and add only features which are in the map bounds */
  stops.eachLayer(function (layer) {
    if (map.hasLayer(stopLayer)) {
      if (map.getBounds().contains(layer.getLatLng())) {
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="16" src="assets/img/' + layer.feature.properties.typ + '.png"></td><td class="feature-name">' + layer.feature.properties.name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });
  /* Update list.js featureList */
  featureList = new List("features", {
    valueNames: ["feature-name"]
  });
  featureList.sort("feature-name", {
    order: "asc"
  });
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
          $("#feature-title").html(feature.properties.name);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));

          var routingUrl = "https://tom.cologne.codefor.de/publicTransportDepartureTimeCologne/service/stop/" + feature.id + "/?fromTo=" + locationLat + "," + locationLng + ","+feature.geometry.coordinates[1]+","+feature.geometry.coordinates[0];
          $.getJSON(routingUrl, function(data) {
        	  console.log(data);

	          var html = "";
	          html += '<h3>';
	          html += data.distanceToDestination + " m oder ca. " + data.timeToDestination + " Min. zu Fu&szlig; zur Haltestelle.";
	          html += '</h3>';

	          var arr = $.map(data.timetableList, function(el) { return el });
	          if (data.timetableList.length == 0) {
	        	  html += '<div id="information">Es liegen keine Abfahrtsinformationen vor.</div>'
	          } else {
		          html += '<table class="table table-striped table-bordered table-condensed"><thead></thead><tbody>';
		          html += '<tr>';
		          html += '<th>Linie</th>';
		          html += '<th>Richtung</th>';
		          html += '<th>Abfahrt in</th>';
		          html += '<th>ist erreichbar in</th>';
		          html += '</tr>';
		          for (var i = 0, len = arr.length; i < len; ++i) {
		              html += '<tr>';
		              html += '<th>' + arr[i].route + '</th>';
		              html += '<td>' + arr[i].destination + '</td>';
	                  html += '<td>' + arr[i].time + ' Min.</td>';
	                  html += '<td>' + arr[i].leave + ' Min.</td>';
		              html += "</tr>";
		          }
		          html += '</tbody><tfoot></tfoot></table>';
	          }
	          
	          $("#information").html(html);
          });
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/' + layer.feature.properties.typ + '.png"></td><td class="feature-name">' + layer.feature.properties.name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      stopSearch.push({
        name: layer.feature.properties.name,
        address: layer.feature.properties.ADRESS1,
        source: "Stops",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
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
          $("#feature-title").html(feature.properties.name);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
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

map.locate({setView: true, maxZoom: 15});

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
    syncSidebar();
  }
  if (e.layer === bikesLayer) {
	markerClusters.addLayer(bikes);
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === stopLayer) {
    markerClusters.removeLayer(stops);
    syncSidebar();
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

    syncSidebar();
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

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

$("#featureModal").on("hidden.bs.modal", function (e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  sizeLayerControl();
  /* Fit map to boroughs bounds */
  map.fitBounds(stops.getBounds());
  featureList = new List("features", {valueNames: ["feature-name"]});
  featureList.sort("feature-name", {order:"asc"});

  var stopsBH = new Bloodhound({
    name: "Stops",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: stopSearch,
    limit: 10
  });

  stopsBH.initialize();

  /* instantiate the typeahead UI */
  $("#searchbox").typeahead({
    minLength: 3,
    highlight: true,
    hint: false
  }, {
    name: "Stops",
    displayKey: "name",
    source: stopsBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/Stadtbahn.png' width='32' height='32'>&nbsp;Haltestellen</h4>",
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{address}}</small>"].join(""))
    }
  }).on("typeahead:selected", function (obj, datum) {
    if (datum.source === "Stops") {
      if (!map.hasLayer(stopLayer)) {
        map.addLayer(stopLayer);
      }
      map.setView([datum.lat, datum.lng], 17);
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    if ($(".navbar-collapse").height() > 50) {
      $(".navbar-collapse").collapse("hide");
    }
  }).on("typeahead:opened", function () {
    $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
    $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
  }).on("typeahead:closed", function () {
    $(".navbar-collapse.in").css("max-height", "");
    $(".navbar-collapse.in").css("height", "");
  });
  $(".twitter-typeahead").css("position", "static");
  $(".twitter-typeahead").css("display", "block");
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
