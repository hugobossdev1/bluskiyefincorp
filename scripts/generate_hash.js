const crypto = require('crypto');
const pwd = process.argv[2] || 'X8n$G7vPq4rZ!2sY';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(pwd, salt, 100000, 64, 'sha512').toString('hex');
console.log(salt);
console.log(hash);
