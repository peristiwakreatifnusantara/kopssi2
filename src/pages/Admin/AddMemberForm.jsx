import React, { useState, useEffect } from 'react';
import { Loader2, User, Briefcase, MapPin, Phone, CreditCard, LogOut, Calendar, BadgeCheck, Building } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Icon size={18} />
        </div>
        <div>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
        </div>
    </div>
);

const InputGroup = ({ label, required, children, className = "" }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-xs font-bold text-gray-600 uppercase tracking-tight flex items-center gap-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const AddMemberForm = ({ onSave, isSubmitting }) => {
    // Initial state
    const [isTerminationOpen, setIsTerminationOpen] = useState(false);
    const [formData, setFormData] = useState({
        no_anggota: '',
        join_date: new Date().toISOString().split('T')[0],
        full_name: '',
        status_simp_anggota: 'AKTIF',
        no_npp: '',
        work_unit: '',
        jabatan: '',
        company: '',
        ops: '',
        lokasi: '',
        tagihan_parkir: 'N',
        tempat_lahir: '',
        tanggal_lahir: '',
        address: '',
        alamat_tinggal: '',
        no_ktp: '',
        telp_rumah_1: '',
        telp_rumah_2: '',
        email: '',
        hp_1: '',
        hp_2: '',
        rek_pribadi: '',
        rek_gaji: '',
        bank_gaji: 'BNI 46',
        jenis_kelamin: 'Laki-laki',
        last_update: new Date().toLocaleString(),
        keluar_anggota: 'N',
        tanggal_keluar: '',
        sebab_keluar: '',
        keterangan: ''
    });

    // Valid options (initial static, then fetched)
    const [options, setOptions] = useState({
        companies: [],
        units: [],
        positions: ['Staff', 'Supervisor', 'Manager', 'Director'],
        ops: ['Pilih Ops', 'OPS A', 'OPS B'],
        locations: [],
        banks: ['BNI 46', 'BCA', 'MANDIRI', 'BRI']
    });

    const fetchDropdowns = async () => {
        try {
            const { data, error } = await supabase
                .from('master_data')
                .select('category, value');

            if (error) throw error;

            if (data) {
                const grouped = data.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item.value);
                    return acc;
                }, {});

                setOptions(prev => ({
                    ...prev,
                    companies: grouped['company'] || [],
                    units: grouped['work_unit'] || [],
                    locations: grouped['lokasi'] || []
                }));
            }
        } catch (err) {
            console.error("Error fetching dropdown data:", err);
        }
    };

    useEffect(() => {
        fetchDropdowns();
    }, []);

    // Auto-generate No Anggota when join_date changes
    useEffect(() => {
        const generateNumber = async () => {
            if (!formData.join_date) return;
            const date = new Date(formData.join_date);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            const prefix = `KS${month}${year}`;

            try {
                const { data } = await supabase
                    .from('personal_data')
                    .select('no_anggota')
                    .ilike('no_anggota', `${prefix}%`)
                    .order('no_anggota', { ascending: false })
                    .limit(1);

                let sequence = '0001';
                if (data && data.length > 0 && data[0].no_anggota) {
                    const lastNo = data[0].no_anggota;
                    const lastSeqStr = lastNo.slice(-4);
                    const lastSeqNum = parseInt(lastSeqStr, 10);
                    if (!isNaN(lastSeqNum)) sequence = String(lastSeqNum + 1).padStart(4, '0');
                }
                setFormData(prev => ({ ...prev, no_anggota: `${prefix}${sequence}` }));
            } catch (err) {
                console.error("Error generating member number:", err);
            }
        };

        generateNumber();
    }, [formData.join_date]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-gray-400 hover:bg-white hover:border-gray-300";
    const selectClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer hover:bg-white hover:border-gray-300";

    return (
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

            {/* SECTION 1: IDENTITAS UTAMA */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                <SectionHeader icon={BadgeCheck} title="Identitas Keanggotaan" subtitle="Nomor anggota & status kepesertaan" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Nomor Anggota" required>
                        <div className="relative">
                            <input
                                name="no_anggota"
                                value={formData.no_anggota}
                                onChange={handleChange}
                                className={`${inputClasses} bg-emerald-50/50 border-emerald-200 text-emerald-700 font-bold font-mono`}
                                placeholder="Auto Generated"
                                readOnly
                            />
                            <div className="absolute right-3 top-2.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">AUTO</div>
                        </div>
                    </InputGroup>
                    <InputGroup label="Tanggal Masuk" required>
                        <input type="date" name="join_date" value={formData.join_date} onChange={handleChange} className={inputClasses} />
                    </InputGroup>
                </div>
            </div>

            {/* SECTION 2: DATA PRIBADI */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <SectionHeader icon={User} title="Data Pribadi" subtitle="Informasi lengkap personal anggota" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InputGroup label="Nama Lengkap" required className="md:col-span-2">
                        <input name="full_name" value={formData.full_name} onChange={handleChange} className={inputClasses} placeholder="Sesuai KTP" />
                    </InputGroup>
                    <InputGroup label="NIK (KTP)" required>
                        <input name="no_ktp" value={formData.no_ktp} onChange={handleChange} className={inputClasses} placeholder="16 Digit NIK" />
                    </InputGroup>
                    <InputGroup label="Jenis Kelamin">
                        <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className={selectClasses}>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </InputGroup>

                    <InputGroup label="Tempat Lahir">
                        <input name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} className={inputClasses} />
                    </InputGroup>
                    <InputGroup label="Tanggal Lahir">
                        <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} className={inputClasses} />
                    </InputGroup>
                    <InputGroup label="Alamat KTP" className="md:col-span-2">
                        <textarea name="address" value={formData.address} onChange={handleChange} className={inputClasses} rows={1} placeholder="Alamat lengkap..." />
                    </InputGroup>
                    <InputGroup label="Alamat Domisili" className="md:col-span-2 md:col-start-3">
                        <textarea name="alamat_tinggal" value={formData.alamat_tinggal} onChange={handleChange} className={inputClasses} rows={1} placeholder="Jika berbeda dengan KTP..." />
                    </InputGroup>
                </div>
            </div>

            {/* SECTION 3: PEKERJAAN */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <SectionHeader icon={Briefcase} title="Pekerjaan & Penempatan" subtitle="Detail unit kerja dan posisi" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputGroup label="NPP (Nomor Pegawai)">
                        <input name="no_npp" value={formData.no_npp} onChange={handleChange} className={inputClasses} placeholder="NPP Perusahaan" />
                    </InputGroup>
                    <InputGroup label="Perusahaan (PT)" required>
                        <select name="company" value={formData.company} onChange={handleChange} className={selectClasses}>
                            <option value="">Pilih Perusahaan</option>
                            {options.companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </InputGroup>
                    <InputGroup label="Unit Kerja">
                        <select name="work_unit" value={formData.work_unit} onChange={handleChange} className={selectClasses}>
                            <option value="">Pilih Unit Kerja</option>
                            {options.units.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </InputGroup>
                    <InputGroup label="Jabatan">
                        <select name="jabatan" value={formData.jabatan} onChange={handleChange} className={selectClasses}>
                            <option value="">Pilih Jabatan</option>
                            {options.positions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </InputGroup>
                    <InputGroup label="Area OPS">
                        <select name="ops" value={formData.ops} onChange={handleChange} className={selectClasses}>
                            <option value="">Pilih Ops</option>
                            {options.ops.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </InputGroup>
                    <InputGroup label="Lokasi Kerja">
                        <select name="lokasi" value={formData.lokasi} onChange={handleChange} className={selectClasses}>
                            <option value="">Pilih Lokasi</option>
                            {options.locations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </InputGroup>
                </div>
            </div>

            {/* SECTION 4: KONTAK & KEUANGAN (Split 2 cols) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                    <SectionHeader icon={Phone} title="Kontak Anggota" subtitle="Nomor telepon & email" />
                    <div className="space-y-4 flex-1">
                        <InputGroup label="Email">
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="email@contoh.com" />
                        </InputGroup>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="No. HP 1">
                                <input name="hp_1" value={formData.hp_1} onChange={handleChange} className={inputClasses} placeholder="08..." />
                            </InputGroup>
                            <InputGroup label="No. HP 2">
                                <input name="hp_2" value={formData.hp_2} onChange={handleChange} className={inputClasses} placeholder="Optional" />
                            </InputGroup>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Telp Rumah 1">
                                <input name="telp_rumah_1" value={formData.telp_rumah_1} onChange={handleChange} className={inputClasses} />
                            </InputGroup>
                            <InputGroup label="Telp Rumah 2">
                                <input name="telp_rumah_2" value={formData.telp_rumah_2} onChange={handleChange} className={inputClasses} />
                            </InputGroup>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
                    <SectionHeader icon={CreditCard} title="Data Keuangan" subtitle="Informasi rekening & payroll" />
                    <div className="space-y-4 flex-1">
                        <InputGroup label="Bank Payroll">
                            <select name="bank_gaji" value={formData.bank_gaji} onChange={handleChange} className={selectClasses}>
                                <option value="">Pilih Bank</option>
                                <option value="BNI 46">BNI 46</option>
                                <option value="BCA">BCA</option>
                                <option value="MANDIRI">MANDIRI</option>
                                <option value="BRI">BRI</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="No. Rekening Gaji">
                            <input name="rek_gaji" value={formData.rek_gaji} onChange={handleChange} className={inputClasses} placeholder="Nomor Rekening Payroll" />
                        </InputGroup>
                        <InputGroup label="No. Rekening Pribadi">
                            <input name="rek_pribadi" value={formData.rek_pribadi} onChange={handleChange} className={inputClasses} placeholder="Nomor Rekening Lainnya" />
                        </InputGroup>
                        <InputGroup label="Potongan Parkir?" className="w-1/2">
                            <select name="tagihan_parkir" value={formData.tagihan_parkir} onChange={handleChange} className={selectClasses}>
                                <option value="N">Tidak</option>
                                <option value="Y">Ya</option>
                            </select>
                        </InputGroup>
                    </div>
                </div>
            </div>

            {/* SECTION 5 REMOVED */}

            <div className="flex justify-end pt-6 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 text-white font-bold uppercase tracking-widest py-4 px-8 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center gap-3 transform hover:-translate-y-1"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Simpan Data Anggota'}
                </button>
            </div>
        </form>
    );
};

export default AddMemberForm;
