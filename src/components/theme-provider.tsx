"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Fixed light mode invisible text + DropdownMenu toggle + Firebase sync per user
 */
export function ThemeProvider({ 
  children,
  ...props 
}: { 
  children: React.ReactNode 
}) {
  // Use default next-themes logic without blocking render
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={true}
      disableTransitionOnChange={true}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
