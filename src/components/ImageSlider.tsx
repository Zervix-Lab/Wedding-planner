"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { useT } from "./Providers";

const SIZES = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

/**
 * Swipeable photo slider using native CSS scroll-snap (no library).
 * Only used when a vendor has 2+ photos; single photos render as a plain <Image> on the server.
 */
export function ImageSlider({ images, alt }: { images: string[]; alt: string }) {
  const t = useT();
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i); // only re-render when the visible slide actually changes
  }

  function goTo(i: number) {
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div ref={scroller} onScroll={onScroll} className="snap-slider flex snap-x snap-mandatory overflow-x-auto">
        {images.map((id, i) => (
          <div key={id} className="relative aspect-[4/3] w-full shrink-0 snap-center bg-stone-200">
            <Image src={id} alt={i === 0 ? alt : `${alt} (${i + 1})`} fill sizes={SIZES} loading="lazy" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/40 to-transparent pt-4">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={t("landing.imageOf", { n: i + 1, total: images.length })}
            aria-current={i === index}
            className="flex h-11 w-7 items-center justify-center"
          >
            <span className={`block rounded-full ${i === index ? "h-3 w-3 bg-white" : "h-2.5 w-2.5 bg-white/60"} ring-1 ring-black/30`} />
          </button>
        ))}
      </div>
    </div>
  );
}
