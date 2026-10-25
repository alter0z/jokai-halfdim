/**
 * Discord Bot Admin Commands
 * /setup-order-channel - Configure which channel receives orders
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const adminCommands = [
  new SlashCommandBuilder()
    .setName('setup-order-channel')
    .setDescription('Set the channel where new orders will be posted')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Text channel for orders')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

/**
 * Handle /setup-order-channel command
 */
export async function handleSetupOrderChannel(interaction: ChatInputCommandInteraction) {
  // Check if user has admin permissions in the guild
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: '❌ You need Administrator permissions to use this command.',
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.options.getChannel('channel', true);

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: '❌ Selected channel must be a text channel.',
      ephemeral: true,
    });
    return;
  }

  // Save to database
  await prisma.setting.upsert({
    where: { key: 'orderChannelId' },
    create: {
      key: 'orderChannelId',
      value: channel.id,
    },
    update: {
      value: channel.id,
    },
  });

  const embed = new EmbedBuilder()
    .setTitle('✅ Order Channel Configured')
    .setColor(0x00ae86)
    .setDescription(`All new orders will now be posted to ${channel}`)
    .addFields({
      name: 'Channel',
      value: `<#${channel.id}>`,
      inline: true,
    })
    .setFooter({ text: 'Admins can accept/decline orders directly from the channel' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
