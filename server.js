const WebSocket = require('ws');
const lastUpdateDate = '3-01-2022';

const usedPort = process.env.PORT || 9000;
const socketServer = new WebSocket.Server({ port: usedPort });
socketServer.on('connection', onConnect);

class Client {
  constructor(id, nickName, avatar) {
    this.id = id;
    this.nickName = nickName;
    this.avatar = avatar;
  }
};
let clientsArr = [];

class Message {
  constructor(author, target, message, sticker) {
    this.author = author; // {nickName, avatar}
    this.target = target; // {nickName, avatar}
    this.message = message; // string
    this.sticker = sticker; // data
    this.date = Date.now();
  }
};

const maxMessagesOnServer = 100;
let messagesArr = [];

function addNewMessage(message) {
  clientsArr.forEach(client => {
    client.id.send(JSON.stringify({
      action: 'newMessage',
      data: message
    }));
  });

  if (messagesArr.length === maxMessagesOnServer) messagesArr.shift();
  messagesArr.push(message);
}

function onConnect(socketClient) {
  console.log('get new connection');

  socketClient.on('message', function (message) {
    let { action, data } = JSON.parse(message);
    switch (action) {
      case 'firstConnect' : getFreeAvatarsRequest(socketClient); break;
      case 'registration' : getRegistrationRequest(socketClient, data); break;
      case 'onConnect' : getOnConnectRequest(socketClient, data); break;
      case 'newMessage' : addNewMessage(data); break;
      default : getWrongActionInRequest(action, data);
    }
  });

  socketClient.on('close', function () {

    let target = clientsArr.find(client => client.id === socketClient);
    if (!target) target = {avatar: 'avenger', nickName: '-=Avenger=-'};
    clientsArr = clientsArr.filter(client => client.id !== socketClient);
    console.log('user disconnect');

    let message = new Message(null, target, 'disconnect', null);
    addNewMessage(message);
  });

}
console.log(`server start on port ${usedPort}`);
console.log(`last update date is ${lastUpdateDate}`);

function getFreeAvatarsRequest(socketClient) {
  let avatarsArr = clientsArr.map(client => client.avatar);
  socketClient.send(JSON.stringify({ action: 'firstConnect', data: avatarsArr }));
}

function getRegistrationRequest(socketClient, data) {
  let userAvatarExist = clientsArr.find(object => {
    if (object.avatar === data.avatar) return true;
  });
  let userNickNameExist = clientsArr.find(object => {
    if (object.nickName === data.nickName) return true;
  });

  let registrationIs = (userAvatarExist || userNickNameExist) ? false : true;

  if (registrationIs) {
    let target = {nickName: data.nickName, avatar: data.avatar};

    let message = new Message(null, target, 'newConnect', null);
    addNewMessage(message);

    let client = new Client(socketClient, data.nickName, data.avatar);
    clientsArr.push(client);
  }

  let messages = (registrationIs) ? messagesArr : [];
  socketClient.send(JSON.stringify({
    action: 'registration',
    data: {
      registrationIs: registrationIs,
      userAvatarExist : userAvatarExist,
      userNickNameExist : userNickNameExist,
      messages: messages
    }
  }));

  console.log('userAvatarExist:', userAvatarExist, '; userNickNameExist:', userNickNameExist);

}

function getOnConnectRequest(socketClient, data) {
  socketClient.send(JSON.stringify({
    action: 'onConnect',
    data: { clientSendTime: data, serverSendTime: Date.now() }
  }));
}

function getWrongActionInRequest(action, data) {
  console.log('-- WRONG ACTION --');
  console.log('-action-');
  console.log(action);
  console.log('-data-');
  console.log(data);
  console.log('-- -- --');
}
