import {Argument} from 'discord-akairo';
import {codeblock} from 'discord-md-tags';
import {Message, MessageEmbed} from 'discord.js';
import {maxEmbedFields} from '../../constants';
import {ArgumentType, DiceCommand, DiceCommandCategories} from '../../structures/DiceCommand';
import {startTimer} from '../../util/timer';
import ms = require('pretty-ms');

/**
 * The number of fields allowed before the output will be in codeblock form.
 * Must be less than or equal to 25.
 */
const maxFieldsBeforeCodeblock = 10;

export default class LeaderboardCommand extends DiceCommand {
	constructor() {
		super('leaderboard', {
			aliases: ['top'],
			category: DiceCommandCategories.Economy,
			description: {
				content: 'Check the wealthiest users in the economy.',
				usage: '[amount]',
				examples: ['', '20']
			},
			args: [
				{
					id: 'amount',
					match: 'content',
					type: Argument.range(ArgumentType.Integer, 1, maxEmbedFields, true),
					default: 10,
					prompt: {optional: true, retry: 'Invalid amount, please try again'}
				}
			]
		});
	}

	async exec(message: Message, args: {amount: number}): Promise<Message | undefined> {
		const endTimer = startTimer();
		const top = await this.client.prisma.user.findMany({orderBy: {balance: 'desc'}, first: args.amount});

		const embed = new MessageEmbed({title: `Top ${top.length.toLocaleString()} leaderboard`});

		const users = await Promise.all(top.map(async user => this.client.users.fetch(user.id)));

		if (top.length <= maxFieldsBeforeCodeblock) {
			top.forEach((user, index) => embed.addField(`#${index + 1} ${users[index].tag}`, user.balance.toLocaleString()));
		} else {
			embed.setDescription(
				codeblock('markdown')`${top.map((user, index) => {
					const balance = user.balance.toLocaleString();
					const userTag = users[index].tag;
					const paddedNumber = `${index + 1}. `.padEnd(args.amount.toString().length + '. '.length);
					return `${paddedNumber}${userTag} - ${balance}`;
				})}`
			);
		}

		embed.setFooter(`Took ${ms(endTimer())}`);

		return message.util?.send(embed);
	}
}