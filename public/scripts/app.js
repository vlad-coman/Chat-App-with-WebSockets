// Make connection
const socket = io.connect("http://localhost:4000");

let message  = document.getElementById('message'),
	sender   = document.getElementById('sender'),
	btn      = document.getElementById('btn'),
	output   = document.getElementById('output'),
	feedback = document.getElementById('feedback'),
	reciever = document.getElementById('reciever');

// Emit Events
btn.addEventListener("click", function () {
	let data = {
		content: message.value,
		sender: sender.value,
		reciever: reciever.value,
		errors: { 
			invalidUsername: "The username entered for message addressee is invalid",
			missingUsername: "Message addressee username cannot be empty",
			offlineUsername: "Message addressee is offline and will not recieve your message",
			yourselfMessage: "You are trying to message yourself!"
		}
	};
	socket.emit('reciever', {
		content: data.content,
		sender: data.sender,
		reciever: data.reciever
	});
	socket.emit('sender', {
		content: data.content,
		sender: data.sender,
		reciever: data.reciever,
		yourselfError: data.errors.yourselfMessage
	});
	socket.emit('errors', {
		errors: data.errors,
		sender: data.sender,
		reciever: data.reciever
	});

})

// Listen for events from back-end and display corresponding data 
socket.on('reciever', (data) => {
	output.innerHTML += '<p><strong>' + data.sender + ': </strong>' + data.content + '</p>'
});

socket.on('sender', (data) => {
	if (data.content){
		output.innerHTML += '<p><strong style="color:green">(You): </strong>' + data.content + '</p>'
	} else {
		output.innerHTML += '<p style="color:#77410fbf"><strong style="color:#77410fbf">Warning! </strong>' + data + '</p>'
	}
	
});

socket.on('errors', (data) => {
	output.innerHTML += '<p style="color:red"><strong> Error: </strong>' + data + '</p>'
});