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
                        company,
                        no_npp,
                        no_anggota,
                        lokasi,
                        rek_gaji,
                        bank_gaji,
                        phone
                    )
                `)
                .eq('status', 'DICAIRKAN')
                .order('disbursed_at', { ascending: false });

            if (error) throw error;

            // NEW: Fetch all installments that were settled via deduction
            // We'll match them to the new loans using the 'keterangan' field
            const { data: settledInsts } = await supabase
                .from('angsuran')
                .select('*, pinjaman(*)')
                .eq('metode_bayar', 'POTONG_PENCAIRAN');

            const loansWithBreakdown = (data || []).map(loan => {
                const matches = (settledInsts || []).filter(inst =>
                    inst.keterangan?.includes(loan.no_pinjaman)
                );

                let outsPokok = 0;
                let outsBunga = 0;

                matches.forEach(inst => {
                    const oldLoan = inst.pinjaman;
                    if (oldLoan) {
                        const principal = parseFloat(oldLoan.jumlah_pinjaman || 0);
                        const tenor = oldLoan.tenor_bulan || 1;
                        let totalBunga = 0;
                        if (oldLoan.tipe_bunga === 'PERSENAN') {
                            totalBunga = principal * (parseFloat(oldLoan.nilai_bunga || 0) / 100) * (tenor / 12);
                        } else if (oldLoan.tipe_bunga === 'NOMINAL') {
                            totalBunga = parseFloat(oldLoan.nilai_bunga || 0);
                        }

                        outsBunga += (totalBunga / tenor);
                        outsPokok += (principal / tenor);
                    }
                });

                // Reconciliation: Ensure Pokok + Bunga matches the saved 'outstanding' total
                // If there's a small rounding difference, adjust the Pokok
                const totalCalculated = outsPokok + outsBunga;
                const savedTotal = parseFloat(loan.outstanding || 0);
                if (savedTotal > 0 && totalCalculated > 0) {
                    const ratio = savedTotal / totalCalculated;
                    outsPokok = outsPokok * ratio;
                    outsBunga = outsBunga * ratio;
                }

                return {
                    ...loan,
                    calculated_outs_pokok: Math.round(outsPokok),
                    calculated_outs_bunga: Math.round(outsBunga)
                };
            });

            setLoans(loansWithBreakdown);
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

            // AUTOMATED EXCEL EXPORT
            const { exportDisbursementDelivery } = await import('../../utils/reportExcel');
            exportDisbursementDelivery([loan]);

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
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Realisasi</h2>
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
                            <tr className="bg-gray-50/50 border-b border-gray-100 italic font-black text-[8px] uppercase tracking-tighter text-gray-400">
                                <th className="px-2 py-3 text-center">No</th>
                                <th className="px-2 py-3">No Pinjaman</th>
                                <th className="px-2 py-3">Nama</th>
                                <th className="px-2 py-3">NPP</th>
                                <th className="px-2 py-3">No Anggota</th>
                                <th className="px-2 py-3">Lokasi</th>
                                <th className="px-2 py-3 text-center">Tgl Pin</th>
                                <th className="px-2 py-3 text-center">Tgl Setuju</th>
                                <th className="px-2 py-3 text-center">Tenor</th>
                                <th className="px-2 py-3 text-right">Pengajuan</th>
                                <th className="px-2 py-3 text-right">Disetujui</th>
                                <th className="px-2 py-3 text-right">Bunga</th>
                                <th className="px-2 py-3 text-right">Outs P</th>
                                <th className="px-2 py-3 text-right">Outs B</th>
                                <th className="px-2 py-3 text-right">Admin</th>
                                <th className="px-2 py-3 text-right">Cair</th>
                                <th className="px-2 py-3">No Rek</th>
                                <th className="px-2 py-3">No HP</th>
                                <th className="px-2 py-3">Keperluan</th>
                                <th className="px-2 py-3">Bank</th>
                                <th className="px-2 py-3 text-center">Tgl Real</th>
                                <th className="px-2 py-3 text-center">Aksi</th>
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
                                filteredLoans.map((loan, idx) => {
                                    const principal = parseFloat(loan.jumlah_pinjaman || 0);
                                    const tenor = loan.tenor_bulan || 1;
                                    let totalBunga = 0;

                                    if (loan.tipe_bunga === 'PERSENAN') {
                                        totalBunga = principal * (parseFloat(loan.nilai_bunga || 0) / 100) * (tenor / 12);
                                    } else if (loan.tipe_bunga === 'NOMINAL') {
                                        totalBunga = parseFloat(loan.nilai_bunga || 0);
                                    }

                                    const netDisbursement = principal - (parseFloat(loan.outstanding) || 0) - 5000;

                                    return (
                                        <tr key={loan.id} className="hover:bg-emerald-50 transition-colors group border-b border-gray-50">
                                            <td className="px-2 py-2 text-center text-[9px] font-bold text-gray-400">{idx + 1}</td>
                                            <td className="px-2 py-2 text-[9px] font-black font-mono text-gray-600 uppercase italic whitespace-nowrap">{loan.no_pinjaman}</td>
                                            <td className="px-2 py-2 text-[9px] font-black text-gray-900 uppercase italic whitespace-nowrap">{loan.personal_data?.full_name || '-'}</td>
                                            <td className="px-2 py-2 text-[9px] font-bold text-gray-500 font-mono italic">{loan.personal_data?.no_npp || '-'}</td>
                                            <td className="px-2 py-2 text-[9px] font-bold text-gray-500 font-mono italic">{loan.personal_data?.no_anggota || '-'}</td>
                                            <td className="px-2 py-2 text-[9px] font-bold text-gray-400 uppercase italic truncate max-w-[80px]">{loan.personal_data?.lokasi || '-'}</td>
                                            <td className="px-2 py-2 text-[9px] text-center font-bold text-gray-500 italic">
                                                {loan.created_at ? new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-[9px] text-center font-bold text-gray-500 italic">
                                                {(loan.approved_at || loan.created_at) ? new Date(loan.approved_at || loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-[9px] text-center font-black text-emerald-600 italic">{tenor}M</td>
                                            <td className="px-2 py-2 text-right text-[9px] font-bold text-gray-400 font-mono">
                                                {formatCurrency(loan.jumlah_pengajuan || loan.jumlah_pinjaman)}
                                            </td>
                                            <td className="px-2 py-2 text-right text-[9px] font-black text-gray-700 font-mono">
                                                {formatCurrency(principal)}
                                            </td>
                                            <td className="px-2 py-2 text-right text-[9px] font-bold text-amber-600 font-mono italic">
                                                {formatCurrency(totalBunga)}
                                            </td>
                                            <td className="px-2 py-2 text-right text-[9px] font-black text-red-500 font-mono italic">
                                                {loan.calculated_outs_pokok > 0 ? formatCurrency(loan.calculated_outs_pokok) : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-right text-[9px] font-bold text-red-400 font-mono italic">
                                                {loan.calculated_outs_bunga > 0 ? formatCurrency(loan.calculated_outs_bunga) : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-right text-[9px] font-bold text-gray-500 font-mono italic">
                                                {formatCurrency(5000)}
                                            </td>
                                            <td className="px-2 py-2 text-right text-[9px] font-black text-emerald-700 font-mono bg-emerald-50/50">
                                                {formatCurrency(netDisbursement)}
                                            </td>
                                            <td className="px-2 py-2 text-[9px] font-mono font-bold text-gray-500 italic">{loan.personal_data?.rek_gaji || '-'}</td>
                                            <td className="px-2 py-2 text-[9px] font-mono font-bold text-gray-500 italic">{loan.personal_data?.phone || '-'}</td>
                                            <td className="px-2 py-2 text-[9px] font-bold text-gray-400 uppercase italic truncate max-w-[100px]">{loan.keperluan || '-'}</td>
                                            <td className="px-2 py-2 text-[9px] font-black text-blue-600 italic uppercase">{loan.personal_data?.bank_gaji || '-'}</td>
                                            <td className="px-2 py-2 text-center text-[9px] font-black text-emerald-600 italic">
                                                {loan.delivery_date ? new Date(loan.delivery_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                {loan.delivery_status !== 'SENT' ? (
                                                    <button
                                                        onClick={() => handleConfirmDelivery(loan)}
                                                        disabled={updatingId === loan.id}
                                                        className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-[8px] font-black uppercase tracking-tight hover:bg-emerald-700 transition-all disabled:opacity-50 mx-auto"
                                                    >
                                                        {updatingId === loan.id ? <Loader2 className="animate-spin" size={10} /> : <CheckCircle size={10} />}
                                                        OK
                                                    </button>
                                                ) : (
                                                    <span className="text-[8px] font-black text-gray-300 uppercase italic">SENT</span>
                                                )}
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

export default DisbursementDelivery;
