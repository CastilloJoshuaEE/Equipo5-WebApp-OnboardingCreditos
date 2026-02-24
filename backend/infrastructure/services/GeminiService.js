const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2000,
            }
        });
        this.contexto = this.cargarContextoNexia();
    }

    cargarContextoNexia() {
        return `
        SISTEMA NEXIA - ONBOARDING DE CRÉDITOS PARA PYMES

        Nombre: Plataforma Web de Onboarding de Créditos para PYMES
        Eslogan: "Financiamiento ágil para el crecimiento de tu empresa"

        DESCRIPCIÓN:
        Nexia es una plataforma Fintech especializada en simplificar y agilizar el proceso de solicitud 
        de créditos para Pequeñas y Medianas Empresas (PYMES).

        FUNCIONALIDADES PRINCIPALES:
        1. Módulo de Autenticación y Usuarios
        2. Módulo de Solicitudes de Crédito
        3. Dashboard Operador con Filtros Avanzados
        4. Integraciones Externas (BCRA, DIDIT, Supabase)

        POLÍTICAS DEL SISTEMA:
        - Seguridad de datos: Encriptación end-to-end
        - Procesamiento de créditos: Evaluación automatizada, scoring sobre 100 puntos
        - Documentación requerida: DNI, CUIT, comprobante domicilio, balance contable, declaración impuestos
        - Tiempo máximo de respuesta: 72 horas hábiles

        MÓDULOS:
        - Módulo Operador: Dashboard con métricas, evaluación por criterios
        - Módulo de Documentos: Subida múltiple, extracción automática con OCR

        TECNOLOGÍAS:
        Backend: Node.js, Express, Supabase
        Frontend: Next.js 14, Material UI
        Servicios: BCRA API, DIDIT KYC/AML

        FLUJO DE TRABAJO:
        Para Solicitantes: Registro → Completar solicitud → Subir documentos → Seguimiento
        Para Operadores: Revisar dashboard → Evaluar documentación → Consultar BCRA → Tomar decisión

        CONTACTO:
        Correo: fintechpymes@nocountry.dev
        `;
    }

    async generarRespuesta(mensaje, usuario = null) {
        try {
            const promptSistema = `
            Eres un asistente virtual especializado en el sistema Nexia de onboarding de créditos para PYMES.

            CONTEXTO DEL SISTEMA:
            ${this.contexto}

            INSTRUCCIONES:
            1. Responde ÚNICAMENTE preguntas relacionadas con el sistema Nexia, procesos de crédito, documentación requerida, políticas del sistema y funcionalidades.
            2. Para usuarios autenticados, puedes proporcionar información específica de su perfil cuando sea relevante.
            3. Para usuarios no autenticados, enfócate en información general del sistema y proceso de registro.
            4. Si no sabes la respuesta o la pregunta está fuera del contexto, sugiere contactar al equipo de soporte.
            5. Sé claro, conciso y profesional.

            ${usuario ? `INFORMACIÓN DEL USUARIO ACTUAL:
            - Rol: ${usuario.rol}
            - Nombre: ${usuario.nombre_completo}
            - Email: ${usuario.email}` : 'USUARIO: No autenticado'}

            PREGUNTA DEL USUARIO: ${mensaje}
            `;

            const result = await this.model.generateContent(promptSistema);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error en Gemini Service:', error);
            return 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor intenta nuevamente.';
        }
    }

    analizarSentimiento(mensaje) {
        // Implementación básica de análisis de sentimiento
        const palabrasPositivas = ['gracias', 'excelente', 'bueno', 'genial', 'ayuda', 'agradecido'];
        const palabrasNegativas = ['problema', 'error', 'molesto', 'mal', 'lento', 'difícil'];
        
        const texto = mensaje.toLowerCase();
        let score = 0;
        
        palabrasPositivas.forEach(palabra => {
            if (texto.includes(palabra)) score++;
        });
        
        palabrasNegativas.forEach(palabra => {
            if (texto.includes(palabra)) score--;
        });
        
        if (score > 0) return 'positivo';
        if (score < 0) return 'negativo';
        return 'neutro';
    }
}

module.exports = new GeminiService();