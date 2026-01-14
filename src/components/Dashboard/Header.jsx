import React, { useEffect, useRef } from 'react';
import { Menu, Bell, User } from 'lucide-react';
import gsap from 'gsap';

const Header = ({ sidebarOpen, setSidebarOpen, title, user, initials }) => {
    const headerRef = useRef(null);

    useEffect(() => {
        if (!headerRef.current) return;

        const ctx = gsap.context(() => {
            gsap.from(headerRef.current, {
                y: -20,
                opacity: 0,
                duration: 0.6,
                delay: 0.2,
                ease: 'power2.out'
            });
        });
        return () => ctx.revert();
    }, []);

    return (
        <header
            ref={headerRef}
            className="h-20 bg-white border-b border-gray-100 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl bg-white/80 supports-[backdrop-filter]:bg-white/60"
        >
            <div className="flex items-center gap-6">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg text-gray-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="h-6 w-[1px] bg-gray-200 hidden md:block"></div>
                <h1 className="text-xl font-bold text-gray-800 hidden md:block tracking-tight">
                    {title}
                </h1>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative group">
                    <button className="p-2 rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors relative">
                        <Bell size={22} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                    </button>
                    {/* Tooltip or Dropdown could go here */}
                </div>

                <div className="flex items-center gap-3 md:gap-4 pl-6 md:border-l border-gray-100">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-800">{user?.name || 'User'}</p>
                        <p className="text-xs text-emerald-600 font-medium tracking-wide">
                            {user?.role || 'Member'}
                        </p>
                    </div>

                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 text-white font-bold flex items-center justify-center shadow-lg shadow-slate-200 border-2 border-white cursor-pointer hover:scale-105 transition-transform">
                            {initials}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
