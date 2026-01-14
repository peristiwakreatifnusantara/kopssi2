import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Eye, AlertCircle, FileDown } from 'lucide-react';
import { generateLoanAnalysisPDF } from '../../utils/loanAnalysisPdf';

const AssesmentPinjaman = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [analystName, setAnalystName] = useState('Admin');
    const navigate = useNavigate();

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
        fetchAnalystInfo();
        fetchCompanies();
    }, []);

    const fetchAnalystInfo = async () => {
        try {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);

                // Fetch full name from personal_data using the ID from localStorage
                const { data: profile } = await supabase
                    .from('personal_data')
                    .select('full_name')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    setAnalystName(profile.full_name);
                } else {
                    setAnalystName(user.name || 'Admin System');
                }
            }
        } catch (error) {
            console.error('Error fetching analyst info:', error);
        }
    };

    const fetchLoans = async () => {
        try {
            setLoading(true);
            // Hanya ambil data yang statusnya PENGAJUAN
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        *
                    )
                `)
                .eq('status', 'PENGAJUAN')
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
        navigate(`/admin/assesment-pinjaman/${loan.id}`);
    };



    const handleBatchDownload = async () => {
        if (filteredLoans.length === 0) return;

        const confirmBatch = window.confirm(`Unduh ${filteredLoans.length} analisa pinjaman sekaligus?`);
        if (!confirmBatch) return;

        for (const loan of filteredLoans) {
            await generateLoanAnalysisPDF(loan, true, analystName);
        }
    };


    const filteredLoans = loans.filter(loan => {
        const matchesSearch =
            loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());

        const loanDate = new Date(loan.created_at).getTime();
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

        const matchesDate = loanDate >= start && loanDate <= end;
        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;

        return matchesSearch && matchesDate && matchesCompany;
    });

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 text-left">Penyetujuan Pinjaman</h2>
                    <p className="text-sm text-gray-500 mt-1 text-left">Tahap 1: Verifikasi dan setujui pengajuan anggota</p>
                </div>

                <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cari</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Nama / No. Pinjaman..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-48 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dari</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Sampai</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">PT / Perusahaan</label>
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-black uppercase italic focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm bg-white"
                        >
                            <option value="ALL">SEMUA PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleBatchDownload}
                        disabled={filteredLoans.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
                    >
                        <FileDown size={18} />
                        Download PDF ({filteredLoans.length})
                    </button>
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
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-emerald-50 border-b border-emerald-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Peminjam</th>
                                    <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Nominal Pengajuan</th>
                                    <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Nominal Disetujui</th>
                                    <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Tenor</th>
                                    <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">No. Pinjaman</th>
                                    <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic">Tanggal</th>
                                    <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic text-center">Analisa</th>
                                    <th className="px-6 py-4 font-bold text-emerald-800 text-sm italic text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLoans.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => handleRowClick(loan)}
                                        className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                                                    {loan.personal_data?.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-gray-900 text-sm">{loan.personal_data?.full_name || '-'}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{loan.personal_data?.nik || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-400 text-sm">
                                            Rp {parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 font-black text-emerald-700 text-sm">
                                            Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 text-sm font-semibold">{loan.tenor_bulan} bln</td>
                                        <td className="px-6 py-4 text-gray-400 text-[10px] font-mono">{loan.no_pinjaman}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(loan.created_at)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateLoanAnalysisPDF(loan, false, analystName);
                                                }}
                                                className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-all shadow-sm"
                                                title="Pratinjau Analisa PDF"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRowClick(loan);
                                                }}
                                                className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-black hover:bg-emerald-700 transition-all uppercase tracking-wider shadow-sm"
                                            >
                                                Verifikasi
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-gray-50 text-left">
                        {filteredLoans.map((loan) => (
                            <div
                                key={loan.id}
                                onClick={() => handleRowClick(loan)}
                                className="p-4 active:bg-gray-50 transition-colors space-y-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-[10px]">
                                            {loan.personal_data?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-tighter italic block">
                                                {loan.personal_data?.full_name || '-'}
                                            </p>
                                            <p className="text-[8px] text-gray-400 font-mono tracking-widest uppercase">
                                                {loan.no_pinjaman}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 italic">{formatDate(loan.created_at)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                    <div>
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Pengajuan</label>
                                        <span className="text-[11px] font-bold text-gray-500 italic">
                                            Rp {parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block">Disetujui</label>
                                        <span className="text-sm font-black text-emerald-700 italic">
                                            Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 px-3">
                                    <div>
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Tenor</label>
                                        <span className="text-xs font-black text-gray-700 italic">{loan.tenor_bulan} Bln</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            generateLoanAnalysisPDF(loan, false, analystName);
                                        }}
                                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100"
                                    >
                                        <Eye size={14} /> Analisa PDF
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRowClick(loan);
                                        }}
                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        Verifikasi
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default AssesmentPinjaman;
