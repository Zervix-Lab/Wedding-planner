// next/image custom loader: Cloudinary does the resizing + f_auto (webp/avif) + q_auto.
// `src` is the stored Cloudinary public_id (not a URL).
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return `data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==`; // 1x1 placeholder in dev without Cloudinary
  const q = quality ? `q_${quality}` : "q_auto";
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,${q},c_limit,w_${width}/${src}`;
}
