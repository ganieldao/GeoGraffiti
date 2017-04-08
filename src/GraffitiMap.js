var map;
var canvasLayer;
var colorLayer;
var context;
var colorLayerContext;

var rectLatLng = new google.maps.LatLng(40, -95);
var rectWidth = 6.5;

var currentColor = '#000'; // default black

var resolutionScale = window.devicePixelRatio || 1;

var gridSize = 0.0001;

var pixels = [];

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
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);
            map.setZoom(19);
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


function click (e) {
    console.log("click");
    console.log(e);
    var x;
    var y;
    x = e.ca.x; //Get canvas x of click
    y = e.ca.y; //Get canvas y of click
    drawPixel(x, y);
    //Probably should do hash to overwrite pixels with same coordinates
    pixels.push([x, y]); //Save pixel in array
}

//For drawing the pixel on the canvas
function drawPixel(x, y) {
    var startX;
    var startY;
    
    console.log(x, y);
    // Determine which pixel representation we're on.
    console.log(x/gridSize, y/gridSize);
    startX = Math.floor(x / gridSize) * gridSize;
    startY = Math.floor(y / gridSize) * gridSize;
    //startX = startX.toFixed(4);
    //startY = startY.toFixed(4);
    console.log(startX, startY);
    
    // Fill the square with the selected color
    context.fillStyle = currentColor;
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
    
    var colorWidth = canvasWidth / 8;
    
    colorLayerContext.fillRect(0, canvasHeight - colorWidth, colorWidth, colorWidth);
    
    for (var i = 0; i < pixels.length; i++) {
        //console.log(pixels[i][0], pixels[i][1]);
        drawPixel(pixels[i][0], pixels[i][1]);
    }
}

document.addEventListener('DOMContentLoaded', init, false);