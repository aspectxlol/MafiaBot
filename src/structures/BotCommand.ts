import { QuickDB } from 'quick.db';
import Bot from './Bot';
import { CommandInteraction, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';

export default abstract class BotCommand {
	data: RESTPostAPIApplicationCommandsJSONBody;
	constructor(data: RESTPostAPIApplicationCommandsJSONBody) {
		this.data = data;
	}

	public abstract execute(
		interaction: CommandInteraction,
		client: Bot,
		db: QuickDB
	): Promise<any>;
}