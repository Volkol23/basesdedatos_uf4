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
function sendLastChat(request,response){
	let info = request.url.split("=");
	let query = {
		date: { $gt : parseInt(info[1]) }
	};
		let cursor = chat_db.collection("chat").find(query);
		
		cursor.toArray().then((data) => {
			response.writeHead(200, {'Content-Type': 'text/plain'}); 
			response.write(JSON.stringify(data));
			response.end();
		});
}

function sendChat(response){
	let cursor = chat_db.collection("chat").find({});
		
	cursor.toArray().then((data) => {
		//console.log(data);
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
function sendRecentChat(response){
	const estimated_count = chat_db.collection("chat").estimatedDocumentCount();
	estimated_count.then( (count) => {
		console.log(count);
		const MAX = 5;
		let cursor = chat_db.collection("chat").find({},{
			skip: count - MAX,
			limit: MAX,
			sort: {$natural:1}
		});
		
		cursor.toArray().then((data) => {
			//console.log(data);
			response.writeHead(200, {'Content-Type': 'text/plain'}); 
			response.write(JSON.stringify(data));
			response.end();
		});

	});
/*
	chat.catch(() => {
		response.writeHead(404, {'Content-Type': 'text/html'});
		response.end();
	});
*/
}

function sendData(request,response){
	let body = [];

	/*En cada bloques de datos enviado, recibido se añade en body*/
	request.on('data', chunk =>{
		body.push(chunk)

	}).on('end', () => {
		let chat_data = JSON.parse(Buffer.concat(body).toString());
		
		let chat = {
			user: chat_data.chat_user,
			msg: chat_data.chat_msg,
			date: Date.now()
		}
		//console.log(chat);
		chat_db.collection('chat').insertOne(chat);
	});
	response.end();
}


console.log("Inicializando el servidor chat");

let public_files = new node_static.Server("pub");

http.createServer((request, response) => {
	console.log("Archivo: "+request.url);

	if(request.url == "/chat"){
		console.log("Nos piden el chat de mongo");
		sendChat(response);

	}else if(request.url == "/submit"){
		console.log("Envío de datos");
		sendData(request,response);
	}else if(request.url == "/recent"){
		console.log("Nos piden los mensajes recientes del chat");
		sendRecentChat(response);
	}else if(request.url.startsWith("/chat")){
		console.log("Enviar los ulimos mensajes")
		sendLastChat(request,response);
	}else{
		public_files.serve(request, response);
	}


}).listen(8080);

