// Supabase Client Configuration
// Replace these with your actual Supabase project details
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database operations for product costs
const ProductCosts = {
    // Save or update product cost
    async saveCost(sku, cost) {
        try {
            // Check if SKU already exists
            const { data: existing, error: checkError } = await supabaseClient
                .from('products')
                .select('*')
                .eq('sku', sku)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existing) {
                // Update existing record
                const { data, error } = await supabaseClient
                    .from('products')
                    .update({ 
                        product_cost: parseFloat(cost),
                        updated_at: new Date().toISOString()
                    })
                    .eq('sku', sku);

                if (error) throw error;
                return { success: true, message: 'Product cost updated successfully' };
            } else {
                // Insert new record
                const { data, error } = await supabaseClient
                    .from('products')
                    .insert([
                        {
                            sku: sku,
                            product_cost: parseFloat(cost),
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    ]);

                if (error) throw error;
                return { success: true, message: 'Product cost saved successfully' };
            }
        } catch (error) {
            console.error('Error saving product cost:', error);
            return { success: false, message: error.message || 'Failed to save product cost' };
        }
    },

    // Get all product costs
    async getAllCosts() {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('sku', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching product costs:', error);
            return { success: false, message: error.message || 'Failed to fetch product costs' };
        }
    },

    // Get cost for specific SKU
    async getCostBySKU(sku) {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('product_cost')
                .eq('sku', sku)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return { success: true, data: data ? data.product_cost : null };
        } catch (error) {
            console.error('Error fetching product cost:', error);
            return { success: false, message: error.message || 'Failed to fetch product cost' };
        }
    },

    // Delete product cost
    async deleteCost(sku) {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .delete()
                .eq('sku', sku);

            if (error) throw error;
            return { success: true, message: 'Product cost deleted successfully' };
        } catch (error) {
            console.error('Error deleting product cost:', error);
            return { success: false, message: error.message || 'Failed to delete product cost' };
        }
    }
};

// Initialize database schema if needed
async function initDatabase() {
    try {
        // Check if products table exists by trying to select from it
        const { error } = await supabaseClient.from('products').select('count()').single();
        
        if (error && error.code === 'PGRST116') {
            // Table doesn't exist, create it
            console.log('Products table not found. Please create the table manually.');
            console.log('Run this SQL in your Supabase SQL editor:');
            console.log(`
                CREATE TABLE products (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    sku VARCHAR(255) UNIQUE NOT NULL,
                    product_cost DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                CREATE INDEX idx_products_sku ON products(sku);
            `);
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Initialize database on load
initDatabase();

// Export for use in other modules
window.ProductCosts = ProductCosts;
window.supabaseClient = supabaseClient;