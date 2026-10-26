import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { apiError, json, requireAdmin, sameOrigin } from '@/lib/api';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

const TYPES = {
  'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
  'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'image/webp': { ext: 'webp', magic: [0x52, 0x49, 0x46, 0x46] },
  'image/gif': { ext: 'gif', magic: [0x47, 0x49, 0x46, 0x38] },
  'image/avif': { ext: 'avif', magic: [0x00, 0x00, 0x00] },
};

function looksLike(buffer, magic) {
  return magic.every((byte, index) => buffer[index] === byte);
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  let form;
  try {
    form = await request.formData();
  } catch {
    return apiError('Expected a file upload.', 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') return apiError('Choose an image to upload.', 422);

  const type = TYPES[file.type];
  if (!type) {
    return apiError('Use a PNG, JPG, WebP, GIF or AVIF image.', 415);
  }
  if (file.size > MAX_BYTES) {
    return apiError('Images must be 4 MB or smaller.', 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!looksLike(buffer, type.magic)) {
    return apiError('That file does not look like a valid image.', 415);
  }

  const directory = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(directory, { recursive: true });

  const name = `${crypto.randomUUID()}.${type.ext}`;
  await fs.writeFile(path.join(directory, name), buffer);

  return json({ ok: true, url: `/uploads/${name}`, size: buffer.length, type: file.type });
}
