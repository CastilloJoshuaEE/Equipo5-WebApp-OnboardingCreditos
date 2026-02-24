// backend/interfaces/controllers/ContratoController.js
class ContratoController {
  constructor(
    generarContratoParaSolicitudUseCase,
    verificarEstadoContratoUseCase,
    obtenerContenidoContratoUseCase,
    obtenerContratosUsuarioUseCase,
    obtenerEstadisticasContratosUseCase,
    supabase
  ) {
    this._generarContratoParaSolicitud = generarContratoParaSolicitudUseCase;
    this._verificarEstadoContrato = verificarEstadoContratoUseCase;
    this._obtenerContenidoContrato = obtenerContenidoContratoUseCase;
    this._obtenerContratosUsuario = obtenerContratosUsuarioUseCase;
    this._obtenerEstadisticasContratos = obtenerEstadisticasContratosUseCase;
    this.supabase = supabase;
  }

  static async crearDOCXContrato(solicitud) {
    const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } = require('docx');

    try {
      let firmaSolicitante = null;
      let firmaOperador = null;

      let fechaSolicitante = null;
      let fechaOperador = null;
      let hashDocumento = 'Pendiente de firma';

      try {
        const { data: firmas } = await this.supabase
          .from('firmas_digitales')
          .select('fecha_firma_solicitante, fecha_firma_operador, hash_documento_firmado')
          .eq('solicitud_id', solicitud.id)
          .single();

        if (firmas) {
          fechaSolicitante = firmas.fecha_firma_solicitante ?
            new Date(firmas.fecha_firma_solicitante).toLocaleString() : null;
          fechaOperador = firmas.fecha_firma_operador ?
            new Date(firmas.fecha_firma_operador).toLocaleString() : null;
          hashDocumento = firmas.hash_documento_firmado || hashDocumento;

          firmaSolicitante = firmas.fecha_firma_solicitante ? '✓ FIRMADO' : null;
          firmaOperador = firmas.fecha_firma_operador ? '✓ FIRMADO' : null;
        }
      } catch (error) {
        console.log('No se pudo obtener información de firmas:', error.message);
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "CONTRATO DE AUTORIZACIÓN DE GESTIÓN DE CRÉDITO Y SERVICIOS DE ASESORÍA FINANCIERA",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun("Entre: "),
                new TextRun({
                  text: "NEXIA S.A., con domicilio en Argentina, legalmente representada por Ramiro Rodriguez, en adelante \"NEXIA\",",
                  bold: true
                })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun("y "),
                new TextRun({
                  text: `${solicitud.solicitantes?.usuarios?.nombre_completo || 'N/A'}, portador/a del DNI N.º ${solicitud.solicitantes?.usuarios?.dni || 'N/A'}, con domicilio en ${solicitud.solicitantes?.domicilio || 'N/A'}, en adelante \"EL SOLICITANTE\",`,
                  bold: true
                })
              ]
            }),
            new Paragraph({
              text: "se celebra el presente Contrato de Autorización, conforme a las siguientes cláusulas:",
              spacing: { after: 400 }
            }),
            new Paragraph({ text: "PRIMERA: OBJETO", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              text: "El presente contrato tiene por objeto autorizar a NEXIA a gestionar, tramitar y/o intermediar en nombre de EL SOLICITANTE las solicitudes de crédito ante las instituciones financieras con las cuales mantiene convenios o relaciones comerciales, con el fin de facilitar el acceso a productos financieros acordes al perfil crediticio del solicitante.",
              spacing: { after: 400 }
            }),
            new Paragraph({ text: "SEGUNDA: ALCANCE DE LA AUTORIZACIÓN", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "EL SOLICITANTE autoriza expresamente a NEXIA a:" }),
            new Paragraph({ text: "1. Consultar su información crediticia ante burós y entidades financieras autorizadas.", indent: { left: 720 } }),
            new Paragraph({ text: "2. Gestionar documentos, formularios y requisitos necesarios para la tramitación de crédito.", indent: { left: 720 } }),
            new Paragraph({ text: "3. Comunicarle resultados, observaciones o requerimientos derivados del proceso de solicitud.", indent: { left: 720 }, spacing: { after: 400 } }),
            new Paragraph({ text: "TERCERA: CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              text: "NEXIA se compromete a tratar toda la información personal y financiera de EL SOLICITANTE conforme a las leyes de protección de datos personales vigentes, garantizando su confidencialidad y uso exclusivo para los fines de este contrato.",
              spacing: { after: 400 }
            }),
            new Paragraph({ text: "CUARTA: VIGENCIA", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              text: "El presente contrato entrará en vigor a partir de la fecha de firma digital y tendrá una vigencia de seis (6) meses, pudiendo renovarse automáticamente si las partes así lo acuerdan.",
              spacing: { after: 400 }
            }),
            new Paragraph({ text: "QUINTA: NO GARANTÍA DE APROBACIÓN", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              text: "EL SOLICITANTE reconoce que la aprobación del crédito depende exclusivamente de las políticas de las instituciones financieras, y que NEXIA actúa únicamente como intermediario o asesor.",
              spacing: { after: 400 }
            }),
            new Paragraph({ text: "SEXTA: ACEPTACIÓN Y FIRMA DIGITAL", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Ambas partes aceptan los términos de este contrato. EL SOLICITANTE declara haber leído y comprendido todas las cláusulas." }),
            new Paragraph({
              text: "La firma digital de este documento implica consentimiento pleno y aceptación legal conforme a la legislación vigente.",
              spacing: { after: 400 }
            }),
            new Paragraph({ text: `Fecha de aprobación de solicitud: ${new Date().toLocaleDateString()}` }),
            new Paragraph({ text: `Nombre del solicitante: ${solicitud.solicitantes?.usuarios?.nombre_completo || 'N/A'}` }),
            new Paragraph({ text: `DNI: ${solicitud.solicitantes?.usuarios?.dni || 'N/A'}` }),
            new Paragraph({ text: `Correo electrónico: ${solicitud.solicitantes?.usuarios?.email || 'N/A'}` }),
            new Paragraph({ text: `Firma digital del solicitante: ${firmaSolicitante || '___________________________'}`, spacing: { after: 400 } }),
            new Paragraph({ text: "Por NEXIA S.A." }),
            new Paragraph({ text: `Representante legal: ${solicitud.operadores?.usuarios?.nombre_completo || 'Operador del Sistema'}` }),
            new Paragraph({ text: "Cargo: Analista de Créditos" }),
            new Paragraph({ text: `Firma digital del operador: ${firmaOperador || '___________________________'}`, spacing: { after: 400 } }),
            new Paragraph({ text: `Fecha: ${new Date().toLocaleDateString()}`, spacing: { after: 400 } }),
            new Paragraph({ text: "*Este documento ha sido firmado digitalmente y tiene validez legal conforme a la legislación vigente.", size: 16, spacing: { after: 400 } })
          ]
        }]
      });

      const { Packer: PackerFinal } = require('docx');
      return await PackerFinal.toBuffer(doc);
    } catch (error) {
      console.error('Error generando DOCX del contrato:', error);
      throw error;
    }
  }

  async generarContratoParaSolicitud(req, res) {
    try {
      const { solicitud_id } = req.params;
      const contrato = await this._generarContratoParaSolicitud.execute(solicitud_id);
      res.json({
        success: true,
        data: contrato
      });
    } catch (error) {
      console.error('Error generando contrato:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async verificarEstadoContrato(req, res) {
    const { firma_id } = req.params;
    const result = await this._verificarEstadoContrato.execute(firma_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerContenidoContrato(req, res) {
    const { firma_id } = req.params;
    const result = await this._obtenerContenidoContrato.execute(firma_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerContratosUsuario(req, res) {
    const usuario = req.usuario;
    const { estado, tipo } = req.query;
    const result = await this._obtenerContratosUsuario.execute(usuario.id, usuario.rol, { estado, tipo });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticas(req, res) {
    const usuario = req.usuario;
    const result = await this._obtenerEstadisticasContratos.execute(usuario.id, usuario.rol);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = ContratoController;