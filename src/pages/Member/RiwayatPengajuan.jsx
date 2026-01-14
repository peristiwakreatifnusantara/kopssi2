import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { FileText, Clock, CheckCircle, XCircle, Eye, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const RiwayatPengajuan = () => {
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const storedUser = localStorage.getItem('auth_user');
                if (!storedUser) {
                    setError("Silakan login terlebih dahulu.");
                    setLoading(false);
                    return;
                }

                const authUser = JSON.parse(storedUser);

                const { data: personalData } = await supabase
                    .from('personal_data')
                    .select('id')
                    .eq('user_id', authUser.id)
                    .single();

                if (personalData) {
                    const { data, error: loanError } = await supabase
                        .from('pinjaman')
                        .select('*')
                        .eq('personal_data_id', personalData.id)
                        .order('created_at', { ascending: false });

                    if (loanError) throw loanError;
                    setLoans(data || []);
                }
            } catch (err) {
                console.error("Error fetching loans:", err);
                setError("Gagal memuat riwayat pengajuan.");
            } finally {
                setLoading(false);
            }
        };

        fetchLoans();
    }, []);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const targets = gsap.utils.toArray('.anim-up');
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
    }, [loading]);

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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="space-y-6">
            <div className="anim-up bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shadow-sm shadow-blue-50">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 italic uppercase tracking-tighter">Pinjaman Terdaftar</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest text-[10px]">Riwayat semua pengajuan pinjaman Anda</p>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto text-left">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">No. Pinjaman</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Jumlah</th>
                                <th className="px-6 py-4 text-center">Tenor</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {loans.map((ln) => (
                                <tr
                                    key={ln.id}
                                    onClick={() => navigate(`/dashboard/pengajuan-pinjaman/${ln.id}`)}
                                    className="hover:bg-emerald-50/20 transition-all cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-gray-800 font-mono italic">{ln.no_pinjaman}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-gray-500 italic">
                                            {new Date(ln.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-emerald-600 italic">
                                            Rp {parseFloat(ln.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-bold text-gray-600">{ln.tenor_bulan} Bln</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${getStatusStyles(ln.status)}`}>
                                            {getStatusLabel(ln.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="p-2 rounded-lg text-gray-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
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
                    {loans.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-400 font-medium italic uppercase tracking-widest text-[10px]">
                            Belum ada riwayat pengajuan pinjaman.
                        </div>
                    ) : (
                        loans.map((ln) => (
                            <div
                                key={ln.id}
                                onClick={() => navigate(`/dashboard/pengajuan-pinjaman/${ln.id}`)}
                                className="p-4 active:bg-gray-50 transition-colors flex items-center justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-900 uppercase italic tracking-tight">{ln.no_pinjaman}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${getStatusStyles(ln.status)}`}>
                                            {getStatusLabel(ln.status)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-gray-400 font-bold italic">
                                            {new Date(ln.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="text-sm font-black text-emerald-600 italic">
                                            Rp {parseFloat(ln.jumlah_pinjaman).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={10} className="text-gray-400" />
                                        <span className="text-[10px] text-gray-500 font-bold italic tracking-tight">{ln.tenor_bulan} Bulan</span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiwayatPengajuan;
