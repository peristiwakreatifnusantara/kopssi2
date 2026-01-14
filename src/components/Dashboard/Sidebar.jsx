import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import gsap from 'gsap';

const Sidebar = ({ isOpen, navItems, onLogout, onNavItemClick }) => {
    const sidebarRef = useRef(null);

    // Entrance animation (mount)
    useEffect(() => {
        if (!sidebarRef.current) return;

        const ctx = gsap.context(() => {
            gsap.from(sidebarRef.current, {
                x: -24,
                opacity: 0,
                duration: 0.45,
                ease: 'power2.out'
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <aside
            ref={sidebarRef}
            className={`
                flex flex-col h-full
                bg-slate-900 text-slate-200
                border-r border-slate-800
                ${isOpen ? 'w-72' : 'w-20'}
                transition-all duration-300
            `}
        >
            {/* LOGO */}
            <div className="h-16 flex items-center justify-center border-b border-slate-800">
                <span className="font-semibold tracking-wide text-emerald-400">
                    {isOpen ? 'SSI SYSTEM' : 'SSI'}
                </span>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onNavItemClick}
                        className={({ isActive }) =>
                            `
                            group relative flex items-center gap-3
                            px-3 py-2.5 rounded-lg
                            text-sm font-medium
                            transition-colors
                            ${isActive
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                            }
                        `
                        }
                    >
                        {/* Active indicator */}
                        <span
                            className={`
                                absolute left-0 top-1/2 -translate-y-1/2
                                h-6 w-1 rounded-r
                                bg-emerald-500
                                transition-opacity
                                ${location?.pathname === item.path ? 'opacity-100' : 'opacity-0'}
                            `}
                        />

                        {/* Icon */}
                        <span className="relative z-10 flex items-center justify-center">
                            {item.icon}
                        </span>

                        {/* Label */}
                        {isOpen && (
                            <span className="relative z-10 whitespace-nowrap">
                                {item.label}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* LOGOUT */}
            <div className="p-3 border-t border-slate-800">
                <button
                    onClick={onLogout}
                    className={`
                        w-full flex items-center gap-3
                        px-3 py-2.5 rounded-lg
                        text-sm font-medium
                        text-slate-400
                        hover:bg-rose-500/10 hover:text-rose-400
                        transition-colors
                        ${!isOpen && 'justify-center'}
                    `}
                >
                    <LogOut size={20} />
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
