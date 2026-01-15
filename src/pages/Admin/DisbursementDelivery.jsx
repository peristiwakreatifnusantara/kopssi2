import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, CheckCircle, Banknote, Download, Loader2 } from 'lucide-react';

const DisbursementDelivery = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const [activeTab, setActiveTab] = useState('BELUM');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        // Awal bulan ini
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

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
    }, [startDate, endDate]);

    useEffect(() => {
        setSelectedIds([]);
        setIsSelectionMode(false);
    }, [activeTab]);

    const fetchDisbursedLoans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        full_name, nik, work_unit, company, no_npp, no_anggota, lokasi, rek_gaji, bank_gaji, phone
                    )
                `)
                .eq('status', 'DICAIRKAN')
                .gte('disbursed_at', `${startDate}T00:00:00`)
                .lte('disbursed_at', `${endDate}T23:59:59`)
                .order('disbursed_at', { ascending: false });

            if (error) throw error;

            // Fetch installments for outstanding breakdown
            const { data: settledInsts } = await supabase
                .from('angsuran')
                .select('*, pinjaman(*)')
                .eq('metode_bayar', 'POTONG_PENCAIRAN');

            const loansWithBreakdown = (data || []).map(loan => {
                const matches = (settledInsts || []).filter(inst => inst.keterangan?.includes(loan.no_pinjaman));
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
        if (!window.confirm(`Konfirmasi bahwa dana pinjaman untuk ${loan.personal_data?.full_name} telah dikirimkan?`)) return;

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

    const handleBulkConfirm = async () => {
        const selectedLoans = filteredLoans.filter(l => selectedIds.includes(l.id));
        if (selectedLoans.length === 0) return;

        if (!window.confirm(`Konfirmasi realisasi untuk ${selectedLoans.length} pinjaman terpilih?`)) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('pinjaman')
                .update({
                    delivery_status: 'SENT',
                    delivery_date: new Date().toISOString()
                })
                .in('id', selectedIds);

            if (error) throw error;

            alert(`Berhasil merealisasikan ${selectedLoans.length} pinjaman!`);

            // Export multiple
            const { exportDisbursementDelivery } = await import('../../utils/reportExcel');
            exportDisbursementDelivery(selectedLoans);

            setSelectedIds([]);
            fetchDisbursedLoans();
        } catch (err) {
            console.error('Bulk confirm error:', err);
            alert('Gagal memproses realisasi massal');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredLoans.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredLoans.map(l => l.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const calculateSelectedTotal = () => {
        return filteredLoans
            .filter(l => selectedIds.includes(l.id))
            .reduce((sum, l) => {
                const principal = parseFloat(l.jumlah_pinjaman || 0);
                return sum + (principal - (parseFloat(l.outstanding) || 0) - 5000);
            }, 0);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const filteredLoans = loans.filter(loan => {
        const matchesSearch = loan.personal_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.personal_data?.nik?.includes(searchTerm) ||
            loan.no_pinjaman?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany === 'ALL' || loan.personal_data?.company === filterCompany;

        const isSent = loan.delivery_status === 'SENT';
        const matchesTab = activeTab === 'BELUM' ? !isSent : isSent;

        return matchesSearch && matchesCompany && matchesTab;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Realisasi Pinjaman</h2>
                    <div className="flex gap-4 mt-2">
                        <button
                            onClick={() => setActiveTab('BELUM')}
                            className={`text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'BELUM' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Belum Direalisasi
                        </button>
                        <button
                            onClick={() => setActiveTab('SUDAH')}
                            className={`text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'SUDAH' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Sudah Direalisasi
                        </button>
                    </div>
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
                    {activeTab === 'BELUM' && (
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) setSelectedIds([]);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm border-2 ${isSelectionMode ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-white text-blue-600 border-blue-50'}`}
                        >
                            <CheckCircle size={16} />
                            {isSelectionMode ? 'Batal Pilih' : 'Pilih Masal'}
                        </button>
                    )}
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

            <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-gray-100 overflow-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-tighter text-gray-400">
                            <th className="px-2 py-3 text-center w-10">
                                {isSelectionMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === filteredLoans.length && filteredLoans.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                )}
                            </th>
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
                            <th className="px-2 py-3 text-right text-emerald-700">Terima Bersih</th>
                            <th className="px-2 py-3">No Rek</th>
                            <th className="px-2 py-3 text-center">Tgl Real</th>
                            <th className="px-2 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan="20" className="px-6 py-12 text-center text-gray-500 text-[10px]">
                                    <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-4" />
                                    Memuat data pencairan...
                                </td>
                            </tr>
                        ) : filteredLoans.length === 0 ? (
                            <tr>
                                <td colSpan="20" className="px-6 py-20 text-center text-gray-400 italic text-[10px]">
                                    <Banknote size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-bold">Tidak ada data {activeTab === 'BELUM' ? 'menunggu realisasi' : 'yang sudah direalisasi'} untuk ditampilkan</p>
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
                                    <tr
                                        key={loan.id}
                                        className={`hover:bg-emerald-50 transition-colors group border-b border-gray-50 ${(isSelectionMode && selectedIds.includes(loan.id)) ? 'bg-emerald-50/70' : ''}`}
                                        onClick={() => isSelectionMode && toggleSelect(loan.id)}
                                    >
                                        <td className="px-2 py-2 text-center" onClick={(e) => isSelectionMode && e.stopPropagation()}>
                                            {isSelectionMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(loan.id)}
                                                    onChange={() => toggleSelect(loan.id)}
                                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                            )}
                                        </td>
                                        <td className="px-2 py-2 text-center text-[10px] font-bold text-gray-400">{idx + 1}</td>
                                        <td className="px-2 py-2 text-[10px] font-black font-mono text-gray-600 uppercase italic whitespace-nowrap">{loan.no_pinjaman}</td>
                                        <td className="px-2 py-2 text-[10px] font-black text-gray-900 uppercase italic whitespace-nowrap">{loan.personal_data?.full_name || '-'}</td>
                                        <td className="px-2 py-2 text-[10px] font-bold text-gray-500 font-mono italic">{loan.personal_data?.no_npp || '-'}</td>
                                        <td className="px-2 py-2 text-[10px] font-bold text-gray-500 font-mono italic">{loan.personal_data?.no_anggota || '-'}</td>
                                        <td className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase italic truncate max-w-[80px]">{loan.personal_data?.lokasi || '-'}</td>
                                        <td className="px-2 py-2 text-[10px] text-center font-bold text-gray-500 italic">
                                            {loan.created_at ? new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-2 py-2 text-center text-[10px] font-bold text-gray-500 italic">
                                            {(loan.approved_at || loan.created_at) ? new Date(loan.approved_at || loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-2 py-2 text-center text-[10px] font-black text-emerald-600 italic">{tenor}</td>
                                        <td className="px-2 py-2 text-right text-[10px] font-bold text-gray-400 font-mono">{formatCurrency(loan.jumlah_pengajuan || loan.jumlah_pinjaman)}</td>
                                        <td className="px-2 py-2 text-right text-[10px] font-black text-gray-700 font-mono">{formatCurrency(principal)}</td>
                                        <td className="px-2 py-2 text-right text-[10px] font-bold text-amber-600 font-mono italic">{formatCurrency(totalBunga)}</td>
                                        <td className="px-2 py-2 text-right text-[10px] font-black text-red-500 font-mono italic">{loan.calculated_outs_pokok > 0 ? formatCurrency(loan.calculated_outs_pokok) : '-'}</td>
                                        <td className="px-2 py-2 text-right text-[10px] font-bold text-red-400 font-mono italic">{loan.calculated_outs_bunga > 0 ? formatCurrency(loan.calculated_outs_bunga) : '-'}</td>
                                        <td className="px-2 py-2 text-right text-[10px] font-bold text-gray-500 font-mono italic">{formatCurrency(5000)}</td>
                                        <td className="px-2 py-2 text-right text-[10px] font-black text-emerald-700 font-mono bg-emerald-50/50">{formatCurrency(netDisbursement)}</td>
                                        <td className="px-2 py-2 text-[10px] font-mono font-bold text-gray-500 italic whitespace-nowrap">{loan.personal_data?.rek_gaji || '-'}</td>
                                        <td className="px-2 py-2 text-center text-[10px] font-black text-emerald-600 italic">
                                            {loan.delivery_date ? new Date(loan.delivery_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-2 py-2 text-center text-[10px]">
                                            {loan.delivery_status !== 'SENT' ? (
                                                <button
                                                    onClick={() => handleConfirmDelivery(loan)}
                                                    disabled={updatingId === loan.id}
                                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-tight hover:bg-emerald-700 transition-all disabled:opacity-50 mx-auto"
                                                >
                                                    {updatingId === loan.id ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                                                    OK
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-300 uppercase italic">SENT</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* DATA COUNT FOOTER */}
            <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">
                    Menampilkan <span className="text-emerald-600">{filteredLoans.length}</span> Data Terpilih
                </p>
                <p className="text-[10px] font-bold text-gray-300 italic uppercase">
                    Kopssi Management System • {new Date().getFullYear()}
                </p>
            </div>

            {/* Selection Summary Popup/Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-gray-900 border border-white/10 text-white rounded-2xl shadow-2xl shadow-black/40 px-8 py-5 flex items-center gap-10 backdrop-blur-md">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">Terpilih</span>
                            <span className="text-2xl font-black italic">{selectedIds.length} <span className="text-sm not-italic opacity-50 uppercase tracking-tighter">Record</span></span>
                        </div>

                        <div className="h-10 w-[1px] bg-white/10"></div>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">Total Realisasi</span>
                            <span className="text-2xl font-black italic font-mono text-emerald-400">{formatCurrency(calculateSelectedTotal())}</span>
                        </div>

                        <div className="flex gap-3 ml-4">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleBulkConfirm}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                <CheckCircle size={14} /> Konfirmasi Terpilih
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisbursementDelivery;
