// controladores/authController.js
const { supabase } = require('../config/conexion.js');
const { supabaseAdmin } = require('../config/supabaseAdmin.js');

class AuthController {
  
  /**
   * Login de usuario
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      let intentoExitoso = false;

      const userAgent = req.get('User-Agent');
      console.log('. Backend: Procesando login para:', email);
        // Verificar si la cuenta está bloqueada temporalmente
 
      // Validar campos obligatorios
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // 1. PRIMERO verificar si existe en nuestra tabla usuarios
      console.log('. Verificando existencia en tabla usuarios...');
      const { data: usuarioExistente, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, email, cuenta_activa, rol, nombre_completo')
        .eq('email', email)
        .maybeSingle();

      if (usuarioError) {
        console.error('. Error verificando usuario:', usuarioError);
        throw usuarioError;
      }
        const { data: bloqueosRecientes, error: bloqueoError } = await supabase
            .from('intentos_login')
            .select('created_at')
            .eq('email', email)
            .eq('intento_exitoso', false)
            .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Últimos 15 minutos
            .order('created_at', { ascending: false })
            .limit(5);

        if (bloqueoError) throw bloqueoError;
       // Bloquear si hay 5 o más intentos fallidos en 15 minutos
if (bloqueosRecientes && bloqueosRecientes.length >= 5 && usuarioExistente?.cuenta_activa === false) {
            console.log('. Cuenta temporalmente bloqueada por intentos fallidos:', email);
            
            // Registrar el intento bloqueado
            await supabase
                .from('intentos_login')
                .insert([{
                    email,
                    intento_exitoso: false,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    bloqueado: true
                }]);

            return res.status(429).json({
                success: false,
                message: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intente nuevamente en 15 minutos. O use la opción de "Recuperar cuenta inactiva"'
            });
        }            
        if (usuarioExistente && usuarioExistente.cuenta_activa) {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            intentoExitoso = !authError;
        }

        // Registrar el intento
        await supabase
            .from('intentos_login')
            .insert([{
                usuario_id: usuarioExistente?.id,
                email,
                intento_exitoso: intentoExitoso,
                ip_address: ipAddress,
                user_agent: userAgent
            }]);

        // Si el login falla después de registrar el intento
        if (!intentoExitoso && usuarioExistente) {
            // Verificar si este intento fallido alcanza el límite
            const nuevosBloqueos = [...(bloqueosRecientes || []), { created_at: new Date().toISOString() }];
            
            if (nuevosBloqueos.length >= 5) {
                console.log('. Bloqueando cuenta después del 5to intento fallido:', email);
                
                // Opcional: Desactivar la cuenta
                await supabase
                    .from('usuarios')
                    .update({ cuenta_activa: false })
                    .eq('email', email);
                    
                return res.status(429).json({
                    success: false,
                    message: 'Cuenta bloqueada por seguridad después de múltiples intentos fallidos. Contacte al administrador. Esperar 15 minutos'
                });
            }
        }

      // Si no existe en nuestra tabla, rechazar login inmediatamente
      if (!usuarioExistente) {
        console.log('. Usuario no encontrado en tabla usuarios');
        return res.status(401).json({
          success: false,
          message: 'No hay una cuenta registrada con este email. Por favor regístrese primero.'
        });
      }

      // 2. Verificar si la cuenta está activa (CONFIRMACIÓN LOCAL)
      if (!usuarioExistente.cuenta_activa) {
        console.log('. Cuenta no confirmada encontrada');
        return res.status(401).json({
          success: false,
          message: 'Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
        });
      }

      console.log('. Usuario válido y confirmado encontrado en tabla usuarios, procediendo con autenticación...');

      // 3. Autenticar con Supabase Auth (ESTO GENERA LOS TOKENS)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('. Error en Supabase Auth:', authError);
        
        let errorMessage = 'Credenciales inválidas';
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (authError.message.includes('Email not confirmed')) {
          // Si el email no está confirmado en Auth pero SÍ en nuestra tabla, permitir login
          console.log('. Email no confirmado en Auth, pero usuario confirmado localmente. Continuando...');
          
          // Crear una sesión manual para el usuario
          const userProfile = {
            id: usuarioExistente.id,
            email: usuarioExistente.email,
            nombre_completo: usuarioExistente.nombre_completo,
            rol: usuarioExistente.rol,
            cuenta_activa: true
          };

          return res.json({
            success: true,
            message: 'Login exitoso (confirmación local)',
            data: {
              user: userProfile,
              profile: userProfile,
              session: {
                access_token: 'local_auth_no_token',
                refresh_token: 'local_auth_no_token',
                expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hora
                user: { id: usuarioExistente.id, email: usuarioExistente.email }
              },
              localAuth: true
            }
          });
        }
        
        return res.status(401).json({
          success: false,
          message: errorMessage
        });
      }

      console.log('. Login exitoso en Supabase Auth, ID:', authData.user.id);

      // 4. VERIFICAR INCONSISTENCIA DE IDs Y CORREGIRLA
      const authUserId = authData.user.id;
      const nuestraUserId = usuarioExistente.id;

      if (authUserId !== nuestraUserId) {
        console.warn('. INCONSISTENCIA DE IDs DETECTADA:', {
          authId: authUserId,
          nuestraId: nuestraUserId,
          email: email
        });

        // CORREGIR: Actualizar nuestro ID al de Auth para mantener consistencia
        console.log('. Corrigiendo inconsistencia de IDs...');
        
        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update({ id: authUserId })
          .eq('id', nuestraUserId);

        if (updateError) {
          console.error('. Error corrigiendo ID en tabla usuarios:', updateError);
          // Continuar pero usar el ID de Auth para la búsqueda
        } else {
          console.log('. ID . exitosamente en tabla usuarios');
          
          // ACTUALIZAR TABLAS RELACIONADAS
          try {
            // Actualizar tabla solicitantes si existe
            await supabaseAdmin
              .from('solicitantes')
              .update({ id: authUserId })
              .eq('id', nuestraUserId);

            console.log('. ID actualizado en tabla solicitantes');
          } catch (solicitanteError) {
            console.warn('. Error actualizando tabla solicitantes:', solicitanteError.message);
          }
        }
      }

      // 5. Obtener perfil completo del usuario (usar ID de Auth después de la .)
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (profileError) {
        console.error('. Error obteniendo perfil completo:', profileError);
        
        // SI FALLA, INTENTAR CON EL EMAIL COMO FALLBACK
        console.log('. Intentando obtener perfil por email como fallback...');
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .single();

        if (fallbackError || !fallbackProfile) {
          console.error('. Error obteniendo perfil incluso por email:', fallbackError);
          throw new Error('No se pudo obtener el perfil del usuario');
        }

        console.log('. Perfil obtenido por email exitosamente');
        
        // Respuesta exitosa con perfil obtenido por email
        return res.json({
          success: true,
          message: 'Login exitoso (perfil obtenido por email)',
          data: {
            user: authData.user,
            profile: fallbackProfile,
            session: {
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
              expires_at: authData.session.expires_at,
              user: {
                id: authData.user.id,
                email: authData.user.email
              }
            },
            idInconsistency: true
          }
        });
      }

      console.log('. Login completado exitosamente');

      // . ESTRUCTURA OPTIMIZADA PARA NEXT AUTH
      const responseData = {
        success: true,
        message: 'Login exitoso',
        data: {
          user: authData.user,
          profile: userProfile,
          session: {
            // . TOKENS DE SUPABASE QUE NEXT AUTH NECESITA
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at,
            user: {
              id: authData.user.id,
              email: authData.user.email
            }
          }
        }
      };

      console.log('. Login completado, enviando tokens a NextAuth');
      res.json(responseData);

    } catch (error) {
      console.error('. Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante el login'
      });
    }
  }

  /**
   * Refresh token
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   */
  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token es requerido'
        });
      }

      console.log('. Refrescando token...');

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });

      if (error) {
        console.error('. Error refrescando token:', error);
        return res.status(401).json({
          success: false,
          message: 'Sesión expirada, por favor inicia sesión nuevamente'
        });
      }

      console.log('. Token refrescado exitosamente');

      res.json({
        success: true,
        message: 'Token refrescado',
        data: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      });

    } catch (error) {
      console.error('. Error en refreshToken:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Logout de usuario
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   */
  static async logout(req, res) {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      res.json({
        success: true,
        message: 'Sesión cerrada correctamente'
      });
    } catch (error) {
      console.error('. Error en logout:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener sesión actual
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   */
  static async getSession(req, res) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'No hay sesión activa'
        });
      }

      console.log('. Verificando sesión para usuario:', session.user.id);

      // PRIMERO: Intentar obtener perfil por ID de Auth
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('. Error obteniendo perfil por ID en getSession:', profileError);
        
        // SEGUNDO: Intentar por email como fallback
        console.log('. Intentando obtener perfil por email en getSession...');
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (fallbackError || !fallbackProfile) {
          console.error('. Error obteniendo perfil incluso por email en getSession:', fallbackError);
          return res.status(404).json({
            success: false,
            message: 'Perfil de usuario no encontrado. Por favor inicie sesión nuevamente.'
          });
        }

        console.log('. Perfil obtenido por email en getSession exitosamente');
        
        // TERCERO: CORREGIR INCONSISTENCIA automáticamente
        console.log('. Corrigiendo inconsistencia de IDs automáticamente...');
        await AuthController.corregirInconsistenciaIDs(session.user.id, fallbackProfile.id, session.user.email);
        
        // Verificar si la cuenta está activa
        if (!fallbackProfile.cuenta_activa) {
          return res.status(401).json({
            success: false,
            message: 'Cuenta desactivada'
          });
        }

        return res.json({
          success: true,
          data: {
            session,
            user: session.user,
            profile: fallbackProfile,
            idInconsistency: true,
            autoCorrected: true
          }
        });
      }

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de usuario no encontrado. Por favor inicie sesión nuevamente.'
        });
      }

      if (!userProfile.cuenta_activa) {
        return res.status(401).json({
          success: false,
          message: 'Cuenta desactivada'
        });
      }

      res.json({
        success: true,
        data: {
          session,
          user: session.user,
          profile: userProfile
        }
      });
    } catch (error) {
      console.error('. Error en getSession:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Corregir inconsistencia de IDs entre Auth y tabla usuarios
   * @param {string} authId 
   * @param {string} tablaId 
   * @param {string} email 
   * @returns {Promise<boolean>}
   */
  static async corregirInconsistenciaIDs(authId, tablaId, email) {
    try {
      console.log('. Corrigiendo inconsistencia de IDs:', { authId, tablaId, email });
      
      // Actualizar ID en tabla usuarios
      const { error: updateUsuariosError } = await supabaseAdmin
        .from('usuarios')
        .update({ id: authId })
        .eq('id', tablaId);

      if (updateUsuariosError) {
        console.error('. Error actualizando ID en tabla usuarios:', updateUsuariosError);
        return false;
      }

      console.log('. ID actualizado en tabla usuarios');

      // Actualizar ID en tabla solicitantes si existe
      const { error: updateSolicitantesError } = await supabaseAdmin
        .from('solicitantes')
        .update({ id: authId })
        .eq('id', tablaId);

      if (updateSolicitantesError) {
        console.warn('. No se pudo actualizar tabla solicitantes (puede no existir):', updateSolicitantesError.message);
      } else {
        console.log('. ID actualizado en tabla solicitantes');
      }

      // Actualizar ID en tabla operadores si existe
      const { error: updateOperadoresError } = await supabaseAdmin
        .from('operadores')
        .update({ id: authId })
        .eq('id', tablaId);

      if (updateOperadoresError) {
        console.warn('. No se pudo actualizar tabla operadores (puede no existir):', updateOperadoresError.message);
      } else {
        console.log('. ID actualizado en tabla operadores');
      }

      console.log('. Inconsistencia de IDs corregida exitosamente');
      return true;
    } catch (error) {
      console.error('. Error en corregirInconsistenciaIDs:', error);
      return false;
    }
  }
}

module.exports = AuthController;