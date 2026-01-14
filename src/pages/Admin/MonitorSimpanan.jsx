import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, CheckCircle, XCircle, Clock, Banknote, User, Download, FileText } from 'lucide-react';

const MonitorSimpanan = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 7);
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 7);
    });
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [showExportMenu, setShowExportMenu] = useState(false);

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
        fetchBills();
        fetchCompanies();
    }, [startDate, endDate]);

    const fetchBills = async () => {
        try {
            setLoading(true);

            const start = `${startDate}-01`;
            const [year, month] = endDate.split('-');
            const end = new Date(year, month, 0).toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('simpanan')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        work_unit,
                        company
                    )
                `)
                .gte('jatuh_tempo', start)
                .lte('jatuh_tempo', end)
                .order('jatuh_tempo', { ascending: true });

            if (error) throw error;

            // Group by personal_data_id and bulan_ke
            const grouped = {};
            (data || []).forEach(item => {
                const key = `${item.personal_data_id}_${item.bulan_ke}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        id: key,
                        personal_data_id: item.personal_data_id,
                        personal_data: item.personal_data,
                        bulan_ke: item.bulan_ke,
                        jatuh_tempo: item.jatuh_tempo,
                        amount_pokok: 0,
                        amount_wajib: 0,
                        status: item.status,
                        items: []
                    };
                }
                if (item.type === 'POKOK') {
                    grouped[key].amount_pokok = parseFloat(item.amount || 0);
                }
                if (item.type === 'WAJIB') {
                    grouped[key].amount_wajib = parseFloat(item.amount || 0);
                }
                grouped[key].items.push(item);
            });

            setBills(Object.values(grouped));
        } catch (error) {
            console.error('Error fetching bills:', error);
            alert('Gagal memuat data tagihan simpanan');
        } finally {
            setLoading(false);
        }
    };

    // bulk insert workflow replaces manual mark as paid

    const handleExportExcel = async (mode = 'DATA') => {
        try {
            const { exportMonitoringSimpanan } = await import('../../utils/reportExcel');

            if (mode === 'TEMPLATE') {
                const { data: members } = await supabase
                    .from('personal_data')
                    .select('nik, full_name')
                    .eq('status', 'active');

                exportMonitoringSimpanan(members || [], {}, 'TEMPLATE');
            } else {
                exportMonitoringSimpanan(filteredBills, { startDate, endDate }, 'DATA');
            }
            setShowExportMenu(false);
        } catch (err) {
            console.error('Excel export error:', err);
        }
    };

    const filteredBills = bills.filter(bill => {
        const matchesSearch = bill.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.personal_data?.nik?.includes(searchTerm);

        const matchesCompany = filterCompany === 'ALL' || bill.personal_data?.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Monitoring Simpanan</h2>
                    <p className="text-sm text-gray-500 mt-1">Lacak dan kelola pembayaran iuran wajib & pokok anggota</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama atau NIK..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="month"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                        />
                        <span className="text-gray-400 font-bold">s/d</span>
                        <input
                            type="month"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white appearance-none font-bold uppercase tracking-tight italic"
                        >
                            <option value="ALL">SEMUA PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Download size={16} /> Export
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-20 overflow-hidden">
                                <button
                                    onClick={() => handleExportExcel('DATA')}
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-emerald-50 border-b border-gray-50 flex items-center gap-2"
                                >
                                    <FileText size={14} className="text-emerald-500" /> Unduh Data Aktif
                                </button>
                                <button
                                    onClick={() => handleExportExcel('TEMPLATE')}
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                    <Download size={14} className="text-blue-500" /> Unduh Template Upload
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 font-black">Anggota</th>
                                <th className="px-6 py-4 font-black text-center">Bulan Ke</th>
                                <th className="px-6 py-4 font-black">Jatuh Tempo</th>
                                <th className="px-6 py-4 font-black text-right">Simp. Pokok</th>
                                <th className="px-6 py-4 font-black text-right">Simp. Wajib</th>
                                <th className="px-6 py-4 font-black text-right">Total</th>
                                <th className="px-6 py-4 font-black text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                                        <p>Tidak ada tagihan ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => {
                                    const total = parseFloat(bill.amount_pokok || 0) + parseFloat(bill.amount_wajib || 0);
                                    return (
                                        <tr key={bill.id} className="hover:bg-emerald-50/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 not-italic uppercase tracking-tighter">
                                                        {bill.personal_data?.full_name || '-'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {bill.personal_data?.nik || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-black text-gray-500">
                                                    #{bill.bulan_ke}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-xs font-bold">
                                                {new Date(bill.jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 font-mono">
                                                {formatCurrency(bill.amount_pokok)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 font-mono">
                                                {formatCurrency(bill.amount_wajib)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-gray-800 font-mono">
                                                    {formatCurrency(total)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${bill.status === 'PAID'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {bill.status === 'PAID' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                    {bill.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonitorSimpanan;
