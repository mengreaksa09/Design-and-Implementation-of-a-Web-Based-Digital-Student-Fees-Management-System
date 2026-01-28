const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Generate Excel Report
const generateExcelReport = async (data, reportType, options = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = process.env.SCHOOL_NAME || 'Student Fees Management';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(reportType);

  // Add title
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = `${
    process.env.SCHOOL_NAME || 'Student Fees Management'
  } - ${reportType}`;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Add date range if provided
  if (options.startDate && options.endDate) {
    worksheet.mergeCells('A2:H2');
    worksheet.getCell(
      'A2'
    ).value = `Period: ${options.startDate} to ${options.endDate}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
  }

  // Add headers based on report type
  let headers = [];
  let startRow = 4;

  switch (reportType) {
    case 'Daily Collection':
    case 'Monthly Collection':
    case 'Yearly Collection':
      headers = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Receipt No', key: 'receiptNumber', width: 20 },
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Fee Type', key: 'feeType', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
      ];
      break;

    case 'Class-wise Report':
      headers = [
        { header: 'Class', key: 'class', width: 15 },
        { header: 'Total Students', key: 'totalStudents', width: 15 },
        { header: 'Total Fees', key: 'totalFees', width: 18 },
        { header: 'Collected', key: 'collected', width: 18 },
        { header: 'Pending', key: 'pending', width: 18 },
        { header: 'Collection %', key: 'collectionPercentage', width: 15 },
      ];
      break;

    case 'Department-wise Report':
      headers = [
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Total Students', key: 'totalStudents', width: 15 },
        { header: 'Total Fees', key: 'totalFees', width: 18 },
        { header: 'Collected', key: 'collected', width: 18 },
        { header: 'Pending', key: 'pending', width: 18 },
        { header: 'Collection %', key: 'collectionPercentage', width: 15 },
      ];
      break;

    case 'Student Fee Status':
      headers = [
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Class', key: 'class', width: 12 },
        { header: 'Department', key: 'department', width: 18 },
        { header: 'Total Fees', key: 'totalFees', width: 15 },
        { header: 'Paid', key: 'paid', width: 15 },
        { header: 'Balance', key: 'balance', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ];
      break;

    default:
      headers = Object.keys(data[0] || {}).map((key) => ({
        header: key.charAt(0).toUpperCase() + key.slice(1),
        key: key,
        width: 15,
      }));
  }

  worksheet.columns = headers;

  // Style header row
  const headerRow = worksheet.getRow(startRow);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header.header;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F46E5' },
    };
    cell.font = { color: { argb: 'FFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  // Add data rows
  data.forEach((item, rowIndex) => {
    const row = worksheet.getRow(startRow + 1 + rowIndex);
    headers.forEach((header, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = item[header.key];

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F3F4F6' },
        };
      }
    });
  });

  // Add totals row if applicable
  if (
    ['Daily Collection', 'Monthly Collection', 'Yearly Collection'].includes(
      reportType
    ) &&
    data.length > 0
  ) {
    const totalRow = worksheet.getRow(startRow + data.length + 2);
    totalRow.getCell(5).value = 'TOTAL:';
    totalRow.getCell(5).font = { bold: true };
    totalRow.getCell(6).value = data
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      .toFixed(2);
    totalRow.getCell(6).font = { bold: true };
    totalRow.getCell(6).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '10B981' },
    };
  }

  // Generate filename
  const timestamp = Date.now();
  const fileName = `${reportType.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
  const filePath = path.join(exportsDir, fileName);

  await workbook.xlsx.writeFile(filePath);

  return {
    success: true,
    filePath: `/exports/${fileName}`,
    fullPath: filePath,
  };
};

// Generate PDF Report
const generatePdfReport = async (data, reportType, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
      });
      const timestamp = Date.now();
      const fileName = `${reportType.replace(/\s+/g, '_')}_${timestamp}.pdf`;
      const filePath = path.join(exportsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Header
      doc.rect(0, 0, doc.page.width, 80).fill('#4F46E5');
      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(
          process.env.SCHOOL_NAME || 'Student Fees Management System',
          40,
          25,
          { align: 'center' }
        );
      doc
        .fontSize(14)
        .font('Helvetica')
        .text(reportType, 40, 50, { align: 'center' });

      // Date range
      if (options.startDate && options.endDate) {
        doc
          .fillColor('#1f2937')
          .fontSize(10)
          .text(`Period: ${options.startDate} to ${options.endDate}`, 40, 95, {
            align: 'center',
          });
      }

      doc
        .fillColor('#6b7280')
        .text(`Generated: ${new Date().toLocaleString()}`, 40, 110, {
          align: 'center',
        });

      // Table
      const tableTop = 140;
      const tableLeft = 40;
      let yPos = tableTop;

      // Get headers based on data
      const headers = Object.keys(data[0] || {});
      const colWidth = (doc.page.width - 80) / headers.length;

      // Header row
      doc.rect(tableLeft, yPos, doc.page.width - 80, 25).fill('#4F46E5');
      headers.forEach((header, i) => {
        doc
          .fillColor('#ffffff')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(
            header.charAt(0).toUpperCase() +
              header.slice(1).replace(/([A-Z])/g, ' $1'),
            tableLeft + i * colWidth + 5,
            yPos + 8,
            { width: colWidth - 10, align: 'left' }
          );
      });

      yPos += 25;

      // Data rows
      data.forEach((item, rowIndex) => {
        // Check if we need a new page
        if (yPos > doc.page.height - 60) {
          doc.addPage();
          yPos = 40;
        }

        const rowColor = rowIndex % 2 === 0 ? '#f3f4f6' : '#ffffff';
        doc.rect(tableLeft, yPos, doc.page.width - 80, 22).fill(rowColor);

        headers.forEach((header, i) => {
          doc
            .fillColor('#1f2937')
            .fontSize(8)
            .font('Helvetica')
            .text(
              String(item[header] || ''),
              tableLeft + i * colWidth + 5,
              yPos + 6,
              { width: colWidth - 10, align: 'left' }
            );
        });

        yPos += 22;
      });

      // Summary
      if (data.length > 0 && data[0].amount !== undefined) {
        yPos += 10;
        const total = data.reduce(
          (sum, item) => sum + parseFloat(item.amount || 0),
          0
        );
        doc
          .fillColor('#1f2937')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`Total: ${total.toFixed(2)}`, tableLeft, yPos);
      }

      // Footer
      doc
        .fillColor('#6b7280')
        .fontSize(8)
        .text(
          `${process.env.SCHOOL_ADDRESS || ''} | Phone: ${
            process.env.SCHOOL_PHONE || ''
          } | Email: ${process.env.SCHOOL_EMAIL || ''}`,
          40,
          doc.page.height - 30,
          { align: 'center' }
        );

      doc.end();

      writeStream.on('finish', () => {
        resolve({
          success: true,
          filePath: `/exports/${fileName}`,
          fullPath: filePath,
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

module.exports = { generateExcelReport, generatePdfReport };
