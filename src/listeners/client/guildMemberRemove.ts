import {formatDistanceToNow} from 'date-fns';
import {bold} from 'discord-md-tags';
import {GuildMember, MessageEmbed, Snowflake, TextChannel} from 'discord.js';
import {Colors, Notifications} from '../../constants';
import {DiceListener, DiceListenerCategories} from '../../structures/DiceListener';
import {channelCanBeNotified} from '../../util/notifications';

export default class GuildMemberRemoveListener extends DiceListener {
	public constructor() {
		super('guildMemberRemove', {
			emitter: 'client',
			event: 'guildMemberRemove',
			category: DiceListenerCategories.Client
		});
	}

	public static generateNotification(member: GuildMember): MessageEmbed {
		const embed = new MessageEmbed({
			title: 'Member Left',
			timestamp: new Date(),
			color: Colors.Error,
			thumbnail: {
				url: 'https://dice.js.org/images/statuses/guildMember/leave.png'
			},
			author: {
				name: `${member.user.tag} (${member.user.id})`,
				iconURL: member.user.displayAvatarURL({size: 128})
			},
			fields: [
				{
					name: 'Number of Server Members',
					value: `${bold`${member.guild.memberCount.toLocaleString()}`} members`
				}
			]
		});

		if (member.joinedAt) {
			embed.setFooter(`Member for ${formatDistanceToNow(member.joinedAt)}`);
		}

		return embed;
	}

	public async exec(member: GuildMember): Promise<void> {
		const guildSettings = await this.client.prisma.guild.findUnique({
			where: {id: member.guild.id},
			select: {notifications: {select: {channels: true}, where: {id: Notifications.GuildMemberJoinLeave}}}
		});

		if (guildSettings?.notifications?.length) {
			// This array will be a single element since we are filtering by notification ID above
			const [setting] = guildSettings.notifications;

			const embed = GuildMemberRemoveListener.generateNotification(member);

			setting.channels.forEach(async (channelID: Snowflake) => {
				// We do a check here instead of Array.prototype#filter since this is an async function
				if (await channelCanBeNotified(Notifications.GuildMemberJoinLeave, member.guild, channelID)) {
					const channel = this.client.channels.cache.get(channelID) as TextChannel;

					return channel.send(embed);
				}
			});
		}
	}
}
