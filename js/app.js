// Main Application Logic
class AmazonProfitAnalyzer {
    constructor() {
        this.currentFile = null;
        this.processedData = null;
        this.profitResults = null;
        
        this.initializeEventListeners();
        this.loadInitialData();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // File upload events
        const fileInput = document.getElementById('file-input');
        const uploadBtn = document.getElementById('upload-btn');
        const dropArea = document.getElementById('drop-area');
        
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        // Drag and drop functionality
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('dragover');
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'text/csv') {
                this.handleFileSelect(file);
            }
        });

        // Product cost management
        document.getElementById('save-cost-btn').addEventListener('click', () => this.saveProductCost());
        
        // Profit analysis
        document.getElementById('analyze-btn').addEventListener('click', () => this.calculateProfits());
    }

    // Handle file selection and parsing
    async handleFileSelect(file) {
        if (!file || file.type !== 'text/csv') {
            this.showStatus('upload-status', 'Please select a valid CSV file.', 'error');
            return;
        }

        this.currentFile = file;
        this.showStatus('upload-status', 'Parsing CSV file...', 'info');
        
        try {
            const transactions = await csvParser.parseCSV(file);
            csvParser.validateCSV(transactions);
            
            const processedData = csvParser.processTransactions(transactions);
            this.processedData = processedData;
            
            this.showStatus('upload-status', `Successfully parsed ${processedData.length} SKUs from CSV. Skipped metadata rows (rows 1-6).`, 'success');
            this.showStep(2); // Show cost management step
            
            // Load existing costs and display them
            await this.loadAndDisplayCosts();
            
        } catch (error) {
            this.showStatus('upload-status', `Error: ${error.message}`, 'error');
        }
    }

    // Load and display existing product costs
    async loadAndDisplayCosts() {
        try {
            const result = await profitCalculator.loadProductCosts();
            if (result.success) {
                this.displayExistingCosts();
                this.showStatus('cost-status', `Loaded ${result.count} product costs from database.`, 'success');
            } else {
                this.showStatus('cost-status', `Error loading costs: ${result.message}`, 'error');
            }
        } catch (error) {
            this.showStatus('cost-status', `Error: ${error.message}`, 'error');
        }
    }

    // Save product cost to database
    async saveProductCost() {
        const skuInput = document.getElementById('sku-input');
        const costInput = document.getElementById('cost-input');
        
        const sku = skuInput.value.trim();
        const cost = parseFloat(costInput.value);
        
        if (!sku) {
            this.showStatus('cost-status', 'Please enter a SKU.', 'error');
            return;
        }
        
        if (isNaN(cost) || cost <= 0) {
            this.showStatus('cost-status', 'Please enter a valid cost greater than 0.', 'error');
            return;
        }

        try {
            const result = await ProductCosts.saveCost(sku, cost);
            if (result.success) {
                this.showStatus('cost-status', result.message, 'success');
                skuInput.value = '';
                costInput.value = '';
                await this.loadAndDisplayCosts();
            } else {
                this.showStatus('cost-status', `Error: ${result.message}`, 'error');
            }
        } catch (error) {
            this.showStatus('cost-status', `Error: ${error.message}`, 'error');
        }
    }

    // Display existing product costs
    displayExistingCosts() {
        const costsList = document.getElementById('costs-list');
        costsList.innerHTML = '';
        
        const costs = profitCalculator.productCosts;
        if (costs.size === 0) {
            costsList.innerHTML = '<p style="color: #666; text-align: center;">No product costs saved yet.</p>';
            return;
        }

        costs.forEach((cost, sku) => {
            const costItem = document.createElement('div');
            costItem.className = 'cost-item';
            costItem.innerHTML = `
                <div>
                    <div class="sku">${sku}</div>
                    <div style="color: #666; font-size: 0.9rem;">Cost per unit</div>
                </div>
                <div>
                    <div class="amount">${profitCalculator.formatCurrency(cost)}</div>
                    <button class="btn-secondary" onclick="analyzer.deleteCost('${sku}')">Edit</button>
                </div>
            `;
            costsList.appendChild(costItem);
        });
    }

    // Delete a product cost
    async deleteCost(sku) {
        if (confirm(`Are you sure you want to delete the cost for SKU ${sku}?`)) {
            try {
                const result = await ProductCosts.deleteCost(sku);
                if (result.success) {
                    this.showStatus('cost-status', result.message, 'success');
                    await this.loadAndDisplayCosts();
                } else {
                    this.showStatus('cost-status', `Error: ${result.message}`, 'error');
                }
            } catch (error) {
                this.showStatus('cost-status', `Error: ${error.message}`, 'error');
            }
        }
    }

    // Calculate profits for all SKUs
    async calculateProfits() {
        if (!this.processedData) {
            this.showStatus('analysis-status', 'Please upload a CSV file first.', 'error');
            return;
        }

        this.showStatus('analysis-status', 'Calculating profits...', 'info');
        
        try {
            // Load latest costs from database
            await profitCalculator.loadProductCosts();
            
            // Calculate profits
            const profitResults = profitCalculator.calculateAllProfits(this.processedData);
            this.profitResults = profitResults;
            
            // Get overall summary
            const summary = profitCalculator.getOverallSummary(profitResults);
            
            // Display results
            this.displayResults(profitResults, summary);
            this.showStatus('analysis-status', 'Profit calculation complete!', 'success');
            this.showStep(3); // Show analysis results
            
        } catch (error) {
            this.showStatus('analysis-status', `Error calculating profits: ${error.message}`, 'error');
        }
    }

    // Display profit analysis results
    displayResults(profitResults, summary) {
        const resultsContainer = document.getElementById('results-table');
        
        // Create summary section
        const summaryHTML = `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #dee2e6;">
                <h4 style="margin-bottom: 15px; color: #2c3e50;">Overall Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="summary-item">
                        <strong>Total Sales:</strong><br>
                        <span style="color: #27ae60; font-size: 1.2rem;">${profitCalculator.formatCurrency(summary.totalSales)}</span>
                    </div>
                    <div class="summary-item">
                        <strong>Total Profit:</strong><br>
                        <span style="color: ${summary.totalProfit >= 0 ? '#27ae60' : '#e74c3c'}; font-size: 1.2rem;">${profitCalculator.formatCurrency(summary.totalProfit)}</span>
                    </div>
                    <div class="summary-item">
                        <strong>Overall Margin:</strong><br>
                        <span style="color: ${summary.overallMargin >= 0 ? '#27ae60' : '#e74c3c'}; font-size: 1.2rem;">${profitCalculator.formatPercentage(summary.overallMargin)}</span>
                    </div>
                    <div class="summary-item">
                        <strong>Profitable SKUs:</strong><br>
                        <span style="color: #27ae60; font-size: 1.2rem;">${summary.profitableSKUs}/${summary.totalSKUs}</span>
                    </div>
                </div>
            </div>
        `;

        // Create detailed results table
        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Description</th>
                        <th>Sales</th>
                        <th>Units Sold</th>
                        <th>Cost/Unit</th>
                        <th>Total Cost</th>
                        <th>Easyship Charges</th>
                        <th>Profit</th>
                        <th>Margin</th>
                    </tr>
                </thead>
                <tbody>
                    ${profitResults.map(result => `
                        <tr>
                            <td><strong>${result.sku}</strong></td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${result.description}">
                                ${result.description}
                            </td>
                            <td>${profitCalculator.formatCurrency(result.totalSales)}</td>
                            <td>${result.totalQuantity}</td>
                            <td>${profitCalculator.formatCurrency(result.productCostPerUnit)}</td>
                            <td>${profitCalculator.formatCurrency(result.totalProductCost)}</td>
                            <td>${profitCalculator.formatCurrency(result.totalEasyshipCharges)}</td>
                            <td class="${result.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                                ${profitCalculator.formatCurrency(result.profit)}
                            </td>
                            <td class="${result.profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">
                                ${profitCalculator.formatPercentage(result.profitMargin)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        resultsContainer.innerHTML = summaryHTML + tableHTML;
    }

    // Show/hide steps
    showStep(stepNumber) {
        const uploadSection = document.getElementById('upload-section');
        const costSection = document.getElementById('cost-section');
        const analysisSection = document.getElementById('analysis-section');

        if (stepNumber === 1) {
            uploadSection.style.display = 'block';
            costSection.style.display = 'none';
            analysisSection.style.display = 'none';
        } else if (stepNumber === 2) {
            uploadSection.style.display = 'none';
            costSection.style.display = 'block';
            analysisSection.style.display = 'none';
        } else if (stepNumber === 3) {
            uploadSection.style.display = 'none';
            costSection.style.display = 'none';
            analysisSection.style.display = 'block';
        }
    }

    // Show status message
    showStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `status-message status-${type}`;
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                element.textContent = '';
                element.className = '';
            }, 3000);
        }
    }

    // Load initial data
    async loadInitialData() {
        try {
            await profitCalculator.loadProductCosts();
            this.displayExistingCosts();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyzer = new AmazonProfitAnalyzer();
});