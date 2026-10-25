/**
 * Jokai Halfdim Discord Bot
 *
 * Full interaction routing, commands registration, and outbox queue polling.
 */

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from 'discord.js';
import { commands as priceCommands, handlePriceCommand, handlePriceListCommand, handleBuildCommand } from '@/bot/commands/price';
import { guideCommand, handleGuideCommand, handleGuideSelect } from '@/bot/commands/guide';
import { orderCommands, handleOrderCommand, handleStatusCommand, handleCancelCommand } from '@/bot/commands/order';
import { adminCommands, handleSetupOrderChannel } from '@/bot/commands/admin';
import {
  handleServiceSelect,
  handleRegionSelect,
  handleExplorationAreasSelect,
  handleExplorationModalSubmit,
  handleItemsSelect,
  handleCheckout,
  handleArchonQuestPage,
  handleMaterialPage,
  userCarts,
  sendOrderToChannel,
} from '@/bot/interactions/order';
import { prisma } from '@/bot/interactions/order';
import { canTransition } from '@/core/orders';
import { processOutbox } from '@/bot/jobs/outbox';
import { checkOverdueOrders } from '@/bot/jobs/overdue';

export const allCommands = [
  ...priceCommands,
  guideCommand.toJSON(),
  ...orderCommands.map(c => c.toJSON()),
  ...adminCommands.map(c => c.toJSON()),
];

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

client.on('ready', async () => {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);
  if (client.user) {
    client.user.setActivity('Genshin Piloting (/price)', { type: 3 }); // WATCHING
  }

  // Register slash commands upon startup
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  if (token && clientId) {
    try {
      const rest = new REST({ version: '10' }).setToken(token);
      if (guildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: allCommands });
        console.log(`[Bot] Successfully registered ${allCommands.length} slash commands to guild ${guildId}`);
      } else {
        await rest.put(Routes.applicationCommands(clientId), { body: allCommands });
        console.log(`[Bot] Successfully registered ${allCommands.length} global slash commands.`);
      }
    } catch (err) {
      console.error('[Bot] Failed to register slash commands:', err);
    }
  }

  // Start background outbox polling every 5 seconds
  setInterval(() => {
    processOutbox(client).catch(err => console.error('[Outbox] Error:', err));
  }, 5000);

  // Start overdue orders check every 60 seconds
  setInterval(() => {
    checkOverdueOrders(client).catch(err => console.error('[OverdueJob] Error:', err));
  }, 60000);
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      if (commandName === 'price') await handlePriceCommand(interaction);
      else if (commandName === 'price-list') await handlePriceListCommand(interaction);
      else if (commandName === 'build') await handleBuildCommand(interaction);
      else if (commandName === 'guide') await handleGuideCommand(interaction);
      else if (commandName === 'order') await handleOrderCommand(interaction);
      else if (commandName === 'status') await handleStatusCommand(interaction);
      else if (commandName === 'cancel') await handleCancelCommand(interaction);
      else if (commandName === 'setup-order-channel') await handleSetupOrderChannel(interaction);
    } else if (interaction.isStringSelectMenu()) {
      const { customId } = interaction;
      if (customId === 'guide_menu') await handleGuideSelect(interaction);
      else if (customId === 'price_select_service' || customId === 'order_select_service') await handleServiceSelect(interaction);
      else if (customId === 'price_select_region') await handleRegionSelect(interaction);
      else if (customId === 'price_select_exploration_areas') await handleExplorationAreasSelect(interaction);
      else if (customId === 'price_select_items') await handleItemsSelect(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_exploration_percents:')) {
        await handleExplorationModalSubmit(interaction);
      } else if (interaction.customId.startsWith('modal_decline_order:')) {
        const orderId = interaction.customId.split(':')[1];
        await handleDeclineOrder(interaction, orderId);
      }
    } else if (interaction.isButton()) {
      // Handle Archon Quest pagination
      if (interaction.customId.startsWith('archon_quest_page:')) {
        const page = parseInt(interaction.customId.split(':')[1], 10);
        await handleArchonQuestPage(interaction, page);
        return;
      }

      // Handle Material pagination
      if (interaction.customId.startsWith('material_page:')) {
        const page = parseInt(interaction.customId.split(':')[1], 10);
        await handleMaterialPage(interaction, page);
        return;
      }

      // Handle admin order actions
      if (interaction.customId.startsWith('admin_accept:') || interaction.customId.startsWith('admin_decline:')) {
        const [action, orderId] = interaction.customId.split(':');
        await handleAdminOrderAction(action, orderId, interaction);
        return;
      }

      if (interaction.customId === 'cart_checkout') {
        await handleCheckout(interaction);
      } else if (interaction.customId === 'cart_clear') {
        userCarts.delete(interaction.user.id);
        await interaction.update({ content: '🛒 Cart cleared.', embeds: [], components: [] });
      }
    }
  } catch (error) {
    console.error('[Bot] Error handling interaction:', error);
    if (interaction.isRepliable()) {
      const msg = { content: '❌ An error occurred processing this request.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  }
});

// Standalone runner if executed directly
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const token = process.env.DISCORD_TOKEN;
  if (token) {
    client.login(token);
  }
}

