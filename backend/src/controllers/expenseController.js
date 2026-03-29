const ocrService = require('../services/ocrService');

/**
 * Handles the uploading and scanning of a receipt image.
 * This does NOT save the expense to the database yet. It just returns the OCR data
 * so the frontend can auto-fill the form for the user to review.
 */
exports.scanReceipt = async (req, res, next) => {
    try {
        // req.file is populated by the Multer middleware we wrote earlier
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No receipt image provided. Please upload a file.' 
            });
        }

        // Pass the image buffer (from RAM) directly to our local Tesseract service
        const extractedData = await ocrService.processReceipt(req.file.buffer);

        // Send the parsed data back to the frontend
        res.status(200).json({
            success: true,
            message: 'Receipt scanned successfully.',
            data: extractedData
        });

    } catch (error) {
        console.error('Error in scanReceipt controller:', error);
        next(error); // Passes the error to your global error handler (ExpressError/catchAsync)
    }
};

/**
 * Placeholder for the actual final submission (after the user reviews the OCR data).
 * We will flesh this out once your team finishes the Database Models.
 */
exports.submitExpense = async (req, res, next) => {
    // TODO: Validate req.body using Zod/Joi
    // TODO: Call currencyService to get base company currency conversion
    // TODO: Save to DB
    // TODO: Trigger approvalEngine to notify the first manager
    res.status(201).json({ message: 'Expense submitted successfully (Mock)' });
};