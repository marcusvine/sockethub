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
  socket.on('join',function(data){
    if(!nodes[data.node_id]){
      //console.log("create node");
      nodes[data.node_id]={
				 users: [],
         datapro:false, //data processor
         debug:false   //for admin to see all data which is incoming
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
		current_node = data.node_id; //add to current
    sysinfo();
      ////console.log(nodes);
      // send event conformation to user too
      io.to(socket.id).emit('result',{type:"status",msg:"you have joined"+current_node});
      // if the debugger is there send him too
      if(nodes[current_node].debug){
        io.to(nodes[current_node].debug).emit('data',{type:'status',msg:user.name+' has joined the node'});
      }
  })

  socket.on('data',function(data){
    //console.log(data);
    if(current_node){ // if you have joined the node
        if(nodes[current_node].datapro){
          //data processor alive
          io.to(nodes[current_node].datapro).emit('data',data);
        }else{
          // return erro saying no datapro
          io.to(socket.id).emit('error',{msg:"NDP"}); // unauth

        }

        //debug for admin
        if(nodes[current_node].debug){
          io.to(nodes[current_node].debug).emit('data',data);
        }

    }else{
      // kill on spot - if dont know where to go i wont let you walk
      io.to(socket.id).emit('error',{msg:"E401"}); // unauth
      socket.disconnect();
    }
	});

  socket.on('result',function(obj){
    //console.log('result');
    //console.log(obj);
      io.to(obj.sid).emit('result',obj.data);
      if(nodes[current_node].debug){
        io.to(nodes[current_node].debug).emit('data',obj.data);
      }
  });

  socket.on('datapro',function(data){
    // update socketid
    nodes[current_node].datapro = socket.id;
    io.to(socket.id).emit('data',{type:"nodelive"}); // unauth
  })

  socket.on('debug',function(data){
    nodes[current_node].debug = socket.id
  })

 //check user has joined or not
  // if not dis connect
  // wait for  20 sec
 setTimeout(function(){
    if(!current_node){
      socket.disconnect();
      //console.log('inactive client');
    }else {
      //console.log('Active client :)');
    }
  }, 20000);




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
