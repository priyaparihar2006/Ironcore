// Gender-aware avatar resolution + client-side upload validation/compression.
// Single source of truth so every component that shows the current user's
// avatar (Navbar, dashboard layouts, profile page) resolves it the same way.

// Default photos reuse URLs already trusted and displayed elsewhere in this
// app (the seed data in server/db.ts uses the exact same three photos for
// its Male/Female/Non-binary demo accounts), so no new third-party image
// source is introduced.
const MALE_DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80';
const FEMALE_DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&h=200&q=80';
const NEUTRAL_DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80';

interface AvatarSource {
  avatar?: string;
  gender?: string;
}

/**
 * Fallback priority: an uploaded photo always wins; otherwise fall back to a
 * gender-matched default; otherwise a neutral default. Never infers gender
 * from the name — only ever reads the actual `gender` field.
 */
export function resolveAvatarUrl(user?: AvatarSource | null): string {
  if (user?.avatar) return user.avatar;
  if (user?.gender === 'Male') return MALE_DEFAULT_AVATAR;
  if (user?.gender === 'Female') return FEMALE_DEFAULT_AVATAR;
  return NEUTRAL_DEFAULT_AVATAR;
}

export const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/** Returns a user-friendly error message, or null if the file is acceptable. */
export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])) {
    return 'Please choose a JPG, PNG, or WEBP image.';
  }
  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    return 'That image is too large — please choose a photo under 5MB.';
  }
  return null;
}

/**
 * Loads the given image file, center-crops it to a square, downsizes it to
 * a reasonable max dimension, and re-encodes it as a JPEG data URL — this is
 * the "simple crop" plus keeps the upload payload small (well under both the
 * 5MB limit and typical serverless request-body limits) regardless of how
 * large the original photo was.
 */
export function compressAvatarToDataUrl(file: File, maxDimension = 512, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const outSize = Math.min(maxDimension, side);

      const canvas = document.createElement('canvas');
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process image.'));
        return;
      }

      ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read that image file.'));
    };

    img.src = objectUrl;
  });
}
