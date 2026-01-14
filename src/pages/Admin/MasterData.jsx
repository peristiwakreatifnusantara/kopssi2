import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Building2, Briefcase, MapPin, Search, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const MasterData = () => {
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(false);
    const [masterData, setMasterData] = useState([]);
    const [newValue, setNewValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'company', label: 'Perusahaan/PT', icon: <Building2 size={18} /> },
        { id: 'work_unit', label: 'Unit Kerja', icon: <Briefcase size={18} /> },
        { id: 'lokasi', label: 'Lokasi', icon: <MapPin size={18} /> },
        { id: 'loan_category', label: 'Kategori Pinjaman', icon: <FileText size={18} /> },
    ];

    useEffect(() => {
        fetchMasterData();
    }, [activeTab]);

    const fetchMasterData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('master_data')
                .select('*')
                .eq('category', activeTab)
                .order('value', { ascending: true });

            if (error) throw error;
            console.log(`Fetched master data for ${activeTab}:`, data);
            setMasterData(data || []);
        } catch (err) {
            console.error('Error fetching master data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newValue.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('master_data')
                .insert([{ category: activeTab, value: newValue.trim() }]);

            console.log(`Adding new ${activeTab}:`, newValue.trim());

            if (error) throw error;
            setNewValue('');
            fetchMasterData();
        } catch (err) {
            alert('Gagal menambah data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus data ini?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('master_data')
                .delete()
                .eq('id', id);

            console.log(`Deleting item with id: ${id} from ${activeTab}`);

            if (error) throw error;
            fetchMasterData();
        } catch (err) {
            alert('Gagal menghapus data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = masterData.filter(item =>
        item.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-emerald-500" />
                            Tambah {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 italic">
                                    Nama/Nilai Baru
                                </label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder={`Contoh: Unit`}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                Simpan Data
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari data..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
                                />
                            </div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">
                                Total: {filteredData.length}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Nilai / Nama</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && masterData.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center">
                                                <Loader2 className="animate-spin inline-block text-emerald-500" size={24} />
                                            </td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-gray-500 text-sm font-medium">
                                                Tidak ada data ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-bold text-gray-400">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{item.value}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterData;
