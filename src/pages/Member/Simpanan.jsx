import React, { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SimpananCard = ({ title, amount, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm font-medium mb-2">{title}</p>
        <h3 className={`text-2xl font-bold ${color === 'green' ? 'text-emerald-600' : 'text-gray-900'}`}>{amount}</h3>
    </div>
);

const Simpanan = () => {
    const [history, setHistory] = useState([]);
    const [bills, setBills] = useState([]);
    const [pokok, setPokok] = useState(0);
    const [wajib, setWajib] = useState(0);
    const [totalSaldo, setTotalSaldo] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            console.log("Simpanan: Fetching started...");
            try {
                // Cek Auth via Supabase
                const { data: { user } } = await supabase.auth.getUser();
                console.log("Simpanan: Supabase User ->", user);

                // Cek Auth via LocalStorage (fallback)
                const storedUser = localStorage.getItem('auth_user');
                console.log("Simpanan: LocalStorage User ->", storedUser);

                let userId = user?.id;

                if (!userId && storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        userId = parsedUser.id;
                        console.log("Simpanan: Using ID from LocalStorage ->", userId);
                    } catch (e) {
                        console.error("Simpanan: Error parsing local storage user", e);
                    }
                }

                if (!userId) {
                    console.warn("Simpanan: No user ID found. Aborting.");
                    setLoading(false);
                    return;
                }

                const { data: personalData } = await supabase
                    .from('personal_data')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                console.log("Simpanan: Personal Data ->", personalData);

                if (!personalData) {
                    setLoading(false);
                    return;
                }

                // Fetch Transactions
                const { data: simpananData } = await supabase
                    .from('simpanan')
                    .select('*')
                    .eq('personal_data_id', personalData.id)
                    .order('created_at', { ascending: false });

                // Separate UNPAID bills from PAID transactions
                const unpaidBills = [];
                const paidTransactions = [];

                (simpananData || []).forEach(item => {
                    if (item.status === 'UNPAID' && item.bulan_ke) {
                        unpaidBills.push(item);
                    } else if (item.status === 'PAID') {
                        paidTransactions.push(item);
                    }
                });

                // Group unpaid bills by bulan_ke
                const groupedBills = {};
                unpaidBills.forEach(item => {
                    const key = item.bulan_ke;
                    if (!groupedBills[key]) {
                        groupedBills[key] = {
                            id: `bill_${key}`,
                            bulan_ke: item.bulan_ke,
                            jatuh_tempo: item.jatuh_tempo,
                            amount_pokok: 0,
                            amount_wajib: 0,
                            status: 'UNPAID' // Explicitly set status for grouped bills
                        };
                    }
                    if (item.type === 'POKOK') {
                        groupedBills[key].amount_pokok = parseFloat(item.amount || 0);
                    }
                    if (item.type === 'WAJIB') {
                        groupedBills[key].amount_wajib = parseFloat(item.amount || 0);
                    }
                });

                setBills(Object.values(groupedBills).sort((a, b) => a.bulan_ke - b.bulan_ke));

                if ((paidTransactions.length > 0) || (unpaidBills.length > 0)) {
                    setHasData(true);

                    if (paidTransactions.length > 0) {
                        let totalP = 0;
                        let totalW = 0;
                        let currentBalance = 0;

                        const sortedForCalc = [...paidTransactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                        sortedForCalc.forEach(item => {
                            const amount = parseFloat(item.amount);
                            if (item.transaction_type === 'SETOR') {
                                currentBalance += amount;
                                if (item.type === 'POKOK') totalP += amount;
                                if (item.type === 'WAJIB') totalW += amount;
                            } else if (item.transaction_type === 'TARIK') {
                                currentBalance -= amount;
                                if (item.type === 'POKOK') totalP -= amount;
                                if (item.type === 'WAJIB') totalW -= amount;
                            }
                            item.balanceSnapshot = currentBalance;
                        });

                        const displayList = sortedForCalc.reverse().map(item => ({
                            id: item.id,
                            date: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                            type: `Simpanan ${item.type.charAt(0) + item.type.slice(1).toLowerCase()}`,
                            nominal: parseFloat(item.amount),
                            status: item.transaction_type === 'SETOR' ? 'Setor' : 'Tarik',
                            balance: item.balanceSnapshot
                        }));

                        setPokok(totalP);
                        setWajib(totalW);
                        setTotalSaldo(currentBalance);
                        setHistory(displayList);
                    }
                } else {
                    setHasData(false);
                }

            } catch (error) {
                console.error("Error fetching simpanan:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    if (loading) return <div>Loading...</div>;

    if (!hasData) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-gray-800">Simpanan Tidak ada</h3>
                <p className="text-gray-500 mt-2">Anda belum memiliki riwayat simpanan.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <SimpananCard title="Simpanan Pokok" amount={formatCurrency(pokok)} />
                <SimpananCard title="Simpanan Wajib" amount={formatCurrency(wajib)} />

                <SimpananCard title="Total Saldo" amount={formatCurrency(totalSaldo)} color="green" />
            </div>

            {/* Tagihan / Kewajiban Section */}
            {bills.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-amber-50/30">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg uppercase italic tracking-tighter">Tagihan & Kewajiban</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Iuran Wajib & Pokok Berjalan</p>
                        </div>
                        <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-tighter border border-amber-200 shadow-sm">
                            {bills.filter(b => b.status !== 'PAID').length} Tagihan Belum Lunas
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left bg-white">
                            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-black">Bulan Ke</th>
                                    <th className="px-6 py-4 font-black">Jatuh Tempo</th>
                                    <th className="px-6 py-4 font-black text-right">Simp. Pokok</th>
                                    <th className="px-6 py-4 font-black text-right">Simp. Wajib</th>
                                    <th className="px-6 py-4 font-black text-right">Total Tagihan</th>
                                    <th className="px-6 py-4 font-black text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {bills.map((bill) => {
                                    const totalBill = parseFloat(bill.amount_pokok || 0) + parseFloat(bill.amount_wajib || 0);
                                    return (
                                        <tr key={bill.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 text-center w-24">
                                                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 shadow-inner group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">#{bill.bulan_ke}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-xs font-bold">
                                                {new Date(bill.jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 font-mono">
                                                {formatCurrency(bill.amount_pokok)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-medium text-gray-500 font-mono">
                                                {formatCurrency(bill.amount_wajib)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-gray-800 font-mono">
                                                    {formatCurrency(totalBill)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${bill.status === 'PAID'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {bill.status === 'PAID' ? 'Lunas' : 'Belum Bayar'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center text-left">
                    <h3 className="font-bold text-gray-800 text-lg uppercase italic tracking-tighter">Riwayat Transaksi</h3>
                    <button className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm">Download Laporan</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-black text-left">Tanggal</th>
                                <th className="px-6 py-4 font-black">Jenis Simpanan</th>
                                <th className="px-6 py-4 font-black">Transaksi</th>
                                <th className="px-6 py-4 font-black text-right">Nominal</th>
                                <th className="px-6 py-4 font-black text-right">Saldo Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors italic group">
                                    <td className="px-6 py-4 text-gray-500 text-xs font-bold">{item.date}</td>
                                    <td className="px-6 py-4 text-gray-700 text-xs font-black uppercase tracking-tight">{item.type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm ${item.status === 'Setor' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                            {item.status === 'Setor' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right text-sm font-black font-mono ${item.status === 'Setor' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {item.status === 'Setor' ? '+' : '-'} {formatCurrency(item.nominal)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-black text-gray-800 font-mono group-hover:text-emerald-700 transition-colors">{formatCurrency(item.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-2">Informasi Bunga</h4>
                <p className="text-gray-600 text-sm">Anda mendapatkan bunga simpanan sebesar <span className="font-bold">4% per tahun</span> untuk Simpanan Sukarela. Bunga dihitung berdasarkan saldo terendah setiap bulan dan dikreditkan pada akhir bulan.</p>
            </div>
        </div>
    );
};

export default Simpanan;
