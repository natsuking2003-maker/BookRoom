"use client";

import { useEffect } from "react";
import Image from "next/image";

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt = "画像", onClose }: Props) {
  // ESCキーで閉じる
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // スクロール無効化
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 閉じるボタン */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 flex items-center justify-center text-xl transition z-10"
        aria-label="閉じる"
      >
        ✕
      </button>

      {/* 画像（クリックが伝播しないようにする） */}
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={900}
          className="rounded-xl shadow-2xl object-contain max-w-[90vw] max-h-[90vh]"
          style={{ width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "90vh" }}
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
