// src/services/fixtureService.ts

import { FixtureTeam, GeneratedMatch } from '../types';

export class FixtureService {
  /**
   * Genera fixtures usando el algoritmo de Berger (round-robin)
   * Soporta número par e impar de equipos
   */
  public static generateRoundRobin(teams: FixtureTeam[]): GeneratedMatch[] {
    if (teams.length < 2) {
      throw new Error('Se necesitan al menos 2 equipos para generar fixtures');
    }

    const fixtures: GeneratedMatch[] = [];
    const groupedTeams = this.groupTeamsByGroup(teams);

    // Generar fixtures para cada grupo
    for (const [groupNumber, groupTeams] of groupedTeams.entries()) {
      const groupFixtures = this.generateRoundRobinForGroup(groupTeams, groupNumber);
      fixtures.push(...groupFixtures);
    }

    return fixtures;
  }

  private static groupTeamsByGroup(teams: FixtureTeam[]): Map<number, FixtureTeam[]> {
    const groups = new Map<number, FixtureTeam[]>();
    
    teams.forEach(team => {
      const groupNumber = team.group_number || 1;
      if (!groups.has(groupNumber)) {
        groups.set(groupNumber, []);
      }
      groups.get(groupNumber)!.push(team);
    });

    return groups;
  }

  private static generateRoundRobinForGroup(
    teams: FixtureTeam[], 
    groupNumber: number
  ): GeneratedMatch[] {
    const fixtures: GeneratedMatch[] = [];
    const n = teams.length;
    const isOdd = n % 2 === 1;
    const totalTeams = isOdd ? n + 1 : n;
    const rounds = totalTeams - 1;
    const matchesPerRound = totalTeams / 2;

    // Crear array de equipos para rotación
    const teamsArray: (FixtureTeam | null)[] = [...teams];
    
    // Añadir equipo fantasma si número impar
    if (isOdd) {
      teamsArray.push(null);
    }

    for (let round = 0; round < rounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        let home: FixtureTeam | null;
        let away: FixtureTeam | null;

        if (match === 0) {
          // El primer equipo siempre queda fijo
          home = teamsArray[0];
          away = teamsArray[totalTeams - 1 - round];
        } else {
          home = teamsArray[match];
          away = teamsArray[totalTeams - match - round - 1];
        }

        // Solo crear partido si ambos equipos existen (no hay BYE)
        if (home && away) {
          fixtures.push({
            team1_id: home.id,
            team2_id: away.id,
            round: round + 1,
            group_number: groupNumber
          });
        }
      }

      // Rotar equipos (excepto el primero que queda fijo)
      if (totalTeams > 2) {
        const temp = teamsArray[1];
        for (let i = 1; i < totalTeams - 1; i++) {
          teamsArray[i] = teamsArray[i + 1];
        }
        teamsArray[totalTeams - 1] = temp;
      }
    }

    return fixtures;
  }

  /**
   * Valida que el fixture generado sea correcto
   */
  public static validateFixtures(teams: FixtureTeam[], fixtures: GeneratedMatch[]): boolean {
    const teamIds = new Set(teams.map(t => t.id));
    const encounters = new Set<string>();

    for (const fixture of fixtures) {
      // Verificar que los equipos existan
      if (!teamIds.has(fixture.team1_id) || !teamIds.has(fixture.team2_id)) {
        return false;
      }

      // Verificar que no sea el mismo equipo
      if (fixture.team1_id === fixture.team2_id) {
        return false;
      }

      // Verificar que cada enfrentamiento sea único
      const encounter = [fixture.team1_id, fixture.team2_id].sort().join('-');
      if (encounters.has(encounter)) {
        return false;
      }
      encounters.add(encounter);
    }

    // Para cada grupo, verificar que todos se enfrenten una vez
    const groups = this.groupTeamsByGroup(teams);
    for (const [groupNumber, groupTeams] of groups.entries()) {
      const groupFixtures = fixtures.filter(f => f.group_number === groupNumber);
      const expectedMatches = (groupTeams.length * (groupTeams.length - 1)) / 2;
      
      if (groupFixtures.length !== expectedMatches) {
        return false;
      }
    }

    return true;
  }
}