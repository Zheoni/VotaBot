const Discord = require("discord.js");
const hash = require("string-hash");

const numEmojis = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"];
const handEmojis = ["👍", "👎"];

class Poll {
	constructor(msg, question, answers, time, type) {
		if (msg) { // if the constructor have parameters
			this.guildId = msg.guild.id;
			this.channelId = msg.channel.id;
			this.msgId = null;
			this.question = question;
			this.answers = answers;
			this.createdOn = Date.now();
			this.isTimed = (time != 0);
			this.hasFinished = false;
			this.finishTime = new Date(this.createdOn + time).getTime();
			this.type = type;
			this.emojis = this.getEmojis(type);
			this.results = [];
			this.id = this.generateId();
		}
	}

	static copyConstructor (other) {
		let p = new Poll();

		p.guildId = other.guildId;
		p.channelId = other.channelId;
		p.msgId = other.msgId;
		p.question = other.question;
		p.answers = other.answers;
		p.createdOn = other.createdOn;
		p.isTimed = other.isTimed;
		p.finishTime = other.finishTime;
		p.hasFinished = other.hasFInished;
		p.type = other.type;
		p.emojis = other.emojis;
		p.results = other.results;
		p.id = other.id;

		return p;
	}

	async start(msg) {
		const message = await msg.channel.send({ embed: this.generateEmbed() })
		this.msgId = message.id;
		for (let i = 0; i < this.answers.length && i < 10; ++i) {
			try {
				await message.react(this.emojis[i]);
			} catch (error) {
				console.log(error);
			}
		}
		return message.id;
	}

	async finish(client) {
		const now = new Date();
		const message = await this.getPollMessage(client);
		if (!message) {
			console.error("Cant find poll message");
			return;
		}
		if (message.embeds.length < 1) {
			console.error("The poll message ha no embeds.");
			return;
		}
		
		this.hasFinished = true;
		
		const embed = new Discord.RichEmbed(message.embeds[0]);
		embed.setColor("FF0800")
			.setAuthor(`${this.question} [FINISHED]`)
			.setFooter(`Poll ${this.id} finished ${now.toUTCString()}`);

		try {
			await message.edit({ embed: embed });
			await this.getVotes(message);
			await this.showResults(message.channel);
		} catch (error) {
			console.error(error);
		}
	}

	async getVotes(message) {
		if (this.hasFinished) {
			const reactionCollection = message.reactions;
			for (let i = 0; i < this.answers.length; i++) {
				this.results[i] = reactionCollection.get(this.emojis[i]).count - 1;
			}
		} else {
			throw new Error("Poll not ended");
		}
	}

	async showResults(channel) {
		if (!this.hasFinished) {
			throw new Error("The poll is not finished");
		}
		if (this.results.length < 2) {
			throw new Error("There are no results");
		}

		return await channel.send({ embed: this.generateResultsEmbed() });
	}

	generateEmbed() {
		let str = new String();

		if (this.type !== "yn") {
			for (let i = 0; i < this.answers.length && i < 10; i++) {
				str += `${this.emojis[i]}. ${this.answers[i]}\n`;
			}
		}

		let footer = `React with the emojis below | ID: ${this.id}`;
		if (this.isTimed) footer += ` | This poll ends in ${new Date(this.finishTime).toUTCString()}`;

		let embed = new Discord.RichEmbed()
			.setColor("#50C878")
			.setAuthor("📊" + this.question)
			.setDescription(str)
			.setFooter(footer);

		return embed;
	}

	generateResultsEmbed() {
		let description = new String();
		let totalVotes = 0;

		this.results.forEach((answer) => totalVotes += answer);
		if (totalVotes == 0) totalVotes = 1;

		let finalResults = [];

		for (let i = 0; i < this.results.length; i++) {
			let percentage = (this.results[i] / totalVotes * 100);
			let result = {
				emoji: this.emojis[i],
				answer: this.answers[i],
				votes: this.results[i],
				percentage: percentage.toFixed(2)
			}

			finalResults.push(result);
		}

		if (this.type !== "yn") { // only sort if its not a yn poll
			finalResults.sort((a, b) => { return b.votes - a.votes });
		}

		finalResults.forEach((r) => {
			description += `${r.emoji} ${r.answer} :: ** ${r.votes} ** :: ${r.percentage}% \n`;
		});

		let footer = `Results from poll ${this.id} finished on ${new Date(this.finishTime).toUTCString()}`;
		let resultsEmbed = new Discord.RichEmbed()
			.setAuthor("Results of: " + this.question)
			.setDescription(description)
			.setFooter(footer)
			.setColor("#0080FF");

		return resultsEmbed;
	}

	generateId() {
		let id = new String("");
		if (this.id) {
			id += this.id + Date.now();
		} else {
			const d = new Date(this.createdOn);
			id += d.getUTCFullYear();
			id += d.getUTCDate();
			id += d.getUTCHours();
			id += d.getUTCMinutes();
			id += d.getUTCMilliseconds();
			id += this.question;
		}
		this.id = hash(id);
		return this.id;
	}

	getEmojis(type) {
		switch (type) {
			case "yn":
				return handEmojis;
			case "default":
				return numEmojis;
			default:
				throw new Error("The poll type is not known");
		}
	}

	async getPollMessage(client) {
		try {
			return await client.guilds.get(this.guildId).channels.get(this.channelId).fetchMessage(this.msgId);
		} catch (err) {
			return;
		}
	}
}

module.exports = Poll;