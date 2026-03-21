"use client";

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserCircle, LogOut, Settings, Film, Book, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrakt } from '@/hooks/useTrakt';
import { useAniList } from '@/hooks/useAniList';
import Link from 'next/link';

export function ProfileDropdown() {
    const { user, logout } = useAuth();
    const { isConnected: isTraktConnected, login: loginTrakt } = useTrakt();
    const { isConnected: isAniListConnected, login: loginAniList } = useAniList();

    if (!user) return null;

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-primary/50 transition-all outline-none group">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                            <User className="w-4 h-4" />
                        </div>
                    )}
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
                <Menu.Items className="absolute right-0 mt-3 w-72 origin-top-right rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                    {/* User Header */}
                    <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1">Tài khoản</p>
                        <p className="text-sm font-bold text-white truncate">{user.email}</p>
                    </div>

                    <div className="p-2">
                        {/* Sync Section */}
                        <div className="px-3 py-2">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Đồng bộ</h3>
                        </div>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={loginTrakt}
                                    className={`${
                                        active ? 'bg-white/5' : ''
                                    } group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isTraktConnected ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/40'}`}>
                                            <Film className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col items-start translate-y-[-1px]">
                                            <span className="text-white font-medium text-xs">Phim (Trakt)</span>
                                            <span className={`text-[9px] ${isTraktConnected ? 'text-green-500' : 'text-white/20'}`}>
                                                {isTraktConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                                            </span>
                                        </div>
                                    </div>
                                    {isTraktConnected ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500/50" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5 text-white/10" />
                                    )}
                                </button>
                            )}
                        </Menu.Item>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={loginAniList}
                                    className={`${
                                        active ? 'bg-white/5' : ''
                                    } group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isAniListConnected ? 'bg-sky-500/10 text-sky-500' : 'bg-white/5 text-white/40'}`}>
                                            <Book className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col items-start translate-y-[-1px]">
                                            <span className="text-white font-medium text-xs">Truyện (AniList)</span>
                                            <span className={`text-[9px] ${isAniListConnected ? 'text-green-500' : 'text-white/20'}`}>
                                                {isAniListConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                                            </span>
                                        </div>
                                    </div>
                                    {isAniListConnected ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500/50" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5 text-white/10" />
                                    )}
                                </button>
                            )}
                        </Menu.Item>

                        <div className="my-2 border-t border-white/5" />

                        {/* Logout Section */}
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => logout()}
                                    className={`${
                                        active ? 'bg-red-500/10 text-red-500' : 'text-white/60'
                                    } group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all`}
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="text-xs uppercase tracking-widest">Đăng xuất</span>
                                </button>
                            )}
                        </Menu.Item>
                    </div>

                    <div className="px-5 py-3 bg-white/[0.02] border-t border-white/5">
                        <p className="text-[9px] text-white/20 italic">
                            Website Personal • Noir Edition
                        </p>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
