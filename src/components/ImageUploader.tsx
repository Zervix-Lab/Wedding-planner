"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";
import { MAX_IMAGES } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";
import { Button } from "./ui";
import { useT, useToast } from "./Providers";

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowed_formats: string;
  error?: DictKey;
}

/** Up to 3 photos. Each is compressed in the browser, then uploaded directly to Cloudinary (signed). */
export function ImageUploader({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const t = useT();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const signRes = await fetch("/api/upload/sign", { method: "POST" });
      const sign = (await signRes.json()) as SignResponse;
      if (!signRes.ok) {
        toast.error(sign.error ?? "err.uploadFailed");
        return;
      }
      const blob = await compressImage(file);
      const form = new FormData();
      form.append("file", blob, "photo.jpg");
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);
      form.append("allowed_formats", sign.allowed_formats);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body: form });
      const data = (await up.json()) as { public_id?: string };
      if (!up.ok || !data.public_id) throw new Error("upload failed");
      onChange([...value, data.public_id]);
    } catch {
      toast.error("err.uploadFailed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <ul className="mb-3 grid grid-cols-3 gap-2">
        {value.map((id, i) => (
          <li key={id} className="space-y-1">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-200">
              <Image src={id} alt="" fill sizes="120px" loading="lazy" className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="min-h-11 w-full rounded-xl border-2 border-red-700 px-1 text-base font-semibold text-red-800 hover:bg-red-50"
            >
              {t("vendors.removePhoto")}
            </button>
          </li>
        ))}
      </ul>
      {value.length < MAX_IMAGES && (
        <>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <Button variant="secondary" icon="image" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? t("vendors.uploading") : t("vendors.addPhoto")}
          </Button>
        </>
      )}
    </div>
  );
}
