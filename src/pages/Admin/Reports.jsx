import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Users, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminReports = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        monthlyIncome: 0,
        monthlyExpense: 0,
        simpananSetor: 0,
        totalAngsuran: 0,
        simpananTarik: 0,
        totalDisbursed: 0,
        newMembersCount: 0,
        activeLoansTotal: 0,
        totalSavingsBalance: 0,
        newMembers: []
    });

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();

            // 1. Monthly Financials (Income/Expense)
            // Income = Simpanan SETOR + Angsuran PAID
            // Expense = Simpanan TARIK + Pinjaman DICAIRKAN (Plafon)

            // Simpanan current month
            const { data: monthlySimpanan } = await supabase
                .from('simpanan')
                .select('amount, transaction_type')
                .gte('created_at', startOfMonth);

            let simpananSetor = 0;
            let simpananTarik = 0;
            monthlySimpanan?.forEach(s => {
                if (s.transaction_type === 'SETOR') simpananSetor += parseFloat(s.amount);
                else if (s.transaction_type === 'TARIK') simpananTarik += parseFloat(s.amount);
            });

            // Angsuran PAID current month
            // Note: We might need a payment_date field if created_at is not when it was paid. 
            // Assuming for now status change happens in the month.
            const { data: monthlyPaidAngsuran } = await supabase
                .from('angsuran')
                .select('amount')
                .eq('status', 'PAID')
                .gte('updated_at', startOfMonth); // Using updated_at for payment time

            const totalAngsuran = monthlyPaidAngsuran?.reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0;

            // Pinjaman DICAIRKAN current month
            const { data: monthlyDisbursed } = await supabase
                .from('pinjaman')
                .select('jumlah_pinjaman')
                .eq('status', 'DICAIRKAN')
                .gte('updated_at', startOfMonth);

            const totalDisbursed = monthlyDisbursed?.reduce((sum, p) => sum + parseFloat(p.jumlah_pinjaman), 0) || 0;

            // 2. New Members (Last 30 Days)
            const { data: newMembers, count: newMembersCount } = await supabase
                .from('personal_data')
                .select('*', { count: 'exact' })
                .gte('created_at', last30Days)
                .order('created_at', { ascending: false });

            // 3. Active Balances
            // All active loans (DICAIRKAN)
            const { data: allActiveLoans } = await supabase
                .from('pinjaman')
                .select('jumlah_pinjaman')
                .eq('status', 'DICAIRKAN');

            const activeLoansTotal = allActiveLoans?.reduce((sum, p) => sum + parseFloat(p.jumlah_pinjaman), 0) || 0;

            // Total Savings Balance (All time sum SETOR - sum TARIK)
            const { data: allSimpanan } = await supabase
                .from('simpanan')
                .select('amount, transaction_type');

            let totalSavingsBalance = 0;
            allSimpanan?.forEach(s => {
                if (s.transaction_type === 'SETOR') totalSavingsBalance += parseFloat(s.amount);
                else if (s.transaction_type === 'TARIK') totalSavingsBalance -= parseFloat(s.amount);
            });

            setStats({
                monthlyIncome: simpananSetor + totalAngsuran,
                monthlyExpense: simpananTarik + totalDisbursed,
                simpananSetor,
                totalAngsuran,
                simpananTarik,
                totalDisbursed,
                newMembersCount: newMembersCount || 0,
                activeLoansTotal,
                totalSavingsBalance,
                newMembers: newMembers || []
            });

        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadMonthly = () => {
        import('../../utils/reportPdf').then(m => m.generateMonthlyFinancialPDF(stats));
    };

    const handleDownloadPortfolio = async () => {
        try {
            const { data: members } = await supabase
                .from('personal_data')
                .select('id, full_name, nik');

            const { data: allSavings } = await supabase
                .from('simpanan')
                .select('personal_data_id, amount, transaction_type');

            const { data: allActiveLoans } = await supabase
                .from('pinjaman')
                .select('id, personal_data_id, jumlah_pinjaman')
                .eq('status', 'DICAIRKAN');

            const portfolioData = members.map(m => {
                const savings = allSavings?.filter(s => s.personal_data_id === m.id) || [];
                const balance = savings.reduce((sum, s) =>
                    s.transaction_type === 'SETOR' ? sum + parseFloat(s.amount) : sum - parseFloat(s.amount), 0);

                const activeLoans = allActiveLoans?.filter(l => l.personal_data_id === m.id) || [];
                const debt = activeLoans.reduce((sum, l) => sum + parseFloat(l.jumlah_pinjaman), 0);

                return {
                    full_name: m.full_name,
                    nik: m.nik,
                    savingsBalance: balance,
                    loanBalance: debt
                };
            }).filter(p => p.savingsBalance > 0 || p.loanBalance > 0);

            import('../../utils/reportPdf').then(m => m.generateActivePortfolioPDF(portfolioData));
        } catch (error) {
            console.error('Error preparing portfolio report:', error);
            alert('Gagal menyiapkan data laporan');
        }
    };

    const handleExcelFinancial = () => {
        import('../../utils/reportExcel').then(m => m.exportMonthlyFinancialExcel(stats));
    };

    const handleExcelPortfolio = async () => {
        try {
            const { data: members } = await supabase
                .from('personal_data')
                .select('id, full_name, nik');

            const { data: allSavings } = await supabase
                .from('simpanan')
                .select('personal_data_id, amount, transaction_type');

            const { data: allActiveLoans } = await supabase
                .from('pinjaman')
                .select('id, personal_data_id, jumlah_pinjaman')
                .eq('status', 'DICAIRKAN');

            const portfolioData = members.map(m => {
                const savings = allSavings?.filter(s => s.personal_data_id === m.id) || [];
                const balance = savings.reduce((sum, s) =>
                    s.transaction_type === 'SETOR' ? sum + parseFloat(s.amount) : sum - parseFloat(s.amount), 0);

                const activeLoans = allActiveLoans?.filter(l => l.personal_data_id === m.id) || [];
                const debt = activeLoans.reduce((sum, l) => sum + parseFloat(l.jumlah_pinjaman), 0);

                return {
                    full_name: m.full_name,
                    nik: m.nik,
                    savingsBalance: balance,
                    loanBalance: debt
                };
            }).filter(p => p.savingsBalance > 0 || p.loanBalance > 0);

            import('../../utils/reportExcel').then(m => m.exportActivePortfolioExcel(portfolioData));
        } catch (error) {
            console.error('Error preparing portfolio report:', error);
            alert('Gagal menyiapkan data laporan');
        }
    };

    const handleExcelNewMembers = () => {
        import('../../utils/reportExcel').then(m => m.exportNewMembersExcel(stats.newMembers));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Laporan Koperasi</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Business intelligence & Growth metrics</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 italic">
                    <Clock size={14} />
                    Periode: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Top Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase italic">Income</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase italic">Pendapatan Bulan Ini</p>
                        <h3 className="text-xl font-black text-gray-900 italic">{formatCurrency(stats.monthlyIncome)}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <ArrowDownRight size={20} />
                        </div>
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase italic">Expense</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase italic">Pengeluaran Bulan Ini</p>
                        <h3 className="text-xl font-black text-gray-900 italic">{formatCurrency(stats.monthlyExpense)}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase italic">Growth</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase italic">Anggota Baru (30 Hari)</p>
                        <h3 className="text-xl font-black text-gray-900 italic">{stats.newMembersCount} Orang</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <Wallet size={20} />
                        </div>
                        <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded uppercase italic">Asset</span>
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase italic">Perputaran Simpanan</p>
                        <h3 className="text-xl font-black text-gray-900 italic">{formatCurrency(stats.totalSavingsBalance)}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detailed Report Access */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-800 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white font-black italic uppercase tracking-tight text-sm">
                                <FileText size={18} />
                                Menu Laporan Utama
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Monthly Financial Card */}
                            <div className="p-5 border-2 border-gray-100 rounded-2xl hover:border-emerald-500 transition-all group flex flex-col justify-between h-44">
                                <div>
                                    <h4 className="font-black text-gray-900 uppercase italic text-sm mb-1">Laporan Keuangan Bulanan</h4>
                                    <p className="text-[10px] text-gray-500 font-medium">Rekapitulasi arus kas masuk dan keluar periode {new Date().toLocaleDateString('id-ID', { month: 'long' })}.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDownloadMonthly}
                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center justify-center gap-1"
                                    >
                                        <Download size={12} /> PDF
                                    </button>
                                    <button
                                        onClick={handleExcelFinancial}
                                        className="flex-1 py-2 bg-white text-emerald-600 border-2 border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition flex items-center justify-center gap-1"
                                    >
                                        <FileText size={12} /> EXCEL
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition flex items-center justify-center gap-1"
                                    >
                                        <Printer size={12} /> Print
                                    </button>
                                </div>
                            </div>

                            {/* Portfolio Card */}
                            <div className="p-5 border-2 border-gray-100 rounded-2xl hover:border-blue-500 transition-all group flex flex-col justify-between h-44">
                                <div>
                                    <h4 className="font-black text-gray-900 uppercase italic text-sm mb-1">Pinjaman & Simpanan Aktif</h4>
                                    <p className="text-[10px] text-gray-500 font-medium">Data seluruh anggota yang memiliki saldo simpanan dan pinjaman berjalan saat ini.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDownloadPortfolio}
                                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-1"
                                    >
                                        <Download size={12} /> PDF
                                    </button>
                                    <button
                                        onClick={handleExcelPortfolio}
                                        className="flex-1 py-2 bg-white text-blue-600 border-2 border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition flex items-center justify-center gap-1"
                                    >
                                        <FileText size={12} /> EXCEL
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition flex items-center justify-center gap-1"
                                    >
                                        <Printer size={12} /> Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* New Members Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-emerald-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-white font-black italic uppercase tracking-tight text-sm">
                                    <Users size={18} />
                                    Anggota Baru (30 Hari Terakhir)
                                </div>
                                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black">{stats.newMembers.length} Person</span>
                            </div>
                            <button
                                onClick={handleExcelNewMembers}
                                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/20 shadow-sm"
                            >
                                <Download size={14} /> Export Excel
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase italic">Nama / NIK</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase italic">Unit Kerja</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase italic">Tgl Daftar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats.newMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-black text-gray-900">{member.full_name}</p>
                                                <p className="text-[10px] font-mono font-bold text-gray-400">{member.nik}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-gray-700 uppercase">{member.work_unit || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-gray-500">{new Date(member.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                            </td>
                                        </tr>
                                    ))}
                                    {stats.newMembers.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-gray-400 font-medium italic">Tidak ada anggota baru dalam 30 hari terakhir</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Growth Analysis / Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6 text-left">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <TrendingUp size={20} className="text-emerald-600" />
                            <h3 className="font-black italic uppercase tracking-widest text-xs text-gray-800">Analisa Portofolio</h3>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                    <span className="text-gray-400 italic">Total Pinjaman Aktif</span>
                                    <span className="text-emerald-600">{formatCurrency(stats.activeLoansTotal)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                    <span className="text-gray-400 italic">Target Anggota Baru</span>
                                    <span className="text-blue-600">{stats.newMembersCount} / 50</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.newMembersCount / 50) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic mb-2">💡 Quick Insights</p>
                            <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">
                                Perputaran simpanan saat ini mencapai {formatCurrency(stats.totalSavingsBalance)}. Pastikan rasio pencairan pinjaman tetap di bawah saldo simpanan wajib & pokok untuk menjaga likuiditas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
