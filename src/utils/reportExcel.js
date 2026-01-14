import * as XLSX from 'xlsx';

export const exportMonthlyFinancialExcel = (stats) => {
    const data = [
        ['LAPORAN KEUANGAN BULANAN'],
        [`Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`],
        [''],
        ['Kategori', 'Keterangan', 'Jumlah'],
        ['PENDAPATAN', 'Total Simpanan Masuk (Setor)', stats.simpananSetor],
        ['PENDAPATAN', 'Total Angsuran Pinjaman (Paid)', stats.totalAngsuran],
        ['', 'TOTAL PENDAPATAN', stats.monthlyIncome],
        [''],
        ['PENGELUARAN', 'Total Penarikan Simpanan (Tarik)', stats.simpananTarik],
        ['PENGELUARAN', 'Total Pencairan Pinjaman Baru', stats.totalDisbursed],
        ['', 'TOTAL PENGELUARAN', stats.monthlyExpense],
        [''],
        ['CASHFLOW', 'Arus Kas Bersih', stats.monthlyIncome - stats.monthlyExpense]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financials');

    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, r[1] ? r[1].toString().length : 0), 10);
    ws['!cols'] = [{ wch: 15 }, { wch: max_width + 5 }, { wch: 15 }];

    XLSX.writeFile(wb, `Laporan_Keuangan_${new Date().toISOString().slice(0, 7)}.xlsx`);
};

export const exportActivePortfolioExcel = (portfolioData) => {
    const headers = [['Nama Anggota', 'NIK', 'Saldo Simpanan', 'Hutang Berjalan']];
    const rows = portfolioData.map(p => [p.full_name, p.nik, p.savingsBalance, p.loanBalance]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portfolio');

    XLSX.writeFile(wb, `Laporan_Portofolio_Aktif_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportNewMembersExcel = (members) => {
    const headers = [['Nama Lengkap', 'NIK', 'Unit Kerja', 'Tanggal Daftar']];
    const rows = members.map(m => [
        m.full_name,
        m.nik,
        m.work_unit || '-',
        new Date(m.created_at).toLocaleDateString('id-ID')
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Anggota Baru');

    XLSX.writeFile(wb, `Daftar_Anggota_Baru_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportMonitoringSimpanan = (data, range, mode = 'DATA') => {
    let headers;
    let rows;
    let filename;

    if (mode === 'TEMPLATE') {
        // Template for bulk upload: NIK, Nama, Simpanan Pokok, Simpanan Wajib
        headers = [['NIK', 'Nama Lengkap', 'Simpanan Pokok', 'Simpanan Wajib']];
        rows = data.map(member => [
            member.nik || '-',
            member.full_name || '-',
            '', // Empty for user to fill
            ''  // Empty for user to fill
        ]);
        filename = `Template_Upload_Simpanan_${new Date().toISOString().slice(0, 10)}.xlsx`;
    } else {
        // Columns synchronized with historical view - MUST keep original format
        headers = [['NIK', 'Nama', 'Referensi', 'Status', 'Bulan Ke', 'Jatuh Tempo', 'Simp. Pokok', 'Simp. Wajib', 'Total']];
        rows = data.map(bill => {
            const total = parseFloat(bill.amount_pokok || 0) + parseFloat(bill.amount_wajib || 0);
            return [
                bill.personal_data?.nik || '-',
                bill.personal_data?.full_name || '-',
                bill.id,
                bill.status,
                bill.bulan_ke,
                bill.jatuh_tempo,
                bill.amount_pokok,
                bill.amount_wajib,
                total
            ];
        });
        filename = `Monitoring_Simpanan_${range.startDate}_${range.endDate}.xlsx`;
    }

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Simpanan');

    XLSX.writeFile(wb, filename);
};

export const exportMonitoringPinjaman = (data, range) => {
    const headers = [['NIK', 'Nama', 'No Pinjaman', 'Plafon', 'Tenor', 'Tgl Pengajuan', 'Status']];
    const rows = data.map(loan => [
        loan.personal_data?.nik || '-',
        loan.personal_data?.full_name || '-',
        loan.no_pinjaman,
        loan.jumlah_pinjaman,
        loan.tenor_bulan,
        new Date(loan.created_at).toLocaleDateString('id-ID'),
        loan.status
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pinjaman');

    XLSX.writeFile(wb, `Monitoring_Pinjaman_${range.startDate}_${range.endDate}.xlsx`);
};

export const exportMonitoringAngsuran = (data, range) => {
    // Columns synchronized with UploadPinjaman.jsx: NIK, Nama, No Pinjaman, Angsuran Ke, Status
    const headers = [['NIK', 'Nama', 'No Pinjaman', 'Angsuran Ke', 'Status', 'Nominal', 'Tgl Bayar']];
    const rows = data.map(inst => [
        inst.pinjaman?.personal_data?.nik || '-',
        inst.pinjaman?.personal_data?.full_name || '-',
        inst.pinjaman?.no_pinjaman || '-',
        inst.bulan_ke,
        inst.status,
        inst.amount,
        inst.tanggal_bayar ? new Date(inst.tanggal_bayar).toLocaleDateString('id-ID') : '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Angsuran');

    XLSX.writeFile(wb, `Monitoring_Angsuran_${range.startDate}_${range.endDate}.xlsx`);
};

export const exportDisbursementDelivery = (data) => {
    const headers = [['NIK', 'Nama', 'No Pinjaman', 'Nominal', 'Tgl Cair (Sistem)', 'Status Kirim', 'Tgl Kirim']];
    const rows = data.map(loan => [
        loan.personal_data?.nik || '-',
        loan.personal_data?.full_name || '-',
        loan.no_pinjaman,
        loan.jumlah_pinjaman,
        loan.disbursed_at ? new Date(loan.disbursed_at).toLocaleDateString('id-ID') : '-',
        loan.delivery_status === 'SENT' ? 'TERKIRIM' : 'BELUM TERKIRIM',
        loan.delivery_date ? new Date(loan.delivery_date).toLocaleDateString('id-ID') : '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pencairan-Delivery');

    XLSX.writeFile(wb, `Pencairan_Delivery_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
