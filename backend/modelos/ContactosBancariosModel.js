const { supabase } = require('../config/conexion');

class ContactosBancariosModel {
    
    /**
     * Obtener todos los contactos activos
     */
    static async obtenerTodos() {
        try {
            const { data: contactos, error } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return contactos || [];

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.obtenerTodos:', error);
            throw error;
        }
    }

    /**
     * Buscar contactos por número de cuenta
     */
    static async buscarPorNumeroCuenta(numero_cuenta) {
        try {
            const { data: contactos, error } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .ilike('numero_cuenta', `%${numero_cuenta}%`)
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return contactos || [];

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.buscarPorNumeroCuenta:', error);
            throw error;
        }
    }

    /**
     * Obtener contactos con información de solicitantes
     */
    static async obtenerConSolicitantes() {
        try {
            // Obtener todos los contactos activos
            const { data: contactos, error: contactosError } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (contactosError) throw contactosError;

            if (!contactos || contactos.length === 0) {
                return [];
            }

            // Obtener información de los solicitantes
            const solicitantesIds = [...new Set(contactos.map(c => c.solicitante_id))];
            
            const { data: solicitantes, error: solicitantesError } = await supabase
                .from('solicitantes')
                .select(`
                    id,
                    usuario_id,
                    usuarios (
                        nombre_completo,
                        dni,
                        email
                    )
                `)
                .in('id', solicitantesIds);

            if (solicitantesError) throw solicitantesError;

            // Crear mapa de solicitantes
            const solicitantesMap = {};
            solicitantes?.forEach(sol => {
                solicitantesMap[sol.id] = {
                    nombre_completo: sol.usuarios?.nombre_completo,
                    dni: sol.usuarios?.dni,
                    email: sol.usuarios?.email
                };
            });

            // Combinar información
            const contactosProcesados = contactos.map(contacto => {
                const infoSolicitante = solicitantesMap[contacto.solicitante_id] || {};
                
                return {
                    id: contacto.id,
                    numero_cuenta: contacto.numero_cuenta,
                    tipo_cuenta: contacto.tipo_cuenta,
                    moneda: contacto.moneda,
                    nombre_banco: contacto.nombre_banco,
                    email_contacto: contacto.email_contacto,
                    telefono_contacto: contacto.telefono_contacto,
                    estado: contacto.estado,
                    created_at: contacto.created_at,
                    updated_at: contacto.updated_at,
                    solicitante_id: contacto.solicitante_id,
                    solicitante_nombre: infoSolicitante.nombre_completo,
                    solicitante_dni: infoSolicitante.dni,
                    solicitante_email: infoSolicitante.email
                };
            });

            // Ordenar por nombre del solicitante
            contactosProcesados.sort((a, b) => 
                (a.solicitante_nombre || '').localeCompare(b.solicitante_nombre || '')
            );

            return contactosProcesados;

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.obtenerConSolicitantes:', error);
            throw error;
        }
    }

    /**
     * Crear nuevo contacto bancario
     */
    static async crear(contactoData) {
        try {
            const { data: contacto, error } = await supabase
                .from('contactos_bancarios')
                .insert([contactoData])
                .select()
                .single();

            if (error) throw error;
            return contacto;

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.crear:', error);
            throw error;
        }
    }

    /**
     * Obtener contacto por ID
     */
    static async obtenerPorId(id) {
        try {
            const { data: contacto, error } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return contacto;

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.obtenerPorId:', error);
            throw error;
        }
    }

    /**
     * Actualizar contacto bancario
     */
    static async actualizar(id, updateData) {
        try {
            const { data: contacto, error } = await supabase
                .from('contactos_bancarios')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return contacto;

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.actualizar:', error);
            throw error;
        }
    }

    /**
     * Eliminar contacto (soft delete)
     */
    static async eliminar(id) {
        try {
            const { data: contacto, error } = await supabase
                .from('contactos_bancarios')
                .update({
                    estado: 'inactivo',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return contacto;

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.eliminar:', error);
            throw error;
        }
    }

    /**
     * Verificar si existe un contacto con el mismo número de cuenta
     */
    static async existeNumeroCuenta(numero_cuenta, excludeId = null) {
        try {
            let query = supabase
                .from('contactos_bancarios')
                .select('id', { count: 'exact', head: true })
                .eq('numero_cuenta', numero_cuenta)
                .eq('estado', 'activo');

            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            const { count, error } = await query;

            if (error) throw error;
            return count > 0;

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.existeNumeroCuenta:', error);
            throw error;
        }
    }

    /**
     * Obtener solicitante por email
     */
    static async obtenerSolicitantePorEmail(email) {
        try {
            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('id, rol')
                .eq('email', email)
                .eq('rol', 'solicitante')
                .single();

            if (error) throw error;
            return usuario;

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.obtenerSolicitantePorEmail:', error);
            throw error;
        }
    }

    /**
     * Validar formato de número de cuenta
     */
    static validarNumeroCuenta(numero_cuenta) {
        const cuentaRegex = /^\d{6,24}$/;
        return cuentaRegex.test(numero_cuenta.toString());
    }

    /**
     * Validar formato de teléfono
     */
    static validarTelefono(telefono) {
        if (!telefono) return true; // Opcional
        return /^\+?\d{7,15}$/.test(telefono);
    }

    /**
     * Validar formato de email
     */
    static validarEmail(email) {
        if (!email) return true; // Opcional
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Obtener estadísticas de contactos
     */
    static async obtenerEstadisticas() {
        try {
            const { count: total, error: totalError } = await supabase
                .from('contactos_bancarios')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'activo');

            if (totalError) throw totalError;

            const { count: ahorros, error: ahorrosError } = await supabase
                .from('contactos_bancarios')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'activo')
                .eq('tipo_cuenta', 'ahorros');

            if (ahorrosError) throw ahorrosError;

            const { count: corriente, error: corrienteError } = await supabase
                .from('contactos_bancarios')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'activo')
                .eq('tipo_cuenta', 'corriente');

            if (corrienteError) throw corrienteError;

            return {
                total: total || 0,
                ahorros: ahorros || 0,
                corriente: corriente || 0
            };

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.obtenerEstadisticas:', error);
            throw error;
        }
    }

    /**
     * Buscar contactos por múltiples criterios
     */
    static async buscarAvanzado(criterios = {}) {
        try {
            let query = supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('estado', 'activo');

            // Aplicar filtros
            if (criterios.numero_cuenta) {
                query = query.ilike('numero_cuenta', `%${criterios.numero_cuenta}%`);
            }

            if (criterios.nombre_banco) {
                query = query.ilike('nombre_banco', `%${criterios.nombre_banco}%`);
            }

            if (criterios.tipo_cuenta) {
                query = query.eq('tipo_cuenta', criterios.tipo_cuenta);
            }

            if (criterios.moneda) {
                query = query.eq('moneda', criterios.moneda);
            }

            if (criterios.email_contacto) {
                query = query.ilike('email_contacto', `%${criterios.email_contacto}%`);
            }

            query = query.order('created_at', { ascending: false });

            const { data: contactos, error } = await query;

            if (error) throw error;
            return contactos || [];

        } catch (error) {
            console.error('. Error en ContactosBancariosModel.buscarAvanzado:', error);
            throw error;
        }
    }
}

module.exports = ContactosBancariosModel;