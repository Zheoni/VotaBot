const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./botconfig.json");
const Poll = require("./poll.js");

const numEmojis = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"];
const handEmojis = ["👍", "👎"];

// let commandSyntaxRegex = new RegExp(config.prefix + "\\s(((-t=\\d+[smhd\\s]\s)?(\"[^\"]*\"\\s?)+)|(help)|(invite))");
let commandSyntaxRegex = new RegExp(config.prefix + "\\s(((-t=\\d+[smhd\\s]\s)?(\"[^\"]*\"\\s?)+)|(help)|(examples))");

let pollMap = new Map();

client.on('ready', () => {
	console.log(`Bot logged in as ${client.user.tag}!`);
	client.user.setActivity(`${config.prefix} help`);
	// setInterval(()=>console.log(pollMap),6000);
});

client.on('message', async msg => {
	if (msg.content.startsWith(config.prefix) && !msg.author.bot) {
		poll(msg);
	}
});

client.login(config.token);

async function poll(msg) {
	
	if (!msg.content.match(commandSyntaxRegex)) {
		msg.reply(`Wrong command syntax. Learn how to do it correctly with \`${config.prefix} help\``);
		return;
	}

	let args = parseToArgs(msg);
	let time = 0;

	if (args.length == 0) {
		msg.reply(`Sorry, give me more at least a question`);
		return;
	}

	//parse the time limit if it exists
	if (args[0].startsWith("-t=")) {
		const timeRegex = /\d+/;
		const unitRegex = /s|m|h|d/i;
		let _time = args.shift();
		let unit = 's';

		let match1 = _time.match(timeRegex);
		if (match1 != null) time = parseInt(match1.shift());
		else {
			msg.reply("Wrong time syntax!");
			return;
		}

		let match2 = _time.match(unitRegex);
		if (match2 != null) unit = match2.shift();

		switch (unit) {
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
	} else if (args[0] == "help") {
		console.log("Help executed in " + msg.guild.name + " by " + msg.author.tag);
		help(msg);
		return;
	}else if(args[0] == "examples") {
		console.log("Examples executed in " + msg.guild.name + " by " + msg.author.tag);
		examples(msg);
		return;
	}/*else if(args[0] == "invite") {
		console.log("Invite executed in " + msg.guild.name + " by " + msg.author.tag);
		msg.reply("This is the link to invite me to another server! " + config.link);
		return;
	}*/

	console.log("Poll executed in " + msg.guild.name + " by " + msg.author.tag);

	// console.log(args + " - Time: " + time);

	let question = args.shift();
	let answers = new Array();
	let emojis = numEmojis;

	switch (args.length) {
		case 0:
			answers = ["", ""];
			emojis = handEmojis;
			break;
		case 1:
			msg.reply("You cannot create a poll with only one question");
			return;
		default:
			answers = args;
			break;
	}

	let p = await new Poll(msg.channel, question, answers, time, emojis);

	p.start();

	pollMap.set(p.id, p);
}

function parseToArgs(msg) {
	let args = msg.content.slice(config.prefix.length)
		.trim()
		.split('"')
		.filter(phrase => phrase.trim() != "");
	for (let i = 0; i < args.length; i++) args[i] = args[i].trim();
	return args;
}

function help(msg) {
	const helpEmbed = new Discord.RichEmbed()
		.setAuthor("VotaBot's Commands")
		.addField("Create Y/N poll", "`" + config.prefix + " \"{question}\"" + "`")
		.addField("Create complex poll [2-10 answers]", "`" + config.prefix + " \"{question}\" \"[Option 1]\"" +
			" \"[Option 2]\"...`")
		.addField("Timed polls", "Just add `-t=TIME[s|m|h|d]` after the \"" + config.prefix + "\", where \"TIME\" is " +
			"the time to finish the poll followed by it's unit.")
		.addField("See examples", "`" + config.prefix + " examples" + "`");
	//.addField("Invite", "Request a link to invite this bot to another server.");

	msg.channel.send({ embed: helpEmbed });
}

function examples(msg) {
	const examplesEmbed = new Discord.RichEmbed()
		.setAuthor("Examples of VotaBot's commands")
		.addField("Y/N Poll", "`" + config.prefix + " \"Do you like this?\"`")
		.addField("Complex poll", "`" + config.prefix + " \"What do you wanna play?\" \"Overwatch\" \"CS:GO\"" +
			"\"Quake\" \"WoW\"`")
		.addField("Timed poll", "`" + config.prefix + "-t=6h \"Chat tonight?\"`");
	
	msg.channel.send({embed: examplesEmbed});
}