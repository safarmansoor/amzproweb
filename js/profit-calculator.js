// Profit Calculator for Amazon Seller Analysis
class ProfitCalculator {
    constructor() {
        this.skuData = [];
        this.productCosts = new Map();
    }

    // Load product costs from Supabase
    async loadProductCosts() {
        try {
            const result = await ProductCosts.getAllCosts();
            
            if (result.success) {
                this.productCosts.clear();
                result.data.forEach(product => {
                    this.productCosts.set(product.sku, parseFloat(product.product_cost));
                });
                return { success: true, count: result.data.length };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error loading product costs:', error);
            return { success: false, message: error.message };
        }
    }

    // Calculate profit for a single SKU
    calculateSKUProfit(skuInfo) {
        const productCost = this.productCosts.get(skuInfo.sku) || 0;
        
        // Calculate total cost: product cost * quantity
        const totalProductCost = productCost * skuInfo.totalQuantity;
        
        // Calculate profit: sales - product cost - easyship charges
        const profit = skuInfo.totalSales - totalProductCost - skuInfo.totalEasyshipCharges;
        
        // Calculate profit margin percentage
        const profitMargin = skuInfo.totalSales > 0 ? (profit / skuInfo.totalSales) * 100 : 0;

        return {
            sku: skuInfo.sku,
            description: skuInfo.description,
            totalSales: Math.round(skuInfo.totalSales * 100) / 100,
            totalQuantity: skuInfo.totalQuantity,
            productCostPerUnit: Math.round(productCost * 100) / 100,
            totalProductCost: Math.round(totalProductCost * 100) / 100,
            totalEasyshipCharges: Math.round(skuInfo.totalEasyshipCharges * 100) / 100,
            profit: Math.round(profit * 100) / 100,
            profitMargin: Math.round(profitMargin * 100) / 100,
            hasCostData: productCost > 0
        };
    }

    // Calculate profits for all SKUs
    calculateAllProfits(skuData) {
        this.skuData = skuData;
        
        const results = skuData.map(skuInfo => this.calculateSKUProfit(skuInfo));
        
        // Sort by profit (highest first)
        results.sort((a, b) => b.profit - a.profit);
        
        return results;
    }

    // Get overall summary
    getOverallSummary(profitResults) {
        const totalSales = profitResults.reduce((sum, result) => sum + result.totalSales, 0);
        const totalProductCost = profitResults.reduce((sum, result) => sum + result.totalProductCost, 0);
        const totalEasyshipCharges = profitResults.reduce((sum, result) => sum + result.totalEasyshipCharges, 0);
        const totalProfit = profitResults.reduce((sum, result) => sum + result.profit, 0);
        
        const overallMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
        const profitableSKUs = profitResults.filter(result => result.profit > 0).length;
        const unprofitableSKUs = profitResults.filter(result => result.profit < 0).length;

        return {
            totalSales: Math.round(totalSales * 100) / 100,
            totalProductCost: Math.round(totalProductCost * 100) / 100,
            totalEasyshipCharges: Math.round(totalEasyshipCharges * 100) / 100,
            totalProfit: Math.round(totalProfit * 100) / 100,
            overallMargin: Math.round(overallMargin * 100) / 100,
            profitableSKUs,
            unprofitableSKUs,
            totalSKUs: profitResults.length
        };
    }

    // Format currency for display
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }

    // Format percentage for display
    formatPercentage(value) {
        return `${value.toFixed(2)}%`;
    }

    // Generate detailed report
    generateReport(profitResults, summary) {
        return {
            summary,
            detailedResults: profitResults,
            timestamp: new Date().toISOString()
        };
    }
}

// Create global instance
window.profitCalculator = new ProfitCalculator();