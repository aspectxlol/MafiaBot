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
		const select = new UserSelectMenuBuilder()
			.setCustomId('users')
			.setDefaultUsers([`${interaction.user.id}`])
			.setMinValues(3)
			.setMaxValues(20)
		
		const row = new ActionRowBuilder<UserSelectMenuBuilder>()
			.addComponents(select)
		
		const collector = interaction.channel?.createMessageComponentCollector({
			filter: (collected) => collected.isUserSelectMenu() && collected.customId === 'users',
			time: 30000
		});

    const repliedMessage = await interaction.reply({ content: 'add members', components: [row]})

		collector?.on('collect', async (collectedInteraction: UserSelectMenuInteraction) => {
			if (collectedInteraction.user.id !== interaction.user.id) {
				return;
			}
			await collectedInteraction.deferUpdate();
			
			const YesButton = new ButtonBuilder()
				.setLabel('Yes')
				.setCustomId('yes')
				.setStyle(ButtonStyle.Success)

			const NoButton = new ButtonBuilder()
				.setLabel('No')
				.setCustomId('no')
				.setStyle(ButtonStyle.Danger)

			const yesnorow = new ActionRowBuilder<ButtonBuilder>()
				.addComponents([
					YesButton,
					NoButton
				])
			
			const message = await interaction.channel?.send({ content: 'Are you Sure?', components: [yesnorow] })
		
			const collector2 = interaction.channel?.createMessageComponentCollector({
				filter: (collected) => collected.isButton() && (collected.customId === 'yes' || collected.customId === 'no'),
				time: 5000
			});

			collector2?.on('collect', (buttonInteraction) => {
				if (buttonInteraction.customId === 'yes') {
					message?.delete()
					StartGame(collectedInteraction.users, interaction, db, repliedMessage)
					collector2.stop()
					collector.stop()
				} else if (buttonInteraction.customId === 'no') {
					message?.delete()
				}
			})

			collector2?.on('end', () => {
				
			})
		});

		collector?.on('end', () => {
			repliedMessage.edit({ content: 'Message Timed out, Restart by doing /start', components: [] })
		})
		
	}
}

export default new Start();


async function StartGame(users: Collection<string, User>, interaction: CommandInteraction, db: QuickDB, repliedMessage: InteractionResponse) {
	try {
		const gameChannel = await interaction.guild?.channels.create({
			name: `${interaction.options.get('title')?.value}`,
			parent: (await interaction.guild.channels.fetch(`${await db.get(`${interaction.guild.id}.CatChannel`)}`)) as CategoryChannel
		})

		repliedMessage.edit({ content: `Created game Channel ${gameChannel?.toString()}`, components: [] })
		const stuff = {
		startEmbed: new EmbedBuilder()
			.setTitle('Hello!')
			.setDescription('i am Mafia Bot, the bot that will be moderating and controlling your game today')
			.addFields([
				{ name: 'members', value: `${users.map((v, k) => v.toString()).join(`, `)}` }
			])
			.setColor('Blue'),
		embed: new EmbedBuilder()
			.setTitle('are you ready?')
			.setColor('Blue'),
		yesnorow: new ActionRowBuilder<ButtonBuilder>()
			.addComponents([
				new ButtonBuilder()
					.setLabel('Yes')
					.setStyle(ButtonStyle.Success)
					.setCustomId('yes'),
				new ButtonBuilder()
					.setLabel('No')
					.setStyle(ButtonStyle.Danger)
					.setCustomId('no'),
			]),
		Roleembed: new EmbedBuilder()
			.setTitle('Choose a role')
			.setColor('Green'),
		RoleSelect: new SelectMenuBuilder()
			.setCustomId('roles')
			.setPlaceholder('Roles')
			.addOptions(
				[
					'Doctor',
					'Detective',
					'Citizen'
				].map((v) => new SelectMenuOptionBuilder().setLabel(v).setValue(v.toLowerCase()).toJSON())
		)}
		await gameChannel?.send({ embeds: [stuff.startEmbed] })

		const message = await gameChannel?.send({ embeds: [stuff.embed], components: [stuff.yesnorow] })

		const collector = message?.channel.createMessageComponentCollector({
			filter: (collected) => collected.isButton() && (collected.customId === 'yes' || collected.customId === 'no'),
			time: 120000 // Optional: Set a timeout in milliseconds (15 seconds here)
		});

		let yesCount = 0; // Initialize yes count

		collector?.on('collect', async (collectedInteraction) => {
			if (collectedInteraction.customId === 'yes') {
				yesCount++;
				// await collectedInteraction.deferUpdate(); // Acknowledge interaction

				if (yesCount === users.size) {
					collector.stop(); // Stop collecting further votes

					const roleEmbed = new EmbedBuilder()
						.setTitle('Choose a role')
						.setColor('Green');

					const roleSelect = new SelectMenuBuilder()
						.setCustomId('roles')
						.setPlaceholder('Roles')
						.addOptions(
							[
								'Doctor',
								'Detective',
								'Citizen'
							].map((v) => new SelectMenuOptionBuilder().setLabel(v).setValue(v.toLowerCase()).toJSON())
						);

					await message?.edit({ embeds: [roleEmbed], components: [new ActionRowBuilder<SelectMenuBuilder>().addComponents(roleSelect)] });
				} else {
					const updatedEmbed = stuff.embed.setDescription(`**${yesCount}** out of **${users.size}** players are ready.`);
					await message?.edit({ embeds: [updatedEmbed], components: [stuff.yesnorow] });
					}
			} else {
				//add the action for no
				collector.stop()

				const cancelEmbed = new EmbedBuilder()
					.setTitle('Game Canceled')
					.setDescription('One of you fuckers pressed the no button.\nif you wish to restart, try /start')
					.setColor('Red')
				
				message?.edit({ embeds: [cancelEmbed], components: [] })
			}
		});

		collector?.on('end', async (collected, reason) => {
			console.log(`Collector ended: ${reason}`);

			if (reason === 'time') {
				// Handle timeout scenario (optional)
				const updatedEmbed = stuff.embed.setDescription('Voting timed out.');
				await message?.edit({ embeds: [updatedEmbed], components: [] }); // Remove buttons
			}
		});
	} catch (error) {
		console.error('Error creating game channel:', error);
		// Handle error gracefully (e.g., inform user, log error)
	}
}