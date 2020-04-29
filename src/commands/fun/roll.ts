import {Message} from 'discord.js';
import {ArgumentType, DiceCommand, DiceCommandCategories} from '../../structures/DiceCommand';
import Roll = require('roll');
import {Argument} from 'discord-akairo';

export default class RollCommand extends DiceCommand {
	constructor() {
		super('roll', {
			aliases: ['roll-dice', 'die', 'dice', 'roll-die'],
			category: DiceCommandCategories.Fun,
			description: {
				content: 'Roll dice using dice notation.',
				usage: '[roll]',
				examples: ['', 'd6', '4d6', '2d20+1d12', 'd%', '2d6+2']
			},
			args: [
				{
					id: 'roll',
					match: 'content',
					default: 'd6',
					type: Argument.validate(ArgumentType.String, (message, phrase) => Roll.prototype.validate(phrase)),
					prompt: {optional: true, retry: 'Invalid dice notation, please try again', start: 'What do you want to roll?'}
				}
			]
		});
	}

	async exec(message: Message, {roll}: {roll: string}): Promise<Message | undefined> {
		const rolled = new Roll().roll(roll);

		return message.util?.send(
			[rolled.result.toLocaleString(), rolled.rolled.length > 1 ? ` (${rolled.rolled.map(value => value.toLocaleString()).join(', ')})` : ''].join(''),
			{split: true}
		);
	}
}