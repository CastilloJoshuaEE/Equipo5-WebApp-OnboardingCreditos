const { supabaseAdmin } = require('./supabaseAdmin');

const configurarStorage = async () => {
  try {
    console.log('. Configurando Supabase Storage...');

    // 1. Verificar buckets existentes
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) throw bucketsError;
    
    console.log('. Buckets existentes:', buckets.map(b => b.name));

    // 2. Crear bucket si no existe
    const bucketName = 'kyc-documents';
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`. Creando bucket: ${bucketName}`);
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) throw createError;
      console.log('. Bucket creado exitosamente');
    } else {
      console.log('. Bucket ya existe');
    }

  } catch (error) {
    console.error('. Error configurando storage:', error);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  configurarStorage();
}

module.exports = { configurarStorage };