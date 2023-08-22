const express = require('express');
const cookieParser = require('cookie-parser');
const moment  = require('moment')
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); 
const server = http.createServer(app);
const io = socketIo(server);
const redisClient = new Redis();
const port = 3000;

const mongoose = require('mongoose');
const {collection, quizzes, sel_quizzes} = require('./mongodb');

const dotenv = require('dotenv');
const { userInfo } = require('os');
dotenv.config();
const db = process.env.MONGODB;

mongoose.connect(db)
  .then(() => {
      console.log('mongodb connected')
  })
  .catch(() => {
      console.log('failed to connect')
  }) 


app.use(cookieParser());
app.use(session({ secret: '13egin', resave: false, saveUninitialized: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/join.html'));
  res.cookie('name', 'value', { httpOnly: true });
});
app.get('/main', (req, res) => {
  const nickname = req.session.nickname;
  res.sendFile(path.join(__dirname + '/public/main.html'));
});

const jobList = ['dr', 'banker', 'po'];
redisClient.sadd('job_list', ...jobList);


app.post('/saveData', async function (req, res) {
  let nickname = req.body.nickname;
  const checkname = await checkDB(nickname);
  if (checkname) {
      res.json({ success: false });
  } 
  else {
    const random_job = await RandomJob()
    const userinfo = {
      money: 180000,  // 잔액
      name: nickname,
      time: 1800,  // 게임시간 1800초
      health: 500,  // 체력
      level: 1,  // 직위
      score: 0, // 총 자산
      interruption: 0,  // 중단지점 점수
      insurance: 0,  
      savings: 0,
      disease: 0,
      ability: 100,  // 능력
      housing: 0,  // 집
      loan: 0,  // 대출
      limit: 10000,  // 한도
      job: random_job, 
      alive: 1
    };
    const user_status = {
        name : nickname, 
        game: 0, 
        ready : 0, 
        score : 0, 
    }
    userinfo.score = userinfo.money + userinfo.savings - userinfo.loan
    req.session.nickname = nickname;
    res.cookie('nickname', nickname, { httpOnly: false })
    redisClient.set(nickname, JSON.stringify(userinfo));
    collection.insertMany([user_status])
    res.json({ success: true });
  }
});

app.post('/updateReady', async (req, res) => {
  const nickname = req.body.nickname;
  const readyStatus = req.body.ready;

  try {
      await collection.updateOne({ name: nickname }, { $set: { ready: readyStatus } });
      res.json({ success: true });
      allReady();
  }
  catch (error) {
      console.error(error);
      res.json({ success: false });
  }
});

app.post('/celling_room', (req, res) => {
  const nickname = req.cookies.nickname;
  redisClient.get(nickname, (err, reply) => {
      if (err) {
          console.log(err);
          res.status(500).send();
      }
      else {
          let userinfo = JSON.parse(reply);
          if (userinfo.housing === 0) {
            res.send({msg : '보유하고 있는 집이 없습니다.'});
          }
          else {
            userinfo.housing = 0;
            userinfo.money += 50000;
            const updatedValue = JSON.stringify(userinfo);
            redisClient.set(nickname, updatedValue);
            res.send({ money: userinfo.money, housing: userinfo.housing, msg: '판매완료' });
          }
      }
  });
});


app.post('/buying_room', (req, res) => {
  const nickname = req.cookies.nickname;
  redisClient.get(nickname, (err, reply) => {
      if (err) {
          console.log(err);
          // res.status(500).send();
      }
      else {
          let userinfo = JSON.parse(reply);
          if(userinfo.housing === 0){
            userinfo.housing = 40000;
            userinfo.money -= 40000;
            const updatedValue = JSON.stringify(userinfo);
            redisClient.set(nickname, updatedValue);
            res.send({ money: userinfo.money, housing: userinfo.housing, msg: '구매완료'});
            
          }else{
            userinfo.housing = 0;
            userinfo.money += 50000;
            redisClient.set(nickname, JSON.stringify(userinfo));
            res.send({msg : '이미 보유하고 있습니다.'});
          }
          
      }
  });
});

app.post('/atHome', (req, res) => {
  const nickname = req.cookies.nickname;
  const time = req.body.health;

  redisClient.get(nickname, function (err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred during shop payment' });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);

      if (userinfo.housing === 0) {
        res.send({msg : '?'});
      }
      else {
        console.log('??')
        userinfo.health += 1000;
        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);
        res.send({ health: userinfo.health});
      }
    }
  });
});

