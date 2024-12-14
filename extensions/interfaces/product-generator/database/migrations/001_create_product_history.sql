-- Vytvoření tabulky pro historii produktů
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS product_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES product_generator_products(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_by VARCHAR(255) DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexy pro optimalizaci výkonu
CREATE INDEX IF NOT EXISTS idx_product_history_product_id ON product_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_history_created_at ON product_history(created_at DESC);
