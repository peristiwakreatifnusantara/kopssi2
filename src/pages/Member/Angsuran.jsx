import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Angsuran = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let userId = null;
                const storedUser = localStorage.getItem('auth_user');

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser && parsedUser.id) {
                        userId = parsedUser.id;
                    }
                }

                if (!userId) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) userId = user.id;
                }

                if (!userId) {
                    setLoading(false);
                    return;
                }

                const { data: personalData } = await supabase
                    .from('personal_data')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                if (!personalData) {
                    setLoading(false);
                    return;
                }

                // Fetch All Active Loans (DICAIRKAN)
                const { data: loans } = await supabase
                    .from('pinjaman')
                    .select('*')
                    .eq('personal_data_id', personalData.id)
                    .eq('status', 'DICAIRKAN');

                if (loans && loans.length > 0) {
                    const loanIds = loans.map(l => l.id);

                    // Fetch all installments for these loans
                    const { data: installments } = await supabase
                        .from('angsuran')
                        .select('*')
                        .in('pinjaman_id', loanIds)
                        .order('tanggal_bayar', { ascending: true });

                    if (installments && installments.length > 0) {
                        const consolidatedSchedule = installments.map(item => {
                            const loan = loans.find(l => l.id === item.pinjaman_id);
                            const totalAmount = parseFloat(item.amount);
                            const principal = parseFloat(loan?.jumlah_pinjaman || 0);
                            const tenor = loan?.tenor_bulan || 1;

                            // Calculate flat interest based on loan settings
                            let monthlyInterest = 0;
                            if (loan?.tipe_bunga === 'PERSENAN') {
                                const annualRate = parseFloat(loan.nilai_bunga || 0);
                                monthlyInterest = (principal * (annualRate / 100)) / 12;
                            } else if (loan?.tipe_bunga === 'NOMINAL') {
                                monthlyInterest = parseFloat(loan.nilai_bunga || 0) / tenor;
                            }

                            const monthlyPrincipal = totalAmount - monthlyInterest;

                            return {
                                id: item.id,
                                loanNo: loan?.no_pinjaman || '-',
                                month: item.bulan_ke,
                                date: new Date(item.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                                rawDate: new Date(item.tanggal_bayar),
                                pokok: monthlyPrincipal,
                                bunga: monthlyInterest,
                                total: totalAmount,
                                status: item.status || 'UNPAID'
                            };
                        });

                        // Sort by date then loan number
                        consolidatedSchedule.sort((a, b) => a.rawDate - b.rawDate);

                        setSchedule(consolidatedSchedule);
                        setHasData(true);
                    } else {
                        setHasData(false);
                    }
                } else {
                    setHasData(false);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
    );

    if (!hasData) {
        return (
            <div className="p-12 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-800 uppercase italic">Tidak Ada Tagihan</h3>
                <p className="text-gray-500 mt-2 text-sm font-medium">Seluruh kewajiban telah terpenuhi atau belum ada pinjaman aktif.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left">
                <div className="px-6 py-5 border-b border-gray-100 text-left bg-emerald-50/50">
                    <h3 className="font-bold text-gray-800 text-lg uppercase italic tracking-tighter">Seluruh Daftar Angsuran</h3>
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest text-[10px]">Data angsuran yang sedang berjalan</p>
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-black">Pinjaman</th>
                                <th className="px-6 py-4 font-black text-center">Bulan</th>
                                <th className="px-6 py-4 font-black">Jatuh Tempo</th>
                                <th className="px-6 py-4 font-black text-right">Pokok</th>
                                <th className="px-6 py-4 font-black text-right">Margin / Bunga</th>
                                <th className="px-6 py-4 font-black text-right">Total Tagihan</th>
                                <th className="px-6 py-4 font-black text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {schedule.map((item) => (
                                <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-xs font-black text-gray-700 font-mono italic">{item.loanNo}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-bold text-gray-400"># {item.month}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs font-bold">{item.date}</td>
                                    <td className="px-6 py-4 text-gray-600 text-xs font-medium text-right font-mono">
                                        {item.pokok.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-xs font-medium text-right font-mono">
                                        {item.bunga.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-emerald-700 font-mono italic">
                                            Rp {item.total.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-left">
                                        {item.status === 'PAID' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-tighter shadow-sm border border-emerald-200">
                                                <CheckCircle size={10} /> TERBAYAR
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 uppercase tracking-tighter shadow-sm border border-amber-200">
                                                <Clock size={10} /> OUTSTANDING
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-50 text-left">
                    {schedule.map((item) => (
                        <div key={item.id} className="p-4 space-y-3 active:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-900 font-mono uppercase italic tracking-tighter">{item.loanNo}</span>
                                        <span className="text-[9px] font-bold text-gray-400 font-mono"># Bulan {item.month}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{item.date}</p>
                                </div>
                                {item.status === 'PAID' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-tighter border border-emerald-200">
                                        TERBAYAR
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-amber-100 text-amber-700 uppercase tracking-tighter border border-amber-200">
                                        HARUS DIBAYAR
                                    </span>
                                )}
                            </div>

                            <div className="bg-gray-50/50 rounded-xl p-3 flex justify-between items-center text-left">
                                <div>
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Total Tagihan</label>
                                    <span className="text-sm font-black text-emerald-700 italic">
                                        Rp {item.total.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-bold text-gray-400">P {item.pokok.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                    <p className="text-[8px] font-bold text-gray-400">B {item.bunga.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Angsuran;
