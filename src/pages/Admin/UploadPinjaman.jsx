import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info, ClipboardCheck } from 'lucide-react';

const UploadPinjaman = () => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadStats, setUploadStats] = useState({ matched: 0, unmatched: 0 });

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

                // Try to find the header row (containing 'NIK')
                const range = XLSX.utils.decode_range(worksheet['!ref']);
                let headerRowIndex = 0;
                for (let r = range.s.r; r <= range.e.r; r++) {
                    let isHeader = false;
                    for (let c = range.s.c; c <= range.e.c; c++) {
                        const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
                        if (cell && String(cell.v).toUpperCase() === 'NIK') {
                            isHeader = true;
                            break;
                        }
                    }
                    if (isHeader) {
                        headerRowIndex = r;
                        break;
                    }
                }

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
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
            // Fetch all unpaid installments (angsuran) joined with pinjaman and personal_data
            const { data: unpaidAngsuran, error } = await supabase
                .from('angsuran')
                .select(`
                    *,
                    pinjaman (
                        no_pinjaman,
                        personal_data:personal_data_id (
                            full_name,
                            nik
                        )
                    )
                `)
                .eq('status', 'UNPAID');

            if (error) throw error;

            const results = excelData.map(row => {
                // Try to find match by NIK + No Pinjaman + Angsuran Ke
                const excelNIK = String(row.NIK || row.nik || '').trim();
                const excelNoPinj = String(row['No Pinjaman'] || row.no_pinjaman || '').trim();
                const excelBulan = String(row['Angsuran Ke'] || row.bulan_ke || '').trim();
                const excelStatus = String(row.Status || row.status || '').toUpperCase();

                // Only match if the status in Excel is PAID or LUNAS
                const isPaidInExcel = excelStatus === 'PAID' || excelStatus === 'LUNAS';

                const match = isPaidInExcel ? unpaidAngsuran.find(db =>
                    String(db.pinjaman?.personal_data?.nik).trim() === excelNIK &&
                    String(db.pinjaman?.no_pinjaman).trim() === excelNoPinj &&
                    (excelBulan === '' || String(db.bulan_ke).trim() === excelBulan)
                ) : null;

                return {
                    excelData: row,
                    dbMatch: match,
                    status: match ? 'MATCHED' : (isPaidInExcel ? 'UNMATCHED' : 'SKIPPED')
                };
            });

            setPreviewData(results);
            setUploadStats({
                matched: results.filter(r => r.status === 'MATCHED').length,
                unmatched: results.filter(r => r.status === 'UNMATCHED').length
            });
        } catch (error) {
            console.error('Error matching data:', error);
            alert('Gagal melakukan sinkronisasi data');
        }
    };

    const handleProcessPayments = async () => {
        const matchedItems = previewData.filter(r => r.status === 'MATCHED');
        if (matchedItems.length === 0) return;

        if (!window.confirm(`Konfirmasi pembayaran untuk ${matchedItems.length} angsuran yang cocok?`)) return;

        try {
            setProcessing(true);
            const now = new Date().toISOString();
            const idsToUpdate = matchedItems.map(m => m.dbMatch.id);

            const { error } = await supabase
                .from('angsuran')
                .update({
                    status: 'PAID',
                    tanggal_bayar: now
                })
                .in('id', idsToUpdate);

            if (error) throw error;

            alert('Berhasil memproses angsuran massal!');
            setPreviewData([]);
            setFile(null);
            setUploadStats({ matched: 0, unmatched: 0 });
        } catch (error) {
            console.error('Error processing bulk installments:', error);
            alert('Terjadi kesalahan saat mengupdate data angsuran');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">Bulk Upload Angsuran</h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium italic uppercase tracking-wider">Update status angsuran pinjaman via Excel</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4 hover:border-blue-400 transition-colors group">
                <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                    <ClipboardCheck size={32} />
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                        {file ? file.name : 'Pilih file Excel untuk diunggah'}
                    </p>
                    <p className="text-sm text-gray-400">Pastikan format kolom sesuai (NIK, Nama, No Pinjaman, Angsuran Ke, Status)</p>
                </div>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload-pinjaman"
                />
                <label
                    htmlFor="excel-upload-pinjaman"
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 cursor-pointer shadow-lg shadow-blue-100 transition"
                >
                    {file ? 'Ganti File' : 'Cari File'}
                </label>
            </div>

            {/* Guidance */}
            {!previewData.length && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-4 text-blue-900 shadow-sm shadow-blue-100/50">
                    <Info size={24} className="shrink-0" />
                    <div className="text-xs space-y-2">
                        <p className="font-black uppercase tracking-tight italic text-sm">💡 Tips: Gunakan File Monitoring</p>
                        <p className="font-medium leading-relaxed opacity-90">
                            Anda dapat mengunduh data dari menu <strong>Monitoring Angsuran</strong>, mengubah kolom <strong>Status</strong> menjadi <strong>PAID</strong> atau <strong>LUNAS</strong> untuk baris yang ingin dibayar, lalu unggah kembali file tersebut di sini.
                        </p>
                        <ul className="list-disc ml-4 space-y-1 font-bold opacity-80 mt-2">
                            <li>Kolom Wajib: <strong>NIK</strong>, <strong>No Pinjaman</strong>, <strong>Angsuran Ke</strong>, <strong>Status</strong></li>
                            <li>Hanya baris dengan Status <strong>PAID</strong> / <strong>LUNAS</strong> yang akan diproses</li>
                            <li>Hanya data yang saat ini berstatus <strong>UNPAID</strong> di sistem yang dapat diperbarui</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Statistics & Actions */}
            {previewData.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Matched</p>
                            <p className="text-2xl font-black text-blue-600 italic">{uploadStats.matched}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase italic">Unmatched</p>
                            <p className="text-2xl font-black text-red-500 italic">{uploadStats.unmatched}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleProcessPayments}
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
                                Proses Pembayaran LUNAS
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
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Excel NIK</th>
                                    <th className="px-6 py-4">No Pinjaman</th>
                                    <th className="px-6 py-4">System Member</th>
                                    <th className="px-6 py-4">Bulan Ke</th>
                                    <th className="px-6 py-4">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {row.status === 'MATCHED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 italic">
                                                    <CheckCircle2 size={12} /> OK
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-500 italic">
                                                    <AlertCircle size={12} /> Unknown
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900 tabular-nums">{row.excelData.NIK || row.excelData.nik || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-gray-900 italic uppercase">{row.excelData['No Pinjaman'] || row.excelData.no_pinjaman || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 uppercase italic">{row.dbMatch?.pinjaman?.personal_data?.full_name || row.excelData.Nama || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="text-xs font-black text-gray-900">{row.dbMatch?.bulan_ke || row.excelData['Angsuran Ke'] || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-gray-900 tabular-nums italic">
                                                {row.dbMatch ? `Rp ${parseFloat(row.dbMatch.amount).toLocaleString('id-ID')}` : '-'}
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

export default UploadPinjaman;
