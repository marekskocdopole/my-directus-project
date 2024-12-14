<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { Product } from '../types';
import ProductDetail from './ProductDetail.vue';

const props = defineProps<{
  farmId: string
}>();

const products = ref<Product[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedProduct = ref<Product | null>(null);
const generatingProduct = ref<string | null>(null);

const fetchProducts = async () => {
  try {
    loading.value = true;
    const response = await fetch(`/api/ext/product-generator/farms/${props.farmId}/products`);
    
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst produkty');
    }
    
    products.value = await response.json();
    error.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nastala neočekávaná chyba';
  } finally {
    loading.value = false;
  }
};

const generateDescriptions = async (productId: string) => {
  try {
    generatingProduct.value = productId;
    const response = await fetch(`/api/ext/product-generator/products/${productId}/generate-descriptions`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Nepodařilo se vygenerovat popisky');
    }
    
    await fetchProducts();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nastala chyba při generování popisků';
  } finally {
    generatingProduct.value = null;
  }
};

const generateImages = async (productId: string) => {
  try {
    generatingProduct.value = productId;
    const response = await fetch(`/api/ext/product-generator/products/${productId}/generate-images`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Nepodařilo se vygenerovat obrázky');
    }
    
    await fetchProducts();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nastala chyba při generování obrázků';
  } finally {
    generatingProduct.value = null;
  }
};

watch(() => props.farmId, fetchProducts, { immediate: true });

const getStatusIcon = (status: Product['status']) => {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '🔄';
    default: return '⏳';
  }
};
</script>

<template>
  <div class="product-list">
    <div v-if="loading" class="loading">Načítání produktů...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else-if="products.length === 0" class="no-products">
      Pro tuto farmu zatím nebyly importovány žádné produkty
    </div>
    
    <div v-else class="products-grid">
      <div 
        v-for="product in products" 
        :key="product.id" 
        class="product-card"
        @click="selectedProduct = product"
      >
        <div class="product-header">
          <h3>{{ product.name }}</h3>
          <span class="status-icon">
            {{ getStatusIcon(product.status) }}
          </span>
        </div>
        
        <div class="product-sku">SKU: {{ product.shop_sku }}</div>
        
        <div class="product-actions">
          <button 
            @click.stop="generateDescriptions(product.id)"
            :disabled="product.status === 'completed' || generatingProduct === product.id"
          >
            Generovat popis
          </button>
          <button 
            @click.stop="generateImages(product.id)"
            :disabled="product.status === 'completed' || generatingProduct === product.id"
          >
            Generovat obrázky
          </button>
        </div>
      </div>
    </div>

    <ProductDetail 
      v-if="selectedProduct"
      :product="selectedProduct"
      @close="selectedProduct = null"
      @update="fetchProducts"
    />
  </div>
</template>

<style scoped>
.product-list {
  width: 100%;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.product-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.product-header h3 {
  margin: 0;
}

.status-icon {
  font-size: 1rem;
}

.product-sku {
  color: #666;
  margin-bottom: 0.5rem;
}

.product-actions {
  display: flex;
  gap: 0.5rem;
}

.product-actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background-color: #2196f3;
  color: white;
  cursor: pointer;
}

.product-actions button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading, .error, .no-products {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #f44336;
}
</style>
