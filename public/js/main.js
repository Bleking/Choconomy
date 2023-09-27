
let config = {
  type: Phaser.AUTO,
  parent: 'mainGame',
  width: 1280, //1169
  height: 800, //725
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  } 
};

let keyboard = {
  enabled: true
};


const time_elem = document.getElementById('time');
const health_elem = document.getElementById('health');
const money_elem = document.getElementById('money');
const LoanNumTxt = document.getElementById('user_loan');
const MoneyNumTxt = document.getElementById('user_money');
const BankUsername = document.getElementById('user_name');
const level_elem = document.getElementById('level');
const ability_elem = document.getElementById('ability');
const mp_name = document.getElementById('mypage_name');
const mp_housing = document.getElementById('mypage_housing')
const mp_job = document.getElementById('mypage_job')
const mp_saving = document.getElementById('mypage_saving');
const mp_limit = document.getElementById('mypage_limit');
const mp_loan = document.getElementById('mypage_loan');

let game = new Phaser.Game(config);
let map;
let cursors;
const final = document.getElementById('final')

function preload() {
  this.load.image('labeled', './assets/map/label.png',);
  this.load.image('tileset', './assets/map/new_tileset.png',);
  this.load.tilemapTiledJSON('map',"./assets/map/new.json");
  this.load.spritesheet('AVA1', './assets/ava/AVA1.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA2', './assets/ava/AVA2.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA3', './assets/ava/AVA3.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA4', './assets/ava/AVA4.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA5', './assets/ava/AVA5.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA6', './assets/ava/AVA6.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA7', './assets/ava/AVA7.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA8', './assets/ava/AVA8.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA9', './assets/ava/AVA9.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA10', './assets/ava/AVA10.png', {frameWidth:32, frameHeight:64});
}

