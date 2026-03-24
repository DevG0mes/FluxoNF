const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.resolve(__dirname, '..', '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        // Gera um hash aleatório para o nome do arquivo não repetir
        crypto.randomBytes(16, (err, hash) => {
            if (err) cb(err);
            const fileName = `${hash.toString('hex')}-${file.originalname}`;
            cb(null, fileName);
        });
    }
});

module.exports = {
    dest: path.resolve(__dirname, '..', '..', 'uploads'),
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB por arquivo
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/xml',
            'text/xml',
            'image/jpeg',
            'image/png'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo inválido. Apenas PDF, XML e Imagens são aceitos.'));
        }
    }
};