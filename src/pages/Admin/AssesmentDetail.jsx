import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { X, User, Wallet, FileText, Check, Eye, ChevronLeft, AlertCircle } from 'lucide-react';
import { generateLoanAnalysisPDF } from '../../utils/loanAnalysisPdf';

const AssesmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState(null);
    const [runningLoans, setRunningLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analystName, setAnalystName] = useState('Admin');
    const [editingAmount, setEditingAmount] = useState('');

    // Interest configuration state
    const [useInterest, setUseInterest] = useState(false);
    const [interestType, setInterestType] = useState('PERSENAN'); // PERSENAN or NOMINAL
    const [interestValue, setInterestValue] = useState('10'); // Default 10%

    useEffect(() => {
        fetchLoanDetail();
        fetchAnalystInfo();
    }, [id]);

    const fetchAnalystInfo = async () => {
        try {
            const storedUser = localStorage.getItem('auth_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
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

    const fetchLoanDetail = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pinjaman')
                .select(`
                    *,
                    personal_data:personal_data_id (
                        *
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setLoan(data);
                // format with dots
                const formatted = data.jumlah_pinjaman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                setEditingAmount(formatted);
                if (data.tipe_bunga && data.tipe_bunga !== 'NONE') {
                    setUseInterest(true);
                    setInterestType(data.tipe_bunga);
                    setInterestValue(data.nilai_bunga.toString());
                }

                // Fetch running loans for this member
                fetchRunningLoans(data.personal_data_id, data.id);
            }
        } catch (error) {
            console.error('Error fetching loan detail:', error);
            alert('Gagal memuat detail pinjaman');
            navigate('/admin/assesment-pinjaman');
        } finally {
            setLoading(false);
        }
    };

    const fetchRunningLoans = async (memberId, currentLoanId) => {
        try {
            const { data, error } = await supabase
                .from('pinjaman')
                .select('*')
                .eq('personal_data_id', memberId)
                .in('status', ['DISETUJUI', 'DICAIRKAN'])
                .neq('id', currentLoanId);

            if (data) setRunningLoans(data);
        } catch (error) {
            console.error('Error fetching running loans:', error);
        }
    };

    const handleSaveDraft = async () => {
        try {
            const rawAmount = parseFloat(editingAmount.replace(/\./g, ''));
            const { error } = await supabase
                .from('pinjaman')
                .update({
                    jumlah_pinjaman: rawAmount,
                    tipe_bunga: useInterest ? interestType : 'NONE',
                    nilai_bunga: useInterest ? parseFloat(interestValue) : 0
                })
                .eq('id', id);

            if (error) throw error;
            alert('Konfigurasi pinjaman & bunga berhasil ditetapkan!');
        } catch (error) {
            console.error('Error saving draft:', error);
            alert('Gagal menetapkan bunga: ' + error.message);
        }
    };

    const handleReject = async () => {
        if (!loan) return;

        const confirmReject = window.confirm(`Tolak pengajuan pinjaman dari ${loan.personal_data?.full_name}?`);
        if (!confirmReject) return;

        try {
            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({
                    status: 'DITOLAK'
                })
                .eq('id', loan.id);

            if (updateError) throw updateError;

            alert('Pengajuan pinjaman telah DITOLAK!');
            navigate('/admin/assesment-pinjaman');
        } catch (error) {
            console.error('Error rejecting loan:', error);
            alert('Gagal menolak pinjaman: ' + error.message);
        }
    };

    const handleApprove = async () => {
        if (!loan) return;

        const rawAmountString = typeof editingAmount === 'string' ? editingAmount : String(editingAmount);
        const finalAmount = parseFloat(rawAmountString.replace(/\./g, ''));

        if (isNaN(finalAmount) || finalAmount <= 0) {
            alert('Nominal pinjaman tidak valid');
            return;
        }

        if (useInterest) {
            const intValue = parseFloat(interestValue);
            if (isNaN(intValue) || intValue <= 0) {
                alert('Nilai bunga tidak valid');
                return;
            }
        }

        const confirmApprove = window.confirm(
            `Setujui pengajuan pinjaman sebesar Rp ${finalAmount.toLocaleString('id-ID')} untuk ${loan.personal_data?.full_name}?\n\n` +
            (useInterest
                ? `Bunga: ${interestType === 'PERSENAN' ? interestValue + '%' : 'Rp ' + parseFloat(interestValue).toLocaleString('id-ID')}`
                : 'Tanpa Bunga')
        );

        if (!confirmApprove) return;

        try {
            const tenor = loan.tenor_bulan;
            const pokok = finalAmount;

            let totalBunga = 0;
            let tipe_bunga = 'NONE';
            let nilai_bunga = 0;

            if (useInterest) {
                tipe_bunga = interestType;
                nilai_bunga = parseFloat(interestValue);

                if (interestType === 'PERSENAN') {
                    totalBunga = pokok * (nilai_bunga / 100) * (tenor / 12);
                } else {
                    totalBunga = nilai_bunga;
                }
            }

            const totalBayar = pokok + totalBunga;
            const monthlyAmount = Math.ceil(totalBayar / tenor);

            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({
                    status: 'DISETUJUI',
                    jumlah_pinjaman: pokok,
                    tipe_bunga: tipe_bunga,
                    nilai_bunga: nilai_bunga
                })
                .eq('id', loan.id);

            if (updateError) throw updateError;

            alert('Pengajuan pinjaman telah DISETUJUI!');
            navigate('/admin/assesment-pinjaman');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Gagal menyetujui pinjaman: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Memuat detail pengajuan...</p>
                </div>
            </div>
        );
    }

    if (!loan) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header / Nav */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/assesment-pinjaman')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 italic uppercase tracking-tight">Detail Verifikasi</h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">Loan Assessment Page</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Detail Pinjaman & Edit Amount */}
                        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
                            <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-white">
                                    <Wallet size={20} />
                                    <h3 className="font-black italic uppercase tracking-widest text-sm">Konfigurasi Pinjaman</h3>
                                </div>
                                <span className="bg-white/20 text-white px-3 py-1 rounded text-[10px] font-black italic">STEP 1</span>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="text-left group">
                                            <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 italic">Permohonan Pinjaman (Fixed)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black italic text-xl">Rp</span>
                                                <input
                                                    type="text"
                                                    value={parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-black text-gray-400 italic focus:outline-none transition-all shadow-inner"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                        <div className="text-left group">
                                            <label className="text-[10px] font-black text-emerald-400 block uppercase mb-1 italic">Nominal Disetujui (Dapat Diubah)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black italic text-xl">Rp</span>
                                                <input
                                                    type="text"
                                                    value={editingAmount}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        const formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                                        setEditingAmount(formatted);
                                                    }}
                                                    className="w-full pl-12 pr-6 py-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-2xl font-black text-emerald-800 italic focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interest Configuration */}
                                    <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-6 space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="useInterest-page"
                                                    checked={useInterest}
                                                    onChange={(e) => setUseInterest(e.target.checked)}
                                                    className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500"
                                                />
                                                <label htmlFor="useInterest-page" className="ml-3 text-sm font-black text-gray-700 italic uppercase">
                                                    Gunakan Bunga / Margin?
                                                </label>
                                            </div>

                                            <button
                                                onClick={handleSaveDraft}
                                                className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md flex items-center gap-2"
                                            >
                                                <Check size={14} />
                                                Tetapkan Bunga
                                            </button>
                                        </div>

                                        {useInterest ? (
                                            <div className="space-y-4 pt-2 pl-2">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-amber-600 uppercase italic">Metode Perhitungan</label>
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => setInterestType('PERSENAN')}
                                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${interestType === 'PERSENAN' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-amber-600 border-amber-200'}`}
                                                        >
                                                            Persentase (%)
                                                        </button>
                                                        <button
                                                            onClick={() => setInterestType('NOMINAL')}
                                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${interestType === 'NOMINAL' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-amber-600 border-amber-200'}`}
                                                        >
                                                            Nominal (Rp)
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-amber-600 uppercase italic">
                                                        {interestType === 'PERSENAN' ? 'Suku Bunga flat (% / Tahun)' : 'Nominal Bunga Total (Rp)'}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={interestValue}
                                                            onChange={(e) => setInterestValue(e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-lg font-black text-gray-800 focus:outline-none focus:border-amber-500"
                                                        />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-amber-400 italic">
                                                            {interestType === 'PERSENAN' ? '%' : 'Rp'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Live Result Cards */}
                                                <div className="grid grid-cols-2 gap-4 mt-6">
                                                    <div className="bg-white/60 p-4 rounded-xl border border-amber-200">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase italic mb-1">Estimasi Bunga</p>
                                                        {(() => {
                                                            const principal = parseFloat(editingAmount.toString().replace(/\./g, '')) || 0;
                                                            const tenor = loan.tenor_bulan;
                                                            let totalBunga = 0;
                                                            if (interestType === 'PERSENAN') {
                                                                totalBunga = principal * (parseFloat(interestValue || 0) / 100) * (tenor / 12);
                                                            } else {
                                                                totalBunga = parseFloat(interestValue || 0);
                                                            }
                                                            return <p className="text-lg font-black text-amber-600 italic">Rp {Math.round(totalBunga).toLocaleString('id-ID')}</p>;
                                                        })()}
                                                    </div>
                                                    <div className="bg-white/60 p-4 rounded-xl border border-emerald-200">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase italic mb-1">Angsuran / Bulan</p>
                                                        {(() => {
                                                            const principal = parseFloat(editingAmount.toString().replace(/\./g, '')) || 0;
                                                            const tenor = loan.tenor_bulan;
                                                            let totalBunga = 0;
                                                            if (interestType === 'PERSENAN') {
                                                                totalBunga = principal * (parseFloat(interestValue || 0) / 100) * (tenor / 12);
                                                            } else {
                                                                totalBunga = parseFloat(interestValue || 0);
                                                            }
                                                            const total = principal + totalBunga;
                                                            const cicilan = Math.ceil(total / tenor);
                                                            return <p className="text-lg font-black text-emerald-700 italic">Rp {cicilan.toLocaleString('id-ID')}</p>;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-4 bg-white/50 border border-amber-100 rounded-xl">
                                                <AlertCircle size={20} className="text-amber-500" />
                                                <p className="text-xs font-bold text-amber-700 italic">Pinjaman tanpa bunga dikonfigurasi. Total bayar akan sama dengan jumlah pinjaman.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Info */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                                <FileText size={20} className="text-blue-600" />
                                <h3 className="font-black italic uppercase tracking-widest text-sm text-gray-800">Detail Pengajuan Anggota</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic">Jenis Pinjaman</label>
                                        <p className="font-bold text-gray-800 uppercase">{loan.jenis_pinjaman || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic">Keperluan</label>
                                        <p className="font-bold text-gray-800">{loan.keperluan || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic">Tenor</label>
                                        <p className="font-bold text-gray-800">{loan.tenor_bulan} Bulan</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase italic">No. Pinjaman</label>
                                        <p className="font-mono font-bold text-gray-600 text-sm">{loan.no_pinjaman}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-6">
                        {/* Running Loans Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gray-800 px-6 py-4 flex items-center gap-3">
                                <Wallet size={18} className="text-white" />
                                <h3 className="font-black italic uppercase tracking-widest text-xs text-white">Pinjaman Berjalan</h3>
                            </div>
                            <div className="p-0">
                                {runningLoans.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
                                        <p className="text-xs font-bold text-gray-400 italic">Tidak ada pinjaman berjalan lain</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {runningLoans.map((rl) => (
                                            <Link
                                                key={rl.id}
                                                to={`/admin/loan-detail/${rl.id}`}
                                                className="p-4 hover:bg-emerald-50 transition-colors block border-b border-gray-100 last:border-0"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase italic bg-emerald-50 px-2 py-0.5 rounded">
                                                        {rl.status}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold text-gray-400">{rl.no_pinjaman}</span>
                                                </div>
                                                <p className="text-sm font-black text-gray-800 italic">
                                                    Rp {rl.jumlah_pinjaman.toLocaleString('id-ID')}
                                                </p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">
                                                        Tenor: {rl.tenor_bulan} Bulan
                                                    </p>
                                                    <ChevronLeft size={12} className="text-emerald-400 rotate-180" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 sticky top-24">
                            <button
                                onClick={() => generateLoanAnalysisPDF(loan, false, analystName, {
                                    amount: parseFloat(editingAmount),
                                    useInterest: useInterest,
                                    interestType: interestType,
                                    interestValue: parseFloat(interestValue)
                                })}
                                className="w-full py-4 bg-blue-50 text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-200"
                            >
                                <Eye size={18} />
                                Pratinjau Analisa
                            </button>

                            <button
                                onClick={handleApprove}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                            >
                                <Check size={18} />
                                Setujui Sekarang
                            </button>

                            <button
                                onClick={handleReject}
                                className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-200"
                            >
                                <X size={18} />
                                Tolak Pinjaman
                            </button>

                            <button
                                onClick={() => navigate('/admin/assesment-pinjaman')}
                                className="w-full py-4 bg-white text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all border border-gray-200"
                            >
                                <X size={18} />
                                Kembali Ke Daftar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssesmentDetail;
