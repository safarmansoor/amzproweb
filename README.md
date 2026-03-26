# Amazon Seller Profit Analyzer

A web application for analyzing Amazon seller transaction reports and calculating product profitability with Easyship charges.

## Features

- **CSV Upload**: Drag and drop or select Amazon transaction CSV files
- **Product Cost Management**: Save product costs per SKU to Supabase database
- **Profit Analysis**: Calculate total profit per SKU including Easyship charges
- **Responsive Design**: Works on desktop and mobile devices
- **Data Privacy**: All CSV processing happens locally in the browser

## Profit Calculation Formula

```
Total Profit = Product Sales - (Product Cost × Quantity) - Easyship Charges
```

Where:
- **Product Sales**: Total sales from Order transactions
- **Product Cost**: Cost per unit saved in database × total quantity sold
- **Easyship Charges**: Total fees from Shipping Services transactions

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Note down your **Project URL** and **anon public key**

### 2. Setup Database

In your Supabase SQL editor, run this SQL to create the products table:

```sql
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    product_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
```

### 3. Configure Application

Edit `js/supabase-client.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 4. Deploy to GitHub Pages

1. Push this project to a GitHub repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch"
4. Choose the `main` branch and `/ (root)` folder
5. Click "Save"

Your app will be available at `https://yourusername.github.io/yourrepositoryname`

## Usage

### Step 1: Upload CSV File
1. Click "Select File" or drag and drop your Amazon transaction CSV
2. The app will parse and validate the file
3. You'll see a summary of parsed SKUs

### Step 2: Manage Product Costs
1. Enter SKU and product cost per unit
2. Click "Save Cost" to store in database
3. View all saved costs in the list below
4. Edit or delete costs as needed

### Step 3: Calculate Profits
1. Click "Calculate Profits" to process all data
2. View detailed profit analysis per SKU
3. See overall summary with total sales, profit, and margin

## CSV Format Requirements

The app expects Amazon transaction CSV files with these columns:
- `sku` - Product SKU identifier
- `type` - Transaction type (Order, Shipping Services, etc.)
- `product sales` - Sales amount
- `other transaction fees` - Easyship charges (negative values)

## Data Processing

- **Local Processing**: CSV files are processed entirely in your browser
- **Database Storage**: Only product costs are stored in Supabase
- **No Server Required**: The app runs as static files

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Notes

- All CSV processing happens client-side
- Only product costs are sent to Supabase
- Use HTTPS when deploying to production
- Consider adding authentication for production use

## Troubleshooting

### CSV Upload Issues
- Ensure file is valid CSV format
- Check that required columns are present
- Verify SKU values are not empty

### Database Connection Issues
- Verify Supabase URL and API key are correct
- Check that products table exists
- Ensure CORS settings allow your domain

### Calculation Issues
- Verify product costs are saved for all SKUs
- Check that Easyship charges are properly identified
- Ensure CSV data is clean and properly formatted

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify your Supabase configuration
4. Ensure CSV file format matches requirements