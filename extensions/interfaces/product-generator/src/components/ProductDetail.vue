<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Product } from '../types';
import { RefreshCw, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';

const props = defineProps<{
  product: Product;
}>();

const emit = defineEmits(['close', 'update']);

const shortDescription = ref(props.product.generated_short_description);
const longDescription = ref(props.product.generated_long_description);
const selectedImageUrl = ref(props.product.selected_image_url);
const loading = ref(false);
const error = ref<string | null>(null);
const generatingImages = ref(false);
const generatingDescriptions = ref(false);

watch(() => props.product, (newProduct) => {
  shortDescription.value = newProduct.generated_short_description;
  longDescription.value = newProduct.generated_long_description;
  selectedImageUrl.value = newProduct.selected_image_url;
});

const validateDescriptions = () => {
  const errors: string[] = [];
  
  if (!shortDescription.value.trim()) {
    errors.push('Krátký popis je povinný');
  } else if (shortDescription.value.length > 150) {
    errors.push('Krátký popis nesmí být delší než 150 znaků');
  }

  if (!longDescription.value.trim()) {
    errors.push('Dlouhý popis je povinný');
  } else if (longDescription.value.length < 100) {
    errors.push('Dlouhý popis musí mít alespoň 100 znaků');
  }

  return errors;
};

const handleSave = async () => {
  const validationErrors = validateDescriptions();
  if (validationErrors.length > 0) {
    error.value = validationErrors.join(', ');
    return;
  }

  try {
    loading.value = true;
    const response = await fetch(`/api/ext/product-generator/products/${props.product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generated_short_description: shortDescription.value,
        generated_long_description: longDescription.value,
        selected_image_url: selectedImageUrl.value,
        status: 'completed'
      })
    });

    if (!response.ok) {
      throw new Error('Nepodařilo se uložit změny');
    }

    emit('update');
    error.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nastala neočekávaná chyba';
  } finally {
    loading.value = false;
  }
};

const generateDescriptions = async () => {
  try {
    generatingDescriptions.value = true;
    const response = await fetch(`/api/ext/product-generator/products/${props.product.id}/generate-descriptions`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Nepodařilo se vygenerovat popisky');
    }

    emit('update');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nastala chyba při generování popisků';
  } finally {
    generatingDescriptions.value = false;
  }
};

const generateImages = async () => {
  try {
    generatingImages.value = true;
    const response = await fetch(`/api/ext/product-generator/products/${props.product.id}/generate-images`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Nepodařilo se vygenerovat obrázky');
    }

    emit('update');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nastala chyba při generování obrázků';
  } finally {
    generatingImages.value = false;
  }
};
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
    <div class="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
      <!-- Hlavička -->
      <div class="p-4 border-b flex justify-between items-center">
        <h2 class="text-xl font-semibold">
          {{ product.name }}
          <span class="ml-2 text-sm text-gray-500">({{ product.shop_sku }})</span>
        </h2>
        <button @click="$emit('close')" class="p-2 hover:bg-gray-100 rounded-full">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Obsah -->
      <div class="flex-1 overflow-auto p-4 space-y-4">
        <!-- Chybové hlášení -->
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {{ error }}
        </div>

        <!-- Popisky -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">Produktové popisky</h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Krátký popis (max 150 znaků)
            </label>
            <textarea 
              v-model="shortDescription" 
              rows="2" 
              class="w-full border rounded p-2"
              :class="{ 'border-red-500': shortDescription.length > 150 }"
            ></textarea>
            <div class="text-sm text-gray-500 mt-1">
              Délka: {{ shortDescription.length }} / 150 znaků
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Dlouhý popis (min 100 znaků)
            </label>
            <textarea 
              v-model="longDescription" 
              rows="6" 
              class="w-full border rounded p-2"
              :class="{ 'border-red-500': longDescription.length < 100 }"
            ></textarea>
            <div class="text-sm text-gray-500 mt-1">
              Délka: {{ longDescription.length }} / min. 100 znaků
            </div>
          </div>

          <button 
            @click="generateDescriptions" 
            :disabled="generatingDescriptions"
            class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 flex items-center"
          >
            <RefreshCw v-if="generatingDescriptions" class="mr-2 animate-spin" />
            <span>{{ generatingDescriptions ? 'Generuji...' : 'Regenerovat popisky' }}</span>
          </button>
        </div>

        <!-- Obrázky -->
        <div class="bg-white shadow rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">Produktové obrázky</h3>
          
          <div class="grid grid-cols-3 gap-4">
            <div 
              v-for="attempt in product.image_generation_attempts" 
              :key="attempt.id"
              class="grid grid-cols-2 gap-2"
            >
              <div 
                v-for="(url, index) in attempt.urls" 
                :key="index"
                @click="selectedImageUrl = url"
                class="relative cursor-pointer"
              >
                <img 
                  :src="url" 
                  class="w-full h-32 object-cover rounded-lg"
                  :class="{ 'border-4 border-blue-500': selectedImageUrl === url }"
                />
                <div v-if="selectedImageUrl === url" class="absolute inset-0 bg-blue-500 bg-opacity-25 flex items-center justify-center">
                  <span class="text-white font-bold">Vybrán</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            @click="generateImages" 
            :disabled="generatingImages"
            class="mt-4 bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 flex items-center"
          >
            <ImageIcon v-if="!generatingImages" class="mr-2" />
            <RefreshCw v-else class="mr-2 animate-spin" />
            <span>{{ generatingImages ? 'Generuji...' : 'Vygenerovat další obrázky' }}</span>
          </button>
        </div>
      </div>

      <!-- Patička -->
      <div class="bg-gray-100 p-4 flex justify-end space-x-4">
        <button 
          @click="$emit('close')" 
          class="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
        >
          Zrušit
        </button>
        <button 
          @click="handleSave" 
          :disabled="loading"
          class="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 flex items-center"
        >
          <Loader2 v-if="loading" class="mr-2 animate-spin" />
          <Save v-else class="mr-2" />
          <span>{{ loading ? 'Ukládám...' : 'Uložit změny' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
