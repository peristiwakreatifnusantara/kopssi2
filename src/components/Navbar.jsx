import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = ({ onNavigate, onLoginClick, onRegisterClick, activeTab }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'about', label: 'About Us' },
        { id: 'personil', label: 'Personil' },
        { id: 'business', label: 'Business' },
    ];

    const handleMobileNavigate = (id) => {
        onNavigate(id);
        setMobileMenuOpen(false);
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-4 border-b border-gray-100' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <div
                    className="flex items-center gap-3 cursor-pointer z-50 relative"
                    onClick={() => {
                        onNavigate('home');
                        setMobileMenuOpen(false);
                    }}
                >
                    <img src="/Logo.png" alt="KOPSSI Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
                    <div className="flex flex-col">
                        <span className="text-xl font-extrabold text-slate-900 leading-none tracking-tight">KOPSSI</span>
                        <span className="text-[10px] font-bold text-blue-900 tracking-widest uppercase">Koperasi Simpan Pinjam Swadharma</span>
                    </div>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`text-sm font-semibold transition-all duration-300 hover:text-blue-700 ${activeTab === item.id ? 'text-blue-900' : 'text-slate-600'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <button
                        onClick={onLoginClick}
                        className="px-6 py-2.5 rounded-full border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-all text-sm"
                    >
                        Login
                    </button>
                    <button
                        onClick={onRegisterClick}
                        className="ml-2 px-6 py-2.5 rounded-full bg-blue-900 text-white font-bold hover:bg-blue-800 transition-all shadow-lg hover:shadow-blue-900/30 text-sm"
                    >
                        Cek Keanggotaan
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-gray-900 z-50 relative p-2 focus:outline-none"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Mobile Menu Overlay */}
                <div className={`fixed inset-0 bg-white z-40 flex flex-col items-center justify-center transition-all duration-300 transform ${mobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                    <div className="flex flex-col items-center gap-8 text-lg">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleMobileNavigate(item.id)}
                                className={`font-semibold transition-colors ${activeTab === item.id ? 'text-emerald-600' : 'text-gray-800'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="flex flex-col gap-4 mt-8 w-64">
                            <button
                                onClick={() => {
                                    onLoginClick();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full px-6 py-3 rounded-full border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-all"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => {
                                    onRegisterClick();
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full px-6 py-3 rounded-full bg-blue-900 text-white font-bold shadow-lg hover:bg-blue-800 transition-all"
                            >
                                Cek Keanggotaan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
