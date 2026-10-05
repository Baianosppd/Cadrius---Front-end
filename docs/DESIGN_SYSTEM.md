# Guia visual do Cadrius (CAD-219)

Objetivo: telas sérias, profissionais e consistentes, mantendo a identidade (azul Cadrius + marca em Poppins).
Referências usadas: grade de 8 pt e escala de espaçamento do Carbon (IBM) para sistemas densos de dados; densidade e hierarquia
de sistemas jurídicos (Clio, Astrea); cartões com padding interno uniforme, mesmos raios e mesma estratégia de profundidade.

## 1. Tokens (src/index.css)
| Grupo | Tokens | Uso |
|---|---|---|
| Marca | `--c-primary` `#2563eb`, `-600`, `-700`, `-50`, `-100` | links, ícones e item ativo do menu. **Fundo de botão com texto branco usa `--c-primary-solid` / `--c-primary-solid-hover`** (garante 4,5:1 também no modo noturno) |
| Neutros (ardósia) | `--c-ink` (títulos), `--c-text`, `--c-text-2`, `--c-muted`, `--c-subtle`, `--c-border`, `--c-border-2`, `--c-bg`, `--c-surface`, `--c-surface-2`, `--c-surface-3` | todo texto, fundo e borda |
| Estados | `--c-success*`, `--c-warning*`, `--c-danger*`, `--c-info*` | selos, avisos, ações destrutivas |
| Tipografia | `--font-ui` (Inter), `--font-brand` (Poppins, **só a marca**), `--fs-xs` 12 … `--fs-2xl` 26 | texto 14 px; títulos de página 26 px |
| Espaço | `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 20 · `--sp-6` 24 · `--sp-8` 32 | gaps, paddings |
| Forma | `--radius-sm` 6 · `--radius` 8 (controles) · `--radius-lg` 12 (cartões) · `--shadow-sm/md/lg` | |
| Layout | `--page-max` 1280 · `--page-pad` 32/24/16 · `--control-h` 38 | largura e margens da página |

## 2. Regras de espaçamento (o que corrigiu os conflitos)
1. **A página não tem padding próprio.** O espaço externo vem do layout (`MainLayout`/`AdminLayout` → `.page_inner`):
   todas as telas têm o mesmo alinhamento à esquerda, a mesma largura máxima e o mesmo respiro no celular.
2. **Espaço entre blocos = `gap` do contêiner** (`.page` 24 px, `.stack` 16 px, `.btn_row` 8 px). Não usar `margin` para
   separar irmãos (somar margem + gap gerava espaços duplos).
3. Cartão: padding 20 px (16 px no celular), borda `--c-border`, raio 12, sombra `--shadow-sm`.
4. Linhas de lista dentro de cartão: `.list_row` (separadas por fio); formulário no fim do cartão: `.form_divider`.
5. Controles com a mesma altura (38 px; 30 px no `btn_sm`); campos e botões alinhados pela base nos filtros.

## 3. Componentes (components/seguranca/seguranca.module.css + ui.jsx)
- `PageHeader` em **todas** as telas (título + subtítulo + ações à direita). O antigo `components/ui/PageHearder.jsx` usa o mesmo.
- Botões: `.btn` (secundário, contorno), `.btn_primary` (uma ação principal por área), `.btn_ghost`, `.btn_danger`
  (**contorno vermelho**; só fica cheio ao passar o mouse, para não poluir listas).
- Selos (`Pill`) com fundo suave + borda do mesmo tom; tabelas com cabeçalho cinza claro, hover na linha e números tabulares.
- Avisos (`Banner`) com faixa lateral colorida.
- Controles legados sem classe dentro de `#conteudo` recebem automaticamente a aparência padrão (index.css).

## 4. Checklist para telas novas
- [ ] Raiz da tela = `<div className={styles.page}>` + `PageHeader`.
- [ ] Sem cores fixas: só tokens (`var(--c-…)`).
- [ ] Sem `margin` entre blocos irmãos; usar `gap`.
- [ ] Uma ação principal azul por área; destrutivas com `.btn_danger`.
- [ ] Testar em 1440 px e 390 px (sem rolagem lateral; tabelas rolam dentro do cartão).

## 5. Modo noturno
- Tokens escuros em `:root[data-theme="dark"]` (ou em qualquer bloco com `data-theme="dark"`, como o painel do login).
- Preferência em `services/theme.js` (`light` | `dark` | `system`), aplicada antes do primeiro render; botão `ThemeToggle`.
- Regra: **nenhuma cor fixa de fundo/texto** em telas novas — só tokens; tons de estado com `--c-*-bg`/`--c-*-bd`.

## 6. Padrões novos
- **Base (ambiente)**: `EnvSwitch` no rodapé do login abre o modal "Selecionar base" (Produção / Teste), no estilo SAP Logon / Protheus.
- **Estado vazio ilustrado**: `<Empty title="…" action={…}>texto</Empty>`.
- **Ilustrações**: `components/illustrations/LegalArt.jsx` (`CourthouseScene`, `LawyerDesk`, `LawFirmTeam`, `ScalesMark`) — decorativas, nas cores do tema.
- **Primeiros passos** no Painel (`components/painel/FirstSteps.jsx`, lógica em `services/onboarding.js`).
- **Marketing**: `PostPreview` (como o post aparece em cada canal) e calendário editorial (`monthGrid`).
- Mapa completo das telas e do que mudou: `docs/MAPA_TELAS_UX.md`.

## 7. Contraste e navegação (CAD-220)
- **Contraste testado no CI**: `src/services/__tests__/contrast.test.js` lê os tokens do `index.css` nos dois temas e
  confere os pares texto/fundo no WCAG AA (4,5:1 texto; 3:1 dicas e texto grande). Token novo de cor de texto ou fundo →
  incluir o par no teste.
- **Busca global**: `CommandPalette` (Ctrl+K / Cmd+K, ou o campo "Buscar" do topo). Telas novas do menu entram sozinhas
  (vêm do `appMenu.js`); atalhos de criação ficam em `ACTIONS` (`services/search.js`) e a tela deve aceitar o parâmetro
  (`?novo=1`, `?nova=1`).
- **Tour da primeira visita**: `services/tour.js` (`TOURS`, até 3 frases curtas por módulo, com a primeira ação).
