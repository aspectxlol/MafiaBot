import BotCommand from '../../structures/BotCommand';
import bot from '../../structures/Bot';
import {
	ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
	CollectedInteraction,
	Collection,
	CommandInteraction,
	Embed,
	EmbedBuilder,
	Interaction,
	InteractionCollector,
	InteractionResponse,
	Message,
	SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
	User,
	UserSelectMenuInteraction,
} from 'discord.js';
import { QuickDB } from 'quick.db';
import { ActionRowBuilder, SelectMenuBuilder, SelectMenuOptionBuilder, UserSelectMenuBuilder } from '@discordjs/builders';
import Setup from '../../game/setup';

class Start extends BotCommand {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName('start')
				.setDescription('adwadasdafawfag')
				.addStringOption(opt => opt
					.setName('title')
					.setDescription('channel title')
					.setRequired(true)
				)
				.toJSON()
		);
	}

	public async execute(interaction: CommandInteraction, client: bot, db: QuickDB) {
		await Setup(interaction, db)
	}
}

export default new Start();