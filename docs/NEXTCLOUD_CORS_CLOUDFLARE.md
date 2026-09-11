# Integração TASS + Nextcloud atrás do Cloudflare Tunnel

Este guia documenta a configuração utilizada para permitir que o TASS em
`https://tass.smresume.com` acesse, pelo navegador, o WebDAV da Nextcloud em
`https://cloud.smresume.com`.

## 1. Por que a configuração é necessária

Embora os dois serviços usem o mesmo domínio principal, os subdomínios são
origens diferentes para o navegador. Antes de enviar uma requisição WebDAV com
o cabeçalho `Authorization`, o navegador envia uma requisição de verificação
chamada *preflight*:

```text
OPTIONS /remote.php/dav/
Origin: https://tass.smresume.com
Access-Control-Request-Method: PROPFIND
Access-Control-Request-Headers: authorization,content-type,depth
```

Por padrão, a Nextcloud tenta autenticar esse `OPTIONS` e responde `401`. O
navegador não envia credenciais no preflight e, por isso, nunca chega a executar
o `PROPFIND`, `PUT`, `GET` ou `DELETE` solicitado pelo TASS. No Chrome, esse
bloqueio pode aparecer apenas como **“Aviso de cabeçalhos provisórios”**.

O Cloudflare Tunnel não elimina essa exigência. Ele encaminha a requisição até
o Apache, mas o servidor de origem ainda precisa responder corretamente ao
preflight e incluir os cabeçalhos CORS nas respostas WebDAV.

## 2. Arquitetura utilizada

Na máquina Dell, a instalação está organizada assim:

```text
/srv/docker/compose/nextcloud/
├── compose.yml
├── compose.override.yml
├── tass-cors.conf
├── tass-vhost.conf
└── app/

/srv/storage/nextcloud/data/
```

O `compose.yml` original não foi modificado. A configuração adicional fica em
`compose.override.yml`, carregado automaticamente pelo Docker Compose. Isso
preserva a separação entre a instalação principal e a integração do TASS.

## 3. Pré-requisitos

- Nextcloud funcionando e fora do modo de manutenção.
- Imagem Apache da Nextcloud, como `nextcloud:34-apache`.
- Módulos Apache `headers`, `setenvif` e `rewrite` habilitados.
- Acesso administrativo ao Docker e aos arquivos do Compose.
- Cloudflare Tunnel apontando `cloud.smresume.com` para o serviço Nextcloud.

Valide os módulos:

```bash
docker exec nextcloud-app apache2ctl -M | grep -E 'headers|setenvif|rewrite'
```

## 4. Configuração dos cabeçalhos CORS

Crie `/srv/docker/compose/nextcloud/tass-cors.conf`:

```apache
<IfModule mod_setenvif.c>
  SetEnvIfNoCase Origin "^https://tass\.smresume\.com$" tass_cors_allowed=1
</IfModule>

<IfModule mod_headers.c>
  Header always set Access-Control-Allow-Origin "https://tass.smresume.com" env=tass_cors_allowed
  Header always set Access-Control-Allow-Methods "GET, PUT, DELETE, PROPFIND, MKCOL, OPTIONS" env=tass_cors_allowed
  Header always set Access-Control-Allow-Headers "Authorization, Content-Type, Depth" env=tass_cors_allowed
  Header always set Access-Control-Max-Age "86400" env=tass_cors_allowed
  Header always merge Vary "Origin" env=tass_cors_allowed
</IfModule>
```

A origem é deliberadamente restrita a `https://tass.smresume.com`. Não substitua
esse valor por `*`, especialmente porque o fluxo transporta um cabeçalho de
autenticação.

O `Header always` é importante: ele mantém os cabeçalhos CORS inclusive em
respostas de erro, redirecionamentos internos e respostas de autenticação.

## 5. Interceptação do preflight no VirtualHost

Somente adicionar os cabeçalhos não basta. O `OPTIONS` também precisa terminar
antes de chegar à autenticação da Nextcloud.

Crie `/srv/docker/compose/nextcloud/tass-vhost.conf`:

```apache
<VirtualHost *:80>
  ServerName cloud.smresume.com
  ServerAdmin webmaster@localhost
  DocumentRoot /var/www/html

  RewriteEngine On
  RewriteCond %{REQUEST_METHOD} =OPTIONS
  RewriteCond %{REQUEST_URI} ^/remote\.php/dav/
  RewriteCond %{HTTP:Origin} =https://tass.smresume.com
  RewriteRule ^ - [R=204,L]

  ErrorLog ${APACHE_LOG_DIR}/error.log
  CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

A regra possui três limites de segurança:

1. Atua somente no método `OPTIONS`.
2. Atua somente abaixo de `/remote.php/dav/`.
3. Atua somente para a origem oficial do TASS.

Requisições WebDAV reais continuam protegidas pela autenticação normal da
Nextcloud.

## 6. Persistência no Docker Compose

Crie `/srv/docker/compose/nextcloud/compose.override.yml`:

```yaml
services:
  app:
    volumes:
      - ./tass-cors.conf:/etc/apache2/conf-enabled/tass-cors.conf:ro
      - ./tass-vhost.conf:/etc/apache2/sites-enabled/000-default.conf:ro
```

Os mounts são somente leitura dentro do container. Assim, recriações e
atualizações da imagem não removem a configuração.

Antes de aplicar, mantenha uma cópia do Compose original:

```bash
cd /srv/docker/compose/nextcloud
sudo cp -a compose.yml compose.yml.before-tass-cors
```

## 7. Validação e aplicação

Valide primeiro o modelo do Compose:

```bash
cd /srv/docker/compose/nextcloud
sudo docker compose config -q
```

Recrie somente a aplicação, sem reiniciar banco ou Redis:

```bash
sudo docker compose up -d --no-deps app
```

Valide a sintaxe e a saúde da Nextcloud:

```bash
docker exec nextcloud-app apache2ctl -t
docker exec nextcloud-app php occ status
docker ps --filter name=nextcloud
```

O `occ status` deve indicar:

```text
installed: true
maintenance: false
needsDbUpgrade: false
```

## 8. Teste do preflight pela URL pública

Execute:

```bash
curl -i -X OPTIONS 'https://cloud.smresume.com/remote.php/dav/' \
  -H 'Origin: https://tass.smresume.com' \
  -H 'Access-Control-Request-Method: PROPFIND' \
  -H 'Access-Control-Request-Headers: authorization,content-type,depth'
```

O resultado esperado é:

```text
HTTP/2 204
access-control-allow-origin: https://tass.smresume.com
access-control-allow-methods: GET, PUT, DELETE, PROPFIND, MKCOL, OPTIONS
access-control-allow-headers: Authorization, Content-Type, Depth
access-control-max-age: 86400
vary: Origin
```

Também verifique se uma origem desconhecida não recebe permissão:

```bash
curl -i -X OPTIONS 'https://cloud.smresume.com/remote.php/dav/' \
  -H 'Origin: https://origem-nao-autorizada.example' \
  -H 'Access-Control-Request-Method: PROPFIND' \
  -H 'Access-Control-Request-Headers: authorization,content-type,depth'
```

Ela pode receber `401`, mas não deve receber `Access-Control-Allow-Origin`.

## 9. Configuração no TASS

Na Nextcloud:

1. Abra **Configurações pessoais → Segurança**.
2. Crie uma senha de aplicativo exclusiva para o TASS.
3. Guarde a senha no momento da criação; ela não será exibida novamente.

No TASS:

1. Abra **Configurações → Dados e Segurança**.
2. Selecione **Nextcloud** em **Provedor de Backup**.
3. Informe `https://cloud.smresume.com`.
4. Informe o identificador do usuário utilizado pelo WebDAV.
5. Informe a senha de aplicativo e clique em **Conectar Nextcloud**.

Não utilize a senha principal da conta. O TASS mantém a senha de aplicativo
somente no `sessionStorage` da aba atual e a remove ao desconectar.

## 10. Cloudflare Access

Na configuração validada, a resposta problemática era
`401 Basic realm="Nextcloud"`, indicando que a autenticação da própria
Nextcloud estava bloqueando o preflight.

