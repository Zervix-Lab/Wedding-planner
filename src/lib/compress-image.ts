// Client-side image compression: resize to max 1600px wide and re-encode as JPEG before uploading.
// A 6 MB phone photo typically becomes 200-400 KB.
const MAX_WIDTH = 1600;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<Blob> {
  // imageOrientation: "from-image" applies the EXIF rotation so phone photos aren't sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", QUALITY),
    );
  } finally {
    bitmap.close();
  }
}
