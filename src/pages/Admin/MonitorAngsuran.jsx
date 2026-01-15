import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, CheckCircle, Clock, Banknote, CalendarDays, FileText, Download } from 'lucide-react';

const MonitorAngsuran = () => {
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const pageOptions = [10, 20, 50, 100];
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [updatingId, setUpdatingId] = useState(null);
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('master_data')
                .select('value')
                .eq('category', 'company')
                .order('value', { ascending: true });
            if (error) throw error;
            setCompanies(data?.map(c => c.value) || []);
        } catch (err) {
            console.error("Error fetching companies:", err);
        }
    };

    useEffect(() => {
        fetchInstallments();
        fetchCompanies();
    }, [startDate, endDate, filterStatus]);

    const fetchInstallments = async () => {
        try {
            setLoading(true);

            // Fetch all installments
            let query = supabase
                .from('angsuran')
                .select(`
                    *,
                    pinjaman (
                        no_pinjaman,
                        personal_data:personal_data_id (
                            full_name,
                            nik,
                            work_unit,
                            company
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (filterStatus !== 'ALL') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Filter by month range locally if angsuran doesn't have a specific due date field that's reliable
            // We use created_at as a proxy or if there's a better logic. 
            // In kopssi, installments are usually generated for specific months.

            const filteredByDate = (data || []).filter(inst => {
                const instDate = new Date(inst.created_at).toISOString().split('T')[0];
                return instDate >= startDate && instDate <= endDate;
            });

            setInstallments(filteredByDate);
        } catch (error) {
            console.error('Error fetching installments:', error);
            alert('Gagal memuat data angsuran');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (installment) => {
        if (!window.confirm(`Tandai angsuran ke-${installment.bulan_ke} untuk ${installment.pinjaman?.personal_data?.full_name} sebagai LUNAS?`)) return;

        try {
            setUpdatingId(installment.id);
            const now = new Date().toISOString();

            const { error } = await supabase
                .from('angsuran')
                .update({
                    status: 'PAID',
                    tanggal_bayar: now
                })
                .eq('id', installment.id);

            if (error) throw error;

            // Update local state
            setInstallments(prev => prev.map(i => i.id === installment.id ? { ...i, status: 'PAID', tanggal_bayar: now } : i));
            alert('Angsuran berhasil dibayar!');
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Gagal memproses pembayaran: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleExportExcel = async () => {
        try {
            const { exportMonitoringAngsuran } = await import('../../utils/reportExcel');
            exportMonitoringAngsuran(filteredInstallments, { startDate, endDate });
        } catch (err) {
            console.error('Excel export error:', err);
        }
    };

    const filteredInstallments = installments.filter(inst => {
        const matchesSearch = inst.pinjaman?.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.pinjaman?.personal_data?.nik?.includes(searchTerm) ||
            inst.pinjaman?.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCompany = filterCompany === 'ALL' || inst.pinjaman?.personal_data?.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

    // Pagination Calculation
    const totalPages = Math.ceil(filteredInstallments.length / itemsPerPage);
    const paginatedInstallments = filteredInstallments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCompany, startDate, endDate, filterStatus]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Monitoring Angsuran</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Lacak status pembayaran angsuran pinjaman anggota</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau No Pin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold"
                        />
                        <span className="text-gray-400 font-bold">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold uppercase tracking-tight italic"
                        >
                            <option value="ALL">SEMUA PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="UNPAID">Belum Bayar</option>
                        <option value="PAID">Lunas</option>
                    </select>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 border-2 border-emerald-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto text-left">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-widest text-gray-400">
                                <th className="px-6 py-4">Anggota & No Pinjaman</th>
                                <th className="px-6 py-4 text-center">Bulan Ke</th>
                                <th className="px-6 py-4 text-right">Nominal Angsuran</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Tanggal Bayar</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        Memuat data angsuran...
                                    </td>
                                </tr>
                            ) : filteredInstallments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400 italic">
                                        <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">Tidak ada data angsuran untuk periode ini</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInstallments.map((inst) => (
                                    <tr key={inst.id} className="hover:bg-emerald-50/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 uppercase italic tracking-tight">
                                                    {inst.pinjaman?.personal_data?.full_name || '-'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {inst.pinjaman?.no_pinjaman || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-emerald-600">
                                                #{inst.bulan_ke}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-red-600 font-mono italic">
                                                {formatCurrency(inst.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${inst.status === 'PAID'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {inst.status === 'PAID' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                {inst.status === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[10px] font-bold text-gray-500 italic">
                                            {inst.tanggal_bayar ? new Date(inst.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {inst.status !== 'PAID' ? (
                                                <button
                                                    onClick={() => handleMarkAsPaid(inst)}
                                                    disabled={updatingId === inst.id}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                                                >
                                                    {updatingId === inst.id ? '...' : 'Bayar'}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">TEREKAM</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                        <span>Tampilkan</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 shadow-sm"
                        >
                            {pageOptions.map(opt => <option key={opt} value={opt}>{opt} Data</option>)}
                        </select>
                        <span className="hidden md:block">| Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredInstallments.length)} dari {filteredInstallments.length} data</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Sebelumnya
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                                >
                                    {i + 1}
                                </button>
                            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitorAngsuran;
