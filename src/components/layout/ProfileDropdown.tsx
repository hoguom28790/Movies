"use client";

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, Film, Book, CheckCircle2, ChevronRight, User, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrakt } from '@/hooks/useTrakt';
import { useAniList } from '@/hooks/useAniList';

export function ProfileDropdown() {
    const { user, logout } = useAuth();
    const { isConnected: isTraktConnected, login: loginTrakt } = useTrakt();
    const { isConnected: isAniListConnected, login: loginAniList } = useAniList();
    const [autoSkipIntro, setAutoSkipIntro] = React.useState(false);

    React.useEffect(() => {
        if (!user) return;
        const loadSettings = async () => {
            try {
                const { getUserSettings } = await import("@/services/db");
                const settings = await getUserSettings(user.uid);
                if (settings) {
                    setAutoSkipIntro(!!settings.autoSkipIntro);
                }
            } catch (err) {
                console.error("Lỗi khi tải cài đặt:", err);
            }
        };
        loadSettings();
    }, [user]);

    if (!user) return null;

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all outline-none group active-depth bg-surface-tonal shadow-cinematic">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/40 group-hover:text-primary transition-colors">
                            <User className="w-5 h-5 stroke-[2.5px]" />
                        </div>
                    )}
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
                    {/* User Header */}
                    <div className="px-6 py-6 border-b border-white/5 bg-foreground/[0.03] flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                           <img src={user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic leading-none">Pro Member</p>
                           <p className="text-sm font-black text-foreground truncate max-w-full italic uppercase tracking-tight">{user.displayName || user.email?.split('@')[0]}</p>
                        </div>
                    </div>

                    <div className="p-3 space-y-1">
                        {/* Settings Group */}
                        <div className="px-4 py-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">Cá nhân hóa</h3>
                        </div>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={async () => {
                                        const { saveUserSettings } = await import("@/services/db");
                                        const newValue = !autoSkipIntro;
                                        setAutoSkipIntro(newValue);
                                        await saveUserSettings(user.uid, { autoSkipIntro: newValue });
                                    }}
                                    className={`${
                                        active ? 'bg-foreground/5 translate-x-1' : ''
                                    } group flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl transition-all duration-500 ${autoSkipIntro ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-foreground/5 text-foreground/40'}`}>
                                            <ShieldCheck className="h-5 w-5 stroke-[2.5px]" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-foreground font-black text-[13px] italic uppercase tracking-tight leading-none">Auto Skip Intro</span>
                                            <span className="text-[9px] text-foreground/30 font-bold uppercase tracking-wider mt-1 italic">Tự động tua qua mở đầu</span>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-all duration-500 border border-white/5 ${autoSkipIntro ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'bg-foreground/10'}`}>
                                        <div className={`absolute top-1 w-2.5 h-2.5 rounded-full bg-white transition-all duration-500 shadow-sm ${autoSkipIntro ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </button>
                            )}
                        </Menu.Item>

                        <div className="my-2 border-t border-white/5" />

                        {/* Integration Group */}
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={loginTrakt}
                                    className={`${
                                        active ? 'bg-foreground/5 translate-x-1' : ''
                                    } group flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl transition-all duration-500 shadow-sm ${isTraktConnected ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-foreground/5 text-foreground/40'}`}>
                                            <Film className="h-5 w-5 stroke-[2.5px]" />
                                        </div>
                                        <div className="flex flex-col items-start px-0.5">
                                            <span className="text-foreground font-black text-[13px] italic uppercase tracking-tight leading-none">Phim (Trakt)</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 italic ${isTraktConnected ? 'text-green-500' : 'text-foreground/30'}`}>
                                                {isTraktConnected ? 'Đã kết nối' : 'Cần kết nối'}
                                            </span>
                                        </div>
                                    </div>
                                    {isTraktConnected ? (
                                        <div className="p-1.5 rounded-full bg-green-500/10 text-green-500">
                                            <CheckCircle2 className="h-4 w-4 stroke-[3px]" />
                                        </div>
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-foreground/10" />
                                    )}
                                </button>
                            )}
                        </Menu.Item>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={loginAniList}
                                    className={`${
                                        active ? 'bg-foreground/5 translate-x-1' : ''
                                    } group flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl transition-all duration-500 shadow-sm ${isAniListConnected ? 'bg-sky-500 text-white shadow-sky-500/30' : 'bg-foreground/5 text-foreground/40'}`}>
                                            <Book className="h-5 w-5 stroke-[2.5px]" />
                                        </div>
                                        <div className="flex flex-col items-start px-0.5">
                                            <span className="text-foreground font-black text-[13px] italic uppercase tracking-tight leading-none">Truyện (AniList)</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 italic ${isAniListConnected ? 'text-green-500' : 'text-foreground/30'}`}>
                                                {isAniListConnected ? 'Đã kết nối' : 'Cần kết nối'}
                                            </span>
                                        </div>
                                    </div>
                                    {isAniListConnected ? (
                                        <div className="p-1.5 rounded-full bg-green-500/10 text-green-500">
                                            <CheckCircle2 className="h-4 w-4 stroke-[3px]" />
                                        </div>
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-foreground/10" />
                                    )}
                                </button>
                            )}
                        </Menu.Item>

                        <div className="my-2 border-t border-white/5" />

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => logout()}
                                    className={`${
                                        active ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 translate-x-1' : 'text-foreground/40'
                                    } group flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-500 border border-transparent hover:border-red-500/20`}
                                >
                                    <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-red-500/10 text-red-500'} transition-colors`}>
                                        <LogOut className="h-4 w-4 stroke-[3px]" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Đăng xuất</span>
                                </button>
                            )}
                        </Menu.Item>
                    </div>

                    <div className="px-6 py-4 bg-foreground/[0.05] border-t border-white/5 flex items-center justify-between">
                        <p className="text-[9px] text-foreground/20 italic font-black uppercase tracking-[0.2em]">
                           PRO MAX UI 2026
                        </p>
                        <Heart className="w-3.5 h-3.5 text-primary/40 animate-pulse fill-current" />
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}

