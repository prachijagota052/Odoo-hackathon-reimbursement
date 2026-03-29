const multer = require('multer');
const path = require('path');

// Configure Multer to store the file in memory as a Buffer
const storage = multer.memoryStorage();

// Strict validation: Only allow image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, and PNG receipts are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit to prevent server overload
    fileFilter: fileFilter
});

module.exports = upload;