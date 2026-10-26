/**
 * Order Interaction Handlers & Cart Management
 *
 * Handles cart additions, exploration % pop-ups, order placement,
 * and admin Accept/Decline button actions.
 */

import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { quote, CartItem } from '../../core/pricing.js';
import texts from '../texts.js';

const prisma = new PrismaClient();

// In-memory cart store per user (for Discord session before checkout)
export const userCarts = new Map<string, CartItem[]>();

/**
 * Export prisma for use in other modules
 */
export { prisma };

/**
 * Handle service selection
 */
export async function handleServiceSelect(interaction: StringSelectMenuInteraction) {
  const serviceKey = interaction.values[0];

  if (serviceKey === 'exploration') {
    const regions = await prisma.region.findMany({
      where: { active: true, archivedAt: null },
      orderBy: { sort: 'asc' },
    });

    const select = new StringSelectMenuBuilder()
      .setCustomId('price_select_region')
      .setPlaceholder('Choose a region for exploration...')
      .addOptions(
        regions.map(r => ({
          label: r.name,
          value: r.key,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    await interaction.update({ content: texts.price.selectRegion, components: [row] });
  } else if (serviceKey === 'archon_quest') {
    const items = await prisma.catalogItem.findMany({
      where: { serviceKey: 'archon_quest', active: true, archivedAt: null },
      orderBy: { sort: 'asc' },
    });

    // Discord limit: 25 options per menu, so paginate if needed
    const pageSize = 24; // Reserve 1 slot for "Next Page" button if needed
    const totalPages = Math.ceil(items.length / pageSize);

    if (totalPages === 1) {
      const select = new StringSelectMenuBuilder()
        .setCustomId('price_select_items')
        .setPlaceholder('Choose Archon Quests...')
        .setMinValues(1)
        .setMaxValues(Math.min(items.length, 25))
        .addOptions(
          items.map(i => ({
            label: i.name.substring(0, 100),
            value: i.id,
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
      await interaction.update({ content: texts.price.selectItems, components: [row] });
    } else {
      // Show page 1 with navigation
      const page1Items = items.slice(0, pageSize);
      const select = new StringSelectMenuBuilder()
        .setCustomId('price_select_items')
        .setPlaceholder('Choose Archon Quests (Page 1)...')
        .setMinValues(1)
        .setMaxValues(Math.min(page1Items.length, 25))
        .addOptions(
          page1Items.map(i => ({
            label: i.name.substring(0, 100),
            value: i.id,
          }))
        );

      const nextButton = new ButtonBuilder()
        .setCustomId('archon_quest_page:2')
        .setLabel('Next Page →')
        .setStyle(ButtonStyle.Primary);

      const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(nextButton);
      await interaction.update({
        content: `${texts.price.selectItems}\n\n📖 Page 1 of ${totalPages}`,
        components: [row1, row2],
      });
    }
  } else if (serviceKey === 'material') {
    const items = await prisma.catalogItem.findMany({
      where: { serviceKey: 'material', active: true, archivedAt: null },
      orderBy: { sort: 'asc' },
    });

    // Discord limit: 25 options per menu, so paginate if needed
    const pageSize = 24;
    const totalPages = Math.ceil(items.length / pageSize);

    if (totalPages === 1) {
      const select = new StringSelectMenuBuilder()
        .setCustomId('price_select_items')
        .setPlaceholder('Choose material type...')
        .setMinValues(1)
        .setMaxValues(Math.min(items.length, 25))
        .addOptions(
          items.map(i => ({
            label: `${i.name} (Rp${i.price}/item)`,
            value: i.id,
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
      await interaction.update({ content: texts.price.selectItems, components: [row] });
    } else {
      // Show page 1 with navigation
      const page1Items = items.slice(0, pageSize);
      const select = new StringSelectMenuBuilder()
        .setCustomId('price_select_items')
        .setPlaceholder('Choose materials (Page 1)...')
        .setMinValues(1)
        .setMaxValues(Math.min(page1Items.length, 25))
        .addOptions(
          page1Items.map(i => ({
            label: `${i.name} (Rp${i.price}/item)`,
            value: i.id,
          }))
        );

      const nextButton = new ButtonBuilder()
        .setCustomId('material_page:2')
        .setLabel('Next Page →')
        .setStyle(ButtonStyle.Primary);

      const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(nextButton);
      await interaction.update({
        content: `${texts.price.selectItems}\n\n📖 Page 1 of ${totalPages}`,
        components: [row1, row2],
      });
    }
  } else {
    await interaction.update({ content: 'Service coming soon.', components: [] });
  }
}

/**
 * Handle Material pagination button clicks
 */
export async function handleMaterialPage(interaction: ButtonInteraction, page: number) {
  const items = await prisma.catalogItem.findMany({
    where: { serviceKey: 'material', active: true, archivedAt: null },
    orderBy: { sort: 'asc' },
  });

  const pageSize = 24;
  const totalPages = Math.ceil(items.length / pageSize);

  if (page < 1 || page > totalPages) {
    await interaction.update({ content: 'Invalid page.', components: [] });
    return;
  }

  const startIdx = (page - 1) * pageSize;
  const pageItems = items.slice(startIdx, startIdx + pageSize);

  const select = new StringSelectMenuBuilder()
    .setCustomId('price_select_items')
    .setPlaceholder(`Choose materials (Page ${page})...`)
    .setMinValues(1)
    .setMaxValues(Math.min(pageItems.length, 25))
    .addOptions(
      pageItems.map(i => ({
        label: `${i.name} (Rp${i.price}/item)`,
        value: i.id,
      }))
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  // Build navigation buttons
  const navButtons: ButtonBuilder[] = [];
  if (page > 1) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`material_page:${page - 1}`)
        .setLabel('← Previous')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  if (page < totalPages) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`material_page:${page + 1}`)
        .setLabel('Next Page →')
        .setStyle(ButtonStyle.Primary)
    );
  }

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(...navButtons);

  await interaction.update({
    content: `${texts.price.selectItems}\n\n📖 Page ${page} of ${totalPages}`,
    components: [row1, row2],
  });
}

/**
 * Handle Archon Quest pagination button clicks
 */
export async function handleArchonQuestPage(interaction: ButtonInteraction, page: number) {
  const items = await prisma.catalogItem.findMany({
    where: { serviceKey: 'archon_quest', active: true, archivedAt: null },
    orderBy: { sort: 'asc' },
  });

  const pageSize = 24;
  const totalPages = Math.ceil(items.length / pageSize);

  if (page < 1 || page > totalPages) {
    await interaction.update({ content: 'Invalid page.', components: [] });
    return;
  }

  const startIdx = (page - 1) * pageSize;
  const pageItems = items.slice(startIdx, startIdx + pageSize);

  const select = new StringSelectMenuBuilder()
    .setCustomId('price_select_items')
    .setPlaceholder(`Choose Archon Quests (Page ${page})...`)
    .setMinValues(1)
    .setMaxValues(Math.min(pageItems.length, 25))
    .addOptions(
      pageItems.map(i => ({
        label: i.name.substring(0, 100),
        value: i.id,
      }))
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  // Build navigation buttons
  const navButtons: ButtonBuilder[] = [];
  if (page > 1) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`archon_quest_page:${page - 1}`)
        .setLabel('← Previous')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  if (page < totalPages) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`archon_quest_page:${page + 1}`)
        .setLabel('Next Page →')
        .setStyle(ButtonStyle.Primary)
    );
  }

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(...navButtons);

  await interaction.update({
    content: `${texts.price.selectItems}\n\n📖 Page ${page} of ${totalPages}`,
    components: [row1, row2],
  });
}

/**
 * Handle region selection for exploration -> list areas
 */
export async function handleRegionSelect(interaction: StringSelectMenuInteraction) {
  const regionKey = interaction.values[0];

  const areas = await prisma.catalogItem.findMany({
    where: { serviceKey: 'exploration', regionKey, active: true, archivedAt: null },
    orderBy: { sort: 'asc' },
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('price_select_exploration_areas')
    .setPlaceholder('Select areas (pick items)...')
    .setMinValues(1)
    .setMaxValues(Math.min(areas.length, 25))
    .addOptions(
      areas.map(a => ({
        label: a.name.substring(0, 100),
        description: `Rp${a.price.toLocaleString('id-ID')} (0% → 100%)`,
        value: a.id,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  await interaction.update({ content: 'Choose exploration areas:', components: [row] });
}

/**
 * Handle exploration areas selection -> open modal for current %
 */
export async function handleExplorationAreasSelect(interaction: StringSelectMenuInteraction) {
  const selectedAreaIds = interaction.values;
  const areas = await prisma.catalogItem.findMany({
    where: { id: { in: selectedAreaIds } },
  });

  const modal = new ModalBuilder()
    .setCustomId(`modal_exploration_percents:${selectedAreaIds.join(',')}`)
    .setTitle('Enter Current Percentage (%)');

  const defaultText = areas.map(a => `${a.name} = 0`).join('\n');

  const input = new TextInputBuilder()
    .setCustomId('exploration_percents_input')
    .setLabel('Current % per area (e.g. Area = 63)')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(defaultText.substring(0, 4000))
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  await interaction.showModal(modal);
}

/**
 * Handle Exploration Modal Submit
 */
export async function handleExplorationModalSubmit(interaction: ModalSubmitInteraction) {
  const customId = interaction.customId;
  const areaIds = customId.replace('modal_exploration_percents:', '').split(',');
  const input = interaction.fields.getTextInputValue('exploration_percents_input');

  const areas = await prisma.catalogItem.findMany({
    where: { id: { in: areaIds } },
  });

  const lines = input.split('\n');
  const percentMap: Record<string, number> = {};

  for (const line of lines) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim().toLowerCase();
      const pct = parseInt(parts[1].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(pct)) {
        percentMap[name] = Math.min(100, Math.max(0, pct));
      }
    }
  }

  // Get or initialize user's cart
  const cart = userCarts.get(interaction.user.id) || [];

  for (const area of areas) {
    const stated = percentMap[area.name.toLowerCase()] ?? 0;
    cart.push({
      catalogItemId: area.id,
      qty: 1,
      statedPercent: stated,
    });
  }

  userCarts.set(interaction.user.id, cart);
  await renderCartQuote(interaction, cart);
}

/**
 * Handle general item selection (Archon quest, materials)
 */
export async function handleItemsSelect(interaction: StringSelectMenuInteraction) {
  const itemIds = interaction.values;
  const items = await prisma.catalogItem.findMany({
    where: { id: { in: itemIds } },
  });

  // Show modal to input quantities for each item
  const modal = new ModalBuilder()
    .setCustomId(`modal_item_quantities:${itemIds.join(',')}`)
    .setTitle('Enter Quantities');

  const defaultText = items.map(i => `${i.name} = 1`).join('\n');

  const input = new TextInputBuilder()
    .setCustomId('item_quantities_input')
    .setLabel('Quantity per item (e.g. Item Name = 5)')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(defaultText.substring(0, 4000))
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  await interaction.showModal(modal);
}

/**
 * Handle item quantities modal submit
 */
export async function handleItemQuantitiesSubmit(interaction: ModalSubmitInteraction) {
  const customId = interaction.customId;
  const itemIds = customId.replace('modal_item_quantities:', '').split(',');
  const input = interaction.fields.getTextInputValue('item_quantities_input');

  const items = await prisma.catalogItem.findMany({
    where: { id: { in: itemIds } },
  });

  const lines = input.split('\n');
  const quantityMap: Record<string, number> = {};

  for (const line of lines) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim().toLowerCase();
      const qty = parseInt(parts[1].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(qty) && qty > 0) {
        quantityMap[name] = qty;
      }
    }
  }

  // Get or initialize user's cart
  const cart = userCarts.get(interaction.user.id) || [];

  for (const item of items) {
    const stated = quantityMap[item.name.toLowerCase()] ?? 1;
    cart.push({
      catalogItemId: item.id,
      qty: Math.max(1, stated),
    });
  }

  userCarts.set(interaction.user.id, cart);
  await renderCartQuote(interaction, cart);
}

/**
 * Handle continue shopping (add more items)
 */
export async function handleContinueShopping(interaction: ButtonInteraction) {
  const services = await prisma.service.findMany({
    where: { active: true, archivedAt: null },
    orderBy: { sort: 'asc' },
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('order_select_service')
    .setPlaceholder('Choose a service to add more items...')
    .addOptions(
      services.map(s => ({
        label: s.name,
        description: s.description || '',
        value: s.key,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.update({
    content: '🛒 **Add More Items**\nSelect another service below to add items to your cart:',
    embeds: [],
    components: [row],
  });
}

/**
 * Render Cart & Quote Embed
 */
export async function renderCartQuote(
  interaction: StringSelectMenuInteraction | ModalSubmitInteraction | ButtonInteraction,
  cart: CartItem[]
) {
  const catalog = await prisma.catalogItem.findMany({
    where: { active: true, archivedAt: null },
  });

  const catalogItems = catalog.map(c => ({
    id: c.id,
    serviceKey: c.serviceKey,
    name: c.name,
    price: c.price,
    pricingType: c.pricingType as any,
    minCharge: c.minCharge || undefined,
    active: c.active,
  }));

  const quoteResult = quote(cart, catalogItems);

  const embed = new EmbedBuilder()
    .setTitle('🛒 Your Piloting Cart & Quote')
    .setColor(0x5865f2)
    .setDescription(
      quoteResult.lines
        .map(
          l =>
            `• **${l.name}** x${l.qty}: Rp${l.unitPrice.toLocaleString('id-ID')} × ${l.qty} = Rp${l.totalPrice.toLocaleString('id-ID')} ${
              l.statedPercent !== undefined ? `(${l.statedPercent}% → 100%)` : ''
            }`
        )
        .join('\n') || 'Cart is empty.'
    )
    .addFields({
      name: 'Total Estimate',
      value: `**Rp${quoteResult.total.toLocaleString('id-ID')}**`,
    })
    .setFooter({ text: 'Customer payment is made AFTER work completion.' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('cart_continue_shopping')
      .setLabel('➕ Add More Items')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('cart_checkout')
      .setLabel('Submit Order (Place in Queue)')
      .setStyle(ButtonStyle.Success)
      .setDisabled(quoteResult.lines.length === 0),
    new ButtonBuilder()
      .setCustomId('cart_clear')
      .setLabel('Clear Cart')
      .setStyle(ButtonStyle.Danger)
  );

  if ('update' in interaction) {
    await interaction.update({ content: '', embeds: [embed], components: [row] });
  } else {
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
}

/**
 * Handle Order Checkout / Submit
 */
export async function handleCheckout(interaction: ButtonInteraction) {
  const cart = userCarts.get(interaction.user.id);
  if (!cart || cart.length === 0) {
    await interaction.reply({ content: 'Your cart is empty!', ephemeral: true });
    return;
  }

  // Ensure user exists in database
  let user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        discordId: interaction.user.id,
        username: interaction.user.username,
      },
    });
  }

  if (user.blocked) {
    await interaction.reply({
      content: `❌ Your account is blocked: ${user.blockReason || 'Suspended'}`,
      ephemeral: true,
    });
    return;
  }

  // Generate unique order code: JK-XXXX
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'JK-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const catalog = await prisma.catalogItem.findMany();
  const catalogItems = catalog.map(c => ({
    id: c.id,
    serviceKey: c.serviceKey,
    name: c.name,
    price: c.price,
    pricingType: c.pricingType as any,
    minCharge: c.minCharge || undefined,
    active: c.active,
  }));
  const quoteResult = quote(cart, catalogItems);

  // Generate secure link token for credentials
  const token = randomBytes(24).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const order = await prisma.$transaction(async tx => {
    const ord = await tx.order.create({
      data: {
        code,
        customerUserId: user!.id,
        status: 'PENDING',
        quoteTotal: quoteResult.total,
        orderItems: {
          create: quoteResult.lines.map(l => ({
            catalogItemId: l.catalogItemId,
            copiedName: l.name,
            copiedPrice: l.totalPrice,
            qty: l.qty,
            statedPercent: l.statedPercent ?? null,
          })),
        },
        orderEvents: {
          create: {
            toStatus: 'PENDING',
            note: 'Order submitted via Discord bot',
          },
        },
      },
    });

    await tx.secureLink.create({
      data: {
        orderId: ord.id,
        tokenHash,
        purpose: 'LOGIN_FORM',
        expiresAt,
      },
    });

    return ord;
  });

  // Clear user cart
  userCarts.delete(interaction.user.id);

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const secureUrl = `${baseUrl}/s/${token}`;

  const confirmEmbed = new EmbedBuilder()
    .setTitle(`✅ Order Placed: ${order.code}`)
    .setColor(0x00ae86)
    .setDescription(
      `Your order has been submitted to the admin queue!\n\n` +
      `🔒 **Secure Credential Submission:**\n` +
      `To protect your account, **never send passwords in Discord**.\n` +
      `Please provide your login credentials via this one-time secure link:\n` +
      `👉 [Submit Credentials Securely](${secureUrl})\n\n` +
      `*Link expires in 24 hours and can only be used once.*`
    )
    .addFields({
      name: 'Estimated Total',
      value: `Rp${order.quoteTotal.toLocaleString('id-ID')}`,
    })
    .setFooter({ text: 'Status: PENDING · Admin will review shortly' });

  await interaction.update({ embeds: [confirmEmbed], components: [] });

  // Send order to the configured order channel
  await sendOrderToChannel(order, user!, interaction.client);
}

/**
 * Send order notification to the configured order channel
 */
export async function sendOrderToChannel(
  order: any,
  customer: any,
  client: any
) {
  const setting = await prisma.setting.findUnique({
    where: { key: 'orderChannelId' },
  });

  const channelId = setting?.value as string | null;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) return;

  // Get order items with their details
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    include: { catalogItem: true },
  });

  const orderEmbed = new EmbedBuilder()
    .setTitle(`📋 New Order: ${order.code}`)
    .setColor(0x5865f2)
    .setDescription(
      `**Customer:** ${customer.username} (${customer.discordId ? `<@${customer.discordId}>` : 'N/A'})\n` +
      `**Status:** 🟡 Pending Review\n` +
      `**Estimated Total:** Rp${order.quoteTotal.toLocaleString('id-ID')}`
    )
    .addFields({
      name: '📝 Order Items',
      value:
        orderItems
          .map(
            item =>
              `• ${item.copiedName} x${item.qty} — Rp${item.copiedPrice.toLocaleString('id-ID')}`
          )
          .join('\n') || 'No items',
    })
    .setFooter({ text: `Order ID: ${order.id}` })
    .setTimestamp();

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`admin_accept:${order.id}`)
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`admin_decline:${order.id}`)
      .setLabel('Decline')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({ embeds: [orderEmbed], components: [actionRow] });
}