// 가게
app.post('/mart', function(req, res) {
  const action = req.body.action;
  const nickname = req.cookies.nickname;

  redisClient.get(nickname, function (err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred during shop payment' });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);

      if (action === 'eating') {
        eating();
      }
      else if (action === 'drinking') {
        drinking();
      }
      else if (action === 'reading') {
        book();
      }
      else if (action === 'insurance_1' && userinfo.insurance === 0 && chose_insurance_1 === 0 && chose_insurance_2 == 0) {
        insurance_1();
      }
      else if (action === 'insurance_2' && userinfo.insurance === 0 && chose_insurance_1 === 0 && chose_insurance_2 == 0) {
        insurance_2();
      }
      // 음식
      function eating() {
        userinfo.health += 10;
        userinfo.money -= 55;
        
        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);

        res.send({ health: userinfo.health, money: userinfo.money });
      }
      // 에너지 드링크
      function drinking() {
        userinfo.health += 20;
        userinfo.money -= 30;
        
        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);
        
        res.send({ health: userinfo.health, money: userinfo.money })
      }
      // 책
      function book() {
        userinfo.ability += 5
        userinfo.money -= 50;
        
        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);

        res.send({ ability: userinfo.ability, money: userinfo.money })
      }
      // // 보험
      // function insurance_1() {
      //   if (userinfo.insurance === 0 && chose_insurance_1 === 0 && chose_insurance_2 !== 1) {
      //     userinfo.insurance = 1;
      //     chose_insurance_1 = 1;
      //   }

      //   // 병원비 90원 할인
      //   hospital_fee = 60;
      //   hospital_fee_after = 110;
      //   // hospital_fee -= 90;
        
      //   const updatedValue = JSON.stringify(userinfo);
      //   redisClient.set(nickname, updatedValue);
        
      //   res.send({ money: userinfo.money, is_insurance: userinfo.insurance })
      // }
      // 저가형 보험
      // function insurance_2() {
      //   if (userinfo.insurance === 0 && chose_insurance_2 === 0 && chose_insurance_1 !== 1) {
      //     userinfo.insurance = 1;
      //     chose_insurance_2 = 1;
      //   }

      //   // 병원비 65원 할인
      //   hospital_fee = 85;
      //   hospital_fee_after = 135;
      //   // hospital_fee -= 65;
        
      //   const updatedValue = JSON.stringify(userinfo);
      //   redisClient.set(nickname, updatedValue);

      //   io.emit('buy_insurance2', { money: userinfo.money, is_insurance: userinfo.insurance });  // MongoDB로 부르기
      //   res.send({ money: userinfo.money, is_insurance: userinfo.insurance })
      // }
    }
  });
});

