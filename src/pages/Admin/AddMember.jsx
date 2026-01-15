import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import AddMemberForm from './AddMemberForm';
import AddMemberExcel from './AddMemberExcel';

const AddMember = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'excel'

    const handleFormSave = async (data) => {
        setSubmitting(true);
        try {
            await saveMember(data);
            alert('Data anggota berhasil disimpan!');
            navigate('/admin/members');
        } catch (err) {
            console.error('Error saving member:', err);
            alert('Gagal menyimpan data: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleExcelSave = async (data) => {
        await saveMember(data);
    };

    const saveMember = async (data) => {
        // 1. Create/Find User
        let userId = null;
        const loginIdentifier = data.no_npp; // Use NPP for login identifier

        if (loginIdentifier) {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('no_npp', loginIdentifier)
                .single();

            if (existingUser) {
                userId = existingUser.id;
            } else {
                const { data: newUser, error: userError } = await supabase
                    .from('users')
                    .insert({
                        no_npp: loginIdentifier,
                        email: data.email || null,
                        password: 'placeholder-password',
                        role: 'MEMBER'
                    })
                    .select()
                    .single();
                if (userError) throw userError;
                userId = newUser.id;
            }
        }

        // 2. Insert personal_data
        const payload = {
            user_id: userId,
            no_anggota: data.no_anggota,
            full_name: data.full_name,
            nik: data.no_ktp,
            no_npp: data.no_npp,
            phone: data.hp_1,
            company: data.company,
            work_unit: data.work_unit,
            address: data.address,
            email: data.email,
            status_simp_anggota: data.status_simp_anggota,
            ops: data.ops,
            lokasi: data.lokasi,
            tagihan_parkir: data.tagihan_parkir === 'Y',
            tempat_lahir: data.tempat_lahir,
            tanggal_lahir: data.tanggal_lahir || null,
            alamat_tinggal: data.alamat_tinggal,
            no_sim: data.no_ktp,
            telp_rumah_1: data.telp_rumah_1,
            telp_rumah_2: data.telp_rumah_2,
            hp_1: data.hp_1,
            hp_2: data.hp_2,
            rek_pribadi: data.rek_pribadi,
            rek_gaji: data.rek_gaji,
            bank_gaji: data.bank_gaji,
            jenis_kelamin: data.jenis_kelamin,
            last_update: new Date().toISOString(),
            keluar_anggota: data.keluar_anggota === 'Y',
            tanggal_keluar: data.tanggal_keluar || null,
            sebab_keluar: data.sebab_keluar,
            keterangan: data.keterangan,
            employment_status: data.jabatan, // mapped to employment_status
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
            .from('personal_data')
            .insert(payload);

        if (insertError) throw insertError;
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/members')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Form Data Anggota</h2>
                        <p className="text-sm text-gray-500 font-medium">Lengkapi data anggota di bawah ini</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'manual' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        Input Manual
                    </button>
                    <button
                        onClick={() => setActiveTab('excel')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'excel' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                    >
                        Upload Excel
                    </button>
                </div>

                {activeTab === 'manual' ? (
                    <AddMemberForm onSave={handleFormSave} isSubmitting={submitting} />
                ) : (
                    <AddMemberExcel onSave={handleExcelSave} />
                )}
            </div>
        </div>
    );
};

export default AddMember;
