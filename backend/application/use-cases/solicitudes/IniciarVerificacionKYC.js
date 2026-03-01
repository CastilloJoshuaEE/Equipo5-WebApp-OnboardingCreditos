// backend/application/use-cases/solicitudes/IniciarVerificacionKYC.js
class IniciarVerificacionKYC {
  constructor(solicitudRepository, verificacionKYCRepository, diditService, supabase) {
    this.solicitudRepository = solicitudRepository;
    this.verificacionKYCRepository = verificacionKYCRepository;
    this.diditService = diditService;
    this.supabase = supabase;
  }

  async execute(solicitud_id) {

    const solicitud = await this.solicitudRepository.findById(solicitud_id);

    if (!solicitud) {
      return {
        success: false,
        status: 404,
        message: 'Solicitud no encontrada'
      };
    }

    const { data: usuario, error: usuarioError } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', solicitud.solicitante_id)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        status: 404,
        message: 'Usuario no encontrado'
      };
    }

    const { data: solicitante, error: solicitanteError } = await this.supabase
      .from('solicitantes')
      .select('nombre_empresa')
      .eq('id', solicitud.solicitante_id)
      .single();

    const resultado = await this.diditService.createVerificationSession({
      userId: usuario.id,
      email: usuario.email,
      phone: usuario.telefono,
      firstName: usuario.nombre_completo.split(' ')[0],
      lastName: usuario.nombre_completo.split(' ').slice(1).join(' '),
      companyName: solicitante?.nombre_empresa || 'Empresa'
    });

    if (!resultado.success) {
      throw new Error(resultado.error);
    }

    await this.verificacionKYCRepository.create({
      solicitud_id,
      session_id: resultado.sessionId,
      estado: 'pendiente',
      proveedor: 'didit',
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Verificación KYC iniciada exitosamente',
      data: {
        verificationUrl: resultado.verificationUrl,
        sessionId: resultado.sessionId
      }
    };
  }
}

module.exports = IniciarVerificacionKYC;