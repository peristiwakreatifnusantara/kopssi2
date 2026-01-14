import jsPDF from 'jspdf';

export const generateMemberApplicationPDF = async (member, isPreview = false) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    const LOGO_URL = '/logokop.png'; // pastikan public (public folder / URL supabase)

    // ================= FORMAT HELPERS =================
    const formatDate = (dateString) => {
        if (!dateString) return '.................................';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatMonthYear = (dateString) => {
        if (!dateString) return '.................................';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
    };

    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    };

    // ================= HEADER (LOGO + TEXT) =================
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);

    const headerY = 14;

    // 🔧 ATUR UKURAN LOGO DI SINI (mm)
    const logoWidth = 64;   // ← ubah sesuai kebutuhan
    const logoHeight = 28;  // ← ubah sesuai kebutuhan

    try {
        const logoImg = await loadImage(LOGO_URL);
        doc.addImage(
            logoImg,
            'PNG',
            margin,
            headerY - logoHeight / 2, // center vertikal
            logoWidth,
            logoHeight
        );
    } catch (e) {
        console.warn('Logo gagal dimuat', e);
    }

    // Text di samping logo
    doc.text(
        'Bellagio Office Park Unit OUG 31-32\nJl. Mega Kuningan Barat Kav.E.4-3',
        margin + logoWidth + 59,
        headerY
    );

    // Garis kop
    doc.setLineWidth(1.5);
    doc.line(margin, headerY + 10, pageWidth - margin, headerY + 10);

    // ================= DATE & INTRO =================
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text(
        `Jakarta, ${formatDate(member.created_at)}`,
        pageWidth - margin - 65,
        headerY + 20
    );

    doc.text('Hal : Pendaftaran anggota KOPSSI', margin, headerY + 20);
    doc.text('Lamp. : 1 (satu) lembar fotokopi KTP', margin, headerY + 25);

    // ================= RECIPIENT =================
    const recipientY = headerY + 35;
    doc.text('Kepada', margin + 40, recipientY);

    doc.setFont('helvetica', 'bold');
    doc.text('Koperasi Simpan Pinjam Swadharma', margin + 40, recipientY + 5);

    doc.setFont('helvetica', 'normal');
    doc.text('Bellagio Office Park Unit OUG 31-32', margin + 40, recipientY + 10);
    doc.text('Setiabudi', margin, recipientY + 15);
    doc.text('Kuningan - Jakarta Selatan', pageWidth - margin - 50, recipientY + 15);

    // ================= BODY =================
    const bodyY = recipientY + 30;
    doc.text('Yang bertanda tangan di bawah ini:', margin + 20, bodyY);

    const fields = [
        ['Nama / NPP', `: ${member.full_name || '-'} / ${member.no_npp || '-'}`],
        ['Perusahaan', `: ${member.company || '-'}`],
        ['Status pegawai', `: ${member.employment_status || '-'}`],
        ['Unit kerja', `: ${member.work_unit || '-'}`],
    ];

    fields.forEach((f, i) => {
        const y = bodyY + 12 + i * 8;
        doc.text(`- ${f[0]}`, margin + 35, y);
        doc.text(f[1], margin + 80, y);
    });

    const text1 =
        'dengan ini mengajukan permohonan menjadi anggota Koperasi Simpan Pinjam Swadharma (KOPSSI) dan bersedia mematuhi ketentuan-ketentuan yang ditetapkan dalam Anggaran Dasar dan Anggaran Rumah Tangga KOPSSI.';
    const text2 =
        'Sesuai dengan persyaratan yang telah ditetapkan, kami bersedia membayar:';

    let currentY = bodyY + 50;
    const splitText1 = doc.splitTextToSize(
        text1,
        pageWidth - margin * 2 - 20
    );
    doc.text(splitText1, margin + 5, currentY);

    currentY += splitText1.length * 5 + 5;
    doc.text(text2, margin + 5, currentY);

    currentY += 8;
    doc.text(
        '1. Simpanan Pokok sebesar Rp. 200.000,00 (Dua ratus ribu rupiah) yang diangsur sebanyak 3',
        margin + 5,
        currentY
    );
    currentY += 5;
    doc.text('   (tiga) kali/bulan.', margin + 5, currentY);

    currentY += 8;
    doc.text(
        '2. Simpanan Wajib sebesar Rp. 75.000,00 (tujuh puluh lima ribu rupiah) per bulan.',
        margin + 5,
        currentY
    );

    currentY += 12;
    doc.text(
        'Simpanan Pokok dan Simpanan Wajib tersebut di atas dapat langsung dipotong dari gaji saya',
        margin + 5,
        currentY
    );
    currentY += 5;
    doc.text(
        `setiap bulan, terhitung mulai bulan ${formatMonthYear(member.created_at)}`,
        margin + 5,
        currentY
    );

    currentY += 12;
    doc.text(
        'Bersama ini kami sampaikan 1 (satu) lembar fotokopi identitas atas nama saya.',
        margin + 5,
        currentY
    );

    currentY += 12;
    doc.text(
        'Demikianlah permohonan menjadi anggota KOPSSI ini dibuat dengan sebenarnya.',
        margin + 5,
        currentY
    );

    // ================= SIGNATURE =================
    currentY += 15;
    const boxWidth = 30;
    const boxHeight = 40;

    doc.rect(margin + 25, currentY, boxWidth, boxHeight);
    doc.text('*Pas Foto', margin + 25, currentY + boxHeight + 5);

    const signX = margin + boxWidth * 2 + 50;
    const signY = currentY + boxHeight;

    doc.text(formatDate(member.created_at), signX, currentY - 5);
    doc.text('(......................................................)', signX, signY);
    doc.text(member.full_name || '', signX + 28, signY + 6, { align: 'center' });

    // ================= IMAGES =================
    if (member.photo_34_file_path) {
        try {
            const img = await loadImage(member.photo_34_file_path);
            doc.addImage(
                img,
                'JPEG',
                margin + 27,
                currentY + 2,
                boxWidth - 4,
                boxHeight - 4
            );
        } catch (e) {
            console.warn('Foto gagal dimuat', e);
        }
    }

    if (member.signature_image) {
        try {
            const img = await loadImage(member.signature_image);
            doc.addImage(img, 'PNG', signX + 5, signY - 22, 45, 20);
        } catch (e) {
            console.warn('TTD gagal dimuat', e);
        }
    }

    // ================= OUTPUT =================
    if (isPreview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Pendaftaran_Anggota_${member.nik || 'Data'}.pdf`);
    }
};
