import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, AlertCircle, ChevronRight } from 'lucide-react';

const PencairanPinjaman = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
        fetchLoans();
        fetchCompanies();
    }, []);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        phone,
                        company,
                        work_unit
                    )
                `)
                .eq('status', 'DISETUJUI')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLoans(data || []);
        } catch (error) {
            console.error('Error fetching loans:', error);
            alert('Gagal memuat data pengajuan pinjaman');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (loan) => {
        navigate(`/admin/pencairan-pinjaman/${loan.id}`);
    };

    const filteredLoans = loans.filter(loan => {
        const matchesSearch = loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 text-left">Pencairan Pinjaman</h2>
                    <p className="text-sm text-gray-500 mt-1 text-left">Tahap 2: Proses pencairan dana ke anggota</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama peminjam..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 shadow-sm"
                        />
                    </div>
                    <div className="relative">
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
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Memuat data pengajuan...</p>
                </div>
            ) : filteredLoans.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <AlertCircle className="mx-auto text-gray-400" size={48} />
                    <p className="mt-4 text-gray-500 font-medium text-center">Tidak ada pengajuan pinjaman baru yang menunggu persetujuan</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-emerald-50 border-b border-emerald-100">
                                <tr>
                                    <th className="px-6 py-4 font-black text-emerald-800 text-[11px] uppercase tracking-widest italic">Peminjam</th>
                                    <th className="px-6 py-4 font-black text-emerald-800 text-[11px] uppercase tracking-widest italic text-center">Nominal</th>
                                    <th className="px-6 py-4 font-black text-emerald-800 text-[11px] uppercase tracking-widest italic text-center">Tenor</th>
                                    <th className="px-6 py-4 font-black text-emerald-800 text-[11px] uppercase tracking-widest italic text-center">No. Pinjaman</th>
                                    <th className="px-6 py-4 font-black text-emerald-800 text-[11px] uppercase tracking-widest italic text-center">Tanggal</th>
                                    <th className="px-6 py-4 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {filteredLoans.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => handleRowClick(loan)}
                                        className="hover:bg-emerald-50/20 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-[10px]">
                                                    {loan.personal_data?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{loan.personal_data?.full_name || '-'}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{loan.personal_data?.nik || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-emerald-700 italic">
                                                Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-gray-700 italic">
                                                {loan.tenor_bulan} bln
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-[10px] text-gray-400">
                                            {loan.no_pinjaman}
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs font-bold text-gray-500 italic">
                                            {formatDate(loan.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right pr-8">
                                            <div className="p-2 rounded-lg text-emerald-400 group-hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100 inline-block">
                                                <ChevronRight size={18} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-50 text-left">
                        {filteredLoans.map((loan) => (
                            <div
                                key={loan.id}
                                onClick={() => handleRowClick(loan)}
                                className="p-4 active:bg-gray-50 transition-colors flex items-center justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-[8px]">
                                            {loan.personal_data?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="text-left">
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-tighter italic block">
                                                {loan.personal_data?.full_name || '-'}
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-mono tracking-widest uppercase">
                                                {loan.no_pinjaman}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Nominal</label>
                                            <span className="text-sm font-black text-emerald-600 italic">
                                                Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Tenor</label>
                                            <span className="text-xs font-black text-gray-700 italic">{loan.tenor_bulan} Bln</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default PencairanPinjaman;
