// frontend/src/hooks/useDocumentos.ts
import { useState, useCallback } from 'react';
import { DocumentosService, DocumentoContrato, ComprobanteTransferencia, VistaPreviaDocumento } from '@/services/documentos.service';

export const useDocumentos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerDocumentosContrato = useCallback(async (solicitudId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await DocumentosService.obtenerDocumentosContrato(solicitudId);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener documentos del contrato');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerComprobantes = useCallback(async (solicitudId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await DocumentosService.obtenerComprobantesTransferencia(solicitudId);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener comprobantes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const descargarContrato = useCallback(async (contratoId: string, nombreArchivo?: string) => {
    setLoading(true);
    setError(null);
    try {
      const blob = await DocumentosService.descargarContrato(contratoId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Determinar nombre del archivo
      const nombre = nombreArchivo || `contrato-${contratoId}.docx`;
      link.setAttribute('download', nombre);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al descargar contrato');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const descargarComprobante = useCallback(async (transferenciaId: string, numeroComprobante?: string) => {
    setLoading(true);
    setError(null);
    try {
      const blob = await DocumentosService.descargarComprobante(transferenciaId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const nombre = numeroComprobante 
        ? `comprobante-${numeroComprobante}.pdf`
        : `comprobante-${transferenciaId}.pdf`;
      
      link.setAttribute('download', nombre);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al descargar comprobante');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerVistaPrevia = useCallback(async (tipo: 'contrato' | 'comprobante', id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await DocumentosService.obtenerVistaPrevia(tipo, id);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener vista previa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarPermisos = useCallback(async (solicitudId: string) => {
    try {
      return await DocumentosService.verificarPermisosDocumento(solicitudId);
    } catch (err) {
      return false;
    }
  }, []);
  const obtenerDocumentosStorage = useCallback(async (solicitudId: string) => {
    setLoading(true);
    setError(null);
    try {
        const data = await DocumentosService.obtenerDocumentosStorage(solicitudId);
        return data;
    } catch (err: any) {
        setError(err.response?.data?.message || 'Error al obtener documentos del storage');
        throw err;
    } finally {
        setLoading(false);
    }
}, []);
   const obtenerMisSolicitudesConDocumentos = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await DocumentosService.obtenerMisSolicitudesConDocumentos();
            return data;
        } catch (err: any) {
            setError(err.message || 'Error al cargar solicitudes con documentos');
            throw err;
        } finally {
            setLoading(false);
        }
    };
    

  return {
    loading,
    error,
            obtenerMisSolicitudesConDocumentos,
obtenerDocumentosStorage, 
    obtenerDocumentosContrato,
    obtenerComprobantes,
    descargarContrato,
    descargarComprobante,
    obtenerVistaPrevia,
    verificarPermisos,
  };
};