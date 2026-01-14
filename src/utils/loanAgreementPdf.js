import jsPDF from 'jspdf';

/* =========================
   HELPER
========================= */

const numberToWords = (num) => {
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (num < 12) return units[num];
    if (num < 20) return numberToWords(num - 10) + ' Belas';
    if (num < 100) return numberToWords(Math.floor(num / 10)) + ' Puluh ' + numberToWords(num % 10);
    if (num < 200) return 'Seratus ' + numberToWords(num - 100);
    if (num < 1000) return numberToWords(Math.floor(num / 100)) + ' Ratus ' + numberToWords(num % 100);
    if (num < 2000) return 'Seribu ' + numberToWords(num - 1000);
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Ribu ' + numberToWords(num % 1000);
    return num.toString();
};

const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

/* =========================
   MAIN FUNCTION
========================= */

export const generateLoanAgreementPDF = async (loan) => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const margin = 15;
    const leftX = margin;
    const rightX = 115;
    const colWidth = 85;

    let yLeft = 35;
    let yRight = 35;

    /* =========================
       LOGO
    ========================= */
    const logo = new Image();
    logo.src = '/Logo.png';
    await new Promise((res) => (logo.onload = res));
    doc.addImage(logo, 'PNG', margin, 10, 16, 16);

    /* =========================
       STYLE DASAR
    ========================= */
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);     // lebih besar & nyaman
    const lineHeight = 5;   // spasi lebih lega

    const writeLeft = (text, gap = 4) => {
        const lines = doc.splitTextToSize(text, colWidth);
        doc.text(lines, leftX, yLeft);
        yLeft += lines.length * lineHeight + gap;
    };

    const writeRight = (text, gap = 4) => {
        const lines = doc.splitTextToSize(text, colWidth);
        doc.text(lines, rightX, yRight);
        yRight += lines.length * lineHeight + gap;
    };

    /* =========================
       HEADER
    ========================= */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    writeLeft('Koperasi Jasa Pegawai Swadharma Sarana Informatika', 2);

    doc.setFontSize(11);
    writeLeft('PERJANJIAN PINJAMAN ANGGOTA KOPERASI JASA', 1);
    writeLeft('PEGAWAI SWADHARMA SARANA INFORMATIKA', 2);

    doc.setFontSize(10);
    writeLeft(`Nomor : ${loan.no_pinjaman}`, 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    /* =========================
       BLOK IDENTITAS
    ========================= */

    writeLeft('Yang bertanda tangan dibawah ini :', 4);

    doc.setFont('helvetica', 'bold');
    writeLeft('I. R. LIZA SARASWATI', 1);

    doc.setFont('helvetica', 'normal');
    writeLeft(
        'selaku Pengurus KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA, oleh karena demikian berwenang bertindak untuk dan atas nama KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA. Untuk selanjutnya disebut ---- KOPSSI ----',
        5
    );

    const safe = (v) => v ?? '-';

    writeLeft(
        `II. NAMA : ${safe(loan.personal_data?.full_name)}
NPP  : ${safe(loan.personal_data?.no_npp)}
UNIT : ${safe(loan.personal_data?.work_unit)}
No. Anggota : ${safe(loan.personal_data?.no_anggota)}
KTP  : ${safe(loan.personal_data?.nik)}
untuk selanjutnya disebut :
---------------- PEMINJAM ----------------`,
        5
    );

    writeLeft(
        'Kedua belah pihak setuju dan sepakat menandatangani Perjanjian Pinjaman dengan syarat-syarat serta ketentuan-ketentuan sebagai berikut :',
        6
    );

    /* =========================
       PASAL KIRI
    ========================= */
    const pasalLeft = (title, text) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        writeLeft(title, 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        writeLeft(text, 5);
    };

    pasalLeft(
        'Pasal 1\nMAKSIMUM & TUJUAN PINJAMAN',
        `1. Maksimum Pinjaman sebesar Rp ${Number(loan.jumlah_pinjaman).toLocaleString('id-ID')} (${numberToWords(loan.jumlah_pinjaman)}).
Maksimum Pinjaman adalah fasilitas pinjaman tertinggi yang dapat ditarik oleh PEMINJAM setelah memenuhi semua syarat yang ditetapkan oleh KOPERASI JASA PEGAWAI SWADHARMA SARANA INFORMATIKA.
2. Tujuan Pinjaman untuk : ${loan.keperluan}`
    );

    pasalLeft('Pasal 2\nJANGKA WAKTU PINJAMAN', `Jangka waktu pinjaman adalah ${loan.tenor_bulan} (${numberToWords(loan.tenor_bulan)}) bulan.`);
    pasalLeft('Pasal 3\nSUKU BUNGA PINJAMAN & PROVISI', `Bunga Pinjaman sebesar ${(Number(loan.nilai_bunga || 0) / 12).toFixed(2)} % per bulan.`);
    pasalLeft('Pasal 4\nCARA PEMBAYARAN ANGSURAN', `Pembayaran dilakukan melalui potong gaji Pegawai ALIH DAYA JST tanggal 25 setiap bulannya.`);
    pasalLeft('Pasal 5\nJAMINAN', `Gaji, simpanan, dan/atau jaminan tambahan apabila diperlukan.`);
    pasalLeft('Pasal 6\nPELUNASAN', `Pinjaman wajib dilunasi apabila PEMINJAM berhenti bekerja atau keluar dari keanggotaan KOPSSI.`);
    pasalLeft('Pasal 7\nPASAL TAMBAHAN', `PEMINJAM wajib memberitahukan perubahan alamat atau pekerjaan.`);

    /* =========================
       KOLOM KANAN
    ========================= */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    writeRight('Pasal 8\nPENYELESAIAN PERSELISIHAN', 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    writeRight(
        'Perselisihan diselesaikan secara musyawarah dan apabila tidak tercapai, diselesaikan melalui Pengadilan Negeri Jakarta Selatan.',
        6
    );

    writeRight(`Perjanjian ini dibuat di Jakarta, ${formatDate(new Date())}`, 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    writeRight('KOPERASI JASA PEGAWAI\nSWADHARMA SARANA\nINFORMATIKA', 16);
    writeRight('PEMINJAM', 16);

    writeRight('R. LIZA SARASWATI', 0);
    writeRight(loan.personal_data?.full_name?.toUpperCase(), 0);

    /* =========================
       SAVE
    ========================= */
    doc.save(`SPK_Pinjaman_${loan.no_pinjaman}.pdf`);
};
