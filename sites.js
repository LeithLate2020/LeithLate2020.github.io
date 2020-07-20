"use strict";

/////////////////////////////////////////////////////////////////////////////
// Name of the top-level folder which contains the subfolders of content for each site
var contentFolder = 'content';

// Name of the top-level file which contains the GeoJSON data for the murals
var muralDataFile = 'murals.json';

// Melisa's custom icons -- converted to PNG because SVG doesn't work
var muralIconFile = 'icons/triangle-15.png';
var muralPastIconFile = 'icons/triangle-stroked-15.png';
var studioIconFile = 'icons/cemetery-JP-15.png';

/////////////////////////////////////////////////////////////////////////////
// Mapbox configuration

// This is Melisa's map -- CHANGEME
// mapboxgl.accessToken = 'pk.eyJ1IjoibWVsaXNhcGF6IiwiYSI6ImNrOXdqdWRtdDA5aTkzZ3VoYXhramNyZjgifQ.V3kNFUghK_8qlcj5ac_WPQ';

// This is the map from leithlatetours@gmail.com
mapboxgl.accessToken =
'pk.eyJ1IjoibGVpdGhsYXRlIiwiYSI6ImNrY20xZGY0NzJheDUyem54M3h4c2h6MncifQ.8T4JjPlNUOfwVvpXVTyVIw';

var map = new mapboxgl.Map({
    container: 'mapcontainer',
    style: 'mapbox://styles/mapbox/light-v10', // stylesheet location
    center: [-3.164, 55.968], // starting position [lng, lat]
    zoom: 14, // starting zoom
});

/////////////////////////////////////////////////////////////////////////////
// An array of strings with the file path to the content for each site
var siteContentPath = [];
// An array of jQuery objects with the sidebar HTML content for each site
var siteContent = [];
// An array of jQuery objects with the initial HTML image content for each site
var siteImage = [];

/////////////////////////////////////////////////////////////////////////////
// Prepare content for each mural on the map
muralData.features.forEach(function(mural, index){
  // Build up complete sidebar content in siteHTML
  let siteHTML;
  let imageHTML;
  let contentPath = contentFolder + "/" + mural.properties.folder + "/";

  // Assign an ID to each mural
  mural.properties.id = index;

  // Build the HTML raw for jQuery performance reasons
  siteHTML = "<div id='sitename'>" + mural.properties.name + "</div>\n";
  siteHTML += "<div id='artist'>" + mural.properties.artist + "</div>\n";
  if (mural.properties.year) {
    siteHTML += "<div id='year'>" + mural.properties.year + "</div>\n";
  }
  siteHTML += "<div id='description'>" + mural.properties.description + "</div>\n";

  // There can be a variable number of audio clips
  siteHTML += "<div id='audio'>";
  if (mural.properties.audio) {
    mural.properties.audio.forEach(function(clip) {
      siteHTML += "<div class='audioclip'>\n";
      siteHTML += clip.label;
      // Use native player
      siteHTML += "<div class='audioplayer'><audio controls>";
      siteHTML += "<source src='" + contentPath + clip.file;
      siteHTML += "' type='audio/mpeg'>Your browser does not support the audio element.</audio>";
      siteHTML += "</div>\n";
      // Each clip should have a transcript in PDF
      siteHTML += "<div class='transcript'>";
      siteHTML += "[<a href='" + contentPath + clip.transcript;
      siteHTML += "'>transcript</a>]</div>\n";
      siteHTML += "</div>\n";
    })
  };
  siteHTML += "</div>\n";

//  imageHTML = "<a href='" + contentPath + "fullsize.jpg' target='_blank'>";
  imageHTML = "<img src='" + contentPath + "feature.jpg' id='featureimage' alt='";
  imageHTML += "Image of " + mural.properties.name;
  imageHTML += "'>";
//  imageHTML += "'></a>";

  siteContentPath[index] = contentPath;
  siteContent[index] = siteHTML;
  siteImage[index] = imageHTML;

});

// Prepare content for each studio on the map
// TODO

/////////////////////////////////////////////////////////////////////////////
// Open site content by displaying the respective blocks
function openContent(siteId) {
  $("#sidebar").css("display","block");
  $("#content").css("display","flex");
  $("#overlay").css("display","block");
  $("#close").css("display","block");

  // Fill content panels with prebuilt content
  $("#sidebar").html(siteContent[siteId]);
  $("#content").html(siteImage[siteId]);
};

// Close site content by hiding the respective blocks
function closeContent() {
  $("#sidebar").css("display","none");
  $("#content").css("display","none");
  $("#overlay").css("display","none");
  $("#close").css("display","none");
}

/////////////////////////////////////////////////////////////////////////////
// Begin once map assets are loaded
map.on('load', function (e) {

  // Load icons
  map.loadImage(muralIconFile, function(error, image) {
    if (error) throw error;
    map.addImage('mural', image);
  });
  map.loadImage(muralPastIconFile, function(error, image) {
    if (error) throw error;
    map.addImage('muralpast', image);
  });
  map.loadImage(studioIconFile, function(error, image) {
    if (error) throw error;
    map.addImage('studio', image);
  });

  // Add the data to the map as a symbol layer
  map.addLayer({
    "id": "murals",
    "type": "symbol",
    // Add a GeoJSON source containing place coordinates and information
    "source": {
      "type": "geojson",
      "data": muralData,
    },
    'layout': {
      'icon-image': '{icon}',
      'icon-size': 0.25,
      'icon-allow-overlap': false,
      'text-field': '{name}',
      'text-size' : 14,
      'text-anchor': 'top',
      'text-offset': [0,0.7],
    }
  });

  // When user clicks on a map feature, open the content
  map.on('click', 'murals', function(e) {
    let siteId = e.features[0].properties.id;
    openContent(siteId);

    // When user clicks on close div or background, close the content
    $("#close").click(function() { closeContent(); });
    $("#content").click(function() { closeContent(); });

    // When user clicks on feature image, open fullsize version in another tab
    // This could be cleanly done in the HTML but for some reason
    // div > a > img is a nightmare to style under flexbox.
    // div > img works fine.
    $("#featureimage").click(function(e) {
      window.open(siteContentPath[siteId] + "fullsize.jpg","_blank");
      // We don't want this click to also close the content window
      e.stopPropagation();
    });
  });

  // Change the cursor to a pointer when the mouse is over the murals layer.
  map.on('mouseenter', 'murals', function() {
    map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back from a pointer when it leaves.
  map.on('mouseleave', 'murals', function() {
    map.getCanvas().style.cursor = '';
  });
});



//    var coordinates = e.features[0].geometry.coordinates.slice();
//    var description = e.features[0].properties.description;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
//    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
//      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
//    }
