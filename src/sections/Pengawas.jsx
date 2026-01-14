
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserCheck, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const teamMembers = [
    { name: "Heni Sukma Nugraha", role: "KETUA" },
    { name: "Erwin Fathurohman", role: "ANGGOTA" },
    { name: "Hasan", role: "ANGGOTA" },
];

const Pengawas = () => {
    const comp = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from(".supervisor-card", {
                scrollTrigger: {
                    trigger: ".supervisor-grid",
                    start: "top 85%",
                },
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.15,
                ease: "power2.out",
                clearProps: "opacity"
            });
        }, comp);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={comp} className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-3 text-gray-900">
                        <span className="text-blue-600 border-b-4 border-blue-600 pb-1">PENGAWAS</span>
                    </h2>
                    <p className="text-gray-500 mt-4">Ensuring integrity and trust.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 supervisor-grid">
                    {teamMembers.map((member, idx) => (
                        <div key={idx} className="supervisor-card group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>

                            <div className="w-20 h-20 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <ShieldCheck size={40} strokeWidth={1.5} />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                {member.name}
                            </h3>
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full tracking-wider group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                {member.role}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pengawas;
