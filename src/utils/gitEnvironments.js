const DEFAULT_ENVIRONMENTS = {
  gitlab: {
    environments: [
      { id: 'gitlab-environment-1', branch: 'master-sistsocial', alias: 'Produção' },
      { id: 'gitlab-environment-2', branch: 'hml', alias: 'Homologação' },
      { id: 'gitlab-environment-3', branch: 'dev-06', alias: 'Desenvolvimento' }
    ],
    baseEnvironmentId: 'gitlab-environment-3'
  },
  github: {
    environments: [
      { id: 'github-environment-1', branch: 'main', alias: 'Produção' },
      { id: 'github-environment-2', branch: 'hml', alias: 'Homologação' },
      { id: 'github-environment-3', branch: 'dev', alias: 'Desenvolvimento' }
    ],
    baseEnvironmentId: 'github-environment-3'
  }
};

const LEGACY_SLOTS = [
  { suffix: 'master', target: 'master' },
  { suffix: 'hml', target: 'hml' },
  { suffix: 'dev', target: 'dev' }
];

const cloneEnvironments = (environments) => environments.map(environment => ({ ...environment }));

export const createEnvironmentId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `environment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const getDefaultGitEnvironmentConfig = (provider) => {
  const defaults = DEFAULT_ENVIRONMENTS[provider] || DEFAULT_ENVIRONMENTS.gitlab;
  return {
    environments: cloneEnvironments(defaults.environments),
    baseEnvironmentId: defaults.baseEnvironmentId
  };
};

const normalizeEnvironments = (environments, provider) => {
  return environments
    .filter(environment => environment && typeof environment === 'object')
    .map((environment, index) => ({
      id: String(environment.id || `${provider}-environment-${index + 1}`),
      branch: String(environment.branch || '').trim(),
      alias: String(environment.alias || '').trim()
    }));
};

const getLegacyConfig = (settingsMap, provider) => {
  const defaults = DEFAULT_ENVIRONMENTS[provider] || DEFAULT_ENVIRONMENTS.gitlab;
  const hasLegacySettings = LEGACY_SLOTS.some(slot => (
    settingsMap[`app-${provider}-branch-${slot.suffix}`] !== undefined
    || settingsMap[`app-${provider}-alias-${slot.suffix}`] !== undefined
    || (provider === 'gitlab' && settingsMap[`app-branch-${slot.suffix}`] !== undefined)
  )) || settingsMap[`app-${provider}-base-target`] !== undefined;

  if (!hasLegacySettings) return null;

  const environments = LEGACY_SLOTS.map((slot, index) => ({
    id: `${provider}-environment-${index + 1}`,
    branch: settingsMap[`app-${provider}-branch-${slot.suffix}`]
      || (provider === 'gitlab' ? settingsMap[`app-branch-${slot.suffix}`] : '')
      || defaults.environments[index].branch,
    alias: settingsMap[`app-${provider}-alias-${slot.suffix}`] || defaults.environments[index].alias,
    legacyTarget: slot.target
  })).filter(environment => environment.branch || environment.alias);

  if (environments.length === 0) return null;

  const legacyBaseTarget = settingsMap[`app-${provider}-base-target`];
  const baseEnvironment = environments.find(environment => environment.legacyTarget === legacyBaseTarget);
  const cleanedEnvironments = environments.map(({ legacyTarget, ...environment }) => environment);
  const defaultBaseEnvironment = cleanedEnvironments.find(environment => (
    environment.id === defaults.baseEnvironmentId
  ));

  return {
    environments: normalizeEnvironments(cleanedEnvironments, provider),
    baseEnvironmentId: baseEnvironment?.id || defaultBaseEnvironment?.id || cleanedEnvironments[0].id
  };
};

export const loadGitEnvironmentConfig = (settingsMap, provider) => {
  const environmentsKey = `app-${provider}-environments`;
  const baseKey = `app-${provider}-base-environment-id`;
  const savedEnvironments = settingsMap[environmentsKey];

  const hasUsableSavedEnvironment = Array.isArray(savedEnvironments)
    && savedEnvironments.some(environment => String(environment?.branch || '').trim());

  if (hasUsableSavedEnvironment) {
    const environments = normalizeEnvironments(savedEnvironments, provider);
    const savedBaseId = String(settingsMap[baseKey] || '');
    const baseExists = environments.some(environment => environment.id === savedBaseId);

    return {
      environments,
      baseEnvironmentId: baseExists ? savedBaseId : environments[0].id,
      migrated: false
    };
  }

  const legacyConfig = getLegacyConfig(settingsMap, provider);
  if (legacyConfig) return { ...legacyConfig, migrated: true };

  return { ...getDefaultGitEnvironmentConfig(provider), migrated: false };
};

export const validateGitEnvironments = (environments, baseEnvironmentId) => {
  if (!Array.isArray(environments) || environments.length === 0) {
    return 'Cadastre pelo menos um ambiente.';
  }

  const hasIncompleteEnvironment = environments.some(environment => (
    !String(environment.branch || '').trim() || !String(environment.alias || '').trim()
  ));
  if (hasIncompleteEnvironment) return 'Preencha a branch e o alias de todos os ambientes.';

  const normalizedBranches = environments.map(environment => environment.branch.trim().toLowerCase());
  if (new Set(normalizedBranches).size !== normalizedBranches.length) {
    return 'Cada ambiente deve apontar para uma branch diferente.';
  }

  const normalizedAliases = environments.map(environment => environment.alias.trim().toLowerCase());
  if (new Set(normalizedAliases).size !== normalizedAliases.length) {
    return 'Cada ambiente deve possuir um alias diferente.';
  }

  if (!environments.some(environment => environment.id === baseEnvironmentId)) {
    return 'Selecione uma branch base válida.';
  }

  return '';
};

export const getBaseEnvironment = (environments, baseEnvironmentId) => {
  return environments.find(environment => environment.id === baseEnvironmentId) || environments[0] || null;
};

export const filterWorkingBranches = (branches, environments) => {
  const environmentBranchNames = new Set(environments.map(environment => environment.branch));
  return branches.filter(branch => !environmentBranchNames.has(branch.name));
};
