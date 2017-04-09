var map;
var canvasLayer;
var colorLayer;
var context;
var colorLayerContext;
var colorLayerWidth;
var currentPosition;

var godMode = false;

var rectLatLng = new google.maps.LatLng(40, -95);
var rectWidth = 6.5;
var radius = .001
var currentColor = '#000'; // default black

var resolutionScale = window.devicePixelRatio || 1;

var gridSize = 0.0001;

var pixels = [];

var chunks = [];

//Generate 10x10 chunks grid
for(var i = 0; i < 10; i ++) {
    chunks.push([]);
    for(var j = 0; j < 10; j ++) {
        chunks[i].push([]);
    }
}

socket.on('connect', function(data) {
    socket.emit('join', 'Hello World from client');
});

socket.on('broad', function(data) {
    console.log("new update");
    console.log(data);
    //Refresh map
    pixels = data;
    update();
});
// a key map of allowed keys
var allowedKeys = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  65: 'a',
  66: 'b'
};

// the 'official' Konami Code sequence
var konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];

// a variable to remember the 'position' the user has reached so far.
var konamiCodePosition = 0;

document.addEventListener('keydown', function(e) {
  // get the value of the key code from the key map
  var key = allowedKeys[e.keyCode];
  // get the value of the required key from the konami code
  var requiredKey = konamiCode[konamiCodePosition];

  // compare the key with the required key
  if (key == requiredKey) {

    // move to the next key in the konami code sequence
    konamiCodePosition++;

    // if the last key is reached, activate cheats
    if (konamiCodePosition == konamiCode.length) {
        activateCheats();
        konamiCodePosition = 0;
    }
  } else
    konamiCodePosition = 0;
});

function activateCheats() {
    godMode = !godMode;
}

