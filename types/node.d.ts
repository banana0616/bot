declare namespace NodeJS {
	export interface ProcessEnv {
		DISCORD_TOKEN?: string;
		SENTRY_DSN?: string;
		DISCOIN_TOKEN?: string;
		READY_WEBHOOK_ID?: string;
		READY_WEBHOOK_TOKEN?: string;
		TOP_GG_WEBHOOK_PASSWORD?: string;
	}
}