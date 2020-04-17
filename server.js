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
var nodes=[];


io.on('connection', (socket) => {
  console.log('Client connected');
  userCount++;
  var current_chanel=false;
	var user=null;
  sysinfo();
  socket.on('join',function(data){
    if(!nodes[data.node_id]){
      console.log("create node");
      nodes[data.node_id]={
				 users: []
			}
    }
    // make user
    user ={
      id: nodes[data.node_id].users.length + 1,
      name: data.name,
      socket_id: socket.id
		}
    nodes[data.node_id].users.push(user); //add user
		socket.join(data.node_id); //join socket + room join
		current_chanel = data.node_id; //add to current
    sysinfo();
      //console.log(nodes);
  })

  socket.on('data',function(data){
    if(current_chanel){ // if you have joined the node
		    io.to(current_chanel).emit('data',data);
    }
	});





  socket.on('disconnect', () => {
    console.log('Client disconnected')
    userCount--;
    if(current_chanel){
			socket.leave(current_chanel);
      nodes[current_chanel].users.splice((user.id-1),1); //remove current user from chanel user array
      console.log(nodes)
		}
    sysinfo();
  });
});


var sysinfo = function(){
	io.sockets.emit('sysinfo',{uc:userCount,nc:Object.keys(nodes).length});
}


setInterval(() => io.emit('hb','hb'),5000);
