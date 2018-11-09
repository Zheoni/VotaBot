const Discord = require('discord.js');

class Poll {
	constructor(channel, question, answers, time, emojis) {
		this.channel = channel;
		this.question = question;
		this.answers = answers;
		this.time = time;
		this.finished = false;
		this.emojis = emojis;
		this.embed = this.generateEmbed();
		this.msg = undefined;
		this.results = new Array();
	}
	
	async start() {
		let message = await this.channel.send({ embed: this.embed })
			.then(async message => {
				await this.setMsg(message);
				if(this.time > 0) {
					this.results = this.voting(message).then(() => this.finished = true);
				} else this.finished = true;
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

		if(this.answers[0] != "" && this.answers[1] != ""){
			for (let i = 0; i < this.answers.length && i < 10; i++) {
				str += this.emojis[i] + ". " + this.answers[i] + "\n";
			}
		}

		let embed = new Discord.RichEmbed()
		.setAuthor(this.question)
		.setDescription(str)
		.setFooter('React with the emojis below');
		
		return embed;
	}

	setMsg(message) {
		let promise = new Promise((resolve, reject) => {
			resolve(this.msg = message);
		})
		return promise;
	}

	setResults(results) {
		this.results = results;
		console.log(this.results);
	}

	// async sendMsg() {
	// 	let message = await this.channel.send({ embed: this.embed })
	// 		.then(async message => {
	// 			for (let i = 0; i < this.answers.length && i < 10; i++) {
	// 				try {
	// 					await message.react(this.emojis[i + 1]);
	// 				} catch (error) {
	// 					console.log(error);
	// 				}
	// 			}
	// 			return message;
	// 		}).catch(console.error);
	// 	return message;
	// }


	async voting() {
		if(this.msg == null) return console.log("No hay mensaje para la votacion");
		if(this.time < 1) return console.log("No hay tiempo para la votacion")
		let filter = (reaction) => this.emojis.includes(reaction.emoji.name);
		const reactions = await this.msg.awaitReactions(filter, { time: this.time });
		let results = new Array(reactions.size);
		for (let i = 0; i < reactions.size; i++) {
			results[i] = reactions.get(this.emojis[i + 1]).count - 1;
		}
		// console.log(results);
		return results;
	}

	getVotes() {
		return this.msg.reactions;
	}

}

module.exports = Poll;