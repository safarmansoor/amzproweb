// CSV Parser for Amazon Transaction Data
class AmazonCSVParser {
    constructor() {
        this.transactions = [];
        this.processedData = null;
    }

    // Parse CSV file using Papa Parse
    parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                delimiter: ",",           // Explicit comma delimiter
                quoteChar: '"',           // Quote character for fields containing commas
                escapeChar: '"',          // Handle escaped quotes in descriptions
                newline: "\r\n",          // Handle Windows line endings
                skipEmptyLines: 'greedy', // Skip all empty lines including those with only whitespace
                transform: (value) => value ? value.trim() : value, // Trim whitespace
                complete: (results) => {
                    if (results.errors.length > 0) {
                        // Provide more detailed error information
                        const errorMessages = results.errors.map(e => 
                            `Row ${e.row}: ${e.message}`
                        );
                        reject(new Error('CSV parsing errors: ' + errorMessages.join('; ')));
                        return;
                    }
                    
                    // Validate that we have the expected number of columns
                    if (results.meta.fields && results.meta.fields.length < 15) {
                        reject(new Error(`CSV appears to have incorrect format. Expected at least 15 columns, found ${results.meta.fields.length}. Please ensure you're uploading an Amazon transaction CSV file.`));
                        return;
                    }
                    
                    // Filter out the first 7 rows (header is on row 7, data starts after)
                    // Papa Parse with header: true automatically uses the first row as headers
                    // But we need to skip the first 6 data rows that are actually metadata
                    const filteredData = results.data.filter((row, index) => {
                        // Skip first 6 rows (0-5) which contain metadata, keep from row 6 onwards
                        return index >= 6;
                    });
                    
                    this.transactions = filteredData;
                    resolve(filteredData);
                },
                error: (error) => {
                    reject(new Error(`Failed to parse CSV file: ${error.message}`));
                }
            });
        });
    }

    // Clean and normalize transaction data
    cleanTransactionData(transactions) {
        return transactions.map(transaction => {
            // Clean numeric fields - remove commas and convert to numbers
            const cleanNumber = (value) => {
                if (!value || value === '') return 0;
                // Remove commas and convert to number
                return parseFloat(value.toString().replace(/,/g, '')) || 0;
            };

            return {
                date: transaction['date/time'] || '',
                settlementId: transaction['settlement id'] || '',
                type: transaction.type || '',
                orderId: transaction['order id'] || '',
                sku: transaction.sku || '',
                description: transaction.description || '',
                quantity: parseInt(transaction.quantity || '0'),
                marketplace: transaction.marketplace || '',
                fulfillment: transaction.fulfillment || '',
                orderCity: transaction['order city'] || '',
                orderState: transaction['order state'] || '',
                orderPostal: transaction['order postal'] || '',
                productSales: cleanNumber(transaction['product sales']),
                shippingCredits: cleanNumber(transaction['shipping credits']),
                promotionalRebates: cleanNumber(transaction['promotional rebates']),
                sellingFees: cleanNumber(transaction['selling fees']),
                fbaFees: cleanNumber(transaction['fba fees']),
                otherTransactionFees: cleanNumber(transaction['other transaction fees']),
                other: cleanNumber(transaction.other),
                total: cleanNumber(transaction.total)
            };
        });
    }

    // Process transactions and group by SKU
    processTransactions(transactions) {
        const cleanedTransactions = this.cleanTransactionData(transactions);
        
        // Group transactions by SKU
        const skuGroups = {};
        
        cleanedTransactions.forEach(transaction => {
            const sku = transaction.sku;
            if (!sku) return; // Skip transactions without SKU

            if (!skuGroups[sku]) {
                skuGroups[sku] = {
                    sku: sku,
                    description: transaction.description,
                    totalSales: 0,
                    totalEasyshipCharges: 0,
                    totalQuantity: 0,
                    transactions: []
                };
            }

            // Add to SKU group
            skuGroups[sku].transactions.push(transaction);
            skuGroups[sku].totalQuantity += transaction.quantity;
            
            // Calculate sales (only for Order type transactions)
            if (transaction.type === 'Order') {
                skuGroups[sku].totalSales += transaction.productSales;
            }
            
            // Calculate Easyship charges (Shipping Services type)
            if (transaction.type === 'Shipping Services') {
                skuGroups[sku].totalEasyshipCharges += Math.abs(transaction.otherTransactionFees);
            }
        });

        // Convert to array and calculate totals
        const processedData = Object.values(skuGroups).map(group => ({
            ...group,
            totalSales: Math.round(group.totalSales * 100) / 100,
            totalEasyshipCharges: Math.round(group.totalEasyshipCharges * 100) / 100
        }));

        this.processedData = processedData;
        return processedData;
    }

    // Get summary statistics
    getSummary(transactions) {
        const totalTransactions = transactions.length;
        const totalOrders = transactions.filter(t => t.type === 'Order').length;
        const totalShippingServices = transactions.filter(t => t.type === 'Shipping Services').length;
        const uniqueSKUs = new Set(transactions.map(t => t.sku).filter(sku => sku)).size;
        
        return {
            totalTransactions,
            totalOrders,
            totalShippingServices,
            uniqueSKUs
        };
    }

    // Validate CSV structure
    validateCSV(transactions) {
        const requiredColumns = ['sku', 'type', 'product sales', 'other transaction fees'];
        const firstRow = transactions[0];
        
        if (!firstRow) {
            throw new Error('CSV file is empty or has no data rows');
        }

        const missingColumns = requiredColumns.filter(col => !firstRow[col]);
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        return true;
    }

    // Export processed data for analysis
    exportForAnalysis() {
        if (!this.processedData) {
            throw new Error('No processed data available. Please parse and process CSV first.');
        }
        
        return {
            skuData: this.processedData,
            summary: this.getSummary(this.transactions),
            rawTransactions: this.transactions
        };
    }
}

// Create global instance
window.csvParser = new AmazonCSVParser();