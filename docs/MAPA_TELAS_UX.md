# Mapa de telas e melhorias de UX/UI (CAD-219)

Método: avaliação heurística (as 10 heurísticas de Nielsen, adaptadas a SaaS) em todas as telas, desktop (1440 px) e celular
(390 px), nos temas claro e escuro, com captura automática (Playwright). Princípios de atenção usados: progresso visível
(efeito Zeigarnik), próxima ação sempre clara, estados vazios que ensinam, reconhecimento em vez de memória e consistência.

Legenda das heurísticas: **H1** visibilidade do estado · **H2** linguagem do usuário · **H3** controle e liberdade ·
**H4** consistência · **H5** prevenção de erros · **H6** reconhecer em vez de lembrar · **H7** eficiência ·
**H8** estética e minimalismo · **H9** recuperação de erros · **H10** ajuda e documentação.

## 1. Entrada e cadastro
| Tela | Problema encontrado | Melhoria feita | Heurística |
|---|---|---|---|
| Login | Painel da marca sem conteúdo; seletor de ambiente no topo competia com o formulário; celular com bloco escuro espremido | Painel com 3 benefícios + ilustração; **campo "Base" no rodapé** (estilo SAP Logon/Protheus) abrindo modal "Selecionar base" com descrição e endereço de cada base; no celular a marca vira cabeçalho e o formulário ocupa a tela; `autocomplete` para gerenciadores de senha; botão de tema | H1, H4, H6, H8 |
| Criar conta | Cartões genéricos (ícones) | Hero "Feito para a advocacia brasileira" com fachada de tribunal; cartões com cenas (mesa do advogado, escritório com equipe); faixa de confiança (prazos forenses, Provimento 205, LGPD) | H2, H8 |
| Cadastro (individual/empresa) | Barra lateral com dica em amarelo | Ilustração da balança + frase da marca; dica em tom neutro | H8 |
| Esqueci / redefinir senha | Imagem fixa clara (não acompanhava o tema) e coluna da imagem no celular | Ilustração vetorial que acompanha o tema; celular sem a coluna | H4, H8 |

## 2. Dia a dia
| Tela | Problema | Melhoria | Heurística |
|---|---|---|---|
| Painel | Abertura fria; números soltos; sem orientação para quem começa | Saudação + data; **Primeiros passos** com barra de progresso e atalhos (some ao concluir ou dispensar); ações rápidas (principal + secundária); indicadores com ícone; mensagens de "nada por aqui" | H1, H6, H10 |
| Publicações | Lista de OABs apertada; botões de remover em vermelho cheio | Linhas separadas, botões compactos, remover em contorno; estado vazio "Comece pela OAB" | H4, H5, H8 |
| Documentos | Área de envio enorme | Espaçamento alinhado ao layout; tabela no padrão | H8 |
| Processos acompanhados / Agenda forense | Formulários soltos | Campos e botões no padrão; estado vazio explicando o DataJud | H2, H10 |
| Notificações | "Marcar todas" solto sob o título | Ação no cabeçalho; ícones que acompanham o tema | H4 |

## 3. Produção
| Tela | Problema | Melhoria | Heurística |
|---|---|---|---|
| Minutas | Vazio sem orientação | Estado vazio com o caminho (publicação, documento ou modelo) | H10 |
| Automações / Regras | Sugestões da IA em fundo claro fixo | Cartão acompanha o tema; estado vazio "toda regra nasce desligada" | H4, H5 |
| Contatos | Vazio sem explicar o valor | "Sua carteira começa aqui" (destinatários das automações e do portal) | H2 |
| Carteira de clientes | — | Indicadores numa linha; estado vazio dos contratos explica que as parcelas vão para Finanças | H1 |
| **Marketing** | Agenda só em lista; revisão do texto "no escuro" | **Pré-visualização** do post como aparece em Instagram, Facebook, LinkedIn, Google, blog, newsletter e vídeo curto (corte do "ver mais", hashtags, arte sugerida); **calendário editorial do mês** com a cor de cada canal; selo colorido por canal; estado vazio que convida a criar | H1, H6, H8 |

