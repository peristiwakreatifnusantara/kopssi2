import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    CreditCard,
    FileText,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Download,
    Upload,
    Eye,
    Loader2,
    Check,
    AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { generateLoanAgreementPDF } from '../../utils/loanAgreementPdf';
import gsap from 'gsap';

const DetailPengajuan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadingSPK, setUploadingSPK] = useState(false);

    useEffect(() => {
        const fetchLoanDetail = async () => {
            try {
                if (!id) return;
                const { data, error: fetchError } = await supabase
                    .from('pinjaman')
                    .select(`
                        *,
                        personal_data (
                            id,
                            full_name,
                            no_npp,
                            work_unit,
                            no_anggota,
                            nik
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) {
                    setError('Data pengajuan tidak ditemukan.');
                    return;
                }
                setLoan(data);
            } catch (err) {
                console.error('Error fetching loan detail:', err);
                setError('Gagal memuat detail pengajuan: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLoanDetail();
    }, [id]);

    useLayoutEffect(() => {
        if (!loading && loan && containerRef.current) {
            const ctx = gsap.context(() => {
                const targets = containerRef.current.querySelectorAll('.animate-fade-up');
                if (targets.length > 0) {
                    gsap.from(targets, {
                        y: 20,
                        opacity: 0,
                        duration: 0.6,
                        stagger: 0.1,
                        ease: 'power2.out',
                    });
                }
            }, containerRef);
            return () => ctx.revert();
        }
    }, [loading, loan]);

    const handleUploadSPK = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingSPK(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `spk_member_${loan.no_pinjaman}_${Date.now()}.${fileExt}`;
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

            setLoan(prev => ({ ...prev, link_spk_signed: publicUrl }));
            alert('Dokumen Perjanjian (SPK) Berhasil diupload! Silakan tunggu verifikasi admin.');
        } catch (error) {
            console.error('Error uploading SPK:', error);
            alert('Gagal mengupload dokumen: ' + error.message);
        } finally {
            setUploadingSPK(false);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            'PENGAJUAN': 'Menunggu Verifikasi',
            'DISETUJUI': 'Disetujui',
            'DICAIRKAN': 'Dicairkan',
            'LUNAS': 'Lunas',
            'DITOLAK': 'Ditolak'
        };
        return labels[status] || status;
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'PENGAJUAN': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'DISETUJUI': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DICAIRKAN': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'LUNAS': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'DITOLAK': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                <p className="text-gray-500 text-sm">Memuat detail pengajuan...</p>
            </div>
        );
    }

    if (error || !loan) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    <p>{error || 'Data tidak ditemukan'}</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 flex items-center gap-2 text-emerald-600 font-medium"
                >
                    <ChevronLeft size={20} /> Kembali
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="max-w-4xl mx-auto w-full space-y-6 pb-12">
            {/* Header / Nav */}
            <div className="flex items-center justify-between animate-fade-up">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group"
                >
                    <div className="p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="font-medium">Kembali ke Daftar</span>
                </button>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusStyles(loan.status)}`}>
                    {getStatusLabel(loan.status)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Loan Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Info Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CreditCard className="text-emerald-600" size={20} />
                                Informasi Pinjaman
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Nomor Pinjaman</p>
                                <p className="text-sm font-mono font-bold text-gray-900">{loan.no_pinjaman}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Tanggal Pengajuan</p>
                                <p className="text-sm font-bold text-gray-900">
                                    {new Date(loan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Jumlah Pinjaman</p>
                                <p className="text-xl font-black text-emerald-600">
                                    Rp {parseFloat(loan.jumlah_pinjaman).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Tenor</p>
                                <p className="text-sm font-bold text-gray-900">{loan.tenor_bulan} Bulan</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Kategori</p>
                                <p className="text-sm font-bold text-gray-900">{loan.kategori}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Jenis Pinjaman</p>
                                <p className="text-sm font-bold text-gray-900">{loan.jenis_pinjaman}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Keperluan</p>
                                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    {loan.keperluan}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Member Info Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="text-blue-600" size={20} />
                                Data Pemohon
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Nama Lengkap</p>
                                <p className="text-sm font-bold text-gray-800">{loan.personal_data?.full_name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">No. NPP / Anggota</p>
                                <p className="text-sm font-bold text-gray-800">{loan.personal_data?.no_npp || '-'} / {loan.personal_data?.no_anggota || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Unit Kerja</p>
                                <p className="text-sm font-bold text-gray-800">{loan.personal_data?.work_unit || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase mb-1">NIK</p>
                                <p className="text-sm font-bold text-gray-800">{loan.personal_data?.nik || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & SPK */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-fade-up">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest italic">Status Alur</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 p-1 rounded-full ${loan.status === 'PENGAJUAN' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {loan.status === 'PENGAJUAN' ? <Clock size={14} /> : <Check size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Pengajuan Terkirim</p>
                                    <p className="text-[11px] text-gray-500">Menunggu verifikasi admin</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 p-1 rounded-full ${['DISETUJUI', 'DICAIRKAN', 'LUNAS'].includes(loan.status) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-300'}`}>
                                    <Check size={14} />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${['DISETUJUI', 'DICAIRKAN', 'LUNAS'].includes(loan.status) ? 'text-gray-900' : 'text-gray-400'}`}>Persetujuan Admin</p>
                                    <p className="text-[11px] text-gray-500">Diverifikasi oleh pengurus</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 p-1 rounded-full ${loan.link_spk_signed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-300'}`}>
                                    <Check size={14} />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${loan.link_spk_signed ? 'text-gray-900' : 'text-gray-400'}`}>Upload SPK</p>
                                    <p className="text-[11px] text-gray-500">Dokumen perjanjian ditandatangani</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PDF Management - Only if Disetujui or beyond */}
                    {['DISETUJUI', 'DICAIRKAN', 'LUNAS'].includes(loan.status) && (
                        <div className="bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100 p-6 space-y-4 animate-fade-up">
                            <div className="flex items-center gap-2 text-white/90 mb-2">
                                <FileText size={18} />
                                <h3 className="text-sm font-black uppercase tracking-widest italic font-outfit">Dokumen Perjanjian</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => generateLoanAgreementPDF(loan, 'preview')}
                                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all border border-white/20"
                                >
                                    <Eye size={16} /> Lihat Draft SPK
                                </button>

                                <button
                                    onClick={() => generateLoanAgreementPDF(loan, 'save')}
                                    className="w-full py-3 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                                >
                                    <Download size={16} /> Unduh Draft SPK
                                </button>
                            </div>

                            <div className="h-px bg-white/10 my-2" />

                            {loan.link_spk_signed ? (
                                <div className="space-y-3">
                                    <div className="w-full py-3 bg-emerald-500/30 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-white/20">
                                        <CheckCircle size={16} /> SPK SUDAH DIUPLOAD
                                    </div>
                                    <a
                                        href={loan.link_spk_signed}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all border border-white/20"
                                    >
                                        <Eye size={16} /> Lihat Dokumen Upload
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="spk-upload"
                                            className="hidden"
                                            accept="image/*,application/pdf"
                                            disabled={uploadingSPK}
                                            onChange={handleUploadSPK}
                                        />
                                        <label
                                            htmlFor="spk-upload"
                                            className={`w-full py-3 ${uploadingSPK ? 'bg-emerald-800 text-emerald-300' : 'bg-white hover:bg-emerald-50 text-emerald-700 cursor-pointer'} rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95`}
                                        >
                                            {uploadingSPK ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            {uploadingSPK ? 'MENGUNGGAH...' : 'UPLOAD SCAN SPK'}
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-white/70 font-medium italic text-center">
                                        * Tanda tangani SPK di atas materai, kemudian upload scan/fotonya di sini.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Payments if Disbursed */}
                    {['DICAIRKAN', 'LUNAS'].includes(loan.status) && (
                        <button
                            onClick={() => navigate('/dashboard/pinjaman')}
                            className="w-full py-4 bg-white text-emerald-600 border border-emerald-100 rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all shadow-sm animate-fade-up"
                        >
                            <Calendar size={18} /> Monitoring Pembayaran
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailPengajuan;
