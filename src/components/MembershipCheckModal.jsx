import React, { useState, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Search, X, Check, Loader2, Info, User, Briefcase, MapPin, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MembershipCheckModal = ({ isOpen, onClose }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const canvasRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [member, setMember] = useState(null);
    const [error, setError] = useState('');
    const [signature, setSignature] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const isDrawing = useRef(false);
    const lastPositionRef = useRef({ x: 0, y: 0 });

    useLayoutEffect(() => {
        if (isOpen) {
            gsap.to(modalRef.current, { duration: 0.2, pointerEvents: 'auto', opacity: 1 });
            gsap.fromTo(
                contentRef.current,
                { scale: 0.9, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
            );
        } else {
            gsap.to(contentRef.current, {
                scale: 0.9,
                opacity: 0,
                y: 20,
                duration: 0.3,
                onComplete: () => {
                    gsap.to(modalRef.current, { opacity: 0, duration: 0.2, pointerEvents: 'none' });
                    resetModal();
                },
            });
        }
    }, [isOpen]);

    const resetModal = () => {
        setSearchTerm('');
        setMember(null);
        setError('');
        setSignature(null);
        setPhotoFile(null);
        setNewPassword('');
        setSuccess(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) return;

        setLoading(true);
        setError('');
        try {
            // 1. Check personal_data table directly for NPP
            const { data: profileData, error: profileError } = await supabase
                .from('personal_data')
                .select('*')
                .eq('no_npp', searchTerm)
                .single();

            if (profileError || !profileData) {
                throw new Error('Data NPP tidak ditemukan. Silakan hubungi admin untuk pendaftaran.');
            }

            // 2. We already have the profileData, now ensure it has a user_id if we want to update password
            if (!profileData.user_id) {
                throw new Error('Data user belum terintegrasi. Silakan hubungi admin.');
            }

            if (profileData.status === 'active') {
                // We'll show an "Active" view instead of throwing error
            }

            if (profileData.status === 'DONE VERIFIKASI') {
                // We'll show the "Success" view instead of throwing error
            }

            setMember(profileData);
        } catch (err) {
            setError(err.message);
            setMember(null);
        } finally {
            setLoading(false);
        }
    };

    // Signature Pad Logic
    const initCanvas = () => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            canvas.width = canvas.offsetWidth;
            canvas.height = 180;
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
        }
    };

    useLayoutEffect(() => {
        if (member && !success) {
            setTimeout(initCanvas, 100);
        }
    }, [member, success]);

    const getCanvasPosition = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        if (event.touches && event.touches[0]) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top,
            };
        }
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    const startDraw = (event) => {
        const pos = getCanvasPosition(event);
        isDrawing.current = true;
        lastPositionRef.current = pos;
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        event.preventDefault();
    };

    const draw = (event) => {
        if (!isDrawing.current) return;
        const pos = getCanvasPosition(event);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPositionRef.current = pos;
        event.preventDefault();
    };

    const endDraw = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        setSignature(canvasRef.current.toDataURL());
    };

    const clearSignature = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setSignature(null);
    };

    const uploadFile = async (file, folder, fileName) => {
        if (!file) return null;
        const fileExt = file.name ? file.name.split('.').pop() : 'png';
        const filePath = `${folder}/${fileName}_${Date.now()}.${fileExt}`;

        // If it's a dataURL (signature), convert to blob
        let body = file;
        if (typeof file === 'string' && file.startsWith('data:')) {
            const res = await fetch(file);
            body = await res.blob();
        }

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, body, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    };

    const handleSubmit = async () => {
        if (!signature || !photoFile) {
            alert('Tanda tangan dan Pas Foto wajib diisi');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            alert('Password baru wajib diisi dan minimal 6 karakter');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Update Password in users table
            if (member.user_id) {
                const { error: passwordError } = await supabase
                    .from('users')
                    .update({ password: newPassword })
                    .eq('id', member.user_id);

                if (passwordError) throw passwordError;
            }

            // 2. Upload signature
            const signatureUrl = await uploadFile(signature, 'signatures', `sig_${member.no_npp || member.nik}`);

            // 3. Upload photo
            const photoUrl = await uploadFile(photoFile, 'photos', `photo_${member.no_npp || member.nik}`);

            // 4. Update database personal_data
            const { error } = await supabase
                .from('personal_data')
                .update({
                    signature_image: signatureUrl,
                    photo_34_file_path: photoUrl,
                    status: 'DONE VERIFIKASI'
                })
                .eq('id', member.id);

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            console.error('Error updating verification data:', err);
            alert('Gagal mengirim verifikasi: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 opacity-0 pointer-events-none">
            <div ref={contentRef} className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-blue-900 p-6 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 text-blue-200 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold italic uppercase tracking-tight">Cek Keanggotaan</h2>
                    <p className="text-blue-300 text-xs md:text-sm mt-1 italic font-medium">Verifikasi data Anda menggunakan NPP</p>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    {!member ? (
                        <div className="space-y-6">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Masukkan Nomor NPP Anda</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            required
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-bold italic"
                                            placeholder="Contoh: 12345678"
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Cek Status Sekarang'}
                                </button>
                            </form>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                                    <Info className="text-red-500 shrink-0" size={20} />
                                    <p className="text-[10px] font-bold text-red-900 uppercase tracking-tight opacity-70 italic">{error}</p>
                                </div>
                            )}

                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 italic space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Informasi:</p>
                                <p className="text-xs font-bold text-gray-600">Pastikan Nomor NPP Anda sudah didaftarkan oleh admin koperasi sebelum melakukan pengecekan.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 transition-all duration-500">
                            {(success || member.status?.toLowerCase() === 'done verifikasi') ? (
                                <div className="text-center space-y-4 py-10">
                                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100 animate-bounce-slow">
                                        <Check size={56} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase text-gray-900 italic tracking-tight">Data Berhasil Terkirim!</h3>
                                    <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto leading-relaxed italic">Terima kasih. Permohonan Anda sedang dalam proses verifikasi akhir oleh Admin Koperasi.</p>
                                    <button
                                        onClick={() => setMember(null)}
                                        className="mt-8 px-8 py-3 rounded-2xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
                                    >
                                        Kembali
                                    </button>
                                </div>
                            ) : (member.status?.toLowerCase() === 'active' || member.status?.toLowerCase() === 'verified') ? (
                                <div className="text-center space-y-4 py-10">
                                    <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100 animate-pulse-slow">
                                        <User size={56} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase text-gray-900 italic tracking-tight">Keanggotaan Aktif!</h3>
                                    <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto leading-relaxed italic">Selamat! Akun Anda sudah aktif. Silakan login menggunakan Nomor NPP Anda.</p>
                                    <button
                                        onClick={() => setMember(null)}
                                        className="mt-8 px-8 py-3 rounded-2xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
                                    >
                                        Kembali
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {member.status?.toLowerCase() === 'pending' && (
                                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 shadow-sm animate-pulse-slow">
                                            <Info className="text-amber-500 shrink-0" size={24} />
                                            <div>
                                                <p className="text-sm font-black text-amber-900 uppercase italic tracking-tight">Status: PENDING</p>
                                                <p className="text-[11px] font-bold text-amber-800/70 italic mt-0.5">Silakan lengkapi Tanda Tangan Digital dan Pas Foto 3x4 Anda untuk menyelesaikan proses pendaftaran.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm transition-all hover:bg-blue-100/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User size={16} className="text-blue-600" />
                                                <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Nama Lengkap</p>
                                            </div>
                                            <p className="text-sm font-black text-blue-900 uppercase italic leading-tight">{member.full_name}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Briefcase size={16} className="text-gray-400" />
                                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">NPP / NIK</p>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 uppercase italic leading-tight">{member.no_npp || member.nik || '-'}</p>
                                        </div>
                                    </div>

                                    {/* Application Form Text */}
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 max-h-60 overflow-y-auto shadow-inner">
                                        <div className="text-center border-b pb-4 mb-4">
                                            <h4 className="font-black uppercase italic text-sm text-slate-800">Surat Permohonan Anggota KOPSSI</h4>
                                        </div>
                                        <div className="text-[11px] leading-relaxed text-slate-700 space-y-4">
                                            <p>Kepada Yth,<br /><strong>Koperasi Jasa Pegawai Swadharma Sarana Informatika (KOPSSI)</strong><br />Bellagio Office Park Unit OUG 31-32, Kuningan - Jakarta Selatan</p>

                                            <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1">
                                                <p>Saya yang bertanda tangan di bawah ini:</p>
                                                <p>• Nama: <strong>{member.full_name}</strong></p>
                                                <p>• Perusahaan: <strong>{member.company || 'PT Swadharma Sarana Informatika'}</strong></p>
                                                <p>• Status Pegawai: <strong>{member.employment_status || '-'}</strong></p>
                                            </div>

                                            <p>Dengan ini mengajukan permohonan menjadi anggota Koperasi Jasa Pegawai Swadharma Sarana Informatika (KOPSSI) dan bersedia mematuhi ketentuan-ketentuan yang ditetapkan dalam Anggaran Dasar dan Anggaran Rumah Tangga KOPSSI.</p>

                                            <p>Sesuai dengan persyaratan yang telah ditetapkan, kami bersedia membayar:</p>
                                            <ol className="list-decimal ml-4 space-y-1">
                                                <li>Simpanan Pokok sebesar Rp. 200.000,00 (Dua ratus ribu rupiah) yang diangsur sebanyak 3 (tiga) kali/bulan.</li>
                                                <li>Simpanan Wajib sebesar Rp. 75.000,00 (tujuh puluh lima ribu rupiah) per bulan.</li>
                                            </ol>

                                            <p>Demikianlah permohonan ini saya buat dengan sebenarnya.</p>
                                        </div>
                                    </div>

                                    {/* Pas Foto & Password Step */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic flex items-center gap-2">
                                                <User size={14} className="text-blue-500" /> Pas Foto 3x4 *
                                            </p>
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setPhotoFile(e.target.files[0])}
                                                    className="hidden"
                                                    id="photo-upload"
                                                />
                                                <label
                                                    htmlFor="photo-upload"
                                                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 hover:bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50 cursor-pointer transition-all duration-300 overflow-hidden relative"
                                                >
                                                    {photoFile ? (
                                                        <div className="relative w-full h-full group">
                                                            <img
                                                                src={URL.createObjectURL(photoFile)}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                alt="Preview"
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <p className="text-white font-black text-[10px] uppercase tracking-widest italic">Klik untuk ganti</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center transform transition-transform duration-300 group-hover:-translate-y-1">
                                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 text-gray-400 group-hover:text-blue-500 group-hover:shadow-blue-100 transition-all border border-gray-100 group-hover:border-blue-100">
                                                                <User size={24} />
                                                            </div>
                                                            <p className="text-[10px] font-bold text-gray-500 group-hover:text-blue-700 transition-colors">Upload Pas Foto</p>
                                                            <p className="text-[8px] font-medium text-gray-300 uppercase tracking-tight mt-1">Format: JPG, PNG</p>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic flex items-center gap-2">
                                                <Edit3 size={14} className="text-blue-500" /> Atur Password Baru *
                                            </p>
                                            <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl h-40 flex flex-col justify-center">
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Minimal 6 karakter"
                                                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold italic"
                                                />
                                                <p className="text-[9px] text-blue-400 font-bold mt-3 italic">* Password ini akan digunakan untuk login setelah akun aktif.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic flex items-center gap-2">
                                                <Edit3 size={14} className="text-blue-500" /> Tanda Tangan Digital *
                                            </p>
                                            {signature && (
                                                <button onClick={clearSignature} className="px-3 py-1 bg-red-50 text-[10px] font-black uppercase text-red-500 hover:bg-red-100 rounded-lg transition-all border border-red-100 flex items-center gap-1">
                                                    <X size={12} /> Hapus
                                                </button>
                                            )}
                                        </div>
                                        <div className="border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 overflow-hidden relative group hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300">
                                            <canvas
                                                ref={canvasRef}
                                                onMouseDown={startDraw}
                                                onMouseMove={draw}
                                                onMouseUp={endDraw}
                                                onMouseLeave={endDraw}
                                                onTouchStart={startDraw}
                                                onTouchMove={draw}
                                                onTouchEnd={endDraw}
                                                className="w-full cursor-crosshair bg-white/80"
                                            />
                                            {!signature && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-all transform group-hover:scale-110 duration-500">
                                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2 border border-blue-100">
                                                        <Edit3 size={32} className="text-blue-600" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Gambar di sini</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            onClick={() => setMember(null)}
                                            className="px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-400 hover:text-gray-900 transition-all border border-gray-100 hover:bg-gray-50"
                                        >
                                            Kembali
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || !signature || !photoFile}
                                            className="flex-1 bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" /> : 'Kirim Verifikasi'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MembershipCheckModal;
