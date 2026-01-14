
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Clock,
    MapPin,
    ScrollText,
    Users,
    Shield,
    Award,
    UserCheck,
    Briefcase,
    TrendingUp,
    CheckCircle2,
    Building2,
    Users2
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const mainRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Animate Sections Title
            const titles = gsap.utils.toArray('.animate-title');
            titles.forEach((title) => {
                gsap.from(title, {
                    scrollTrigger: {
                        trigger: title,
                        start: "top 85%",
                    },
                    y: 30,
                    opacity: 0,
                    duration: 1,
                    ease: "power3.out"
                });
            });

            // Animate Standard Sections
            const sections = gsap.utils.toArray('.animate-section');
            sections.forEach((section) => {
                gsap.from(section, {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                    },
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    ease: "power3.out"
                });
            });

            // Principle Cards Stagger
            gsap.from(".principle-card", {
                scrollTrigger: {
                    trigger: ".principles-grid",
                    start: "top 85%",
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "back.out(1.7)"
            });

            // Advantage Items Stagger
            gsap.from(".advantage-item", {
                scrollTrigger: {
                    trigger: ".advantages-list",
                    start: "top 80%",
                },
                x: -30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "power2.out"
            });

            // Founder Cards
            gsap.from(".founder-card", {
                scrollTrigger: {
                    trigger: ".founders-grid",
                    start: "top 85%",
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2
            });

        }, mainRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={mainRef} className="bg-white overflow-hidden font-sans">

            {/* Hero / Intro Section */}
            <section className="py-24 px-4 bg-gradient-to-b from-slate-50 to-white animate-section relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-100 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3"></div>

                <div className="container mx-auto max-w-5xl relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mb-4 tracking-wide border border-blue-200">
                            PROFIL PERUSAHAAN
                        </span>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 leading-tight">
                            Tentang <span className="text-blue-900">KOPSSI</span>
                        </h2>
                        <div className="w-24 h-1 bg-blue-900 mx-auto rounded-full mb-8"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
                            <p>
                                <strong className="text-slate-900">Koperasi Konsumen Swadharma Sarana Informatika (KOPSSI)</strong> adalah badan hukum koperasi yang didirikan oleh dan untuk pegawai PT Swadharma Sarana Informatika. Kami berkomitmen menjadi pilar kesejahteraan ekonomi bagi seluruh anggota.
                            </p>
                            <p>
                                Dengan pengelolaan yang <span className="text-blue-700 font-semibold">profesional, transparan, dan akuntabel</span>, KOPSSI menghadirkan solusi keuangan yang solutif serta berbagai unit usaha yang mendukung kebutuhan sehari-hari anggota kami.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative">
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                                <Building2 className="text-blue-700 w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Visi Kami</h3>
                            <p className="text-slate-600 mb-6">
                                Menjadi koperasi karyawan terdepan yang terpercaya, mandiri, dan mampu memberikan kesejahteraan maksimal bagi anggota dan keluarganya.
                            </p>
                            <div className="flex items-center gap-4 text-sm font-semibold text-blue-800">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Terpercaya
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Mandiri
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Sejahtera
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="py-20 px-4 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="text-center mb-16 animate-title">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Nilai Inti</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Prinsip dasar yang menjadi landasan operasional kami untuk mencapai keunggulan layanan.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 principles-grid">
                        {/* Principle 1 */}
                        <div className="principle-card bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors group">
                            <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-800 transition-colors">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Profesional</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Dikelola oleh tim yang kompeten dengan standar manajemen modern untuk hasil terbaik.
                            </p>
                        </div>

                        {/* Principle 2 */}
                        <div className="principle-card bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors group">
                            <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-800 transition-colors">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Integritas</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Menjunjung tinggi kejujuran dan etika bisnis dalam setiap aktivitas operasional koperasi.
                            </p>
                        </div>

                        {/* Principle 3 */}
                        <div className="principle-card bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors group">
                            <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-800 transition-colors">
                                <Users2 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Kemitraan</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Membangun hubungan yang harmonis dan saling menguntungkan dengan anggota dan mitra.
                            </p>
                        </div>

                        {/* Principle 4 */}
                        <div className="principle-card bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors group">
                            <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-800 transition-colors">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Inovatif</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Terus berinovasi mengembangkan produk dan layanan sesuai perkembangan zaman.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Advantages Section */}
            <section className="py-24 px-4 bg-slate-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col lg:flex-row gap-16 items-start">
                        <div className="lg:w-1/3 animate-title sticky top-24">
                            <span className="text-blue-700 font-bold tracking-wider uppercase text-sm">Mengapa Kami?</span>
                            <h2 className="text-4xl font-extrabold text-slate-900 mt-2 mb-6">Keunggulan KOPSSI</h2>
                            <p className="text-slate-600 leading-relaxed mb-8">
                                Kami hadir untuk memberikan nilai tambah bagi setiap anggota melalui pengelolaan dana yang aman dan produktif.
                            </p>
                            <button className="px-6 py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
                                Bergabung Sekarang
                            </button>
                        </div>

                        <div className="lg:w-2/3 grid gap-8 advantages-list">
                            {/* Adv 1 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Shield size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Aman & Terpercaya</h4>
                                    <p className="text-slate-600">Berbadan hukum resmi dan dikelola secara transparan dengan pengawasan internal yang ketat.</p>
                                </div>
                            </div>

                            {/* Adv 2 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <TrendingUp size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Bunga & Bagi Hasil Kompetitif</h4>
                                    <p className="text-slate-600">Menawarkan imbal hasil simpanan yang menarik dan bunga pinjaman yang kompetitif untuk anggota.</p>
                                </div>
                            </div>

                            {/* Adv 3 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Dari Anggota Untuk Anggota</h4>
                                    <p className="text-slate-600">Keuntungan usaha (SHU) dikembalikan kepada anggota setiap tahunnya secara proporsional.</p>
                                </div>
                            </div>

                            {/* Adv 4 */}
                            <div className="advantage-item flex gap-5 bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                                <div className="mt-1">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Award size={20} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Kemudahan Akses</h4>
                                    <p className="text-slate-600">Layanan digital yang memudahkan anggota memantau simpanan dan mengajukan pinjaman kapan saja.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sejarah / History Section (Preserved) */}
            <section className="py-20 px-4 animate-section bg-white border-t border-slate-100">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2 relative">
                            {/* Decorative graphics */}
                            <div className="absolute -left-4 -top-4 w-24 h-24 bg-blue-100 rounded-full blur-2xl"></div>
                            <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100 z-10">
                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900">
                                    <Clock className="text-blue-700" />
                                    <span>Sejarah Pendirian</span>
                                </h3>
                                <ul className="space-y-4 text-slate-600">
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><ScrollText size={18} className="text-blue-600" /></div>
                                        <span>Didirikan pada tanggal 20 September 2002.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><MapPin size={18} className="text-blue-600" /></div>
                                        <span>Berlokasi di Gedung Hanglekir Raya No 30, Kel. Gunung, Kebayoran Baru, Jakarta Selatan 12120.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><Shield size={18} className="text-blue-600" /></div>
                                        <span>Disahkan dengan nomor akte pendirian: <strong>295/BH/MENEG.I/VIII/2003</strong>.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="mt-1 min-w-[20px]"><Users size={18} className="text-blue-600" /></div>
                                        <span>Jumlah anggota awal sebanyak 33 (tiga puluh tiga) orang pendiri.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="lg:w-1/2 space-y-6">
                            <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl">
                                <div className="p-3 bg-blue-800 rounded-lg text-white font-bold text-2xl">20+</div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">Tahun Pengalaman</h4>
                                    <p className="text-slate-600 mt-1">Berdedikasi dalam melayani dan mensejahterakan anggota sejak tahun 2002.</p>
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900">Fondasi Yang Kuat</h3>
                            <p className="text-slate-600 text-lg">
                                Koperasi Konsumen Swadharma Sarana Informatika (KOPSSI) terus tumbuh dengan memegang teguh amanah para pendirinya untuk memberikan manfaat sebesar-besarnya bagi kesejahteraan anggota dilingkungan PT SSI.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pengurus Awal (Founders) Section (Preserved) */}
            <section className="py-20 px-4 bg-slate-50 animate-section">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-slate-900 mb-4">Pengurus Awal</h3>
                        <p className="text-slate-600">Tokoh-tokoh yang meletakkan dasar berdirinya KOPSSI.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto founders-grid">

                        {/* Member Card */}
                        <div className="founder-card bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-blue-800 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-1">Kurtubi Asmar</h4>
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Ketua</span>
                        </div>

                        {/* Member Card */}
                        <div className="founder-card bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-blue-600 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-1">L. Bambang H.P</h4>
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">Sekretaris</span>
                        </div>

                        {/* Member Card */}
                        <div className="founder-card bg-white p-6 rounded-xl shadow-md text-center border-t-4 border-blue-800 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-slate-400">
                                <UserCheck size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-1">Amroni</h4>
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Bendahara</span>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
