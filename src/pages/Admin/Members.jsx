import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, X, User, Phone, Briefcase, MapPin, CreditCard, Calendar, Plus, Upload, Loader2, CheckCircle2, AlertCircle, Trash2, UserMinus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';


const MemberDetailModal = ({ member, onClose, onDeactivate, onSetPassive }) => {
    if (!member) return null;

    const sections = [
        {
            title: 'Informasi Pribadi',
            icon: <User size={18} />,
            items: [
                { label: 'Nama Lengkap', value: member.full_name },
                { label: 'NIK', value: member.nik },
                { label: 'Nomor HP', value: member.phone },
                { label: 'NPP', value: member.no_npp || '-' },
            ]
        },
        {
            title: 'Pekerjaan',
            icon: <Briefcase size={18} />,
            items: [
                { label: 'Perusahaan', value: member.company || '-' },
                { label: 'Unit Kerja', value: member.work_unit || '-' },
                { label: 'Status Karyawan', value: member.employment_status || '-' },
            ]
        },
        {
            title: 'Alamat & Kontak Darurat',
            icon: <MapPin size={18} />,
            items: [
                { label: 'Alamat', value: member.address || '-' },
                { label: 'Kode Pos', value: member.postal_code || '-' },
                { label: 'Telepon Darurat', value: member.emergency_phone || '-' },
            ]
        },
        {
            title: 'Status & Administrasi',
            icon: <CreditCard size={18} />,
            items: [
                { label: 'Status Keanggotaan', value: member.status?.toUpperCase() || 'PENDING' },
                { label: 'Tanggal Daftar', value: new Date(member.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                            {member.full_name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{member.full_name}</h3>
                            <p className="text-sm text-gray-500">NPP: {member.no_npp || 'Belum diatur'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sections.map((section, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-blue-600">
                                    {section.icon}
                                    <h4 className="font-bold uppercase text-xs tracking-wider">{section.title}</h4>
                                </div>
                                <div className="space-y-3">
                                    {section.items.map((item, i) => (
                                        <div key={i}>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">{item.label}</p>
                                            <p className="text-sm text-gray-800 font-medium capitalize">{item.value?.toLowerCase() || '-'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50 text-blue-600">
                            <Calendar size={18} />
                            <h4 className="font-bold uppercase text-xs tracking-wider">Dokumen</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['ktp_file_path', 'id_card_file_path', 'photo_34_file_path'].map((field, i) => (
                                <div key={i} className="p-4 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{field.replace(/_/g, ' ')}</p>
                                    {member[field] ? (
                                        <img src={member[field]} alt={field} className="w-full h-24 object-cover rounded-md" />
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No Preview Available</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                    {(member.status?.toLowerCase() === 'active' || member.status?.toLowerCase() === 'verified' || !member.status) && (
                        <>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Apakah Anda yakin ingin MEMASIFKAN anggota ${member.full_name}?`)) {
                                        onSetPassive(member.id);
                                    }
                                }}
                                className="px-6 py-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-sm font-bold hover:bg-amber-100 transition-colors uppercase tracking-tight"
                            >
                                Pasifkan Anggota
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Apakah Anda yakin ingin MENONAKTIFKAN anggota ${member.full_name}?\n\nSeluruh simpanan akan dikembalikan dan pinjaman berjalan akan diperhitungkan.`)) {
                                        onDeactivate(member.id);
                                    }
                                }}
                                className="px-6 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm font-bold hover:bg-red-100 transition-colors uppercase tracking-tight"
                            >
                                Non-Aktifkan Anggota
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemberList = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('ALL');
    const [companies, setCompanies] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSetPassiveMember = async (memberId) => {
        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('personal_data')
                .update({ status: 'PASIF' })
                .eq('id', memberId);

            if (error) throw error;

            alert('Status anggota berhasil diubah menjadi PASIF!');
            setIsDetailModalOpen(false);
            fetchMembers();
        } catch (err) {
            console.error("Error setting member to passive:", err);
            alert("Gagal memasifkan anggota: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeactivateMember = async (memberId) => {
        try {
            setIsProcessing(true);
            const { error } = await supabase
                .from('personal_data')
                .update({
                    status: 'NON_ACTIVE',
                    keluar_anggota: 'Y',
                    tanggal_keluar: new Date().toISOString(),
                    sebab_keluar: 'NONAKTIFKAN OLEH ADMIN',
                    exit_realisasi_status: 'PENDING'
                })
                .eq('id', memberId);

            if (error) throw error;

            alert('Anggota berhasil dinonaktifkan! Silakan proses pengembalian dana di halaman Realisasi.');
            setIsDetailModalOpen(false);
            fetchMembers();
        } catch (err) {
            console.error("Error deactivating member:", err);
            alert("Gagal menonaktifkan anggota: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('master_data')
                .select('value')
                .eq('category', 'company')
                .order('value', { ascending: true });
            if (error) throw error;
            setCompanies(data?.map(c => c.value) || []);
        } catch (err) {
            console.error("Error fetching companies:", err);
        }
    };

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('personal_data')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error("Error fetching members:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
        fetchCompanies();
    }, []);



    const filteredMembers = members.filter(m => {
        const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.no_npp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.nik?.includes(searchTerm);

        const matchesCompany = filterCompany === 'ALL' || m.company === filterCompany;

        return matchesSearch && matchesCompany;
    });

    const handleRowClick = (member) => {
        setSelectedMember(member);
        setIsDetailModalOpen(true);
    };

    if (loading && members.length === 0) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Database Anggota</h2>
                    <p className="text-sm text-gray-500 font-medium">Manajemen data seluruh anggota koperasi</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari anggota..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 text-sm font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                                className="pl-9 pr-10 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[11px] font-black uppercase tracking-tight italic appearance-none"
                            >
                                <option value="ALL">SEMUA PERUSAHAAN</option>
                                {companies.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100 italic">
                            <tr>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">NPP</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">Nama Lengkap</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">NIK</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">Perusahaan</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest">Status</th>
                                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-400 tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => (
                                    <tr
                                        key={member.id}
                                        onClick={() => handleRowClick(member)}
                                        className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 text-xs font-bold text-blue-600 font-mono tracking-tighter uppercase">{member.no_npp || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px] uppercase border border-blue-100 italic">
                                                    {member.full_name?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 text-sm uppercase italic tracking-tight">{member.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] font-bold font-mono text-gray-400">{member.nik}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-600 uppercase italic tracking-tight overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">{member.company || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-all ${member.status?.toLowerCase() === 'active' || member.status?.toLowerCase() === 'verified'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : member.status?.toLowerCase() === 'pasif'
                                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    : member.status?.toLowerCase() === 'nonaktif' || member.status?.toLowerCase() === 'non_active'
                                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                                        : member.status?.toLowerCase() === 'rejected'
                                                            ? 'bg-red-50 text-red-600'
                                                            : member.status?.toLowerCase() === 'done verifikasi'
                                                                ? 'bg-blue-50 text-blue-600'
                                                                : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {member.status?.toLowerCase() === 'pending' || !member.status
                                                    ? 'BELUM TERVERIFIKASI'
                                                    : member.status?.toLowerCase() === 'non_active'
                                                        ? 'NON AKTIF'
                                                        : member.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRowClick(member);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-white border border-transparent hover:border-blue-100"
                                                    title="Detail Anggota"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                                {(member.status?.toLowerCase() === 'active' || member.status?.toLowerCase() === 'verified' || !member.status) && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Apakah Anda yakin ingin MEMASIFKAN anggota ${member.full_name}?`)) {
                                                                    handleSetPassiveMember(member.id);
                                                                }
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-amber-600 transition-colors rounded-full hover:bg-white border border-transparent hover:border-amber-100"
                                                            title="Pasifkan Anggota"
                                                        >
                                                            <UserMinus size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Apakah Anda yakin ingin MENONAKTIFKAN anggota ${member.full_name}?`)) {
                                                                    handleDeactivateMember(member.id);
                                                                }
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-white border border-transparent hover:border-red-100"
                                                            title="Non-Aktifkan Anggota"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Search size={48} />
                                            <p className="font-black uppercase tracking-widest text-xs italic">Data anggota tidak ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                    <p>Total {filteredMembers.length} Anggota Terdaftar</p>
                </div>
            </div>



            {isDetailModalOpen && (
                <MemberDetailModal
                    member={selectedMember}
                    onClose={() => setIsDetailModalOpen(false)}
                    onDeactivate={handleDeactivateMember}
                    onSetPassive={handleSetPassiveMember}
                />
            )}
            {isProcessing && (
                <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            )}
        </div>
    );
};

export default MemberList;
