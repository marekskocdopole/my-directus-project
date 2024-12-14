<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Farm, Product } from '../types';
import ProductList from './ProductList.vue';
import AddFarmModal from './AddFarmModal.vue';

const farms = ref<Farm[]>([]);
const selectedFarm = ref<Farm | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showAddFarmModal = ref(false);

const fetchFarms = async () => {
  try {
    loading.value = true;
    const response = await fetch('/api/ext/product-generator/farms');
    
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst farmy');
    }
    
    farms.value = await response.json();
    error.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nastala neočekávaná chyba';
  } finally {
    loading.value = false;
  }
};

const handleAddFarm = async (farmData: FormData) => {
  try {
    loading.value = true;
    const response = await fetch('/api/ext/product-generator/farms', {
      method: 'POST',
      body: farmData
    });
    
    if (!response.ok) {
      throw new Error('Nepodařilo se vytvořit farmu');
    }
    
    await fetchFarms();
    showAddFarmModal.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nastala neočekávaná chyba';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchFarms);
</script>

<template>
  <div class="product-generator">
    <div v-if="loading" class="loading">Načítání...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else class="content">
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>Farmy</h2>
          <button 
            @click="showAddFarmModal = true" 
            class="add-farm-btn"
          >
            Přidat farmu
          </button>
        </div>
        
        <div class="farm-list">
          <div 
            v-for="farm in farms" 
            :key="farm.id"
            :class="['farm-item', { active: selectedFarm?.id === farm.id }]"
            @click="selectedFarm = farm"
          >
            <div class="farm-name">{{ farm.name }}</div>
            <div class="farm-id">ID: {{ farm.farm_id }}</div>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <template v-if="selectedFarm">
          <h2>{{ selectedFarm.name }}</h2>
          <ProductList :farm-id="selectedFarm.id" />
        </template>
        <div v-else class="no-selection">
          Vyberte farmu ze seznamu
        </div>
      </div>
    </div>
    
    <AddFarmModal 
      v-if="showAddFarmModal"
      @close="showAddFarmModal = false"
      @submit="handleAddFarm"
    />
  </div>
</template>

<style scoped>
.product-generator {
  display: flex;
  height: 100%;
  background: white;
}

.sidebar {
  width: 250px;
  border-right: 1px solid #e0e0e0;
  padding: 1rem;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.add-farm-btn {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-farm-btn:hover {
  background: #1976d2;
}

.farm-list {
  display: flex;
  flex-direction: column;
}

.farm-item {
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.farm-item:hover {
  background: #f5f5f5;
}

.farm-item.active {
  background: #e0e0e0;
}

.farm-item .farm-name {
  font-weight: bold;
}

.farm-item .farm-id {
  font-size: 0.8rem;
  color: #666;
}

.main-content {
  flex: 1;
  padding: 1rem;
}

.loading, .error, .no-selection {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error {
  color: #f44336;
}
</style>
