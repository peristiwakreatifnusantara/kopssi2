import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    X,
    User,
    Wallet,
    FileText,
    CheckCircle,
    Eye,
    ChevronLeft,
    AlertCircle,
    Download,
    Loader2
} from 'lucide-react';

const PencairanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLoanDetail();
    }, [id]);

    const fetchLoanDetail = async () => {
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
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) throw new Error("Data pinjaman tidak ditemukan.");

            setLoan(data);

            // Fetch installments
            const { data: instData, error: instError } = await supabase
                .from('angsuran')
                .select('*')
                .eq('pinjaman_id', id)
                .order('bulan_ke', { ascending: true });

            if (instError) throw instError;
            setInstallments(instData || []);

        } catch (err) {
            console.error('Error fetching loan detail:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
        );
    }

    if (error || !loan) {
        return (
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-700">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle size={24} />
                    <h2 className="text-lg font-bold">Terjadi Kesalahan</h2>
                </div>
                <p>{error || "Data tidak ditemukan"}</p>
                <button
                    onClick={() => navigate('/admin/pencairan-pinjaman')}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
                >
                    Kembali ke Daftar
                </button>
            </div>
        );
    }

    // Calculate loan summary
    const principal = parseFloat(loan.jumlah_pinjaman);
    const tenor = loan.tenor_bulan;

    let totalBunga = 0;
    if (loan.tipe_bunga === 'PERSENAN') {
        totalBunga = principal * (parseFloat(loan.nilai_bunga) / 100) * (tenor / 12);
    } else if (loan.tipe_bunga === 'NOMINAL') {
        totalBunga = parseFloat(loan.nilai_bunga);
    }

    const totalBayar = principal + totalBunga;
    const cicilan = installments.length > 0 ? parseFloat(installments[0].amount) : (totalBayar / tenor);

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/pencairan-pinjaman')}
                        className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-emerald-600 transition-colors shadow-sm"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 italic uppercase tracking-tight">Proses Pencairan</h2>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">ID Pinjaman: {loan.no_pinjaman}</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${loan.status === 'DISETUJUI' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    Status: {loan.status}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Data identities & Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Identities Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                            <User size={18} className="text-emerald-600" />
                            <h3 className="font-black text-gray-900 italic uppercase text-sm tracking-tight">Identitas Anggota</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">Nama Lengkap</label>
                                    <p className="font-bold text-gray-900">{loan.personal_data?.full_name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">NPP / NIK</label>
                                    <p className="font-bold text-gray-900 font-mono tracking-tighter">{loan.personal_data?.nik || '-'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">Instansi / Unit Kerja</label>
                                    <p className="font-bold text-gray-900 uppercase">{loan.personal_data?.company || '-'} / {loan.personal_data?.work_unit || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">No. Telepon</label>
                                    <p className="font-bold text-gray-900">{loan.personal_data?.phone || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loan Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Financial Overview */}
                        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden text-left">
                            <div className="px-6 py-4 border-b border-emerald-50 bg-emerald-50/30 flex items-center gap-2">
                                <Wallet size={18} className="text-emerald-600" />
                                <h3 className="font-black text-emerald-900 italic uppercase text-sm tracking-tight">Detail Keuangan</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-emerald-400 block uppercase mb-1 tracking-widest">Plafon Pinjaman</label>
                                    <p className="text-3xl font-black text-emerald-700 tracking-tighter italic">
                                        Rp {principal.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t border-emerald-50 pt-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">Tenor</label>
                                        <p className="font-bold text-gray-900">{tenor} Bulan</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">Bunga</label>
                                        <p className="font-bold text-gray-900 italic">Rp {Math.round(totalBunga).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">Total Bayar</label>
                                        <p className="font-black text-emerald-700">Rp {Math.round(totalBayar).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">Cicilan/Bln</label>
                                        <p className="font-black text-red-600">Rp {Math.round(cicilan).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Document Reference */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                                <FileText size={18} className="text-emerald-600" />
                                <h3 className="font-black text-gray-900 italic uppercase text-sm tracking-tight">Referensi & Dokumen</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">No. Pinjaman</label>
                                        <p className="font-mono font-bold text-gray-800 text-sm tracking-widest uppercase">{loan.no_pinjaman}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">Tanggal Pengajuan</label>
                                        <p className="font-bold text-gray-800">{formatDate(loan.created_at)}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-50">
                                    <label className="text-[10px] font-black text-gray-400 block uppercase mb-1 tracking-widest">Dokumen SPK Signed</label>
                                    {loan.link_spk_signed ? (
                                        <a
                                            href={loan.link_spk_signed}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition-all border-dashed"
                                        >
                                            <Download size={16} /> Lihat Dokumen
                                        </a>
                                    ) : (
                                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                                            <p className="text-[10px] font-black text-amber-700 uppercase italic">Dokumen Belum Diupload</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Additional Info */}
                <div className="space-y-6">
                    {/* Action Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-left space-y-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b pb-3 italic">Panel Aksi</h3>

                        <div className="space-y-3">
                            <button
                                onClick={() => navigate(`/admin/loan-detail/${loan.id}`)}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:translate-y-0.5"
                            >
                                <Eye size={18} />
                                Kelola Pencairan
                            </button>

                            <button
                                onClick={() => navigate(`/admin/loan-detail/${loan.id}`)}
                                className="w-full py-3 bg-white text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all border border-gray-200 shadow-sm"
                            >
                                <Eye size={16} />
                                Lihat Detail Full
                            </button>

                            <button
                                onClick={() => navigate('/admin/pencairan-pinjaman')}
                                className="w-full py-3 bg-white text-gray-400 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                            >
                                Kembali ke Daftar
                            </button>
                        </div>

                        {loan.status === 'DISETUJUI' && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                                <AlertCircle size={20} className="text-blue-500 shrink-0" />
                                <p className="text-[10px] font-black text-blue-700 leading-relaxed uppercase italic">
                                    Pastikan dokumen SPK telah diverifikasi sebelum melakukan pencairan dana.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div className="bg-emerald-900/5 rounded-2xl p-6 text-left">
                        <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 italic">Catatan Sistem</h4>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-[10px] font-bold text-emerald-700 uppercase leading-tight italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                                Dana akan dilepaskan sesuai dengan plafon yang disetujui.
                            </li>
                            <li className="flex gap-2 text-[10px] font-bold text-emerald-700 uppercase leading-tight italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                                Status akan berubah menjadi DICAIRKAN di dashboard anggota.
                            </li>
                            <li className="flex gap-2 text-[10px] font-bold text-emerald-700 uppercase leading-tight italic">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
                                Anggota akan mulai tertagih angsuran pada periode berikutnya.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PencairanDetail;
