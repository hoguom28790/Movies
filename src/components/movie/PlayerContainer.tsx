"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface PlayerContainerProps {
  url: string;
  isHls: boolean;
  rawEmbedUrl: string;
}

export function PlayerContainer({ url, isHls, rawEmbedUrl }: PlayerContainerProps) {
  const { theme } = useTheme();

  const iframeSrc = isHls 
    ? `/player.html?url=${encodeURIComponent(url)}&theme=${theme}`
    : rawEmbedUrl || `/player.html?url=${encodeURIComponent(url)}&theme=${theme}`;

  return (
    <div className="w-full aspect-video bg-black relative shadow-2xl">
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        className="w-full h-full border-0 absolute inset-0 rounded-[var(--radius)]"
        allowFullScreen
      />
    </div>
  );
}
