import { PDFDocument } from 'pdf-lib';

/**
 * Generates an authentic, high-resolution Khmer sample PDF document
 * with real Khmer administrative typography and subscript consonants ("ជើង").
 */
export async function createKhmerSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // We render 2 pages onto off-screen canvases at 2x crisp resolution
  const width = 1240;
  const height = 1754; // A4 @ 150 DPI

  // Ensure fonts are loaded
  await document.fonts.ready;

  // Page 1: Administrative Letter / Technology Report
  const canvas1 = document.createElement('canvas');
  canvas1.width = width;
  canvas1.height = height;
  const ctx1 = canvas1.getContext('2d')!;

  // Background
  ctx1.fillStyle = '#ffffff';
  ctx1.fillRect(0, 0, width, height);

  // Decorative border
  ctx1.strokeStyle = '#1e3a8a';
  ctx1.lineWidth = 4;
  ctx1.strokeRect(40, 40, width - 80, height - 80);
  ctx1.strokeStyle = '#93c5fd';
  ctx1.lineWidth = 1;
  ctx1.strokeRect(48, 48, width - 96, height - 96);

  // Top Khmer Motto in authentic Muol calligraphic font
  ctx1.fillStyle = '#1e293b';
  ctx1.textAlign = 'center';
  ctx1.font = 'bold 28px "Moul", "Khmer OS Muol Light", "Kantumruy Pro", sans-serif';
  ctx1.fillText('ព្រះរាជាណាចក្រកម្ពុជា', width / 2, 110);
  ctx1.font = 'bold 22px "Moul", "Khmer OS Muol Light", "Kantumruy Pro", sans-serif';
  ctx1.fillText('ជាតិ  សាសនា  ព្រះមហាក្សត្រ', width / 2, 150);

  // Decorative divider
  ctx1.fillStyle = '#2563eb';
  ctx1.fillRect(width / 2 - 80, 170, 160, 3);

  // Ministry & Date header
  ctx1.textAlign = 'left';
  ctx1.fillStyle = '#334155';
  ctx1.font = 'bold 22px "Kantumruy Pro", sans-serif';
  ctx1.fillText('ក្រសួងប្រៃសណីយ៍ និងទូរគមនាគមន៍', 80, 230);
  ctx1.font = '18px "Kantumruy Pro", sans-serif';
  ctx1.fillText('អគ្គនាយកដ្ឋានបច្ចេកវិទ្យាឌីជីថល', 80, 265);
  ctx1.fillText('លេខ៖ ០៩៨/២៦ ក.ប.ទ.ក', 80, 300);

  ctx1.textAlign = 'right';
  ctx1.fillText('រាជធានីភ្នំពេញ, ថ្ងៃទី២១ ខែកញ្ញា ឆ្នាំ២០២៦', width - 80, 230);
  ctx1.fillText('ឯកសារសម្ងាត់ / CONFIDENTIAL', width - 80, 265);

  // Subject line
  ctx1.textAlign = 'center';
  ctx1.font = 'bold 26px "Kantumruy Pro", sans-serif';
  ctx1.fillStyle = '#0f172a';
  ctx1.fillText('លិខិតស្តីពី៖ ការគ្រប់គ្រងទិន្នន័យ និងប្រព័ន្ធសុវត្ថិភាពឯកសារឌីជីថល (PDF Shield)', width / 2, 380);

  // Body paragraphs demonstrating complex Khmer consonants, subscripts & vowels
  ctx1.textAlign = 'left';
  ctx1.font = '20px "Kantumruy Pro", sans-serif';
  ctx1.fillStyle = '#1e293b';

  const p1 = 'សូមជម្រាបជូន ឯកឧត្តម លោកជំទាវ និងលោក-លោកស្រី មេត្តាជ្រាបថា៖ ស្របតាមយុទ្ធសាស្ត្របញ្ចកោណដំណាក់កាលទី១ របស់រាជរដ្ឋាភិបាលកម្ពុជា ការការពារសន្តិសុខបច្ចេកវិទ្យាគមនាគមន៍ និងការរក្សាការសម្ងាត់នៃឯកសារផ្លូវការ គឺជាអាទិភាពចម្បងដែលមិនអាចខ្វះបានឡើយ។';
  wrapText(ctx1, p1, 80, 440, width - 160, 34);

  const p2 = 'តាមរយៈការអភិវឌ្ឍប្រព័ន្ធគ្រប់គ្រង PDF នេះ អត្ថប្រយោជន៍គន្លឹះរួមមាន៖ ការបម្លែងឯកសារទៅជារូបភាពគុណភាពខ្ពស់ដោយមិនបាត់បង់ជើងអក្សរខ្មែរ ("អក្សរមិនខុសដៃជើង") ការស្រង់អត្ថបទដោយបញ្ញាសិប្បនិម្មិត (AI OCR) និងប្រព័ន្ធការពារចាក់សោដោយលេខសម្ងាត់កម្រិតខ្ពស់ (AES-128/256)។';
  wrapText(ctx1, p2, 80, 560, width - 160, 34);

  // Table with data
  const tableY = 690;
  ctx1.fillStyle = '#f1f5f9';
  ctx1.fillRect(80, tableY, width - 160, 45);
  ctx1.strokeStyle = '#cbd5e1';
  ctx1.strokeRect(80, tableY, width - 160, 220);

  ctx1.font = 'bold 18px "Kantumruy Pro", sans-serif';
  ctx1.fillStyle = '#1e293b';
  ctx1.fillText('ល.រ', 110, tableY + 30);
  ctx1.fillText('មុខងារបច្ចេកវិទ្យា', 220, tableY + 30);
  ctx1.fillText('កម្រិតសុវត្ថិភាព', 680, tableY + 30);
  ctx1.fillText('ស្ថានភាពអនុវត្ត', 950, tableY + 30);

  const rows = [
    ['០១', 'ការបម្លែងរូបភាព (PNG/JPG 300 DPI)', 'រក្សាទ្រង់ទ្រាយ ១០០%', 'រួចរាល់'],
    ['០២', 'ការស្រង់អក្សរខ្មែរ (Gemini Vision OCR)', 'គ្មានកំហុសជើងអក្សរ', 'ដំណើរការល្អ'],
    ['០៣', 'ប្រព័ន្ធចាក់សោដោយលេខសម្ងាត់', 'ការពារទិន្នន័យសម្ងាត់', 'សុវត្ថិភាពខ្ពស់'],
    ['០៤', 'ការបោះត្រាទឹក (Watermark Shield)', 'ការពារការលួចចម្លង', 'សកម្ម'],
  ];

  rows.forEach((row, idx) => {
    const y = tableY + 85 + idx * 42;
    ctx1.strokeStyle = '#e2e8f0';
    ctx1.beginPath();
    ctx1.moveTo(80, y - 10);
    ctx1.lineTo(width - 80, y - 10);
    ctx1.stroke();

    ctx1.font = '18px "Kantumruy Pro", sans-serif';
    ctx1.fillStyle = '#334155';
    ctx1.fillText(row[0], 110, y + 15);
    ctx1.fillText(row[1], 220, y + 15);
    ctx1.fillText(row[2], 680, y + 15);
    ctx1.fillStyle = '#16a34a';
    ctx1.fillText(row[3], 950, y + 15);
  });

  // Signatures & Official Stamp placeholder
  ctx1.font = 'bold 20px "Kantumruy Pro", sans-serif';
  ctx1.fillStyle = '#1e293b';
  ctx1.textAlign = 'right';
  ctx1.fillText('ប្រធាននាយកដ្ឋានបច្ចេកវិទ្យាគមនាគមន៍', width - 120, 1120);

  // Official Stamp Graphic
  ctx1.strokeStyle = '#dc2626';
  ctx1.lineWidth = 3;
  ctx1.beginPath();
  ctx1.arc(width - 220, 1260, 65, 0, Math.PI * 2);
  ctx1.stroke();
  ctx1.font = 'bold 14px "Kantumruy Pro", sans-serif';
  ctx1.fillStyle = '#dc2626';
  ctx1.textAlign = 'center';
  ctx1.fillText('ក្រសួងប្រៃសណីយ៍', width - 220, 1245);
  ctx1.fillText('★ សម្ងាត់ផ្លូវការ ★', width - 220, 1265);
  ctx1.fillText('កម្ពុជា ២០២៦', width - 220, 1285);

  ctx1.font = 'bold 20px "Kantumruy Pro", sans-serif';
  ctx1.fillStyle = '#1e293b';
  ctx1.fillText('បណ្ឌិត សុខ វិបុល', width - 220, 1370);

  // Page 1 Footer
  ctx1.font = '14px "Kantumruy Pro", sans-serif';
  ctx1.fillStyle = '#94a3b8';
  ctx1.textAlign = 'center';
  ctx1.fillText('ទំព័រទី ១ នៃ ២ — បង្កើតដោយ Secure PDF Manager & Khmer Shield', width / 2, height - 60);

  // Page 2: Security & Confidentiality Clauses
  const canvas2 = document.createElement('canvas');
  canvas2.width = width;
  canvas2.height = height;
  const ctx2 = canvas2.getContext('2d')!;

  ctx2.fillStyle = '#ffffff';
  ctx2.fillRect(0, 0, width, height);

  ctx2.strokeStyle = '#1e3a8a';
  ctx2.lineWidth = 4;
  ctx2.strokeRect(40, 40, width - 80, height - 80);

  ctx2.fillStyle = '#1e293b';
  ctx2.textAlign = 'center';
  ctx2.font = 'bold 26px "Kantumruy Pro", sans-serif';
  ctx2.fillText('ឧបសម្ព័ន្ធទី ២៖ លក្ខខណ្ឌសន្តិសុខ និងការការពារទិន្នន័យផ្ទាល់ខ្លួន', width / 2, 110);

  ctx2.fillStyle = '#2563eb';
  ctx2.fillRect(width / 2 - 120, 135, 240, 3);

  ctx2.textAlign = 'left';
  ctx2.font = 'bold 22px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#0f172a';
  ctx2.fillText('មាត្រា ១៖ សិទ្ធិទទួលបាន និងការបើកឯកសារសម្ងាត់', 80, 200);

  ctx2.font = '19px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#334155';
  wrapText(ctx2, 'ឯកសារនេះត្រូវបានការពារដោយកូដនីយកម្មលេខសម្ងាត់ (Encrypted Password)។ បុគ្គលដែលពុំមានការអនុញ្ញាត ឬពុំមានលេខសម្ងាត់ត្រឹមត្រូវ មិនត្រូវបានអនុញ្ញាតឱ្យបើក កែសម្រួល បោះពុម្ព ឬចម្លងខ្លឹមសារជាដាច់ខាត។', 80, 240, width - 160, 32);

  ctx2.font = 'bold 22px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#0f172a';
  ctx2.fillText('មាត្រា ២៖ ការរក្សាភាពសុក្រឹតនៃអក្សរសាស្ត្រខ្មែរ', 80, 380);

  ctx2.font = '19px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#334155';
  wrapText(ctx2, 'រាល់ការបម្លែងឯកសារទៅជាអត្ថបទ (Text) ឬរូបភាព (PNG/JPG) ត្រូវតែធានាថាមិនមានការបាត់បង់ ឬប្រែប្រួលជើងព្យញ្ជនៈខ្មែរឡើយ (ដូចជា៖ ក្ដ, ក្ខ, គ្ម, ណ្ឌ, ម្ភ, ល្ង, ស្ម, ហ្ម ជាដើម) ដើម្បីធានាបាននូវភាពត្រឹមត្រូវតាមវចនានុក្រមសម្តេចព្រះសង្ឃរាជ ជួន ណាត។', 80, 420, width - 160, 32);

  ctx2.font = 'bold 22px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#0f172a';
  ctx2.fillText('មាត្រា ៣៖ បច្ចេកវិទ្យាបោះត្រាទឹកសម្គាល់ (Digital Watermark)', 80, 560);

  ctx2.font = '19px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#334155';
  wrapText(ctx2, 'ដើម្បីការពារការចែកចាយដោយខុសច្បាប់ អ្នកប្រើប្រាស់អាចដាក់ត្រាទឹក "សម្ងាត់" ឬ "CONFIDENTIAL" លើទំព័រទាំងអស់នៃឯកសារ មុនពេលទាញយក ឬផ្ញើបន្ត។', 80, 600, width - 160, 32);

  // Security Checklist Box
  ctx2.fillStyle = '#eff6ff';
  ctx2.fillRect(80, 720, width - 160, 240);
  ctx2.strokeStyle = '#bfdbfe';
  ctx2.strokeRect(80, 720, width - 160, 240);

  ctx2.font = 'bold 20px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#1e40af';
  ctx2.fillText('✓ បញ្ជីផ្ទៀងផ្ទាត់សុវត្ថិភាពឯកសារ (Security Verification Check)', 110, 765);

  ctx2.font = '18px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#1e3a8a';
  const checks = [
    '• កូដនីយកម្មលេខសម្ងាត់អ្នកប្រើប្រាស់ (User Password)៖ ដំណើរការ',
    '• កូដនីយកម្មលេខសម្ងាត់ម្ចាស់ឯកសារ (Owner Password)៖ ដំណើរការ',
    '• មុខងារកំណត់ការហាមចម្លង និងហាមបោះពុម្ព (Copy & Print Protection)៖ គាំទ្រ',
    '• ប្រព័ន្ធ Gemini AI OCR ស្រង់អក្សរខ្មែរត្រឹមត្រូវ ១០០%៖ គាំទ្រ',
  ];
  checks.forEach((c, idx) => {
    ctx2.fillText(c, 120, 815 + idx * 36);
  });

  // Footer
  ctx2.font = '14px "Kantumruy Pro", sans-serif';
  ctx2.fillStyle = '#94a3b8';
  ctx2.textAlign = 'center';
  ctx2.fillText('ទំព័រទី ២ នៃ ២ — បង្កើតដោយ Secure PDF Manager & Khmer Shield', width / 2, height - 60);

  // Convert canvas to PNG blob and embed in pdf-lib
  const blob1 = await new Promise<Blob>((resolve) => canvas1.toBlob((b) => resolve(b!), 'image/png'));
  const blob2 = await new Promise<Blob>((resolve) => canvas2.toBlob((b) => resolve(b!), 'image/png'));

  const arrayBuffer1 = await blob1.arrayBuffer();
  const arrayBuffer2 = await blob2.arrayBuffer();

  const img1 = await pdfDoc.embedPng(arrayBuffer1);
  const img2 = await pdfDoc.embedPng(arrayBuffer2);

  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 in standard points
  page1.drawImage(img1, { x: 0, y: 0, width: 595.28, height: 841.89 });

  const page2 = pdfDoc.addPage([595.28, 841.89]);
  page2.drawImage(img2, { x: 0, y: 0, width: 595.28, height: 841.89 });

  return await pdfDoc.save();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
