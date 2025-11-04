const allowedOrigins = [
  'http://localhost:3000',
  'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com',
  'https://nexia-sigma.vercel.app',
  'https://nexia-sigma.vercel.app/'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Permitir todos los subdominios de Vercel
      if (origin.match(/\.vercel\.app$/)) {
        callback(null, true);
      } else if (origin.match(/\.onrender\.com$/)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Access-Control-Expose-Headers'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = corsOptions;