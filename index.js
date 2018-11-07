const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./botconfig.json");

const emojis = ["0⃣", "1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"];

client.on('ready', () => {
	console.log(`Bot logged in as ${client.user.tag}!`);
	client.user.setActivity(`${config.prefix} help`);
});

client.on('message', async msg => {
	if (msg.content.startsWith(config.prefix) && !msg.author.bot) {
		if (msg.content === config.prefix + " help") help(msg);
		// else if(msg.content === config.prefix + " invite") invite(msg);
		else poll(msg);
	}
});

client.login(config.token);

async function poll(msg) {
	console.log("Poll executed in " + msg.guild.name + " by " + msg.author.tag);

	let args = await parseToArgs(msg);
	let time = 0;

	if(args.length == 0) {
		msg.reply("Sorry, I cannot create an empty poll");
		return;
	}

	//parse the time limit if it exists
	if(args[0].startsWith("-t=")) {
		const timeRegex = /\d+/;
		const unitRegex = /s|m|h|d/i;
		let _time = args.shift();
		let unit = 's';

		let match1 = _time.match(timeRegex);
		if(match1 != null) time = parseInt(match1.shift());
		else{
			msg.reply("Wrong time syntax!");
			return;
		}

		let match2 = _time.match(unitRegex);
		if(match2 != null) unit = match2.shift();

		switch(unit) {
			case 's': time *= 1000;
			break;
			case 'm': time *= 60000;
			break;
			case 'h': time *= 3600000;
			break;
			case 'd': time *= 86400000;
			break;
			default: time *= 1000;
		}
	}

	console.log(args + " - Time: " + time);

	let question = args.shift();

	let pollmsgEmbed = await generatePollMsg(question, args);

	await msg.channel.send({ embed: pollmsgEmbed })
		.then(async message => {
			if(time > 0) voting(message, time);
			for (let i = 0; i < args.length && i < 10; i++) {
				try {
					await message.react(emojis[i + 1]);
				} catch (error) {
					console.log(error);
				}
			}
			return message;
		}).catch(console.error);
}

function parseToArgs(msg) {
	let args = msg.content.slice(config.prefix.length)
		.trim()
		.split('"')
		.filter(phrase => phrase.trim() != "");
	for (let i = 0; i < args.length; i++) args[i] = args[i].trim();
	return args;
}

function generatePollMsg(question, answers) {
	let msg = new String();
	for (let i = 0; i < answers.length && i < 10; i++) {
		msg += emojis[i + 1] + ". " + answers[i] + "\n";
	}

	let embed = new Discord.RichEmbed()
		.setAuthor(question)
		.setDescription(msg)
		.setFooter('React with the emojis below');

	return embed;
}

async function voting(pollmsg, time) {
	let filter = (reaction) => emojis.includes(reaction.emoji.name);
	const reactions = await pollmsg.awaitReactions(filter, {time: time});
	let results = new Array(reactions.size);
	for(let i = 0; i < reactions.size; i++) {
		results[i] = reactions.get(emojis[i+1]).count - 1;
	}
	return results;
}

function help(msg) {
	console.log("Help executed in " + msg.guild.name + " by " + msg.author.tag);

	const helpEmbed = new Discord.RichEmbed()
		.setAuthor("VotaBot's Commands")
		.addField("Create Y/N poll", "`" + config.prefix + " \"{question}\"" + "`")
		.addField("Create complex poll [2-10]", "`" + config.prefix + " \"{question}\" \"[Option 1]\" \"[Option 2]\"..." + "`")
		.addField("Timed polls", "Just add `-t=TIME[s|m|h|d]` after the \"" + config.prefix + "\", where \"TIME\" is " +
			"the time to finish the poll followed by it's unit.");

	msg.channel.send({ embed: helpEmbed });
}