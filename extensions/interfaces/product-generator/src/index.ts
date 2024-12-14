import { defineInterface } from '@directus/extensions-sdk';
import React from 'react';
import ProductGenerator from './components/ProductGenerator';

export default defineInterface({
  id: 'product-generator',
  name: 'Generátor produktů',
  icon: 'generating_tokens',
  description: 'Rozhraní pro generování produktových popisků a obrázků',
  component: ProductGenerator,
  options: [
    {
      field: 'farmId',
      name: 'ID Farmy',
      type: 'string',
      meta: {
        width: 'full',
        interface: 'input'
      }
    }
  ],
  types: ['string', 'uuid'],
  recommendedDisplays: ['text']
});
