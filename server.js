const WebSocket = require('ws');
const wsServer = new WebSocket.Server({port: 9000});
wsServer.on('connection', onConnect);

class Client {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

let counter = 1;
let clients = [];

function onConnect(wsClient) {
  console.log('Новый пользователь');
  let client = new Client(wsClient, counter)
  clients.push(client);

  // отправка приветственного сообщения клиенту
  wsClient.send(JSON.stringify({action: 'NEW', data: counter}));
  wsClient.on('message', function(message) {
    const jsonMessage = JSON.parse(message);
    clients.forEach(obj => {
      obj.id.send(JSON.stringify({action: 'MSG', data: jsonMessage.id + ": " + jsonMessage.data}));
    });
  })
  wsClient.on('close', function() {
    clients = clients.filter(obj => obj.id !== wsClient);
    clients.forEach(obj => {
      obj.id.send(JSON.stringify({action: 'MSG', data: client.name + " отключился..."}));
    });
  })
  counter++;
}

console.log('Сервер запущен на 9000 порту');