function create() {
  let self = this;
  this.socket = io();

  this.otherPlayers = this.physics.add.group(); 
  this.socket.emit('sendData', name);
  console.log(name)
  this.socket.emit('nickname', name);
  this.socket.on('receiveData', function (data) {
    console.log(data)
  })

  const map = this.make.tilemap({ key: 'map'});
  const tileset = map.addTilesetImage('new_tileset', 'tileset') ; // 타일셋이미지명, preload에서 지정한 key값
  const tilesLayer = map.createLayer('tiles', tileset);
  const collision = map.createLayer('collision', tileset);

  // 배경 이미지를 게임 화면 크기로 확대
  const backgroundImage = this.add.image(0, 0, 'labeled');
  backgroundImage.setOrigin(0, 0);  // 이미지의 원점을 좌상단으로 설정
  backgroundImage.setScale(this.scale.width / backgroundImage.width, this.scale.height / backgroundImage.height);

  // 충돌
  collision.setCollisionByProperty({collision: true});
  collision.setCollisionByExclusion([715]);
  this.collision = collision

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id], collision);
      }
      else {
        addOtherPlayers(self, players[id], collision);
      }
    });
  });


  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo, collision);
  });

  this.socket.on('gameDisconnect', function (playerId) {  
    self.otherPlayers.getChildren().forEach(function (player) {  
      if (playerId === player.playerId) {
        player.destroy(); 
      }
    });
  });

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        // 다른 플레이어의 위치 업데이트, anims 업데이트도 가능?
        otherPlayer.setPosition(playerInfo.x, playerInfo.y, playerInfo.anims);
      }
    });
  });
  this.socket.on('userinfo', (data) => {
    LoanNumTxt.innerHTML = `${data.loan}`
    MoneyNumTxt.innerHTML = `${data.savings}`
    BankUsername.innerHTML = `${data.name} 님`
    money_elem.innerHTML = `${data.money}`
    level_elem.innerHTML = `${data.level}`
    ability_elem.innerHTML = `${data.ability}`
    
    // 마이페이지
    if (data.job === 'banker') {
      data.job = '은행원';
    }
    else if (data.job === 'po') {
      data.job = '경찰';
    }
    else if (data.job === 'dr') {
      data.job = '의사';
    }
    mp_name.innerHTML = `${data.name}님`
    mp_housing.innerHTML = `  ₩ ${data.housing}`
    mp_job.innerHTML = `${data.job}`
    mp_saving.innerHTML = `  ₩ ${data.savings}`
    mp_limit.innerHTML = `  ₩ ${data.limit}`
    mp_loan.innerHTML = `  ₩ ${data.loan}`
  })

  this.socket.on('time', (time) => {
    time_elem.innerHTML = `${time}`
  })
  this.socket.on('health', (health) => {
    health_elem.innerHTML = `${health}`
  })

  this.socket.on('game_finish', (data) => {
    const { name, score } = data;
    final.style.display = "block";
    // end.style.zindex = "200";
  })

  this.socket.on('game_finish_money',(data) => {
    const { name, score } = data;
  })

  this.socket.on('game_finish_health', (data) => {
    const { name, score } = data;
  })


  this.socket.on('event', (data) => {
    const player1 = data.players[0];
    const player2 = data.players[1];
    const x1 = player1.x;
    const y1 = player1.y;
    const x2 = player2.x;
    const y2 = player2.y;
  
    // 플레이어1과 플레이어2가 특정 좌표 안에 들어왔을 때 팝업창을 열기(팝업차단에 걸리므로 모달창으로 수정)
    if (checkInPopupArea(x1, y1) && checkInPopupArea(x2, y2)) {
      self.player.setPosition(360, 540);
      window.open('./popup.html', '_blank');
    }
  })

  // 채팅 기능
  const nickname = document.querySelector('#nick-name')
  const egList = document.querySelector(".EgList");  // 채팅 내용
  const chatInput = document.getElementById("chatInput");  // 메시지
  const sendButton = document.getElementById("chatBtn");  // 전송
  const chatList = document.querySelector(".ChatList")  // 화면 내용

  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendButton.click();
    }
  });

  sendButton.addEventListener("click", () => {  // 버튼을 클릭해서 param 내용(사용자명, 메시지) 전송
    const param = { name: nickname.textContent, msg: chatInput.value }
    this.socket.emit("chatting", param);
  })
  this.socket.on('chatting', (data) => {
    const { name, msg } = data;  // 사용자명, 메세지, 보낸 시간
    const item = new LiModel(name, msg);  // LiModel을 인스턴스 화
    item.makeLi();
    chatList.scrollTo(0, chatList.scrollHeight);
  });
  function LiModel (name, msg) {
    this.name = name;
    this.msg = msg;
    this.makeLi = () => {
      const ul = document.createElement("ul");
      const dom = `
      <span class="profile">
          <span class="user" style="color: black; font-size: 30px; font-family: 'Cafe24Supermagic-Bold-v1.0'; font-weight: 500; word-wrap: break-word;">${this.name} :  </span>
      </span>
      <span class="message" style="color: black; font-size: 30px;font-family: 'Cafe24Supermagic-Bold-v1.0'; font-weight: 500; word-wrap: break-word;">${this.msg}</span>
      `;
      ul.innerHTML = dom;
      egList.appendChild(ul);
    }
  }

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  this.keyboard = this.input.keyboard
  this.cursors = this.input.keyboard.createCursorKeys();
  const speed = 180;
  let playerVelocity = new Phaser.Math.Vector2();

  if (this.player) {
    if (this.cursors.left.isDown) {
      playerVelocity.x = -speed;
      this.player.anims.play(`left`, true);
    }
    else if (this.cursors.right.isDown) {
      playerVelocity.x = speed;
      this.player.anims.play('right', true);
    }
    else if (this.cursors.up.isDown) {
      playerVelocity.y = -speed;
      this.player.anims.play('up', true);
    }
    else if (this.cursors.down.isDown) {
      playerVelocity.y = speed;
      this.player.anims.play('down', true);
    }
    else {
      playerVelocity.x = 0;
      playerVelocity.y = 0;
      this.player.anims.stop()
    }


    playerVelocity.normalize();
    playerVelocity.scale(speed);
    this.player?.setVelocity(playerVelocity.x, playerVelocity.y);

    if (isCollidingWithMap(this.player)) {this.player.x = this.player.oldPosition.x;}  // 충돌하면 예전 x에서 더 못나감
    if (isCollidingWithMap(this.player)) {this.player.y = this.player.oldPosition.y;}
    
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    let x = this.player.x;
    let y = this.player.y;

    // let animation = this.player.anims

    if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y}) //animation: this.player.anims.currentAnim.key
    }

    // 플레이어 예전위치
    this.player.oldPosition = {
      x: this.player.x, 
      y: this.player.y, 
    };
    

  // 건물 중심 좌표 및 범위, 건물 범위 체크함수
    if (x >= 144 && x <= 207 && y>= 225 && y <=256) {  // 상점: x: 128 ~ 224, y: 225~256
      openShop(); 
    }
    else if (x >= 465 && x <= 524 && y>= 225 && y <=258) { // 부동산: x: 448~544, y:225~258
      openEstate(); 
    }
    else if (x>=786 && x <=816 && y>= 195 && y <=240) { // 학원: x:576~672 y:144~208
      openAcademy(); 
    }
    else if (x>=1011 && x <=1264 && y>= 98 && y <=190) {
      openLabor();
    }
    else if (x >= 1011 && x <=1230 && y >= 32 && y <=208) { // 노가다: x: 816~1040, y:32~208
      openLabor();
    }
    else if (x >= 144 && x <= 207 && y >= 592 && y <=656) { // 경찰: x: 64~128,, y:592~656
      openPolice(); 
    }
    else if (x >= 465 && x <= 524 && y>= 608 && y <= 670) { // 집: x: 465~524 , y: 592~656
      openHouse();
    }
    else if (x>= 736 && x <= 800 && y>= 608 && y <= 670) { // 병원: x: 576 ~ 672,  x:608~640, y: 592~656
      openBank();
    }
    else if (x>= 1072 && x <=1136 && y>= 641 && y <=672) { // 은행: x: 896~960, 은행: y: 641~670
      openClinic(); 
    }
    else {
      closeModal();
    }
  }
}


