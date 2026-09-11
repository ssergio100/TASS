import { describe, expect, it } from 'vitest';
import {
  filterWorkingBranches,
  getBaseEnvironment,
  getDefaultGitEnvironmentConfig,
  loadGitEnvironmentConfig,
  validateGitEnvironments
} from '../../src/utils/gitEnvironments.js';

describe('gitEnvironments', () => {
  it('cria configurações padrão independentes para cada consumidor', () => {
    const first = getDefaultGitEnvironmentConfig('github');
    const second = getDefaultGitEnvironmentConfig('github');

    first.environments[0].branch = 'alterada';

    expect(second.environments[0].branch).toBe('main');
    expect(getBaseEnvironment(second.environments, second.baseEnvironmentId)?.branch).toBe('dev');
  });

  it('migra as três configurações legadas preservando a base escolhida', () => {
    const config = loadGitEnvironmentConfig({
      'app-gitlab-branch-master': 'stable',
      'app-gitlab-alias-master': 'Produção',
      'app-gitlab-branch-hml': 'qa',
      'app-gitlab-alias-hml': 'Qualidade',
      'app-gitlab-branch-dev': 'integration',
      'app-gitlab-alias-dev': 'Integração',
      'app-gitlab-base-target': 'hml'
    }, 'gitlab');

    expect(config.migrated).toBe(true);
    expect(config.environments).toHaveLength(3);
    expect(getBaseEnvironment(config.environments, config.baseEnvironmentId)?.branch).toBe('qa');
  });

  it('prioriza o novo formato e recupera uma referência de base inválida', () => {
    const config = loadGitEnvironmentConfig({
      'app-github-environments': [
        { id: 'one', branch: ' stable ', alias: ' Produção ' },
        { id: 'two', branch: 'quality', alias: 'Qualidade' }
      ],
      'app-github-base-environment-id': 'inexistente',
      'app-github-branch-master': 'legada'
    }, 'github');

    expect(config.migrated).toBe(false);
    expect(config.environments[0]).toEqual({ id: 'one', branch: 'stable', alias: 'Produção' });
    expect(config.baseEnvironmentId).toBe('one');
  });

  it('valida campos, duplicidades e a branch base', () => {
    const valid = [
      { id: 'one', branch: 'stable', alias: 'Produção' },
      { id: 'two', branch: 'qa', alias: 'Qualidade' }
    ];

    expect(validateGitEnvironments(valid, 'one')).toBe('');
    expect(validateGitEnvironments([], '')).toContain('pelo menos um');
    expect(validateGitEnvironments([{ id: 'one', branch: '', alias: 'Produção' }], 'one')).toContain('Preencha');
    expect(validateGitEnvironments([...valid, { id: 'three', branch: 'STABLE', alias: 'Outra' }], 'one')).toContain('branch diferente');
    expect(validateGitEnvironments([...valid, { id: 'three', branch: 'other', alias: 'qualidade' }], 'one')).toContain('alias diferente');
    expect(validateGitEnvironments(valid, 'missing')).toContain('base válida');
  });

  it('remove da limpeza todas as branches cadastradas como ambiente, sem regras por nome', () => {
    const environments = [
      { id: 'one', branch: 'custom-stable', alias: 'Estável' },
      { id: 'two', branch: 'release/client-a', alias: 'Cliente A' }
    ];
    const branches = [
      { name: 'custom-stable' },
      { name: 'release/client-a' },
      { name: 'main' },
      { name: 'feature/task-1' }
    ];

    expect(filterWorkingBranches(branches, environments).map(branch => branch.name)).toEqual([
      'main',
      'feature/task-1'
    ]);
  });

  it('migra também as chaves mais antigas exclusivas do GitLab', () => {
    const config = loadGitEnvironmentConfig({
      'app-branch-master': 'old-stable',
      'app-branch-hml': 'old-quality',
      'app-branch-dev': 'old-integration'
    }, 'gitlab');

    expect(config.environments.map(environment => environment.branch)).toEqual([
      'old-stable',
      'old-quality',
      'old-integration'
    ]);
    expect(getBaseEnvironment(config.environments, config.baseEnvironmentId)?.branch).toBe('old-integration');
  });
});
