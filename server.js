var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

var pixelData = [];

app.use(express.static('public'));

var http = require('http')
var options = {
    "host": "dangaolicksballz-dev.us-west-2.elasticbeanstalk.com",
    "path": "/api/get_pixels",
    "method": "GET",
    "headers": { 
         "Content-Type" : "application/json"
    }
}

var str = "";
    
var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        str += chunk;
    });
    res.on('end', completion);
    res.on('error', function(err){
      console.log("Error Occurred: "+err.message);
    });
});

function completion(data) {
    //console.log(str);
    var objs = JSON.parse(str);
    for(var i = 0; i < objs.length; i++) {
        var obj = objs[i];
        pixelData.push([obj["x"], obj["y"], obj["rgb"]]);
    }
    
    //console.log(pixelData);
    io.sockets.emit('broad', pixelData);
} 

req.end();

io.on('connection', function(client) {  
    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
        client.emit('broad', pixelData);
    });

    client.on('newPixel', function(data) {
        console.log("new pixel!");
        pixelData.push(data);
        var http = require('http')
        var options = {
          "host": "dangaolicksballz-dev.us-west-2.elasticbeanstalk.com",
          "path": "/api/update_pixel",
          "method": "POST",
          "headers": { 
            "Content-Type" : "application/json"
          }
        }
        
        var jsonData = {};
        jsonData["ID"] = pixelData.length - 1;
        jsonData["x"] = data[0];
        jsonData["y"] = data[1];
        jsonData["rgb"] = data[2];
        var req = http.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log("body: " + chunk);
            });
        });
        console.log(req);
        console.log(JSON.stringify(jsonData));
        req.write(JSON.stringify(jsonData));
        req.end();
        console.log(pixelData);
        io.sockets.emit('broad', pixelData);
    });
});
var port = process.env.PORT || 3000;
console.log(port);
server.listen(port);  