/**
 * Outbox Job Runner
 *
 * Turns database outbox rows into Discord messages and retries on failure.
 */

import { Client } from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processOutbox(client: Client) {
  try {
    const pendingMessages = await prisma.outbox.findMany({
      where: { sentAt: null, attempts: { lt: 5 } },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });

    for (const msg of pendingMessages) {
      try {
        const payload = msg.payload as any;

        if (msg.type === 'CATALOG_UPDATED') {
          console.log('[Outbox] Catalog updated event processed:', payload);
        } else if (msg.type === 'ORDER_NOTIFICATION') {
          // Send message to Discord channel or thread
          const channelId = payload.channelId;
          if (channelId) {
            const channel = await client.channels.fetch(channelId);
            if (channel && channel.isTextBased()) {
              await channel.send(payload.content);
            }
          }
        }

        // Mark as sent
        await prisma.outbox.update({
          where: { id: msg.id },
          data: { sentAt: new Date() },
        });
      } catch (err: any) {
        console.error(`[Outbox] Failed to process message ${msg.id}:`, err);
        await prisma.outbox.update({
          where: { id: msg.id },
          data: {
            attempts: { increment: 1 },
            lastError: err.message || String(err),
          },
        });
      }
    }
  } catch (error) {
    console.error('[Outbox] Error processing outbox queue:', error);
  }
}