function addPlayer(self, playerInfo) {
  self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar.name).setOrigin(0.5, 0.5);

  self.anims.create({
    key: 'left',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar.name, { start: 3, end: 5 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'up',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar.name, { start: 6, end: 8 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'right',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar.name, { start: 9, end: 11 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'down',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar.name, { start: 0, end: 2 }),
    frameRate: 10,
    repeat: -1})
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar.name).setOrigin(0.5, 0.5);
  otherPlayer.playerId = playerInfo.playerId;
  // otherPlayer.setTint(Math.random() * 0xffffff);
  self.otherPlayers.add(otherPlayer);

  // // console.log(self.otherPlayers.scene) // 드디어 scene이 나옴
  // self.otherPlayers.scene.anims.create({
  //   // key: otherPlayer.avatar + '-left',
  //   key: 'left',
  //   frames: self.otherPlayers.scene.anims.generateFrameNumbers(otherPlayer.avatar, { start: 3, end: 5 }),
  //   frameRate: 10,
  //   repeat: -1
  // })
}

function createAnims(playerInfo){
  self.anims.create({
    key: 'left',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar, { start: 3, end: 5 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'up',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar, { start: 6, end: 8 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'right',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar, { start: 9, end: 11 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'down',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar, { start: 0, end: 2 }),
    frameRate: 10,
    repeat: -1})
}

const colliMap = [
  [715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,],
  [715, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715,   0,   0, 715, 715, 715, 715,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715,   0,   0, 715, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
  [715, 715, 715, 715,   0,   0,   0, 715, 715,   0, 715, 715,   0, 715,   0,   0,   0, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0, 715,],
  [715, 715, 715,   0,   0,   0,   0,   0, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
  [715, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715,   0,   0,   0,   0,   0,   0, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,],
  [715,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715,   0,   0,   0,   0,   0,   0, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,],
  [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
  [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
  [715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715,   0,   0,   0, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0, 715,],
  [715, 715, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0, 715,],
  [715, 715, 715,   0,   0,   0,   0,   0, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715,],
  [715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715,],
  [715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715,],
  [715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715]
]


function isColliding(rect1, rect2) {  // 충돌감지함수: 사각형
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y
  );
}

function isCollidingWithMap(player) {
  for (let row = 0; row < colliMap.length; row++) {
    for (let col = 0; col < colliMap[0].length; col++) {
      const tile = colliMap[row][col];

      if (tile && isColliding(
        {  // 사각형1: 플레이어
          x: player.x - 32/2,
          y: player.y,
          w: 32, 
          h: 32,
        },
        {  // 사각형2: 타일
          x: col * 32,
          y: row * 32,
          w: 32,
          h: 32,
        }
      )
      ) 
      {
        return true;
      }
    }
  }
  return false;
}


// 모달
const select = document.getElementById('select');
const staff = document.getElementById('staff');
const visitor = document.getElementById('visitor');

const bankSelect = document.getElementById('bankSelect');
const bankact = document.getElementById('bankact');
const bank_origin = `
<button type="button" class="BankActBtn" style="width: 139px; height: 51px; left: 21px; top: 268px; position: absolute">
  <div class="BankActBtnbox" style="width: 139px; height: 51px; left: 0px; top: 0px; position: absolute; border-radius: 15px"></div>
  <div class="BankActTxt" style="width: 118px; height: 23px; left: 11px; top: 11px; position: absolute; text-align: center; color: black; font-size: 25px; font-family: Sunflower; font-weight: 500; word-wrap: break-word">예금</div>
</button>`

const shop = document.getElementById('shop');
const estate = document.getElementById('estate');
const sell_h = document.getElementById('sell_h');
const buy_h = document.getElementById('buy_h');
const academy = document.getElementById('academy');
const home = document.getElementById('home');

const p_quiz = document.getElementById('p_quiz')

const quiz = document.getElementById('quiz');
const answer = document.getElementById('answer');
const y_btn= document.getElementById('y_btn');
const n_btn = document.getElementById('n_btn');

const loading = document.getElementById('loading');

y_btn.addEventListener('click', () => {
  setTimeout(() => {
    answer.style.display = "block";
    console.log('ans')
  }, 3000);
})

n_btn.addEventListener('click', () => {
  setTimeout(() => {
    answer.style.display = "block";
    console.log('ans')
  }, 3000);
})

const result = document.getElementById('result');

function closeModal() {
  select.style.display = "none"
  bankSelect.style.display = "none"
  shop.style.display = "none";
  estate.style.display = "none";
  academy.style.display = "none"
  home.style.display = "none";
  bankact.style.display = "none"

  quiz.style.display = "none";
  answer.style.display = "none";
  p_quiz.style.display = "none";

  final.style.display = "none";
  result.style.display = "none";
  loading.style.display = "none";
}

function openQuiz() {
  quiz.style.display = "block";
  answer.style.display = "none";
}

function openHouse() {
  home.style.display = "block";
}
const rest = document.getElementById('rest')
rest.addEventListener('click', () => {
  console.log('1')
  // home.style.display = "none";

  // keyboard.enabled = false;
  // setTimeout(()=>{this.keyboard.enabled = true}, 5000) //5초 동안 못 움직임
  fetch('/atHome', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({health: 1000})
  })
  .then(response => response.json())
  .then(data => {
    // 서버에서 전송한 데이터를 사용하여 처리할 작업
    console.log(data);
  });
})


const inHigh = document.getElementById('inHigh');
const inLow = document.getElementById('inLow');
const energy = document.getElementById('energy');
const food = document.getElementById('food');
const book = document.getElementById('book');

function openShop() {
  shop.style.display = "block";
}
inHigh.addEventListener('click', () => {
  console.log('high')
})

inLow.addEventListener('click', () => {
  console.log('low')
})

energy.addEventListener('click', () => {
  console.log('energy')
  fetch('/mart', {
    method: 'POST', 
    credentials: 'same-origin', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ action: 'drinking' })
  })
  .then(response => response.json())
  .then(data => {
    // 
  })
})

food.addEventListener('click', () => {
  console.log('food')
  fetch('/mart', {
    method: 'POST', 
    credentials: 'same-origin', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ action: 'eating' })
  })
  .then(response => response.json())
  .then(data => {
      const health_elem = document.getElementById('health');
      health_elem.innerHTML = `${data.health}`;
      const money_elem = document.getElementById('money');
      money_elem.innerHTML = `${data.money}`;
  })
})
book.addEventListener('click', () => {
  console.log('book')
  fetch('/mart', {
    method: 'POST', 
    credentials: 'same-origin', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ action: 'reading' })
  })
  .then(response => response.json())
  .then(data => {
      const ability_elem = document.getElementById('ability');
      ability_elem.innerHTML = `${data.ability}`;
      const money_elem = document.getElementById('money');
      money_elem.innerHTML = `${data.money}`;
    })
})


