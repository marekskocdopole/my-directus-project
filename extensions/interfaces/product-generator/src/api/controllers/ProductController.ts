```typescript
import { Request, Response } from 'express';
import { ProductGeneratorService } from '../services/ProductGeneratorService';
import { DatabaseService } from '../services/DatabaseService';

export class ProductController {
  private productService: ProductGeneratorService;
  private dbService: DatabaseService;

  constructor() {
    this.productService = new ProductGeneratorService();
    this.dbService = new DatabaseService();
  }

  // Metoda pro získání produktů farmy
  async getProductsByFarm(req: Request, res: Response) {
    try {
      const { farmId } = req.params;
      
      // Validace farmId
      if (!farmId) {
        return res.status(400).json({ 
          error: 'Neplatný identifikátor farmy', 
          message: 'Je vyžadováno platné ID farmy' 
        });
      }

      const products = await this.dbService.getProducts(farmId);
      
      // Kontrola existence produktů
      if (products.length === 0) {
        return res.status(404).json({ 
          message: 'Pro tuto farmu nebyly nalezeny žádné produkty',
          farmId: farmId 
        });
      }

      res.json(products);
    } catch (error) {
      console.error('Chyba při načítání produktů:', error);
      res.status(500).json({ 
        error: 'Interní chyba serveru', 
        message: 'Nepodařilo se načíst produkty farmy',
        details: error instanceof Error ? error.message : 'Neznámá chyba' 
      });
    }
  }

  // Metoda pro získání detailu produktu
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validace ID produktu
      if (!id) {
        return res.status(400).json({ 
          error: 'Neplatný identifikátor produktu', 
          message: 'Je vyžadováno platné ID produktu' 
        });
      }

      const product = await this.dbService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ 
          error: 'Produkt nenalezen',
          message: `Produkt s ID ${id} nebyl nalezen`,
          productId: id 
        });
      }

      res.json(product);
    } catch (error) {
      console.error('Chyba při načítání produktu:', error);
      res.status(500).json({ 
        error: 'Interní chyba serveru', 
        message: 'Nepodařilo se načíst detail produktu',
        details: error instanceof Error ? error.message : 'Neznámá chyba' 
      });
    }
  }

  // Metoda pro získání historie produktu
  async getProductHistory(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      
      // Validace ID produktu
      if (!productId) {
        return res.status(400).json({ 
          error: 'Neplatný identifikátor produktu', 
          message: 'Je vyžadováno platné ID produktu pro načtení historie' 
        });
      }

      const history = await this.dbService.getProductHistory(productId);
      
      // Kontrola existence historie
      if (history.length === 0) {
        return res.status(404).json({ 
          message: 'Pro tento produkt nebyla nalezena žádná historie změn',
          productId: productId 
        });
      }

      res.json(history);
    } catch (error) {
      console.error('Chyba při načítání historie produktu:', error);
      res.status(500).json({ 
        error: 'Interní chyba serveru', 
        message: 'Nepodařilo se načíst historii produktu',
        details: error instanceof Error ? error.message : 'Neznámá chyba' 
      });
    }
  }
}
```
