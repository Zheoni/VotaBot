const Discord = require('discord.js');
const config = require("./botconfig.json");
const Poll = require("./poll.js");

const client = new Discord.Client();

const numEmojis = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"];
const handEmojis = ["👍", "👎"];

// />poll\s(((-t=\d*([smhd]\s|\s))?("[^"]*"\s?)+)|(help)|(examples))/
const commandSyntaxRegex = new RegExp(config.prefix +
	"\\s(((time=\\d+([smhd]\\s|\\s))?(\"[^\"]*\"\\s?)+)|(help)|(examples)|(end\\s\\d+))");

const helpEmbed = new Discord.RichEmbed()
	.setAuthor("VotaBot's Commands")
	.addField("Create Y/N poll", "`" + config.prefix + " \"{question}\"" + "`")
	.addField("Create complex poll [2-10 answers]", "`" + config.prefix + " \"{question}\" \"[Option 1]\"" +
		" \"[Option 2]\"...`")
	.addField("Timed polls", "`" + config.prefix + " time=TIME[s|m|h|d] ... `, where \"TIME\" is " +
		"the time to finish the poll followed by it's unit.")
	.addField("See results", "If a poll is not timed you need to finish it to see the results\n"+
		"with `" + config.prefix + " end {ID (Only numbers)}`, where ID is the poll id wich appears at the end of the poll")
	.addField("See examples", "`" + config.prefix + " examples" + "`")
	.addBlankField()
	.addField("Things to know", "Only administrators or people with a role named \"Poll Creator\" can interact with "+
		"me.\nIf a NOT timed poll has more than a week, you cannot finish it to get the results.\nIf for some unlucky " +
		"reason the bot restarts, in the current version you won't have the option of finishing any poll created before.")
	.setColor('#DDA0DD');
//.addField("Invite", "Request a link to invite this bot to another server.");

const examplesEmbed = new Discord.RichEmbed()
	.setAuthor("Examples of VotaBot's commands")
	.addField("Y/N Poll", "`" + config.prefix + " \"Do you like this?\"`")
	.addField("Complex poll", "`" + config.prefix + " \"What do you wanna play?\" \"Overwatch\" \"CS:GO\"" +
		"\"Quake\" \"WoW\"`")
	.addField("Timed poll", "`" + config.prefix + " time=6h \"Chat tonight?\"`")
	.addField("See the results of a poll", "`" + config.prefix + " end 61342378`")
	.setColor('#DDA0DD');


let pollMap = new Map();
const MaxElements = 5000;

client.on('ready', () => {
	console.log(`Bot logged in as ${client.user.tag}!`);
	client.user.setActivity(`${config.prefix} help`);
	setInterval(cleanMap, 86400000);
	setInterval(() => console.log("Stored polls: " + pollMap.size), 1800000);
});

client.on('message', async msg => {
	if (msg.content.startsWith(config.prefix) && !msg.author.bot) {
		let role = -1;
		try {
			role = await msg.guild.roles.find(r => r.name === "Poll Creator");
			if(role) roleid = role.id;
		} catch (error) {
			console.error(error);
		}
		if (msg.member.hasPermission("ADMINISTRATOR") || msg.member.roles.has(roleid)) {
			if (msg.content.match(commandSyntaxRegex)) {
				let args = parseToArgs(msg);
				if (args.length > 0) {
					switch (args[0]) {
						case "help":
							console.log("Help executed in " + msg.guild.name + " by " + msg.author.tag);
							msg.channel.send({ embed: helpEmbed });
							break;
						case "examples":
							console.log("Examples executed in " + msg.guild.name + " by " + msg.author.tag);
							msg.channel.send({ embed: examplesEmbed });
							break;
						case "end":
							console.log("End executed in " + msg.guild.name + " by " + msg.author.tag);
							end(msg, args);
							break;
						case "invite":
							console.log("Invite executed in " + msg.guild.name + " by " + msg.author.tag);
							msg.reply("This is the link to invite me to another server! " + config.link);
							break;
						default:
							console.log("Poll executed in " + msg.guild.name + " by " + msg.author.tag);
							poll(msg, args);
							break;
					}
				} else {
					msg.reply(`Sorry, give me more at least a question`);
				}
			} else msg.reply(`Wrong command syntax. Learn how to do it correctly with \`${config.prefix} help\``);

		} else {
			msg.reply("You don't have permision to do that. Only administrators or users with a role named \"Poll Creator\"");
			console.log(msg.author.tag + " on " + msg.guild.name + " tried to create a poll without permission");
		}
	}
});

client.login(config.token);

async function poll(msg, args) {

	let time = 0;

	//parse the time limit if it exists
	if (args[0].startsWith("time=")) {
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

		let match2 = _time.split("=").pop().match(unitRegex);
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
	}

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
			msg.reply("You cannot create a poll with only one answer");
			return;
		default:
			answers = args;
			break;
	}

	let p = await new Poll(msg.channel, question, answers, time, emojis);

	p.start();

	if(p.time <= 0) {
		if (pollMap.size < MaxElements) {
			while (pollMap.has(p.id)) {
				try {
					p.regenerateId();
				} catch (error) {
					console.error(error);
				}
			}
			pollMap.set(p.id, p);
		}
	}
	// console.log(pollMap);
}

function parseToArgs(msg) {
	let args = msg.content.slice(config.prefix.length)
		.trim()
		.split('"')
		.filter(phrase => phrase.trim() != "");
	for (let i = 0; i < args.length; i++) args[i] = args[i].trim();
	if (args[0].startsWith("end")) {
		let aux = args[0].split(" ");
		args[0] = aux[0];
		args.push(aux[1]);
	}
	return args;
}

function end(msg, args) {
	let id = Number(args[1]);
	if (pollMap.has(id)) {
		let p = pollMap.get(id);
		if (!p.finished) {
			if (p.time == 0) {
				p.finish();
			} else {
				msg.reply("A timed poll cannot be ended before the time it was set.");
			}
		} else msg.reply("That poll has already ended");
	} else msg.reply("That id not in memory. The id is wrong or it's not in my memory because it was" +
		"created more than a week ago (or because I had to restart myself D: ).")
}

function cleanMap() {
	let now = new Date();
	pollMap.forEach((value, key, map) => {
		if (value.createdOn.getTime() > now.getTime() + 604800000 || value.finished)	//one week or finished
			map.delete(key);
	});
}