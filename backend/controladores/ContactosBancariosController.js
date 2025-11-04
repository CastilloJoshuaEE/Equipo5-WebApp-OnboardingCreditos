const ContactosBancariosModel = require('../modelos/ContactosBancariosModel');

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

            const contactos = await ContactosBancariosModel.obtenerTodos();

            console.log(`. Contactos encontrados: ${contactos.length}`);

            res.json({
                success: true,
                data: contactos
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

            const contactos = await ContactosBancariosModel.buscarPorNumeroCuenta(numero_cuenta);

            console.log(`. Contactos encontrados: ${contactos.length}`);

            res.json({
                success: true,
                data: {
                    contactos: contactos
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

    /**
     * Obtener todos los contactos
     */
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

            const contactos = await ContactosBancariosModel.obtenerTodos();

            console.log(`. Contactos encontrados: ${contactos.length}`);

            res.json({
                success: true,
                data: contactos
            });

        } catch (error) {
            console.error('. Error obteniendo contactos bancarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener contactos bancarios'
            });
        }
    }

    /**
     * Crear contacto bancario
     */
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
                return res.status(400).json({ 
                    success: false, 
                    message: 'Número de cuenta es requerido' 
                });
            }

            // Validar formato usando el modelo
            if (!ContactosBancariosModel.validarNumeroCuenta(numero_cuenta)) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de cuenta inválido. Debe ser numérico (6-24 dígitos).'
                });
            }

            // Validar teléfono usando el modelo
            if (!ContactosBancariosModel.validarTelefono(telefono_contacto)) {
                return res.status(400).json({
                    success: false,
                    message: 'Teléfono inválido. Formato: +593987654321 (solo dígitos, 7-15).'
                });
            }

            // Validar email usando el modelo
            if (!ContactosBancariosModel.validarEmail(email_contacto)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de email inválido'
                });
            }

            // Verificar si el email pertenece a un solicitante
            console.log('    Buscando solicitante por email:', email_contacto);
            const usuarioSolicitante = await ContactosBancariosModel.obtenerSolicitantePorEmail(email_contacto);
            
            if (!usuarioSolicitante) {
                console.log('    No se encontró solicitante con email:', email_contacto);
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró un solicitante registrado con ese email'
                });
            }

            const solicitante_id = usuarioSolicitante.id;
            console.log('    Solicitante encontrado:', solicitante_id);

            // Verificar si ya existe un contacto con el mismo número de cuenta
            const existeContacto = await ContactosBancariosModel.existeNumeroCuenta(numero_cuenta);
            if (existeContacto) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un contacto con ese número de cuenta'
                });
            }

            // Preparar datos del contacto
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

            console.log('. Guardando contacto bancario:', contactoData);

            // Crear contacto usando el modelo
            const contacto = await ContactosBancariosModel.crear(contactoData);

            console.log('. Contacto bancario creado exitosamente:', contacto.id);

            res.status(201).json({
                success: true,
                message: 'Contacto bancario creado exitosamente',
                data: contacto
            });

        } catch (error) {
            console.error('. Error creando contacto bancario:', error);
            
            // Manejar errores específicos de Supabase
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un contacto con ese número de cuenta'
                });
            }

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

            // Validación defensiva
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

            // Obtener contactos con información de solicitantes usando el modelo
            const contactosProcesados = await ContactosBancariosModel.obtenerConSolicitantes();

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
            const contactoExistente = await ContactosBancariosModel.obtenerPorId(id);
            if (!contactoExistente) {
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

            // Validar formato usando el modelo
            if (numero_cuenta && !ContactosBancariosModel.validarNumeroCuenta(numero_cuenta)) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de cuenta inválido. Debe ser numérico (6-24 dígitos).'
                });
            }

            // Validar teléfono usando el modelo
            if (telefono_contacto && !ContactosBancariosModel.validarTelefono(telefono_contacto)) {
                return res.status(400).json({
                    success: false,
                    message: 'Teléfono inválido. Formato: +593987654321 (solo dígitos, 7-15).'
                });
            }

            // Validar email usando el modelo
            if (email_contacto && !ContactosBancariosModel.validarEmail(email_contacto)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de email inválido'
                });
            }

            // Verificar duplicado de número de cuenta
            if (numero_cuenta && numero_cuenta !== contactoExistente.numero_cuenta) {
                const existeContacto = await ContactosBancariosModel.existeNumeroCuenta(numero_cuenta, id);
                if (existeContacto) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un contacto con ese número de cuenta'
                    });
                }
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

            // Actualizar contacto usando el modelo
            const contacto = await ContactosBancariosModel.actualizar(id, updateData);

            res.json({
                success: true,
                message: 'Contacto bancario actualizado exitosamente',
                data: contacto
            });

        } catch (error) {
            console.error('Error editando contacto bancario:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un contacto con ese número de cuenta'
                });
            }

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
            const contactoExistente = await ContactosBancariosModel.obtenerPorId(id);
            if (!contactoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Contacto bancario no encontrado'
                });
            }

            // Eliminar contacto usando el modelo
            const contacto = await ContactosBancariosModel.eliminar(id);

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

    /**
     * Obtener estadísticas de contactos
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const usuario = req.usuario;

            if (usuario.rol !== 'operador') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los operadores pueden ver estadísticas'
                });
            }

            const estadisticas = await ContactosBancariosModel.obtenerEstadisticas();

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de contactos'
            });
        }
    }
}

module.exports = ContactosBancariosController;