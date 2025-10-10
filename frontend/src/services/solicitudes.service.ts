import api from '../lib/axios';

export const SolicitudesService = {
  crearSolicitud: async (data: any) => {
    const response = await api.post('/solicitudes', data);
    return response.data;
  },

  obtenerMisSolicitudes: async () => {
    const response = await api.get('/solicitudes/mis-solicitudes');
    return response.data;
  },

  enviarSolicitud: async (solicitudId: string) => {
    const response = await api.put(`/solicitudes/${solicitudId}/enviar`);
    return response.data;
  },

  subirDocumento: async (solicitudId: string, tipo: string, archivo: File) => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('solicitud_id', solicitudId);
    formData.append('tipo', tipo);

    const response = await api.post(`/solicitudes/${solicitudId}/documentos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};