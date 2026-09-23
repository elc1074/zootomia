Zootomia — Especificação da Gamificação v1.0
1. Visão geral e princípios
A gamificação do Zootomia transforma cada partida em um resultado compartilhável — um card com nível, pontuação, faixa de acertos e medalhas — sem login e sem salvar nada no computador. O progresso do aluno é acompanhado pelos próprios cards que ele baixa e compartilha.
Este documento complementa a Zootomia — Software Specification v2.0 e tem a mesma autoridade dela para tudo que trata de jogo, resultado, card, medalhas e efeitos. Onde os dois documentos divergirem, vale este (ver seção 2).
1.1 Objetivos
Motivar o aluno a jogar de novo, com feedback imediato e divertido a cada resposta.
Dar ao aluno algo bonito para mostrar o próprio desempenho nas redes sociais (Instagram, WhatsApp, X).
Reforçar o estudo: mostrar ao final o que errar e levar direto à galeria.
Funcionar 100% offline e sem conta, dentro do Electron no futuro.
1.2 Princípios obrigatórios
Sem login e sem persistência. Nenhum dado de partida é gravado em disco, localStorage, sessionStorage, IndexedDB, cookies ou servidor. A única exceção é o arquivo PNG que o próprio usuário decide baixar.
Sessão = app aberto. Dados de partidas anteriores existem só em memória (estado React) enquanto o app estiver aberto. Recarregar ou fechar apaga tudo.
A pontuação da Especificação 2.0 não muda. +10 texto certo, +5 alternativa certa, 0 erro. Sequências e medalhas são só visuais; nunca somam pontos.
Identidade visual existente. Paleta verde-escuro, bege e dourado, fontes Baloo 2 e Nunito (ver seção 12). Nenhuma cor ou fonte nova fora das listadas.
Bilíngue. Todo texto novo existe em PT e ES e segue o seletor de idioma já existente (LanguageContext). O card sai no idioma selecionado.
Nada de funcionalidade não especificada. Se algo não estiver aqui nem na Especificação 2.0, é questão em aberto (seção 17), não decisão do implementador.
2. Alterações na Especificação 2.0
As seções abaixo da Especificação 2.0 passam a ter a redação indicada. As demais continuam valendo sem mudança.
Seção da v2.0
Hoje diz
Passa a dizer
7.1 / 7.2 Game flow
Cada questão exibe uma imagem de um modelo anatômico
Cada partida usa uma imagem; cada questão é um ponto numerado dessa imagem (seção 3)
7.5 / 29 Blocker 1 (alternativas)
Em aberto
As 3 alternativas erradas vêm de outros pontos/estruturas cadastrados (seção 3.5). Blocker resolvido
9.3 Game status
Número da questão, restantes, pontuação
Acrescenta indicador de sequência e faixa de pontos (seção 7)
11 Game Result
Pontuação, acertos, erros, gráfico verde/vermelho
Mantém tudo e acrescenta nível, medalhas, card, compartilhamento e "Para revisar" (seção 8)
12.2 Finished game
Voltar ao menu sem confirmação
Mantido. A tela de resultado é o estado FINISHED
13 Game Persistence
Progresso não é persistido
Mantido. Acrescenta: histórico da sessão só em memória (seção 6)
14 Question data
Estrutura conceitual, detalhes na próxima versão
Substituída pelo modelo de dados da seção 14 deste documento
15 Number and selection
10 questões, aleatórias, cão e gato misturados
Uma imagem por partida; 10 pontos sorteados dela; a imagem é escolhida pelo usuário ou sorteada (seção 3.3)
25 Persistence
Nada persistido
Mantido. Única saída de dados: o PNG baixado pelo usuário
26 Out of scope
Achievements, ranking, saved progress
Continuam fora: conquistas permanentes, ranking, progresso salvo. Entram: medalhas da partida (não salvas) e card compartilhável

Regra de ouro: nenhuma dessas mudanças altera a regra de pontuação 10 / 5 / 0 nem os critérios de aceite AC-2.1 a AC-2.14 da v2.0.
3. Modelo do quiz por imagem
Cada partida usa uma única imagem principal com pontos numerados; cada questão pergunta "Qual estrutura é o ponto N?". A imagem pode ter vistas extras da mesma peça.
3.1 Conceitos
Termo
Definição
Imagem principal
A imagem do quiz (ex.: "Esqueleto do cão — vista lateral"). Uma por partida
Ponto
Uma estrutura marcada na imagem principal, com coordenadas x/y de 0 a 1 e um nome canônico PT/ES
Número do ponto
A ordem em que o ponto é perguntado na partida (1 a 10). Não é fixo na imagem: muda a cada partida
Vista extra
Outra imagem que mostra a mesma estrutura: "Outro ângulo" ou "Osso isolado"
Questão
Um ponto + seu estado (aguardando texto, alternativas, respondida) + resultado

3.2 Pontos na imagem
Ao iniciar a partida, os 10 pontos sorteados aparecem todos na imagem, numerados de 1 a 10.
O ponto da questão atual fica destacado (dourado, borda escura, pulsando — seção 11).
Pontos já respondidos ficam com a cor do resultado: verde (de primeira), dourado (na alternativa), vermelho (erro).
Pontos ainda não perguntados ficam brancos com número escuro.
Nenhum nome de estrutura aparece na imagem, nunca, em nenhuma vista.
Os marcadores são posicionados em porcentagem da imagem (left = x * 100%, top = y * 100%), centralizados no ponto, para funcionar com a janela redimensionada.
3.3 Escolha da imagem
"Jogar" no menu inicia a partida com uma imagem sorteada entre as disponíveis (cão e gato misturados).
Na tela de resultado, "Jogar novamente" repete a mesma imagem com um novo sorteio de pontos.
"Outra imagem" sorteia uma imagem diferente da atual. Se só existir uma imagem, o botão não aparece.
Não há tela de escolha de imagem nesta versão (questão em aberto 17.2).
3.4 Sorteio dos pontos
Sortear até 10 pontos distintos da imagem principal, em ordem aleatória (Fisher–Yates, como o shuffle já existente).
Dois pontos com o mesmo nome canônico normalizado (ex.: "Falanges" marcado no membro torácico e no pélvico) contam como um só: sortear apenas um deles por partida.
Se a imagem tiver menos de 10 nomes distintos, a partida tem esse número de questões e a pontuação máxima passa a ser 10 × questões.
O sorteio roda só no cliente (dentro de useEffect), como o código atual faz, para evitar erro de hidratação do Next.js.
3.5 Vistas extras (outro ângulo e osso isolado)
Acima da imagem há até três botões: Vista geral, Outro ângulo, Osso isolado.
"Outro ângulo" só aparece se a estrutura do ponto atual tiver uma vista extra do tipo ângulo; "Osso isolado" só se tiver uma do tipo isolado. Sem vistas extras, nenhum botão aparece.
Na vista "Outro ângulo" aparece só o marcador do ponto atual, com o mesmo número, nas coordenadas próprias daquela imagem.
Na vista "Osso isolado" aparece a foto do osso separado. Se a estrutura for uma parte do osso (ex.: "Côndilo medial da tíbia"), a vista precisa ter coordenadas e mostra o marcador; se for o osso inteiro (ex.: "Tíbia"), o marcador é opcional.
A foto isolada não pode conter o nome do osso nem legendas. Imagens do atlas com texto precisam ser recortadas antes.
Trocar de vista não muda pontuação, estado nem tempo. Ao passar para a próxima questão, volta sempre para "Vista geral".
Se houver mais de uma vista do mesmo tipo, o botão alterna entre elas a cada clique (questão em aberto 17.3).
3.6 Alternativas (resolve o Blocker 1)
Exatamente 4 alternativas: a correta + 3 distratores, em ordem aleatória, uma por botão.
Distratores, nesta prioridade: (a) nomes de outros pontos da mesma imagem; (b) nomes de outras imagens da mesma espécie; (c) qualquer outro nome cadastrado.
Nenhum distrator pode ter o mesmo nome normalizado da resposta correta ou de outro distrator.
As alternativas são sorteadas quando a questão é criada e não mudam se o usuário trocar de vista.
Exibidas no idioma atual (name.pt ou name.es).
3.7 Avaliação da resposta em texto
Normalização: trim, minúsculas, remover acentos (NFD sem marcas combinantes) e juntar espaços repetidos em um só.
Respostas aceitas: name.pt, name.es e todas as grafias em aceita[], todas normalizadas.
Campo vazio após o trim: mostrar "É necessário fornecer uma resposta" (v2.0, 24.1) e não avaliar.
3.8 Ciclo de uma questão
stateDiagram-v2
    [*] --> AGUARDANDO_TEXTO
    AGUARDANDO_TEXTO --> RESPONDIDA: texto certo (+10, de primeira)
    AGUARDANDO_TEXTO --> ALTERNATIVAS: texto errado
    ALTERNATIVAS --> RESPONDIDA: alternativa certa (+5)
    ALTERNATIVAS --> RESPONDIDA: alternativa errada (0)
    RESPONDIDA --> [*]: próxima questão ou resultado
