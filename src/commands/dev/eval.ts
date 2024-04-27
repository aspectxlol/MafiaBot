import { ActionRowBuilder, ModalSubmitInteraction, CacheType, ChatInputCommandInteraction, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonStyle, ComponentType } from "discord.js";
import Bot from "../../structures/Bot";
import BotCommands from "../../structures/BotCommand";
import { ButtonBuilder } from '@discordjs/builders'
import moment from 'moment'

class Eval extends BotCommands {
    constructor() {
        super(
            new SlashCommandBuilder()
            .setName('eval')
            .setDescription('evaluate some typescript code')
            .addStringOption(option =>
                option.setName("code")
                    .setDescription("If you are going to execute multiline codes leave this option empty.")
                    .setRequired(false)
            )
            .addBooleanOption(option =>
                option.setName("ephemeral")
                    .setDescription("If you want the code executed to be only shown for you select 'True'")
                    .setRequired(false)
            ).toJSON()
        )
    }
    public async execute(interaction: ChatInputCommandInteraction<CacheType>, client: Bot): Promise<any> {
        if(!interaction.options.getString('code')) {
            const modal = new ModalBuilder()
                .setTitle('code')
                .setCustomId(`eval`)
                .addComponents(new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(new TextInputBuilder()
                        .setCustomId('code')
                        .setLabel('Code')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('the code to be executed')
                        .setRequired(true)
                    )
                )
            interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction<CacheType>) => interaction.customId === `eval`
            interaction.awaitModalSubmit({filter: filter, time: 120000}).then(inter => check(inter, inter.fields.getTextInputValue('code')!, false))
        } else {
            check(interaction, interaction.options.getString('code')!, interaction.options.getBoolean('ephmeral') || false)
        }
    }
}

export default new Eval()

export const clean = async (text: string) => {
    if (text && text.constructor.name == "Promise")
        text = await text
    if (typeof text !== "string")
        text = (await import('util')).inspect(text, { depth: 1 })
    text = text
        .replace(/`/g, "`" + String.fromCharCode(8203))
        .replace(/@/g, "@" + String.fromCharCode(8203))
    return text
}

export async function check(interaction: ChatInputCommandInteraction<CacheType> | ModalSubmitInteraction<CacheType>, code: string, ephemeral: boolean){
    const illegalCodes = ["token", "require"]
    const foundIllegals: any[] = []
    for (const icode of illegalCodes){
        if (code.toLowerCase().includes(icode)){
            foundIllegals.push(icode)
        }
    }
    if (foundIllegals.length > 0){
        const embed = new EmbedBuilder()
            .setColor("Red").setTitle("Found illegal codes!").setDescription(`**Illegal codes:** \`${foundIllegals.join(", ")}\`\n\nDo you want to continue executing the code?`)
        const buttons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("yes")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("no")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger)
            )
        const message = await interaction.reply({embeds: [embed], components: [buttons], ephemeral: ephemeral})

        const filter: (i: any) => any = i => {
            i.deferUpdate()
            return i.user.id === interaction.user.id
        }
        
        message.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 30000 })
            .then(inter => {
                if (inter.customId == "yes"){
                    interaction.editReply({components: []})
                    done(interaction, code, ephemeral, true)
                }else {
                    embed.setDescription("You have decided not to execute the code.")
                    interaction.editReply({embeds: [embed], components: []})
                }
            })
            .catch(err => err)
    }else{
        done(interaction, code, ephemeral, false)
    }
}

async function done(interaction: ChatInputCommandInteraction<CacheType> | ModalSubmitInteraction<CacheType>, code: string, ephemeral: boolean, foundIllegals: boolean){
    const embed = new EmbedBuilder()
        .setColor("Yellow").setAuthor({name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL()})
        .setFooter({text: "Executing..."})
    function setEvalEmbedDesc(code:string, result: string){
        embed.setDescription(`__Your current code:__ \`\`\`ts\n${code}\`\`\`\n__Parser Results:__\`\`\`json\n${result}\`\`\``)
    }
    setEvalEmbedDesc(code, "Under Execution...")
    if (foundIllegals == true){
        await interaction.editReply({embeds: [embed]})
    }else{
        await interaction.reply({embeds: [embed], ephemeral: ephemeral}).catch(err => err)
    }
    var tookTime = moment().unix()
    try {
        const evaled = eval(code)
        const result = await clean(evaled)
        if (result.length > 4000){
            embed.setColor("DarkVividPink")
            setEvalEmbedDesc(code, `The result is too long to show because of discord limitations.\nResult length: ${result.length}`)
            return interaction.editReply({embeds: [embed]})
        }
        embed.setColor("Green").setFooter({text: `Took ${moment().unix() - tookTime}ms to execute.`})
        setEvalEmbedDesc(code, result)
        interaction.editReply({embeds: [embed]})
    }catch(err: any){
        embed.setColor("Red").setFooter({text: "An error occured while executing."})
        setEvalEmbedDesc(code, err)
        interaction.editReply({embeds: [embed]})
    }
}