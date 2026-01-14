
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    ShoppingBag,
    Printer,
    PenTool,
    Coffee,
    Fan,
    CreditCard,
    Bike,
    Shirt,
    Wrench,
    Truck,
    Car,
    ParkingCircle,
    Banknote
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const trading = [
    { name: "Barang Cetakan (Formulir)", icon: <Printer size={20} /> },
    { name: "Barang ATK", icon: <PenTool size={20} /> },
    { name: "Barang Non ATK (Dapur)", icon: <Coffee size={20} /> },
    { name: "AC & Spareparts", icon: <Fan size={20} /> },
    { name: "ID Card & Visitor Card", icon: <CreditCard size={20} /> },
    { name: "Sepeda & Aksesoris", icon: <Bike size={20} /> },
    { name: "Seragam Pegawai", icon: <Shirt size={20} /> },
];

const services = [
    { name: "Service AC Gedung", icon: <Wrench size={20} /> },
    { name: "Kargo (Pengiriman Barang)", icon: <Truck size={20} /> },
    { name: "Sewa Kendaraan Bermotor", icon: <Car size={20} /> },
    { name: "Penitipan Kendaraan (Parkir)", icon: <ParkingCircle size={20} /> },
];

const financial = [
    { name: "Simpanan", icon: <Banknote size={20} /> },
    { name: "Pinjaman", icon: <Banknote size={20} /> },
];

const Business = () => {
    const comp = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Animate Cards
            gsap.from(".biz-card", {
                scrollTrigger: {
                    trigger: ".biz-grid",
                    start: "top 85%",
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out",
                clearProps: "opacity"
            });
        }, comp);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={comp} className="py-24 bg-white font-sans">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mb-4 tracking-wide border border-blue-200">
                        LAYANAN KAMI
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900">
                        Unit <span className="text-blue-900">Usaha & Produk</span>
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
                        Kami menyediakan berbagai layanan dan produk berkualitas untuk memenuhi kebutuhan operasional perusahaan dan kesejahteraan anggota.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-12 biz-grid">

                    {/* Column 1: Perdagangan */}
                    <div className="biz-card bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
                        <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="text-white w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 group-hover:text-blue-800 transition-colors">Perdagangan</h3>
                        <ul className="space-y-4">
                            {trading.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 text-slate-600 group-hover:text-slate-700 transition-colors bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                    <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                        {item.icon}
                                    </div>
                                    <span className="font-medium">{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2: Jasa */}
                    <div className="biz-card bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
                        <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-700/20 group-hover:scale-110 transition-transform">
                            <Wrench className="text-white w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 group-hover:text-blue-800 transition-colors">Jasa</h3>
                        <ul className="space-y-4">
                            {services.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 text-slate-600 group-hover:text-slate-700 transition-colors bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                    <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                        {item.icon}
                                    </div>
                                    <span className="font-medium">{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2: Keuangan */}
                    <div className="biz-card bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
                        <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-700/20 group-hover:scale-110 transition-transform">
                            <Wrench className="text-white w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 group-hover:text-blue-800 transition-colors">Keuangan</h3>
                        <ul className="space-y-4">
                            {financial.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4 text-slate-600 group-hover:text-slate-700 transition-colors bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                    <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                        {item.icon}
                                    </div>
                                    <span className="font-medium">{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Business;
