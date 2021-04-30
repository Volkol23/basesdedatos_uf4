#!/usr/bin/node

const http = require("http");
const node_static = require("node-static");
const mongo = require("mongodb").MongoClient;

let server_url = "mongodb://localhost:27017";

let chat_db;

mongo.connect(server_url, (err, server) => {
	if(err){
		console.log("Error en la conexión a MongoDB");
		throw err;
	}
	
	console.log("Dentro de MongoDB");
	chat_db = server.db("amongmeme");

});

function sendChat(response){
	let cursor = chat_db.collection("chat").find({});
		
	cursor.toArray().then((data) => {
		console.log(data);
		response.writeHead(200, {'Content-Type': 'text/plain'}); 
		response.write(JSON.stringify(data));
		response.end();
	});
/*
	chat.catch(() => {
		response.writeHead(404, {'Content-Type': 'text/html'});
		response.end();
	});
*/
}



console.log("Inicializando el servidor chat");

let public_files = new node_static.Server("pub");

http.createServer((request, response) => {
	console.log("Archivo: "+request.url);

	if(request.url == "/chat"){
		console.log("Nos piden el chat de mongo");
		sendChat(response);

	}else{
		public_files.serve(request, response);
	}

}).listen(8080);

