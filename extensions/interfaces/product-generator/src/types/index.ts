export interface Farm {
    id: string;
    name: string;
    farm_id: string;
    import_file?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Product {
    id: string;
    farm_id: string;
    name: string;
    shop_sku: string;
    generated_short_description: string;
    generated_long_description: string;
    ingredients: string;
    selected_image_url: string;
    image_generation_attempts: {
        id: string;
        urls: string[];
        selected: boolean;
        created_at: Date;
    }[];
    status: 'draft' | 'in_progress' | 'completed';
    created_at: Date;
    updated_at: Date;
}