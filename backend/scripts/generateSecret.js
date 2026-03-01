// generacion de JWT_SECRET
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=', secret);