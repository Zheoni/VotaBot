const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./botconfig.json");

const emojis = ["0⃣", "1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"];

client.on('ready', () => {
	console.log(`Bot logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
	if (msg.content.startsWith(config.prefix) && !msg.author.bot) {
		/*const reactions = await msg.awaitReactions(reaction => {
			console.log(reaction.emoji);
			return reaction.name == "nine"
		}, {time: 10000});*/
		poll(msg);
	}
});

client.login(config.token);

async function poll(msg) {
	let _args = msg.content.slice(config.prefix.length).trim().split('"');
	//Filer more because of multiple whitespaces
	let args = _args.filter(phrase => {
		phrase.trim();
		return phrase !== "" && phrase !== " ";
	});

	let question = args.shift();

	let pollmsg = await generatePollMsg(question, args);

	await msg.channel.send(pollmsg)
		.then(async message => {
			for (let i = 0; i < args.length && i < 10; i++) {
				try {
					await message.react(emojis[i + 1]);
				} catch (error) {
					console.log(error);
				}
			}
		}).catch(console.error);
	
	

	console.log(args);
}

function generatePollMsg(question, answers) {
	let msg;
	msg = "**" + question + "** " + "\n";
	for (let i = 0; i < answers.length && i < 10; i++) {
		msg += emojis[i+1] + ". " + answers[i] + "\n";
	}
	return msg;
}
