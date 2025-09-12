// src/services/teamService.ts

import { apiClient } from './apiClient';
import { Team } from '../types';

export const teamService = {
  async getByChampionship(championshipId: number): Promise<Team[]> {
    const response = await apiClient.get(`/teams/championships/${championshipId}/teams`);
    return response.data;
  },

  async create(championshipId: number, data: Partial<Team>): Promise<Team> {
    const response = await apiClient.post(`/teams/championships/${championshipId}/teams`, data);
    return response.data.team;
  },

  async update(id: number, data: Partial<Team>): Promise<Team> {
    const response = await apiClient.put(`/teams/${id}`, data);
    return response.data.team;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/teams/${id}`);
  },

  async importCSV(championshipId: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('csv', file);
    await apiClient.post(`/teams/championships/${championshipId}/import-csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};