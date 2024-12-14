# Directus Product Generator Extension

## Popis
Tento Directus extension umožňuje automatické generování produktových popisků a obrázků pomocí umělé inteligence.

## Vlastnosti
- Generování krátkých a dlouhých produktových popisků
- Automatická tvorba produktových obrázků
- Integrace s OpenAI a Replicate
- Ukládání do DigitalOcean Spaces

## Požadavky
- Node.js 16+
- Directus 10+
- Platné API klíče pro OpenAI a Replicate

## Instalace

1. Naklonujte repozitář do adresáře extensions vašeho Directus projektu:
```bash
cd /path/to/directus/extensions
git clone <repository-url> product-generator
```

2. Nainstalujte závislosti:
```bash
cd product-generator
npm install
```

3. Nakonfigurujte .env soubor:
- Zkopírujte `.env.example` na `.env`
- Vyplňte všechny požadované API klíče

## Konfigurace

### Proměnné prostředí
- `OPENAI_API_KEY`: API klíč pro OpenAI
- `REPLICATE_API_TOKEN`: API token pro Replicate
- `DO_SPACES_ENDPOINT`: Endpoint DigitalOcean Spaces
- `DO_SPACES_KEY`: Přístupový klíč
- `DO_SPACES_SECRET`: Tajný klíč

## Použití

### Generování popisků
```typescript
const descriptions = await productGeneratorService.generateDescriptions(product);
```

### Generování obrázků
```typescript
const images = await productGeneratorService.generateImages(product);
```

## Bezpečnost
- Nikdy nezveřejňujte API klíče
- Používejte environmentální proměnné
- Pravidelně otáčejte API klíče

## Řešení problémů
- Zkontrolujte API klíče
- Ověřte síťové připojení
- Sledujte systémové logy

## Licence
[Doplňte licenční informace]

## Autoři
[Vaše jméno/společnost]
```

3. Vytvoříme .eslintrc pro lint kontrolu:

```bash
touch /root/my-directus-project/extensions/interfaces/product-generator/.eslintrc.json
nano /root/my-directus-project/extensions/interfaces/product-generator/.eslintrc.json
```

<antArtifact identifier="eslint-config" type="application/vnd.ant.code" language="json" title="ESLint konfigurace pro Product Generator">
{
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint"],
    "root": true,
    "rules": {
        "no-console": "warn",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/naming-convention": [
            "error",
            {
                "selector": "variable",
                "format": ["camelCase", "UPPER_CASE"]
            },
            {
                "selector": "function",
                "format": ["camelCase"]
            },
            {
                "selector": "class",
                "format": ["PascalCase"]
            }
        ]
    }
}
