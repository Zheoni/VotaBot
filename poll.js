const Discord = require("discord.js");
const hash = require("string-hash");

class Poll {
	constructor(channel, question, answers, time, emojis) {
		this.channel = channel;
		this.question = question;
		this.answers = answers;
		this.time = time;
		this.createdOn = new Date();
		this.id = this.generateId();
		this.finished = false;
		this.emojis = emojis;
		this.embed = this.generateEmbed();
		this.msg = null;
		this.results = new Array();
	}

	async start() {
		let message = await this.channel.send({ embed: this.embed })
			.then(async (message) => {
				await this.setMsg(message);
				if (this.time > 0) {
					this.results = this.voting(message).then(() => this.finish()).catch(console.error);
				}
				for (let i = 0; i < this.answers.length && i < 10; i++) {
					try {
						await message.react(this.emojis[i]);
					} catch (error) {
						console.log(error);
					}
				}
				return message;
			}).catch(console.error);
		return message;
	}

	generateEmbed() {
		let str = new String();
		let end = new Date(this.createdOn.getTime() + this.time);

		if (this.answers[0] !== "" && this.answers[1] !== "") {
			for (let i = 0; i < this.answers.length && i < 10; i++) {
				str += `${this.emojis[i]}. ${this.answers[i]}\n`;
			}
		}

		let footer = `React with the emojis below | ID: ${this.id}`;
		if (this.time > 0) footer += ` | This poll ends in ${end.toUTCString()}`;

		let embed = new Discord.RichEmbed()
			.setColor("#50C878")
			.setAuthor("📊" + this.question)
			.setDescription(str)
			.setFooter(footer);

		return embed;
	}

	setMsg(message) {
		let promise = new Promise((resolve, reject) => {
			resolve(this.msg = message);
		});
		return promise;
	}

	voting() {
		return new Promise(async (resolve, reject) => {
			if (this.msg == null) return console.log("No hay mensaje para la votacion");
			if (this.time < 1) return console.log("No hay tiempo para la votacion");
			let filter = (reaction) => this.emojis.includes(reaction.emoji.name);
			const reactions = await this.msg.awaitReactions(filter, { time: this.time });
			let results = new Array(reactions.size);
			for (let i = 0; i < reactions.size; i++) {
				results[i] = reactions.get(this.emojis[i]).count - 1;
			}

			this.results = results;

			resolve(results);
			// console.log(results);
		});
	}

	async finish() {
		let now = new Date();
		return new Promise(async (resolve, reject) => {
			this.finished = true;
			this.finishedOn = now;
			this.embed.setColor("FF0800")
				.setAuthor(`${this.question} [FINISHED]`)
				.setFooter(`Poll ${this.id} finished ${now.toUTCString()}`);
			try {
				await this.msg.edit({ embed: this.embed });
			} catch (error) {
				console.error(error);
			}
			this.getVotes().then(this.showResults()).then(resolve()).catch(console.error);
		});
	}

	async getVotes() {
		return new Promise((resolve, reject) => {
			if (this.finished) {
				if (this.time === 0) {
					let reactionCollection = this.msg.reactions;
					for (let i = 0; i < this.answers.length; i++) {
						this.results[i] = reactionCollection.get(this.emojis[i]).count - 1;
					}
				}
				resolve(this.results);
			} else {
				const e = new Error("Poll not ended");
				reject(e);
			}
		});
	}

	showResults() {
		return new Promise((resolve, reject) => {
			if (this.finished) {
				if (this.results.length >= 2) {
					let description = new String();
					let totalVotes = 0;
					this.results.forEach((answer) => totalVotes += answer);
					if(totalVotes == 0) totalVotes = 1;
					for (let i = 0; i < this.results.length; i++) {
						description += this.emojis[i] + " " + this.answers[i] + " :: **" + this.results[i] + "** :: " +
							(this.results[i] / totalVotes) * 100 + "% \n";
					}

					let footer = `Results from poll ${this.id} finished on ${this.finishedOn.toUTCString()}`;
					let resultsEmbed = new Discord.RichEmbed()
						.setAuthor("Results of: " + this.question)
						.setDescription(description)
						.setFooter(footer)
						.setColor("#0080FF");


					resolve(this.channel.send({ embed: resultsEmbed }));
				} else {
					const e = new Error("There are no results");
					reject(e);
				}
			} else {
				const e2 = new Error("The poll is not finished");
				reject(e2);
			}
		});
	}

	generateId() {
		let id = new String("");
		id += this.createdOn.getUTCFullYear();
		id += this.createdOn.getUTCDate();
		id += this.createdOn.getUTCHours();
		id += this.createdOn.getUTCMinutes();
		id += this.createdOn.getUTCMilliseconds();
		id += this.question;

		return hash(id);
	}

	regenerateId() {
		if (this.id) {
			let now = Date();
			let newid = new String("");
			newid += this.id + now.getUTCMilliseconds();
			return hash(newid);
		} else {
			const e = new Error("There is no previous id");
			throw e;
		}
	}



}

module.exports = Poll;