Os estados correspondem a AWAITING_TEXT_ANSWER, SHOWING_ALTERNATIVES e ANSWERED da v2.0.
4. Pontuação, níveis e sequência
A pontuação segue a v2.0 sem mudança; o nível é calculado pela porcentagem da pontuação máxima e a sequência é só visual.
4.1 Pontuação (inalterada)
Resultado da questão
Pontos
Código
Cor
Texto certo
+10
DIRECT
Verde #2F8A5E
Alternativa certa
+5
ALTERNATIVE
Dourado #D9A93A
Alternativa errada
0
WRONG
Vermelho #C94F3D

Pontuação máxima: maxScore = 10 × totalQuestões (100 com 10 questões). Acertos = DIRECT + ALTERNATIVE; erros = WRONG (v2.0, 11.1).
4.2 Níveis
O nível é definido por pct = pontuação / maxScore, para continuar certo se o número de questões mudar.
Faixa
Nome PT
Nome ES
Frase PT
Frase ES
Cor do selo
0% a 29%
Filhote
Cachorro
Ainda roendo o básico
Todavía royendo lo básico
#A0703F
30% a 59%
Faro Afiado
Olfato Afilado
Já fareja os ossos certos
Ya olfatea los huesos correctos
#3A7F9E
60% a 79%
Monitoria
Ayudantía
Pronto pra ajudar a turma
Listo para ayudar al curso
#2C7A54
80% a 99%
Anatomista
Anatomista
Os ossos não têm segredos
Los huesos no tienen secretos
#7A4FA0
100%
Mestre dos Ossos
Maestro de los Huesos
Gabaritou. Lendário.
Puntaje perfecto. Legendario.
#C9962E

Comparações: pct < 0.30 → Filhote; pct < 0.60 → Faro Afiado; pct < 0.80 → Monitoria; pct < 1 → Anatomista; pct === 1 → Mestre dos Ossos.
4.3 Sequência (streak)
Sequência atual: número de questões seguidas respondidas certo (DIRECT ou ALTERNATIVE). Um WRONG zera.
Melhor sequência: o maior valor da sequência atual na partida. Vai para o card e para o resultado.
Indicador na tela de jogo: aparece quando a sequência atual for 3 ou mais, com o foguinho e "×N". Some quando zerar.
A sequência nunca altera a pontuação. Não há multiplicador nem bônus.
Cor: a sequência usa sempre o foguinho laranja #D9772E. Nunca usar dourado para sequência, porque dourado significa "acertou na alternativa".
5. Medalhas da partida
Medalhas são calculadas quando a partida termina, valem só para aquela partida e nunca são salvas. Uma partida pode ganhar de 0 a 3 medalhas.
5.1 Lista de medalhas
Ordem
ID
Nome PT
Nome ES
Regra
Descrição PT
Descrição ES
Cor
1
perfect
Gabarito
Pleno
Todas as questões DIRECT
Tudo de primeira
Todo a la primera
#C9962E
2
flawless
Invicto
Invicto
Nenhum WRONG e não ganhou Gabarito
Nenhum erro
Ningún error
#2C7A54
3
onFire
Em chamas
En llamas
5 ou mais DIRECT seguidos
5 de primeira seguidas
5 a la primera seguidas
#D9772E
4
strongFinish
Reta final
Recta final
As 3 últimas questões DIRECT e não ganhou Gabarito
Fechou com 3 de primeira
Cerró con 3 a la primera
#3A7F9E

