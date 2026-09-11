#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist_directory="${project_root}/dist"
deployment_config="${TASS_DEPLOY_CONFIG:-${project_root}/scripts/.env}"
remote_target="${TASS_DEPLOY_TARGET:-}"
remote_directory="${TASS_DEPLOY_DIRECTORY:-/srv/sites/tass}"

if [[ -f "${deployment_config}" ]]; then
  while IFS='=' read -r key value; do
    case "${key}" in
      TASS_DEPLOY_TARGET)
        [[ -n "${remote_target}" ]] || remote_target="${value}"
        ;;
      TASS_DEPLOY_DIRECTORY)
        remote_directory="${value:-${remote_directory}}"
        ;;
    esac
  done < "${deployment_config}"
fi

show_usage() {
  cat <<'EOF'
Uso: ./scripts/publish-tass.sh [opções]

Compila o TASS e copia o build para um host já preparado.

Opções:
  --target USUARIO@HOST  destino aceito por ssh/scp
  --directory CAMINHO   diretório remoto (padrão: /srv/sites/tass)
  -h, --help             mostra esta ajuda

Variáveis equivalentes: TASS_DEPLOY_TARGET e TASS_DEPLOY_DIRECTORY.
Por padrão, o script também lê scripts/.env, se existir.
EOF
}

fail() {
  echo "erro: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      [[ $# -ge 2 ]] || fail "--target exige um valor"
      remote_target="$2"
      shift 2
      ;;
    --directory)
      [[ $# -ge 2 ]] || fail "--directory exige um valor"
      remote_directory="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      fail "opção desconhecida: $1"
      ;;
  esac
done

[[ -n "${remote_target}" ]] || fail "informe --target ou TASS_DEPLOY_TARGET"
[[ "${remote_target}" =~ ^([A-Za-z0-9._-]+@)?[A-Za-z0-9._-]+$ ]] \
  || fail "destino SSH inválido: ${remote_target}"
[[ "${remote_directory}" =~ ^/[A-Za-z0-9._/-]+$ && "${remote_directory}" != *".."* ]] \
  || fail "diretório remoto deve ser um caminho absoluto simples"

for command_name in npm scp ssh; do
  command -v "${command_name}" >/dev/null 2>&1 \
    || fail "comando obrigatório não encontrado: ${command_name}"
done

[[ -f "${project_root}/package.json" ]] || fail "package.json não encontrado"

echo "Gerando o build do TASS..."
(
  cd "${project_root}"
  npm run build
)

[[ -f "${dist_directory}/index.html" ]] || fail "o build não gerou dist/index.html"

echo "Validando o destino ${remote_target}:${remote_directory}..."
ssh -o BatchMode=yes "${remote_target}" \
  "test -d '${remote_directory}' && test -w '${remote_directory}'" \
  || fail "diretório remoto ausente ou sem permissão de escrita"

echo "Enviando o conteúdo de dist..."
scp -o BatchMode=yes -r "${dist_directory}/." "${remote_target}:${remote_directory}/"

echo "TASS publicado em ${remote_target}:${remote_directory}."
