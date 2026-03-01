// backend/application/use-cases/documentos/ObtenerMisSolicitudesConDocumentos.js
class ObtenerMisSolicitudesConDocumentos {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async execute(usuario) {
    const usuario_id = usuario.id;
    const usuario_rol = usuario.rol;

    let solicitudes;

    if (usuario_rol === 'solicitante') {
      const { data: solicitudesData, error } = await this.supabase
        .from('solicitudes_credito')
        .select(`
          *,
          contratos(*),
          transferencias_bancarias(*),
          solicitantes: solicitantes!solicitante_id(
            usuarios(nombre_completo, email)
          )
        `)
        .eq('solicitante_id', usuario_id)
        .eq('estado', 'aprobado')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          status: 500,
          message: 'Error al obtener solicitudes'
        };
      }

      solicitudes = solicitudesData || [];

      if (solicitudes.length > 0) {
        const contratosIds = [];

        solicitudes.forEach(solicitud => {
          if (solicitud.contratos && Array.isArray(solicitud.contratos)) {
            solicitud.contratos.forEach(contrato => {
              if (contrato.id) contratosIds.push(contrato.id);
            });
          } else if (solicitud.contratos && solicitud.contratos.id) {
            contratosIds.push(solicitud.contratos.id);
          }
        });

        if (contratosIds.length > 0) {
          const { data: firmasDigitales } = await this.supabase
            .from('firmas_digitales')
            .select('*')
            .in('contrato_id', contratosIds);

          solicitudes = solicitudes.map(solicitud => {
            if (solicitud.contratos) {
              const contratosActualizados = Array.isArray(solicitud.contratos)
                ? solicitud.contratos.map(contrato => {
                    const firmaAsociada = firmasDigitales?.find(firma => firma.contrato_id === contrato.id);
                    return {
                      ...contrato,
                      firma_digital: firmaAsociada || null
                    };
                  })
                : [{
                    ...solicitud.contratos,
                    firma_digital: firmasDigitales?.find(firma => firma.contrato_id === solicitud.contratos.id) || null
                  }];

              return {
                ...solicitud,
                contratos: contratosActualizados
              };
            }
            return solicitud;
          });
        }
      }
    } else if (usuario_rol === 'operador') {
      const { data, error } = await this.supabase
        .from('solicitudes_credito')
        .select(`
          *,
          contratos(*, firmas_digitales(*)),
          transferencias_bancarias(*),
          solicitantes: solicitantes!solicitante_id(
            usuarios(nombre_completo, email)
          ),
          operadores: operadores!operador_id(
            usuarios(nombre_completo, email)
          )
        `)
        .eq('estado', 'aprobado')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          status: 500,
          message: 'Error al obtener solicitudes'
        };
      }

      solicitudes = data || [];
    } else {
      return {
        success: false,
        status: 403,
        message: 'Rol no autorizado'
      };
    }


    return {
      success: true,
      data: solicitudes || []
    };
  }
}

module.exports = ObtenerMisSolicitudesConDocumentos;