5.2 Regras de cálculo
Calcular sobre a lista final de resultados, na ordem das questões.
onFire conta só DIRECT seguidos; um ALTERNATIVE ou WRONG interrompe.
onFire exige pelo menos 5 questões na partida; strongFinish exige pelo menos 3.
Gabarito exclui Invicto e Reta final para não repetir o mesmo mérito. Gabarito e Em chamas podem aparecer juntas.
Exibir sempre na ordem da tabela.
Medalhas não somam pontos e não mudam o nível.
5.3 Onde as medalhas aparecem
Aviso animado na tela de resultado: uma medalha por vez, descendo do topo (seção 11).
Chips na tela de resultado, abaixo do resumo.
Chips no card 9:16 e 1:1 (seção 9). Sem medalhas, a linha de chips não aparece e o layout não deixa buraco.
6. Sessão e comparação com a partida anterior
A sessão guarda em memória o resumo das partidas terminadas enquanto o app está aberto, só para mostrar "+N vs. partida anterior". Nada vai para disco.
Onde fica: um contexto React (SessionContext) montado no layout.tsx, ao lado do LanguageProvider, para sobreviver à navegação entre Menu, Jogo, Galeria e Sobre.
O que guarda: uma lista SessionGame[] com imagem, pontuação, pontuação máxima, acertos, erros e horário de término (seção 14). Nada mais.
Quando grava: somente quando a partida chega a FINISHED. Partida abandonada pelo "Menu" com confirmação não entra na lista.
Comparação: delta = pct atual − pct da última partida terminada da sessão, convertido para pontos na escala da partida atual e arredondado. Exibido como "+15", "−10" ou "=" (igual).
Primeira partida da sessão: não existe comparação; o bloco não aparece no card nem no resultado.
Comparação é com qualquer imagem, não só com a mesma. (Questão em aberto 17.4.)
Proibido: usar localStorage, sessionStorage, IndexedDB, cookies, arquivos ou o store do Electron para isso. Fechar ou recarregar o app zera a sessão, como a v2.0 (24.4) já prevê.
A sessão não afeta pontuação, nível, medalhas nem o sorteio (v2.0, 8.5). A única exceção é o sorteio de "Outra imagem", que evita repetir a imagem atual.
7. Tela de jogo
A tela mantém o arranjo da v2.0 — imagem à esquerda, respostas à direita — e acrescenta pontos numerados, vistas extras, faixa de pontos e indicador de sequência. Referência visual: artboard "Jogo — quiz por imagem" (seção 18).
7.1 Barra superior (altura 76 px, fundo #1C3528)
Posição
Elemento
Conteúdo
Esquerda
Botão "Menu"
Seta + "Menu". Abre o modal de confirmação da v2.0 (12.1) se IN_PROGRESS
Centro-esquerda
Bloco PONTO
"8 / 10" em dourado #E8C252
Centro-esquerda
Bloco RESTANTES
total − número do ponto atual (no ponto 8 de 10 → 2)
Centro-esquerda
Bloco PONTUAÇÃO
Pontuação atual
Centro-esquerda
Indicador de sequência
Pílula fundo #2A1E14, borda #D9772E, foguinho + "×N". Só com sequência ≥ 3
Direita
Título da imagem
Nome da imagem (Baloo 2, 20 px) + subtítulo da vista em #8DC9A0

Os blocos PONTO, RESTANTES e PONTUAÇÃO: fundo rgba(141,201,160,0.1), raio 8 px, rótulo 10 px caixa-alta #8DC9A0, valor Baloo 2 20 px.
7.2 Área da imagem (esquerda, flexível)
Linha de botões de vista (seção 3.5): pílulas de 38 px de altura. Ativa: fundo #1C3528, texto branco. Inativa: fundo rgba(100,70,40,0.12), texto #5C3D20.
Caixa da imagem: fundo branco, raio 12 px, sombra 0 6px 20px rgba(0,0,0,0.12). Imagem com object-fit: contain, sem distorção, ocupando o máximo de espaço.
Marcadores: círculos de 26 px, número 12 px em negrito, borda 2 px (cores na seção 3.2).
Faixa de pontos abaixo da imagem: 10 quadrados de 30 px, raio 8 px, com o número. Mesmas cores dos marcadores; o atual é fundo #1C3528 com número dourado; os não perguntados são rgba(92,61,32,0.18).
Falha ao carregar: o texto "Falha ao carregar imagem" no lugar da imagem (v2.0, 24.2); a partida continua.
7.3 Painel de resposta (direita, 400 px, fundo #EFE4D2)
Pergunta: "Qual estrutura é o ponto N?" (Baloo 2, 26 px, #1C3528), ligada ao campo por <label for>.
Campo de texto (50 px, raio 10 px, fundo branco) com placeholder "Ex: Fêmur, Crânio...".
Botão "Confirmar" (50 px, fundo #2C7A54, texto branco). Enter no campo também confirma.
Campo vazio: mensagem "É necessário fornecer uma resposta" logo abaixo, em #A63A2A.
Após texto errado: o campo fica desabilitado mostrando o que foi digitado, e surgem as 4 alternativas em grade 2×2 com o texto "Incorreto no texto. Escolha uma alternativa:".
Durante o feedback (seção 7.4), campo, botão e alternativas ficam desabilitados.
7.4 Feedback e avanço
Situação
O que aparece
Tempo até a próxima questão
Texto certo
Campo pisca verde, "+10" sobe, "De primeira!"
900 ms
Alternativa certa
Alternativa brilha dourado, "+5" sobe
1.100 ms
Alternativa errada
Escolhida treme em vermelho; a correta acende verde; "Era: <nome>"
1.600 ms

O avanço é automático; não existe botão "Próxima".
Na última questão, após o tempo acima, a partida vai para FINISHED e abre a tela de resultado.
O marcador e o quadrado da faixa mudam para a cor do resultado no mesmo instante do feedback.
8. Tela de resultado
A tela de resultado é o estado FINISHED do Jogo (mesma rota /game, sem nova página). Ela cumpre a seção 11 da v2.0 e acrescenta o card, o compartilhamento, as medalhas e a revisão. Referência: artboard "Tela de resultado + compartilhar".
8.1 Estrutura
Região
Largura
Conteúdo
Coluna do card
440 px, fundo #142A1E
Seletor de formato + pré-visualização do card + legenda
Barra superior
Restante, 68 px
"Menu" (sem confirmação, v2.0 12.2) · "Fim de jogo!" · nome da imagem
Conteúdo
Restante
Resumo → medalhas → compartilhar → para revisar → botões finais

8.2 Coluna do card
Seletor em pílula: "Story 9:16" e "Quadrado 1:1". Padrão: Story. Ativo com fundo #3A9E6F e texto branco.
Pré-visualização: o mesmo componente que gera o PNG (seção 9), reduzido com transform: scale() para caber — Story a 60% (324×576 px), Quadrado a 60% (360×360 px). Raio 14 px e sombra 0 18px 40px rgba(0,0,0,0.45).
Legenda abaixo: "Pré-visualização do card que será baixado" (12 px, #8DC9A0 a 70%).
O formato escolhido aqui é o que "Baixar imagem" e os botões de rede social usam.
8.3 Resumo (exigido pela v2.0)
Quatro blocos lado a lado:
Pontuação final: fundo #1C3528, número dourado 44 px + "/100" (ou o máximo da partida); abaixo, "+15 vs. partida anterior" quando houver (seção 6).
Acertos: número verde #2F8A5E.
Erros: número vermelho #C94F3D.
Gráfico: barra horizontal de 18 px, verde (% de acertos) seguida de vermelho (% de erros), com as porcentagens em cima. Cumpre AC-2.9 e AC-2.10.
8.4 Medalhas
Linha de chips logo abaixo do resumo, na ordem da seção 5.1. Sem medalhas, a linha não é renderizada.
8.5 Compartilhar
Título "Compartilhe seu resultado" e cinco botões de 46 px:
Botão
Estilo
Ação (detalhes na seção 10)
Baixar imagem
Primário, fundo #2C7A54
Salva o PNG do formato escolhido
WhatsApp
Secundário, fundo branco
Baixa o PNG e abre o WhatsApp com o texto pronto
X / Twitter
Secundário
Baixa o PNG e abre o X com o texto pronto
Instagram
Secundário
Baixa o PNG e mostra o modal de instruções
Copiar texto
Secundário
Copia o texto de compartilhamento; o rótulo vira "Copiado!" por 1,6 s

Abaixo dos botões, uma caixa tracejada mostra o texto que será copiado/enviado (seção 10.4), com a faixa desenhada em quadrados coloridos. Ao lado: "Texto que vai junto no WhatsApp e no X. No Instagram a imagem é baixada e o app mostra como postar no Story."
8.6 Para revisar
Lista as questões WRONG primeiro e depois as ALTERNATIVE, cada grupo na ordem das questões.
Cada linha: quadrado da cor do resultado · nome correto em negrito · detalhe · link "Ver na galeria".
Detalhe: WRONG → "você marcou “<alternativa escolhida>”"; ALTERNATIVE → "acertou só na alternativa".
"Ver na galeria" navega para a Galeria com o visualizador ampliado aberto na imagem da partida (/gallery?img=<imageId>). Isso não precisa de login: usa só os dados da partida atual.
Sem nada para revisar: uma linha única "Nada para revisar. Mandou bem!".
8.7 Botões finais (canto inferior direito)
"Outra imagem" (contorno #2C7A54): nova partida com imagem diferente (seção 3.3). Oculto se só houver uma imagem.
"Jogar novamente" (fundo #1C3528): nova partida com a mesma imagem.
Os dois zeram tudo, conforme a v2.0 (8.5), e registram a partida terminada na sessão antes de zerar.
9. Card compartilhável
O card existe em dois formatos: Story 9:16, exportado em 1080×1920 px, e Quadrado 1:1, exportado em 1080×1080 px. Ele é desenhado em medidas fixas (540×960 e 600×600) e exportado com escala 2× e 1,8×. Referência: artboards "Card — Story" e "Card — Quadrado".
9.1 Regras gerais
Um único componente React por formato (ShareCardStory, ShareCardSquare), usado tanto na pré-visualização quanto na exportação — o PNG tem que ser idêntico ao que se vê.
Medidas em px fixos, sem unidades relativas à janela: o card não é responsivo.
Fundo #1C3528. Textura: a imagem principal da partida, filter: invert(1), opacidade 0,09, background-size: 170% (Story) e 115% (Quadrado). Se a imagem falhou ao carregar, sem textura.
Tudo no idioma atual. Data com Intl.DateTimeFormat (pt-BR / es-CL, dia numérico, mês curto, ano) sem pontos: "21 set 2026" / "21 sept 2026"; hora "18:42" (24 h). Data e hora = término da partida.
Nome da imagem em uma linha, com reticências se passar do espaço.
Nome do nível com mais de 16 caracteres (ex.: "Maestro de los Huesos") usa 38 px no Story e 32 px no Quadrado, em vez de 46 e 40.
Proibido no card: nome do usuário, emojis, marca de terceiros, recorde, número global de partida.
9.2 Story 9:16 (base 540×960, padding 44 · 40 · 36 · 40, blocos com 26 px de espaço)
#
Bloco
Especificação
1
Cabeçalho
Esquerda: ícone 38 px (fundo #3A9E6F, raio 8, pata do menu) + "Zoo" branco e "tomia" #E8C252, Baloo 2 800, 30 px. Direita: nome da imagem em caixa-alta, 12 px, 800, espaçamento 0,16em, #8DC9A0
2
Nível
Centralizado. Selo circular 118 px na cor do nível com ícone de osso branco 66 px e dois halos (0 0 0 6px rgba(255,255,255,.08), 0 0 0 12px rgba(255,255,255,.04)). Abaixo: "NÍVEL" 12 px caixa-alta #8DC9A0; nome do nível Baloo 2 800 46 px branco; frase 16 px 600 branco a 72%
3
Pontuação
Linha de base comum: número Baloo 2 800 150 px #E8C252, espaçamento −0,04em; "/100 pts" Baloo 2 700 28 px branco a 60%
4
Painel
Fundo #EFE4D2, raio 16, padding 22 · 24, blocos internos com 18 px de espaço
4a
Anel + números
Anel 96 px (raio 38, traço 12): base #C94F3D, arco #2F8A5E proporcional aos acertos, começando no topo, sentido horário. Centro: "90%" Baloo 2 24 px + "ACERTO" 10 px #5C3D20. Ao lado, três colunas: de primeira (número #2F8A5E), na alternativa (número #9A6E10, quadrado #D9A93A), erros (número #C94F3D). Número Baloo 2 800 30 px; abaixo, quadrado 10 px da cor + rótulo 12 px 700 #5C3D20
4b
Faixa
Grade de 10 colunas, 6 px de espaço, quadrados de 30 px de altura, raio 6, cores da seção 4.1 na ordem das questões
4c
Medalhas
Chips: fundo branco, borda 1,5 px na cor da medalha, raio total, círculo 22 px na cor com estrela branca, nome 12 px 800. Sem medalhas: bloco omitido
4d
Sequência e comparação
Duas caixas lado a lado, fundo #1C3528, raio 10: foguinho laranja 22 px + "8 seguidas" (melhor sequência); seta de tendência #8DC9A0 + "+15 vs. partida anterior". Sem partida anterior, só a primeira caixa, ocupando a largura toda
5
Rodapé
Encostado embaixo. Esquerda: "Consegue me superar?" Baloo 2 800 24 px + "[link do projeto]" 13 px branco a 60%. Direita: data e hora em duas linhas, 12 px 700, #8DC9A0 a 80%

9.3 Quadrado 1:1 (base 600×600, padding 36, blocos com 22 px de espaço)
#
Bloco
Especificação
1
Cabeçalho
Esquerda: "Zoo" + "tomia" Baloo 2 800 28 px. Direita: nome da imagem, 11 px caixa-alta #8DC9A0
2
Nível
Linha: selo 96 px (halo 6 px) + coluna com "NÍVEL" 11 px, nome Baloo 2 800 40 px, frase 14 px
3
Pontuação e números
Esquerda: número 120 px dourado + "/100 pts" 22 px. Direita: acertos (#8DC9A0), erros (#F08A78), seguidas (foguinho laranja + número branco). Números Baloo 2 30 px, rótulos 11 px branco a 70%
4
Faixa
10 quadrados de 34 px de altura, raio 7, 6 px de espaço
5
Medalhas
Mesmos chips da seção 9.2, se houver
6
Rodapé
Linha de 1 px rgba(141,201,160,0.2) em cima. "Consegue me superar?" Baloo 2 20 px · data e hora 12 px #8DC9A0

9.4 Fontes no card
As fontes precisam funcionar sem internet (Electron offline). Baloo 2 e Nunito devem ser empacotadas no projeto (arquivos em public/fonts com @font-face, ou next/font/local), substituindo o @import do Google Fonts no globals.css. A exportação só começa depois de document.fonts.ready.
10. Geração da imagem, download e compartilhamento
O PNG é gerado no próprio app a partir do componente do card; download, abrir links e copiar texto passam por uma camada de plataforma, para que o Electron possa assumir depois sem mudar a interface.
10.1 Geração do PNG
Biblioteca: html-to-image (função toPng). É a única dependência nova permitida para a gamificação.
O card é renderizado fora da tela no tamanho base (position: fixed; left: -10000px; top: 0) e exportado com pixelRatio 2 (Story → 1080×1920) ou 1,8 (Quadrado → 1080×1080).
Antes de exportar: aguardar document.fonts.ready e o carregamento da imagem de textura.
Nome do arquivo: zootomia-<imageId>-<AAAA-MM-DD>-<HHmm>-<story|quadrado>.png, com a data e a hora de término da partida. Assim os cards salvos ficam em ordem na pasta e servem de histórico.
Enquanto gera, todos os botões de compartilhar ficam desabilitados e o clicado mostra "Gerando…".
Falha na geração: aviso "Não foi possível gerar a imagem. Tente de novo." e nenhuma rede social é aberta.
10.2 Camada de plataforma (compatível com Electron)
Criar src/platform/share.ts com a interface abaixo e uma implementação para navegador. O Electron vai fornecer outra implementação depois (fora do escopo agora), no mesmo padrão da função Sair da v2.0 (5.5).
export interface SharePlatform {
  saveImage(png: Blob, fileName: string): Promise<"saved" | "cancelled" | "error">;
  openExternal(url: string): void;
  copyText(text: string): Promise<boolean>;
}
Função
Navegador (implementar agora)
Electron (futuro, só documentar)
saveImage
URL.createObjectURL + <a download> clicado por código; retorna "saved"
dialog.showSaveDialog + fs.writeFile via IPC
openExternal
window.open(url, "_blank", "noopener")
shell.openExternal(url)
copyText
navigator.clipboard.writeText; se falhar, <textarea> + document.execCommand("copy")
clipboard.writeText

Seleção: se existir window.zootomiaDesktop (a ser exposto pelo preload do Electron), usar ele; senão, a implementação de navegador. Os componentes só importam getSharePlatform(), nunca APIs do Electron.
10.3 Ação de cada botão
Botão
Passos
Aviso ao usuário (3 s, rodapé da tela)
Baixar imagem
Gera PNG → saveImage
"Imagem salva!"
WhatsApp
Gera PNG → saveImage → openExternal("https://wa.me/?text=" + encodeURIComponent(texto))
"Imagem salva. Anexe ela na conversa do WhatsApp."
X / Twitter
Gera PNG → saveImage → openExternal("https://twitter.com/intent/tweet?text=" + encodeURIComponent(texto))
"Imagem salva. Anexe ela no post."
Instagram
Gera PNG → saveImage → abre o modal de instruções (10.5)
—
Copiar texto
copyText(texto)
Rótulo do botão vira "Copiado!" por 1,6 s

Se saveImage retornar "cancelled", não abrir rede social nem modal. Se retornar "error", mostrar o aviso de falha da 10.1.
Motivo da limitação: pelo computador, WhatsApp e X aceitam só texto por link, e o Instagram não aceita postagem por link. Por isso a imagem é sempre salva primeiro para o usuário anexar.
10.4 Texto de compartilhamento
Modelo PT:
Zootomia · {nomeDaImagem} — {pontos}/{maximo} · Nível {nivel}
{faixa}
🔥 {melhorSequencia} seguidas{ · Medalhas: {medalhas}}
Consegue me superar? {link}
Modelo ES:
Zootomia · {nomeDaImagem} — {pontos}/{maximo} · Nivel {nivel}
{faixa}
🔥 {melhorSequencia} seguidas{ · Medallas: {medalhas}}
¿Puedes superarme? {link}
{faixa}: um emoji por questão, na ordem: 🟩 DIRECT, 🟨 ALTERNATIVE, 🟥 WRONG.
{medalhas}: nomes separados por vírgula; sem medalhas, o trecho entre chaves some.
Melhor sequência 0: a terceira linha fica só com as medalhas; sem nenhuma das duas, a linha some.
{link}: link oficial do projeto, ainda não definido (questão em aberto 17.1). Enquanto não existir, omitir o link e manter só a pergunta.
10.5 Modal do Instagram
Mesmo estilo dos modais existentes (fundo escuro, caixa bege). Título "Imagem salva!". Texto: "Para postar no Instagram, passe a imagem para o celular (WhatsApp, e-mail ou Google Drive), abra o Instagram, toque em + e escolha Story ou Post. Use o formato Story 9:16 para Stories e o Quadrado 1:1 para o feed." Um botão: "Entendi".
11. Efeitos visuais e animações
Todos os efeitos são CSS puro (keyframes) e estado React, sem biblioteca de animação nem de confete. Referência: artboard "Efeitos visuais" e os GIFs/MP4 exportados (seção 18).
11.1 Catálogo
ID
Quando
Efeito
Duração
fx-direct
Texto certo
Campo: fundo #DDF1E4 e borda #2F8A5E; "+10" dourado aparece com escala 0,7 → 1,15 → 1 e sobe 44 px sumindo; "De primeira!" em #8DC9A0
900 ms
fx-alt
Alternativa certa
Botão escolhido fica #D9A93A com halo 0 0 0 6px rgba(217,169,58,.45); "+5" sobe como no fx-direct
1.100 ms
fx-wrong
Alternativa errada
Escolhida #C94F3D e treme (±8 px, 4 oscilações em 400 ms); após 300 ms a correta vira #2F8A5E com texto branco. Sem som, sem perder pontos
1.600 ms
fx-streak
Sequência chega a 3+
Pílula do foguinho entra com escala 1 → 1,18 → 1; a cada acerto seguinte repete o pulo; foguinho oscila ±2° em loop de 500 ms
400 ms por pulo
fx-marker
Ponto atual
Anel dourado se expandindo até 14 px e sumindo, em loop
1.400 ms, contínuo
fx-result-in
Abrir o resultado
Sequência da seção 11.2
≈ 2,5 s
fx-confetti
Resultado com pct ≥ 60% ou alguma medalha
60 peças 9×14 px, raio 2, cores #E8C252 #3A9E6F #F08A78 #8DC9A0 #FFFFFF, caindo com rotação de 540°, atrasos aleatórios de 0 a 1,5 s
3 s, uma vez
fx-medal
Cada medalha ganha
Aviso bege desce do topo (−90 px → 0), brilho diagonal passa uma vez, fica 2,4 s e sobe
3 s por medalha
fx-copied
Copiar texto
Rótulo "Copiado!"
1,6 s

11.2 Sequência de entrada do resultado
Tempo
Acontece
0 ms
Coluna do card entra com opacidade 0 → 1 e sobe 16 px (400 ms)
200 ms
Pontuação conta de 0 até o valor final (1.200 ms, easeOutCubic, número inteiro)
200 ms
Barra verde/vermelha e anel do card se preenchem (900 ms)
400 ms
Quadrados da faixa aparecem um a um com pulo de escala (60 ms entre cada)
1.200 ms
Confete, se a regra do fx-confetti valer
1.400 ms
Avisos de medalha, um após o outro, 300 ms de intervalo

A animação não atrasa os botões: todos ficam clicáveis desde o início. O PNG exportado sempre mostra o estado final, sem animação.
11.3 Keyframes de referência
@keyframes floatUp{0%{opacity:0;transform:translateY(10px) scale(.7)}15%{opacity:1;transform:translateY(0) scale(1.15)}30%{transform:translateY(-6px) scale(1)}70%{opacity:1;transform:translateY(-30px)}100%{opacity:0;transform:translateY(-44px)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(5px)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
@keyframes flicker{0%,100%{transform:scaleY(1) rotate(-2deg)}50%{transform:scaleY(1.08) rotate(2deg)}}
@keyframes ping{0%{box-shadow:0 0 0 0 rgba(232,194,82,.9)}70%{box-shadow:0 0 0 14px rgba(232,194,82,0)}100%{box-shadow:0 0 0 0 rgba(232,194,82,0)}}
@keyframes fall{0%{transform:translateY(-30px) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(110vh) rotate(540deg);opacity:0}}
@keyframes slideIn{0%{transform:translateY(-90px);opacity:0}15%,85%{transform:translateY(0);opacity:1}100%{transform:translateY(-90px);opacity:0}}
@keyframes shine{0%{left:-60%}100%{left:130%}}
11.4 Movimento reduzido
Com prefers-reduced-motion: reduce: sem tremor, sem confete, sem pulsos nem loops; a contagem da pontuação mostra o valor final direto. As mudanças de cor e os avisos continuam (aparecendo sem deslizar).
12. Tokens visuais
As cores vêm do menu atual (src/app/page.tsx) mais as cores de resultado. Devem ficar num único arquivo (src/styles/tokens.ts) e ser importadas, nunca repetidas soltas pelo código novo.
12.1 Cores
Token
Hex
Uso
greenDeep
#142A1E
Coluna do card no resultado, fundo de sidebar
greenDark
#1C3528
Fundo do card, barra superior, botões principais escuros
greenBrand
#3A9E6F
Ícone da marca, seletor ativo
greenButton
#2C7A54
Botões primários (Confirmar, Baixar imagem)
greenSoft
#8DC9A0
Rótulos sobre verde-escuro
gold
#E8C252
"tomia", pontuação, ponto atual
beigePage
#D9C9B0
Fundo das telas
beigeMenu
#C8B498
Fundo do menu (existente)
beigePanel
#EFE4D2
Painéis e painel do card
brown
#5C3D20
Rótulos sobre bege
brownText
#6B4A2A
Texto secundário sobre bege
ink
#1A2E22
Texto principal
resultDirect
#2F8A5E
De primeira / acertos / verde do gráfico
resultAlt
#D9A93A
Na alternativa (fundos e quadrados)
resultAltText
#9A6E10
Número "na alternativa" sobre bege (contraste)
resultWrong
#C94F3D
Erros / vermelho do gráfico
streak
#D9772E
Foguinho e pílula de sequência (nunca dourado)
streakBg
#2A1E14
Fundo da pílula de sequência
errorText
#A63A2A
Mensagem de campo vazio, "Apagar"

Cores dos níveis e das medalhas: seções 4.2 e 5.1.
12.2 Tipografia
Uso
Fonte
Peso
Tamanhos
Títulos, números, nomes de nível
Baloo 2
700–800
18–150 px
Texto, botões, rótulos
Nunito
600–800
10–17 px
Rótulos em caixa-alta
Nunito
800
10–13 px, espaçamento 0,14–0,22em

12.3 Formas
Raios: 6–8 px (quadrados da faixa, blocos do HUD), 10 px (botões, campos), 12–16 px (painéis, cards), total (pílulas, chips). Botões clicáveis com no mínimo 40 px de altura; os de compartilhar com 46 px. Ícones em SVG de traço, nunca emoji na interface (emoji só no texto de compartilhamento).
13. Textos da interface (PT / ES)
Todos os textos novos entram em src/data/locales.ts, no mesmo formato TRANSLATIONS.pt / TRANSLATIONS.es. Textos que já existem lá (menu, modais, "É necessário fornecer uma resposta" etc.) continuam como estão. Nomes e frases de níveis e medalhas estão nas seções 4.2 e 5.1.
Chave
PT
ES
game.point
PONTO
PUNTO
game.remaining
RESTANTES
RESTANTES
game.score
PONTUAÇÃO
PUNTAJE
game.questionPrompt
Qual estrutura é o ponto {n}?
¿Qué estructura es el punto {n}?
game.viewMain
Vista geral
Vista general
game.viewAngle
Outro ângulo
Otro ángulo
game.viewIsolated
Osso isolado
Hueso aislado
game.firstTry
De primeira!
¡A la primera!
game.was
Era:
Era:
result.title
Fim de jogo!
¡Fin del juego!
result.finalScore
PONTUAÇÃO FINAL
PUNTAJE FINAL
result.correct
ACERTOS
ACIERTOS
result.wrong
ERROS
ERRORES
result.pctCorrect
{p}% acerto
{p}% acierto
result.pctWrong
{p}% erro
{p}% error
result.vsPrevious
{d} vs. partida anterior
{d} vs. partida anterior
result.formatStory
Story 9:16
Story 9:16
result.formatSquare
Quadrado 1:1
Cuadrado 1:1
result.previewCaption
Pré-visualização do card que será baixado
Vista previa de la tarjeta que se descargará
result.shareTitle
Compartilhe seu resultado
Comparte tu resultado
result.download
Baixar imagem
Descargar imagen
result.copyText
Copiar texto
Copiar texto
result.copied
Copiado!
¡Copiado!
result.generating
Gerando…
Generando…
result.shareHint
Texto que vai junto no WhatsApp e no X. No Instagram a imagem é baixada e o app mostra como postar no Story.
Texto que acompaña en WhatsApp y X. En Instagram la imagen se descarga y la app muestra cómo publicarla en la historia.
result.reviewTitle
Para revisar
Para repasar
result.reviewMarked
você marcou “{alt}”
marcaste “{alt}”
result.reviewAlt
acertou só na alternativa
acertaste solo en la alternativa
result.reviewGallery
Ver na galeria
Ver en la galería
result.reviewNone
Nada para revisar. Mandou bem!
Nada que repasar. ¡Muy bien!
result.playAgain
Jogar novamente
Jugar de nuevo
result.otherImage
Outra imagem
Otra imagen
toast.saved
Imagem salva!
¡Imagen guardada!
toast.savedWhatsapp
Imagem salva. Anexe ela na conversa do WhatsApp.
Imagen guardada. Adjúntala en el chat de WhatsApp.
toast.savedX
Imagem salva. Anexe ela no post.
Imagen guardada. Adjúntala en la publicación.
toast.error
Não foi possível gerar a imagem. Tente de novo.
No se pudo generar la imagen. Inténtalo de nuevo.
instagram.title
Imagem salva!
¡Imagen guardada!
instagram.body
Para postar no Instagram, passe a imagem para o celular (WhatsApp, e-mail ou Google Drive), abra o Instagram, toque em + e escolha Story ou Post. Use o formato Story 9:16 para Stories e o Quadrado 1:1 para o feed.
Para publicar en Instagram, pasa la imagen al celular (WhatsApp, correo o Google Drive), abre Instagram, toca + y elige Historia o Publicación. Usa el formato Story 9:16 para historias y el Cuadrado 1:1 para el feed.
instagram.ok
Entendi
Entendido
card.level
NÍVEL
NIVEL
card.accuracy
ACERTO
ACIERTO
card.firstTry
de primeira
a la primera
card.onAlt
na alternativa
en la alternativa
card.errors
erros
errores
card.correctShort
acertos
aciertos
card.streak
seguidas
seguidas
card.vsPrevious
vs. partida anterior
vs. partida anterior
card.challenge
Consegue me superar?
¿Puedes superarme?

Os nomes das imagens vêm de titulo.pt / titulo.es do cadastro (seção 14), com uma versão curta para o card (tituloCurto).
14. Modelo de dados e estados
O cadastro continua em src/data/anatomy.ts, estendido sem quebrar o formato atual; a lógica do jogo vira funções puras em src/game/, separadas da tela (v2.0, 27.9).
14.1 Cadastro das imagens
export type ExtraView = {
  tipo: "angulo" | "isolado";
  src: string;            // caminho em /public
  x?: number;             // 0..1, obrigatório para "angulo"
  y?: number;             // 0..1, obrigatório para "angulo"
};

export type Marker = {
  name: { pt: string; es: string };
  aceita?: string[];
  x: number;              // 0..1 na imagem principal
  y: number;
  vistas?: ExtraView[];   // NOVO: outro ângulo / osso isolado deste ponto
};

export type AnatomyImage = {
  id: string;
  titulo: { pt: string; es: string };
  tituloCurto: { pt: string; es: string }; // NOVO: "Esqueleto do cão · lateral"
  animal: "dog" | "cat";                   // NOVO
  especie: string;                         // nome científico (existente)
  src: string;
  fonte: string;
  markers: Marker[];
};
14.2 Estado da partida
export type QuestionResult = "DIRECT" | "ALTERNATIVE" | "WRONG";
export type QuestionState = "AWAITING_TEXT_ANSWER" | "SHOWING_ALTERNATIVES" | "ANSWERED";

export type Question = {
  numero: number;                 // 1..N, ordem na partida
  marker: Marker;
  options: { pt: string; es: string }[]; // 4, já embaralhadas
  correctIndex: number;
  state: QuestionState;
  result?: QuestionResult;
  typedAnswer?: string;
  chosenIndex?: number;
};

export type Game = {
  imageId: string;
  questions: Question[];
  currentIndex: number;
  status: "IN_PROGRESS" | "FINISHED";
  finishedAt?: Date;
};

export type SessionGame = {
  imageId: string;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  finishedAt: Date;
};
Pontuação, acertos, erros, sequência, nível e medalhas são derivados de questions[].result, nunca guardados em paralelo.
14.3 Funções puras (src/game/)
Função
Entrada → saída
normalize(s)
texto → texto normalizado (seção 3.7)
buildGame(image, allImages, rng)
→ Game com até 10 questões e alternativas (3.4, 3.6)
isCorrectText(question, text)
→ boolean
scoreOf(results)
→ pontos (10/5/0)
streaks(results)
→ { current, best, bestDirect }
levelOf(score, maxScore)
→ nível da tabela 4.2
medalsOf(results)
→ lista ordenada da seção 5
shareText(game, lang, previous?)
→ texto da seção 10.4
validateImage(image)
→ lista de erros de cadastro (seção 15)

rng é injetável para os testes poderem repetir sorteios.
14.4 Organização sugerida de arquivos
Caminho
Conteúdo
src/game/*.ts
Funções puras da 14.3
src/contexts/SessionContext.tsx
Histórico da sessão em memória (seção 6)
src/platform/share.ts
Camada de plataforma (seção 10.2)
src/components/game/*
HUD, imagem com marcadores, painel de resposta, faixa de pontos
src/components/result/*
Tela de resultado, medalhas, compartilhar, revisão, toasts
src/components/card/ShareCardStory.tsx, ShareCardSquare.tsx
Os cards (seção 9)
src/styles/tokens.ts
Cores da seção 12
public/fonts/
Baloo 2 e Nunito

15. Casos de borda
Situação
Comportamento esperado
Imagem com menos de 10 nomes distintos
Partida com esse número de questões; máximo 10 × N; níveis por porcentagem; faixa do card com N quadrados
Imagem com menos de 4 nomes distintos em todo o cadastro
Não dá para montar alternativas: validateImage acusa erro e a imagem não entra no sorteio (v2.0, 24.3)
Marcador com x ou y fora de 0..1, nome vazio ou src vazio
Erro de cadastro em modo desenvolvimento (console.error com o id); ponto ignorado no sorteio
Vista "angulo" sem x/y
Vista ignorada (botão não aparece) + erro de cadastro
Imagem principal não carrega
"Falha ao carregar imagem" no lugar; partida continua; card sem textura
Vista extra não carrega
"Falha ao carregar imagem" dentro da caixa; o usuário volta para "Vista geral"
Duplo clique em Confirmar ou numa alternativa
Só a primeira resposta conta; controles travam durante o feedback
Clicar em "Menu" durante o feedback
Abre o modal da v2.0; se confirmar, a partida é abandonada e não entra na sessão
Trocar o idioma durante a partida
Textos, alternativas e card mudam de idioma na hora; resultados não mudam
Janela redimensionada
Imagem e marcadores se reajustam (porcentagem); o card não muda, pois tem medidas fixas
Clicar em compartilhar várias vezes seguidas
Ignorar cliques enquanto "Gerando…"
Usuário cancela a janela de salvar (Electron)
Nada acontece; nenhuma rede social abre
Clipboard bloqueado
Tentar o fallback; se também falhar, mostrar o texto selecionado na caixa para cópia manual
Sem internet
Tudo funciona, inclusive o PNG. Só os links de WhatsApp e X precisam de internet para abrir
Pontuação 0
Nível Filhote, anel todo vermelho, sem confete, sem medalhas, card normal
Recarregar ou fechar o app
Partida e sessão somem, sem aviso extra (v2.0, 24.4)

16. Critérios de aceite
A gamificação está pronta quando todos os critérios abaixo passam, junto com os AC da v2.0 que continuam valendo.
16.1 Quiz por imagem
AC-G1 DADO que o usuário clica em Jogar, ENTÃO uma imagem é sorteada e mostra até 10 pontos numerados, com o ponto 1 destacado e a pergunta "Qual estrutura é o ponto 1?".
AC-G2 DADO que uma questão é respondida, ENTÃO o marcador e o quadrado daquele número mudam para verde (texto certo), dourado (alternativa certa) ou vermelho (erro).
AC-G3 DADO um ponto com vista "angulo", ENTÃO o botão "Outro ângulo" aparece e mostra a outra imagem com só aquele número marcado; DADO um ponto sem essa vista, ENTÃO o botão não aparece.
AC-G4 DADO um ponto com vista "isolado", QUANDO o usuário clica em "Osso isolado", ENTÃO aparece a foto do osso sem nenhum nome.
AC-G5 DADO que o usuário trocou de vista, QUANDO a próxima questão começa, ENTÃO a vista volta a ser "Vista geral" e a pontuação não mudou por causa da troca.
AC-G6 DADO um texto errado, ENTÃO aparecem 4 alternativas sem nomes repetidos, com exatamente uma correta, e os distratores vêm primeiro de outros pontos da mesma imagem.
AC-G7 DADO um nome repetido na imagem (ex.: Falanges), ENTÃO ele aparece no máximo uma vez por partida.
16.2 Pontuação, sequência, nível e medalhas
AC-G8 A pontuação continua 10 / 5 / 0 e nunca muda por sequência ou medalha.
AC-G9 DADA uma sequência atual de 3 ou mais, ENTÃO a pílula laranja com foguinho e "×N" aparece na barra superior; DADO um erro, ENTÃO ela some.
AC-G10 DADAS as pontuações 25, 50, 70, 85 e 100 de 100, ENTÃO os níveis são Filhote, Faro Afiado, Monitoria, Anatomista e Mestre dos Ossos.
AC-G11 DADAS 10 respostas de primeira, ENTÃO as medalhas são Gabarito e Em chamas, e não Invicto nem Reta final.
AC-G12 DADOS os resultados D D A D D D D D W D, ENTÃO a única medalha é Em chamas e a melhor sequência é 8.
16.3 Resultado e sessão
AC-G13 DADA a última resposta, ENTÃO após o feedback abre o resultado com pontuação final, acertos, erros e barra verde/vermelha (cumpre AC-2.9 e AC-2.10).
AC-G14 DADA a primeira partida da sessão, ENTÃO não aparece "vs. partida anterior"; DADA a segunda, ENTÃO aparece a diferença para a anterior.
AC-G15 DADO que o app é recarregado, ENTÃO a próxima partida não mostra comparação (nada foi salvo).
AC-G16 Em nenhum momento o app escreve em localStorage, sessionStorage, IndexedDB ou cookies (verificável pelo DevTools).
AC-G17 DADA uma partida com erros, ENTÃO "Para revisar" lista os erros e depois os acertos na alternativa, e "Ver na galeria" abre a Galeria com o visualizador na imagem da partida.
AC-G18 "Jogar novamente" repete a imagem com novo sorteio; "Outra imagem" troca de imagem; os dois começam com tudo zerado.
16.4 Card e compartilhamento
AC-G19 A pré-visualização e o PNG baixado são visualmente idênticos e têm 1080×1920 (Story) ou 1080×1080 (Quadrado).
AC-G20 O card Story mostra: marca, nome da imagem, selo e nome do nível, pontuação, anel de acerto, números de primeira / na alternativa / erros, faixa colorida, medalhas (se houver), melhor sequência com foguinho, comparação (se houver), convite e data/hora.
AC-G21 Nenhum card mostra recorde, nome do usuário ou número global de partida.
AC-G22 Com o idioma em ES, o card, o texto de compartilhamento e a tela de resultado saem em espanhol.
AC-G23 O nome do arquivo segue zootomia-<imageId>-<AAAA-MM-DD>-<HHmm>-<story|quadrado>.png.
AC-G24 WhatsApp e X: salvam o PNG e abrem o link com o texto da seção 10.4. Instagram: salva o PNG e abre o modal de instruções.
AC-G25 "Copiar texto" coloca na área de transferência o texto com a faixa em emojis e mostra "Copiado!" por 1,6 s.
AC-G26 Com a internet desligada, o PNG é gerado com as fontes Baloo 2 e Nunito corretas.
AC-G27 Nenhum componente importa APIs do Electron; tudo passa por getSharePlatform().
16.5 Efeitos
AC-G28 Cada efeito da tabela 11.1 acontece na situação e com a duração indicadas (tolerância de ±100 ms).
AC-G29 Com o confete: aparece com pct ≥ 60% ou alguma medalha, e não aparece com pct < 60% sem medalhas.
AC-G30 Com prefers-reduced-motion: reduce, não há tremor, confete nem animações em loop.
17. Fora do escopo e questões em aberto
Fora do escopo
Login, contas, perfis, ranking, placar entre amigos.
Qualquer persistência: recorde, histórico entre sessões, dias seguidos, conquistas permanentes, "ossos que mais erra" entre partidas.
Tela "Meu progresso" (descartada: dependia de salvar dados).
Envio direto de imagem para redes sociais por API.
Sons e música.
Implementação da camada Electron (só a interface e a versão de navegador entram agora).
Multiplicadores ou bônus de pontos.
Questões em aberto
#
Questão
Proposta atual
Quem decide
17.1
Qual link oficial vai no card e no texto?
Omitir até existir
Equipe
17.2
Haverá tela para escolher a imagem antes de jogar?
Não nesta versão; sorteio + "Outra imagem"
Equipe
17.3
Um ponto pode ter mais de uma vista do mesmo tipo?
Sim; o botão alterna entre elas
Equipe
17.4
"vs. partida anterior" compara com qualquer imagem ou só com a mesma?
Qualquer imagem
Equipe
17.5
Nomes dos níveis em espanhol soam naturais no Chile?
Validar com os estudantes da UST
Especialistas de domínio
17.6
Ainda não existem imagens de gato nem fotos de ossos isolados no projeto
Reportar como bloqueio de conteúdo, sem placeholders (v2.0, 21)
Equipe
17.7
Quais imagens extras correspondem a quais pontos (coordenadas via /annotate)?
Cadastrar junto com as fotos
Equipe

18. Imagens de referência
As imagens abaixo são a referência visual oficial. Em caso de conflito entre imagem e texto, vale o texto deste documento. Anexe cada imagem logo abaixo do seu título.
18.1 Card — Story 9:16

18.2 Card — Quadrado 1:1

18.3 Tela de jogo — quiz por imagem (vista geral, outro ângulo, osso isolado)

18.4 Tela de resultado + compartilhar

18.5 Efeitos visuais
Observação: nos mockups, os números (85 pontos, "+15", 21 set 2026, 18:42) são exemplos. A tela "Meu progresso" que aparece no canvas foi descartada e não deve ser implementada.
19. Prompt pronto para implementação
Copie o bloco abaixo para o agente de código (ex.: Claude Code), junto com este documento exportado, a Especificação 2.0 e as imagens da seção 18.
Você vai implementar a gamificação do Zootomia no repositório existente
(https://github.com/elc1074/zootomia — Next.js + React + TypeScript).

DOCUMENTOS (leia inteiros antes de escrever código)
1. "Zootomia — Software Specification v2.0" (base).
2. "Zootomia — Especificação da Gamificação v1.0" (este documento). Onde divergir
   da v2.0, vale a Gamificação (seção 2 lista as mudanças).
3. Imagens de referência (seção 18). Texto vence imagem em caso de conflito.

REGRAS INEGOCIÁVEIS
- Continue o projeto existente. Não recrie o app, não troque a arquitetura.
- Nada de persistência: proibido localStorage, sessionStorage, IndexedDB,
  cookies ou arquivos (exceto o PNG que o usuário baixa). A sessão vive só em
  memória (SessionContext).
- Pontuação 10 / 5 / 0 não muda. Sequência e medalhas são só visuais.
- Dependência nova permitida: apenas html-to-image. Nada de libs de animação,
  confete ou UI.
- Sequência usa sempre laranja #D9772E com foguinho, nunca dourado.
- Todo texto novo em PT e ES via src/data/locales.ts e LanguageContext.
- Nenhum componente importa APIs do Electron; use getSharePlatform().
- Fontes Baloo 2 e Nunito empacotadas localmente (offline); remova o @import
  do Google Fonts.
- Não implemente a tela "Meu progresso" nem nada da seção 17 "Fora do escopo".
- Não invente comportamento. Se algo não estiver especificado, pare e liste
  como questão em aberto.

ORDEM DE TRABALHO (um commit por etapa)
1. Leia src/app/game/page.tsx, src/data/anatomy.ts, src/data/locales.ts,
   src/app/layout.tsx, src/app/page.tsx e src/app/gallery/page.tsx. Resuma o
   que existe e o que muda, antes de editar.
2. Tokens (src/styles/tokens.ts) e fontes locais (public/fonts).
3. Tipos e cadastro (seção 14.1), mantendo os dados atuais funcionando.
4. Funções puras em src/game/ (seção 14.3) com testes unitários cobrindo
   AC-G6, AC-G7, AC-G10, AC-G11 e AC-G12, com rng injetável.
5. SessionContext no layout (seção 6).
6. Tela de jogo (seções 3 e 7): pontos numerados, vistas, faixa, HUD,
   feedback e tempos.
7. Tela de resultado (seção 8), sem o card ainda.
8. Cards Story e Quadrado (seção 9) + pré-visualização.
9. Camada de plataforma e compartilhamento (seção 10).
10. Efeitos (seção 11), incluindo prefers-reduced-motion.
11. Textos PT/ES (seção 13).
12. Galeria: aceitar /gallery?img=<id> abrindo o visualizador naquela imagem.

VALIDAÇÃO FINAL
- Passe por todos os critérios AC-G1 a AC-G30 e pelos AC da v2.0 que
  continuam valendo. Para cada um, diga: passou / falhou / não verificável
  e como verificou.
- Rode lint, typecheck e testes sem erros.
- Confirme no DevTools que nada foi gravado em storage.
- Baixe um PNG de cada formato e confira 1080×1920 e 1080×1080.

RELATÓRIO DE ENTREGA
- Lista de arquivos criados/alterados.
- Decisões tomadas e onde a especificação as sustenta.
- Bloqueios de conteúdo (ex.: faltam imagens de gato e de ossos isolados).
- Questões em aberto encontradas.
