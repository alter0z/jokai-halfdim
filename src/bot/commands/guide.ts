/**
 * /guide Command & Gated Menu
 *
 * Provides an interactive menu for customers to view service guides,
 * payment instructions, security rules, and FAQ.
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';

export const guideCommand = new SlashCommandBuilder()
  .setName('guide')
  .setDescription('View Jokai piloting guides, rules, and FAQ');

/**
 * Handle /guide command
 */
export async function handleGuideCommand(interaction: ChatInputCommandInteraction) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('guide_menu')
    .setPlaceholder('Select a guide topic...')
    .addOptions([
      {
        label: '🚀 How to Order',
        description: 'Step-by-step guide on pricing, cart, and placing an order',
        value: 'how_to_order',
      },
      {
        label: '🔒 Account Security',
        description: 'How we keep your login credentials safe & encrypted',
        value: 'security',
      },
      {
        label: '💳 Payment & Invoicing',
        description: 'Pay after work is done via QRIS or Bank Transfer',
        value: 'payment',
      },
      {
        label: '❓ FAQ & Rules',
        description: 'Queue limits, shop status, and cancellation policies',
        value: 'faq',
      },
    ]);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const embed = new EmbedBuilder()
    .setTitle('📖 Jokai Halfdim — Customer Guide')
    .setColor(0x5865f2)
    .setDescription('Welcome to Jokai! Choose a topic from the menu below to learn more about our Genshin piloting service.');

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

/**
 * Handle guide selection from the menu
 */
export async function handleGuideSelect(interaction: StringSelectMenuInteraction) {
  const topic = interaction.values[0];
  const embed = new EmbedBuilder().setColor(0x5865f2);

  switch (topic) {
    case 'how_to_order':
      embed
        .setTitle('🚀 How to Order')
        .setDescription(
          '1. Use `/price` to build your cart (exploration, archon quests, materials).\n' +
            '2. Review your estimate and click **Place Order**.\n' +
            '3. A private order thread is created (`JK-XXXX`) where you receive updates.\n' +
            '4. Once accepted, securely submit your login details via our one-time HTTPS form.'
        );
      break;

    case 'security':
      embed
        .setTitle('🔒 Account Security')
        .setDescription(
          '• **Never send passwords in chat.** We only collect credentials via secure HTTPS one-time links (`/s/[token]`).\n' +
            '• Credentials are encrypted using **AES-256-GCM**.\n' +
            '• Login details are permanently deleted as soon as work is marked **Done**.\n' +
            '• Please do not log into your account while piloting is in progress.'
        );
      break;

    case 'payment':
      embed
        .setTitle('💳 Payment & Invoicing')
        .setDescription(
          '• **Pay after the work is done!** We complete the pilot first, then send you the invoice with before/after screenshots.\n' +
            '• Payment methods include QRIS and local Indonesian bank transfers.\n' +
            '• Upload your payment proof using `/pay` in your order thread.\n' +
            '• Orders close once payment is confirmed by admin.'
        );
      break;

    case 'faq':
      embed
        .setTitle('❓ FAQ & Rules')
        .setDescription(
          '• **First-time limit:** Max Rp200,000 for your first order.\n' +
            '• **Unpaid orders:** Invoices are due within 24 hours. Unpaid orders after 72 hours result in a temporary block from new orders.\n' +
            '• **Cancellations:** Free cancellation before work starts.'
        );
      break;
    default:
      embed.setTitle('Guide').setDescription('Select an option.');
  }

  await interaction.update({ embeds: [embed] });
}
