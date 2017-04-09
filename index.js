var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use(express.static('public'));

io.on('connection', function(client) {  
    console.log('Client connected...');

    client.on('join', function(data) {
        console.log(data);
    });

    client.on('newPixel', function() {
        console.log("new pixel!");
        io.sockets.emit('broad');
    });
});

server.listen(4200);  