import PDFDocument from 'pdfkit';
import connection from '../config/connectDB.js';

// wrapText function (same as before)
const wrapText = (doc, text, x, y, maxWidth, lineHeight, draw = true) => {
    text = String(text);
    const words = text.split(' ');
    let line = '';
    let lines = [];
    let currentY = y;

    for (let word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = doc.widthOfString(testLine);
        if (testWidth <= maxWidth) {
            line = testLine;
        } else {
            if (line) {
                lines.push({ text: line, y: currentY });
                currentY += lineHeight;
                line = word;
            } else {
                let remainingWord = word;
                while (doc.widthOfString(remainingWord) > maxWidth) {
                    let part = remainingWord;
                    while (doc.widthOfString(part) > maxWidth) {
                        part = part.slice(0, -1);
                    }
                    lines.push({ text: part, y: currentY });
                    currentY += lineHeight;
                    remainingWord = remainingWord.slice(part.length);
                }
                if (remainingWord) {
                    line = remainingWord;
                }
            }
        }
    }
    if (line) {
        lines.push({ text: line, y: currentY });
    }

    if (draw) {
        lines.forEach(line => {
            doc.text(line.text, x, line.y, { width: maxWidth, align: 'center' });
        });
    }

    return lines.length * lineHeight;
};



const memberListPdf = async (req, res) => {
    try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-disposition', 'attachment; filename=member_list.pdf');
            res.setHeader('Content-type', 'application/pdf');
            res.send(pdfData);
        });

        const headers = ['#', 'ID', 'Phone', 'Status', 'Last Login'];
        const { type } = req.query;

        let userQuery = `
            SELECT u.id_user, u.phone, u.status, u.login_at
            FROM users u
            WHERE u.veri = 1
        `;

        if (type === 'dead_user') {
            userQuery += ` AND u.login_at < DATE_SUB(NOW(), INTERVAL 5 DAY)`;
        }

        userQuery += ` ORDER BY u.id DESC`;

        const [rows] = await connection.query(userQuery);

        const data = rows.map((row, index) => [
            String(index + 1),
            String(row.id_user || ''),
            String(row.phone || ''),
            String(type === 'dead_user' ? 'Dead User' : row.status === 1 ? 'Active' : 'Deactive'),
            new Date(row.login_at).toLocaleString()
        ]);

        // Layout Configuration
        const pageWidth = 595;
        const margin = 50;
        const usableWidth = pageWidth - 2 * margin;
        const colWidthRatios = [0.08, 0.18, 0.25, 0.18, 0.31];  // Total ≈ 1
        const colWidths = colWidthRatios.map(r => usableWidth * r);
        const tableTop = 50;
        const lineHeight = 12;
        const paddingTop = 4;
        const paddingBottom = 4;
        const availableHeight = 842 - 50; // A4 height - bottom margin

        // Draw Header
        const drawTableHeader = (y) => {
            doc.fontSize(10).font('Helvetica-Bold');
            let x = margin;
            let headerHeight = lineHeight;
            headers.forEach((header, i) => {
                const height = wrapText(doc, header, x + 6, y + paddingTop, colWidths[i] - 10, lineHeight, false);
                headerHeight = Math.max(headerHeight, height + paddingTop + paddingBottom);
            });

            x = margin;
            headers.forEach((header, i) => {
                doc.rect(x, y, colWidths[i], headerHeight).fill('#d3d3d3').stroke();
                doc.fillColor('black');
                wrapText(doc, header, x + 6, y + paddingTop, colWidths[i] - 10, lineHeight);
                x += colWidths[i];
            });

            return headerHeight;
        };

        let currentY = tableTop;
        let headerHeight = drawTableHeader(currentY);
        currentY += headerHeight;

        doc.font('Helvetica');
        data.forEach((row) => {
            let x = margin;
            let rowHeight = 0;

            const cellHeights = row.map((cell, i) => wrapText(doc, cell, x + 6, currentY + paddingTop, colWidths[i] - 10, lineHeight, false));
            rowHeight = Math.max(...cellHeights) + paddingTop + paddingBottom;

            if (currentY + rowHeight > availableHeight) {
                doc.addPage();
                currentY = tableTop;
                headerHeight = drawTableHeader(currentY);
                currentY += headerHeight;
            }

            x = margin;
            row.forEach((cell, i) => {
                doc.rect(x, currentY, colWidths[i], rowHeight).stroke();
                wrapText(doc, cell, x + 6, currentY + paddingTop, colWidths[i] - 10, lineHeight);
                x += colWidths[i];
            });

            currentY += rowHeight;
        });

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
};


const pdfStatementController = {
    memberListPdf,
}

export default pdfStatementController;
