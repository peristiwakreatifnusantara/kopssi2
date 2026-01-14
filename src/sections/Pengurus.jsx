
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserCircle2, User } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const teamMembers = [
    { name: "Liza Saraswati", role: "KETUA" },
    { name: "Dhany Iskandar", role: "SEKRETARIS" },
    { name: "Lukman", role: "BENDAHARA" },
];

const Pengurus = () => {
    const comp = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            gsap.from(".member-card", {
                scrollTrigger: {
                    trigger: ".member-grid",
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
        <section ref={comp} className="py-20 bg-white">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-3 text-gray-900">
                        <span className="text-emerald-600 border-b-4 border-emerald-600 pb-1">PENGURUS</span>
                    </h2>
                    <p className="text-gray-500 mt-4">The dedicated leadership team.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 member-grid">
                    {teamMembers.map((member, idx) => (
                        <div key={idx} className="member-card group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

                            <div className="w-20 h-20 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                <UserCircle2 size={40} strokeWidth={1.5} />
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                                {member.name}
                            </h3>
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full tracking-wider group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                {member.role}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pengurus;
