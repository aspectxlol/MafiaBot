import BotCommand from '../../structures/BotCommand';
import bot from '../../structures/Bot';
import {
  ChannelType,
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { QuickDB } from 'quick.db';

class Setup extends BotCommand {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName('setup')
        .setDescription('adwadasdafawfag')
        .addChannelOption((opt) => 
          opt
            .setName('category')
            .setDescription('the category where games will be made')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
				.toJSON()
		);
	}

	public async execute(interaction: CommandInteraction, client: bot, db: QuickDB) {
    console.log(interaction.options.get('category')?.channel?.id)
    db.set(`${interaction.guild?.id}.CatChannel`, `${interaction.options.get('category')?.channel?.id}`)
    return await interaction.reply('Setup Done!')
	}
}

export default new Setup();