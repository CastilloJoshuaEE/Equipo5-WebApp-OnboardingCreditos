const { supabase } = require('../config/conexion');

class ContactosBancariosController {
        /**
     * Obtener contactos para operador - VERSIÓN SIMPLIFICADA
     */
    static async obtenerContactosOperador(req, res) {
        try {
            const usuario = req.usuario;

            if (usuario.rol !== 'operador') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los operadores pueden acceder a esta función'
                });
            }

            console.log('. Obteniendo contactos para operador');

            const { data: contactos, error } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log(`. Contactos encontrados: ${contactos?.length || 0}`);

            res.json({
                success: true,
                data: contactos || []
            });

        } catch (error) {
            console.error('. Error obteniendo contactos para operador:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener contactos'
            });
        }
    }
    /**
     * Buscar contactos por Número de cuenta
     */
    static async buscarContactosPorNumeroCuenta(req, res) {
        try {
            const { numero_cuenta } = req.query;
            const usuario = req.usuario;

            console.log('. Buscando contactos por número de cuenta:', numero_cuenta);

            if (!numero_cuenta) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de cuenta es requerido'
                });
            }

            // Buscar contactos por número de cuenta (INDEPENDIENTES de solicitante)
            const { data: contactos, error: contactosError } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .ilike('numero_cuenta', `%${numero_cuenta}%`)
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (contactosError) {
                console.error('. Error buscando contactos:', contactosError);
                throw contactosError;
            }

            console.log(`. Contactos encontrados: ${contactos?.length || 0}`);

            res.json({
                success: true,
                data: {
                    contactos: contactos || []
                }
            });

        } catch (error) {
            console.error('. Error crítico en buscarContactosPorNumeroCuenta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al buscar contactos'
            });
        }
    }
       static async obtenerTodosContactos(req, res) {
        try {
            const usuario = req.usuario;

            // Solo operadores pueden ver todos los contactos
            if (usuario.rol !== 'operador') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los operadores pueden ver todos los contactos'
                });
            }

            console.log('. Obteniendo TODOS los contactos bancarios');

            const { data: contactos, error } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('. Error obteniendo contactos:', error);
                throw error;
            }

            console.log(`. Contactos encontrados: ${contactos?.length || 0}`);

            res.json({
                success: true,
                data: contactos || []
            });

        } catch (error) {
            console.error('. Error obteniendo contactos bancarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener contactos bancarios'
            });
        }
    }
    static async crearContacto(req, res) {
        try {
            const {
                numero_cuenta,
                tipo_cuenta = 'ahorros',
                moneda = 'USD',
                nombre_banco = 'Nexia',
                email_contacto,
                telefono_contacto
            } = req.body;

    // Validaciones básicas
    if (!numero_cuenta || !numero_cuenta.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Número de cuenta es requerido' });
    }

    // Validar formato numero de cuenta: solo números, entre 6 y 24 dígitos (ajusta si necesitas alfanumérico)
    const cuentaRegex = /^\d{6,24}$/;
    if (!cuentaRegex.test(numero_cuenta.toString())) {
      return res.status(400).json({ success: false, message: 'Número de cuenta inválido. Debe ser numérico (6-24 dígitos).' });
    }

    // Validar telefono (E.164-esque): + opcional y 7-15 dígitos
    if (telefono_contacto && !/^\+?\d{7,15}$/.test(telefono_contacto)) {
      return res.status(400).json({ success: false, message: 'Teléfono inválido. Formato: +593987654321 (solo dígitos, 7-15).' });
    }

    // Validar formato de email si se proporciona
    if (email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_contacto)) {
      return res.status(400).json({ success: false, message: 'Formato de email inválido' });
    }
        console.log('    Buscando solicitante por email:', email_contacto);
        const { data: usuarioSolicitante, error: usuarioError } = await supabase
            .from('usuarios')
            .select('id, rol')
            .eq('email', email_contacto)
            .eq('rol', 'solicitante')
            .single();

        if (usuarioError || !usuarioSolicitante) {
            console.log('    No se encontró solicitante con email:', email_contacto);
            return res.status(404).json({
                success: false,
                message: 'No se encontró un solicitante registrado con ese email'
            });
        }

        // Obtener el ID del solicitante (que es el mismo que el ID de usuario)
        const solicitante_id = usuarioSolicitante.id;
        console.log('    Solicitante encontrado:', solicitante_id);


            const contactoData = {
                numero_cuenta,
                tipo_cuenta,
                moneda,
                nombre_banco,
                email_contacto,
                telefono_contacto,
                solicitante_id,
                estado: 'activo',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('📝 Guardando contacto bancario INDEPENDIENTE:', contactoData);

            const { data: contacto, error } = await supabase
                .from('contactos_bancarios')
                .insert([contactoData])
                .select()
                .single();

            if (error) {
                console.error('. Error de Supabase:', error);
                
                // Manejar error de duplicado
                if (error.code === '23505') {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un contacto con ese número de cuenta'
                    });
                }
                
                throw error;
            }

            console.log('. Contacto bancario creado exitosamente:', contacto);

            res.status(201).json({
                success: true,
                message: 'Contacto bancario creado exitosamente',
                data: contacto
            });

        } catch (error) {
            console.error('. Error creando contacto bancario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al crear contacto bancario'
            });
        }
    }
