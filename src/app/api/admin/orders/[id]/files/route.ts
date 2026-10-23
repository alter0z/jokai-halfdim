/**
 * Order Files API: Upload & List Before/After Screenshots and Payment Proofs
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, FileKind } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const files = await prisma.file.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const kind = formData.get('kind') as FileKind | null;

    if (!file || !kind) {
      return NextResponse.json({ error: 'File and kind are required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const safeFilename = `${id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadsDir, safeFilename);
    await writeFile(filePath, buffer);

    const publicPath = `/uploads/${safeFilename}`;

    const record = await prisma.file.create({
      data: {
        orderId: id,
        kind,
        path: publicPath,
        size: buffer.length,
      },
    });

    return NextResponse.json({ file: record });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
