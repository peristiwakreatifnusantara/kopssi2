import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, Download, ArrowRight, User, Building, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MonitorSimpanan = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const pageOptions = [10, 20, 50, 100];

    useEffect(() => {
        fetchCompanies();
        fetchMemberSavings();
    }, []);

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

    const fetchMemberSavings = async () => {
        try {
            setLoading(true);

            // Fetch Active & Passive Members Only
            const { data: membersData, error: memberError } = await supabase
                .from('personal_data')
                .select('id, full_name, nik, no_npp, company, work_unit')
                .in('status', [
                    'ACTIVE', 'ACTIVED', 'VERIFIED', 'active', 'verified', 'DONE VERIFIKASI',
                    'PASIF'
                ]);

            if (memberError) throw memberError;

            // Fetch All PAID Savings (Aggregated)
            // Note: For large datasets, this should be done via RPC or View.
            // Assuming manageable size for client-side aggregation for now.
            const { data: savingsData, error: savingsError } = await supabase
                .from('simpanan')
                .select('personal_data_id, amount, transaction_type')
                .eq('status', 'PAID');

            if (savingsError) throw savingsError;

            // Aggregate Savings per Member
            const savingsMap = {};
            savingsData?.forEach(s => {
                const amt = parseFloat(s.amount || 0);
                if (!savingsMap[s.personal_data_id]) savingsMap[s.personal_data_id] = 0;

                if (s.transaction_type === 'SETOR') {
                    savingsMap[s.personal_data_id] += amt;
                } else {
                    savingsMap[s.personal_data_id] -= amt;
                }
            });

            // Merge Data
            const mergedData = membersData.map(m => ({
                ...m,
                total_simpanan: savingsMap[m.id] || 0
            }));

            // Sort by Name
            mergedData.sort((a, b) => a.full_name.localeCompare(b.full_name));

            setMembers(mergedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal memuat data monitoring simpanan');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        // TODO: Implement Logic to export Member Savings Summary
        alert("Fitur Export Summary akan segera hadir.");
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.no_npp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.nik?.includes(searchTerm);

        const matchesCompany = filterCompany === 'ALL' || m.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

    // Pagination Calculation
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCompany]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 italic uppercase tracking-tight">Monitoring Simpanan</h2>
                    <p className="text-sm text-gray-500 mt-1">Pantau total simpanan anggota dan riwayat transaksi</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari Nama / NPP..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm font-medium"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm appearance-none font-bold uppercase tracking-tight italic"
                        >
                            <option value="ALL">SEMUA PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Export could be re-enabled if needed */}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Anggota</th>
                                <th className="px-6 py-4">Perusahaan</th>
                                <th className="px-6 py-4 text-right">Total Simpanan</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                        Memuat data anggota...
                                    </td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <User className="mx-auto text-gray-300 mb-4" size={48} />
                                        <p>Tidak ada anggota ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedMembers.map((m) => (
                                    <tr
                                        key={m.id}
                                        className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/admin/monitor-simpanan/${m.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">
                                                    {m.full_name?.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{m.full_name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                                        <User size={10} /> {m.no_npp}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-tight">
                                                <Building size={14} className="text-gray-400" />
                                                {m.company || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-emerald-600 font-mono tracking-tight bg-emerald-50 px-3 py-1 rounded-lg">
                                                {formatCurrency(m.total_simpanan)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/monitor-simpanan/${m.id}`);
                                                }}
                                                className="p-2 bg-white border border-gray-200 text-gray-400 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                                            >
                                                <ArrowRight size={16} />
                                            </button>
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
                        <span>Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600 shadow-sm"
                        >
                            {pageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <span className="hidden md:block">| {filteredMembers.length} Total Data</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Prev
                        </button>
                        <span className="text-xs font-black text-emerald-600 mx-2">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitorSimpanan;
