// src/tests/services/fixtureService.test.ts

import { FixtureService } from '../../services/fixtureService';
import { FixtureTeam } from '../../types';

describe('FixtureService', () => {
  describe('generateRoundRobin', () => {
    it('debe generar fixtures correctos para 4 equipos', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 },
        { id: 3, name: 'Equipo C', group_number: 1 },
        { id: 4, name: 'Equipo D', group_number: 1 }
      ];

      const fixtures = FixtureService.generateRoundRobin(teams);

      // Debe haber 6 partidos para 4 equipos (n*(n-1)/2)
      expect(fixtures).toHaveLength(6);

      // Verificar que todos los equipos se enfrentan exactamente una vez
      const encounters = new Set<string>();
      fixtures.forEach(fixture => {
        const encounter = [fixture.team1_id, fixture.team2_id].sort().join('-');
        expect(encounters.has(encounter)).toBe(false);
        encounters.add(encounter);
      });

      expect(encounters).toHaveSize(6);
    });

    it('debe generar fixtures correctos para 5 equipos (número impar)', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 },
        { id: 3, name: 'Equipo C', group_number: 1 },
        { id: 4, name: 'Equipo D', group_number: 1 },
        { id: 5, name: 'Equipo E', group_number: 1 }
      ];

      const fixtures = FixtureService.generateRoundRobin(teams);

      // Debe haber 10 partidos para 5 equipos
      expect(fixtures).toHaveLength(10);

      // Verificar que no hay equipos duplicados en un partido
      fixtures.forEach(fixture => {
        expect(fixture.team1_id).not.toBe(fixture.team2_id);
      });
    });

    it('debe manejar múltiples grupos correctamente', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A1', group_number: 1 },
        { id: 2, name: 'Equipo A2', group_number: 1 },
        { id: 3, name: 'Equipo B1', group_number: 2 },
        { id: 4, name: 'Equipo B2', group_number: 2 }
      ];

      const fixtures = FixtureService.generateRoundRobin(teams);

      // 2 grupos de 2 equipos = 1 partido por grupo = 2 partidos total
      expect(fixtures).toHaveLength(2);

      // Verificar que los equipos solo juegan dentro de su grupo
      const group1Fixtures = fixtures.filter(f => f.group_number === 1);
      const group2Fixtures = fixtures.filter(f => f.group_number === 2);

      expect(group1Fixtures).toHaveLength(1);
      expect(group2Fixtures).toHaveLength(1);
    });

    it('debe lanzar error con menos de 2 equipos', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo Solitario', group_number: 1 }
      ];

      expect(() => {
        FixtureService.generateRoundRobin(teams);
      }).toThrow('Se necesitan al menos 2 equipos para generar fixtures');
    });
  });

  describe('validateFixtures', () => {
    it('debe validar fixtures correctos', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 },
        { id: 3, name: 'Equipo C', group_number: 1 }
      ];

      const fixtures = FixtureService.generateRoundRobin(teams);
      const isValid = FixtureService.validateFixtures(teams, fixtures);

      expect(isValid).toBe(true);
    });

    it('debe detectar fixtures inválidos con equipos inexistentes', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 }
      ];

      const invalidFixtures = [
        { team1_id: 1, team2_id: 99, round: 1, group_number: 1 } // Equipo 99 no existe
      ];

      const isValid = FixtureService.validateFixtures(teams, invalidFixtures);

      expect(isValid).toBe(false);
    });

    it('debe detectar encuentros duplicados', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 }
      ];

      const duplicateFixtures = [
        { team1_id: 1, team2_id: 2, round: 1, group_number: 1 },
        { team1_id: 2, team2_id: 1, round: 2, group_number: 1 } // Mismo encuentro
      ];

      const isValid = FixtureService.validateFixtures(teams, duplicateFixtures);

      expect(isValid).toBe(false);
    });
  });
});