function openEstate() {
  estate.style.display = "block";
}

sell_h.addEventListener('click', () => {
  console.log('집 팔기');
  fetch('/celling_room', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      if (data.msg) {
          alert(data.msg);
      }
      else {
          // 마이페이지 수정 코드
          alert(data.msg);
      }
    });
})

buy_h.addEventListener('click', () => {
  console.log('집 사기')
  fetch('/buying_room', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      if (data.msg) {
        alert(data.msg);
      }
      else {
        // 마이페이지 수정 코드
        alert(data.msg);
      }
    });
})


function openAcademy() {
  academy.style.display = "block";
}
const academy_quiz = document.getElementById('academy_quiz');
academy_quiz.addEventListener('click', () => {
  quiz.style.display = "block";
  answer.style.display = "none";
})

function openLabor() {
  console.log('공사장')
}

function openPolice() {
  p_quiz.style.display = "block";
  answer.style.display = "none";
  // openQuiz_OX("police")
}

function openClinic() {
  select.style.display = "block";
  staff.addEventListener('click', () => {
    openQuiz();
  })
  visitor.addEventListener('click', () => {
    console.log('치료')
  })
}

function openBank() {
  select.style.display = "block";
  staff.addEventListener('click', () => {
    select.style.display = "none";
    openQuiz();
  })
  visitor.addEventListener('click', () => {
    select.style.display = "none";
    select.style.display = "0";
    bankSelect.style.display = "block";
    select_bankwork();
  })
}
// 은행 금액입력 디비 변화 함수 만드릭
const saving = document.getElementById('saving');
const withdraw = document.getElementById('withdraw');
const getLoan = document.getElementById('getLoan');
const repay = document.getElementById('repay');
const bankInput = document.getElementById('bankInput');
const bankActBtn = document.getElementById('bankActBtn');
const bankBackBtn = document.getElementById('bankBackBtn');

