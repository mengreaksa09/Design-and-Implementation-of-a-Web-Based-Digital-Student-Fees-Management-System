const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '../receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

const generateReceipt = async (paymentData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const fileName = `receipt_${paymentData.receiptNumber}.pdf`;
      const filePath = path.join(receiptsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Generate QR Code
      const qrData = JSON.stringify({
        receiptNumber: paymentData.receiptNumber,
        amount: paymentData.amount,
        date: paymentData.paymentDate,
        studentId: paymentData.studentId,
      });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

      // Header
      doc.rect(0, 0, doc.page.width, 120).fill('#4F46E5');
      doc
        .fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(
          process.env.SCHOOL_NAME || 'Student Fees Management System',
          50,
          40,
          { align: 'center' }
        );
      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Official Payment Receipt', 50, 75, { align: 'center' });

      // Receipt details section
      doc
        .fillColor('#1f2937')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('PAYMENT RECEIPT', 50, 140);

      doc.moveTo(50, 160).lineTo(545, 160).stroke('#e5e7eb');

      // Receipt info box
      doc.rect(400, 140, 145, 80).fill('#f3f4f6');
      doc.fillColor('#4F46E5').fontSize(10).text('Receipt No:', 410, 150);
      doc
        .fillColor('#1f2937')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(paymentData.receiptNumber, 410, 165);
      doc
        .fillColor('#4F46E5')
        .font('Helvetica')
        .fontSize(10)
        .text('Date:', 410, 185);
      doc
        .fillColor('#1f2937')
        .font('Helvetica-Bold')
        .text(new Date(paymentData.paymentDate).toLocaleDateString(), 410, 200);

      // Student Information
      let yPos = 180;
      doc
        .fillColor('#374151')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Student Information', 50, yPos);

      yPos += 20;
      doc.font('Helvetica').fontSize(10);

      const studentInfo = [
        ['Student ID:', paymentData.studentIdNumber],
        ['Name:', paymentData.studentName],
        [
          'Class/Department:',
          `${paymentData.class || ''} ${paymentData.department || ''}`,
        ],
        ['Academic Year:', paymentData.academicYear || 'N/A'],
      ];

      studentInfo.forEach(([label, value]) => {
        doc.fillColor('#6b7280').text(label, 50, yPos);
        doc.fillColor('#1f2937').text(value || 'N/A', 150, yPos);
        yPos += 18;
      });

      // Payment Details
      yPos += 20;
      doc
        .fillColor('#374151')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Payment Details', 50, yPos);

      yPos += 20;

      // Table header
      doc.rect(50, yPos, 495, 25).fill('#4F46E5');
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 60, yPos + 8);
      doc.text('Fee Type', 200, yPos + 8);
      doc.text('Amount', 350, yPos + 8);
      doc.text('Status', 450, yPos + 8);

      yPos += 25;

      // Table row
      doc.rect(50, yPos, 495, 30).fill('#f9fafb');
      doc.fillColor('#1f2937').font('Helvetica').fontSize(10);
      doc.text(paymentData.feeDescription || 'Fee Payment', 60, yPos + 10);
      doc.text(paymentData.feeType, 200, yPos + 10);
      doc.text(
        `${paymentData.currency} ${parseFloat(paymentData.amount).toFixed(2)}`,
        350,
        yPos + 10
      );

      // Status badge
      const statusColor =
        paymentData.status === 'completed' ? '#10B981' : '#F59E0B';
      doc.rect(445, yPos + 5, 60, 18).fill(statusColor);
      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .text(paymentData.status.toUpperCase(), 450, yPos + 10);

      yPos += 50;

      // Total section
      doc.rect(300, yPos, 245, 40).fill('#f3f4f6');
      doc
        .fillColor('#374151')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Total Paid:', 320, yPos + 13);
      doc
        .fillColor('#4F46E5')
        .fontSize(16)
        .text(
          `${paymentData.currency} ${parseFloat(paymentData.amount).toFixed(
            2
          )}`,
          420,
          yPos + 10
        );

      yPos += 60;

      // Payment method info
      doc
        .fillColor('#6b7280')
        .font('Helvetica')
        .fontSize(10)
        .text(`Payment Method: ${paymentData.paymentMethod}`, 50, yPos);

      if (paymentData.transactionId) {
        yPos += 15;
        doc.text(`Transaction ID: ${paymentData.transactionId}`, 50, yPos);
      }

      // QR Code
      doc.image(qrCodeBuffer, 450, yPos - 20, { width: 80 });

      // Footer
      const footerY = doc.page.height - 100;
      doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e5e7eb');

      doc
        .fillColor('#6b7280')
        .fontSize(9)
        .text(
          'This is a computer-generated receipt and does not require a signature.',
          50,
          footerY + 15,
          { align: 'center' }
        );
      doc.text(
        `${process.env.SCHOOL_ADDRESS || ''} | Phone: ${
          process.env.SCHOOL_PHONE || ''
        } | Email: ${process.env.SCHOOL_EMAIL || ''}`,
        50,
        footerY + 30,
        { align: 'center' }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleString()}`,
        50,
        footerY + 45,
        { align: 'center' }
      );

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          success: true,
          filePath: `/receipts/${fileName}`,
          fullPath: filePath,
          qrCode: qrCodeDataUrl,
        });
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceipt };
