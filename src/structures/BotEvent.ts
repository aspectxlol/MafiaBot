import Bot from './Bot';
import { ClientEvents } from 'discord.js';

export default abstract class BotEvent {
	client: Bot;
	constructor(client: Bot) {
		this.client = client;
	}

	public abstract execute(...args: any[]): Promise<any>;
}