// 은행 //
// 저축
app.post('/savings', function(req, res) {
  const nickname = req.cookies.nickname;
  const save_amount = parseInt(req.body.saveAmount);
  
  redisClient.get(nickname, function (err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred during hospital payment' });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);
      if (userinfo.money >= save_amount) {
        userinfo.money -= save_amount;
        userinfo.savings += (save_amount + 3);

        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);
        
        res.send({ money: userinfo.money, savings: userinfo.savings });
      }
      else {
        console.log('잔액이 부족합니다.');
        // 클라이언트한테 메시지로 전달해야함
      }
    }
  });
});
// 출금
app.post('/withdraw', function(req, res) {
  const nickname = req.cookies.nickname;
  const withdraw_amount = parseInt(req.body.withdrawAmount);

  redisClient.get(nickname, function(err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred during withdrawing money' });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);

      if (withdraw_amount <= userinfo.savings) {
        userinfo.savings -= withdraw_amount;
        userinfo.money += withdraw_amount;

        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);

        res.send({ money: userinfo.money, savings: userinfo.savings });
      }
      else {
        console.log('잔액이 부족합니다.');
      }
    }
  })
})
// 대출 빌리기
app.post('/get_loan', function(req, res) {
  const nickname = req.cookies.nickname;
  const loan_amount = parseInt(req.body.loanAmount);

  redisClient.get(nickname, function (err, reply) { 
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred getting loan' });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);  

      if (loan_amount <= userinfo.limit) {
        userinfo.loan += loan_amount;  
        userinfo.limit -= loan_amount;  

        redisClient.set(nickname, JSON.stringify(userinfo));
        
        res.send({ loan: userinfo.loan, limit: userinfo.limit });
      }
      else {
        console.log('대출 한도를 초과했습니다.');
      }
    }
  });
});
// 상환하기
app.post('/repay', function(req, res) {
  const nickname = req.cookies.nickname;
  const repay_amount = parseInt(req.body.repayLoan);

  redisClient.get(nickname, function (err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred during hospital payment' });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);
    
      if (repay_amount <= userinfo.loan) { 
        userinfo.money -= repay_amount;
        userinfo.loan -= repay_amount;
        userinfo.limit += repay_amount;  

        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);

        res.send({ money: userinfo.money, loan: userinfo.loan })
      }
      else {
        console.log('상환 금액을 다시 맞춰주세요.');
      }
    }
  });
});


async function findQuiz_OX(q_tag) {  // 문제 1개 불러오기
  try {
    const random_Quiz = await quizzes.aggregate([
      { $match: { tag: q_tag } }, 
      { $sample: { size: 1 } }
    ]).exec();
    const OXQ = JSON.stringify(randomBank_OXquiz[0].q);  // 문제
    const OXA = JSON.stringify(randomBank_OXquiz[0].a);  // 답

    console.log(random_Quiz[0])
    console.log('은행 OX 퀴즈!:', random_Quiz[0]);
    console.log('은행 OX 문제 및 답:', OXQ, OXA);

    res.send({ quiz: findQuiz_OX[0] });
  }
  catch (err) {
    console.log(err)
  }
}
// // OX 퀴즈 함수
// async function findQuiz_OX(q_tag, res) {  // 문제 3개 불러오기
//   try {
//     const random_Quiz = await quizzes.aggregate([
//       { $match: { tag: q_tag } },
//       { $sample: { size: 3 } }
//     ]).exec();
    
//     const quiz_list = random_Quiz.map(quiz => {
//       return {
//         q: quiz.q, 
//         a: quiz.a, 
//         point: quiz.point, 
//       };
//     })

//     res.send({ quizzes: quiz_list });
//   }
//   catch (error) {
//     console.log('Error fetching quiz data:', error)
//   }
// }
app.get('/findBank_oxQuiz', async (req, res) => {
  try {
    const q_tag = req.body.tag;
    const quiz = await findQuiz_OX(q_tag);

    res.send({ quiz });
  }
  catch (error) {
    res.status(500).send({ error: error.message });
  }
});


