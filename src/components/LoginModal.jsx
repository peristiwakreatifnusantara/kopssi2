import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { supabase } from '../lib/supabaseClient';
import { Phone, Lock, X, ArrowRight } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin, onRegisterClick }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const formRef = useRef(null);

    const [npp, setNpp] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useLayoutEffect(() => {
        if (isOpen) {
            gsap.to(modalRef.current, {
                opacity: 1,
                pointerEvents: 'auto',
                duration: 0.3
            });

            const tl = gsap.timeline();
            tl.fromTo(
                contentRef.current,
                { scale: 0.95, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.2)' }
            )
                .fromTo(
                    formRef.current.children,
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
                    "-=0.3"
                );

        } else {
            gsap.to(modalRef.current, {
                opacity: 0,
                pointerEvents: 'none',
                duration: 0.2
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 🔍 CEK USER
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, no_npp, role')
                .eq('no_npp', npp)
                .eq('password', password)
                .single();

            if (userError || !userData) {
                throw new Error('NPP atau password salah');
            }

            // ================= ADMIN =================
            if (userData.role === 'ADMIN') {
                const { data: personalData } = await supabase
                    .from('personal_data')
                    .select('full_name')
                    .eq('user_id', userData.id)
                    .single();

                const adminPayload = {
                    id: userData.id,
                    no_npp: userData.no_npp,
                    role: 'ADMIN',
                    name: personalData?.full_name || 'Administrator'
                };

                localStorage.setItem('auth_user', JSON.stringify(adminPayload));
                onLogin(adminPayload);
                setLoading(false);
                onClose();
                return;
            }

            // ================= MEMBER =================
            if (userData.role === 'MEMBER') {
                const { data: personalData, error: personalError } = await supabase
                    .from('personal_data')
                    .select('full_name, status')
                    .eq('user_id', userData.id)
                    .single();

                if (personalError || !personalData) {
                    throw new Error('Data personal tidak ditemukan');
                }

                const status = personalData.status?.toLowerCase();
                if (!['active', 'approved'].includes(status)) {
                    throw new Error('Akun Anda belum aktif / belum disetujui');
                }

                const memberPayload = {
                    id: userData.id,
                    no_npp: userData.no_npp,
                    role: 'MEMBER',
                    name: personalData.full_name
                };

                localStorage.setItem('auth_user', JSON.stringify(memberPayload));
                onLogin(memberPayload);
                setLoading(false);
                onClose();
            }
        } catch (error) {
            setLoading(false);
            alert(error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm opacity-0 pointer-events-none p-4"
        >
            <div
                ref={contentRef}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header Section */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 pt-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 text-center">
                        <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4 backdrop-blur-md border border-white/20 shadow-lg">
                            <img src="/Logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1">Selamat Datang Kembali</h2>
                        <p className="text-slate-300 text-sm">Silakan masuk menggunakan NPP Anda</p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Nomor NPP</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={npp}
                                    onChange={(e) => setNpp(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="Contoh: J"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Masuk Sekarang <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Belum menjadi anggota?{' '}
                            <button
                                onClick={() => {
                                    onClose();
                                    onRegisterClick();
                                }}
                                className="text-emerald-600 font-bold hover:underline"
                            >
                                Daftar disini
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
