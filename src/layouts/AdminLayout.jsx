import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    Bell,
    UserPlus,
    ClipboardCheck,
    Banknote,
    FileBarChart,
    ChevronDown,
    BanknoteArrowUp,
    ArrowLeftRight,
    Upload,
    BadgeCent,
    Send
} from 'lucide-react';
import LogoutModal from '../components/LogoutModal';

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({});
    const [pendingCount, setPendingCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogoutClick = () => setIsLogoutModalOpen(true);

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    const navItems = [
        {
            path: '/admin',
            label: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            end: true
        },
        {
            label: 'Manajemen Anggota',
            icon: <Users size={20} />,
            children: [
                { path: '/admin/pengajuan-anggota', label: 'Pengajuan Anggota', icon: <UserPlus size={18} /> },
                { path: '/admin/members', label: 'Data Anggota', icon: <Users size={18} /> },
                { path: '/admin/add-member', label: 'Tambah Anggota', icon: <UserPlus size={18} /> },
            ]
        },
        {
            label: 'Pinjaman',
            icon: <BadgeCent size={20} />,
            children: [
                { path: '/admin/assesment-pinjaman', label: 'Pengajuan Pinjaman', icon: <ClipboardCheck size={18} /> },
                { path: '/admin/pencairan-pinjaman', label: 'Pencairan Pinjaman', icon: <BanknoteArrowUp size={18} /> },
                { path: '/admin/monitor-pinjaman', label: 'Monitoring Pinjaman', icon: <BadgeCent size={18} /> },

            ]
        },
        {
            label: 'Keuangan',
            icon: <Banknote size={20} />,
            children: [
                { path: '/admin/monitor-simpanan', label: 'Monitoring Simpanan', icon: <Banknote size={18} /> },
                { path: '/admin/monitor-angsuran', label: 'Monitoring Angsuran', icon: <ClipboardCheck size={18} /> },
                { path: '/admin/transaksi', label: 'Transaksi', icon: <ArrowLeftRight size={18} /> },
                { path: '/admin/disbursement-delivery', label: 'Realisasi Pinjaman', icon: <Send size={18} /> },
                { path: '/admin/realisasi-karyawan', label: 'Realisasi Karyawan', icon: <Users size={18} /> },
            ]
        },
        {
            label: 'Upload Pembayaran',
            icon: <Upload size={20} />,
            children: [
                { path: '/admin/upload-simpanan', label: 'Upload Simpanan', icon: <Banknote size={18} /> },
                { path: '/admin/upload-pinjaman', label: 'Upload angsuran', icon: <ClipboardCheck size={18} /> },
            ]
        },
        {
            label: 'Database',
            icon: <Settings size={20} />,
            children: [
                { path: '/admin/master-data', label: 'Master Data', icon: <ClipboardCheck size={18} /> },
            ]
        },
        {
            path: '/admin/reports',
            label: 'Laporan',
            icon: <FileBarChart size={20} />
        }
    ];

    useEffect(() => {
        fetchPendingCount();

        // Setup realtime subscription
        const channel = supabase
            .channel('personal_data_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'personal_data'
            }, () => {
                fetchPendingCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchPendingCount = async () => {
        try {
            const { count, error } = await supabase
                .from('personal_data')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'DONE VERIFIKASI');

            if (error) throw error;
            setPendingCount(count || 0);
        } catch (err) {
            console.error('Error fetching pending count:', err);
        }
    };

    // AUTO OPEN SUBMENU SESUAI URL
    useEffect(() => {
        const activeMenus = {};
        navItems.forEach((item, idx) => {
            if (item.children?.some(sub => location.pathname.startsWith(sub.path))) {
                activeMenus[idx] = true;
            }
        });
        setOpenMenus(activeMenus);
    }, [location.pathname]);

    const toggleMenu = (idx) => {
        setOpenMenus(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const currentItem =
        navItems
            .flatMap(i => i.children ?? i)
            .find(i => i.path === location.pathname) || { label: 'Admin Panel' };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800">
            {/* SIDEBAR */}
            <aside className={`bg-white border-r border-gray-200 shadow-sm
                ${isSidebarOpen ? 'w-64' : 'w-20'}
                fixed md:relative h-full z-20 transition-all duration-300`}
            >
                <div className="h-16 flex items-center justify-center bg-emerald-600 text-white font-bold">
                    {isSidebarOpen ? 'ADMIN PANEL' : 'AP'}
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item, idx) => (
                        <div key={idx}>
                            {/* PARENT */}
                            {item.path ? (
                                <NavLink
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition
                                        ${isActive
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`
                                    }
                                >
                                    <div className="relative">
                                        {item.icon}
                                        {item.label === 'Manajemen Anggota' && pendingCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                        )}
                                    </div>
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </NavLink>
                            ) : (
                                <button
                                    onClick={() => toggleMenu(idx)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {item.icon}
                                            {item.label === 'Manajemen Anggota' && pendingCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                            )}
                                        </div>
                                        {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                                    </div>
                                    {isSidebarOpen && (
                                        <ChevronDown
                                            size={16}
                                            className={`transition-transform duration-300 ${openMenus[idx] ? 'rotate-180' : ''
                                                }`}
                                        />
                                    )}
                                </button>
                            )}

                            {/* SUBMENU ANIMATED */}
                            {item.children && (
                                <div
                                    className={`
                                        ml-9 overflow-hidden transition-all duration-300 ease-in-out
                                        ${openMenus[idx] && isSidebarOpen
                                            ? 'max-h-64 opacity-100 mt-1'
                                            : 'max-h-0 opacity-0'}
                                    `}
                                >
                                    <div className="space-y-1">
                                        {item.children.map(sub => (
                                            <NavLink
                                                key={sub.path}
                                                to={sub.path}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition
                                                    ${isActive
                                                        ? 'text-emerald-600 bg-emerald-50'
                                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`
                                                }
                                            >
                                                <div className="relative">
                                                    {sub.icon}
                                                    {sub.label === 'Pengajuan Anggota' && pendingCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                                    )}
                                                </div>
                                                <span>{sub.label}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-3 border-t border-gray-100">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg font-bold hidden md:block">
                            {currentItem.label}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <Bell size={20} className="text-gray-500" />
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600">
                            AD
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 bg-emerald-50/30">
                    <Outlet />
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

export default AdminLayout;
