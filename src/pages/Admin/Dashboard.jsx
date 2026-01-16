import React, { useEffect, useState } from 'react';
import { Users, Briefcase, FileText, AlertTriangle, Banknote, Clock, TrendingUp, UserMinus, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const AdminOverview = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeMembers: 0,
        passiveMembers: 0,
        unrealizedTotal: 0,
        unrealizedLoans: 0,
        unrealizedKaryawan: 0,
        activeLoansCount: 0,
        pengajuan: 0,
        monthlyRealisasiAmount: 0,
        monthlyRealisasiCount: 0
    });

    const [memberData, setMemberData] = useState([]);
    const [loanTrendData, setLoanTrendData] = useState([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // 1. Fetch Basic Counts
            const { data: activeMem } = await supabase
                .from('personal_data')
                .select('id', { count: 'exact' })
                .in('status', ['ACTIVE', 'ACTIVED', 'VERIFIED', 'active', 'verified', 'DONE VERIFIKASI']);

            const { data: passiveMem } = await supabase
                .from('personal_data')
                .select('id', { count: 'exact' })
                .in('status', ['NON_ACTIVE', 'NONAKTIF', 'PASIF']);

            const { count: activeLoans } = await supabase
                .from('pinjaman')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'DICAIRKAN');

            const { count: pengajuan } = await supabase
                .from('pinjaman')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENGAJUAN');



            // 2. Fetch LOAN Data (Pending & Monthly)
            // PENDING LOANS: Status DICAIRKAN, Delivery != SENT
            const { data: allDicairkan } = await supabase
                .from('pinjaman')
                .select('jumlah_pinjaman, outstanding, delivery_status')
                .eq('status', 'DICAIRKAN');

            // Robust filter: catch NULLs or explicit PENDING
            const pendingLoansData = (allDicairkan || []).filter(l => l.delivery_status !== 'SENT');

            const calcLoanNet = (loans) => {
                return (loans || []).reduce((sum, l) => {
                    const principal = parseFloat(l.jumlah_pinjaman || 0);
                    const deduction = parseFloat(l.outstanding || 0); // Outstanding here works as deduction
                    return sum + (principal - deduction - 5000); // Net = Principal - Potongan - Admin
                }, 0);
            };

            const pendingLoansNet = calcLoanNet(pendingLoansData);
            const pendingLoansCount = pendingLoansData?.length || 0;

            // Monthly Loans: SENT this month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data: monthlyLoansData } = await supabase
                .from('pinjaman')
                .select('jumlah_pinjaman, outstanding, delivery_date')
                .eq('delivery_status', 'SENT')
                .gte('delivery_date', startOfMonth);

            const monthlyLoansNet = calcLoanNet(monthlyLoansData);
            const monthlyLoansCount = monthlyLoansData?.length || 0;



            // 3. Fetch EXIT Data (Pending & Monthly)

            // PENDING EXITS: Status NON_ACTIVE, Exit Realisasi != SENT
            const { data: allNonActive } = await supabase
                .from('personal_data')
                .select('id, exit_realisasi_status')
                .in('status', ['NON_ACTIVE', 'NONAKTIF']);

            const pendingExitMembers = (allNonActive || []).filter(m => m.exit_realisasi_status !== 'SENT');
            const pendingExitIds = pendingExitMembers.map(m => m.id);

            // Monthly Exits
            const { data: monthlyExitMembers } = await supabase
                .from('personal_data')
                .select('id')
                .eq('exit_realisasi_status', 'SENT')
                .gte('exit_realisasi_date', startOfMonth);

            const monthlyExitIds = monthlyExitMembers?.map(m => m.id) || [];
            const allExitIds = [...pendingExitIds, ...monthlyExitIds];

            let exitNetMap = {}; // Map<id, amount>

            if (allExitIds.length > 0) {
                // Bulk Fetch Savings (PAID)
                const { data: allSavings } = await supabase
                    .from('simpanan')
                    .select('personal_data_id, amount, transaction_type, type')
                    .in('personal_data_id', allExitIds)
                    .eq('status', 'PAID');

                // Bulk Fetch Unpaid Installments
                const { data: allUnpaid } = await supabase
                    .from('angsuran')
                    .select('personal_data_id, pinjaman(jumlah_pinjaman, tenor_bulan, nilai_bunga, tipe_bunga, jumlah_pinjaman)')
                    .in('personal_data_id', allExitIds)
                    .eq('status', 'UNPAID');

                allExitIds.forEach(id => {
                    // Savings
                    const memberSavings = allSavings?.filter(s => s.personal_data_id === id) || [];
                    let totalSavings = 0;
                    memberSavings.forEach(s => {
                        const amt = parseFloat(s.amount || 0);
                        if (s.transaction_type === 'SETOR') totalSavings += amt;
                        else totalSavings -= amt;
                    });

                    // Outstanding Loans
                    const memberUnpaid = allUnpaid?.filter(u => u.personal_data_id === id) || [];
                    let totalOuts = 0;
                    memberUnpaid.forEach(u => {
                        const loan = u.pinjaman;
                        if (loan) {
                            const principal = parseFloat(loan.jumlah_pinjaman || 0);
                            const tenor = loan.tenor_bulan || 1;
                            let totalBunga = 0;
                            if (loan.tipe_bunga === 'PERSENAN') {
                                totalBunga = principal * (parseFloat(loan.nilai_bunga || 0) / 100) * (tenor / 12);
                            } else if (loan.tipe_bunga === 'NOMINAL') {
                                totalBunga = parseFloat(loan.nilai_bunga || 0);
                            }
                            totalOuts += (principal / tenor) + (totalBunga / tenor);
                        }
                    });

                    exitNetMap[id] = totalSavings - totalOuts - 5000;
                });
            }

            const pendingExitsNet = pendingExitIds.reduce((sum, id) => sum + (exitNetMap[id] || 0), 0);
            const monthlyExitsNet = monthlyExitIds.reduce((sum, id) => sum + (exitNetMap[id] || 0), 0);
            const pendingExitsCount = pendingExitIds.length;
            const monthlyExitsCount = monthlyExitIds.length;


            // 4. Aggregations
            const totalMonthlyNet = monthlyLoansNet + monthlyExitsNet;
            const totalPendingNet = pendingLoansNet + pendingExitsNet;

            setStats({
                activeMembers: activeMem?.length || 0,
                passiveMembers: passiveMem?.length || 0,
                unrealizedTotal: totalPendingNet, // Now displays Total Net Amount, not Count
                unrealizedLoans: pendingLoansCount,
                unrealizedKaryawan: pendingExitsCount,
                activeLoansCount: activeLoans || 0,
                pengajuan: pengajuan || 0,
                monthlyRealisasiAmount: totalMonthlyNet,
                monthlyRealisasiCount: monthlyLoansCount + monthlyExitsCount,
                monthlyLoanCount: monthlyLoansCount,
                monthlyExitCount: monthlyExitsCount
            });

            // Data for Pie Chart
            setMemberData([
                { name: 'Aktif', value: activeMem?.length || 0, color: '#10b981' },
                { name: 'Pasif', value: passiveMem?.length || 0, color: '#ef4444' }
            ]);

            // Daily Chart Data (Targeting last 14 days)
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const fourteenDaysAgoISO = fourteenDaysAgo.toISOString().split('T')[0];

            // Fetch sent loans
            const { data: sentLoans } = await supabase
                .from('pinjaman')
                .select('jumlah_pinjaman, outstanding, delivery_date')
                .eq('delivery_status', 'SENT')
                .gte('delivery_date', fourteenDaysAgoISO);

            // Group by Date for Chart
            const dailyMap = {};
            for (let i = 0; i < 15; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const label = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                dailyMap[dateStr] = { label, amount: 0, count: 0 };
            }

            sentLoans?.forEach(l => {
                const d = l.delivery_date?.split('T')[0];
                if (dailyMap[d]) {
                    // Net Amount for chart
                    const net = parseFloat(l.jumlah_pinjaman || 0) - parseFloat(l.outstanding || 0) - 5000;
                    dailyMap[d].amount += net;
                    dailyMap[d].count += 1;
                }
            });

            const finalTrend = Object.values(dailyMap).reverse();
            setLoanTrendData(finalTrend);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight italic">Dashboard Koperasi</h2>
                    <p className="text-sm text-gray-500 font-medium">Ringkasan aktivitas dan performa sistem hari ini</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Status Sistem</p>
                    <p className="text-xs font-bold text-emerald-800">Operational • Optimal</p>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                <StatCard
                    title="Anggota Aktif"
                    value={stats.activeMembers}
                    icon={UserCheck}
                    trend="+12% bulan ini"
                    color="emerald"
                />
                <StatCard
                    title="Anggota Pasif"
                    value={stats.passiveMembers}
                    icon={UserMinus}
                    color="red"
                />
                <StatCard
                    title="Pinjaman Aktif"
                    value={stats.activeLoansCount}
                    icon={Briefcase}
                    color="blue"
                />
                <StatCard
                    title="Pengajuan Baru"
                    value={stats.pengajuan}
                    icon={FileText}
                    color="amber"
                />
            </div>

            {/* Secondary Stats Group */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                <HighlightCard
                    title="Pending Realisasi"
                    value={formatCurrency(stats.unrealizedTotal)}
                    subtitle={`${stats.unrealizedLoans} Pinjaman • ${stats.unrealizedKaryawan} Karyawan`}
                    icon={Clock}
                    color="red"
                />
                <HighlightCard
                    title="Realisasi Bulan Ini"
                    value={formatCurrency(stats.monthlyRealisasiAmount)}
                    subtitle={`${stats.monthlyRealisasiCount} Total Transaksi (${stats.monthlyLoanCount} Pinjaman • ${stats.monthlyExitCount} Karyawan)`}
                    icon={TrendingUp}
                    color="emerald"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Member Distribution */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest italic text-left">Distribusi Anggota</h3>
                        <Users size={16} className="text-gray-400" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={memberData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {memberData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-around mt-4">
                        {memberData.map(item => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-[10px] font-black text-gray-500 uppercase italic">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loan Trend */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1 text-left">
                            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest italic">Tren Realisasi Pinjaman</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase italic tracking-tight">Harian (14 Hari Terakhir)</p>
                        </div>
                        <TrendingUp size={16} className="text-gray-400" />
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={loanTrendData}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="label"
                                    border={false}
                                    tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    hide
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#10b981' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAmount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, trend, color }) => {
    const colorClasses = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        red: "bg-red-50 text-red-600 border-red-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]} border transition-all group-hover:scale-110`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase italic tracking-tighter">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">{value}</h3>
            </div>
            {/* Subtle background decoration */}
            <Icon className="absolute -bottom-4 -right-4 opacity-[0.03] text-gray-900" size={100} />
        </div>
    );
};

const HighlightCard = ({ title, value, subtitle, icon: Icon, color }) => {
    const colorClasses = {
        orange: "from-orange-500 to-amber-500",
        emerald: "from-emerald-600 to-teal-600",
        red: "from-red-600 to-rose-600",
    };

    return (
        <div className={`p-6 rounded-3xl shadow-xl shadow-${color}-900/10 bg-gradient-to-br ${colorClasses[color]} relative overflow-hidden group`}>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white">
                        <Icon size={20} />
                    </div>
                </div>
                <div className="mt-8">
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest italic mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-white tracking-tight italic">{value}</h3>
                    <p className="text-[10px] text-white/60 font-medium uppercase tracking-tighter mt-1 italic">{subtitle}</p>
                </div>
            </div>
            <Icon className="absolute -right-8 -bottom-8 text-white opacity-10 rotate-12 transition-transform group-hover:scale-110" size={160} />
        </div>
    );
};

export default AdminOverview;
