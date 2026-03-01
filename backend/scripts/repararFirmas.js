// scripts/repararFirmas.js
const { supabaseClient } = require('../../infrastructure/database/supabaseClient.js');

async function repararFirmasSinContrato() {
    try {
        console.log('Buscando firmas sin relación con contrato...');

        // Obtener todas las firmas
        const { data: firmas, error } = await supabaseClient
            .from('firmas_digitales')
            .select('*');

        if (error) throw error;

        let reparadas = 0;
        let errores = 0;

        for (const firma of firmas) {
            try {
                // Verificar si el contrato existe
                const { data: contrato, error: contratoError } = await supabaseClient
                    .from('contratos')
                    .select('id')
                    .eq('id', firma.contrato_id)
                    .single();

                if (contratoError || !contrato) {
                    
                    // Buscar contrato por solicitud_id
                    const { data: contratoCorrecto, error: buscarError } = await supabaseClient
                        .from('contratos')
                        .select('id')
                        .eq('solicitud_id', firma.solicitud_id)
                        .single();

                    if (!buscarError && contratoCorrecto) {
                        // Actualizar la firma
                        const { error: updateError } = await supabaseClient
                            .from('firmas_digitales')
                            .update({ contrato_id: contratoCorrecto.id })
                            .eq('id', firma.id);

                        if (!updateError) {
                            reparadas++;
                        } else {
                            errores++;
                        }
                    } else {
                        errores++;
                    }
                }
            } catch (error) {
                console.error(`Error procesando firma ${firma.id}:`, error.message);
                errores++;
            }
        }


    } catch (error) {
        console.error('Error en reparación masiva:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    repararFirmasSinContrato();
}

module.exports = { repararFirmasSinContrato };