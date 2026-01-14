import React, { useEffect, useState } from 'react';
import { CreditCard, FileText, Download, Upload, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { generateLoanAgreementPDF } from '../../utils/loanAgreementPdf';
import { generateLoanAnalysisPDF } from '../../utils/loanAnalysisPdf';

const Pinjaman = () => {
    const [loans, setLoans] = useState([]);
    const [selectedLoanId, setSelectedLoanId] = useState(null);
    const [loan, setLoan] = useState(null);
    const [summary, setSummary] = useState({
        totalPinjaman: 0,
        pokokTerbayar: 0,
        sisaPokok: 0,
        paidMonths: 0,
        unpaidMonths: 0,
        remainingMonths: 0,
        nextBill: 0
    });
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            console.log("Pinjaman: Fetching started...");
            try {
                // Cek Auth via Supabase
                const { data: { user } } = await supabase.auth.getUser();
                console.log("Pinjaman: Supabase User ->", user);

                // Cek Auth via LocalStorage (seperti PengajuanPinjaman)
                const storedUser = localStorage.getItem('auth_user');
                console.log("Pinjaman: LocalStorage User ->", storedUser);

                let userId = user?.id;

                // Jika Supabase Auth user kosong, coba gunakan LocalStorage
                if (!userId && storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        userId = parsedUser.id;
                        console.log("Pinjaman: Using ID from LocalStorage ->", userId);
                    } catch (e) {
                        console.error("Pinjaman: Error parsing local storage user", e);
                    }
                }

                if (!userId) {
                    console.warn("Pinjaman: No user ID found. Aborting.");
                    setLoading(false);
                    return;
                }

                const { data: personalData, error: personalError } = await supabase
                    .from('personal_data')
                    .select('id, full_name')
                    .eq('user_id', userId)
                    .single();

                if (personalError) {
                    console.error("Pinjaman: Error fetching personal_data ->", personalError);
                }
                console.log("Pinjaman: Personal Data ->", personalData);

                if (!personalData) {
                    console.warn("Pinjaman: No personal_data found for user", userId);
                    setLoading(false);
                    return;
                }

                // Fetch Active Loan (First one found for detail view)
                // In a real app with multiple loans, we'd list them. Here we focus on the primary active loan.
                const { data: loans, error: loansError } = await supabase
                    .from('pinjaman')
                    .select('*')
                    .eq('personal_data_id', personalData.id)
                    .eq('status', 'DICAIRKAN')
                    .order('created_at', { ascending: false });

                console.log("Pinjaman: Loans fetch result ->", loans);
                if (loansError) console.error("Pinjaman: Error fetching loans ->", loansError);

                if (loans && loans.length > 0) {
                    setLoans(loans);
                    setSelectedLoanId(loans[0].id);
                } else {
                    setHasData(false);
                }

            } catch (error) {
                console.error("Error fetching pinjaman:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const updateLoanSummary = async () => {
            if (!selectedLoanId) return;

            const activeLoan = loans.find(l => l.id === selectedLoanId);
            if (!activeLoan) return;

            try {
                const { data: angsuran } = await supabase
                    .from('angsuran')
                    .select('*')
                    .eq('pinjaman_id', activeLoan.id);

                const principal = parseFloat(activeLoan.jumlah_pinjaman);
                const tenure = activeLoan.tenor_bulan;

                let totalBunga = 0;
                if (activeLoan.tipe_bunga === 'PERSENAN') {
                    // Match AssesmentPinjaman.jsx logic (Annual Flat Rate)
                    totalBunga = principal * (parseFloat(activeLoan.nilai_bunga) / 100) * (tenure / 12);
                } else if (activeLoan.tipe_bunga === 'NOMINAL') {
                    totalBunga = parseFloat(activeLoan.nilai_bunga);
                }

                const totalBayar = principal + totalBunga;

                let pokokTerbayar = 0;
                let paidMonths = 0;
                let unpaidMonths = 0;
                let nextBill = 0;

                if (angsuran) {
                    const sortedAngsuran = angsuran.sort((a, b) => a.bulan_ke - b.bulan_ke);
                    const nextInstallment = sortedAngsuran.find(a => a.status !== 'PAID');

                    if (nextInstallment) {
                        nextBill = parseFloat(nextInstallment.amount);
                    }

                    sortedAngsuran.forEach(a => {
                        if (a.status === 'PAID') {
                            pokokTerbayar += parseFloat(a.amount);
                            paidMonths++;
                        } else {
                            unpaidMonths++;
                        }
                    });
                }

                const sisaPokok = totalBayar - pokokTerbayar;
                const remainingMonths = Math.max(0, tenure - paidMonths);

                setLoan(activeLoan);
                setSummary({
                    totalPinjaman: principal,
                    totalBayar,
                    totalBunga,
                    pokokTerbayar,
                    sisaPokok,
                    paidMonths,
                    unpaidMonths,
                    remainingMonths,
                    nextBill
                });
                setHasData(true);
            } catch (err) {
                console.error("Error updating loan summary:", err);
            }
        };

        updateLoanSummary();
    }, [selectedLoanId, loans]);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const handleUploadSPK = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `spk_${loan.no_pinjaman}_${Date.now()}.${fileExt}`;
            const filePath = `spk/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('pinjaman')
                .update({ link_spk_signed: publicUrl })
                .eq('id', loan.id);

            if (updateError) throw updateError;

            // Refresh loan data
            setLoan(prev => ({ ...prev, link_spk_signed: publicUrl }));
            alert('SPK Berhasil diupload! Silakan tunggu verifikasi admin.');
        } catch (error) {
            console.error('Error uploading SPK:', error);
            alert('Gagal mengupload SPK: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    if (!hasData) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-gray-800">Pinjaman Tidak ada</h3>
                <p className="text-gray-500 mt-2">Anda tidak memiliki pinjaman aktif saat ini.</p>
            </div>
        );
    }

    const progressPercent = Math.min(100, Math.round((summary.paidMonths / loan.tenor_bulan) * 100));
    // Calculate estimated monthly installment (simple flat rate from DB or just divide)
    // DB has `bunga_persen`. Assuming `jumlah_pinjaman` is principal. 
    // Installment = (Principal + (Principal * Bunga/100 * Tenor)) / Tenor ? Or just Principal/Tenor + Bunga?
    // User schema: `bunga_persen` numeric DEFAULT 0.
    // Let's assume simple calculation or just show Principal/Tenor if bunga is 0.
    // For display, "Angsuran per Bulan" -> We don't have this field explicitly stored as "bill", 
    // but we can estimate: (Principal / Tenor) + (Principal * (Bunga/100)).
    // Let's just do Principal / Tenor for now if Bunga is not clear, or (Principal * (1 + (Bunga/100 * Tenor/12))) / Tenor.
    // To match typical cooperative: (Principal + Margin) / Tenor. 
    // Let's use simple logic: Principal / Tenor.
    const angsuranPerBulan = summary.totalPinjaman / loan.tenor_bulan;

    return (
        <div className="space-y-6">
            {/* Loan Selector if multiple exist */}
            {loans.length > 1 && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm">Pilih Pinjaman</h3>
                            <p className="text-xs text-gray-500">Anda memiliki {loans.length} pinjaman aktif</p>
                        </div>
                    </div>
                    <select
                        value={selectedLoanId}
                        onChange={(e) => setSelectedLoanId(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                    >
                        {loans.map(ln => (
                            <option key={ln.id} value={ln.id}>
                                {ln.no_pinjaman} - Rp {parseFloat(ln.jumlah_pinjaman).toLocaleString('id-ID')}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-blue-200 text-sm font-medium mb-1">Status Pembayaran</p>
                        <h2 className="text-4xl font-bold">{formatCurrency(summary.pokokTerbayar)} / {formatCurrency(summary.totalBayar)}</h2>
                        <div className="mt-4 flex gap-4 text-sm">
                            <div>
                                <p className="text-blue-200">Nomor Pinjaman</p>
                                <p className="font-medium">{loan.no_pinjaman}</p>
                            </div>
                            <div>
                                <p className="text-blue-200">Tanggal Pencairan</p>
                                <p className="font-medium">{formatDate(loan.created_at)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 min-w-[200px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Status Pinjaman</span>
                            <span className="font-bold uppercase tracking-widest text-sm">{loan.status}</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-2 mb-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-blue-200">
                            <span>{summary.paidMonths} Angsuran Paid</span>
                            <span>{summary.remainingMonths} Remaining</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SPK Section for Approved Loans */}
            {loan.status === 'DISETUJUI' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-amber-900 italic uppercase">Dokumen Perjanjian Pinjaman (SPK)</h3>
                            <p className="text-xs font-bold text-amber-700 italic">Silakan lengkapi dokumen untuk proses pencairan dana.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-amber-100 flex flex-col items-center text-center">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">Tahap 1: Unduh Dokumen</p>
                            <button
                                onClick={() => generateLoanAgreementPDF(loan)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all"
                            >
                                <Download size={18} /> Unduh Draft SPK
                            </button>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Cetak dan tanda tangani dokumen di atas materai Rp. 10.000</p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-amber-100 flex flex-col items-center text-center">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">Tahap 2: Upload Scan SPK</p>
                            {loan.link_spk_signed ? (
                                <div className="w-full py-3 bg-emerald-100 text-emerald-700 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 border border-emerald-200">
                                    <Check size={18} /> Sudah Diupload
                                </div>
                            ) : (
                                <div className="w-full relative">
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleUploadSPK}
                                        className="hidden"
                                        id="spk-upload"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="spk-upload"
                                        className={`w-full py-3 ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'} rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100`}
                                    >
                                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                        {uploading ? 'Sedang Mengunggah...' : 'Upload Scan SPK'}
                                    </label>
                                </div>
                            )}
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Format: PDF atau Foto (JPG/PNG). Pastikan tanda-tangan terlihat jelas.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-blue-600" /> Detail Pinjaman
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Plafon Pinjaman</span>
                            <span className="font-medium text-gray-900">{formatCurrency(summary.totalPinjaman)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Jangka Waktu</span>
                            <span className="font-medium text-gray-900">{loan.tenor_bulan} Bulan</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Suku Bunga</span>
                            <span className="font-medium text-gray-900">
                                {loan.tipe_bunga === 'PERSENAN' ? `${loan.nilai_bunga}% / Tahun` :
                                    loan.tipe_bunga === 'NOMINAL' ? `Rp ${parseFloat(loan.nilai_bunga).toLocaleString('id-ID')}` : '0%'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Total Bunga</span>
                            <span className="font-medium text-gray-900">{formatCurrency(summary.totalBunga || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Total Bayar</span>
                            <span className="font-bold text-emerald-700">{formatCurrency(summary.totalBayar)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Estimasi Angsuran</span>
                            <span className="font-medium text-gray-900">{formatCurrency(summary.nextBill)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500">Status</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">{loan.status}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" /> Ringkasan Pembayaran
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Angsuran Sudah Dibayar</span>
                            <span className="font-medium text-emerald-600 font-bold">{summary.paidMonths} kali</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Angsuran Belum Dibayar</span>
                            <span className="font-medium text-amber-600 font-bold">{summary.unpaidMonths} kali</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Total Sudah Dibayar</span>
                            <span className="font-medium text-emerald-600 font-bold">{formatCurrency(summary.pokokTerbayar)}</span>
                        </div>
                        {/* 
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Bunga Terbayar</span>
                            <span className="font-medium text-gray-900">-</span>
                        </div>
                        */}
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Sisa Kewajiban</span>
                            <span className="font-medium text-red-600">{formatCurrency(summary.sisaPokok)}</span>
                        </div>
                        <div className="mt-6 pt-4 bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 text-center">Pinjaman ini dilindungi asuransi kredit. Jika terjadi resiko meninggal dunia, sisa pinjaman dianggap lunas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pinjaman;
