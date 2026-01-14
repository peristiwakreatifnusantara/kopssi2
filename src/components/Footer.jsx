
import React from 'react';
import { Phone, Mail, MapPin, Instagram, Globe, ExternalLink } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 py-16 font-sans">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Logo & Title */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center shrink-0">
                                <img src="/Kopsi.jpg" alt="KOPSSI Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white leading-tight">
                                    Koperasi Konsumen <br />
                                    <span className="text-blue-500">Swadharma Sarana Informatika</span>
                                </h3>
                                <div className="text-sm text-gray-400 font-semibold tracking-wider mt-1">(KOPSSI)</div>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                            Memberikan kesejahteraan anggotanya melalui pengelolaan yang profesional, transparan, dan penuh kehati-hatian.
                        </p>
                    </div>

                    {/* Middle Column: Pusat Address */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <MapPin className="text-blue-500" size={20} />
                            Kantor Pusat
                        </h4>
                        <div className="space-y-4 text-sm">
                            <p className="leading-relaxed">
                                <strong className="block text-gray-100 mb-1">Bellagio Office Park Unit OUG 31- 32</strong>
                                Jl. Mega Kuningan Barat Kav. E4-3 <br />
                                Kawasan Mega Kuningan, Setia Budi <br />
                                Jakarta Selatan 12950
                            </p>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-gray-500" />
                                <span>(62-21) 30066109 - 112</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-gray-500" />
                                <a href="mailto:info@koperasissi.com" className="hover:text-emerald-400 transition-colors">info@koperasissi.com</a>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Operasional Address */}
                    <div className="lg:col-span-3 space-y-6">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <MapPin className="text-blue-500" size={20} />
                            Kantor Operasional
                        </h4>
                        <div className="space-y-4 text-sm">
                            <p className="leading-relaxed">
                                <strong className="block text-gray-100 mb-1">Jl, Tarumanegara No. 3A</strong>
                                Jatiranggon, Jati Sampurna <br />
                                Bekasi 17432, Jawa Barat
                            </p>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-gray-500" />
                                <span>(62-21) 28671069</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-gray-500" />
                                <a href="mailto:info@koperasissi.com" className="hover:text-blue-400 transition-colors">info@koperasissi.com</a>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Links & Social */}
                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-lg font-bold text-white">Connect</h4>
                        <ul className="space-y-4 text-sm">
                            <li>
                                <a href="https://www.koperasissi.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-blue-400 transition-colors group">
                                    <Globe size={18} className="text-gray-500 group-hover:text-blue-500" />
                                    www.koperasissi.com
                                </a>
                            </li>
                            <li>
                                <a href="https://instagram.com/koperasipegawaissi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-blue-400 transition-colors group">
                                    <Instagram size={18} className="text-gray-500 group-hover:text-blue-500" />
                                    koperasipegawaissi
                                </a>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} KOPSSI. All rights reserved.</p>

                    <a
                        href="https://portofolio-pi-peach.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-white transition-colors px-4 py-2 bg-gray-800/50 rounded-full hover:bg-gray-800"
                    >
                        <span>Developer by <span className="text-emerald-500 font-semibold"></span></span>
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
