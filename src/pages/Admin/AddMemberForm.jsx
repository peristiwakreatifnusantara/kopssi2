import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const FormRow = ({ label1, required1, input1, label2, required2, input2, fullWidth }) => (
    <tr className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
        {!fullWidth ? (
            <>
                <td className="py-3 px-4 bg-gray-100/50 w-[15%] align-middle">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-tight">{label1} {required1 && <span className="text-red-500">*</span>}</label>
                </td>
                <td className="py-3 px-4 w-[35%]">{input1}</td>
                <td className="py-3 px-4 bg-gray-100/50 w-[15%] align-middle">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-tight">{label2} {required2 && <span className="text-red-500">*</span>}</label>
                </td>
                <td className="py-3 px-4 w-[35%]">{input2}</td>
            </>
        ) : (
            <>
                <td className="py-3 px-4 bg-gray-100/50 w-[15%] align-middle">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-tight">{label1} {required1 && <span className="text-red-500">*</span>}</label>
                </td>
                <td className="py-3 px-4" colSpan={3}>{input1}</td>
            </>
        )}
    </tr>
);

const AddMemberForm = ({ onSave, isSubmitting }) => {
    // Initial state
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

    const inputClasses = "w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm";
    const selectClasses = "w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em] bg-no-repeat bg-[right_0.7em_center] pr-8";

    return (
        <form onSubmit={handleSubmit}>
            <table className="w-full text-sm">
                <tbody>
                    <FormRow
                        label1="No. Anggota" required1
                        input1={<input name="no_anggota" value={formData.no_anggota} onChange={handleChange} className={`${inputClasses} bg-gray-50 font-mono font-bold text-blue-700`} placeholder="Auto Generated" readOnly />}
                        label2="Tgl. Masuk" required2
                        input2={<input type="date" name="join_date" value={formData.join_date} onChange={handleChange} className={inputClasses} />}
                    />
                    <FormRow
                        label1="Nama Lengkap" required1
                        input1={<input name="full_name" value={formData.full_name} onChange={handleChange} className={inputClasses} />}
                        label2="Status Simp. Anggota" required2
                        input2={
                            <select name="status_simp_anggota" value={formData.status_simp_anggota} onChange={handleChange} className={selectClasses}>
                                <option value="AKTIF">AKTIF</option>
                                <option value="NON-AKTIF">NON-AKTIF</option>
                            </select>
                        }
                    />
                    <FormRow
                        label1="NPP"
                        input1={<input name="no_npp" value={formData.no_npp} onChange={handleChange} className={inputClasses} />}
                        label2="Unit Kerja"
                        input2={
                            <select name="work_unit" value={formData.work_unit} onChange={handleChange} className={selectClasses}>
                                <option value="">Pilih Unit Kerja</option>
                                {options.units.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        }
                    />
                    <FormRow
                        label1="Jabatan"
                        input1={
                            <select name="jabatan" value={formData.jabatan} onChange={handleChange} className={selectClasses}>
                                <option value="">Pilih Jabatan</option>
                                {options.positions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        }
                        label2=""
                        input2={<div className="bg-gray-50 h-full rounded opacity-50"></div>}
                    />
                    <FormRow
                        label1="PT" required1
                        input1={
                            <select name="company" value={formData.company} onChange={handleChange} className={selectClasses}>
                                <option value="">Pilih PT</option>
                                {options.companies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        }
                        label2="OPS"
                        input2={
                            <select name="ops" value={formData.ops} onChange={handleChange} className={selectClasses}>
                                <option value="">Pilih Ops</option>
                                {options.ops.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        }
                    />
                    <FormRow
                        label1="Lokasi"
                        input1={
                            <select name="lokasi" value={formData.lokasi} onChange={handleChange} className={selectClasses}>
                                <option value="">Pilih Lokasi</option>
                                {options.locations.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        }
                        label2="Tagihan Parkir"
                        input2={
                            <select name="tagihan_parkir" value={formData.tagihan_parkir} onChange={handleChange} className={selectClasses}>
                                <option value="N">N</option>
                                <option value="Y">Y</option>
                            </select>
                        }
                    />
                    <FormRow
                        label1="Tempat Lahir"
                        input1={<input name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} className={inputClasses} />}
                        label2="Tgl. Lahir"
                        input2={<input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} className={inputClasses} />}
                    />
                    <FormRow
                        label1="Alamat"
                        input1={<textarea name="address" value={formData.address} onChange={handleChange} className={inputClasses} rows={2} />}
                        label2="Alamat Tinggal"
                        input2={<textarea name="alamat_tinggal" value={formData.alamat_tinggal} onChange={handleChange} className={inputClasses} rows={2} />}
                    />
                    <FormRow
                        label1="No. KTP/SIM"
                        input1={<input name="no_ktp" value={formData.no_ktp} onChange={handleChange} className={inputClasses} />}
                        label2="No. Telp Rumah 1 / 2"
                        input2={
                            <div className="flex gap-2">
                                <input name="telp_rumah_1" value={formData.telp_rumah_1} onChange={handleChange} className={inputClasses} placeholder="Telp 1" />
                                <span className="self-center text-gray-400">/</span>
                                <input name="telp_rumah_2" value={formData.telp_rumah_2} onChange={handleChange} className={inputClasses} placeholder="Telp 2" />
                            </div>
                        }
                    />
                    <FormRow
                        label1="Email"
                        input1={<input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} />}
                        label2="No. Hp 1 / 2"
                        input2={
                            <div className="flex gap-2">
                                <input name="hp_1" value={formData.hp_1} onChange={handleChange} className={inputClasses} placeholder="HP 1" />
                                <span className="self-center text-gray-400">/</span>
                                <input name="hp_2" value={formData.hp_2} onChange={handleChange} className={inputClasses} placeholder="HP 2" />
                            </div>
                        }
                    />
                    <FormRow
                        label1="No. Rek. Pribadi"
                        input1={<input name="rek_pribadi" value={formData.rek_pribadi} onChange={handleChange} className={inputClasses} />}
                        label2="No. Rek. Gaji / Data Bank"
                        input2={
                            <div className="flex gap-2">
                                <input name="rek_gaji" value={formData.rek_gaji} onChange={handleChange} className={inputClasses} placeholder="No Rekening" />
                                <span className="self-center text-gray-400">/</span>
                                <select name="bank_gaji" value={formData.bank_gaji} onChange={handleChange} className={`${selectClasses} w-32`}>
                                    <option value="">Bank</option>
                                    {options.banks.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        }
                    />
                    <FormRow
                        label1="Jenis Kelamin"
                        input1={
                            <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className={selectClasses}>
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                            </select>
                        }
                        label2="Last Update"
                        input2={<input disabled value={formData.last_update} className={`${inputClasses} bg-gray-100/50 text-gray-500`} />}
                    />
                    <FormRow
                        label1={<span className="text-red-600">Keluar Anggota ? (Y/N)</span>}
                        input1={
                            <select name="keluar_anggota" value={formData.keluar_anggota} onChange={handleChange} className={selectClasses}>
                                <option value="N">N</option>
                                <option value="Y">Y</option>
                            </select>
                        }
                        label2="Tgl. Keluar"
                        input2={<input type="date" name="tanggal_keluar" value={formData.tanggal_keluar} onChange={handleChange} className={inputClasses} />}
                    />
                    <FormRow
                        label1="Sebab Keluar"
                        input1={<input name="sebab_keluar" value={formData.sebab_keluar} onChange={handleChange} className={inputClasses} />}
                        label2="Keterangan"
                        input2={<input name="keterangan" value={formData.keterangan} onChange={handleChange} className={inputClasses} />}
                    />
                </tbody>
            </table>

            <div className="p-6 flex justify-center bg-gray-50 border-t border-gray-200 mt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 text-white font-bold uppercase tracking-widest py-3 px-12 rounded-full shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2 transform hover:scale-105"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Simpan'}
                </button>
            </div>
        </form>
    );
};

export default AddMemberForm;
