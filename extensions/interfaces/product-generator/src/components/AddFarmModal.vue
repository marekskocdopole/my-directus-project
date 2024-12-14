<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'submit']);

const farmName = ref('');
const farmId = ref('');
const csvFile = ref<File | null>(null);
const error = ref('');

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type !== 'text/csv') {
      error.value = 'Prosím nahrajte CSV soubor';
      csvFile.value = null;
      return;
    }
    csvFile.value = file;
    error.value = '';
  }
};

const submitForm = () => {
  // Validace formuláře
  if (!farmName.value || !farmId.value || !csvFile.value) {
    error.value = 'Vyplňte všechny požadované údaje';
    return;
  }

  const formData = new FormData();
  formData.append('name', farmName.value);
  formData.append('farmId', farmId.value);
  formData.append('file', csvFile.value);

  emit('submit', formData);
  error.value = '';
};
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Přidat novou farmu</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="modal-content">
        <div class="form-group">
          <label>Název farmy</label>
          <input 
            v-model="farmName" 
            type="text" 
            placeholder="Zadejte název farmy"
          />
        </div>

        <div class="form-group">
          <label>ID farmy</label>
          <input 
            v-model="farmId" 
            type="text" 
            placeholder="Zadejte ID farmy"
          />
        </div>

        <div class="form-group">
          <label>CSV soubor</label>
          <input 
            type="file" 
            accept=".csv"
            @change="handleFileUpload"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="cancel-btn">Zrušit</button>
        <button @click="submitForm" class="submit-btn">Vytvořit farmu</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-content {
  padding: 20px 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.error-message {
  color: red;
  margin-bottom: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e0e0e0;
  padding-top: 10px;
}

.cancel-btn {
  margin-right: 10px;
  background: #f5f5f5;
  border: 1px solid #ccc;
  padding: 8px 16px;
  border-radius: 4px;
}

.submit-btn {
  background: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
}
</style>