function init() {
    // initialize the map
    var mapOptions = {
        zoom: 4,
        center: new google.maps.LatLng(39.3, -95.8),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        clickableIcons: false,
        disableDefaultUI: true, // a way to quickly hide all controls
    	//mapTypeControl: true,
    	scaleControl: true,
    	zoomControl: true,
        styles: [
            {
              stylers: [{saturation: -85}]
            }, {
              featureType: "water",
              elementType: "geometry",
              stylers: [
                { lightness: -20 }
              ]
            }
          ]
        };
    var mapDiv = document.getElementById('map-div');
    map = new google.maps.Map(mapDiv, mapOptions);
    
    getLocation();
    
    if (navigator.geolocation) {    //Gets geoloaction
        navigator.geolocation.getCurrentPosition(function(position) {
            currentPosition = position;
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setCenter(pos);
            map.setZoom(19);

            var marker = new google.maps.Marker({   //places marker at current location
                animation: google.maps.Animation.DROP,
                position: pos,
            }

            );

            var circle = new google.maps.Circle({   //places circle in area one can edit
                clickable: false,
                //strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                //fillColor: '#FF0000',
                fillOpacity: 0.35,
                map: map,
                center: pos,
                radius: 120
            });

        marker.setMap(map);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
    
    map.addListener('click', click);

    // initialize the canvasLayer
    var canvasLayerOptions = {
        map: map,
        resizeHandler: resize,
        animate: false,
        updateHandler: update,
        resolutionScale: resolutionScale
    };
    canvasLayer = new CanvasLayer(canvasLayerOptions);
    colorLayer = new CanvasLayer(canvasLayerOptions);
    colorLayerContext = colorLayer.canvas.getContext('2d');
    context = canvasLayer.canvas.getContext('2d');
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(showPosition);
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    currentPosition = position;
}

function click (e) {
    console.log("click");
    console.log(e);
    var x;
    var y;
    x = e.ca.x; //Get canvas x of click
    y = e.ca.y; //Get canvas y of click
    
    relx = e.pixel.x;
    rely = e.pixel.y;
    
    //Detect clicks on the color canvas
    console.log(relx, rely, colorLayerWidth, canvasLayer.canvas.height - colorLayerWidth, canvasLayer.canvas.scrollHeight - colorLayerWidth);
    if(relx >= 0 && relx <= colorLayerWidth) {
        if(rely <= canvasLayer.canvas.scrollHeight && rely >= canvasLayer.canvas.scrollHeight - colorLayerWidth) {
            //Handle clicks on color canvas
            if(currentColor == '#000') { // black
                currentColor = '#00F'
            } else if(currentColor == '#00F') { // blue
                currentColor = '#F00'
            } else if(currentColor == '#F00') { // red
                currentColor = '#FFF'
            } else if(currentColor == '#FFF') { // white
                currentColor = '#000'
            }
            update();
            return;
        }
    }
    
    
    checkLocation(x,y, function() {
        //Need to do this if the click is not on the color canvas
        console.log("good location");
        drawPixel(x, y, currentColor);
        console.log(socket);
        socket.emit('newPixel', [x, y, currentColor]);
        //Probably should do hash to overwrite pixels with same coordinates
        //console.log(pixels);
        pixels.push([x, y, currentColor]); //Save pixel in array
    });
}

function checkLocation(x, y, callback) {  //Checks the current location of the user
    if(godMode == true) {
        callback();
    }

    var myLatLng;           
    var currentIndex;           //Stores the longitude and latitude in point form
    var lat;                    //Current Latitude of user
    var longi;                   //Current Longitude of user

    var mapProjection = map.getProjection();    

    lat = currentPosition.coords.latitude;
    longi = currentPosition.coords.longitude;                           //gets the current long/lat

    myLatLng = new google.maps.LatLng(lat,longi);                //Converts the lat/long to Google's data type 
    currentIndex = mapProjection.fromLatLngToPoint(myLatLng);   //Converts to point 

    currentRadius = Math.sqrt(Math.pow(Math.abs(currentIndex.x - x),2) + Math.pow(Math.abs(currentIndex.y - y),2));

    if(currentRadius < radius){
        callback();
    }
    else
    {
        console.log("User is not in the area");
    } 
}

//For drawing the pixel on the canvas
function drawPixel(x, y, color) {
    var startX;
    var startY;
    
    //console.log(x, y);
    // Determine which pixel representation we're on.
    //console.log(x/gridSize, y/gridSize);
    startX = Math.floor(x / gridSize) * gridSize;
    startY = Math.floor(y / gridSize) * gridSize;
    //startX = startX.toFixed(4);
    //startY = startY.toFixed(4);
    //console.log(startX, startY);
    
    // Fill the square with the selected color
    context.fillStyle = color;
    context.fillRect(startX, startY, gridSize * 0.9, gridSize * 0.9);
}

function resize() {
    // nothing to do here
}

function update() {
    // clear previous canvas contents
    var canvasWidth = canvasLayer.canvas.width;
    var canvasHeight = canvasLayer.canvas.height;
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // we like our rectangles hideous
    context.fillStyle = 'rgba(230, 77, 26, 1)';
        
    /* We need to scale and translate the map for current view.
     * see https://developers.google.com/maps/documentation/javascript/maptypes#MapCoordinates
     */
    var mapProjection = map.getProjection();
    /**
     * Clear transformation from last update by setting to identity matrix.
     * Could use context.resetTransform(), but most browsers don't support
     * it yet.
     */
    context.setTransform(1, 0, 0, 1, 0, 0);
        
    // scale is just 2^zoom
    // If canvasLayer is scaled (with resolutionScale), we need to scale by
    // the same amount to account for the larger canvas.
    var scale = Math.pow(2, map.zoom) * resolutionScale;
    context.scale(scale, scale);

    /* If the map was not translated, the topLeft corner would be 0,0 in
     * world coordinates. Our translation is just the vector from the
     * world coordinate of the topLeft corder to 0,0.
     */
    var offset = mapProjection.fromLatLngToPoint(canvasLayer.getTopLeft());
    context.translate(-offset.x, -offset.y);

    // project rectLatLng to world coordinates and draw
    var worldPoint = mapProjection.fromLatLngToPoint(rectLatLng);
    //context.fillRect(worldPoint.x, worldPoint.y, rectWidth, rectWidth);
    
    /*context.fillStyle = "#999"
    for (var i = 0; i < canvasWidth || i < canvasHeight; i += gridSize) {
        context.fillRect(i, 0, 1, canvasHeight);
        context.fillRect(0, i, canvasWidth, 1);
    }*/
    colorLayerWidth = canvasWidth / 8
    //console.log(canvasHeight, colorLayerWidth)
    colorLayerContext.fillStyle = currentColor;
    colorLayerContext.fillRect(0, canvasHeight - colorLayerWidth, colorLayerWidth, colorLayerWidth);
    
    for (var i = 0; i < pixels.length; i++) {
        //console.log(pixels[i][0], pixels[i][1]);
        drawPixel(pixels[i][0], pixels[i][1], pixels[i][2]);
    }
}

document.addEventListener('DOMContentLoaded', init, false);
