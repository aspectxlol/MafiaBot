import BotEvent from '../structures/BotEvent';
import { CacheType, Interaction, EmbedBuilder } from 'discord.js';
import Bot from '../structures/Bot';
import { QuickDB } from 'quick.db';

export default class CommandInteraction extends BotEvent {
	constructor(client: Bot) {
		super(client);
	}

	public async execute( db: QuickDB, interaction: Interaction<CacheType>): Promise<any> {
		if (!interaction.isCommand()) return;
		const command = this.client.commands.get(
			interaction.commandName.toString()
		);

		if (!command) return;

		try {
			command?.execute(interaction, this.client, db);
		} catch (e) {
			console.log('e')
			if (e instanceof Error) {
				const embed = new EmbedBuilder()
					.setTitle(`${e.name}`)
					.setDescription(e.message);

				interaction.reply({ embeds: [embed], ephemeral: true });
			}
		}
	}
}