// Copyright 2018 Jonah Snider

const { Command } = require('discord.js-commando');
const rp = require('request-promise');
const winston = require('winston');
const replaceall = require('replaceall');
const moment = require('moment');

module.exports = class PUBGStatisticsCommand extends Command {
	constructor(client) {
		super(client, {
			ownerOnly: true,
			name: 'pubg-statistics',
			group: 'games',
			memberName: 'pubg-statistics',
			description: 'Get statistics of a Player Unknown\'s Battlegrounds player',
			details: 'Platforms are `pc` (PC), `xbl` (Xbox Live), and `psn` (PlayStation Network)',
			aliases: ['pubg-stats', 'player-unknown\'s-battlegrounds', 'player-unknowns-battlegrounds', 'pubg'],
			examples: ['fortnite-statistics Zaccubus pc', 'fortnite-stats "WBG Strafesh0t" pc'],
			throttling: {
				usages: 1,
				duration: 4
			},
			args: [{
				key: 'username',
				prompt: 'What user do you want to look up?',
				type: 'string'
			}, {
				key: 'season',
				prompt: 'What platform do you want to search on?',
				type: 'string',
				parse: season => season.toLowerCase(),
				default: ''
			}, {
				key: 'region',
				prompt: 'What region do you want to get statistics for?',
				type: 'string',
				parse: region => region.toLowerCase()
			}]
		});
	}

	async run(msg, { username, season , region }) {
		try {
			msg.channel.startTyping();

			const regions = ['na', 'eu', 'as', 'oc', 'sa', 'sea', 'krjp'];
			const seasons = ['2017-pre1', '2017-pre2', '2017-pre3', '2017-pre4', '2017-pre5', '2017-pre6', '2018-01', '2018-02'];
			if (!regions.includes(region)) {
				return msg.reply('❌ Unknown region. The regions are `na` (North America), `eu` (Europe), `as` (Asia), `oc` (Oceania), `sa` (South America), `sea` (South East Asia), and `krjp` (Korea/Japan)');
			}
			if (!seasons.includes(season)) {
				return msg.reply('❌ Unknown season. The seasons are `2017-pre1`, `2017-pre2`, `2017-pre3`, `2017-pre4`, `2017-pre5`, `2017-pre6`, `2018-01`, and `2018-02`');
			}

			const options = {
				uri: `https://api.fortnitetracker.com/v1/profile/${platform}/${username}`,
				json: true,
				headers: {
					'TRN-Api-Key': process.env.TRACKERNETWORK_TOKEN
				}
			};
			const stats = await rp(options);

			if (stats.error === 'Player Not Found') {
				return msg.reply('❌ Player not found on that platform.');
			}

			const parseTime = time => {
				winston.debug(`[COMMAND](FORTNITE-STATISTICS) Parsing the time for ${time}`);
				let duration = time;
				duration = replaceall('d', '', duration);
				duration = replaceall('h', '', duration);
				duration = replaceall('m', '', duration);

				winston.debug(`[COMMAND](FORTNITE-STATISTICS) Time after removing letters: ${duration}`);

				duration = duration.split(' ');
				winston.debug(`[COMMAND](FORTNITE-STATISTICS) Time after splitting on spaces: ${duration}`);

				duration = moment.duration({
					minutes: duration[2],
					hours: duration[1],
					days: duration[0]
				});
				return duration;
			};

			winston.debug(`[COMMAND](FORTNITE-STATISTICS) Result for ${username} on ${platform}: ${JSON.stringify(stats)}`);
			return msg.replyEmbed({
				title: stats.epicUserHandle,
				fields: [{
					name: '🏆 Wins',
					value: `${stats.lifeTimeStats[8].value} wins (${stats.lifeTimeStats[9].value})`
				}, {
					name: '💀 Kills',
					value: `${stats.lifeTimeStats[10].value} kills. ${stats.lifeTimeStats[11].value} K/D ratio. ${stats.lifeTimeStats[12].value} kills per minute.`
				}, {
					name: '🕒 Time Played',
					value: `Around ${parseTime(stats.lifeTimeStats[13].value).humanize()} (${stats.lifeTimeStats[13].value})`
				}, {
					name: '⏲ Average Survival Time',
					value: stats.lifeTimeStats[14].value
				}, {
					name: '🎮 Matches Played',
					value: stats.lifeTimeStats[7].value
				}, {
					name: '🔢 Score',
					value: stats.lifeTimeStats[6].value
				}]
			});
		} finally {
			msg.channel.stopTyping();
		}

	}
};