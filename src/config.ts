import {Snowflake} from 'discord.js';
import * as dotenv from 'dotenv';
import {promises as fs} from 'fs';
import path from 'path';
import {URL} from 'url';
import * as pkg from '../package.json';
// eslint-disable-next-line import/extensions
import type {WebhookConfig} from '../types/discord';
// eslint-disable-next-line import/extensions
import type {GoogleServiceAccount} from '../types/google';
import {Admins} from './constants';
import {baseLogger} from './logging/logger';
import escapeStringRegExp = require('escape-string-regexp');

dotenv.config({path: path.join(__dirname, '..', 'bot.env')});

/** Whether or not the bot is running in a production environment. */
export const runningInProduction = process.env.NODE_ENV === 'production';

/** Whether or not the bot is running in a CI environment. */
export const runningInCI = Boolean(process.env.CI);

/** Array of Discord user IDs for owners of the bot. */
export const owners: Snowflake[] = [Admins.PizzaFox, Admins.OverCoder];

/** Discord bot token. */
export const discordToken = process.env.DISCORD_TOKEN;

/**
 * The default prefix to use for commands.
 */
export const defaultPrefix = '$$';

/**
 * Sentry DSN.
 * @see https://docs.sentry.io/error-reporting/quickstart/?platform=node#configure-the-sdk
 */
export const sentryDSN = process.env.SENTRY_DSN;

/**
 * Discoin virtual currency exchange info.
 */
export const discoin = {
	token: process.env.DISCOIN_TOKEN,
	currencyID: 'OAT'
};

/** Webhook used for when the bot becomes ready in production mode. */
export const readyWebhook: Partial<WebhookConfig> = {
	id: process.env.READY_WEBHOOK_ID,
	token: process.env.READY_WEBHOOK_TOKEN
};

/** Plaintext password used for veryifying request authenticity from top.gg. */
export const topGGWebhookPassword = process.env.TOP_GG_WEBHOOK_PASSWORD;

/** Absolute path to a Google Cloud Platform service account. */
export const googleAppCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// A base config to use for Google Cloud libraries
export const googleBaseConfig = {
	projectId: 'dice-discord',
	serviceContext: {version: pkg?.version ?? process.env.npm_package_version}
};

/** The InfluxDB DSN. */
export const influxDSN = process.env.INFLUXDB_DSN;

// Discord tokens are separated by `.`s into 3 base64-encoded parts.
// 1. Bot ID
// 2. Token creation time
// 3. HMAC
// Parts 2 and 3 are sensitive information
const disassembledToken = discordToken?.split('.') ?? [];

/** Token for the no-fly-list (NFL) API. */
export const nflApiToken = process.env.NFL_API_TOKEN;

/** Token for the AirNow API. */
export const airNowApiToken = process.env.AIR_NOW_API_TOKEN;

/** An array of sensitive strings (ex. API keys) that shouldn't be shown in logs or in messages. */
export const secrets: string[] = [];

// Only mark the secret parts of a Discord token as secrets
if (disassembledToken.length === 3) {
	secrets.push(disassembledToken[1], disassembledToken[2]);
}

/** The PostgreSQL database URI in a URL object, if it's present in the environment. */
export const postgresURI = process.env.POSTGRES_URI ? new URL(process.env.POSTGRES_URI) : undefined;

/** The InfluxDB DSN in a URL object, if it's present in the environment. */
const influxURL = influxDSN ? new URL(influxDSN) : undefined;

[discoin.token, topGGWebhookPassword, sentryDSN, postgresURI?.password, influxURL?.password, readyWebhook.token, nflApiToken, airNowApiToken].forEach(
	secret => {
		if (secret) {
			secrets.push(escapeStringRegExp(secret));
		}
	}
);

if (googleAppCredentials) {
	fs.readFile(googleAppCredentials)
		// eslint-disable-next-line promise/prefer-await-to-then
		.then(file => secrets.push(escapeStringRegExp((JSON.parse(file.toString()) as GoogleServiceAccount).private_key)))
		.catch(error => {
			baseLogger.scope('config').error('Failed to load GCP service account JSON', error);
		});
}
