"use client";

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Settings, Film, Book, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import { useTrakt } from '@/hooks/useTrakt';
import { useAniList } from '@/hooks/useAniList';

export function SettingsDropdown() {
    const { isConnected: isTraktConnected, login: loginTrakt } = useTrakt();
    const { isConnected: isAniListConnected, login: loginAniList } = useAniList();

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="flex items-center justify-center p-3 rounded-2xl glass hover:bg-white/10 text-white/40 hover:text-primary transition-all duration-300 outline-none active-depth border border-white/5">
                    <Settings className="h-4 w-4 stroke-[2.5px]" />
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-300"
                enterFrom="transform opacity-0 scale-95 translate-y-2"
                enterTo="transform opacity-100 scale-100 translate-y-0"
                leave="transition ease-in duration-200"
                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                leaveTo="transform opacity-0 scale-95 translate-y-2"
            >
                <Menu.Items className="absolute right-0 mt-4 w-80 origin-top-right rounded-[32px] glass-pro border border-white/10 shadow-cinematic-xl focus:outline-none z-50 overflow-hidden">
                    <div className="p-3">
                        <div className="px-5 py-4 border-b border-white/5 mb-2 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                               <Share2 className="w-4 h-4 stroke-[2.5px]" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/40 italic">Đồng bộ trung tâm</h3>
                        </div>

                        {/* Trakt Sync */}
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={loginTrakt}
                                    className={`${
                                        active ? 'bg-foreground/5 translate-x-1' : ''
                                    } group flex w-full items-center justify-between rounded-2xl px-5 py-4 transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl transition-all duration-500 shadow-sm ${isTraktConnected ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-foreground/5 text-foreground/20'}`}>
                                            <Film className="h-5 w-5 stroke-[2.5px]" />
                                        </div>
                                        <div className="flex flex-col items-start px-0.5">
                                            <span className="text-foreground font-black text-[13px] italic uppercase tracking-tight leading-none">Phim (Trakt)</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 italic ${isTraktConnected ? 'text-green-500' : 'text-foreground/20'}`}>
                                                {isTraktConnected ? 'Đã kết nối' : 'Cần kết nối'}
                                            </span>
                                        </div>
                                    </div>
                                    {isTraktConnected ? (
                                        <div className="p-1 px-2.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                            <CheckCircle2 className="h-3.5 w-3.5 stroke-[3px]" />
                                        </div>
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-foreground/10" />
                                    )}
                                </button>
                            )}
                        </Menu.Item>

                        {/* AniList Sync */}
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={loginAniList}
                                    className={`${
                                        active ? 'bg-foreground/5 translate-x-1' : ''
                                    } group flex w-full items-center justify-between rounded-2xl px-5 py-4 transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl transition-all duration-500 shadow-sm ${isAniListConnected ? 'bg-sky-500 text-white shadow-sky-500/30' : 'bg-foreground/5 text-foreground/20'}`}>
                                            <Book className="h-5 w-5 stroke-[2.5px]" />
                                        </div>
                                        <div className="flex flex-col items-start px-0.5">
                                            <span className="text-foreground font-black text-[13px] italic uppercase tracking-tight leading-none">Truyện (AniList)</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 italic ${isAniListConnected ? 'text-green-500' : 'text-foreground/20'}`}>
                                                {isAniListConnected ? 'Đã kết nối' : 'Cần kết nối'}
                                            </span>
                                        </div>
                                    </div>
                                    {isAniListConnected ? (
                                        <div className="p-1 px-2.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                            <CheckCircle2 className="h-3.5 w-3.5 stroke-[3px]" />
                                        </div>
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-foreground/10" />
                                    )}
                                </button>
                            )}
                        </Menu.Item>
                    </div>

                    <div className="px-8 py-5 bg-foreground/[0.05] border-t border-white/5 space-y-2">
                        <p className="text-[10px] text-foreground/30 italic font-medium leading-relaxed">
                           Tự động đồng bộ hóa tiến trình xem/đọc của bạn lên các nền tảng đám mây 2026.
                        </p>
                        <div className="flex gap-1">
                           {[1,2,3].map(bit => (
                              <div key={bit} className="h-1 w-4 rounded-full bg-primary/20" />
                           ))}
                        </div>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}

