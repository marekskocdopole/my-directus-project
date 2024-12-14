import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        details: error.details[0].message 
      });
    }
    next();
  };
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Placeholder pro autentizaci - v Directus bude implementováno specificky
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Přístup zamítnut', 
      message: 'Vyžadováno přihlášení' 
    });
  }
  next();
};

// Schémata pro validaci
export const schemas = {
  farm: Joi.object({
    name: Joi.string().required().min(2).max(100),
    farmId: Joi.string().required().alphanum(),
    importFile: Joi.string()
  }),
  
  productUpdate: Joi.object({
    generated_short_description: Joi.string()
      .max(150)
      .required()
      .messages({
        'string.max': 'Krátký popis nesmí být delší než 150 znaků',
        'any.required': 'Krátký popis je povinný'
      }),
    generated_long_description: Joi.string()
      .min(100)
      .required()
      .messages({
        'string.min': 'Dlouhý popis musí mít alespoň 100 znaků',
        'any.required': 'Dlouhý popis je povinný'
      }),
    selected_image_url: Joi.string().uri().required(),
    status: Joi.string().valid('draft', 'in_progress', 'completed')
  })
};
