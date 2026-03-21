"use client";

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Settings, Film, Book, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useTrakt } from '@/hooks/useTrakt';
import { useAniList } from '@/hooks/useAniList';

export function SettingsDropdown() {
    const { isConnected: isTraktConnected, login: loginTrakt } = useTrakt();
    const { isConnected: isAniListConnected, login: loginAniList } = useAniList();

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="flex items-center justify-center p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all outline-none">
                    <Settings className="h-3.5 w-3.5" />
                </Menu.Button>
            </div>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-[#131b27]/90 backdrop-blur-2xl border border-white/10 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                    <div className="px-1 py-1">
                        <div className="px-4 py-3 border-b border-white/5 mb-1">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Đồng bộ trung tâm</h3>
                        </div>

                        {/* Trakt Sync */}
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={loginTrakt}
                                    className={`${
                                        active ? 'bg-white/5' : ''
                                    } group flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isTraktConnected ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/40'}`}>
                                            <Film className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col items-start translate-y-[-1px]">
                                            <span className="text-white font-medium text-xs">Đồng bộ Phim (Trakt)</span>
                                            <span className={`text-[10px] ${isTraktConnected ? 'text-green-500' : 'text-white/30'}`}>
                                                {isTraktConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                                            </span>
                                        </div>
                                    </div>
                                    {isTraktConnected ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500/50" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-white/10" />
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
                                        active ? 'bg-white/5' : ''
                                    } group flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isAniListConnected ? 'bg-sky-500/10 text-sky-500' : 'bg-white/5 text-white/40'}`}>
                                            <Book className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col items-start translate-y-[-1px]">
                                            <span className="text-white font-medium text-xs">Đồng bộ Truyện (AniList)</span>
                                            <span className={`text-[10px] ${isAniListConnected ? 'text-green-500' : 'text-white/30'}`}>
                                                {isAniListConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                                            </span>
                                        </div>
                                    </div>
                                    {isAniListConnected ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500/50" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-white/10" />
                                    )}
                                </button>
                            )}
                        </Menu.Item>
                    </div>

                    <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5">
                        <p className="text-[9px] text-white/20 italic">
                            Tự động đồng bộ hóa tiến trình xem/đọc của bạn lên các nền tảng đám mây.
                        </p>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
