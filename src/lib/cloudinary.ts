// Server-side Cloudinary helpers using plain fetch + node:crypto (no SDK = smaller server bundle).
import { createHash } from "node:crypto";

export const UPLOAD_FOLDER = "wedding";
const ALLOWED_FORMATS = "jpg,jpeg,png,webp";

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function sign(params: Record<string, string | number>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

/** Parameters the browser must send, unchanged, to Cloudinary's upload endpoint. */
export function signUpload() {
  const cfg = cloudinaryConfig();
  if (!cfg) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { allowed_formats: ALLOWED_FORMATS, folder: UPLOAD_FOLDER, timestamp };
  return {
    cloudName: cfg.cloudName,
    apiKey: cfg.apiKey,
    signature: sign(params, cfg.apiSecret),
    ...params,
  };
}

/** Best-effort cleanup of images nobody uses any more. Never throws. */
export async function destroyImages(publicIds: string[]): Promise<void> {
  const cfg = cloudinaryConfig();
  if (!cfg || publicIds.length === 0) return;
  await Promise.all(
    publicIds.map(async (public_id) => {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const body = new URLSearchParams({
          public_id,
          timestamp: String(timestamp),
          api_key: cfg.apiKey,
          signature: sign({ public_id, timestamp }, cfg.apiSecret),
        });
        await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, { method: "POST", body });
      } catch (err) {
        console.warn("cloudinary destroy failed", public_id, err);
      }
    }),
  );
}
