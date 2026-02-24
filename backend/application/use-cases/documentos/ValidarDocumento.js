// backend/application/use-cases/documentos/ValidarDocumento.js
const Documento = require('../../../domain/entities/Documento');
class ValidarDocumento{
    constructor(documentoRepository){
        this.documentoRepository = documentoRepository;
    }
    async execute(documento_id, {estado, comentarios}, usuario){
        if(!['validado', 'rechazado'].includes(estado)){
            return{
                success: false,
                status: 400,
                message: 'Estado debe ser "validado" o "rechazado"'
            };
        }
        //  Verificar permisos
        const tienePermisos = await this.documentoRepository.verificarPermisos(
            documento_id,
            usuario.id,
            usuario.rol
        );
        if(!tienePermisos){
            return { 
                success: false,
                status: 403,
                message: 'No tiene permisos para validar este documento'
            };
        }
        const documento = await this.documentoRepository.actualizar(documento_id,{
            estado,
            comentarios,
            validado_en: new Date().toISOString()
        });
        console.log(`Documento ${documento_id} ${estado} por operador`);
        return {
            success: true,
            message: `Documento ${estado} exitosamente`,
            data: documento
        };
    }

}
module.exports = ValidarDocumento;
