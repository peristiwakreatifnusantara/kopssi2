import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    CreditCard,
    CalendarDays,
    FileText,
    User,
    Shield,
    Clock
} from 'lucide-react';
import LogoutModal from '../components/LogoutModal';
import Sidebar from '../components/Dashboard/Sidebar';
import Header from '../components/Dashboard/Header';

const DashboardLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [authUser, setAuthUser] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    // =====================
    // RESPONSIVE STATE
    // =====================
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        // Set initial state
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // =====================
    // CEK LOGIN
    // =====================
    useEffect(() => {
        const storedUser = localStorage.getItem('auth_user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        setAuthUser(JSON.parse(storedUser));
    }, [navigate]);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('auth_user');
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    if (!authUser) return null;

    // =====================
    // NAV ITEMS (MEMBER)
    // =====================
    const memberNav = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
        { path: '/dashboard/simpanan', label: 'Simpanan Saya', icon: <Wallet size={20} /> },
        { path: '/dashboard/pinjaman', label: 'Pinjaman Saya', icon: <CreditCard size={20} /> },
        { path: '/dashboard/angsuran', label: 'Angsuran Saya', icon: <CalendarDays size={20} /> },
        { path: '/dashboard/pengajuan-pinjaman', label: 'Form Pengajuan', icon: <FileText size={20} /> },
        { path: '/dashboard/riwayat-pengajuan', label: 'Status Pengajuan', icon: <Clock size={20} /> },
        { path: '/dashboard/profil', label: 'Profil', icon: <User size={20} /> },
    ];

    // =====================
    // NAV ITEMS (ADMIN)
    // =====================
    const adminNav = [
        { path: '/admin', label: 'Dashboard Admin', icon: <LayoutDashboard size={20} />, end: true },
        { path: '/admin/pengajuan-anggota', label: 'Pengajuan Anggota', icon: <FileText size={20} /> },
        { path: '/admin/members', label: 'Data Anggota', icon: <User size={20} /> },
        { path: '/admin/assesment-pinjaman', label: 'Penyetujuan Pinjaman', icon: <Shield size={20} /> },
        { path: '/admin/pencairan-pinjaman', label: 'Pencairan Pinjaman', icon: <CreditCard size={20} /> },
    ];

    const navItems = authUser.role === 'ADMIN' ? adminNav : memberNav;

    const currentItem =
        navItems.find(item => item.path === location.pathname) || { label: 'Dashboard' };

    const initials = authUser.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800">
            {/* MOBILE BACKDROP */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR COMPONENT */}
            <div className={`fixed md:relative z-30 h-full transition-all duration-300 md:translate-x-0 
                ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}`}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    navItems={navItems}
                    onLogout={handleLogoutClick}
                    onNavItemClick={() => {
                        if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                />
            </div>

            {/* MAIN CONTENT AREA */}
            <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen && window.innerWidth >= 768 ? 'md:ml-0' : 'ml-0'}`}>
                {/* HEADER COMPONENT */}
                <Header
                    sidebarOpen={isSidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    title={currentItem.label}
                    user={authUser}
                    initials={initials}
                />

                {/* PAGE CONTENT */}
                <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 relative w-full">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </div>
    );
};

export default DashboardLayout;
