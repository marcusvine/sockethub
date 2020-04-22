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
var production = false;

io.on('connection', (socket) => {
  //console.log('Client connected');
  userCount++;
  var current_node=false;
	var user=null;

  sysinfo();


    if(!nodes["holland"]){
      //console.log("create node");
      nodes["holland"]={
				 users: [],
         datapro:false, //data processor
         debug:false   //for admin to see all data which is incoming
			}
    }
    // make user
    var clientIp = socket.request.connection.remoteAddress;
    user ={
      id: nodes["holland"].users.length + 1,
      name: clientIp,
      socket_id: socket.id
		}
    nodes["holland"].users.push(user); //add user
		socket.join("holland"); //join socket + room join
		current_node = "holland"; //add to current
    sysinfo();
      ////console.log(nodes);
      // send event conformation to user too
      io.to(socket.id).emit('result',{type:"status",msg:"you have joined "+current_node,sid:socket.id});
      // if the debugger is there send him too
      if(nodes[current_node].debug){
        io.to(nodes[current_node].debug).emit('data',{type:'status',msg:clientIp+' has joined the node'});
      }


  socket.on('data',function(data){
    //console.log(data);

        if(nodes[current_node].datapro){
          //data processor alive
            data.sid = socket.id;
            io.to(nodes[current_node].datapro).emit('data',dtobj);



        }else{
          // return erro saying no datapro
          io.to(socket.id).emit('error',{msg:"NDP"}); // unauth
        }

        //debug for admin
        if(nodes[current_node].debug){
          io.to(nodes[current_node].debug).emit('data',data);
        }


	});

  socket.on('result',function(obj){
    //console.log('result');
    //console.log(obj);
      io.to(obj.sid).emit('result',JSON.stringify(obj.data));
      if(nodes[current_node].debug){
        io.to(nodes[current_node].debug).emit('data',obj.data);
      }
  });

  socket.on('error',function(obj){
    //console.log('result');
    //console.log(obj);
      io.to(obj.sid).emit('result',JSON.stringify(obj.data));
      if(nodes[current_node].debug){
        io.to(nodes[current_node].debug).emit('error',obj.data);
      }
  });

  socket.on('datapro',function(data){
    // update socketid
    nodes[current_node].datapro = socket.id;
    io.to(socket.id).emit('data',{type:"nodelive"});
  })

  socket.on('debug',function(data){
    nodes[current_node].debug = socket.id
  })






  socket.on('disconnect', () => {
    //console.log('Client disconnected')
    userCount--;
    if(current_node){
			socket.leave(current_node);
      nodes[current_node].users.splice((user.id-1),1); //remove current user from chanel user array
      ////console.log(nodes)
      //is it debug id
      if(nodes[current_node].debug == socket.id){
        nodes[current_node].debug = false;
      }
      // is data processor disconnected
      if(nodes[current_node].datapro == socket.id){
        nodes[current_node].datapro = false;
        update_node(current_node,'status',0); // set that node in active
      }
      //if all users left the chanel delete room
      if(nodes[current_node].users.length == 0){
          delete nodes[current_node];
      }


		}
    sysinfo();
  });
});


var sysinfo = function(){
	io.sockets.emit('sysinfo',{uc:userCount,nc:Object.keys(nodes).length});
}

var update_node = function(node,key,val){
  var get = require('get');
  get('https://reveal-it.net/api/nodes/update/'+node+'/'+key+'/'+val).perform(function(err, response) {
    //console.log(response)
  });
}




//setInterval(() => io.emit('hb','hb'),5000);