// 은행 퀴즈 (은행에서 일하기)
app.post('/bankQuiz', function (req, res) {
  const action = req.body.action;

  if (action === 'bank_oxQuiz') {
    findBank_oxQuiz();
  }
  else if (action === 'bank_selQuiz') {
    findBank_selQuiz();
  }

  // 은행 OX 퀴즈
  async function findBank_oxQuiz() {
    try {
      const randomBank_OXquiz = await quizzes.aggregate([
        { $match: { tag: "bank" } }, 
        { $sample: { size: 1 } }
      ]).exec();
      const bank_OXQ = JSON.stringify(randomBank_OXquiz[0].q);  // 문제
      const bank_OXA = JSON.stringify(randomBank_OXquiz[0].a);  // 답

      console.log('은행 OX 퀴즈!:', randomBank_OXquiz[0]);
      console.log('은행 OX 문제 및 답:', bank_OXQ, bank_OXA);
      console.log();

      res.send({ quiz: randomBank_OXquiz[0] });
    }
    catch (error) {
      console.error('Error fetching quiz data:', error);
    }
  }
  // 은행 객관식 퀴즈
  async function findBank_selQuiz() {
    try {
      const randomBank_selQuiz = await sel_quizzes.aggregate([
        { $match: { tag: "bl_bank" } }, 
        { $sample: { size: 1 } }
      ]).exec();
      const bankSelQ = JSON.stringify(randomBank_selQuiz[0].q);  // 문제
      const bankSelA = JSON.stringify(randomBank_selQuiz[0].a);  // 답

      console.log('은행 객관식 퀴즈!:', randomBank_selQuiz[0]);
      console.log('문제 및 정답:', bankSelQ, bankSelA);
      console.log();

      res.send({ quiz: randomBank_selQuiz[0] });
    }
    catch (error) {
      console.error('Error fetching quiz data:', error);
    }
  }
});


// 경찰서 퀴즈
app.post('/policeQuiz', function (req, res) {
  const action = req.body.action;
  if (action === 'police_oxQuiz') {
    findPolice_oxQuiz();
  }
  else if (action === 'selQuiz') {
    findPolice_SelQuiz();
  }

  // 경찰서 OX 퀴즈
  async function findPolice_oxQuiz() {
    try {
      const randomPolice_OXquiz = await quizzes.aggregate([
        { $match: { tag: "police" } }, 
        { $sample: { size: 1 } }
      ]).exec();
      const police_OXQ = JSON.stringify(randomPolice_OXquiz[0].q);  // 문제
      const police_OXA = JSON.stringify(randomPolice_OXquiz[0].a);  // 답

      console.log('경찰서 OX 퀴즈!:', randomPolice_OXquiz[0]);
      console.log('문제 및 답:', police_OXQ, police_OXA);
      console.log();
      
      res.send({ quiz: randomPolice_OXquiz[0] });
    }
    catch (error) {
      console.error('Error fetching quiz data:', error);
    }
  }  
  // 경찰서 객관식 퀴즈
  async function findPolice_SelQuiz() {
    try {
      const randomPolice_selQuiz = await sel_quizzes.aggregate([
        { $match: { tag: "" } }, 
        { $sample: { size: 1 } }
      ]).exec();
      const policeSelQ = JSON.stringify(randomPolice_selQuiz[0].q);  // 문제

      const policeSelA1 = JSON.stringify(randomPolice_selQuiz[0].a1);
      const policeSelA2 = JSON.stringify(randomPolice_selQuiz[0].a2);
      const policeSelA3 = JSON.stringify(randomPolice_selQuiz[0].a3);

      const policeSelA = JSON.stringify(randomPolice_selQuiz[0].a);  // 답
      
      console.log('경찰서 단답형 퀴즈!:', randomPolice_selQuiz[0]);
      console.log('문제 및 정답:', policeSelQ, policeSelA);
      console.log();

      res.send({ quiz: randomPolice_selQuiz[0] });
    }
    catch (error) {
      console.error('Error fetching quiz data:', error);
    }
  }
})


