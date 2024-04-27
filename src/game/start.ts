import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, Embed, EmbedBuilder, SelectMenuBuilder, SelectMenuOptionBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel, User } from "discord.js";
import { QuickDB } from "quick.db";

export default async function Start(gameChannel: TextChannel, interaction: CommandInteraction, db: QuickDB, users: User[]) {
  const InitialStuff = {
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
		RoleSelect: new StringSelectMenuBuilder()
			.setCustomId('roles')
			.setPlaceholder('Roles')
			.addOptions(
				[
					'Doctor',
					'Detective',
					'Citizen'
				].map((v) => new StringSelectMenuOptionBuilder().setLabel(v).setValue(v.toLowerCase()).toJSON())
    )
  }
  
  
  let yesAmount = 0;

  await gameChannel.send({ embeds: [InitialStuff.startEmbed] })

	const ReadyMessage = await gameChannel?.send({ embeds: [InitialStuff.embed], components: [InitialStuff.yesnorow] })

  const YesNoCollector = ReadyMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (collected) => collected.customId === 'yes' || collected.customId === 'no'
  })

  YesNoCollector.on('collect', async (YesNoCollectedInteraction) => {
    if (YesNoCollectedInteraction.customId === 'yes') {
      YesNoCollectedInteraction.deferUpdate()
      // if (!(users.find((user) => user.id === YesNoCollectedInteraction.user.id))) return;
      // console.log(!(users.find((user) => user.id === YesNoCollectedInteraction.user.id)))
      yesAmount += 1 
      if (yesAmount === (users.length + 1)) {
        YesNoCollector.stop();
        await ReadyMessage.edit({ embeds: [new EmbedBuilder().setTitle('Everyone is Ready').setColor('Green')] })
        await gameChannel.send({ content: 'Please Pick a role', components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(InitialStuff.RoleSelect)] })
      } else {
        const updatedEmbed = InitialStuff.embed.setDescription(`**${yesAmount}** out of **${users.length}** players are ready.`);
        await ReadyMessage?.edit({ embeds: [updatedEmbed], components: [InitialStuff.yesnorow] });
      } 
    } else if (YesNoCollectedInteraction.customId === 'no') {
      YesNoCollectedInteraction.deferUpdate()
      const noEmbed = new EmbedBuilder().setTitle('one of you fuckers clicked on the no button').setColor('Red')
      await ReadyMessage.edit({ embeds: [noEmbed], content: '' })
    }

    YesNoCollector.on('end', async (collected, reason) => {
			if (reason === 'time') {
				const updatedEmbed = InitialStuff.embed.setDescription('Voting timed out.');
				await ReadyMessage?.edit({ embeds: [updatedEmbed], components: [] });
			}
    })
  })
}