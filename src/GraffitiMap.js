var map;
var canvasLayer;
var context;

var rectLatLng = new google.maps.LatLng(40, -95);
var rectWidth = 6.5;

var currentColor = '#000'; // default black

var resolutionScale = window.devicePixelRatio || 1;

function init() {
    // initialize the map
    var mapOptions = {
        zoom: 4,
        center: new google.maps.LatLng(39.3, -95.8),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
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
    context = canvasLayer.canvas.getContext('2d');
}

function click (e) {
    console.log("click");
    console.log(e);
    var x;
    var y;
    var startX;
    var startY;

    // Get the relative position (offset)
    x = e.ca.x; // column or x-axis
    y = e.ca.y; // row or y-axis
    console.log(x, y);
    // Determine which pixel representation we're on. For example,
    // if the (x, y) coordinates are (8, 8), then we want to color
    // in the square starting from (1, 1) through (9, 9) while leaving
    // the border the existing grid colors of grey and red.
    startX = Math.floor(x / 10) * 10 + 1;
    startY = Math.floor(y / 10) * 10 + 1;

    // Fill the square with the selected color
    context.fillStyle = currentColor;
    context.fillRect(startX, startY, 3, 3);
    //context.fillRect(x, y, 3, 3);

    // Update the live render and the css code output
    //x = getScaledCoordinate(startX);
    //y = getScaledCoordinate(startY);
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
    context.fillRect(worldPoint.x, worldPoint.y, rectWidth, rectWidth);
}

document.addEventListener('DOMContentLoaded', init, false);