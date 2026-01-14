import React from 'react';
import { Settings, Bell, Lock, Globe } from 'lucide-react';

const AdminSettings = () => {
    return (
        <div className="max-w-3xl space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Sistem</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Informasi Koperasi</h3>
                        <p className="text-gray-500 text-sm">Identitas dan profil koperasi</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Koperasi</label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600" defaultValue="Koperasi Simpan Pinjam Sejahtera" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Kantor</label>
                        <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600" rows="2" defaultValue="Jl. Jendral Sudirman No. 123, Jakarta Pusat"></textarea>
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Simpan Perubahan</button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Notifikasi</h3>
                        <p className="text-gray-500 text-sm">Pengaturan notifikasi email dan sistem</p>
                    </div>
                </div>
                <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700">Notifikasi Anggota Baru</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700">Notifikasi Transaksi Besar</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Konfigurasi Sistem</h3>
                        <p className="text-gray-500 text-sm">Parameter bunga dan biaya</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bunga Pinjaman (%)</label>
                            <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600" defaultValue="1.2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bunga Simpanan (%)</label>
                            <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600" defaultValue="4.0" />
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">Update Parameter</button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