async function allReady() {
  const total_player = await collection.countDocuments({});
  const ready_player = await collection.countDocuments({ready : 1});
  
  // if((total_player != 0)&&(total_player === ready_player)) {
  if (total_player === ready_player){
    setTimeout(()=>{
        io.emit('all-ready');
    }, 3000);
    console.log(total_player)
    console.log(ready_player)
  return 
  }
  else {
    return setInterval(allReady, 3000);
  }
}
function checkDB(nickname) {
  return new Promise((resolve) => {
    redisClient.exists(nickname, (err, result) => {
    if (err) {
        console.error(err);
        resolve(false);
    }
    resolve(result === 1);
    });
  });
}
function RandomJob() {
  return new Promise((resolve) => {
    redisClient.srandmember('job_list', (err, random_job) => {
      if (err) {
          console.error(err);
          resolve(null);
      }
      resolve(random_job);
    });
  });
}

app.get('/getData', async(req, res) => {
  const nickname = req.cookies.nickname; 
  redisClient.get(nickname, (err, reply) => {
    if (err) {
      console.log(err);
    }
    else {
      let userinfo = JSON.parse(reply);
      res.send(userinfo);
    }
  })
})


let players = {}; 
let avatars = [
  {name: 'AVA1', src: './assets/ava/AVA1.png'},
  {name: 'AVA2', src: './assets/ava/AVA2.png'},
  {name: 'AVA3', src: './assets/ava/AVA3.png'},
  {name: 'AVA4', src: './assets/ava/AVA4.png'},
  {name: 'AVA5', src: './assets/ava/AVA5.png'},
  {name: 'AVA6', src: './assets/ava/AVA6.png'},
  {name: 'AVA7', src: './assets/ava/AVA7.png'},
  {name: 'AVA8', src: './assets/ava/AVA8.png'},
  {name: 'AVA9', src: './assets/ava/AVA9.png'},
  {name: 'AVA10', src: './assets/ava/AVA10.png'},
];

let playerName = null;


