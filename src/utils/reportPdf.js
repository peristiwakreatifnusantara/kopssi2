import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

export const generateMonthlyFinancialPDF = (stats) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const now = new Date();
    const monthYear = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEUANGAN BULANAN', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${monthYear}`, pageWidth / 2, 26, { align: 'center' });

    doc.line(margin, 30, pageWidth - margin, 30);

    // Summary Table
    autoTable(doc, {
        startY: 40,
        margin: { left: margin, right: margin },
        head: [['Kategori', 'Keterangan', 'Jumlah']],
        body: [
            ['PENDAPATAN', 'Total Simpanan Masuk (Setor)', formatCurrency(stats.simpananSetor || 0)],
            ['PENDAPATAN', 'Total Angsuran Pinjaman (Paid)', formatCurrency(stats.totalAngsuran || 0)],
            [{ content: 'TOTAL PENDAPATAN', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(stats.monthlyIncome), styles: { fontStyle: 'bold', fillColor: [240, 255, 240] } }],
            ['', '', ''],
            ['PENGELUARAN', 'Total Penarikan Simpanan (Tarik)', formatCurrency(stats.simpananTarik || 0)],
            ['PENGELUARAN', 'Total Pencairan Pinjaman Baru', formatCurrency(stats.totalDisbursed || 0)],
            [{ content: 'TOTAL PENGELUARAN', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(stats.monthlyExpense), styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } }],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
    });

    // Net Cashflow
    const finalY = doc.lastAutoTable.finalY + 15;
    const cashflow = stats.monthlyIncome - stats.monthlyExpense;

    doc.setFont('helvetica', 'bold');
    doc.text('Arus Kas Bersih (Net Cashflow):', margin, finalY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cashflow >= 0 ? [16, 185, 129] : [220, 38, 38]);
    doc.text(formatCurrency(cashflow), pageWidth - margin, finalY, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, margin, footerY);

    doc.save(`Laporan_Keuangan_${monthYear.replace(' ', '_')}.pdf`);
};

export const generateActivePortfolioPDF = (activeData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const monthYear = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAPITULASI PINJAMAN & SIMPANAN AKTIF', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Per Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 26, { align: 'center' });

    doc.line(margin, 30, pageWidth - margin, 30);

    autoTable(doc, {
        startY: 40,
        margin: { left: margin, right: margin },
        head: [['Nama Anggota', 'NIK', 'Saldo Simpanan', 'Hutang Berjalan']],
        body: activeData.map(item => [
            item.full_name,
            item.nik,
            formatCurrency(item.savingsBalance),
            formatCurrency(item.loanBalance)
        ]),
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
    });

    doc.save(`Laporan_Portofolio_Aktif_${monthYear.replace(' ', '_')}.pdf`);
};
