// Avatar photo storage via Supabase Storage — the same Supabase project this
// app already uses for Postgres (see server/postgres.ts), not a new vendor.
//
// Requires two env vars this project doesn't otherwise need:
//   SUPABASE_URL               e.g. https://<project-ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  Dashboard -> Project Settings -> API -> service_role secret
// and a PUBLIC storage bucket named "avatars" created in that project.
//
// The service role key is required (not the anon key) because uploads are
// authorized by this app's own JWT, not Supabase Auth — the server uploads
// on the user's behalf after verifying their token itself.
//
// No @supabase/supabase-js dependency needed: Node 20+ (this project's
// minimum, see package.json engines) has global fetch, and the Storage
// REST API is a plain HTTP PUT.

const AVATAR_BUCKET = 'avatars';

export const ALLOWED_AVATAR_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Sniffs the real file signature so a renamed/relabelled file can't slip
 * through just because the client claimed a particular MIME type — the
 * client's declared type is only used to pick which signature to check.
 */
function matchesDeclaredType(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return buffer.length > 8 && pngSignature.every((byte, i) => buffer[i] === byte);
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.length > 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }
  return false;
}

export interface ParsedAvatarUpload {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

/**
 * Parses and validates a `data:<mime>;base64,<data>` URL. Throws a plain
 * Error with a user-safe message on any validation failure — callers should
 * catch it and respond 400 with err.message directly (never a raw
 * server/stack error, per this app's existing error-handling convention).
 */
export function parseAndValidateAvatarDataUrl(dataUrl: unknown): ParsedAvatarUpload {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    throw new Error('No image was provided.');
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data.');
  }

  const [, declaredMimeType, base64Data] = match;
  const extension = ALLOWED_AVATAR_MIME_TYPES[declaredMimeType];
  if (!extension) {
    throw new Error('Please choose a JPG, PNG, or WEBP image.');
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    throw new Error('Invalid image data.');
  }

  if (buffer.length === 0) {
    throw new Error('Invalid image data.');
  }

  if (buffer.length > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new Error('That image is too large — please choose a photo under 5MB.');
  }

  // Never trust the declared MIME type alone — verify the actual bytes.
  if (!matchesDeclaredType(buffer, declaredMimeType)) {
    throw new Error('That file does not look like a valid image.');
  }

  return { buffer, mimeType: declaredMimeType, extension };
}

function resolveSupabaseStorageConfig(): { url: string; serviceRoleKey: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Photo upload storage is not configured on this server. Set SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY (Supabase Dashboard -> Project Settings -> API), and ' +
        'create a public "avatars" storage bucket.'
    );
  }
  return { url, serviceRoleKey };
}

/**
 * Uploads the given image buffer to the "avatars" bucket and returns its
 * public URL. The object path is server-generated from the authenticated
 * user's own id — never taken from client input.
 */
export async function uploadAvatarImage(userId: string, upload: ParsedAvatarUpload): Promise<string> {
  const { url, serviceRoleKey } = resolveSupabaseStorageConfig();
  const objectPath = `${userId}-${Date.now()}.${upload.extension}`;

  const response = await fetch(
    `${url}/storage/v1/object/${AVATAR_BUCKET}/${objectPath}?upsert=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': upload.mimeType,
      },
      body: upload.buffer,
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[storage] Supabase Storage upload failed:', response.status, detail);
    throw new Error('Failed to upload photo. Please try again.');
  }

  return `${url}/storage/v1/object/public/${AVATAR_BUCKET}/${objectPath}`;
}
