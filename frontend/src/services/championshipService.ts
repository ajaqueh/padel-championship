import { apiClient } from './apiClient';
import { Championship, Standing } from '../types';

export const championshipService = {
  async getAll(): Promise<Championship[]> {
    const response = await apiClient.get('/championships');
    return response.data;
  },

  async getById(id: number): Promise<Championship> {
    const response = await apiClient.get(`/championships/${id}`);
    return response.data;
  },

  async create(data: Partial<Championship>): Promise<Championship> {
    const response = await apiClient.post('/championships', data);
    return response.data.championship;
  },

  async update(id: number, data: Partial<Championship>): Promise<Championship> {
    const response = await apiClient.put(`/championships/${id}`, data);
    return response.data.championship;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/championships/${id}`);
  },

  async generateFixtures(id: number): Promise<void> {
    await apiClient.post(`/championships/${id}/generate-fixtures`);
  },

  async getStandings(id: number): Promise<Standing[]> {
    const response = await apiClient.get(`/championships/${id}/standings`);
    return response.data.standings;
  }
};