const handleSave = () => {
  console.log('저축')
  const save_Amount = bankInput.value;
  console.log(isNaN(save_Amount))
  if (!isNaN(save_Amount)) {
    fetch('/savings', {
      method: 'POST',
      credentials: 'same-origin', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ saveAmount: save_Amount })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.money);
        // const money_elem = document.getElementById('money');
        // money_elem.innerHTML = `${data.money}`
        // const savings_elem = document.getElementById('savings');
        // savings_elem.innerHTML = `${data.savings}`
    });
    // bankOrder0.innerHTML = bankOrigin
  }
  else {
    // alert('저축할 금액을 입력해주세요!');
  }
};
const handleWithdraw = () => {
  console.log('출금');
  const draw_Amount = bankInput.value;
  if (!isNaN(draw_Amount)) {
    fetch('/withdraw', {
      method: 'POST', 
      credentials: 'same-origin', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ withdrawAmount: draw_Amount })
    })
    .then(response => response.json())
    .then(data => {
    });
  }
  else {
    alert('잔액이 부족합니다.');
    // 이건 서버에서 전달해줘야함 수정 실패했을때
  }
};
const handleLoan = () => {
  console.log('대출')
  const loan_Amount = bankInput.value;
  if (!isNaN(loan_Amount)) {
    fetch('/get_loan', {
      method: 'POST', 
      credentials: 'same-origin', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ loanAmount: loan_Amount })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.money)
      console.log(data.loan)
      console.log(data.saving)
      console.log(data.limit)
    });
  }
  else {
    alert('대출할 금액을 입력해주세요!');
  }
};


