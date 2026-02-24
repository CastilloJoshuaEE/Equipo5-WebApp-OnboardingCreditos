// backend/application/use-cases/transferencias/GenerarComprobantePDF.js
const PDFDocument = require('pdfkit');

class GenerarComprobantePDF {
  constructor(transferenciaRepository, supabase) {
    this.transferenciaRepository = transferenciaRepository;
    this.supabase = supabase;
  }

  async execute(transferencia) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Generando comprobante PDF para transferencia:', transferencia.id);

        const doc = new PDFDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', async () => {
          try {
            const pdfBuffer = Buffer.concat(chunks);

            const numeroComprobante = transferencia.numero_comprobante || `TRF-${transferencia.id}`;
            const nombreArchivo = `comprobante-${numeroComprobante}.pdf`;
            const rutaStorage = `comprobantes-transferencias/${nombreArchivo}`;

            console.log('Subiendo comprobante a storage:', rutaStorage);

            const { error: uploadError } = await this.supabase.storage
              .from('kyc-documents')
              .upload(rutaStorage, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
              });

            if (uploadError) {
              console.error('Error subiendo comprobante:', uploadError);
              reject(uploadError);
              return;
            }

            await this.transferenciaRepository.actualizarRutaComprobante(transferencia.id, rutaStorage);

            console.log('Comprobante PDF generado y guardado exitosamente:', rutaStorage);
            resolve(pdfBuffer);

          } catch (error) {
            console.error('Error en generación de PDF:', error);
            reject(error);
          }
        });

        doc.fontSize(20).text('COMPROBANTE DE TRANSFERENCIA BANCARIA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Número de Comprobante: ${transferencia.numero_comprobante || `TRF-${transferencia.id}`}`);
        doc.text(`Fecha: ${new Date(transferencia.created_at).toLocaleDateString()}`);
        doc.text(`Hora: ${new Date(transferencia.created_at).toLocaleTimeString()}`);
        doc.moveDown();
        doc.text(`Monto Transferido: ${transferencia.moneda} ${transferencia.monto.toFixed(2)}`);
        doc.text(`Cuenta Origen: ${transferencia.cuenta_origen || 'Nexia-001-USD'}`);
        doc.text(`Banco Origen: ${transferencia.banco_origen || 'Nexia Bank'}`);
        doc.text(`Cuenta Destino: ${transferencia.cuenta_destino}`);
        doc.text(`Banco Destino: ${transferencia.banco_destino}`);
        doc.moveDown();
        doc.text(`Motivo: ${transferencia.motivo || 'Transferencia de crédito aprobado'}`);
        doc.text(`Estado: COMPLETADA`);
        doc.moveDown();
        doc.text('ESTA TRANSFERENCIA NO TIENE COSTO', { align: 'center' });
        doc.moveDown();
        doc.text('Documento generado automáticamente por el Sistema de Créditos de Nexia',
          { align: 'center', fontSize: 10 });

        doc.end();

      } catch (error) {
        console.error('Error crítico generando PDF:', error);
        reject(error);
      }
    });
  }
}

module.exports = GenerarComprobantePDF;