/**
 * Handle admin accept/decline order button clicks
 */
async function handleAdminOrderAction(
  action: string,
  orderId: string,
  interaction: ButtonInteraction
) {
  // Check if user has admin permissions
  if (!interaction.memberPermissions?.has('Administrator')) {
    await interaction.reply({
      content: '❌ You need Administrator permissions to manage orders.',
      ephemeral: true,
    });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, orderItems: true },
  });

  if (!order) {
    await interaction.reply({
      content: `❌ Order not found: ${orderId}`,
      ephemeral: true,
    });
    return;
  }

  if (action === 'admin_accept') {
    if (!canTransition(order.status, 'ACCEPTED')) {
      await interaction.reply({
        content: `❌ Cannot accept order in \`${order.status}\` status.`,
        ephemeral: true,
      });
      return;
    }

    await prisma.$transaction(async tx => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'ACCEPTED' },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'ACCEPTED',
          note: `Accepted by ${interaction.user.tag}`,
        },
      });
    });

    await interaction.reply({
      content: `✅ Order \`${order.code}\` has been accepted!`,
      ephemeral: true,
    });

    // Send notification to customer
    try {
      if (order.customer.discordId) {
        const customer = interaction.client.users.cache.get(order.customer.discordId);
        if (customer) {
          await customer.send({
            embeds: [
              new EmbedBuilder()
                .setTitle('✅ Order Accepted!')
                .setColor(0x00ae86)
                .setDescription(`Your order **${order.code}** has been accepted by an admin.`)
                .addFields({ name: 'Total', value: `Rp${order.quoteTotal.toLocaleString('id-ID')}` })
                .setFooter({ text: 'Please submit your credentials via the secure link sent earlier.' }),
            ],
          });
        }
      }
    } catch (err) {
      console.error('[Bot] Failed to notify customer:', err);
    }
  } else if (action === 'admin_decline') {
    if (!canTransition(order.status, 'DECLINED')) {
      await interaction.reply({
        content: `❌ Cannot decline order in \`${order.status}\` status.`,
        ephemeral: true,
      });
      return;
    }

    // Add a modal to get decline reason
    const reasonModal = new ModalBuilder()
      .setCustomId(`modal_decline_order:${order.id}`)
      .setTitle('Decline Order Reason');

    const reasonInput = new TextInputBuilder()
      .setCustomId('decline_reason_input')
      .setLabel('Reason for declining')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Please explain why this order is being declined...');

    reasonModal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
    );

    await interaction.showModal(reasonModal);
  }
}

/**
 * Handle order decline with reason modal
 */
async function handleDeclineOrder(interaction: ModalSubmitInteraction, orderId: string) {
  const reason = interaction.fields.getTextInputValue('decline_reason_input');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, orderItems: true },
  });

  if (!order) {
    await interaction.reply({
      content: `❌ Order not found: ${orderId}`,
      ephemeral: true,
    });
    return;
  }

  await prisma.$transaction(async tx => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'DECLINED' },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'DECLINED',
        note: `Declined by ${interaction.user.tag}: ${reason}`,
      },
    });
  });

  await interaction.reply({
    content: `❌ Order \`${order.code}\` has been declined.`,
    ephemeral: true,
  });

  // Send notification to customer
  try {
    if (order.customer.discordId) {
      const customer = interaction.client.users.cache.get(order.customer.discordId);
      if (customer) {
        await customer.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('❌ Order Declined')
              .setColor(0xff4757)
              .setDescription(`Your order **${order.code}** has been declined by an admin.`)
              .addFields({
                name: 'Reason',
                value: reason
              })
              .setFooter({ text: 'Please contact an admin if you have questions.' }),
          ],
        });
      }
    }
  } catch (err) {
    console.error('[Bot] Failed to notify customer:', err);
  }
}

// Re-export prisma and canTransition for the handler
export { prisma, canTransition };
export default client;