const handleRepay = () => {
  const repay_Amount = bankInput.value;
  if (!isNaN(repay_Amount)) {
    fetch('/repay', {
      method: 'POST', 
      credentials: 'same-origin', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ repayLoan: repay_Amount })
    })
    .then(response => response.json())
    .then(data => {
    });
}
else {
  alert('금액을 입력해주세요!');
}
  console.log('상환')
};

function select_bankwork() {
  saving.addEventListener('click', () => {
    select.style.display = "none";
    bankSelect.style.display = "none";
    bankact.style.display = "block";
    bankActBtn.textContent = "예금";
    bankActBtn.removeEventListener('click', handleWithdraw);
    bankActBtn.removeEventListener('click', handleLoan);
    bankActBtn.removeEventListener('click', handleRepay);
    bankInput.value = '';
    bankActBtn.addEventListener('click', handleSave);
    // bankBackBtn.addEventListener('click', ()=>{
    //   bankInput.value = '';
    //   bankact.style.display = "none";
    //   bankSelect.style.display = "block";
    // })
  })
  withdraw.addEventListener('click', () => {
    select.style.display = "none";
    bankSelect.style.display = "none";
    bankact.style.display = "block";
    bankActBtn.textContent = "출금";
    bankActBtn.removeEventListener('click', handleSave);
    bankActBtn.removeEventListener('click', handleLoan);
    bankActBtn.removeEventListener('click', handleRepay);
    bankInput.value = '';
    bankActBtn.addEventListener('click', handleWithdraw);
    // bankBackBtn.addEventListener('click', () => {
    //   bankInput.value = '';
    //   bankact.style.display = "none";
    //   bankSelect.style.display = "block";
    // })
  })

  getLoan.addEventListener('click', () => {
    bankact.style.display = "block";
    bankActBtn.textContent = "대출";
    bankActBtn.removeEventListener('click', handleSave);
    bankActBtn.removeEventListener('click', handleWithdraw);
    bankActBtn.removeEventListener('click', handleRepay);
    bankInput.value = '';
    bankActBtn.addEventListener('click', handleLoan);
    bankBackBtn.addEventListener('click', ()=>{
      bankInput.value = '';
      bankact.style.display = "none";
      bankSelect.style.display = "block";
    })
  })

  repay.addEventListener('click', () => {
    bankact.style.display = "block";
    bankActBtn.textContent = "상환";
    bankActBtn.removeEventListener('click', handleSave);
    bankActBtn.removeEventListener('click', handleWithdraw);
    bankActBtn.removeEventListener('click', handleLoan);
    bankInput.value = '';
    bankActBtn.addEventListener('click', handleRepay);
    // bankBackBtn.addEventListener('click', ()=>{
    //   bankInput.value = '';
    //   bankact.style.display = "none";
    //   bankSelect.style.display = "block";
    // })
  })
}

fetch('/policeQuiz', {
  method: 'POST', 
  credentials: 'same-origin', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ action : 'police_oxQuiz' })
})
.then(response => response.json())
.then(data => {
  const quizData = data.quiz;
  let points = 0;
  let value = -1;

  const policeQuiz = document.getElementById('police_quiz');
  policeQuiz.innerHTML = `
      <p>${JSON.stringify(quizData.q, null, 2)}</p>
      <p>점수: ${points}</p>
  `;
  
  // O 버튼
  document.getElementById('pol_y_btn').addEventListener('click', () => {
    value = 1;
      if (value === quizData.a) {
          alert('맞았습니다!');
          points += quizData.point;
      }
      else if (value !== quizData.a) {
          alert('틀렸습니다!');
      }
      value = -1;
  });
  // X 버튼
  document.getElementById('pol_n_btn').addEventListener('click', () => {
      value = 0;
      if (value === quizData.a) {
          alert('맞았습니다!');
          points += quizData.point;
      }
      else if (value !== quizData.a) {
          alert('틀렸습니다!');
      }
      value = -1;
  });
});
