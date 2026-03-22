"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ 
  children,
  ...props 
}: ThemeProviderProps) {
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
