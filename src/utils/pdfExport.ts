import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Form, Field, FormResponseRecord } from '../types/form.js';

export function exportResponsesToPDF(
  form: Form,
  fields: Field[],
  responses: FormResponseRecord[]
) {
  const doc = new jsPDF({
    orientation: fields.length > 4 ? 'landscape' : 'portrait',
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
  doc.text('ASESORES VISA — REPORTE DE RESPUESTAS', 30, 32);

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
  const tableHeaders = ['#', 'Fecha', ...fields.map((f) => f.label)];
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
      ...fields.map((f) => (r.answers[f.id] !== undefined && r.answers[f.id] !== null ? String(r.answers[f.id]) : '—')),
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

  // Table of fields
  const tableData = fields.map((f) => [
    f.label,
    response.answers[f.id] !== undefined && response.answers[f.id] !== '' ? String(response.answers[f.id]) : '—',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [['Campo / Requisito', 'Información Proporcionada por el Solicitante']],
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

  const safeId = response.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Expediente_${safeId}.pdf`);
}
