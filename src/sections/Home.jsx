
import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Wallet, CreditCard, Users, ArrowRight, ShieldCheck } from 'lucide-react';

const Home = () => {
  const comp = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(".grid-bg", { opacity: 0, duration: 1.5 })
        .from(".hero-content-left > *", {
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          clearProps: "opacity"
        }, "-=1")
        .from(".hero-card", {
          x: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.7)",
          clearProps: "opacity"
        }, "-=0.5");

    }, comp);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={comp} className="relative min-h-screen flex items-center bg-slate-50 overflow-hidden py-24">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 grid-bg pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(to right, #cbd5e1 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            opacity: 0.4
          }}
        ></div>
        {/* Navy Blob */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left Content: Text & History */}
          <div className="lg:w-1/2 hero-content-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mb-6 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Official Cooperative Partner
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
              Koperasi Konsumen <br />
              <span className="text-blue-900">Swadharma Sarana Informatika</span>
            </h1>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-l-4 border-blue-900 shadow-sm mb-8">
              <p className="text-slate-600 leading-relaxed italic">
                "KOPSSI Didirikan pada tanggal 20 september 2002 di Gedung Hanglekir Raya No 30 kel Gunung. Kebayoran Baru - Jakarta Selatan 12120. Di sahkan dengan nomor akte pendirian: <strong>295/BH/MENEG.I/VIII/2003</strong>. Dengan Jumlah anggota awal 33 (tiga puluh tiga) orang yang disebut sebagai pendiri Koperasi Pegawai PT SSI."
              </p>
            </div>

            <button className="group bg-slate-900 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-900/20 flex items-center gap-3">
              Jelajahi Sekarang
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </div>

          {/* Right Content: Feature Cards */}
          <div className="lg:w-1/2 w-full grid gap-6">

            {/* Simpanan Card */}
            <div className="hero-card bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hover:border-blue-200 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-700 group-hover:scale-110 transition-transform">
                  <Wallet size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Simpanan Anggota</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Pengelolaan dana simpanan yang profesional dan transparan bagi kesejahteraan seluruh anggota KOPSSI.
                  </p>
                </div>
              </div>
            </div>

            {/* Pinjaman Card */}
            <div className="hero-card bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hover:border-blue-200 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-700 group-hover:scale-110 transition-transform">
                  <CreditCard size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Fasilitas Pinjaman</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Solusi finansial yang fleksibel dan terjangkau untuk memenuhi berbagai kebutuhan anggota koperasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Jumlah Anggota Card */}
            <div className="hero-card bg-gradient-to-r from-slate-900 to-blue-900 p-8 rounded-2xl shadow-xl text-white transform hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-lg font-medium text-blue-100 mb-1">Total Anggota Aktif</h3>
                  <div className="text-4xl font-bold text-white mb-2">7,000+</div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <Users size={16} />
                    <span>Pegawai PT SSI</span>
                  </div>
                </div>
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-center border border-white/20">
                  <ShieldCheck size={40} className="text-white" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
