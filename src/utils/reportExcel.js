import * as XLSX from 'xlsx';

const formatNum = (num) => {
    if (!num || isNaN(num)) return 0;
    return new Intl.NumberFormat('id-ID').format(num);
};

export const exportMonthlyFinancialExcel = (stats) => {
    const data = [
        ['LAPORAN KEUANGAN BULANAN'],
        [`Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`],
        [''],
        ['Kategori', 'Keterangan', 'Jumlah'],
        ['PENDAPATAN', 'Total Simpanan Masuk (Setor)', formatNum(stats.simpananSetor)],
        ['PENDAPATAN', 'Total Angsuran Pinjaman (Paid)', formatNum(stats.totalAngsuran)],
        ['', 'TOTAL PENDAPATAN', formatNum(stats.monthlyIncome)],
        [''],
        ['PENGELUARAN', 'Total Penarikan Simpanan (Tarik)', formatNum(stats.simpananTarik)],
        ['PENGELUARAN', 'Total Pencairan Pinjaman Baru', formatNum(stats.totalDisbursed)],
        ['', 'TOTAL PENGELUARAN', formatNum(stats.monthlyExpense)],
        [''],
        ['CASHFLOW', 'Arus Kas Bersih', formatNum(stats.monthlyIncome - stats.monthlyExpense)]
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
    const rows = portfolioData.map(p => [p.full_name, p.nik, formatNum(p.savingsBalance), formatNum(p.loanBalance)]);

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
        new Date(m.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
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
        // Template for bulk upload: NIK, Nama, Simpanan Pokok, Simpanan Wajib, Simpanan Sukarela
        headers = [['NIK', 'Nama Lengkap', 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela']];
        rows = data.map(member => [
            member.nik || '-',
            member.full_name || '-',
            0,      // Default Simpanan Pokok
            75000,  // Default Simpanan Wajib
            0       // Default Simpanan Sukarela
        ]);
        filename = `Template_Upload_Simpanan_${new Date().toISOString().slice(0, 10)}.xlsx`;
    } else {
        // Columns synchronized with historical view - MUST keep original format
        headers = [['NIK', 'Nama', 'Referensi', 'Status', 'Bulan Ke', 'Jatuh Tempo', 'Simp. Pokok', 'Simp. Wajib', 'Simp. Sukarela', 'Total']];
        rows = data.map(bill => {
            const total = parseFloat(bill.amount_pokok || 0) + parseFloat(bill.amount_wajib || 0) + parseFloat(bill.amount_sukarela || 0);
            return [
                bill.personal_data?.nik || '-',
                bill.personal_data?.full_name || '-',
                bill.id,
                bill.status,
                bill.bulan_ke,
                bill.jatuh_tempo ? new Date(bill.jatuh_tempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-',
                bill.amount_pokok || 0,
                bill.amount_wajib || 0,
                bill.amount_sukarela || 0,
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
        formatNum(loan.jumlah_pinjaman),
        loan.tenor_bulan,
        new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
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
        formatNum(inst.amount),
        inst.tanggal_bayar ? new Date(inst.tanggal_bayar).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Angsuran');

    XLSX.writeFile(wb, `Monitoring_Angsuran_${range.startDate}_${range.endDate}.xlsx`);
};

export const exportDisbursementDelivery = (data) => {
    // 1. DATE HEADER ROW
    const dateHeader = ['', '', new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-')];

    // 2. COLUMN HEADERS
    const headers = [
        'No', 'No Pinjaman', 'Nama', 'NPP', 'No Anggota', 'Lokasi', 'Tgl Pinjam', 'Tgl Setuju',
        'Tenor', 'Jml. Pengajuan', 'Jumlah Pinjam', 'Bunga', 'Outs. Pokok', 'Outs. Bunga',
        'Biaya', 'Diterima', 'NoRek', 'NoHP', 'Keperluan', 'Bank', 'Tgl Realisasi'
    ];

    // 3. DATA ROWS
    const rows = data.map((loan, index) => {
        const principal = parseFloat(loan.jumlah_pinjaman || 0);
        const tenor = loan.tenor_bulan || 1;
        let totalBunga = 0;

        if (loan.tipe_bunga === 'PERSENAN') {
            totalBunga = principal * (parseFloat(loan.nilai_bunga || 0) / 100) * (tenor / 12);
        } else if (loan.tipe_bunga === 'NOMINAL') {
            totalBunga = parseFloat(loan.nilai_bunga || 0);
        }

        const outsPokok = parseFloat(loan.calculated_outs_pokok || 0);
        const outsBunga = parseFloat(loan.calculated_outs_bunga || 0);
        const adminFee = 5000;
        const netDisbursement = principal - outsPokok - outsBunga - adminFee;

        return [
            index + 1,
            loan.no_pinjaman || '-',
            loan.personal_data?.full_name || '-',
            loan.personal_data?.no_npp || '-',
            loan.personal_data?.no_anggota || '-',
            loan.personal_data?.lokasi || '-',
            loan.created_at ? new Date(loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'numeric', year: 'numeric' }) : '-',
            (loan.approved_at || loan.created_at) ? new Date(loan.approved_at || loan.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'numeric', year: 'numeric' }) : '-',
            tenor,
            parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman || 0),
            principal,
            Math.round(totalBunga),
            outsPokok,
            outsBunga,
            adminFee,
            netDisbursement,
            loan.personal_data?.rek_gaji || '-',
            loan.personal_data?.phone || '-',
            loan.keperluan || '-',
            loan.personal_data?.bank_gaji || '-',
            loan.delivery_date ? new Date(loan.delivery_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'numeric', year: 'numeric' }) : '-'
        ];
    });

    // 4. TOTALS ROW
    const totals = {
        jmlPengajuan: rows.reduce((acc, curr) => acc + curr[9], 0),
        jmlPinjam: rows.reduce((acc, curr) => acc + curr[10], 0),
        bunga: rows.reduce((acc, curr) => acc + curr[11], 0),
        outsPokok: rows.reduce((acc, curr) => acc + curr[12], 0),
        outsBunga: rows.reduce((acc, curr) => acc + curr[13], 0),
        biaya: rows.reduce((acc, curr) => acc + curr[14], 0),
        diterima: rows.reduce((acc, curr) => acc + curr[15], 0)
    };

    const totalRow = [
        '', '', '', '', '', '', '', '', '',
        totals.jmlPengajuan,
        totals.jmlPinjam,
        totals.bunga,
        totals.outsPokok,
        totals.outsBunga,
        totals.biaya,
        totals.diterima,
        '', '', '', '', ''
    ];

    const finalData = [
        dateHeader,
        headers,
        ...rows,
        totalRow
    ];

    const ws = XLSX.utils.aoa_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Realisasi Pinjaman');

    XLSX.writeFile(wb, `Realisasi_Pinjaman_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportExitRealisasi = (data) => {
    const formatNum = (num) => parseFloat(num || 0);

    // 1. DATE HEADER
    const dateHeader = [
        `TANGGAL CETAK: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
    ];

    // 2. HEADERS
    const headers = [
        'No', 'Nama', 'NPP', 'Uraian', 'Unit Kerja',
        'Masuk', 'Keluar', 'Simp. Pokok', 'Simp. Wajib', 'Simp. Sukarela',
        'Jumlah', 'Outs. Pokok', 'Outs. Bunga',
        'Admin', 'Diterima', 'No Rek', 'Tgl Realisasi'
    ];

    // 3. DATA ROWS
    const rows = data.map((item, index) => {
        const netBack = (item.jumlah || 0) - (item.outs_pokok || 0) - (item.outs_bunga || 0) - (item.admin || 0);

        return [
            index + 1,
            item.nama || '-',
            item.npp || '-',
            item.uraian || '-',
            item.unit_kerja || '-',
            formatNum(item.masuk),
            formatNum(item.keluar),
            formatNum(item.simp_pokok),
            formatNum(item.simp_wajib),
            formatNum(item.simp_sukarela),
            formatNum(item.jumlah),
            formatNum(item.outs_pokok),
            formatNum(item.outs_bunga),
            formatNum(item.admin),
            formatNum(netBack),
            item.no_rek || '-',
            item.tgl_real ? new Date(item.tgl_real).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
        ];
    });

    // 4. TOTALS ROW
    const totals = {
        masuk: rows.reduce((acc, curr) => acc + curr[5], 0),
        keluar: rows.reduce((acc, curr) => acc + curr[6], 0),
        pokok: rows.reduce((acc, curr) => acc + curr[7], 0),
        wajib: rows.reduce((acc, curr) => acc + curr[8], 0),
        sukarela: rows.reduce((acc, curr) => acc + curr[9], 0),
        jumlah: rows.reduce((acc, curr) => acc + curr[10], 0),
        outsP: rows.reduce((acc, curr) => acc + curr[11], 0),
        outsB: rows.reduce((acc, curr) => acc + curr[12], 0),
        admin: rows.reduce((acc, curr) => acc + curr[13], 0),
        diterima: rows.reduce((acc, curr) => acc + curr[14], 0)
    };

    const totalRow = [
        '', '', '', '', 'TOTAL',
        totals.masuk, totals.keluar, totals.pokok, totals.wajib, totals.sukarela,
        totals.jumlah, totals.outsP, totals.outsB, totals.admin, totals.diterima,
        '', ''
    ];

    const finalData = [
        dateHeader,
        headers,
        ...rows,
        totalRow
    ];

    const ws = XLSX.utils.aoa_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Realisasi Karyawan');

    XLSX.writeFile(wb, `Realisasi_Karyawan_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
