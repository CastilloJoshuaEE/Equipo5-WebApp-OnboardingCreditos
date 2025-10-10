const { supabase } = require('../config/conexion');
const diditService = require('../servicios/diditService');

// Manejar webhooks de Didit
const handleDiditWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const payload = req.body;

    console.log('. Webhook recibido de Didit:', payload.session_id);

    // Verificar firma del webhook
    if (!diditService.verifyWebhookSignature(payload, signature, timestamp)) {
      console.error('. Firma de webhook inválida');
      return res.status(401).json({ success: false, message: 'Firma inválida' });
    }

    const { session_id, status, webhook_type, decision } = payload;

    // Buscar la verificación en nuestra base de datos
    const { data: verificacion, error: verError } = await supabase
      .from('verificaciones_kyc')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (verError) {
      console.error('. Verificación no encontrada:', session_id);
      return res.status(404).json({ success: false, message: 'Verificación no encontrada' });
    }

    // Actualizar estado de la verificación
    const { error: updateError } = await supabase
      .from('verificaciones_kyc')
      .update({
        estado: status.toLowerCase(),
        datos_verificacion: decision || null,
        actualizado_en: new Date().toISOString()
      })
      .eq('session_id', session_id);

    if (updateError) throw updateError;

    // Si la verificación fue aprobada, actualizar documentos relacionados
    if (status === 'Approved' && decision?.id_verification) {
      await actualizarDocumentosVerificados(verificacion.solicitud_id, decision.id_verification);
    }

    console.log(`. Webhook procesado: ${session_id} - ${status}`);

    res.json({ success: true, message: 'Webhook procesado' });

  } catch (error) {
    console.error('. Error procesando webhook:', error);
    res.status(500).json({ success: false, message: 'Error procesando webhook' });
  }
};

// Actualizar documentos basado en verificación exitosa
const actualizarDocumentosVerificados = async (solicitudId, idVerification) => {
  try {
    // Buscar documento DNI de la solicitud
    const { data: documento, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .eq('tipo', 'dni')
      .single();

    if (error) throw error;

    // Actualizar documento como validado
    await supabase
      .from('documentos')
      .update({
        estado: 'validado',
        comentarios: `Verificado automáticamente por Didit - ${idVerification.document_type}`,
        validado_en: new Date().toISOString()
      })
      .eq('id', documento.id);

    console.log(`. Documento DNI validado automáticamente para solicitud: ${solicitudId}`);

  } catch (error) {
    console.error('. Error actualizando documentos:', error);
  }
};

module.exports = {
  handleDiditWebhook
};