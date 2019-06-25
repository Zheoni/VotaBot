const Discord = require("discord.js");
const hash = require("string-hash");

const numEmojis = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"];
const handEmojis = ["👍", "👎"];

class Poll {
	constructor(channel, question, answers, time, type) {
		this.channel = channel;
		this.msg = null;
		this.question = question;
		this.answers = answers;
		this.createdOn = new Date();
		this.finishedOn = null;
		this.isTimed = (time != 0);
		this.finishTime = new Date(this.createdOn.getTime() + time);
		this.hasFinished = false;
		this.type = type;
		this.emojis = this.getEmojis(type);
		this.results = [];
		this.id = this.generateId();
		this.embed = this.generateEmbed();
	}

	async start() {
		let message = await this.channel.send({ embed: this.embed })
		this.msg = message;
		for (let i = 0; i < this.answers.length && i < 10; i++) {
			try {
				await message.react(this.emojis[i]);
			} catch (error) {
				console.log(error);
			}
		}
		return message;
	}

	generateEmbed() {
		let str = new String();

		if (this.type !== "yn") {
			for (let i = 0; i < this.answers.length && i < 10; i++) {
				str += `${this.emojis[i]}. ${this.answers[i]}\n`;
			}
		}

		let footer = `React with the emojis below | ID: ${this.id}`;
		if (this.isTimed) footer += ` | This poll ends in ${this.finishTime.toUTCString()}`;

		let embed = new Discord.RichEmbed()
			.setColor("#50C878")
			.setAuthor("📊" + this.question)
			.setDescription(str)
			.setFooter(footer);

		return embed;
	}

	async finish() {
		const now = new Date();
		this.hasFinished = true;
		this.finishedOn = now;
		this.embed.setColor("FF0800")
			.setAuthor(`${this.question} [FINISHED]`)
			.setFooter(`Poll ${this.id} finished ${now.toUTCString()}`);
		try {
			await this.msg.edit({ embed: this.embed });
			await this.getVotes();
			await this.showResults();
		} catch (error) {
			console.error(error);
		}
	}

	async getVotes() {
		if (this.hasFinished) {
			const reactionCollection = this.msg.reactions;
			for (let i = 0; i < this.answers.length; i++) {
				this.results[i] = reactionCollection.get(this.emojis[i]).count - 1;
			}
		} else {
			throw new Error("Poll not ended");
		}
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

		finalResults.sort((a, b) => { return b.votes - a.votes });

		finalResults.forEach((r) => {
			description += `${r.emoji} ${r.answer} :: ** ${r.votes} ** :: ${r.percentage}% \n`;
		});

		let footer = `Results from poll ${this.id} finished on ${this.finishedOn.toUTCString()}`;
		let resultsEmbed = new Discord.RichEmbed()
			.setAuthor("Results of: " + this.question)
			.setDescription(description)
			.setFooter(footer)
			.setColor("#0080FF");

		return resultsEmbed;
	}

	async showResults() {
		if (!this.hasFinished) {
			throw new Error("The poll is not finished");
		}
		if (this.results.length < 2) {
			throw new Error("There are no results");
		}

		return await this.channel.send({ embed: this.generateResultsEmbed() });
	}

	generateId() {
		let id = new String("");
		if (this.id) {
			let now = Date();
			id += this.id + now.getUTCMilliseconds();
		} else {
			id += this.createdOn.getUTCFullYear();
			id += this.createdOn.getUTCDate();
			id += this.createdOn.getUTCHours();
			id += this.createdOn.getUTCMinutes();
			id += this.createdOn.getUTCMilliseconds();
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
}

module.exports = Poll;