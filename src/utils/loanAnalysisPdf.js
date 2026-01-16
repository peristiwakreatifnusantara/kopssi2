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

const diffMonths = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
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
        .eq('status', 'DICAIRKAN')
        .neq('id', loan.id);

    const outstandingData = [];
    let grandOutstanding = 0;
    let grandBunga = 0;
    let grandTotal = 0;
    let grandAngBln = 0;

    if (activeLoans) {
        for (const al of activeLoans) {
            // Fetch all installments to calculate paid/unpaid counts
            const { data: loanInstallments } = await supabase
                .from('angsuran')
                .select('*')
                .eq('pinjaman_id', al.id);

            const principal = parseFloat(al.jumlah_pinjaman || 0);
            const tenor = al.tenor_bulan || 1;

            const paidCount = (loanInstallments || []).filter(inst => inst.status === 'PAID').length;
            const unpaidCount = Math.max(tenor - paidCount, 0);

            let totalInterestLoan = 0;
            if (al.tipe_bunga === 'PERSENAN') {
                totalInterestLoan = principal * (parseFloat(al.nilai_bunga || 0) / 100) * (tenor / 12);
            } else if (al.tipe_bunga === 'NOMINAL') {
                totalInterestLoan = parseFloat(al.nilai_bunga || 0);
            }

            const remPrincipal = (principal / tenor) * unpaidCount;
            const remBunga = (totalInterestLoan / tenor) * unpaidCount;

            const totalBayar = principal + totalInterestLoan;
            const angBln = Math.ceil(totalBayar / tenor);

            outstandingData.push([
                al.no_pinjaman,
                (al.jenis_pinjaman || 'BIASA').toUpperCase(),
                `${paidCount}/${tenor}`,
                Math.round(remPrincipal).toLocaleString('id-ID'),
                Math.round(remBunga).toLocaleString('id-ID'),
                angBln.toLocaleString('id-ID')
            ]);

            grandOutstanding += remPrincipal;
            grandBunga += remBunga;
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

    // No Permohonan Block (Top Right in original/standard, but layout requested puts it there)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No Permohonan', 130, 52);
    doc.text(': ' + loan.no_pinjaman, 160, 52);
    doc.text('Tgl Permohonan', 130, 57);
    doc.text(': ' + formatDate(loan.created_at), 160, 57);

    // Member Info Layout
    const infoY = 55;
    const col1X = margin;
    const col1LabelW = 35;
    const col1ValX = col1X + col1LabelW;

    const col2X = 110;
    // Actually the requested design has a split layout for some items

    // Left side items
    const leftItems = [
        ['No Anggota', loan.personal_data?.no_anggota || '-'],
        ['NPP', loan.personal_data?.no_npp || '-'],
        ['Nama Lengkap', loan.personal_data?.full_name || '-'],
        ['Alamat', loan.personal_data?.address || '-'],
        ['Tempat Lahir', loan.personal_data?.tempat_lahir || '-'], // Can combine with Tgl Lahir
        ['Unit Kerja', loan.personal_data?.work_unit || '-'],
        ['Status Pegawai', loan.personal_data?.employment_status || '-'],
        ['Tgl Keanggotaan', formatDate(loan.personal_data?.created_at)]
    ];

    let currentY = infoY;
    leftItems.forEach((item) => {
        currentY += 5;
        doc.text(item[0], col1X, currentY);
        doc.text(':', col1ValX - 2, currentY);

        let val = item[1];
        if (item[0] === 'Tempat Lahir' && loan.personal_data?.tanggal_lahir) {
            // Split across page?
            // The image shows "Tempat Lahir : ...   Tgl Lahir : ...   Usia : ..."
            // This is tricky. Let's just print simple for now or try to match.
            // If "Tempat Lahir", we print Value then Tgl Lahir next to it.
            const tglLahir = formatDate(loan.personal_data.tanggal_lahir);

            // Calculate Age roughly
            const dob = new Date(loan.personal_data.tanggal_lahir);
            const ageDiff = Date.now() - dob.getTime();
            const ageDate = new Date(ageDiff);
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);

            doc.text(val, col1ValX, currentY);
            doc.text('Tgl Lahir : ' + tglLahir, col1ValX + 50, currentY);
            doc.text('Usia : ' + age + ' Tahun', col1ValX + 110, currentY);
            return;
        }

        if (item[0] === 'Tgl Keanggotaan') {
            const joinDate = loan.personal_data?.join_date || loan.personal_data?.created_at;
            const lamaBulan = joinDate ? diffMonths(joinDate, new Date()) : 0;

            doc.text(formatDate(joinDate), col1ValX, currentY);
            // Right side items aligned with this
            // Rekening info seems to be here in the image
            // We can place it manually or relative

            // "Lama Keanggotaan : ... Bulan" aligned rightish
            // doc.text(`Lama Keanggotaan : ${lamaBulan} Bulan`, 110, currentY); // Keeping this or removing? User said "until Tgl Keanggotaan". 
            // Let's keep Lama Keanggotaan as it is part of the date context usually, but remove accounts.
            doc.text(`Lama Keanggotaan : ${lamaBulan} Bulan`, 110, currentY);
            return;
        }

        doc.text(val.toString(), col1ValX, currentY);

        if (item[0] === 'Status Pegawai') {
            // Add Masa Kerja if available? The image shows "Masa Kerja : -"
            // We don't have masa kerja calculated easily usually unless from join_date of work?
            // Just hardcode placeholder or omit if not in data
            doc.text('Masa Kerja : -', 130, currentY);
        }
    });

    // Data Simpanan
    currentY += 10;
    doc.setFont('helvetica', 'underline');
    doc.text('Data Simpanan', col1X, currentY);
    doc.setFont('helvetica', 'normal');

    const savingsY = currentY + 5;
    doc.text('Pokok', col1X, savingsY);
    doc.text(savingsByType.POKOK.toLocaleString('id-ID'), col1ValX + 20, savingsY, { align: 'right' });

    doc.text('Wajib', col1X, savingsY + 5);
    doc.text(savingsByType.WAJIB.toLocaleString('id-ID'), col1ValX + 20, savingsY + 5, { align: 'right' });

    doc.text('Total Simpanan', col1X, savingsY + 10);
    doc.text(totalSavings.toLocaleString('id-ID'), col1ValX + 20, savingsY + 10, { align: 'right' });

    // Data Pinjaman Table
    currentY = savingsY + 20;
    doc.setFont('helvetica', 'underline');
    doc.text('Data Pinjaman', col1X, currentY);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
        startY: currentY + 5,
        head: [['No Pinjaman', 'Jenis Pinjaman', 'Angsuran Terbayar', 'Outstanding', 'Bunga Outstanding', 'Angsuran / Bln']],
        body: outstandingData,
        foot: [['TOTAL', '', '',
            Math.round(grandOutstanding).toLocaleString('id-ID'),
            Math.round(grandBunga).toLocaleString('id-ID'),
            Math.round(grandAngBln).toLocaleString('id-ID')
        ]],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', halign: 'center' },
        footStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', halign: 'right' },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        },
        margin: { left: margin, right: margin },
    });

    // Data Topup & Angsuran Section
    // Calculate new loan details
    const principal = customData && customData.amount ? parseFloat(customData.amount) : parseFloat(loan.jumlah_pinjaman);
    const tenor = loan.tenor_bulan; // Or customData if editable

    let totalBunga = 0;
    if (customData && customData.useInterest) {
        if (customData.interestType === 'PERSENAN') {
            const rate = parseFloat(customData.interestValue || 0);
            totalBunga = principal * (rate / 100) * (tenor / 12);
        } else {
            totalBunga = parseFloat(customData.interestValue || 0);
        }
    } else if (!customData && loan.tipe_bunga && loan.tipe_bunga !== 'NONE') {
        if (loan.tipe_bunga === 'PERSENAN') {
            const rate = parseFloat(loan.nilai_bunga || 0);
            totalBunga = principal * (rate / 100) * (tenor / 12);
        } else {
            totalBunga = parseFloat(loan.nilai_bunga || 0);
        }
    }

    const roundedBunga = Math.round(totalBunga);
    const totalKewajiban = principal + roundedBunga;
    const cicilan = Math.ceil(totalKewajiban / tenor);

    let nextY = doc.lastAutoTable.finalY + 10;

    // Permohonan Pinjaman Section
    doc.setFont('helvetica', 'underline');
    doc.text('Permohonan Pinjaman', col1X, nextY);
    doc.setFont('helvetica', 'normal');

    nextY += 5;
    doc.text('Jumlah Pinjaman', col1X, nextY);
    doc.text(`: Rp.${principal.toLocaleString('id-ID')}`, 60, nextY);
    doc.text(`(${numberToWords(principal).toUpperCase()} )`, 110, nextY);

    nextY += 5;
    doc.text('Jangka Waktu', col1X, nextY);
    doc.text(`: ${tenor} Bulan`, 60, nextY);

    // Data Angsuran
    nextY += 10;
    doc.setFont('helvetica', 'underline');
    doc.text('Data Angsuran', col1X, nextY);
    doc.setFont('helvetica', 'normal');

    // Pendapat Analis Kredit block on the right?
    const analisX = 110;
    doc.setFont('helvetica', 'underline');
    doc.text('Pendapat Analis Kredit :', analisX, nextY);
    doc.setFont('helvetica', 'normal');
    doc.text('-', analisX, nextY + 5);

    nextY += 5;
    doc.text('Angsuran dilunasi', col1X, nextY);
    // Hardcoded to 0 as per instruction unless we have refinance logic (not requested to implement deep logic, just visual)
    doc.text(':', 60, nextY);
    doc.text('0', 80, nextY, { align: 'right' });

    nextY += 5;
    doc.text('Total Angsuran', col1X, nextY);
    doc.text(':', 60, nextY);
    doc.text(cicilan.toLocaleString('id-ID'), 80, nextY, { align: 'right' });

    nextY += 5;
    doc.text('Jangka Waktu', col1X, nextY);
    doc.text(`: ${tenor} Bulan`, 60, nextY);

    nextY += 5;
    doc.text('Jenis Pinjaman', col1X, nextY);
    doc.text(`: ${(loan.jenis_pinjaman || 'BARANG').toUpperCase()}`, 60, nextY);

    nextY += 5;
    doc.text('Untuk Keperluan', col1X, nextY);
    doc.text(`: ${loan.keperluan || '-'}`, 60, nextY);

    // Signatures
    const sigY = nextY + 25;
    doc.text('Disposisi :', col1X, sigY - 10);

    const colSigWidth = pageWidth / 4;
    doc.text('Ketua', colSigWidth, sigY, { align: 'center' });
    doc.text('Bendahara', colSigWidth * 2, sigY, { align: 'center' });
    doc.text('Sekretaris', colSigWidth * 3, sigY, { align: 'center' });

    if (isDownload) {
        doc.save(`Analisa_Pinjaman_${loan.no_pinjaman}.pdf`);
    } else {
        const blobString = doc.output('bloburl');
        window.open(blobString, '_blank');
    }
};
