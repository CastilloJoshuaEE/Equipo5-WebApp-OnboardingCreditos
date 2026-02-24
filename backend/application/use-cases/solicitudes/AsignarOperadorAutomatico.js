// backend/application/use-cases/solicitudes/AsignarOperadorAutomatico.js
class AsignarOperadorAutomatico {
  constructor(solicitudRepository, supabase) {
    this.solicitudRepository = solicitudRepository;
    this.supabase = supabase;
  }

  async execute(solicitudId) {
    try {
      const { data: operadores, error } = await this.supabase
        .from('operadores')
        .select(`
          id,
          nivel,
          usuarios!inner(nombre_completo, cuenta_activa),
          solicitudes_credito!left(
            id,
            estado
          )
        `)
        .eq('usuarios.cuenta_activa', true)
        .eq('nivel', 'analista');

      if (error) throw error;

      const operadoresConCarga = operadores.map(operador => {
        const solicitudesPendientes = operador.solicitudes_credito?.filter(
          sol => sol.estado === 'en_revision' || sol.estado === 'pendiente_info'
        ) || [];

        return {
          ...operador,
          carga: solicitudesPendientes.length
        };
      });

      operadoresConCarga.sort((a, b) => {
        if (a.carga === b.carga) {
          return Math.random() - 0.5;
        }
        return a.carga - b.carga;
      });

      const operadorAsignado = operadoresConCarga[0]?.id;

      if (!operadorAsignado) {
        throw new Error('No hay operadores disponibles para asignar');
      }

      await this.solicitudRepository.asignarOperador(solicitudId, operadorAsignado);

      console.log(`Operador ${operadorAsignado} asignado a solicitud ${solicitudId}`);

      return operadorAsignado;
    } catch (error) {
      console.error('Error asignando operador automático:', error);
      throw error;
    }
  }
}

module.exports = AsignarOperadorAutomatico;