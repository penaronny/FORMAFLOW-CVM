import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Form, Field, FormResponseRecord, FieldType } from '../types/form.js';

export function formatAnswerForDisplay(val: string | undefined, type?: FieldType): string {
  if (!val || val === '[]' || val === '{}') return '—';

  if (type === 'signature' || val.startsWith('data:image/')) {
    return '[Firma Digital Manuscrita Adjunta]';
  }

  if (type === 'file' || val.startsWith('data:application/')) {
    return '[Archivo / Documento Adjunto]';
  }

  if (type === 'rating') {
    return `${val} ★`;
  }

  // Checkbox array
  if (type === 'checkbox' || val.startsWith('[')) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed.join(', ') : '—';
      }
    } catch {}
  }

  // Matrix JSON
  if (type === 'matrix_radio' || type === 'matrix_checkbox' || (val.startsWith('{') && val.endsWith('}'))) {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) {
        const parts = Object.entries(parsed).map(([k, v]) => {
          const formattedVal = Array.isArray(v) ? v.join(', ') : String(v);
          return `${k}: ${formattedVal}`;
        });
        return parts.length > 0 ? parts.join(' | ') : '—';
      }
    } catch {}
  }

  return String(val);
}

export function exportResponsesToPDF(
  form: Form,
  fields: Field[],
  responses: FormResponseRecord[]
) {
  const visibleFields = fields.filter((f) => f.type !== 'hidden');

  const doc = new jsPDF({
    orientation: visibleFields.length > 4 ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Navy Header Banner
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ASESORES VISA — REPORTE GENERAL DE RESPUESTAS', 30, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth - 30, 32, { align: 'right' });

  // Subtitle / Form info
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(form.title, 30, 80);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  const descText = form.description ? form.description : 'Expediente centralizado de registros consulares y respuestas.';
  const splitDesc = doc.splitTextToSize(descText, pageWidth - 60);
  doc.text(splitDesc, 30, 96);

  const startTableY = 100 + splitDesc.length * 12;

  // Metadata summary line
  doc.setFontSize(8.5);
  doc.setTextColor(59, 130, 246); // Blue 500
  doc.text(`Total de registros: ${responses.length}  |  Estado: ${form.is_active ? 'Activo' : 'Inactivo'}  |  Seguridad: Encriptado AES-256`, 30, startTableY);

  // Prepare table headers and body
  const tableHeaders = ['#', 'Fecha', ...visibleFields.map((f) => f.label)];
  const tableRows = responses.map((r, idx) => {
    const formattedDate = new Date(r.submitted_at).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return [
      idx + 1,
      formattedDate,
      ...visibleFields.map((f) => formatAnswerForDisplay(r.answers[f.id], f.type)),
    ];
  });

  autoTable(doc, {
    startY: startTableY + 12,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [30, 41, 59],
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 60, bottom: 40, left: 30, right: 30 },
    didDrawPage: (_data) => {
      // Footer on every page
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Asesores Visa — Documento confidencial para uso exclusivo interno. Pág. ${doc.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
    },
  });

  const safeSlug = (form.slug || 'respuestas').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`AsesoresVisa_${safeSlug}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportSingleResponseToPDF(
  form: Form,
  fields: Field[],
  response: FormResponseRecord
) {
  const visibleFields = fields.filter((f) => f.type !== 'hidden');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Navy Top Banner
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ASESORES VISA — FICHA INDIVIDUAL DE SOLICITUD', 30, 34);

  // Subtitle / Form Title
  let cursorY = 80;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(form.title, 30, cursorY);

  cursorY += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const formattedDate = new Date(response.submitted_at).toLocaleString('es-ES');
  doc.text(`ID de Registro: ${response.id}  |  Fecha de Envío: ${formattedDate}`, 30, cursorY);

  cursorY += 20;

  // Separate text fields from signatures
  const nonSigFields = visibleFields.filter((f) => f.type !== 'signature');
  const signatureFields = visibleFields.filter((f) => f.type === 'signature');

  // Table of fields
  const tableData = nonSigFields.map((f) => [
    f.label,
    formatAnswerForDisplay(response.answers[f.id], f.type),
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Campo / Requisito Consular', 'Información Proporcionada']],
    body: tableData,
    theme: 'striped',
    columnStyles: {
      0: { cellWidth: 180, fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { fontStyle: 'normal', textColor: [15, 23, 42] },
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 8,
      overflow: 'linebreak',
    },
    margin: { top: 60, bottom: 40, left: 30, right: 30 },
    didDrawPage: (_data) => {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Asesores Visa — Expediente Consular Confidencial  |  Pág. ${doc.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
    },
  });

  // Render Signature if captured
  const lastFinalY = (doc as any).lastAutoTable?.finalY || 400;
  let sigY = lastFinalY + 25;

  signatureFields.forEach((sigField) => {
    const sigData = response.answers[sigField.id];
    if (sigData && sigData.startsWith('data:image/')) {
      if (sigY + 110 > pageHeight - 50) {
        doc.addPage();
        sigY = 60;
      }

      // Box for signature
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(30, sigY, pageWidth - 60, 95, 8, 8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`${sigField.label} (Firma Digital Registrada en Línea):`, 42, sigY + 18);

      try {
        // Embed signature image
        doc.addImage(sigData, 'PNG', 45, sigY + 22, 160, 50);
      } catch (err) {
        console.error('Error adding signature image to PDF:', err);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Firma electrónica verificada y estampada por el solicitante el ${formattedDate}. Expediente Asesores Visa.`,
        42,
        sigY + 85
      );

      sigY += 115;
    }
  });

  const safeId = response.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Expediente_${safeId}.pdf`);
}
