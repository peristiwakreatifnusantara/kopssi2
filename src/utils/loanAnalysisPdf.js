import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabaseClient';

export const numberToWords = (num) => {
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (num < 12) return units[num];
    if (num < 20) return numberToWords(num - 10) + ' Belas';
    if (num < 100) return (numberToWords(Math.floor(num / 10)) + ' Puluh ' + numberToWords(num % 10)).trim();
    if (num < 200) return 'Seratus ' + numberToWords(num - 100);
    if (num < 1000) return numberToWords(Math.floor(num / 100)) + ' Ratus ' + numberToWords(num % 100);
    if (num < 2000) return 'Seribu ' + numberToWords(num - 1000);
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Ribu ' + numberToWords(num % 1000);
    if (num < 1000000000) return (numberToWords(Math.floor(num / 1000000)) + ' Juta ' + numberToWords(num % 1000000)).trim();
    if (num < 1000000000000) return (numberToWords(Math.floor(num / 1000000000)) + ' Miliar ' + numberToWords(num % 1000000000)).trim();
    return num.toString();
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const generateLoanAnalysisPDF = async (loan, isDownload = false, analystName = 'Admin', customData = null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Fetch Simpanan Data
    const { data: simpanan } = await supabase
        .from('simpanan')
        .select('*')
        .eq('personal_data_id', loan.personal_data_id);

    const savingsByType = {
        'POKOK': 0,
        'WAJIB': 0,
    };

    if (simpanan) {
        simpanan.forEach(s => {
            if (s.transaction_type === 'SETOR') savingsByType[s.type] += parseFloat(s.amount);
            else if (s.transaction_type === 'TARIK') savingsByType[s.type] -= parseFloat(s.amount);
        });
    }

    const totalSavings = savingsByType.POKOK + savingsByType.WAJIB;

    // Fetch Active Loans (Outstanding)
    const { data: activeLoans } = await supabase
        .from('pinjaman')
        .select('*, bunga:bunga_id(*)')
        .eq('personal_data_id', loan.personal_data_id)
        .in('status', ['DICAIRKAN', 'DISETUJUI']);

    const outstandingData = [];
    let grandOutstanding = 0;
    let grandBunga = 0;
    let grandTotal = 0;
    let grandAngBln = 0;

    if (activeLoans) {
        for (const al of activeLoans) {
            const { data: ang } = await supabase
                .from('angsuran')
                .select('*')
                .eq('pinjaman_id', al.id);

            const paidCount = ang ? ang.filter(a => a.status === 'PAID').length : 0;
            const remainingCount = al.tenor_bulan - paidCount;

            const principal = parseFloat(al.jumlah_pinjaman);
            const tenor = al.tenor_bulan;

            let totalBunga = 0;
            if (al.tipe_bunga === 'PERSENAN') {
                totalBunga = principal * (parseFloat(al.nilai_bunga) / 100) * (tenor / 12);
            } else if (al.tipe_bunga === 'NOMINAL') {
                totalBunga = parseFloat(al.nilai_bunga);
            }

            const totalBayar = principal + totalBunga;
            const angBln = Math.ceil(totalBayar / tenor);

            const remPrincipal = (principal / tenor) * remainingCount;
            const remBunga = (totalBunga / tenor) * remainingCount;
            const remTotal = angBln * remainingCount;

            outstandingData.push([
                al.no_pinjaman,
                (al.jenis_pinjaman || 'BIASA').toUpperCase(),
                `${paidCount}/${tenor}`,
                Math.round(remPrincipal).toLocaleString('id-ID'),
                Math.round(remBunga).toLocaleString('id-ID'),
                Math.round(remTotal).toLocaleString('id-ID'),
                angBln.toLocaleString('id-ID')
            ]);

            grandOutstanding += remPrincipal;
            grandBunga += remBunga;
            grandTotal += remTotal;
            grandAngBln += angBln;
        }
    }

    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Analis: ${analystName}`, pageWidth - 50, 20);
    doc.text(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - 50, 25);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Perangkat Analisa Pinjaman', pageWidth / 2, 40, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(margin, 45, pageWidth - margin, 45);

    // No Permohonan
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No Permohonan', 130, 55);
    doc.text(': ' + loan.no_pinjaman, 160, 55);
    doc.text('Tgl Permohonan', 130, 60);
    doc.text(': ' + formatDate(loan.created_at), 160, 60);

    // Member Info
    const infoY = 75;
    const leftColX = margin;
    const labelX = leftColX + 40;

    const memberInfo = [
        ['No Anggota', '-'],
        ['NPP', loan.personal_data?.no_npp || '-'],
        ['Nama Lengkap', loan.personal_data?.full_name || '-'],
        ['Alamat', loan.personal_data?.address || '-'],
        ['Tempat Lahir', '-'],
        ['Unit Kerja', loan.personal_data?.work_unit || '-'],
        ['Status Pegawai', loan.personal_data?.employment_status || '-'],
        ['Tgl Keanggotaan', formatDate(loan.personal_data?.created_at)]
    ];

    memberInfo.forEach((item, i) => {
        const y = infoY + (i * 6);
        doc.text(item[0], leftColX, y);
        doc.text(':', labelX - 5, y);
        doc.text(item[1], labelX, y);
    });

    // Data Simpanan
    const savingsY = infoY + (memberInfo.length * 6) + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Data Simpanan', leftColX, savingsY);
    doc.setFont('helvetica', 'normal');

    const savingsItems = [
        ['Pokok', savingsByType.POKOK],
        ['Wajib', savingsByType.WAJIB],
        ['Total Simpanan', totalSavings]
    ];

    savingsItems.forEach((item, i) => {
        const y = savingsY + 6 + (i * 6);
        doc.text(item[0], leftColX, y);
        doc.text(parseFloat(item[1]).toLocaleString('id-ID'), labelX + 20, y, { align: 'right' });
        if (item[0] === 'Total Simpanan') {
            doc.line(labelX, y - 4, labelX + 25, y - 4);
        }
    });

    // Data Pinjaman (Outstanding Table)
    const activeLoanY = savingsY + 35;
    doc.setFont('helvetica', 'bold');
    doc.text('Data Pinjaman (Berjalan)', leftColX, activeLoanY);

    autoTable(doc, {
        startY: activeLoanY + 2,
        margin: { left: margin, right: margin },
        head: [['No SP', 'Jenis Pinjaman', 'Ang. Ke/dr', 'Outstanding', 'Bunga', 'Total', 'Ang. / Bln']],
        body: [
            ...outstandingData,
            [{ content: 'Jumlah', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            Math.round(grandOutstanding).toLocaleString('id-ID'),
            Math.round(grandBunga).toLocaleString('id-ID'),
            Math.round(grandTotal).toLocaleString('id-ID'),
            Math.round(grandAngBln).toLocaleString('id-ID')]
        ],
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1 },
        headStyles: { fontStyle: 'bold', borderBottom: { width: 0.5, color: [0, 0, 0] } },
        columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' }
        }
    });

    // Data Pinjaman (New Permohonan)
    const loanY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Analisa Permohonan Baru', leftColX, loanY);
    doc.setFont('helvetica', 'normal');

    // Use custom assessment data if provided, otherwise fallback to loan defaults
    const principal = customData && customData.amount ? parseFloat(customData.amount) : parseFloat(loan.jumlah_pinjaman);
    const tenor = loan.tenor_bulan;

    let totalBunga = 0;
    let labelBunga = '0%';

    if (customData && customData.useInterest) {
        if (customData.interestType === 'PERSENAN') {
            const rate = parseFloat(customData.interestValue || 0);
            totalBunga = principal * (rate / 100) * (tenor / 12);
            labelBunga = `${rate}% (Flat/Thn)`;
        } else {
            totalBunga = parseFloat(customData.interestValue || 0);
            labelBunga = `Rp ${totalBunga.toLocaleString('id-ID')} (Nominal)`;
        }
    } else if (!customData && loan.tipe_bunga && loan.tipe_bunga !== 'NONE') {
        // Fallback to loan saved state if no customData passed
        if (loan.tipe_bunga === 'PERSENAN') {
            const rate = parseFloat(loan.nilai_bunga || 0);
            totalBunga = principal * (rate / 100) * (tenor / 12);
            labelBunga = `${rate}% (Flat/Thn)`;
        } else {
            totalBunga = parseFloat(loan.nilai_bunga || 0);
            labelBunga = `Rp ${totalBunga.toLocaleString('id-ID')} (Nominal)`;
        }
    }

    const roundedBunga = Math.round(totalBunga);
    const totalKewajiban = principal + roundedBunga;
    const cicilan = Math.ceil(totalKewajiban / tenor);

    autoTable(doc, {
        startY: loanY + 2,
        margin: { left: margin, right: margin },
        head: [['Keterangan Analisa', 'Detail Nilai']],
        body: [
            ['Permohonan Pinjaman (Member)', `Rp ${parseFloat(loan.jumlah_pengajuan || loan.jumlah_pinjaman).toLocaleString('id-ID')}`],
            ['Nominal Pinjaman (Analisa)', `Rp ${principal.toLocaleString('id-ID')} (${numberToWords(principal).toUpperCase()} RUPIAH)`],
            ['Jangka Waktu (Tenor)', `${tenor} Bulan`],
            ['Suku Bunga / Margin', labelBunga],
            ['Total Bunga / Margin', `Rp ${roundedBunga.toLocaleString('id-ID')}`],
            ['Total Kewajiban', `Rp ${totalKewajiban.toLocaleString('id-ID')} (${numberToWords(totalKewajiban).toUpperCase()} RUPIAH)`],
            ['Angsuran Per Bulan', `Rp ${cicilan.toLocaleString('id-ID')}`],
            ['Jenis Pinjaman', (loan.jenis_pinjaman || 'BIASA').toUpperCase()],
            ['Keperluan', loan.keperluan || '-']
        ],
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fontStyle: 'bold', borderBottom: { width: 0.5, color: [0, 0, 0] } },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { halign: 'left' }
        }
    });

    // Signatures
    const sigY = doc.lastAutoTable.finalY + 30;
    const sigCol = pageWidth / 4;

    doc.text('Ketua', sigCol, sigY, { align: 'center' });
    doc.text('Bendahara', sigCol * 2, sigY, { align: 'center' });
    doc.text('Sekretaris', sigCol * 3, sigY, { align: 'center' });

    if (isDownload) {
        doc.save(`Analisa_Pinjaman_${loan.no_pinjaman}.pdf`);
    } else {
        const blobString = doc.output('bloburl');
        window.open(blobString, '_blank');
    }
};
