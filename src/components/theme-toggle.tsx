"use client";

import React, { useEffect, useState, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useUserTheme } from "@/hooks/useUserTheme";

/**
 * Fixed light mode invisible text + DropdownMenu toggle + Firebase sync per user
 */
export function ThemeToggle() {
  const { theme, setTheme } = useUserTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="p-2 w-10 h-10" />;

  const options = [
    { value: "light", label: "Sáng", icon: <Sun className="w-4 h-4" /> },
    { value: "dark", label: "Tối", icon: <Moon className="w-4 h-4" /> },
    { value: "system", label: "Hệ thống", icon: <Monitor className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="relative inline-block text-left">
      <Menu as="div" className="relative">
        <Menu.Button 
          className="p-2.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all duration-300 outline-none flex items-center justify-center border border-foreground/5"
          aria-label="Toggle theme"
        >
          {mounted && (
            <>
              {theme === "light" && <Sun className="h-5 w-5 animate-in zoom-in spin-in duration-300" />}
              {theme === "dark" && <Moon className="h-5 w-5 animate-in zoom-in spin-in duration-300" />}
              {theme === "system" && <Monitor className="h-5 w-5 animate-in zoom-in spin-in duration-300" />}
            </>
          )}
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-3 w-44 origin-top-right rounded-2xl bg-surface/95 backdrop-blur-xl border border-foreground/5 shadow-2xl shadow-black/20 focus:outline-none z-[100] overflow-hidden">
            <div className="py-1.5 flex flex-col">
              {options.map((option) => (
                <Menu.Item key={option.value}>
                  {({ active }) => (
                    <button
                      onClick={() => setTheme(option.value)}
                      className={`
                        w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold transition-all duration-200
                        ${active ? "bg-foreground/5 text-foreground" : "text-foreground/70"}
                        ${theme === option.value ? "text-primary bg-primary/5" : ""}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={theme === option.value ? "text-primary" : "text-foreground/40"}>
                          {option.icon}
                        </span>
                        <span>{option.label}</span>
                      </div>
                      {theme === option.value && (
                        <Check className="h-4 w-4 text-primary animate-in zoom-in duration-300" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
