import {Message, Util} from 'discord.js';
import {DiceCommand, DiceCommandCategories} from '../../structures/DiceCommand';
import {nullish} from '@pizzafox/util';

import {cleanDeletedSelfRoles} from '../../util/self-roles';

export default class ListSelfRolesCommand extends DiceCommand {
	constructor() {
		super('list-self-roles', {
			aliases: ['self-roles-list'],
			description: {content: 'List all self-assigned roles from this server.', examples: [''], usage: ''},
			category: DiceCommandCategories.Selfroles,
			channel: 'guild'
		});
	}

	async exec(message: Message): Promise<Message | undefined> {
		const guild = await this.client.prisma.guild.findUnique({where: {id: message.guild!.id}, select: {selfRoles: true}});

		if (!nullish(guild) && guild.selfRoles.length > 0) {
			const validatedSelfroles = await cleanDeletedSelfRoles(this.client.prisma, guild.selfRoles, message.guild!);

			if (validatedSelfroles.length === 0) {
				// The selfroles list from the DB consisted entirely of invalid roles
				return message.util?.send('No selfroles');
			}

			return message.util?.send(
				[
					'A ▫ indicates a role you currently have',
					Util.escapeMarkdown(
						Util.cleanContent(
							validatedSelfroles.map(id => `${message.guild!.roles.cache.get(id)!.name}${message.member!.roles.cache.has(id) ? '▫' : ''}`).join('\n'),
							message
						)
					)
				].join('\n')
			);
		}

		return message.util?.send('No selfroles');
	}
}
