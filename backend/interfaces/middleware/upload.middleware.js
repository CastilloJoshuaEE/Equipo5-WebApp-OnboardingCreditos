// backend/interfaces/middleware/upload.middleware.js
const multer = require("multer"); 

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite (aumentado para documentos)
  },
  fileFilter: (req, file, cb) => {
    // Tipos MIME permitidos
    const allowedTypes = [
      // Documentos Word
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Documentos PDF
      'application/pdf',
      // Archivos Excel
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Archivos CSV
      'text/csv',
      'application/csv',
      'text/plain', // Para archivos .csv que a veces vienen como text/plain
      // Imágenes (para DNI, etc)
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Formatos aceptados: DOCX, DOC, PDF, XLSX, XLS, CSV, JPG, PNG`), false);
    }
  }
});

module.exports = upload;