/**
 * Discord Bot Commands & Interactions for Pricing & Build Guide
 *
 * Implements:
 * - /price: Pricing calculator & cart (Exploration per %, Quests, Materials)
 * - /price-list: Full price list overview
 * - /build: Character build guide targets from spreadsheet data
 */

import {
  ChatInputCommandInteraction,
  Client,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Interaction,
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { quote, CartItem, validateCartItem } from '../core/pricing.js';
import texts from './texts.js';

const prisma = new PrismaClient();

// Define slash commands
export const commands = [
  new SlashCommandBuilder()
    .setName('price')
    .setDescription('Calculate prices and build a cart for Genshin piloting services'),

  new SlashCommandBuilder()
    .setName('price-list')
    .setDescription('View the full catalog and price list'),

  new SlashCommandBuilder()
    .setName('build')
    .setDescription('View character build targets and stats')
    .addStringOption(option =>
      option
        .setName('character')
        .setDescription('Character name')
        .setRequired(true)
        .setAutocomplete(true)
    ),
].map(command => command.toJSON());

/**
 * Register slash commands with Discord
 */
export async function registerCommands(clientId: string, token: string, guildId?: string) {
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log('Successfully registered guild commands.');
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      console.log('Successfully registered global commands.');
    }
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
}

/**
 * Handle /price command
 */
export async function handlePriceCommand(interaction: ChatInputCommandInteraction) {
  // Fetch services from DB
  const services = await prisma.service.findMany({
    where: { active: true, archivedAt: null },
    orderBy: { sort: 'asc' },
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('price_select_service')
    .setPlaceholder('Choose a service...')
    .addOptions(
      services.map(s => ({
        label: s.name,
        description: s.description || '',
        value: s.key,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: texts.price.selectService,
    components: [row],
    ephemeral: true,
  });
}

/**
 * Handle /price-list command
 */
export async function handlePriceListCommand(interaction: ChatInputCommandInteraction) {
  const regions = await prisma.region.findMany({
    where: { active: true, archivedAt: null },
    orderBy: { sort: 'asc' },
  });

  const items = await prisma.catalogItem.findMany({
    where: { active: true, archivedAt: null },
    orderBy: { sort: 'asc' },
  });

  const embed = new EmbedBuilder()
    .setTitle(texts.priceList.title)
    .setColor(0x5865f2)
    .setDescription('Official Jokai piloting price list. Prices are updated live.');

  for (const region of regions) {
    const regionItems = items.filter(i => i.regionKey === region.key && i.serviceKey === 'exploration');
    if (regionItems.length > 0) {
      const fieldVal = regionItems
        .map(i => `• **${i.name}**: Rp${i.price.toLocaleString('id-ID')} (0% → 100%)`)
        .join('\n');
      embed.addFields({ name: `🗺️ Exploration: ${region.name}`, value: fieldVal });
    }
  }

  // Archon quests
  const archonItems = items.filter(i => i.serviceKey === 'archon_quest');
  if (archonItems.length > 0) {
    embed.addFields({
      name: '📜 Archon Quests',
      value: `• Rp15,000 per Act across all regions`,
    });
  }

  // Materials
  const matItems = items.filter(i => i.serviceKey === 'material');
  if (matItems.length > 0) {
    const matVal = matItems.map(m => `• **${m.name}**: Rp${m.price}/item (Max ${m.maxQty})`).join('\n');
    embed.addFields({ name: '🌾 Material Farming', value: matVal });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle /build command
 */
export async function handleBuildCommand(interaction: ChatInputCommandInteraction) {
  const charName = interaction.options.getString('character', true);

  const character = await prisma.character.findFirst({
    where: {
      name: {
        contains: charName,
        mode: 'insensitive',
      },
      active: true,
    },
  });

  if (!character) {
    await interaction.reply({
      content: texts.build.notFound,
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🛡️ Build Guide: ${character.name}`)
    .setColor(0x00ae86)
    .addFields(
      { name: 'Element & Weapon', value: `${character.element} · ${character.weapon} (${character.rarity}★)`, inline: true },
      { name: 'Scaling', value: character.scaling || 'N/A', inline: true },
      { name: 'Main Stats', value: character.mainStat || 'N/A', inline: false },
      { name: 'Stat Targets', value: `CR/CD: ${character.statMinCr}/${character.statMinCd} | ER: ${character.statEr}% | EM: ${character.statEm} | ATK: ${character.statAtk}`, inline: false },
      { name: 'Talent Priority', value: character.talents || 'N/A', inline: false }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
