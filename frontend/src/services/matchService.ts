// src/services/matchService.ts

import { apiClient } from './apiClient';
import { Match } from '../types';

export const matchService = {
  async getByChampionship(championshipId: number): Promise<Match[]> {
    const response = await apiClient.get(`/matches/championships/${championshipId}/matches`);
    return response.data;
  },

  async getById(id: number): Promise<Match> {
    const response = await apiClient.get(`/matches/${id}`);
    return response.data;
  },

  async create(data: Partial<Match>): Promise<Match> {
    const response = await apiClient.post('/matches', data);
    return response.data.match;
  },

  async update(id: number, data: Partial<Match>): Promise<Match> {
    const response = await apiClient.put(`/matches/${id}`, data);
    return response.data.match;
  },

  async updateResult(id: number, sets: Array<{team1_games: number; team2_games: number}>): Promise<Match> {
    const response = await apiClient.post(`/matches/${id}/result`, { sets });
    return response.data.match;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/matches/${id}`);
  }
};
