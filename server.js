var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

var pixelData = [];

app.use(express.static('public'));

io.on('connection', function(client) {  
    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
    });

    client.on('newPixel', function(data) {
        console.log("new pixel!");
        pixelData.push(data);
        io.sockets.emit('broad', pixelData);
    });
});
var port = process.env.PORT || 3000;
console.log(port);
server.listen(port);  