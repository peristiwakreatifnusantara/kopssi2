import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, AlertCircle, CreditCard, Wallet, TrendingUp } from 'lucide-react';
import gsap from 'gsap';
import { supabase } from '../../lib/supabaseClient';

const Card = ({ title, value, subtext, icon, type }) => {
    // Type definitions for styling
    const styles = {
        primary: { // Red (Default/Pinjaman)
            bg: 'bg-red-600 text-white',
            subtext: 'text-red-100',
            iconBg: 'bg-white/20 text-white'
        },
        success: { // Emerald (Simpanan)
            bg: 'bg-emerald-600 text-white',
            subtext: 'text-emerald-100',
            iconBg: 'bg-white/20 text-white'
        },
        warning: { // Amber (Sisa Angsuran)
            bg: 'bg-amber-500 text-white',
            subtext: 'text-amber-100',
            iconBg: 'bg-white/20 text-white'
        },
        default: { // White (Fallback)
            bg: 'bg-white text-gray-800',
            subtext: 'text-gray-500',
            iconBg: 'bg-gray-50 text-gray-600'
        }
    };

    const style = styles[type] || styles.default;

    return (
        <div className={`card-anim p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between ${style.bg}`}>
            <div>
                <p className={`${type && type !== 'default' ? style.subtext : 'text-gray-500'} text-sm font-medium mb-1 opacity-90`}>{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
                <p className={`text-xs mt-2 ${style.subtext} opacity-80`}>{subtext}</p>
            </div>
            <div className={`p-3 rounded-xl ${style.iconBg} backdrop-blur-sm`}>
                {icon}
            </div>
        </div>
    )
};

const Overview = () => {
    const containerRef = useRef(null);
    const [simpananTotal, setSimpananTotal] = useState(0);
    const [pinjamanActive, setPinjamanActive] = useState(0);
    const [nextInstallment, setNextInstallment] = useState(0);
    const [nextDueDate, setNextDueDate] = useState(null);

    const [hasSimpanan, setHasSimpanan] = useState(false);
    const [hasPinjaman, setHasPinjaman] = useState(false);

    const [loading, setLoading] = useState(true);
    const [simpananChartData, setSimpananChartData] = useState([]);
    const [pinjamanChartData, setPinjamanChartData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            console.log("Overview: Fetching started...");
            try {
                // Auth Check with LocalStorage Fallback
                const { data: { user } } = await supabase.auth.getUser();
                let userId = user?.id;

                if (!userId) {
                    const storedUser = localStorage.getItem('auth_user');
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            userId = parsedUser.id;
                        } catch (e) {
                            console.error("Overview: Error parsing stored user", e);
                        }
                    }
                }

                if (!userId) {
                    setLoading(false);
                    return;
                }

                const { data: personalData } = await supabase
                    .from('personal_data')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                if (!personalData) {
                    setLoading(false);
                    return;
                }

                // --- Fetch Simpanan ---
                const { data: simpananData } = await supabase
                    .from('simpanan')
                    .select('*')
                    .eq('personal_data_id', personalData.id);

                if (simpananData && simpananData.length > 0) {
                    let total = 0;
                    const monthlyData = {};

                    simpananData.forEach(item => {
                        const amount = parseFloat(item.amount);
                        if (item.transaction_type === 'SETOR') total += amount;
                        else if (item.transaction_type === 'TARIK') total -= amount;

                        // Chart Data
                        const date = new Date(item.created_at);
                        const month = date.toLocaleString('default', { month: 'short' });
                        if (!monthlyData[month]) monthlyData[month] = 0;
                        if (item.transaction_type === 'SETOR') monthlyData[month] += amount;
                    });

                    setSimpananTotal(total);
                    setHasSimpanan(total > 0);

                    const chartData = Object.keys(monthlyData).map(key => ({
                        name: key,
                        amount: monthlyData[key]
                    }));
                    setSimpananChartData(chartData);
                } else {
                    setHasSimpanan(false);
                }

                // --- Fetch Pinjaman (Active) ---
                const { data: pinjamanData } = await supabase
                    .from('pinjaman')
                    .select('*')
                    .eq('personal_data_id', personalData.id)
                    .eq('status', 'DICAIRKAN');

                if (pinjamanData && pinjamanData.length > 0) {
                    let totalPinjaman = 0;
                    let totalUnpaidInstallments = 0;
                    const pinjamanIds = pinjamanData.map(p => p.id);

                    // Calculate Total Active Loan Principal
                    pinjamanData.forEach(p => totalPinjaman += parseFloat(p.jumlah_pinjaman));
                    setPinjamanActive(totalPinjaman);
                    setHasPinjaman(true);

                    // --- Fetch Angsuran for Active Loans ---
                    const { data: angsuranData } = await supabase
                        .from('angsuran')
                        .select('*')
                        .in('pinjaman_id', pinjamanIds);

                    if (angsuranData) {
                        const unpaidItems = angsuranData
                            .filter(a => a.status !== 'PAID')
                            .sort((a, b) => new Date(a.tanggal_bayar) - new Date(b.tanggal_bayar));
                        
                        if (unpaidItems.length > 0) {
                            const nextItem = unpaidItems[0];
                            setNextInstallment(parseFloat(nextItem.amount));
                            const date = new Date(nextItem.tanggal_bayar);
                            setNextDueDate(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
                        } else {
                            setNextInstallment(0);
                            setNextDueDate(null);
                        }

                        // Calculate total unpaid for chart if needed, or just specific logic
                        unpaidItems.forEach(a => totalUnpaidInstallments += parseFloat(a.amount));
                    }


                    // Mock chart for pinjaman
                    setPinjamanChartData([
                        { name: 'Pokok', sisa: totalPinjaman },
                        { name: 'Sisa', sisa: totalUnpaidInstallments }
                    ]);

                } else {
                    setHasPinjaman(false);
                }

            } catch (error) {
                console.error("Error fetching overview data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // Only animate if elements exist
            const cards = document.querySelectorAll(".card-anim");
            if (cards.length > 0) {
                gsap.from(cards, {
                    y: 30,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "back.out(1.5)"
                });
            }

            const charts = document.querySelectorAll(".chart-anim");
            if (charts.length > 0) {
                gsap.from(charts, {
                    scale: 0.95,
                    opacity: 0,
                    duration: 0.8,
                    delay: 0.3,
                    ease: "power2.out"
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }, [loading]); // Re-run when loading finishes to catch newly rendered elements

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card
                    title="Total Simpanan"
                    value={formatCurrency(simpananTotal)}
                    subtext="Total akumulasi simpanan"
                    icon={<Wallet size={24} />}
                    type="success"
                />
                <Card
                    title="Pinjaman Aktif"
                    value={formatCurrency(pinjamanActive)}
                    subtext="Total pokok pinjaman berjalan"
                    icon={<CreditCard size={24} />}
                    type="primary"
                />
                <Card
                    title="Angsuran yang mendatang"
                    value={formatCurrency(nextInstallment)}
                    subtext={nextDueDate ? `Jatuh tempo: ${nextDueDate}` : "Tidak ada tagihan mendatang"}
                    icon={<AlertCircle size={24} />}
                    type="warning"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simpanan Chart */}
                <div className="chart-anim bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" size={20} />
                        Pertumbuhan Simpanan
                    </h3>
                    <div className="h-64 w-full">
                        {hasSimpanan ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={simpananChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}Jt`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#ECFDF5' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                Data Simpanan Belum Ada
                            </div>
                        )}
                    </div>
                </div>

                {/* Pinjaman Chart */}
                <div className="chart-anim bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} />
                        Status Pinjaman
                    </h3>
                    <div className="h-64 w-full">
                        {hasPinjaman ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={pinjamanChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="sisa" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#F3F4F6' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                Tidak Ada Pinjaman Aktif
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            <div className="chart-anim bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 shadow-sm">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900">Status Keanggotaan Aktif</h4>
                        <p className="text-gray-600">Terima kasih telah mempercayakan kebutuhan finansial Anda kepada KOPSSI.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