/**
 * Obtener mis contactos (para operador) - SOLUCIÓN CORREGIDA
 */
static async obtenerMisContactos(req, res) {
    try {
        const usuario = req.usuario;

        // . Validación defensiva
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (usuario.rol !== 'operador') {
            return res.status(403).json({
                success: false,
                message: 'Solo los operadores pueden acceder a esta función'
            });
        }

        console.log('. Iniciando consulta de contactos para operador:', usuario.email);

        // . PRIMERO: Obtener todos los contactos activos
        const { data: contactos, error: contactosError } = await supabase
            .from('contactos_bancarios')
            .select('*')
            .eq('estado', 'activo')
            .order('created_at', { ascending: false });

        if (contactosError) {
            console.error('Error obteniendo contactos:', contactosError);
            throw contactosError;
        }

        console.log(`. Contactos encontrados: ${contactos?.length || 0}`);

        if (!contactos || contactos.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // . SEGUNDO: Obtener información de los solicitantes
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

        if (solicitantesError) {
            console.error('Error obteniendo solicitantes:', solicitantesError);
            throw solicitantesError;
        }

        // . TERCERO: Crear un mapa de solicitantes para fácil acceso
        const solicitantesMap = {};
        solicitantes?.forEach(sol => {
            solicitantesMap[sol.id] = {
                nombre_completo: sol.usuarios?.nombre_completo,
                dni: sol.usuarios?.dni,
                email: sol.usuarios?.email
            };
        });

        // . CUARTO: Combinar la información
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

        // . ORDENAR por nombre del solicitante
        contactosProcesados.sort((a, b) => 
            (a.solicitante_nombre || '').localeCompare(b.solicitante_nombre || '')
        );

        console.log(`. Contactos procesados exitosamente: ${contactosProcesados.length} registros`);

        res.json({
            success: true,
            data: contactosProcesados
        });

    } catch (error) {
        console.error('. Error obteniendo mis contactos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener contactos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Editar contacto bancario existente
 */
static async editarContacto(req, res) {
    try {
        const { id } = req.params;
        const {
            numero_cuenta,
            tipo_cuenta,
            moneda,
            nombre_banco,
            email_contacto,
            telefono_contacto
        } = req.body;

        const usuario = req.usuario;

        // Solo operadores pueden editar contactos
        if (usuario.rol !== 'operador') {
            return res.status(403).json({
                success: false,
                message: 'Solo los operadores pueden editar contactos bancarios'
            });
        }

        // Verificar que el contacto existe
        const { data: contactoExistente, error: contactoError } = await supabase
            .from('contactos_bancarios')
            .select('*')
            .eq('id', id)
            .single();

        if (contactoError || !contactoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Contacto bancario no encontrado'
            });
        }

        // Validaciones
        if (numero_cuenta && !numero_cuenta.toString().trim()) {
            return res.status(400).json({
                success: false,
                message: 'Número de cuenta es requerido'
            });
        }

        // Validar formato numero de cuenta
        if (numero_cuenta) {
            const cuentaRegex = /^\d{6,24}$/;
            if (!cuentaRegex.test(numero_cuenta.toString())) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de cuenta inválido. Debe ser numérico (6-24 dígitos).'
                });
            }
        }

        // Validar telefono
        if (telefono_contacto && !/^\+?\d{7,15}$/.test(telefono_contacto)) {
            return res.status(400).json({
                success: false,
                message: 'Teléfono inválido. Formato: +593987654321 (solo dígitos, 7-15).'
            });
        }

        // Validar email
        if (email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_contacto)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        const updateData = {
            ...(numero_cuenta && { numero_cuenta }),
            ...(tipo_cuenta && { tipo_cuenta }),
            ...(moneda && { moneda }),
            ...(nombre_banco && { nombre_banco }),
            ...(email_contacto !== undefined && { email_contacto }),
            ...(telefono_contacto !== undefined && { telefono_contacto }),
            updated_at: new Date().toISOString()
        };

        const { data: contacto, error } = await supabase
            .from('contactos_bancarios')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando contacto:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un contacto con ese número de cuenta'
                });
            }
            
            throw error;
        }

        res.json({
            success: true,
            message: 'Contacto bancario actualizado exitosamente',
            data: contacto
        });

    } catch (error) {
        console.error('Error editando contacto bancario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al editar contacto bancario'
        });
    }
}

/**
 * Eliminar contacto bancario (soft delete)
 */
static async eliminarContacto(req, res) {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        // Solo operadores pueden eliminar contactos
        if (usuario.rol !== 'operador') {
            return res.status(403).json({
                success: false,
                message: 'Solo los operadores pueden eliminar contactos bancarios'
            });
        }

        // Verificar que el contacto existe
        const { data: contactoExistente, error: contactoError } = await supabase
            .from('contactos_bancarios')
            .select('*')
            .eq('id', id)
            .single();

        if (contactoError || !contactoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Contacto bancario no encontrado'
            });
        }

        // Soft delete - marcar como inactivo
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

        res.json({
            success: true,
            message: 'Contacto bancario eliminado exitosamente',
            data: contacto
        });

    } catch (error) {
        console.error('Error eliminando contacto bancario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al eliminar contacto bancario'
        });
    }
}
}

module.exports = ContactosBancariosController;