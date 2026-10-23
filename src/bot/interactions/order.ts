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
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { quote, validateCartItem } from '../../core/pricing.js';
import { placeOrder, acceptOrder, declineOrder } from '../../core/orders.js';
import texts from '../texts.js';

const prisma = new PrismaClient();

// In-memory cart store per user (for Discord session before checkout)
const userCarts = new Map<string, { catalogItemId: string; qty: number; statedPercent?: number }[]>();

/**
 * Handle service selection in /price
 */
export async function handleServiceSelect(interaction: StringSelectMenuInteraction) {
  const serviceKey = interaction.values[0];

  if (serviceKey === 'exploration') {
    // Show regions for exploration
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
    // Show Archon quests
    const items = await prisma.catalogItem.findMany({
      where: { serviceKey: 'archon_quest', active: true, archivedAt: null },
      orderBy: { sort: 'asc' },
    });

    const select = new StringSelectMenuBuilder()
      .setCustomId('price_select_items')
      .setPlaceholder('Choose Archon Quests...')
      .addOptions(
        items.slice(0, 25).map(i => ({
          label: i.name.substring(0, 100),
          value: i.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    await interaction.update({ content: texts.price.selectItems, components: [row] });
  } else if (serviceKey === 'material') {
    // Show materials
    const items = await prisma.catalogItem.findMany({
      where: { serviceKey: 'material', active: true, archivedAt: null },
      orderBy: { sort: 'asc' },
    });

    const select = new StringSelectMenuBuilder()
      .setCustomId('price_select_material')
      .setPlaceholder('Choose material type...')
      .addOptions(
        items.map(i => ({
          label: `${i.name} (Rp${i.price}/item)`,
          value: i.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    await interaction.update({ content: texts.price.selectItems, components: [row] });
  } else {
    await interaction.update({ content: 'Service coming soon.', components: [] });
  }
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

  // Open modal with multi-line text input for current percentages
  const modal = new ModalBuilder()
    .setCustomId('price_modal_exploration_percents')
    .setTitle('Enter Current Percentage (%)');

  const defaultText = areas.map(a => `${a.name} = 0`).join('\n');

  const input = new TextInputBuilder()
    .setCustomId('exploration_percents_input')
    .setLabel('Current % per area (e.g. Area = 63)')
    .setStyle(TextInputStyle.Paragraph)
    .setValue(defaultText.substring(0, 4000))
    .setRequired(true);

  // Store selected IDs temporarily in user session or pass via custom state
  // For MVP, we parse them in modal submit
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));

  await interaction.showModal(modal);
}
