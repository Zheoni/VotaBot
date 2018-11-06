const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./botconfig.json");

client.on('ready', () => {
	console.log(`Bot logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
	if(msg.content.startsWith(config.prefix) && !msg.author.bot) {
		poll(msg);
	}
});

client.login(config.token);

function poll(msg) {
	let _args = msg.content.slice(config.prefix.length).trim().split('"');
	//Filer more because of multiple whitespaces
	let args = _args.filter(phrase => {
		phrase.trim();
		return phrase !== "" && phrase !== " ";
	});

	let question = args.shift()
	

	msg.channel.send(pollmsg)
		.then(message => {
			for(let i=0; i < args.length; i++) {
				switch(i+1) {
					case 1:
						
						break;
					case 2:

						break;
					case 3:

						break;
					case 4:
						
						break;
					case 5:

						break;
					case 6:

						break;

					case 7:

						break;
					case 8:

						break;
					case 9:

						break;
					case 10:

						break;
					default:
						console.log(msg.author.tag + "Tried a poll with more than 10 answers!");
						message.delete();
				}
			}	
		})

	console.log(args);
}
