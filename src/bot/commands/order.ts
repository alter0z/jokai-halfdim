/**
 * Discord Bot Order Commands: /order, /status, /cancel
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { canTransition } from '@/core/orders';

const prisma = new PrismaClient();

export const orderCommands = [
  new SlashCommandBuilder()
    .setName('order')
    .setDescription('Create a new piloting order'),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check the status of your piloting order')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Order code (e.g. JK-A7B2)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('cancel')
    .setDescription('Cancel your pending order')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Order code to cancel')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for cancellation')
        .setRequired(false)
    ),
];

/**
 * Handle /order command
 */
export async function handleOrderCommand(interaction: ChatInputCommandInteraction) {
  // Check if customer is blocked
  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });

  if (user?.blocked) {
    await interaction.reply({
      content: `❌ You cannot place orders at this time. Reason: ${user.blockReason || 'Account suspended'}`,
      ephemeral: true,
    });
    return;
  }

  // Check shop status
  const shopSetting = await prisma.setting.findUnique({
    where: { key: 'shop_status' },
  });
  if (shopSetting && (shopSetting.value as any)?.isOpen === false) {
    await interaction.reply({
      content: '🛑 The piloting shop is currently closed. Please check back later!',
      ephemeral: true,
    });
    return;
  }

  // Display initial service selection
  const services = await prisma.service.findMany({
    where: { active: true, archivedAt: null },
    orderBy: { sort: 'asc' },
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('order_select_service')
    .setPlaceholder('Choose a service to begin your order...')
    .addOptions(
      services.map(s => ({
        label: s.name,
        description: s.description || '',
        value: s.key,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: '🛒 **Start a New Piloting Order**\nSelect a service below to add items to your cart:',
    components: [row],
    ephemeral: true,
  });
}

/**
 * Handle /status command
 */
export async function handleStatusCommand(interaction: ChatInputCommandInteraction) {
  const code = interaction.options.getString('code');

  if (code) {
    const order = await prisma.order.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        orderItems: true,
        customer: true,
      },
    });

    if (!order) {
      await interaction.reply({
        content: `❌ Order \`${code}\` not found.`,
        ephemeral: true,
      });
      return;
    }

    // Only allow customer who owns it or admin to view
    if (order.customer.discordId !== interaction.user.id && order.customer.role !== 'ADMIN') {
      await interaction.reply({
        content: '❌ You do not have permission to view this order.',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 Order Status: ${order.code}`)
      .setColor(0x5865f2)
      .addFields(
        { name: 'Status', value: `\`${order.status}\``, inline: true },
        { name: 'Server', value: order.server || 'N/A', inline: true },
        { name: 'UID', value: order.uid || 'N/A', inline: true },
        {
          name: 'Items',
          value: order.orderItems.map(i => `• ${i.copiedName} (x${i.qty})`).join('\n') || 'None',
        },
        {
          name: 'Total Amount',
          value: `Rp${(order.finalTotal || order.quoteTotal).toLocaleString('id-ID')}`,
          inline: true,
        }
      )
      .setFooter({ text: `Created at ${new Date(order.createdAt).toLocaleString('id-ID')}` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // If no code provided, list all active orders for this user
  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
    include: {
      orders: {
        where: {
          status: {
            notIn: ['COMPLETED', 'CANCELLED', 'DECLINED'],
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user || user.orders.length === 0) {
    await interaction.reply({
      content: 'You have no active orders. Use `/price` or `/order` to place one!',
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📋 Your Active Orders')
    .setColor(0x5865f2)
    .setDescription(
      user.orders
        .map(
          o =>
            `• **${o.code}** — \`${o.status}\` · Rp${(o.finalTotal || o.quoteTotal).toLocaleString('id-ID')}`
        )
        .join('\n')
    )
    .setFooter({ text: 'Use /status code:<CODE> for detailed view' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle /cancel command
 */
export async function handleCancelCommand(interaction: ChatInputCommandInteraction) {
  const code = interaction.options.getString('code', true).toUpperCase();
  const reason = interaction.options.getString('reason') || 'Cancelled by customer';

  const order = await prisma.order.findUnique({
    where: { code },
    include: { customer: true },
  });

  if (!order) {
    await interaction.reply({
      content: `❌ Order \`${code}\` not found.`,
      ephemeral: true,
    });
    return;
  }

  if (order.customer.discordId !== interaction.user.id) {
    await interaction.reply({
      content: '❌ You can only cancel your own orders.',
      ephemeral: true,
    });
    return;
  }

  if (!canTransition(order.status, 'CANCELLED')) {
    await interaction.reply({
      content: `❌ Cannot cancel order in \`${order.status}\` status. Please contact admin if piloting has already begun.`,
      ephemeral: true,
    });
    return;
  }

  // Cancel order & purge any credentials
  await prisma.$transaction(async tx => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: 'CANCELLED',
        note: `Cancelled by customer: ${reason}`,
      },
    });

    await tx.accountAccess.updateMany({
      where: { orderId: order.id },
      data: {
        ciphertext: '',
        iv: '',
        tag: '',
        purgedAt: new Date(),
      },
    });
  });

  await interaction.reply({
    content: `✅ Order \`${order.code}\` has been cancelled. Any stored credentials have been purged immediately.`,
    ephemeral: true,
  });
}
