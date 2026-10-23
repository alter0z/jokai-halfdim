/**
 * Jokai bot entry point
 *
 * discord.js client with command/interaction handlers
 */

import { Client, GatewayIntentBits, Collection } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

declare global {
  namespace Express {
    interface Application {
      discordClient: Client;
    }
  }
}

// TODO: Load commands and interactions
// TODO: Set up event listeners
// TODO: Load jobs (timers)

client.on('ready', () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  if (client.user) {
    client.user.setActivity('for /price', { type: 'WATCHING' });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) {
    return;
  }

  try {
    // TODO: Route to command/interaction handlers
    console.log(`Received interaction: ${interaction.id}`);
  } catch (error) {
    console.error('Error handling interaction:', error);
  }
});

// Login and start bot
async function start() {
  try {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN not set in .env');
    }

    await client.login(token);
    console.log('Bot started successfully');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch(console.error);
}

export default client;
