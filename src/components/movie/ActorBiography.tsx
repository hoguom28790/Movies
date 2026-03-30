"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActorBiographyProps {
  biography: string;
  isFallback?: boolean;
}

export function ActorBiography({ biography, isFallback }: ActorBiographyProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lineLimit = 3;
  
  // Basic check to see if it's long enough to need truncating
  const isLong = biography.split('\n').length > lineLimit || biography.length > 300;

  if (!biography) return null;

  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "text-foreground/60 leading-relaxed text-lg sm:text-xl font-medium max-w-4xl opacity-90 transition-all duration-700 whitespace-pre-line overflow-hidden",
          !isExpanded && "line-clamp-3"
        )}
      >
        {biography}
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        {isLong && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="group flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:opacity-80 transition-all bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 shadow-apple-sm active-depth"
          >
            {isExpanded ? (
              <>THU GỌN <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>ĐỌC THÊM <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        )}

        {isFallback && (
          <a 
            href={`https://translate.google.com/?sl=en&tl=vi&text=${encodeURIComponent(biography)}&op=translate`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-black text-foreground/40 hover:text-primary transition-all bg-foreground/5 px-6 py-3 rounded-2xl border border-foreground/5"
          >
            <Globe className="w-4 h-4" />
            DỊCH SANG TIẾNG VIỆT
          </a>
        )}
      </div>
    </div>
  );
}
