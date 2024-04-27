import { ActionRowBuilder, UserSelectMenuBuilder } from "@discordjs/builders";
import { ButtonBuilder, ButtonStyle, CategoryChannel, Collection, CommandInteraction, ComponentType, TextChannel } from "discord.js";
import { QuickDB } from "quick.db";
import Start from "./start";

export default async function Setup(interaction: CommandInteraction, db: QuickDB) {
  const stuff = {
    UserSelectRow: new ActionRowBuilder<UserSelectMenuBuilder>()
      .addComponents([
        new UserSelectMenuBuilder()
          .setCustomId('users')
          .setDefaultUsers([`${interaction.user.id}`])
          .setMinValues(3)
          .setMaxValues(20)
      ]),
  }

  const UserSelectCollector = interaction.channel?.createMessageComponentCollector({
    componentType: ComponentType.UserSelect,
    filter: (collected) => collected.customId === 'users',
    time: 30000
  })

  const RepliedMessage = await interaction.reply({ content: 'Add Members to a Game', components: [stuff.UserSelectRow] })

  UserSelectCollector?.on('collect', async (UserSelectCollectedInteraction) => {
    if (UserSelectCollectedInteraction.user.id !== interaction.user.id) return
    await UserSelectCollectedInteraction.deferUpdate()

    const UserSelectCollectedStuff = {
      yesnorow: new ActionRowBuilder<ButtonBuilder>()
        .addComponents([
          new ButtonBuilder()
            .setLabel('Yes')
            .setCustomId('yes')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setLabel('No')
            .setCustomId('no')
            .setStyle(ButtonStyle.Danger),
        ])
    }

    const ConformationMssage = await interaction.channel?.send({ content: 'Are you Sure?', components: [UserSelectCollectedStuff.yesnorow] })

    const YesNoCollector = interaction.channel?.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (collected) => collected.customId === 'yes' || collected.customId == 'no',
      time: 5000
    })

    YesNoCollector?.on('collect', async (YesNoCollectedInteraction) => {
      if (YesNoCollectedInteraction.customId === 'yes') {
        ConformationMssage?.delete()
        YesNoCollector.stop()
        UserSelectCollector.stop()

        const gameChannel = await interaction.guild?.channels.create({
          name: `${interaction.options.get('title')?.value}`,
          parent: (await interaction.guild.channels.fetch(`${await db.get(`${interaction.guild.id}.CatChannel`)}`)) as CategoryChannel
        }) as TextChannel

        RepliedMessage.edit({ content: `created game channel ${gameChannel.toString()}` })

        await Start(gameChannel, interaction, db, UserSelectCollectedInteraction.users.map((v) => v))
      } else if (YesNoCollectedInteraction.customId === 'no') {
        ConformationMssage?.delete()
      }
      
      YesNoCollector.on('end', () => {})
    })

    UserSelectCollector.on('end', () => {
      RepliedMessage.edit({ content: 'Timed Out, Try Again /start', components: [] })
    })
  })
}