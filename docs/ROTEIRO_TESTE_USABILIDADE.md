# Roteiro do teste de usabilidade com advogados (CAD-220)

Objetivo: ver advogados de verdade usando o Cadrius e medir onde travam. Cinco participantes já mostram a maior parte
dos problemas de uso (Nielsen/Landauer); o que importa é repetir a rodada depois de cada correção, não aumentar a amostra.

## 1. Participantes (5)
| # | Perfil | Por quê |
|---|---|---|
| 1 | Advogado autônomo, até 5 anos de OAB | Público principal do plano individual; usa muito o celular |
| 2 | Advogado autônomo, mais de 15 anos de OAB | Hábitos de sistemas antigos (Projuris, planilha); menos paciência com novidade |
| 3 | Sócio de escritório pequeno (2 a 10 pessoas) | Decide a compra; olha Finanças e Carteira |
| 4 | Advogado associado / controller de prazos | Usa Publicações e Agenda forense todo dia |
| 5 | Secretária(o) ou estagiário(a) do escritório | Faz cadastros e lança despesas; não é advogado(a) |

Critérios: nunca ter usado o Cadrius; misturar áreas (cível, trabalhista, família, previdenciário); ao menos 2 no celular.

## 2. Preparação
- Base **Teste** (app-teste), um escritório por participante, já com 3 publicações de exemplo e 2 contatos.
- Sessão de 45 min (remota com compartilhamento de tela ou presencial), gravada **com consentimento por escrito**
  (LGPD: finalidade, prazo de guarda de 90 dias, direito de pedir a exclusão). Nada de dados reais de clientes.
- Um moderador (só fala o roteiro, não ajuda) e um observador (anota tempo, erros e falas).
- Protocolo "pensar em voz alta": a pessoa fala o que está pensando enquanto usa.

## 3. Abertura (5 min)
> "Estamos testando o sistema, não você. Não existe resposta errada. Se travar, é sinal de que nós precisamos melhorar.
> Fale em voz alta o que está pensando. Eu não vou poder ajudar durante as tarefas."

Perguntas rápidas: há quanto tempo advoga, que sistema usa hoje, como acompanha as intimações hoje.

## 4. Tarefas (30 min)
Ler a tarefa em voz alta e entregar por escrito. Não dizer o nome da tela nem do botão.

| # | Tarefa (como é lida) | Sucesso quando | Tempo-alvo |
|---|---|---|---|
| T1 | "Você quer passar a receber as intimações do Diário de Justiça no sistema. Cadastre a sua OAB." | OAB salva na lista de Publicações | 2 min |
| T2 | "Chegou uma publicação nova. Descubra até quando você tem para responder e marque como revisada." | Abriu a publicação, leu o prazo e marcou como revisada | 3 min |
| T3 | "Um cliente novo, Maria Souza, fechou com você uma ação de alimentos: honorários de R$ 6.000 em 3 parcelas. Registre o contrato." | Contrato criado com 3 parcelas (aparecem em Finanças) | 5 min |
| T4 | "Você pagou R$ 250 de custas iniciais nesse processo. Lance a despesa." | Despesa lançada | 2 min |
| T5 | "Encontre rapidamente o cadastro da Maria Souza." (observar se usa o menu ou a busca Ctrl+K) | Abriu o contato | 1 min |
| T6 (opcional) | "Crie um post para o Instagram do escritório sobre pensão alimentícia." | Conteúdo criado e pré-visualizado | 4 min |

Se a pessoa travar por mais de 2x o tempo-alvo, encerrar a tarefa e marcar como **falha**.

## 5. O que medir
| Métrica | Como |
|---|---|
| Sucesso da tarefa | Concluiu sozinha / com 1 dica / não concluiu |
| Tempo na tarefa | Cronômetro do início da leitura até o critério de sucesso |
| Erros | Cliques em lugar errado, voltar atrás, mensagem de erro, dado salvo errado |
| Caminho | Quais telas visitou (comparar com o caminho ideal) |
| Facilidade percebida | Ao fim de cada tarefa: "De 1 (muito difícil) a 7 (muito fácil), quão fácil foi?" (SEQ) |
| Satisfação geral | Ao final: questionário SUS (10 itens, nota 0–100; acima de 68 é bom) |

Planilha sugerida: uma linha por participante × tarefa com `sucesso | tempo (s) | erros | dica? | SEQ | observação`.

## 6. Encerramento (10 min)
- SUS (10 perguntas).
- "O que mais te incomodou?", "O que você mais gostou?", "Você usaria no dia a dia? O que faltou?"
- Agradecer; se combinado, liberar o período de teste estendido.

## 7. Análise
1. Para cada tarefa: taxa de sucesso, tempo mediano, erros médios, SEQ médio.
2. Listar cada problema observado com a frequência (quantos dos 5 tiveram) e a gravidade
   (0 = cosmético · 1 = pequeno · 2 = atrasa · 3 = impede a tarefa).
3. Priorizar: gravidade × frequência. Corrigir os de nota alta, fazer nova rodada com outros 5.
4. Registrar o resultado em `docs/MAPA_TELAS_UX.md` (tela, problema, melhoria, heurística).

Metas da primeira rodada: T1–T5 com sucesso ≥ 80%, SEQ médio ≥ 5,5 e SUS ≥ 70.

## Referências
- [Por que testar com 5 usuários (Nielsen Norman Group)](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)
- [Pensar em voz alta (NN/g)](https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/)
- [SUS — System Usability Scale (usability.gov)](https://www.usability.gov/how-to-and-tools/methods/system-usability-scale.html)
- [SEQ — Single Ease Question (MeasuringU)](https://measuringu.com/seq10/)
