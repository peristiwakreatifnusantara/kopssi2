import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, CheckCircle, Clock, Banknote, User, BadgeCent, Download, Loader2, Send } from 'lucide-react';

const DisbursementDelivery = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);

    const handleExportExcel = async () => {
        try {
            const { exportDisbursementDelivery } = await import('../../utils/reportExcel');
            exportDisbursementDelivery(filteredLoans);
        } catch (err) {
            console.error('Excel export error:', err);
        }
    };

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
        fetchDisbursedLoans();
        fetchCompanies();
    }, []);

    const fetchDisbursedLoans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name,
                        nik,
                        work_unit,
                        company
                    )
                `)
                .eq('status', 'DICAIRKAN')
                .order('disbursed_at', { ascending: false });

            if (error) throw error;
            setLoans(data || []);
        } catch (error) {
            console.error('Error fetching loans:', error);
            alert('Gagal memuat data pencairan');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelivery = async (loan) => {
        if (!window.confirm(`Konfirmasi bahwa dana pinjaman untuk ${loan.personal_data?.full_name} telah dikirimkan ke anggota?`)) return;

        try {
            setUpdatingId(loan.id);
            const { error } = await supabase
                .from('pinjaman')
                .update({
                    delivery_status: 'SENT',
                    delivery_date: new Date().toISOString()
                })
                .eq('id', loan.id);

            if (error) throw error;

            alert('Status pengiriman berhasil diperbarui!');
            fetchDisbursedLoans();
        } catch (error) {
            console.error('Error updating delivery status:', error);
            alert('Gagal memperbarui status: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const filteredLoans = loans.filter(loan => {
        const matchesSearch = loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.personal_data?.nik?.includes(searchTerm) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;
        return matchesSearch && matchesCompany;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Pencairan (Delivery)</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Lacak pengiriman dana ke anggota setelah status DICAIRKAN</p>
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
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm font-bold uppercase tracking-tight italic appearance-none"
                        >
                            <option value="ALL">SEMUA PT</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
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
                                <th className="px-6 py-4">Anggota</th>
                                <th className="px-6 py-4">No Pinjaman</th>
                                <th className="px-6 py-4 text-center">Tgl Pengajuan</th>
                                <th className="px-6 py-4 text-center">Tgl Cair</th>
                                <th className="px-6 py-4 text-right">Plafon</th>
                                <th className="px-6 py-4 text-right text-red-600 font-black italic">Potongan</th>
                                <th className="px-6 py-4 text-right font-black italic text-emerald-600">Terima Bersih</th>
                                <th className="px-6 py-4 text-center">Status Kirim</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-4" />
                                        Memuat data pencairan...
                                    </td>
                                </tr>
                            ) : filteredLoans.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400 italic">
                                        <Banknote size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">Tidak ada data pencairan untuk ditampilkan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLoans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-emerald-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 uppercase italic tracking-tight">
                                                    {loan.personal_data?.full_name || '-'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {loan.personal_data?.nik || '-'} / {loan.personal_data?.company || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-widest">
                                                {loan.no_pinjaman}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[10px] text-gray-500 font-bold italic">
                                            {loan.created_at ? new Date(loan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-[10px] text-gray-500 font-bold italic">
                                            {loan.disbursed_at ? new Date(loan.disbursed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-bold text-gray-400 font-mono">
                                                {formatCurrency(loan.jumlah_pinjaman)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[10px] font-black text-red-500 font-mono italic">
                                                {loan.outstanding > 0 ? `(${formatCurrency(loan.outstanding)})` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-emerald-700 font-mono italic">
                                                {formatCurrency(parseFloat(loan.jumlah_pinjaman) - (parseFloat(loan.outstanding) || 0))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${loan.delivery_status === 'SENT'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                                }`}>
                                                {loan.delivery_status === 'SENT' ? 'DANA TERKIRIM' : 'BELUM TERKIRIM'}
                                            </span>
                                            {loan.delivery_status === 'SENT' && loan.delivery_date && (
                                                <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase italic">
                                                    {new Date(loan.delivery_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {loan.delivery_status !== 'SENT' ? (
                                                <button
                                                    onClick={() => handleConfirmDelivery(loan)}
                                                    disabled={updatingId === loan.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-50 mx-auto"
                                                >
                                                    {updatingId === loan.id ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                                                    Konfirmasi
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/admin/loan-detail/${loan.id}`)}
                                                    className="inline-flex px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all mx-auto"
                                                >
                                                    Detail
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DisbursementDelivery;