## 4. Escritório e segurança
| Tela | Melhoria | Heurística |
|---|---|---|
| Finanças | Indicadores numa linha; tabelas e baixa no padrão | H4 |
| IA do escritório | Cartões e botões legados no padrão; regras com tipo e evidência | H4 |
| Integrações | Cartão do Google Calendar no padrão | H4 |
| Importar dados | Botão do seletor de arquivo estilizado | H4 |
| Equipe / Perfil / Processos por e-mail / Comunicação | Cabeçalho de página que faltava; campos e botões no padrão | H4, H6 |
| Privacidade, IA segura, Auditoria, Suporte | Mesmo cabeçalho, cartões e tabelas | H4 |
| Gestão Cadrius (todas) | Mesmo alinhamento e largura; botão de tema na barra | H4 |

## 5. Transversal
- **Modo noturno** (claro / escuro / automático pelo sistema): ardósia profunda sem preto puro, texto em branco suave,
  profundidade por tons (não por sombras), cores de estado dessaturadas, contraste AA. Alternância no topo do app, da Gestão
  e no login; a escolha fica no navegador.
- **Espaçamento único** (grade 4/8, gap no lugar de margens soltas) e largura máxima igual em todas as telas.
- **Estados vazios ilustrados** com título, explicação e próxima ação.
- **Ilustrações próprias do meio jurídico** (tribunal, mesa do advogado, escritório, balança), em vetor e nas cores do tema.

## 6. Próximos passos
1. ✅ **Busca global (Ctrl+K / Cmd+K)** — telas do menu (respeitando o perfil), ações rápidas (novo contato, nova minuta,
   lançar despesa…) e registros do escritório (contatos, processos, documentos); sem acento, por teclado, com recentes.
   Atalho visível na barra do topo (H6, H7). *(CAD-220)*
2. Desfazer em ações em lote e confirmação com o nome do item nas exclusões (H3, H5).
3. ✅ **Tour curto na primeira entrada** de Publicações, Minutas, Automações, Carteira, Finanças, Marketing e IA do
   escritório: cartão no canto, até 3 passos, "Pular" sempre visível, não volta depois de visto (H10). *(CAD-220)*
4. ✅ **Roteiro do teste com 5 advogados** em `docs/ROTEIRO_TESTE_USABILIDADE.md` (tarefas, métricas SEQ/SUS, análise).
   Falta agendar e aplicar. *(CAD-220)*
5. ✅ **Teste de contraste automático** (`src/services/__tests__/contrast.test.js`, roda no `npm test` do CI): pares
   texto/fundo dos dois temas no WCAG AA. Na primeira execução achou 4 falhas, corrigidas: texto secundário claro
   (`--c-muted` #64748b → #5e6d82), dica/placeholder (`--c-subtle` #94a3b8 → #828fa2) e botão principal no escuro
   (branco sobre #3b82f6 dava 3,7:1 → novo token `--c-primary-solid` #2563eb, 5,2:1). *(CAD-220)*

## Fontes
- [Heurísticas de Nielsen aplicadas a SaaS](https://www.saashero.net/design/nielsen-10-usability-heuristics-explained/) · [Avaliação heurística em SaaS](https://www.saashero.net/design/heuristic-evaluation-nielsen-saas/)
- [Modo escuro: acessibilidade e contraste](https://www.accessibilitychecker.org/blog/dark-mode-accessibility/) · [12 princípios de dark mode](https://uxcel.com/blog/12-principles-of-dark-mode-design-627) · [Boas práticas de dark mode](https://www.onething.design/post/best-practices-for-dark-mode-ui-design)
- [Boas práticas de formulário de login (web.dev)](https://web.dev/articles/sign-in-form-best-practices) · [Formulários no celular](https://grasshoppersignup.com/blog/best-practices-for-mobile-form-design-in-2024)
- [Protheus — nova tela de login e seleção de ambiente (TOTVS)](https://tdn.totvs.com/display/framework/Nova+interface+do+Protheus+com+PO+UI) · [SAP Fiori launchpad](https://blog.sap-press.com/what-is-the-sap-fiori-launchpad)
- [Carbon (IBM) — espaçamento](https://carbondesignsystem.com/elements/spacing/overview/) · [Clio — nova identidade](https://www.clio.com/?p=4958) · [Astrea — usabilidade](https://www.aurum.com.br/blog/astrea-e-bom/)
