

socket = io.connect('http://localhost:3000');

socket.emit('connected', "Hi");