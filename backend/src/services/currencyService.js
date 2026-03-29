
const getCountriesAndCurrencies = async () => {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        
        if (!response.ok) {
            throw new Error(`RestCountries API responded with status: ${response.status}`);
        }

        const data = await response.json();
        const formattedData = data
            .filter(country => country.currencies) 
            .map(country => {
                const currencyCode = Object.keys(country.currencies)[0];
                return {
                    countryName: country.name.common,
                    currencyCode: currencyCode,
                    currencyName: country.currencies[currencyCode].name,
                    currencySymbol: country.currencies[currencyCode].symbol || ''
                };
            });


        return formattedData.sort((a, b) => a.countryName.localeCompare(b.countryName));
        
    } catch (error) {
        console.error('Error in getCountriesAndCurrencies:', error.message);
        throw new Error('Could not retrieve country and currency list.');
    }
};

/**
 * Converts an expense amount to the company's base currency.
 * Returns the exact exchange rate used for database auditing.
 * 
 * @param {number} amount - The expense amount submitted by the employee
 * @param {string} expenseCurrency - The currency of the receipt (e.g., 'EUR')
 * @param {string} baseCurrency - The company's default currency (e.g., 'USD')
 */
const convertExpenseCurrency = async (amount, expenseCurrency, baseCurrency) => {
    // If the currencies are the same, bypass the API call entirely
    if (expenseCurrency.toUpperCase() === baseCurrency.toUpperCase()) {
        return {
            originalAmount: amount,
            convertedAmount: amount,
            exchangeRate: 1,
            baseCurrency: baseCurrency.toUpperCase()
        };
    }

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${expenseCurrency.toUpperCase()}`);
        
        if (!response.ok) {
            throw new Error(`ExchangeRate API responded with status: ${response.status}`);
        }

        const data = await response.json();
        const exchangeRate = data.rates[baseCurrency.toUpperCase()];

        if (!exchangeRate) {
            throw new Error(`Exchange rate for target currency ${baseCurrency} not found.`);
        }

        const convertedAmount = amount * exchangeRate;

        // Return a structured object so the controller can easily save these exact values to the DB
        return {
            originalAmount: amount,
            convertedAmount: parseFloat(convertedAmount.toFixed(2)), 
            exchangeRate: exchangeRate,
            baseCurrency: baseCurrency.toUpperCase()
        };

    } catch (error) {
        console.error('Error in convertExpenseCurrency:', error.message);
        throw new Error('Currency conversion failed. Please try again later.');
    }
};

module.exports = {
    getCountriesAndCurrencies,
    convertExpenseCurrency
};