Se `cloud.smresume.com` for protegido posteriormente pelo Cloudflare Access, o
Access poderá responder `403` ao `OPTIONS` antes de ele alcançar o Apache. Nesse
caso, abra:

```text
Cloudflare Zero Trust
→ Access controls
→ Applications
→ aplicação cloud.smresume.com
→ Advanced settings
→ Cross-Origin Resource Sharing (CORS)
```

Então habilite **Bypass OPTIONS requests to origin**. O bypass é seguro neste
cenário porque a origem Apache continua aceitando apenas o domínio do TASS e
somente libera o preflight; as operações WebDAV permanecem autenticadas.

## 11. Diagnóstico de problemas

### “Aviso de cabeçalhos provisórios”

Abra a aba **Network** do navegador e procure a requisição `OPTIONS`. Confirme o
status e os cabeçalhos da resposta. O aviso não é a causa; ele indica que a
requisição real não chegou a ser concluída.

### `401` no `OPTIONS`

O VirtualHost não foi montado ou carregado. Verifique:

```bash
docker exec nextcloud-app cat /etc/apache2/sites-enabled/000-default.conf
docker exec nextcloud-app apache2ctl -S
```

### Os cabeçalhos não aparecem

Confirme o arquivo e o módulo:

```bash
docker exec nextcloud-app cat /etc/apache2/conf-enabled/tass-cors.conf
docker exec nextcloud-app apache2ctl -M | grep headers
```

### `503` ou “Your data directory is invalid”

Esse erro não é CORS. Verifique o volume de dados e o marcador `.ncdata`:

```bash
docker exec nextcloud-app php occ config:system:get datadirectory
docker exec nextcloud-app ls -la /var/www/html/data/.ncdata
```

O arquivo deve existir na raiz do diretório configurado. Corrija primeiro o
armazenamento antes de testar CORS.

### Alterações não aparecem pela Cloudflare

Teste diretamente a porta local para separar Apache e túnel:

```bash
curl -i -X OPTIONS 'http://127.0.0.1:8082/remote.php/dav/' \
  -H 'Host: cloud.smresume.com' \
  -H 'Origin: https://tass.smresume.com' \
  -H 'Access-Control-Request-Method: PROPFIND' \
  -H 'Access-Control-Request-Headers: authorization,content-type,depth'
```

Se funcionar localmente, mas não pela URL pública, revise Cloudflare Access,
Workers, Snippets, regras WAF e cache.

## 12. Rollback

Para remover somente a integração CORS:

```bash
cd /srv/docker/compose/nextcloud
sudo rm compose.override.yml tass-cors.conf tass-vhost.conf
sudo docker compose up -d --no-deps app
```

O banco, Redis, diretório de dados e `compose.yml` original não precisam ser
removidos ou restaurados.

Se o `compose.yml` original tiver sido alterado posteriormente e precisar ser
recuperado, existe a cópia:

```text
/srv/docker/compose/nextcloud/compose.yml.before-tass-cors
```

Revise as diferenças antes de qualquer restauração para não apagar mudanças
feitas depois desta configuração.

## 13. Estado validado em 10/09/2026

- Nextcloud `34.0.2` instalada e fora de manutenção.
- Banco MariaDB e Redis saudáveis.
- Preflight público retornando `HTTP 204` através da Cloudflare.
- Origem autorizada restrita a `https://tass.smresume.com`.
- Origem desconhecida recebendo `401` sem cabeçalhos CORS.
- Configuração persistida em mounts somente leitura do Docker Compose.

## Referências

- [Nextcloud: operações WebDAV](https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/basic.html)
- [Nextcloud: acesso a arquivos por WebDAV](https://docs.nextcloud.com/server/stable/user_manual/br/files/access_webdav.html)
- [Cloudflare Access: CORS e preflight](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/)
- [Apache: módulo de cabeçalhos](https://httpd.apache.org/docs/2.4/mod/mod_headers.html)
- [Apache: flags do mod_rewrite](https://httpd.apache.org/docs/2.4/rewrite/flags.html)
