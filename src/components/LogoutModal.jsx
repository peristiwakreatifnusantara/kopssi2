import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { LogOut, AlertTriangle } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    const modalRef = useRef(null);
    const contentRef = useRef(null);

    useLayoutEffect(() => {
        if (isOpen) {
            gsap.to(modalRef.current, {
                duration: 0.1,
                pointerEvents: 'auto',
                opacity: 1
            });
            gsap.fromTo(contentRef.current,
                { scale: 0.8, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.7)" }
            );
        } else {
            gsap.to(contentRef.current, {
                scale: 0.8,
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    gsap.to(modalRef.current, {
                        opacity: 0,
                        duration: 0.2,
                        pointerEvents: 'none'
                    });
                }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 opacity-0 pointer-events-none backdrop-blur-sm"
        >
            <div
                ref={contentRef}
                className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl relative text-center"
            >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <LogOut size={32} />
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Logout</h2>
                <p className="text-gray-500 mb-8">Apakah Anda yakin ingin keluar dari aplikasi?</p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                    >
                        Ya, Keluar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