io.on('connection', (socket)=> {
  console.log(`user connected: ${socket.id}`);

  const randomIndex = Math.floor(Math.random() * avatars.length);
  const avatar = avatars[randomIndex];
  avatars.splice(randomIndex, 1);  // 아바타 사용 완료 후 해당 아바타는 배열 avatars에서 제거
  
  players[socket.id] = {
    x: 520,
    y: 350,
    playerId: socket.id,
    playerName: playerName,
    avatar: avatar,
  };
    
  console.log(players[socket.id])

  socket.emit('currentPlayers', players);
  socket.broadcast.emit('newPlayer', players[socket.id]);  

  socket.on('disconnect', () =>{
    console.log('user disconnected');
    avatars.push(players[socket.id].avatar) // 사용한 아바타 다시 추가
    delete players[socket.id];
    io.emit('gameDisconnect', socket.id);
  });

  // 플레이어 움직임
  socket.on('playerMovement', function (movementData) { 
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].animation = movementData.animation;
    // checkDistance();
    // 다른 플레이어들에게도 내 플레이어 움직였다는 정보 업뎃
    socket.broadcast.emit('playerMoved', players[socket.id]); 
  });

  socket.on('chatting', (data) => {
    console.log('test:', data);
    const { name, msg } = data;
    io.emit('chatting', { name: name,  msg: msg});
  });
  
  socket.on('sendData', (data) => {
    redisClient.get(data, (err, reply) => {
      let name = data
      if (err) {
        console.log(err)
      }
      else {
        let time = 30;  // 1800
        let userinfo = JSON.parse(reply);

        async function update_value() {
          time--;
          // 시간 초과에 의한 게임 종료
          if (time <= -1) {
            console.log('게임 시간이 종료되었습니다.');
            userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;

            socket.emit('game_finish', { name: name, score: userinfo.score });
            // // 게임 종료 후 데이터 삭제
            // redisClient.del(name, (err, reply) => {
            //   console.log('게임시간이 종료되었습니다. 회원님의 데이터를 삭제하겠습니다.', reply)
            // });

            console.log('최종 점수:', userinfo.score);
            
            // 최종 점수 DB에 업데이트
            await collection.updateOne({ name: name }, { $set: { score: userinfo.score } });
            
            const scoreSorted = await collection
              .find()
              .select({ name: 1, score: 1, _id: 0 })
              .sort({ score: -1 })
              .exec();
            
            console.log('점수로 정렬:', scoreSorted);

            clearInterval(intervalId);

            return;
          }
          // 사망 1 (돈 탕진)
          if (userinfo.money <= 0) {
            console.log('파산하셨습니다.');
            userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;

            socket.emit('game_finish_money', { name: name, score: userinfo.score });
            
            console.log('최종 점수 (파산):', userinfo.score);

            // 최종 점수 DB에 업데이트
            await collection.updateOne({ name: name }, { $set: { score: userinfo.score } });
          
            const scoreSorted = await collection
              .find()
              .select({ name: 1, score: 1, _id: 0 })
              .sort({ score: -1 })
              .exec();
            console.log('점수로 정렬:', scoreSorted);

            clearInterval(intervalId);

            return;
          }
          // 사망 2 (체력 고갈)
          if (userinfo.health <= 0) {
            console.log('체력이 없습니다.');
            userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;

            socket.emit('game_finish_health', { name: name, score: userinfo.score });

            console.log('최종 점수 (체력 고갈):', userinfo.score);

            // 최종 점수 DB에 업데이트
            await collection.updateOne({ name: name }, { $set: { score: userinfo.score } });
          
            const scoreSorted = await collection
              .find()
              .select({ name: 1, score: 1, _id: 0 })
              .sort({ score: -1 })
              .exec();
            console.log('점수로 정렬:', scoreSorted);

            clearInterval(intervalId);

            return;
          }

          // 첫 5분동안은..
          if (time > 1780) {  // 1500
            userinfo.money -= 200;  // 1분당 200원 감소  userinfo.money -= 200;
            userinfo.health -= 1;  // 1분당 0.2 감소  userinfo.health -= 0.2;
          }
          // 5분 후 집이 사라지면
          else {  
            userinfo.money -= 300;  // 1분당 300원 감소  userinfo.money -= 300;
            userinfo.health -= 0.4;  // 1분당 0.4 감소  userinfo.health -= 0.4;
          }

          // 보험에 따른 시간당 금액 감소
          // if (chose_insurance_1 === 1 && chose_insurance_2 !== 1) 
          // {
          //   userinfo.money -= 30;
          // }
          // else if (chose_insurance_1 !== 1 && chose_insurance_2 === 1) {
          //   userinfo.money -= 20;
          // }

          const min = ~~(time / 60);
          const sec = time % 60
          const timeFormat = `${min}:${sec < 10 ? '0': ''}${sec}`;
          socket.emit('time', timeFormat)
          playerName = name;  // 플레이어 닉넴 획득
          socket.emit('money', userinfo.money)
          socket.emit('health', userinfo.health.toFixed(2))
          socket.emit('userinfo', userinfo);
          redisClient.set(name, JSON.stringify(userinfo));
        }

        const intervalId = setInterval(() => {
          redisClient.get(name, (err, reply) => {
            if (!err) {
              userinfo = JSON.parse(reply);
              update_value();
            }
          });
        }, 1000); 
    
      // socket.emit('score', userinfo.score)
      }
    });
  });

  // 실시간 랭킹
  // function updateUserScore(username, score) 
  // {
  //   client.zadd('scores', score, username);
  // }

  // function getTopUsers(callback) 
  // {
  //   client.zrevrange('scores', 0, 9, 'WITHSCORES', callback);
  // }

  // setInterval(() => 
  // {
  //   getTopUsers((err, result) => {    
  //     if (err) {
  //       console.error(err);
  //     } else {
  //       io.emit('rankingUpdate', result);
  //     }
  //   });
  //   }, 1000);
});

server.listen(8000, function () {
  console.log(`Listening on ${server.address().port}`);
})
