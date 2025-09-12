// src/middleware/validation.ts

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(`Validación fallida: ${errorMessage}`, 400));
    }
    
    next();
  };
};

// Esquemas de validación
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required(),
    role: Joi.string().valid('admin', 'gestor').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  championship: Joi.object({
    name: Joi.string().min(2).required(),
    format: Joi.string().valid('liga', 'torneo', 'americano').required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().optional(),
    num_groups: Joi.number().integer().min(1).default(1),
    points_win: Joi.number().integer().min(0).default(3),
    points_loss: Joi.number().integer().min(0).default(0)
  }),

  team: Joi.object({
    name: Joi.string().min(2).required(),
    player1_name: Joi.string().min(2).required(),
    player2_name: Joi.string().min(2).required(),
    group_number: Joi.number().integer().min(1).default(1)
  }),

  match: Joi.object({
    team1_id: Joi.number().integer().required(),
    team2_id: Joi.number().integer().required(),
    court_id: Joi.number().integer().optional(),
    round: Joi.number().integer().min(1).required(),
    group_number: Joi.number().integer().min(1).default(1),
    scheduled_date: Joi.date().optional()
  }),

  matchResult: Joi.object({
    sets: Joi.array().items(
      Joi.object({
        team1_games: Joi.number().integer().min(0).required(),
        team2_games: Joi.number().integer().min(0).required()
      })
    ).min(1).max(5).required()
  }),

  court: Joi.object({
    name: Joi.string().min(2).required(),
    is_active: Joi.boolean().default(true)
  })
};