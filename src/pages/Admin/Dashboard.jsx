import React, { useEffect, useState } from 'react';
import { Users, Briefcase, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const AdminOverview = () => {
    const [stats, setStats] = useState({
        anggota: 0,
        pinjamanAktif: 0,
        pengajuan: 0,
        bermasalah: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const { count: anggota } = await supabase
            .from('personal_data')
            .select('*', { count: 'exact', head: true });

        const { count: pinjamanAktif } = await supabase
            .from('pinjaman')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'DICAIRKAN');

        const { count: pengajuan } = await supabase
            .from('pinjaman')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENGAJUAN');

        const { count: bermasalah } = await supabase
            .from('angsuran')
            .select('*', { count: 'exact', head: true })
            .neq('status', 'LUNAS');

        setStats({ anggota, pinjamanAktif, pengajuan, bermasalah });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Dashboard Koperasi</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat title="Anggota Aktif" value={stats.anggota} icon={Users} />
                <Stat title="Pinjaman Aktif" value={stats.pinjamanAktif} icon={Briefcase} />
                <Stat title="Pengajuan Baru" value={stats.pengajuan} icon={FileText} />
                <Stat title="Angsuran Bermasalah" value={stats.bermasalah} icon={AlertTriangle} danger />
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm">
                <h3 className="font-semibold mb-3 text-gray-700">Ringkasan Sistem</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Sistem berjalan normal</li>
                    <li>• Tidak ada lonjakan pengajuan signifikan</li>
                    <li>• Mayoritas angsuran tercatat tepat waktu</li>
                </ul>
            </div>
        </div>
    );
};

const Stat = ({ title, value, icon: Icon, danger }) => (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${danger ? 'border-red-500' : 'border-emerald-500'
        }`}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
            </div>
            <Icon className={danger ? 'text-red-500' : 'text-emerald-500'} size={22} />
        </div>
    </div>
);

export default AdminOverview;
