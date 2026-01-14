import React, { useEffect, useState } from 'react';
import { User, Lock, Mail, MapPin, Phone, Briefcase, Building, FileText, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Profil = () => {
    const [profile, setProfile] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            console.log("Profil: Fetching started...");
            try {
                // Auth Check with LocalStorage Fallback
                const { data: { user } } = await supabase.auth.getUser();
                let userId = user?.id;
                let email = user?.email;

                if (!userId) {
                    const storedUser = localStorage.getItem('auth_user');
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            userId = parsedUser.id;
                            email = parsedUser.email; // Assuming email is stored here too, otherwise fetch from DB if needed
                        } catch (e) {
                            console.error("Profil: Error parsing stored user", e);
                        }
                    }
                }

                if (!userId) {
                    setLoading(false);
                    return;
                }

                setUserEmail(email || 'Email not found');

                const { data, error } = await supabase
                    .from('personal_data')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (error) throw error;
                if (data) {
                    setProfile(data);
                }

            } catch (error) {
                console.error("Profil: Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div>Loading...</div>;

    if (!profile) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                <h3 className="text-xl font-bold text-gray-800">Profil Tidak Ditemukan</h3>
                <p className="text-gray-500 mt-2">Silahkan lengkapi data diri Anda.</p>
            </div>
        );
    }

    // Get initials
    const initials = profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'UR';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center text-4xl text-emerald-600 font-bold border-4 border-emerald-50">
                    {initials}
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                    <p className="text-gray-500 mb-4">{profile.employment_status || 'Anggota'} • {profile.work_unit || '-'}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${profile.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            Status: {profile.status || 'Pending'}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">NIK: {profile.nik}</span>
                        {profile.no_npp && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">NPP: {profile.no_npp}</span>
                        )}
                    </div>
                </div>
                {/* <button className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Edit Profil</button> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <User size={20} className="text-emerald-600" /> Informasi Pribadi
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <input type="text" value={profile.full_name} readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Mail size={14} /> Email</label>
                            <input type="email" value={userEmail} readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Phone size={14} /> No. Handphone</label>
                            <input type="tel" value={profile.phone} readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Smartphone size={14} /> Emergency Contact</label>
                            <input type="tel" value={profile.emergency_phone || '-'} readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><MapPin size={14} /> Alamat</label>
                            <textarea rows="3" readOnly value={`${profile.address || ''} ${profile.postal_code ? ', ' + profile.postal_code : ''}`} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"></textarea>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Briefcase size={20} className="text-emerald-600" /> Data Pekerjaan
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Building size={14} /> Perusahaan</label>
                                <input type="text" value={profile.company || '-'} readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Kerja</label>
                                <input type="text" value={profile.work_unit || '-'} readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status Kepegawaian</label>
                                <input type="text" value={profile.employment_status || '-'} readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Lock size={20} className="text-emerald-600" /> Keamanan Akun
                        </h3>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                                <input type="password" value="********" readOnly className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                                <input type="password" placeholder="Masukkan password baru" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                                <input type="password" placeholder="Ulangi password baru" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <button type="button" className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors mt-2">
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profil;
