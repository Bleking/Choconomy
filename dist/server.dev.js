"use strict";

var express = require('express'); // const moment = require('moment');


var app = express();

var server = require('http').Server(app);

var io = require('socket.io')(server);

var players = {};
var avatars = [{
  name: 'AVA1',
  src: './assets/ava/AVA1.png'
}, {
  name: 'AVA2',
  src: './assets/ava/AVA2.png'
}, {
  name: 'AVA3',
  src: './assets/ava/AVA3.png'
}, {
  name: 'AVA4',
  src: './assets/ava/AVA4.png'
}, {
  name: 'AVA5',
  src: './assets/ava/AVA5.png'
}, {
  name: 'AVA6',
  src: './assets/ava/AVA6.png'
}, {
  name: 'AVA7',
  src: './assets/ava/AVA7.png'
}, {
  name: 'AVA8',
  src: './assets/ava/AVA8.png'
}, {
  name: 'AVA9',
  src: './assets/ava/AVA9.png'
}, {
  name: 'AVA10',
  src: './assets/ava/AVA10.png'
}];
app.use(express["static"](__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/main.html');
});
io.on('connection', function (socket) {
  console.log("user connected: ".concat(socket.id));
  var randomIndex = Math.floor(Math.random() * avatars.length);
  var avatar = avatars[randomIndex];
  players[socket.id] = {
    x: 500,
    y: 500,
    playerId: socket.id,
    avatar: avatar.name
  }; // 아바타 사용 완료 후 해당 아바타는 배열 avatars에서 제거

  avatars.splice(randomIndex, 1);
  socket.emit('currentPlayers', players);
  socket.broadcast.emit('newPlayer', players[socket.id]);
  socket.on('disconnect', function () {
    console.log('user disconnected');
    delete players[socket.id];
    io.emit('gamedisconnect', socket.id);
  }); // 플레이어 움직임

  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    checkDistance(); // 다른 플레이어들에게도 내 플레이어 움직였다는 정보 업뎃

    socket.broadcast.emit('playerMoved', players[socket.id]);
  }); // socket.on("chatting",(data)=>{  //클라이언트로 보내기
  //   const{name, msg} = data; //프론트에서 넘겨받은 데이터
  //   io.emit("chatting",{
  //       name,// name: name,
  //       msg,// msg: msg, //넘겨 줄때의 이름 : 넘겨 받은 이름
  //       time : moment(new Date()).format("h:mm A"),
  //   })   
  // })
});

function checkDistance() {
  var distanceThreshold = 64; // 필요에 따라 이 값을 조정하세요.

  var playerIds = Object.keys(players);

  for (var i = 0; i < playerIds.length; i++) {
    for (var j = i + 1; j < playerIds.length; j++) {
      var player1 = players[playerIds[i]];
      var player2 = players[playerIds[j]];
      var distance = Math.sqrt(Math.pow(player1.x - player2.x, 2) + Math.pow(player1.y - player2.y, 2));

      if (distance <= distanceThreshold) {
        // 두 플레이어가 충분히 가까우면 이벤트를 발생시킴
        io.emit('event', {
          players: [player1, player2]
        });
        return;
      }
    }
  }
}

;
server.listen(3000, function () {
  console.log("Listening on ".concat(server.address().port));
});