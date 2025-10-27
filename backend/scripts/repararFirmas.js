// scripts/repararFirmas.js
const { supabase } = require('../config/conexion');

async function repararFirmasSinContrato() {
    try {
        console.log('Buscando firmas sin relación con contrato...');

        // Obtener todas las firmas
        const { data: firmas, error } = await supabase
            .from('firmas_digitales')
            .select('*');

        if (error) throw error;

        let reparadas = 0;
        let errores = 0;

        for (const firma of firmas) {
            try {
                // Verificar si el contrato existe
                const { data: contrato, error: contratoError } = await supabase
                    .from('contratos')
                    .select('id')
                    .eq('id', firma.contrato_id)
                    .single();

                if (contratoError || !contrato) {
                    console.log(`Firma ${firma.id} tiene contrato_id inválido: ${firma.contrato_id}`);
                    
                    // Buscar contrato por solicitud_id
                    const { data: contratoCorrecto, error: buscarError } = await supabase
                        .from('contratos')
                        .select('id')
                        .eq('solicitud_id', firma.solicitud_id)
                        .single();

                    if (!buscarError && contratoCorrecto) {
                        // Actualizar la firma
                        const { error: updateError } = await supabase
                            .from('firmas_digitales')
                            .update({ contrato_id: contratoCorrecto.id })
                            .eq('id', firma.id);

                        if (!updateError) {
                            console.log(`✓ Reparada firma ${firma.id} -> contrato ${contratoCorrecto.id}`);
                            reparadas++;
                        } else {
                            console.log(`✗ Error actualizando firma ${firma.id}:`, updateError.message);
                            errores++;
                        }
                    } else {
                        console.log(`✗ No se encontró contrato para solicitud ${firma.solicitud_id}`);
                        errores++;
                    }
                }
            } catch (error) {
                console.error(`Error procesando firma ${firma.id}:`, error.message);
                errores++;
            }
        }

        console.log(`\nResumen: ${reparadas} firmas reparadas, ${errores} errores`);

    } catch (error) {
        console.error('Error en reparación masiva:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    repararFirmasSinContrato();
}

module.exports = { repararFirmasSinContrato };