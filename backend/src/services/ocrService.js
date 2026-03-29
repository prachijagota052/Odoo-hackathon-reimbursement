const Tesseract = require('tesseract.js');

/**
 * Runs the local Tesseract OCR engine on an image file.
 * @param {Buffer|string} imagePathOrBuffer - The uploaded receipt image.
 * @returns {Promise<string>} - The raw text extracted from the image.
 */
const extractTextFromReceipt = async (imagePathOrBuffer) => {
    try {
        // Tesseract.recognize runs locally. 
        // Note: On first run, it downloads standard language training data to a local cache.
        const { data: { text } } = await Tesseract.recognize(
            imagePathOrBuffer,
            'eng', // English language model
            { logger: m => console.log(m) } // Optional: Logs progress in the console
        );
        
        return text;
    } catch (error) {
        console.error('OCR Extraction Error:', error);
        throw new Error('Failed to extract text from the receipt image.');
    }
};

/**
 * Parses the raw OCR text to guess the Date, Total Amount, Vendor, and Category.
 * IMPORTANT: Parsing receipts locally via Regex is an approximation. 
 * @param {string} rawText 
 * @returns {Object} - The extracted fields
 */
const parseReceiptData = (rawText) => {
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 1. Guess the Vendor (Usually the very first line of a receipt)
    const vendor = lines.length > 0 ? lines[0] : 'Unknown Vendor';

    // 2. Guess the Date (Looks for DD/MM/YYYY, MM/DD/YY, YYYY-MM-DD, etc.)
    const dateRegex = /(\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4})/g;
    const dateMatch = rawText.match(dateRegex);
    const date = dateMatch ? dateMatch[0] : null;

    // 3. Guess the Total Amount (Looks for "Total", "Amount", or "$" followed by numbers)
    // This regex looks for lines containing 'total' and captures the decimal number that follows.
    const amountRegex = /total[\s:]*[$€£]?\s*(\d+[\.,]\d{2})/i;
    let amount = null;
    
    // Check line by line for the total to avoid picking up sub-totals or tax first
    for (let i = lines.length - 1; i >= 0; i--) {
        const match = lines[i].match(amountRegex);
        if (match) {
            amount = parseFloat(match[1].replace(',', '.')); // Handle European comma decimals
            break;
        }
    }

    // 4. Guess the Category based on keywords in the text
    let category = 'Miscellaneous';
    const textLower = rawText.toLowerCase();
    
    if (textLower.match(/(restaurant|cafe|food|beverage|grill|pizza)/)) {
        category = 'Meals & Entertainment';
    } else if (textLower.match(/(taxi|uber|lyft|transit|train|flight|airways)/)) {
        category = 'Travel & Transportation';
    } else if (textLower.match(/(hotel|motel|inn|suites)/)) {
        category = 'Lodging';
    }

    return {
        vendor,
        date,
        amount,
        category,
        rawText // Returning raw text is helpful for debugging or letting the user manually fix errors
    };
};

/**
 * The main service function called by the controller.
 * @param {Buffer|string} image 
 */
const processReceipt = async (image) => {
    const rawText = await extractTextFromReceipt(image);
    const parsedData = parseReceiptData(rawText);
    
    return parsedData;
};

module.exports = {
    processReceipt
};