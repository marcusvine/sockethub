'use strict';

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

var userCount=0;
var chanels=[];


io.on('connection', (socket) => {
  console.log('Client connected');
  userCount++;
  var current_chanel=false;
	var user=null;




  socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => io.emit('hb','hb'),1800);
