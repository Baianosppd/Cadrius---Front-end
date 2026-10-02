# Cadrius — Front-end (React + Vite)

## Desenvolvimento
```bash
cp .env.example .env          # VITE_API_URL=http://127.0.0.1:8000/api/v1/
npm ci && npm run dev         # http://localhost:5173
# ou com Docker (hot reload):  docker compose up --build
```
Scripts: `npm run lint` · `npm run build` · `npm run preview`.

## Produção / teste (servidor)
Imagem `target: prod` (nginx sem privilégios, porta 8080, CSP e cabeçalhos de segurança, `/healthz`).
A URL da API é gravada **no build** (`VITE_API_URL=https://api.cadrius.ia.br/api/v1/`) e o CSP usa `API_ORIGIN` em tempo de execução.
O deploy é feito pelo kit do repositório do back (`deploy/README.md`):

| Branch | Ambiente | URL |
|---|---|---|
| `Develop` | teste (base sintética) | https://app-teste.cadrius.ia.br |
| `main` | produção (aprovação manual) | https://app.cadrius.ia.br |

Segredos do GitHub Actions: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS` (ver o README do back).
**Nunca versione `.env`** (somente `.env.example`).

Rotas esperadas do back: `ROTAS_PARA_O_BACKEND.md` e `docs/CONFORMIDADE_FRONT_BACK.md` (repo do back).
