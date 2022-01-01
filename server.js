const WebSocket = require('ws');
const lastUpdateDate = '1-01-2022';

const usedPort = process.env.PORT || 9000;
const socketServer = new WebSocket.Server({ port: usedPort });
socketServer.on('connection', onConnect);

class Client {
  constructor(id, nickName, avatar) {
    this.id = id;
    this.nickName = nickName;
    this.avatar = avatar;
  }
}
let clientsArr = [];

const maxMessagesOnServer = 100;
let messagesArr = new Array(maxMessagesOnServer);
/*
{ 
  senderNickName: string,
  senderAvatar: id,
  message: object{
    type: message / answer,
    data: text / sticker
  }
}
*/

function onConnect(socketClient) {
  console.log('get new connection');

  socketClient.on('message', function (message) {
    let { action, data } = JSON.parse(message);
    switch (action) {
      case 'firstConnect' : getFreeAvatarsRequest(socketClient); break;
      case 'registration' : getRegistrationRequest(socketClient, data); break;
      case 'onConnect' : getOnConnectRequest(socketClient, data); break;
      case 'newMessage' : getNewMessageRequest(socketClient,data); break;
      default : getWrongActionInRequest(action, data);
    }
  });

  socketClient.on('close', function () {
    clientsArr = clientsArr.filter(client => client !== socketClient);

    console.log('user disconnect');

    clientsArr.forEach(client => {
      client.id.send(JSON.stringify({
        action: 'disconnectionUser',
        data: {
          nickName: client.nickName,
          avatar: client.avatar
        }
      }));
    });
  });

}
console.log(`server start on port ${usedPort}`);
console.log(`last updete date is ${lastUpdateDate}`);

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
    clientsArr.forEach(client => {
      client.id.send(JSON.stringify({
        action: 'newUser',
        data: {
          nickName: data.nickName,
          avatar: data.avatar
        }
      }));
    });

    let client = new Client(socketClient, data.nickName, data.avatar);
    clientsArr.push(client);

  }

  socketClient.send(JSON.stringify({
    action: 'registration',
    data: {
      registrationIs: registrationIs,
      userAvatarExist : userAvatarExist,
      userNickNameExist : userNickNameExist
    }
  }));

}

function getOnConnectRequest(socketClient, data) {
  socketClient.send(JSON.stringify({
    action: 'onConnect',
    data: { clientSendTime: data, serverSendTime: Date.now() }
  }));
}

function getNewMessageRequest(socketClient, data) {

}

function getWrongActionInRequest(action, data) {

}
