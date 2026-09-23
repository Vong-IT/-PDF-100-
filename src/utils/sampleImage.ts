/**
 * Helper to generate a sample Khmer administrative document as a high-resolution image (canvas to dataURL/File)
 * for testing Image-to-Word OCR and Image-to-Word document compilation.
 */
export async function createSampleKhmerImage(): Promise<{ file: File; dataUrl: string; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  // High-res A4 proportion: 1240 x 1754 (150 DPI)
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Left header: Ministry
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 26px "Khmer OS Muol Light", "Kantumruy Pro", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ក្រសួងអប់រំ យុវជន និងកីឡា', 80, 110);

  ctx.font = 'normal 20px "Kantumruy Pro", sans-serif';
  ctx.fillText('នាយកដ្ឋានបុគ្គលិក និងបណ្តុះបណ្តាល', 80, 145);
  ctx.fillText('លេខ ៖ ៤៥២ អយក.បុ', 80, 180);

  // Right header: Kingdom & Motto
  ctx.textAlign = 'right';
  ctx.font = 'bold 28px "Khmer OS Muol Light", "Kantumruy Pro", sans-serif';
  ctx.fillText('ព្រះរាជាណាចក្រកម្ពុជា', canvas.width - 80, 110);
  ctx.font = 'bold 24px "Khmer OS Muol Light", "Kantumruy Pro", sans-serif';
  ctx.fillText('ជាតិ  សាសនា  ព្រះមហាក្សត្រ', canvas.width - 80, 148);

  // Flourish
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#2563EB';
  ctx.fillText('~ ❖ ~', canvas.width - 190, 185);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'italic 19px "Kantumruy Pro", sans-serif';
  ctx.fillText('រាជធានីភ្នំពេញ, ថ្ងៃទី១៥ ខែកញ្ញា ឆ្នាំ២០២៦', canvas.width - 80, 220);

  // Title: Proclamation
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px "Khmer OS Muol Light", "Kantumruy Pro", sans-serif';
  ctx.fillStyle = '#1E3A8A';
  ctx.fillText('សេចក្តីប្រកាសព័ត៌មាន', canvas.width / 2, 320);

  ctx.font = 'bold 24px "Kantumruy Pro", sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText('ស្តីពី ការបើកវគ្គបណ្តុះបណ្តាលបច្ចេកវិទ្យាព័ត៌មាន និងការគ្រប់គ្រងឯកសារឌីជីថល', canvas.width / 2, 365);

  // Divider
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 160, 390);
  ctx.lineTo(canvas.width / 2 + 160, 390);
  ctx.stroke();

  // Paragraph 1
  ctx.textAlign = 'left';
  ctx.font = 'normal 21px "Kantumruy Pro", sans-serif';
  ctx.fillStyle = '#1E293B';
  const p1 = 'ក្រសួងអប់រំ យុវជន និងកីឡា មានកិត្តិយសសូមជម្រាបជូនដំណឹងដល់លោក-លោកស្រី ជាប្រធានអង្គភាព មន្ទីរអប់រំ និងលោកគ្រូ-អ្នកគ្រូទូទាំងប្រទេស មេត្តាជ្រាបថា៖ អគ្គនាយកដ្ឋាននឹងរៀបចំវគ្គបណ្តុះបណ្តាលស្តីពីការបម្លែងឯកសាររដ្ឋបាលរូបភាពទៅជាទម្រង់ Microsoft Word (.docx) ដោយរក្សាបាននូវរឹមក្រដាស Top 0.69", Bottom 0.59", Left 0.59", Right 0.59" យ៉ាងត្រឹមត្រូវ។';
  wrapText(ctx, p1, 80, 450, canvas.width - 160, 34);

  // Table
  const tableTop = 620;
  const colX = [80, 180, 520, 860, 1160];
  const rowH = 48;

  // Table Header
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(80, tableTop, 1080, rowH);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Kantumruy Pro", sans-serif';
  ctx.fillText('ល.រ', 110, tableTop + 32);
  ctx.fillText('កម្មវិធីសិក្សា', 210, tableTop + 32);
  ctx.fillText('ខ្លឹមសារលម្អិត', 550, tableTop + 32);
  ctx.fillText('កាលបរិច្ឆេទ & ទីតាំង', 890, tableTop + 32);

  // Table Rows
  const tableData = [
    ['១', 'ការស្រង់អក្សរខ្មែរ (Khmer OCR)', 'រក្សាជើងអក្សរ ស្រៈ និងម៉ូដអក្សរមូល', 'ថ្ងៃទី២០ កញ្ញា • សាលប្រជុំ A'],
    ['២', 'កំណត់រឹមទំព័រ (Page Setup)', 'Top 0.69", Bottom 0.59", Left/Right 0.59"', 'ថ្ងៃទី២១ កញ្ញា • បន្ទប់កុំព្យូទ័រ'],
    ['៣', 'ការនាំចេញជា Word (.docx)', 'រក្សាតារាង បញ្ជីចំណុច និងត្រាផ្លូវការ', 'ថ្ងៃទី២២ កញ្ញា • អនឡាញ Zoom'],
  ];

  ctx.font = 'normal 19px "Kantumruy Pro", sans-serif';
  tableData.forEach((row, rIdx) => {
    const y = tableTop + (rIdx + 1) * rowH;
    ctx.fillStyle = rIdx % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
    ctx.fillRect(80, y, 1080, rowH);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(80, y, 1080, rowH);

    ctx.fillStyle = '#0F172A';
    ctx.fillText(row[0], 115, y + 32);
    ctx.fillText(row[1], 210, y + 32);
    ctx.fillText(row[2], 550, y + 32);
    ctx.fillText(row[3], 890, y + 32);
  });

  // Outline for table
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(80, tableTop, 1080, rowH * 4);

  // Paragraph 2
  const p2 = 'អាស្រ័យដូចបានជម្រាបជូនខាងលើ សូម លោក-លោកស្រី ប្រធានអង្គភាព និងសាមីខ្លួន មេត្តាជ្រាប និងចូលរួមតាមកាលបរិច្ឆេទដោយស្មារតីទទួលខុសត្រូវខ្ពស់។';
  wrapText(ctx, p2, 80, 890, canvas.width - 160, 34);

  // Signatures Section
  ctx.textAlign = 'right';
  ctx.font = 'italic 19px "Kantumruy Pro", sans-serif';
  ctx.fillText('រាជធានីភ្នំពេញ, ថ្ងៃទី១៦ ខែកញ្ញា ឆ្នាំ២០២៦', canvas.width - 80, 1080);
  ctx.font = 'bold 22px "Khmer OS Muol Light", "Kantumruy Pro", sans-serif';
  ctx.fillText('រដ្ឋមន្ត្រីក្រសួងអប់រំ យុវជន និងកីឡា', canvas.width - 80, 1120);

  // Simulated Official Seal (Red Circle)
  ctx.beginPath();
  ctx.arc(canvas.width - 240, 1260, 65, 0, Math.PI * 2);
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(canvas.width - 240, 1260, 58, 0, Math.PI * 2);
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 13px "Khmer OS Muol Light", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ក្រសួងអប់រំ យុវជន និងកីឡា', canvas.width - 240, 1250);
  ctx.fillText('★ ត្រាផ្លូវការ ★', canvas.width - 240, 1275);

  ctx.font = 'bold 24px "Khmer OS Muol Light", sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'right';
  ctx.fillText('បណ្ឌិតសភាចារ្យ ហង់ជួន ណារ៉ុន', canvas.width - 130, 1370);

  // CC List on left
  ctx.textAlign = 'left';
  ctx.font = 'bold 18px "Kantumruy Pro", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('កន្លែងទទួល ៖', 80, 1420);
  ctx.font = 'normal 16px "Kantumruy Pro", sans-serif';
  ctx.fillText('- ទីស្តីការគណៈរដ្ឋមន្ត្រី "ដើម្បីគោរពជ្រាប"', 100, 1450);
  ctx.fillText('- ខុទ្ទកាល័យសម្តេចមហាបវរធិបតីនាយករដ្ឋមន្ត្រី', 100, 1475);
  ctx.fillText('- ឯកសារ-កាលប្បវត្តិ', 100, 1500);

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  const file = new File([blob], 'លិខិតរដ្ឋបាល_គំរូសម្រាប់បម្លែងជាWord.png', { type: 'image/png' });

  return {
    file,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
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
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n];
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
