const WebSocket = require('ws');
const usedPort = process.env.PORT || 8080;
const wsServer = new WebSocket.Server({port: usedPort});
wsServer.on('connection', onConnect);

class Client {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

let clients = [];

function onConnect(wsClient) {
  console.log('Новое подключение');
  wsClient.on('message', function(message) {
    const jsonMessage = JSON.parse(message);
    switch(jsonMessage.action) {
      case 'REG' :
        let userExist = clients.find(object => {
          if (object.name === jsonMessage.data) return true;
        });
        if (userExist) {
          wsClient.send(JSON.stringify({action: 'REG', data: false}));
        } else {
          let client = new Client(wsClient, jsonMessage.data)
          clients.push(client);
          console.log('Зарегился: ' + jsonMessage.data);
          wsClient.send(JSON.stringify({action: 'REG', data: true}));
        }
        break;
      case 'MSG' :
        clients.forEach(client => {
          client.id.send(JSON.stringify({
            action: 'MSG',
            data: {user: jsonMessage.data.user, message: jsonMessage.data.message}
          }));
        });
        break;
      default : console.log('-- пришол кривой action --');
    }
  })
  wsClient.on('close', function() {
    clients = clients.filter(client => client !== wsClient);
    console.log('-- отключение --');
    clients.forEach(client => {
      client.id.send(JSON.stringify({
        action: 'MSG',
        data: {user: "<!>", message: client.name + " отключился..."}
      }));
    });
  })
}

console.log('Сервер запущен на порту ' + usedPort);
