import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Search,
    Filter,
    CheckCircle,
    Clock,
    Banknote,
    User,
    FileText,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertCircle
} from 'lucide-react';

const Transaksi = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
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

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const pageOptions = [10, 20, 50, 100];

    useEffect(() => {
        fetchAllTransactions();
        fetchCompanies();
    }, [startDate, endDate]);

    const fetchAllTransactions = async () => {
        try {
            setLoading(true);

            // 1. Fetch Simpanan
            const { data: simpanan, error: sError } = await supabase
                .from('simpanan')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        company
                    )
                `)
                .gte('jatuh_tempo', startDate)
                .lte('jatuh_tempo', endDate)
                .order('jatuh_tempo', { ascending: false });

            if (sError) throw sError;

            // 2. Fetch Angsuran
            const { data: angsuran, error: aError } = await supabase
                .from('angsuran')
                .select(`
                    *,
                    pinjaman (
                        no_pinjaman,
                        personal_data:personal_data_id (
                            full_name,
                            nik,
                            company
                        )
                    )
                `)
                .gte('tanggal_bayar', `${startDate}T00:00:00`)
                .lte('tanggal_bayar', `${endDate}T23:59:59`)
                .order('tanggal_bayar', { ascending: false });

            if (aError) throw aError;

            // Combine and format
            const combined = [
                ...(simpanan || []).map(s => ({
                    id: `S-${s.id}`,
                    type: 'SIMPANAN',
                    category: s.type, // POKOK, WAJIB
                    amount: parseFloat(s.amount || 0),
                    status: s.status,
                    date: s.jatuh_tempo,
                    member: s.personal_data?.full_name || '-',
                    nik: s.personal_data?.nik || '-',
                    company: s.personal_data?.company || '-',
                    reference: 'Iuran Anggota'
                })),
                ...(angsuran || []).map(a => ({
                    id: `A-${a.id}`,
                    type: 'ANGSURAN',
                    category: 'PINJAMAN',
                    amount: parseFloat(a.amount || 0),
                    status: a.status,
                    date: a.tanggal_bayar,
                    member: a.pinjaman?.personal_data?.full_name || '-',
                    nik: a.pinjaman?.personal_data?.nik || '-',
                    company: a.pinjaman?.personal_data?.company || '-',
                    reference: a.pinjaman?.no_pinjaman || '-'
                }))
            ];

            // Sort by date descending
            combined.sort((a, b) => new Date(b.date) - new Date(a.date));

            setTransactions(combined);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Gagal memuat data transaksi');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(trx => {
        const matchesSearch = trx.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trx.nik.includes(searchTerm) ||
            trx.reference.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'ALL' || trx.status === filterStatus;
        const matchesCompany = filterCompany === 'ALL' || trx.company === filterCompany;

        return matchesSearch && matchesStatus && matchesCompany;
    });

    // Pagination Calculation
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterCompany, startDate, endDate]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-2xl font-bold text-gray-800">Monitoring Transaksi</h2>
                    <p className="text-sm text-gray-500 mt-1">Lacak seluruh aktivitas pembayaran iuran dan angsuran anggota</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari anggota atau referensi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold"
                        />
                        <span className="text-gray-400 font-bold">s/d</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold"
                        />
                    </div>
                    <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold uppercase tracking-tight italic"
                    >
                        <option value="ALL">SEMUA PT</option>
                        {companies.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="UNPAID">Belum Bayar</option>
                        <option value="PAID">Lunas</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg italic uppercase tracking-tighter">Daftar Transaksi</h3>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Aktivitas Keuangan Anggota</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase">Total Transaksi</p>
                            <p className="font-mono font-bold text-sm text-emerald-600">{filteredTransactions.length}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Anggota</th>
                                <th className="px-6 py-4">Jenis / Kategori</th>
                                <th className="px-6 py-4">Referensi</th>
                                <th className="px-6 py-4">Tanggal / Tempo</th>
                                <th className="px-6 py-4 text-right">Nominal</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
                                        <p className="font-medium not-italic">Tidak ada transaksi ditemukan untuk filter ini</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 not-italic uppercase tracking-tighter">
                                                    {trx.member}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono tracking-tighter">
                                                    {trx.nik}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${trx.type === 'SIMPANAN' ? 'text-blue-600' : 'text-purple-600'}`}>
                                                    {trx.type}
                                                </span>
                                                <span className="text-xs text-gray-500 font-bold uppercase">{trx.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                {trx.reference}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                                <Calendar size={12} /> {formatDate(trx.date)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-gray-800 font-mono">
                                                {formatCurrency(trx.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${trx.status === 'PAID'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {trx.status === 'PAID' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                {trx.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                        <span>Tampilkan</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 shadow-sm"
                        >
                            {pageOptions.map(opt => <option key={opt} value={opt}>{opt} Data</option>)}
                        </select>
                        <span className="hidden md:block">| Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} data</span>
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

export default Transaksi;
