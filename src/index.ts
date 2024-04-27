import { Client, Partials } from 'discord.js'
import 'dotenv/config'
import Ready from './events/Ready';
import CommandInteraction from './events/CommandInteraction';
import Bot from './structures/Bot';
import { QuickDB } from 'quick.db'

const client = new Bot({
  intents: [
    'Guilds',
    'GuildMembers',
    'MessageContent',
    'GuildMessages',
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.User
  ]
})

const db = new QuickDB({ filePath: `${__dirname}/database/db.sqlite` })

client.once('ready', () => { new Ready(client).execute(); });
client.on('interactionCreate', (interaction) => { new CommandInteraction(client).execute( db, interaction); });

client.login(process.env.DISCORD_TOKEN)