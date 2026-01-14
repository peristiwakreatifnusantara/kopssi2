import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

const UploadSimpanan = () => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadStats, setUploadStats] = useState({ matched: 0, unmatched: 0 });
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 7);
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const parseExcel = async (file) => {
        try {
            setLoading(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                await matchWithDatabase(jsonData);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error parsing excel:', error);
            alert('Gagal membaca file Excel');
        } finally {
            setLoading(false);
        }
    };

    const matchWithDatabase = async (excelData) => {
        try {
            // Fetch all active members to validate against
            const { data: members, error } = await supabase
                .from('personal_data')
                .select('id, full_name, nik')
                .eq('status', 'active');

            if (error) throw error;

            const results = excelData.map(row => {
                const excelNIK = String(row.NIK || row['NIK'] || '').trim();
                const amountPokok = parseFloat(row['Simpanan Pokok'] || 0);
                const amountWajib = parseFloat(row['Simpanan Wajib'] || 0);

                const match = members.find(m => String(m.nik).trim() === excelNIK);

                return {
                    excelData: row,
                    dbMatch: match,
                    amountPokok,
                    amountWajib,
                    status: match ? 'VALID' : 'INVALID'
                };
            });

            setPreviewData(results);
            setUploadStats({
                matched: results.filter(r => r.status === 'VALID').length,
                unmatched: results.filter(r => r.status === 'INVALID').length
            });
        } catch (error) {
            console.error('Error matching data:', error);
            alert('Gagal melakukan validasi data anggota');
        }
    };

    const handleProcessUpload = async () => {
        const validItems = previewData.filter(r => r.status === 'VALID' && (r.amountPokok > 0 || r.amountWajib > 0));
        if (validItems.length === 0) {
            alert('Tidak ada data valid dengan nominal simpanan untuk diproses');
            return;
        }

        if (!window.confirm(`Konfirmasi simpanan untuk ${validItems.length} anggota untuk periode ${selectedMonth}?`)) return;

        try {
            setProcessing(true);

            // Generate bulan_ke from selectedMonth (e.g., 2026-02 -> 2)
            const bulanKe = parseInt(selectedMonth.split('-')[1], 10);
            const jatuhTempo = `${selectedMonth}-01`;

            const inserts = [];
            validItems.forEach(item => {
                if (item.amountPokok > 0) {
                    inserts.push({
                        personal_data_id: item.dbMatch.id,
                        type: 'POKOK',
                        amount: item.amountPokok,
                        status: 'PAID',
                        transaction_type: 'SETOR',
                        bulan_ke: bulanKe,
                        jatuh_tempo: jatuhTempo,
                        created_at: new Date().toISOString()
                    });
                }
                if (item.amountWajib > 0) {
                    inserts.push({
                        personal_data_id: item.dbMatch.id,
                        type: 'WAJIB',
                        amount: item.amountWajib,
                        status: 'PAID',
                        transaction_type: 'SETOR',
                        bulan_ke: bulanKe,
                        jatuh_tempo: jatuhTempo,
                        created_at: new Date().toISOString()
                    });
                }
            });

            const { error } = await supabase
                .from('simpanan')
                .insert(inserts);

            if (error) throw error;

            alert(`Berhasil menginput ${inserts.length} record simpanan!`);
            setPreviewData([]);
            setFile(null);
            setUploadStats({ matched: 0, unmatched: 0 });
        } catch (error) {
            console.error('Error processing bulk insertion:', error);
            alert('Terjadi kesalahan saat menyimpan data: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Bulk Input Simpanan</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Input iuran anggota secara massal via Excel</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase italic">Periode Simpanan</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white font-bold"
                    />
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4 hover:border-emerald-400 transition-colors group">
                <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                        {file ? file.name : 'Pilih file Excel untuk diunggah'}
                    </p>
                    <p className="text-sm text-gray-400">Gunakan template yang diunduh dari menu Monitoring Simpanan</p>
                </div>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload"
                />
                <div className="flex gap-3">
                    <label
                        htmlFor="excel-upload"
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 cursor-pointer shadow-lg shadow-emerald-100 transition"
                    >
                        {file ? 'Ganti File' : 'Cari File'}
                    </label>
                </div>
            </div>

            {/* Guidance */}
            {!previewData.length && (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex gap-4 text-emerald-900 shadow-sm shadow-emerald-100/50">
                    <Info size={24} className="shrink-0" />
                    <div className="text-xs space-y-2">
                        <p className="font-black uppercase tracking-tight italic text-sm">💡 Langkah-langkah:</p>
                        <ul className="list-decimal ml-4 space-y-1 font-bold opacity-80 mt-2">
                            <li>Buka menu <strong>Monitoring Simpanan</strong></li>
                            <li>Klik tombol <strong>Export</strong> dan pilih <strong>Unduh Template Upload</strong></li>
                            <li>Isi nominal <strong>Simpanan Pokok</strong> dan <strong>Simpanan Wajib</strong> pada file Excel</li>
                            <li>Pilih <strong>Periode Simpanan</strong> yang sesuai di halaman ini</li>
                            <li>Unggah file yang sudah diisi dan klik <strong>Proses Simpanan</strong></li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Statistics & Actions */}
            {previewData.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Anggota Valid</p>
                            <p className="text-2xl font-black text-emerald-600 italic">{uploadStats.matched}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Tidak Ditemukan</p>
                            <p className="text-2xl font-black text-red-500 italic">{uploadStats.unmatched}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleProcessUpload}
                        disabled={uploadStats.matched === 0 || processing}
                        className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Proses Simpanan ({selectedMonth})
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Preview Table */}
            {previewData.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 italic font-black text-[10px] uppercase tracking-widest text-gray-400">
                                    <th className="px-6 py-4">Validasi</th>
                                    <th className="px-6 py-4">NIK</th>
                                    <th className="px-6 py-4">Nama Anggota</th>
                                    <th className="px-6 py-4 text-right">Simp. Pokok</th>
                                    <th className="px-6 py-4 text-right">Simp. Wajib</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {row.status === 'VALID' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 italic">
                                                    <CheckCircle2 size={12} /> OK
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-500 italic">
                                                    <AlertCircle size={12} /> Unknown
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900 tabular-nums">{row.excelData.NIK || row.excelData['NIK'] || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 uppercase italic">{row.dbMatch?.full_name || row.excelData['Nama Lengkap'] || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-bold text-gray-600 font-mono">
                                                Rp {(row.amountPokok || 0).toLocaleString('id-ID')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-bold text-gray-600 font-mono">
                                                Rp {(row.amountWajib || 0).toLocaleString('id-ID')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-black text-emerald-600 tabular-nums italic font-mono">
                                                Rp {(row.amountPokok + row.amountWajib).toLocaleString('id-ID')}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadSimpanan;
