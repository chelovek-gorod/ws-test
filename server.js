/**************
 *
 *    NODE
 *
 *************/

"use strict";

// stop server after timeout
let timeoutMinutes = 10;
let timeout = timeoutMinutes * 60 * 1000;
setTimeout(stopNode, timeout);
function stopNode() {
    console.log("stop node.js");
    process.exit();
}

/*---------------*/

const fs = require('fs');

// read JSON
let r_data = fs.readFileSync('../json/students.json');
let students = JSON.parse(r_data);
let newStudent = {};

let id = 0; // send student id
let getJSON = false;

// update JSON
function updateStudents() {
    let w_data = JSON.stringify(students);
    fs.writeFileSync('../json/students.json', w_data);
}

// Node.js WebSocket server script
const http = require('http');
const WebSocketServer = require('websocket').server;
const server = http.createServer();
server.listen(9898);
const wsServer = new WebSocketServer({
    httpServer: server
});

console.log('connection...');

wsServer.on('request', function(request) {
    const connection = request.accept(null, request.origin);
    connection.on('message', function(message) {
        console.log('connection on');
        let msg = message.utf8Data;
        let res;
        console.log('getJSON start :' + getJSON);
        if (getJSON === true) {
            newStudent = JSON.parse(msg)
            console.log('newStudent :'); console.log(newStudent);
            console.log('newStudent.id : ' + newStudent.id + "(type : " + typeof(newStudent.id ) + ")");
            if (newStudent.id == "edit") {
                students[id].fistName = newStudent.fistName;
                students[id].secondName = newStudent.secondName;
                students[id].age = newStudent.age;
                students[id].speciality = newStudent.speciality;
                updateStudents();
                msg = 'edit OK';
            } else {
                newStudent.id = students.length;
                students.push(newStudent);
                updateStudents();
                id = students.length -1;
                msg = 'Connected';
            }
            console.log('new Student arr:'); console.log(newStudent);
            getJSON = false;
        }
        console.log('switch(msg)  :' + msg);
        switch(msg) {
            case 'Connected' :
                res = JSON.stringify(students[id]);
                break;
            case 'prev' :
                if (id == 0) id = students.length -1;
                else id -= 1;
                res = JSON.stringify(students[id]);
                break;
            case 'next' :
                if (id < students.length -1) id += 1;
                else id = 0;
                res = JSON.stringify(students[id]);
                break;
            case 'edit' :
                getJSON = true;
                res = "ready edit";
                break;
            case 'new' :
                getJSON = true;
                res = "ready add new";
                break;
            case 'edit OK' : res = "edit student : OK"; break;
            case 'add new OK' : res = "add new student : OK"; break;
            case 'edit or add new error' : res = msg; break;
            default : res = "unknown request";
        }
        connection.sendUTF(res);
        console.log('send response  :' + res);
        console.log('getJSON end :' + getJSON);
    });
    connection.on('close', function(reasonCode, description) {
        console.log('Client has disconnected.');
    });
});