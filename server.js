
var static = require('node-static');
var file = new static.Server('./UI');

//vars
var userCount=0;
var chanels=[];

//Define
var server = require('http').createServer(function(request, response) {
    request.addListener('end', function() {
        file.serve(request, response);
    }).resume();
});
var io =require('socket.io')(server);
server.listen(process.env.PORT || 9999);
console.log("Server Started");
//connection
io.on('connection',function(socket){
	userCount++; // user+
	sysinfo();
	var current_chanel=false;
	var user=null;
	//join chanel
	socket.on('join',function(data){
		if(!chanels[data.chanel_id]){
			//new chanel
			chanels[data.chanel_id]={
				 users: []
			}
		}
		user ={
			id: chanels[data.chanel_id].users.length + 1,
            name: data.name,
            socket_id: socket.id
		}
		chanels[data.chanel_id].users.push(user); //add user
		socket.join(data.chanel_id); //join socket
		current_chanel = data.chanel_id; //add to current
		io.to(current_chanel).emit('user_joined',user);
		sysinfo(); //update to all
	});

	//on data  relay to chanel
	socket.on('data',function(data){
		io.to(current_chanel).emit('data',data);
	});


	//on disconnect
	socket.on('disconnect', function () {
		userCount--; //user -
		sysinfo();
		if(current_chanel){
			socket.leave(current_chanel);
			io.to(current_chanel).emit('user_left',user);
			chanelCleanup(current_chanel,user);
		}
	});
});

//////////////////////PUBLIC FUNCTION////////////////
var sysinfo = function(){
	io.sockets.emit('sysinfo',{userCount:userCount,chanelCount:Object.keys(chanels).length});
}

var chanelCleanup = function(chanel_id,user){
	//remove user from array
	chanels[chanel_id].users.splice((user.id-1),1); //remove current user from chanel user array
}
