import React from 'react';
import Link from 'next/link';

export function StitchFooter() {
    return (
        <footer className="py-24 px-6 lg:px-24 border-t border-outline-variant/10 bg-surface theme-truyen">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                <div className="col-span-1 lg:col-span-2">
                    <h2 className="text-3xl font-black font-headline tracking-tighter uppercase mb-6 text-on-surface">Hồ Truyện</h2>
                    <p className="text-on-surface-variant text-sm leading-loose max-w-md font-light font-body">
                        Nền tảng lưu trữ và chia sẻ trải nghiệm đọc truyện kỹ thuật số hàng đầu. Chúng tôi trân trọng nghệ thuật đồ họa và sức mạnh của những câu chuyện.
                    </p>
                </div>
                <div>
                    <h6 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-6 font-label">Navigation</h6>
                    <ul className="flex flex-col gap-3 font-body">
                        <li><Link className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="/truyen">Tuyển tập</Link></li>
                        <li><Link className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="/truyen">Tác giả</Link></li>
                        <li><Link className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="/truyen">Xuất bản</Link></li>
                        <li><Link className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="/truyen">Về chúng tôi</Link></li>
                    </ul>
                </div>
                <div>
                    <h6 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-6 font-label">Connect</h6>
                    <ul className="flex flex-col gap-3 font-body">
                        <li><a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Discord Community</a></li>
                        <li><a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Facebook Page</a></li>
                        <li><a className="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Instagram</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-[1440px] mx-auto mt-24 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 font-label">© 2024 HỒ TRUYỆN DIGITAL ARCHIVE. ALL RIGHTS RESERVED.</p>
                <div className="flex gap-8 font-label">
                </div>
            </div>
        </footer>
    );
}
