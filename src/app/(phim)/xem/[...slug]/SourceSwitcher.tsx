"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SourceSwitcherProps {
  maxSwitches?: number;
  totalSources: number;
}

export function SourceSwitcher({ maxSwitches = 2, totalSources = 1 }: SourceSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [switchCount, setSwitchCount] = useState(0);

  useEffect(() => {
    const handleSourceFailed = () => {
      // Don't auto-switch if only one source exists
      if (totalSources <= 1) return;

      if (switchCount < maxSwitches) {
        const currentSv = parseInt(searchParams.get('sv') || '0');
        const nextSv = (currentSv + 1) % totalSources;
        
        if (nextSv !== currentSv) {
          console.log(`[AutoSwitcher] Source failed. Auto-switching to server ${nextSv} (Attempt ${switchCount + 1}/${maxSwitches})`);
          
          const params = new URLSearchParams(searchParams.toString());
          params.set('sv', nextSv.toString());
          
          setSwitchCount(prev => prev + 1);
          router.push(`?${params.toString()}`);
        }
      } else {
        console.log("[AutoSwitcher] Max auto-switches reached. Please select server manually.");
      }
    };

    window.addEventListener('player:source-failed' as any, handleSourceFailed);
    return () => window.removeEventListener('player:source-failed' as any, handleSourceFailed);
  }, [switchCount, maxSwitches, totalSources, searchParams, router]);

  return null;
}
