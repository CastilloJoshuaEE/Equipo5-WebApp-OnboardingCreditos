const { supabase } = require('../config/conexion');

class ContactosBancariosController {
    
    /**
     * Obtener contactos bancarios de un solicitante
     */
    static async obtenerContactosPorSolicitante(req, res) {
        try {
            const { solicitante_id } = req.params;
            const usuario = req.usuario;

            // Verificar permisos
            if (usuario.rol === 'solicitante' && usuario.id !== solicitante_id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver estos contactos'
                });
            }

            const { data: contactos, error } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('solicitante_id', solicitante_id)
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                data: contactos || []
            });

        } catch (error) {
            console.error('Error obteniendo contactos bancarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener contactos bancarios'
            });
        }
    }

    /**
     * Buscar contactos por DNI
     */
    static async buscarContactosPorDNI(req, res) {
        try {
            const { dni } = req.query;
            const usuario = req.usuario;

            if (!dni) {
                return res.status(400).json({
                    success: false,
                    message: 'DNI es requerido'
                });
            }

            // Buscar solicitante por DNI
            const { data: solicitante, error: solError } = await supabase
                .from('usuarios')
                .select('id, nombre_completo, email, dni')
                .eq('dni', dni)
                .eq('rol', 'solicitante')
                .single();

            if (solError || !solicitante) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró solicitante con ese DNI'
                });
            }

            // Buscar contactos bancarios del solicitante
            const { data: contactos, error } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('solicitante_id', solicitante.id)
                .eq('estado', 'activo');

            if (error) throw error;

            res.json({
                success: true,
                data: {
                    solicitante: {
                        id: solicitante.id,
                        nombre_completo: solicitante.nombre_completo,
                        email: solicitante.email,
                        dni: solicitante.dni
                    },
                    contactos: contactos || []
                }
            });

        } catch (error) {
            console.error('Error buscando contactos por DNI:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar contactos'
            });
        }
    }

    /**
     * Crear nuevo contacto bancario
     */
    static async crearContacto(req, res) {
        try {
            const {
                solicitante_id,
                numero_cuenta,
                tipo_cuenta = 'ahorros',
                moneda = 'USD',
                nombre_banco = 'Pichincha',
                email_contacto,
                telefono_contacto
            } = req.body;

            const usuario = req.usuario;

            // Validaciones
            if (!solicitante_id || !numero_cuenta) {
                return res.status(400).json({
                    success: false,
                    message: 'Solicitante ID y número de cuenta son requeridos'
                });
            }

            // Validar formato de email si se proporciona
            if (email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_contacto)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de email inválido'
                });
            }

            // Verificar que el solicitante existe
            const { data: solicitante, error: solError } = await supabase
                .from('solicitantes')
                .select('id')
                .eq('id', solicitante_id)
                .single();

            if (solError || !solicitante) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitante no encontrado'
                });
            }

            const contactoData = {
                solicitante_id,
                numero_cuenta,
                tipo_cuenta,
                moneda,
                nombre_banco,
                email_contacto,
                telefono_contacto,
                estado: 'activo',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: contacto, error } = await supabase
                .from('contactos_bancarios')
                .insert([contactoData])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                message: 'Contacto bancario creado exitosamente',
                data: contacto
            });

        } catch (error) {
            console.error('Error creando contacto bancario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear contacto bancario'
            });
        }
    }

    /**
     * Obtener mis contactos (para operador)
     */
    static async obtenerMisContactos(req, res) {
        try {
            const usuario = req.usuario;

            if (usuario.rol !== 'operador') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los operadores pueden acceder a esta función'
                });
            }

            // Obtener contactos de solicitudes asignadas al operador
            const { data: contactos, error } = await supabase
                .from('contactos_bancarios')
                .select(`
                    *,
                    solicitantes: solicitante_id (
                        usuarios: usuarios!inner (
                            nombre_completo,
                            dni,
                            email
                        )
                    )
                `)
                .eq('estado', 'activo')
                .order('solicitantes.usuarios.nombre_completo', { ascending: true });

            if (error) throw error;

            // Procesar datos para respuesta más limpia
            const contactosProcesados = contactos?.map(contacto => ({
                ...contacto,
                solicitante_nombre: contacto.solicitantes?.usuarios?.nombre_completo,
                solicitante_dni: contacto.solicitantes?.usuarios?.dni,
                solicitante_email: contacto.solicitantes?.usuarios?.email
            })) || [];

            res.json({
                success: true,
                data: contactosProcesados
            });

        } catch (error) {
            console.error('Error obteniendo mis contactos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener contactos'
            });
        }
    }
}

module.exports = ContactosBancariosController;