import { db } from '../db.js';
import { gitBranchSlug } from '../utils/string.js';
import { notificationService } from './notificationService.js';

export const githubService = {
  getBranchName(task) {
    if (task.githubBranchName) return task.githubBranchName;
    const titlePart = gitBranchSlug(task.title);
    const descPart = task.description ? gitBranchSlug(task.description) : '';
    return descPart ? `${titlePart}-${descPart}` : titlePart;
  },

  async deleteLocalBranchLink(task) {
    await db.tasks.update(task.id, { githubBranchUrl: undefined, githubBranchName: undefined });
    task.githubBranchUrl = undefined;
    task.githubBranchName = undefined;
    notificationService.toast('Links locais removidos.', 'success');
  },

  async checkBranchExists(settings, branchName) {
    const { githubOwner, githubRepo, githubToken } = settings;
    try {
      const response = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/branches/${encodeURIComponent(branchName)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return response.ok;
    } catch (err) {
      console.error("Erro ao verificar branch:", err);
      return false;
    }
  },

  async handleGitFlow(task, settings) {
    const { githubOwner, githubRepo } = settings;
    const branchName = this.getBranchName(task);

    const exists = await this.checkBranchExists(settings, branchName);
    const treeUrl = `https://github.com/${githubOwner}/${githubRepo}/tree/${encodeURIComponent(branchName)}`;

    if (exists) {
      // Se existe remoto mas NÃO tem link local, oferece vincular
      if (!task.githubBranchUrl) {
        const confirmed = await notificationService.confirm(
          'Branch Encontrada',
          `A branch '${branchName}' já existe no GitHub, mas não está vinculada a esta tarefa.\nDeseja vincular este link localmente?`,
          'Sim, Vincular',
          'info'
        );

        if (confirmed) {
          await db.tasks.update(task.id, { githubBranchUrl: treeUrl, githubBranchName: branchName });
          task.githubBranchUrl = treeUrl;
          task.githubBranchName = branchName;
          notificationService.toast('Link da branch vinculado com sucesso!', 'success');
          return treeUrl;
        }
      }

      return await this.handleExistingBranch(task, branchName, settings);
    } else {
      if (task.githubBranchUrl) {
        const result = await notificationService.confirm(
          'Branch Não Encontrada',
          `A branch vinculada a esta tarefa não existe mais no GitHub.\nO que deseja fazer?`,
          'Recriar Branch',
          'warning',
          'Excluir Link Local' // denyText
        );

        if (result === 'confirmed') {
          return await this.createBranch(task, settings);
        } else if (result === 'denied') {
          await this.deleteLocalBranchLink(task);
        }
      } else {
        const confirmed = await notificationService.confirm(
          'Criar Branch',
          `Deseja criar a branch '${branchName}' no GitHub?`,
          'Sim, Criar',
          'info'
        );

        if (confirmed) {
          return await this.createBranch(task, settings);
        }
      }
    }
  },

  async createBranch(task, settings) {
    const { githubOwner, githubRepo, githubToken, activeBaseBranch } = settings;
    const branchName = this.getBranchName(task);
    const baseBranch = activeBaseBranch;
    
    if (!githubToken || !githubOwner || !githubRepo) {
      notificationService.toast("Configuração incompleta: Preencha o Token, Owner e Repo do GitHub.", "error");
      return;
    }
    if (!baseBranch) {
      notificationService.toast('Configuração incompleta: selecione uma branch base.', 'error');
      return;
    }

    try {
      // 1. Obter o SHA da branch base
      const baseRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs/heads/${baseBranch}`, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!baseRes.ok) {
        notificationService.toast(`Erro: Não foi possível encontrar a branch base '${baseBranch}'.`, "error");
        return;
      }
      
      const baseData = await baseRes.json();
      const sha = baseData.object.sha;

      // 2. Criar a nova branch
      const createRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: sha
        })
      });

      if (createRes.ok) {
        const treeUrl = `https://github.com/${githubOwner}/${githubRepo}/tree/${encodeURIComponent(branchName)}`;
        await db.tasks.update(task.id, { githubBranchUrl: treeUrl, githubBranchName: branchName });
        task.githubBranchUrl = treeUrl;
        task.githubBranchName = branchName;
        notificationService.toast('Branch criada com sucesso!', 'success');
        return { treeUrl, branchName };
      } else {
        const errorData = await createRes.json().catch(() => ({}));
        const errorMsg = errorData.message || createRes.statusText;
        notificationService.toast(`Erro do GitHub: ${errorMsg}`, 'error');
      }
    } catch (err) {
      notificationService.toast(`Falha na comunicação: ${err.message}`, 'error');
    }
  },

  async handleExistingBranch(task, branchName, settings) {
    const { githubOwner, githubRepo, githubToken } = settings;
    const treeUrl = `https://github.com/${githubOwner}/${githubRepo}/tree/${encodeURIComponent(branchName)}`;
    
    const result = await notificationService.confirm(
      'Branch já existe',
      `A branch ${branchName} já existe no GitHub.\nO que deseja fazer?`,
      'Abrir Branch',
      'info',
      'Deletar Branch' // denyText
    );

    if (result === 'confirmed') {
      window.open(treeUrl, '_blank');
    } else if (result === 'denied') {
      const isEnvironment = settings.activeEnvironments?.some(environment => environment.branch === branchName);
      if (isEnvironment) {
        notificationService.alert('Acesso negado', 'Branches de ambiente não podem ser excluídas por esta ação.', 'warning');
        return treeUrl;
      }

      const confirmed = await notificationService.confirm(
        'Alerta de Exclusão',
        `Deseja realmente DELETAR a branch '${branchName}'?`,
        'Sim, Deletar',
        'error'
      );

      if (confirmed) {
        const deleteResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs/heads/${encodeURIComponent(branchName)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (deleteResponse.ok || deleteResponse.status === 404) {
          notificationService.toast(`Branch removida!`, 'success');
        } else {
          notificationService.toast(`Erro ao excluir no GitHub.`, 'error');
        }
        await this.deleteLocalBranchLink(task);
      }
    }
    return treeUrl;
  },

  async analyzeAndMerge(task, settings, targetBranch) {
    const { githubOwner, githubRepo, githubToken } = settings;
    
    let sourceBranch = this.getBranchName(task);
    if (task.githubBranchUrl && task.githubBranchUrl.includes('/tree/')) {
       sourceBranch = decodeURIComponent(task.githubBranchUrl.split('/tree/')[1]);
    }

    if (!githubToken || !githubOwner || !githubRepo) {
      notificationService.toast("Configuração incompleta: Preencha o Token, Owner e Repo.", "error");
      return;
    }
    if (!targetBranch) {
      notificationService.toast('Selecione um ambiente de destino para o merge.', 'error');
      return;
    }

    try {
      // 1. Obter quantidade de arquivos alterados (Compare)
      let filesChanged = 0;
      let hasCommits = false;
      try {
        const compareRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/compare/${encodeURIComponent(targetBranch)}...${encodeURIComponent(sourceBranch)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (!compareRes.ok) {
           notificationService.toast(`Erro na comparação. A branch ${sourceBranch} existe?`, "error");
           return;
        }

        const compareData = await compareRes.json();
        filesChanged = compareData.files ? compareData.files.length : 0;
        hasCommits = compareData.commits && compareData.commits.length > 0;

        if (filesChanged === 0 && !hasCommits) {
          notificationService.toast("As branches já estão iguais. Nenhuma alteração para merge.", "info");
          return;
        }
      } catch (err) {
        console.error("Erro de rede ao comparar branches no GitHub:", err);
        notificationService.toast(`Erro de rede ao comparar branches: ${err.message}`, "error");
        return;
      }

      // 2. Criar PR (se não houver um aberto)
      // GitHub throws error if PR already exists. We can catch it or try to find it first.
      let prNumber = null;
      
      const prRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          head: sourceBranch,
          base: targetBranch,
          title: `[TASS] Merge automatizado ${sourceBranch} -> ${targetBranch}`
        })
      });

      if (!prRes.ok) {
        const errorData = await prRes.json().catch(() => ({}));
        let errorMsg = errorData.message || prRes.statusText;
        
        if (errorMsg.includes('A pull request already exists')) {
          // Precisamos encontrar o PR existente
          const searchRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls?head=${githubOwner}:${sourceBranch}&base=${targetBranch}&state=open`, {
            headers: { 'Authorization': `Bearer ${githubToken}` }
          });
          const searchData = await searchRes.json();
          if (searchData.length > 0) {
            prNumber = searchData[0].number;
          } else {
            notificationService.toast(`Erro: PR já existe mas não foi encontrado.`, 'error');
            return;
          }
        } else {
          notificationService.toast(`Erro ao criar PR: ${errorMsg}`, 'error');
          return;
        }
      } else {
        const prData = await prRes.json();
        prNumber = prData.number;
      }

      // 3. Confirmar ou Alertar
      // O GitHub verifica conflitos automaticamente e define 'mergeable' como booleano (ou null se calculando)
      let isMergeable = null;
      let checkCount = 0;
      
      while (isMergeable === null && checkCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const statusRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls/${prNumber}`, {
          headers: { 'Authorization': `Bearer ${githubToken}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          isMergeable = statusData.mergeable;
        }
        checkCount++;
      }

      let confirmed = false;

      if (isMergeable === false) {
         await notificationService.alert(
            'Conflitos Detectados',
            `Estatísticas:\n- Arquivos alterados: ${filesChanged}\n- Status: Com Conflitos\n\nA branch '${sourceBranch}' está em conflito com a branch '${targetBranch}'.\nNão é possível realizar o merge automaticamente no GitHub. Resolva os conflitos e tente novamente.`,
            'error'
         );
         confirmed = false;
      } else {
         confirmed = await notificationService.confirm(
            'Confirmar Merge',
            `Estatísticas:\n- Arquivos alterados: ${filesChanged}\n- Conflitos: Nenhum\n\nDeseja realizar o merge em ${targetBranch} agora?`,
            'Sim, Fazer Merge',
            'info',
            'Cancelar'
         );
      }

      // 4. Finalizar ou fechar PR
      if (confirmed === 'confirmed' || confirmed === true) {
         const doMergeRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls/${prNumber}/merge`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              merge_method: 'merge'
            })
         });

         if (doMergeRes.ok) {
            notificationService.toast(`Merge realizado com sucesso para ${targetBranch}!`, 'success');
         } else {
            const errData = await doMergeRes.json().catch(() => ({}));
            notificationService.toast(`Erro no merge: ${errData.message || 'Desconhecido'}`, 'error');
         }
      } else {
         // Fecha o PR em caso de cancelamento ou conflito
         await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls/${prNumber}`, {
            method: 'PATCH',
            headers: {
               'Authorization': `Bearer ${githubToken}`,
               'Accept': 'application/vnd.github.v3+json',
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state: 'closed' })
         });
         
         if (isMergeable !== false) {
            notificationService.toast('Merge cancelado.', 'info');
         }
      }

    } catch (err) {
      notificationService.toast(`Falha na comunicação com GitHub: ${err.message}`, 'error');
    }
  },

  // --- BREEZE (GitRebuilder) PRIMITIVES ---
  async breezeGetBranches(settings, targetBranch, searchQuery, branchesOrder) {
    const { githubOwner, githubRepo, githubToken } = settings;
    let page = 1;
    let allBranches = [];
    let hasMore = true;

    // GitHub does not support search in list branches API, we fetch all and filter client side
    while(hasMore) {
      const res = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/branches?per_page=100&page=${page}`, {
        headers: { 'Authorization': `Bearer ${githubToken}` }
      });
      if (!res.ok) throw new Error('Erro ao buscar branches');
      const branches = await res.json();
      if (branches.length === 0) {
        hasMore = false;
      } else {
        allBranches = allBranches.concat(branches);
        page++;
      }
    }

    // Map exactly to what Breeze expects
    let mapped = allBranches
      .filter(b => b.name !== targetBranch)
      .map(b => ({
        name: b.name,
        title: b.commit.sha.substring(0, 7), // fallback, GitHub basic API doesn't return commit title
        committedDate: new Date().toISOString(), // we don't have this without extra calls
        authorName: 'GitHub User'
      }));

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      mapped = mapped.filter(b => b.name.toLowerCase().includes(lowerQ));
    }
    
    mapped.sort((a, b) => {
      return branchesOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    
    return mapped;
  },

  async breezeCheckMergeStatus(settings, source, target) {
    const { githubOwner, githubRepo, githubToken } = settings;
    try {
      // Compare
      const compareRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/compare/${encodeURIComponent(target)}...${encodeURIComponent(source)}`, {
        headers: { 'Authorization': `Bearer ${githubToken}` }
      });
      if (!compareRes.ok) return { status: 'error', message: 'Erro ao comparar as branches' };
      const compareData = await compareRes.json();
      const filesChanged = compareData.files ? compareData.files.length : 0;
      const hasCommits = compareData.commits && compareData.commits.length > 0;

      if (filesChanged === 0 && !hasCommits) {
        return { status: 'no_changes', message: 'Nenhuma alteração detectada.' };
      }

      // Create PR
      let prNumber = null;
      const prRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          head: source,
          base: target,
          title: `[TASS] Check merge ${source} into ${target}`
        })
      });

      if (!prRes.ok) {
        const errorData = await prRes.json().catch(()=>({}));
        let errorMsg = errorData.message || '';
        if (typeof errorMsg !== 'string') errorMsg = JSON.stringify(errorMsg);
        
        if (errorMsg.includes('A pull request already exists')) {
           const searchRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls?head=${githubOwner}:${source}&base=${target}&state=open`, {
             headers: { 'Authorization': `Bearer ${githubToken}` }
           });
           const searchData = await searchRes.json();
           if (searchData.length > 0) {
             prNumber = searchData[0].number;
           } else {
             return { status: 'error', message: 'PR já existe mas não encontrado.' };
           }
        } else {
          return { status: 'error', message: `Erro ao criar PR: ${errorMsg}` };
        }
      } else {
        const prData = await prRes.json();
        prNumber = prData.number;
      }

      // Poll
      let isMergeable = null;
      let checkCount = 0;

      while (isMergeable === null && checkCount < 10) {
        await new Promise(r => setTimeout(r, 1500));
        const statusRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls/${prNumber}`, {
          headers: { 'Authorization': `Bearer ${githubToken}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          isMergeable = statusData.mergeable;
        }
        checkCount++;
      }

      if (isMergeable === false) {
        return { status: 'conflict', message: `Conflito. Arquivos: ${filesChanged}`, mrIid: prNumber };
      }
      return { status: 'mergeable', message: `Pode ser mesclado. Arquivos: ${filesChanged}`, mrIid: prNumber };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  },

  async breezeCloseMergeRequest(settings, mrIid) {
    const { githubOwner, githubRepo, githubToken } = settings;
    try {
      await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls/${mrIid}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'closed' })
      });
    } catch (e) {
      console.error("Falha ao fechar Pull Request no GitHub:", e);
    }
  },

  async breezeExecuteMergeRequest(settings, mrIid) {
    const { githubOwner, githubRepo, githubToken } = settings;
    const doMergeRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/pulls/${mrIid}/merge`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${githubToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ merge_method: 'merge' })
    });
    if (!doMergeRes.ok) throw new Error('Erro ao aceitar PR no GitHub');
    return true;
  },

  async breezeCreateBranch(settings, newBranchName, baseRef) {
    const { githubOwner, githubRepo, githubToken } = settings;
    const baseRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs/heads/${baseRef}`, {
      headers: { 'Authorization': `Bearer ${githubToken}` }
    });
    if (!baseRes.ok) throw new Error('Branch base não encontrada');
    const baseData = await baseRes.json();
    const sha = baseData.object.sha;

    const createRes = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${githubToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${newBranchName}`, sha: sha })
    });

    if (!createRes.ok) {
      const data = await createRes.json().catch(()=>({}));
      throw new Error(data.message || 'Erro ao criar branch');
    }
    return true;
  },

  async breezeDeleteBranch(settings, branchName) {
    const { githubOwner, githubRepo, githubToken } = settings;
    const deleteResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/git/refs/heads/${encodeURIComponent(branchName)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${githubToken}` }
    });
    if (!deleteResponse.ok && deleteResponse.status !== 404) throw new Error('Falha ao excluir');
    return true;
  }
};
