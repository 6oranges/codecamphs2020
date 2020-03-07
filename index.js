var port = process.env.PORT || 3000;
var express = require('express');
var app = express();
var cors = require('cors');

app.use(cors());
app.use(express.static('public'));

var http = require('http').createServer(app);

var io = require('socket.io')(http);

io.on('connection', function (socket) {

})

http.listen(port, function () {
    console.log("Started on port: " + port);
})