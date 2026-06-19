// Contexto histórico local — 32 livros + capítulos especiais
// Estrutura: CONTEXTO_LOCAL[slug] = { historico, geografico, cultural, texto }
// Capítulos especiais: CONTEXTO_LOCAL[slug].caps[N] = { historico, geografico, cultural, texto }

const CONTEXTO_LOCAL = {

  // ══ ANTIGO TESTAMENTO ════════════════════════════════════════════════════

  genesis: {
    historico: 'Escrito por volta de 1400 a.C., o Gênesis cobre desde a criação do mundo até a descida de Israel ao Egito. O Oriente Médio antigo era dominado por civilizações como a suméria e a acádia, que possuíam seus próprios mitos de criação — o Gênesis responde a essas narrativas com uma visão monoteísta radical.',
    geografico: 'A narrativa percorre a Mesopotâmia (região do Éden e da torre de Babel, atual Iraque), passando por Canaã (atual Israel/Palestina), o Egito e o deserto do Sinai. A terra prometida a Abraão fica entre o rio Nilo e o Eufrates.',
    cultural: 'O sistema de aliança (berit) era a base das relações sociais e políticas no antigo Oriente. A primogenitura, os casamentos arranjados, a poligamia e o sistema patriarcal refletem costumes da Idade do Bronze. O nome era identidade — mudanças de nome (Abrão→Abraão, Jacó→Israel) marcavam transformações espirituais profundas.',
    texto: 'Moisés é o autor tradicional do Pentateuco. Gênesis foi escrito para responder às perguntas fundamentais: de onde viemos, por que existe o mal, e qual é o propósito da humanidade. É teologia narrativa — ensina através de histórias, não de proposições abstractas.',
    caps: {
      1: { historico: 'O relato da criação contrasta diretamente com o Enuma Elish babilônico (séc. XVIII a.C.), onde os deuses criam o mundo por conflito. No Gênesis, Deus cria pela palavra, com ordem e propósito, e declara tudo "muito bom".', geografico: 'A criação é descrita de forma universal — céus, terra, mares — sem localização específica, afirmando soberania sobre toda a realidade.', cultural: 'O ritmo de seis dias mais um de descanso fundamenta a semana de sete dias usada em todo o Oriente Próximo. O ser humano criado à "imagem de Deus" (tzelem Elohim) é um conceito revolucionário — no Egito, só o faraó era imagem dos deuses.', texto: 'Gênesis 1 é um poema teológico em forma de hino litúrgico. Cada dia tem a mesma estrutura: "E disse Deus... e foi assim... e viu Deus que era bom... e foi a tarde e a manhã". Não é ciência, é teologia cantada.' },
      3: { historico: 'A queda no jardim do Éden explica a origem do sofrimento humano — tema central em todas as culturas antigas. As serpentes eram símbolo de sabedoria e engano em toda a Mesopotâmia.', geografico: 'O jardim do Éden é descrito com quatro rios, dois dos quais são o Tigre e o Eufrates, localizando-o na região da atual Mesopotâmia (Iraque).', cultural: 'A nudez no mundo antigo era associada à vulnerabilidade e vergonha social. Vestir-se era civilizar-se. A maldição do trabalho árduo e da dor no parto reflete a dura realidade agrícola e familiar da época.', texto: 'Este capítulo introduz o conceito de pecado original e a promessa do redentor (o "proto-evangelho" em v.15: inimizade entre a serpente e a descendência da mulher). É o capítulo mais teologicamente denso do AT.' },
      12: { historico: 'A chamada de Abrão ocorre em Ur dos Caldeus (atual sul do Iraque), uma das cidades mais sofisticadas do mundo antigo, por volta de 2100 a.C. Abrão deixa uma metrópole para seguir a voz de um Deus desconhecido.', geografico: 'Rota de Ur → Harã → Canaã → Egito. Esta era a rota comercial das caravanas da época, chamada "crescente fértil". Canaã era uma região estratégica entre o Egito e a Mesopotâmia.', cultural: 'A bênção de Abraão ("serás pai de muitas nações") inverte a lógica da época: Abrão não tem filhos e tem 75 anos. No mundo antigo, a falta de descendentes era maldição dos deuses. Deus escolhe o improvável.', texto: 'Génesis 12 marca o início da história da redenção — Deus escolhe um homem para abençoar todas as nações. Esta eleição não é exclusividade, é instrumento. A fé de Abraão é modelo para Paulo em Romanos 4 e Gálatas 3.' }
    }
  },

  psalms: {
    historico: 'Os Salmos foram compostos ao longo de cerca de 1000 anos, do tempo de Moisés (Salmo 90) até o período pós-exílico (Salmo 137). Davi é o autor de pelo menos 73 salmos. O livro foi compilado em sua forma final por volta de 400 a.C., após o retorno do exílio babilônico.',
    geografico: 'Muitos salmos têm Jerusalém e o Monte Sião como centro geográfico e espiritual. Os salmos de peregrinação (120–134) eram cantados pelos judeus subindo a Jerusalém para as festas anuais.',
    cultural: 'Os salmos eram o hinário do Templo de Jerusalém — música sacra com instrumentos como harpas, liras, flautas e percussão. Eram cantados em cultos públicos, lamentos privados, coroações de reis e festas religiosas. A poesia hebraica usa paralelismo em vez de rima.',
    texto: 'O livro é dividido em 5 partes (como os 5 livros de Moisés). Contém todos os gêneros: louvor, lamento, ação de graças, sabedoria, realeza. Salmos é o livro mais citado no NT — Jesus citou os Salmos mais que qualquer outro livro.',
    caps: {
      1: { historico: 'O Salmo 1 funciona como portal de entrada para todo o livro. Foi colocado no início intencionalmente na compilação final (séc. V a.C.) para enquadrar toda a coleção como meditação na Lei de Deus.', geografico: 'A imagem da "árvore plantada junto a ribeiros de águas" era especialmente poderosa em Israel, onde rios permanentes eram raros e preciosos. Uma árvore com água era símbolo máximo de vida e prosperidade.', cultural: 'Os dois caminhos (do justo e do ímpio) é um dos padrões literários mais antigos da sabedoria oriental. Contrasta com a literatura egípcia de sabedoria, mas com fundamento na aliança com YHWH.', texto: 'Sem título e sem autor atribuído — foi colocado como introdução por escribas. A palavra "bem-aventurado" (ashré) não é religiosa, é um grito de admiração: "Como feliz é!" É sabedoria prática, não piedade abstrata.' },
      23: { historico: 'Davi era literalmente pastor de ovelhas antes de ser rei. Este salmo de confiança foi escrito no contexto das angústias reais da vida — perseguição, guerras, traições.', geografico: '"Vale da sombra da morte" (gê tsalmávet) era provavelmente um desfiladeiro específico perto de Belém, conhecido por ser perigoso e escuro. Era um lugar real, não apenas metáfora.', cultural: 'O pastor no mundo antigo tinha responsabilidade total sobre o rebanho — guarda, alimento, água, cura de ferimentos. Era uma profissão honrada e exigente. Ungir a cabeça com óleo era cuidado veterinário e hospitalidade real.', texto: 'O mais memorizado dos salmos. Muda de metáfora no meio: nos versículos 1-4 Deus é pastor e nós somos ovelhas; nos versículos 5-6 Deus é anfitrião e nós somos hóspedes honrados. Os dois lados da provisão divina.' },
      51: { historico: 'O título indica que foi escrito após a confrontação do profeta Natã com Davi sobre o pecado com Bate-Seba e o assassinato de Urias (2 Samuel 11-12), por volta de 990 a.C.', geografico: 'O contexto é Jerusalém, capital do reino de Davi. O pecado de Davi envolveu abuso de poder real — ele usou posição de rei para tomar a mulher de um soldado que estava na guerra.', cultural: 'No mundo antigo, reis raramente pediam perdão publicamente. A confissão de Davi foi revolucionária — demonstra que nem o rei estava acima da lei de Deus. "Hissopo" (v.7) era um arbusto usado para aspersão ritual de purificação.', texto: 'O grande salmo penitencial. Estrutura em três partes: confissão do pecado (1-6), pedido de purificação (7-12), promessa de testemunho (13-17). O versículo 17 é teológico central: Deus não quer sacrifícios rituais, quer coração quebrantado.' },
      119: { historico: 'O maior capítulo da Bíblia (176 versículos) é um acróstico hebraico — cada seção de 8 versículos começa com uma letra do alfabeto hebraico, em ordem. Foi composto provavelmente no período pós-exílico.', geografico: 'Provavelmente escrito por alguém em sofrimento ou exílio — há muitas referências a perseguição e a ser estrangeiro. A Torah era a âncora de identidade para judeus fora da terra.', cultural: 'O poema celebra a Lei (Torah) não como fardo, mas como delícia, luz e vida. Esta visão contrasta com a percepção moderna de lei como coerção. No mundo hebraico, a Torah era instrução de um Pai amoroso.', texto: 'Usa 8 sinônimos diferentes para a palavra de Deus: lei, testemunho, mandamento, preceito, estatuto, palavra, promessa, juízo. Cada um tem nuance diferente. É meditação poética, não manual legal.' }
    }
  },

  proverbs: {
    historico: 'Provérbios foi compilado principalmente no tempo de Salomão (970-930 a.C.), mas inclui coleções anteriores. Israel estava no apogeu de sua influência cultural, com contatos com o Egito (Instrução de Amenemope, séc. XII a.C.) e a sabedoria do Oriente.',
    geografico: 'Salomão conduziu missões diplomáticas e comerciais com o Egito, Fenícia (Tiro) e Saba (atual Etiópia/Iêmen). Isso explica influências de sabedoria egípcia e árabe no livro.',
    cultural: 'A sabedoria (chokmah) no mundo antigo era habilidade prática para viver bem — tanto artesanal quanto ética. O "homem sábio" não era um filósofo abstrato, mas alguém que sabia como as coisas funcionavam na família, no comércio, na corte real.',
    texto: 'Provérbios é o livro de sabedoria prática por excelência. Os capítulos 1-9 são discursos do pai ao filho; 10-22 são provérbios breves de Salomão; 30-31 incluem autores não israelitas (Agur, Lemuel). A "mulher virtuosa" (Prv 31) é um acróstico hebraico.',
    caps: {
      1: { historico: 'O prólogo (1:1-7) estabelece o propósito do livro no contexto da corte real de Salomão. A educação era privilégio de filhos de nobres e funcionários reais.', geografico: 'O Templo de Salomão e o palácio real eram centros de educação e cultura em Jerusalém. Escribas eram formados ali para servir na administração do reino.', cultural: 'A frase "o temor do Senhor é o princípio da sabedoria" contrasta com a sabedoria egípcia, que começava com o conceito de Ma\'at (ordem cósmica). Para Israel, todo conhecimento começa no relacionamento com o Deus pessoal.', texto: 'O versículo 7 é a chave teológica de todo o livro. "Temor" (yirah) não é medo servil, mas reverência que reconhece quem Deus é. Sem isso, toda sabedoria é apenas esperteza humana.' }
    }
  },

  isaiah: {
    historico: 'Isaías profetizou entre 740-681 a.C., durante os reinados de Uzias, Jotão, Acaz e Ezequias. Foi o período da expansão assíria — Tiglate-Pileser III, Salmaneser V e Senaqueribe destruíram Israel do Norte (722 a.C.) e ameaçaram Jerusalém. O livro cobre 150 anos de história profética.',
    geografico: 'Isaías viveu em Jerusalém e tinha acesso à corte real. Seu ministério abrange Judá, Israel, e pronunciamentos sobre Assíria, Babilônia, Egito, Fenícia, Moabe — toda a geopolítica do antigo Oriente Médio.',
    cultural: 'O profeta era um papel social único em Israel — não eram adivinhos ou sacerdotes, mas porta-vozes de Deus que desafiavam reis e sacerdotes. Isaías tinha educação de elite, linguagem poética sofisticada e acesso ao rei.',
    texto: 'O livro tem duas grandes seções: capítulos 1-39 (julgamento e esperança no tempo assírio) e 40-66 (consolação e restauração babilônica). Isaías é chamado de "o evangelista do AT" pela riqueza das profecias messiânicas. Jesus leu Isaías 61 na sinagoga de Nazaré (Lucas 4).',
    caps: {
      53: { historico: 'Escrito por volta de 700 a.C., este capítulo descreve o "Servo Sofredor" com detalhes que os primeiros cristãos aplicaram integralmente a Jesus. Os judeus debateram se se referia à nação de Israel ou a um indivíduo.', geografico: 'O contexto imediato é o exílio babilônico — o povo humilhado, disperso, sem terra. A visão do servo sofredor que carrega a culpa dos outros invertia toda lógica política da época.', cultural: 'No mundo antigo, o sofrimento era sinal de maldição divina. A ideia de que o inocente sofre pelos culpados e que isso tem propósito redentor era radicalmente nova. Filipenses 2:5-11 é baseado diretamente neste capítulo.', texto: 'O Servo Sofredor: desprezado, ferido por nossas transgressões, carregando nossas dores. Citado mais de 20 vezes no NT. O eunuco etíope estava lendo este capítulo quando Filipe o encontrou (Atos 8:32-33). A passagem central da Semana Santa cristã.' }
    }
  },

  daniel: {
    historico: 'Daniel foi levado para Babilônia em 605 a.C. na primeira deportação de Nabucodonosor. O livro cobre do reinado de Nabucodonosor até Ciro, o Grande (539 a.C.) — o colapso da Babilônia e o surgimento do Império Persa. Daniel viveu aproximadamente 90 anos.',
    geografico: 'Babilônia (atual Iraque) era a maior cidade do mundo antigo, com muros duplos, o Jardim Suspenso (uma das 7 maravilhas) e o Zigurate de Marduk. O palácio real onde Daniel servia era uma das estruturas mais impressionantes da antiguidade.',
    cultural: 'A educação babilônica de três anos que Daniel recebeu incluía astronomia, matemática, línguas, literatura e adivinhação. A dieta kasher de Daniel não era puramente religiosa — também era resistência cultural. Manter a identidade israelita em Babilônia era ato político.',
    texto: 'Daniel tem duas partes: histórias (1-6) e visões apocalípticas (7-12). A parte apocalíptica, escrita em aramaico, influenciou profundamente o livro do Apocalipse. "Filho do Homem" em Daniel 7:13 é o título que Jesus mais usou para si mesmo.',
    caps: {
      3: { historico: 'A estátua de ouro de 27 metros que Nabucodonosor ergueu refletia prática real: reis babilônios exigiam lealdade religiosa-política. A fornalha ardente era método real de execução — confirmado por textos cuneiformes.', geografico: 'A planície de Dura, onde a estátua foi erguida, era provavelmente a área plana ao sul de Babilônia, visível de longe, perfeita para cerimônias públicas de massa.', cultural: 'A lista de instrumentos musicais — flauta, harpa, saltério, zamponha — revela a riqueza orquestral da corte babilônica. A música era usada para induzir estados de adoração em massa, prática conhecida em todo o Oriente Médio.', texto: 'O capítulo da fé radical. A resposta dos três jovens (v.17-18): "Nosso Deus pode nos livrar — mas mesmo que não livrar, não adoraremos tua estátua." O "mesmo que não" é considerado um dos textos de fé mais corajosos da Bíblia.' },
      6: { historico: 'O decreto de Dario proibindo oração foi uma armadilha política elaborada pelos adversários de Daniel, que sabiam de seu hábito de orar três vezes ao dia — prática judaica documentada no Saltério.', geografico: 'A cova dos leões era uma estrutura real no palácio persa — leões eram mantidos como símbolo do poder real. Escavações em Persépolis confirmam essa prática.', cultural: 'Daniel tinha aproximadamente 80 anos neste episódio. Sua recusa em parar de orar não era teimosia — era fidelidade pública. No mundo antigo, orar em direção a Jerusalém era prática visível e politicamente significativa.', texto: 'O paralelo com a ressurreição é intencional: Daniel desce à cova (tumba), pedra é colocada sobre a entrada, Daniel sai vivo ao amanhecer. Mateus 12:40 usa Jonas como sinal; Daniel 6 é o arquétipo visual.' }
    }
  },

  // ══ NOVO TESTAMENTO ══════════════════════════════════════════════════════

  matthew: {
    historico: 'Escrito entre 80-90 d.C., provavelmente em Antioquia da Síria. A comunidade cristã estava em conflito com o judaísmo rabínico que se reorganizava após a destruição do Templo em 70 d.C. Mateus escreve para uma comunidade predominantemente judaica que precisava entender Jesus como cumprimento das Escrituras.',
    geografico: 'A narrativa percorre Belém, Egito, Nazaré, o rio Jordão, o deserto da Judeia, o Mar da Galileia, Jerusalém e o Monte das Oliveiras. A geografia é teológica — cada lugar evoca a história de Israel.',
    cultural: 'Mateus era cobrador de impostos (publicano) — odiado pelos judeus por colaborar com Roma. Ser chamado por Jesus era escândalo duplo: Jesus aceitava traidores e transformava colaboradores em apóstolos.',
    texto: 'Mateus estrutura o evangelho em 5 discursos (como os 5 livros de Moisés): Sermão do Monte, Missão dos Doze, Parábolas, Comunidade, Discurso Escatológico. Jesus é o novo Moisés, a nova Torah encarnada. A genealogia abre com Abraão — Mateus escreve para judeus.',
    caps: {
      5: { historico: 'O Sermão do Monte (cap. 5-7) é o maior discurso ético da história. Foi pregado provavelmente em 28-29 d.C., no início do ministério galileu de Jesus.', geografico: 'A "montanha" evoca o Sinai onde Moisés recebeu a Lei. Jesus sobe o monte, se senta (postura de autoridade rabínica) e ensina — posicionando-se como o novo legislador.', cultural: 'As Bem-Aventuranças (v.3-12) invertem completamente os valores do mundo greco-romano e até do judaísmo popular. "Bem-aventurados os mansos" em uma cultura que admirava heróis guerreiros era provocação radical.', texto: 'Jesus diz "Ouvistes que foi dito... mas eu vos digo" seis vezes. Não cancela a Lei — a radicaliza. Não é contra Moisés, é a interpretação definitiva de Moisés pelo próprio Legislador.' },
      28: { historico: 'A ressurreição ocorreu no domingo após a Páscoa de 30 d.C. (ou 33 d.C.). O testemunho de mulheres era sem valor legal no mundo romano e judaico — torná-las as primeiras testemunhas é historicamente improvável para uma ficção.', geografico: 'O sepulcro de Jesus ficava no "jardim" (Jo 19:41) próximo ao Gólgota, fora dos muros de Jerusalém. A Igreja do Santo Sepulcro marca o local desde o século IV.', cultural: 'A Grande Comissão ("ide e fazei discípulos de todas as nações") subvertia o particularismo judaico. A missão agora cruza fronteiras étnicas, linguísticas e culturais — começa a era da missão universal.', texto: 'O final de Mateus é a chave que abre todo o livro. A promessa "estarei convosco todos os dias" encerra o evangelho do "Emanuel" (Deus conosco). A missão não termina — continua.' }
    }
  },

  mark: {
    historico: 'O evangelho mais antigo, escrito entre 65-70 d.C., provavelmente em Roma, pouco após o martírio de Pedro. O contexto histórico é a perseguição de Nero (64 d.C.) e a revolta judaica contra Roma (66-70 d.C.).',
    geografico: 'Marcos é o evangelho da ação — Jesus está sempre em movimento. Galileia, Decápolis, Tiro, Cesareia de Filipe, Jericó, Jerusalém. A palavra "imediatamente" aparece 40 vezes.',
    cultural: 'Marcos escreve para cristãos em Roma sob perseguição. Jesus como Servo Sofredor ressoa com pessoas que pagam preço alto pela fé. Marcos explica costumes judaicos para leitores gentios (7:3-4).',
    texto: 'Pedro é a fonte principal de Marcos (segundo Papias, bispo do século II). Por isso Marcos é brutalmente honesto sobre as falhas dos discípulos — Pedro incluído. O segredo messiânico (Jesus pedindo silêncio) é tema central. O evangelho termina abruptamente em 16:8.',
    caps: {
      1: { historico: 'João Batista emerge do deserto (um movimento ascético que o Qumrã também representava). O batismo de Jesus no Jordão é datado em torno de 28-29 d.C., no 15º ano de Tibério César (Lucas 3:1).', geografico: 'O rio Jordão, especialmente na região de Betânia além do Jordão, era o local do batismo de João. O deserto da Judeia estava a poucos quilômetros — 40 dias de jejum ali era sobrevivência radical.', cultural: 'O Espírito descendo "como pomba" ecoa Gênesis 1:2 (o Espírito pairando sobre as águas). Para judeus, era sinal de nova criação. A voz do céu usa linguagem do Salmo 2 (coroação real) e Isaías 42 (servo sofredor) — fundindo as duas identidades.', texto: 'Marcos não tem genealogia nem narrativa do nascimento. Começa com fogo: "Princípio do evangelho de Jesus Cristo, Filho de Deus." A urgência é imediata. O reino de Deus não é doutrina — é invasão.' }
    }
  },

  luke: {
    historico: 'Lucas era médico gentio, companheiro de Paulo. Escreveu seu evangelho entre 80-90 d.C., baseado em fontes escritas e entrevistas com testemunhas oculares (incluindo provavelmente Maria — Lucas 1:1-4). É o mais longo dos evangelhos.',
    geografico: 'Lucas começa e termina em Jerusalém. A narrativa central (9:51-19:44) é a "viagem a Jerusalém" — Jesus caminhando deliberadamente para sua morte. O evangelho é geográfico e histórico com precisão notável.',
    cultural: 'Lucas é o evangelho dos marginalizados: mulheres, samaritanos, pobres, publicanos, pecadores. Maria Madalena, Marta e Maria, as filhas de Jairo — Lucas nomeia mulheres que outros evangelhos ignoram. O Espírito Santo aparece mais em Lucas que em qualquer outro evangelho.',
    texto: 'Lucas-Atos é uma obra em dois volumes dedicada a "Teófilo" (provavelmente um patrono romano de alto status). Lucas usa vocabulário médico refinado e estrutura literária helenística. As parábolas mais famosas estão só em Lucas: Bom Samaritano, Filho Pródigo, Rico e Lázaro.',
    caps: {
      15: { historico: 'As três parábolas da perda (ovelha, moeda, filho) são dadas em resposta às críticas dos fariseus de que Jesus come com pecadores (v.1-2). O contexto é conflito religioso sobre quem pode estar na presença de Deus.', geografico: 'A "região longínqua" do filho pródigo era provavelmente uma terra gentílica — criar porcos era atividade impura para judeus. O filho estava perdido geográfica, étnica e espiritualmente.', cultural: 'No mundo do primeiro século, um filho que pede a herança em vida estava dizendo ao pai "eu te quero morto". O pai que corre para encontrar o filho de longe seria escandalizante — homens de honra não corriam na cultura mediterrânea.', texto: 'A parábola do Filho Pródigo é considerada a mais bela história já contada. Tem três personagens: o filho pródigo (pecador que volta), o pai (Deus que corre), o filho mais velho (fariseu que não perdoa). Jesus conta a parábola para os fariseus — eles são o filho mais velho.' }
    }
  },

  john: {
    historico: 'Escrito entre 90-100 d.C. por João, o apóstolo mais jovem, que viveu até o final do século I. É o mais tardio e teológico dos evangelhos. Foi escrito em Éfeso, possivelmente para responder ao gnosticismo emergente que negava a encarnação real de Cristo.',
    geografico: 'João é muito específico geograficamente: Betânia além do Jordão, Caná da Galileia, poço de Jacó em Sicar, piscina de Betesda com cinco pórticos (confirmada por arqueologia), piscina de Siloé. Esta precisão arqueológica suporta autoria testemunhal.',
    cultural: 'O prólogo ("No princípio era o Verbo") usa logos — termo central tanto na filosofia grega (Heráclito, Estoicos) quanto na tradição judaica (Sabedoria de Deus). João fala grego filosófico com teologia hebraica.',
    texto: 'João é estruturado em dois livros: "Livro dos Sinais" (1-12, sete milagres) e "Livro da Glória" (13-21, paixão e ressurreição). Os "Eu Sou" de Jesus (pão da vida, luz do mundo, porta, pastor, ressurreição, caminho, videira) ecoam o "EU SOU" do Êxodo. João omite a Ceia e o Getsêmani, mas tem o discurso do aposento alto (13-17) que os sinóticos não têm.',
    caps: {
      1: { historico: 'O prólogo de João é considerado o pico teológico do NT. "No princípio" (en archê) ecoa diretamente Gênesis 1:1. João escrito 60 anos após a morte de Jesus como meditação profunda sobre quem Jesus era.', geografico: 'João Batista pregava "em Betânia além do Jordão" (v.28) — localização específica na Transjordânia, distinta de Betânia perto de Jerusalém. A precisão geográfica é marca de testemunha ocular.', cultural: '"Verbo" (logos em grego) era para os gregos o princípio racional que organizava o universo. Para os judeus, a Palavra de Deus criava e sustentava a realidade. João usa os dois mundos para dizer: esse Princípio Universal se tornou humano.', texto: 'Os 18 primeiros versículos são um hino teológico que resume todo o evangelho. "E o Verbo se fez carne e habitou entre nós" (v.14) é a declaração mais ousada da história humana — Deus entrou na história com endereço específico.' },
      3: { historico: 'Nicodemos era fariseu e membro do Sinédrio (o conselho judeu de 71 membros). Vir a Jesus "de noite" sugere cautela política — ser visto como discípulo de Jesus era perigoso para sua posição.', geografico: 'O diálogo ocorre em Jerusalém durante a Páscoa (Jo 2:23). A conversa noturna no ambiente urbano contrasta com a mulher samaritana ao ar livre durante o dia no capítulo seguinte.', cultural: 'A expressão "nascer de novo" (ou "nascer do alto", o grego anothen tem os dois sentidos) era incompreensível para Nicodemos. No judaísmo, "nascer de novo" era usado para proselitismo gentio — Nicodemos, judeu, precisaria "renascer"?', texto: 'João 3:16 é talvez o versículo mais conhecido da Bíblia. O contexto é a serpente de bronze no deserto (Nm 21) — quem olhava vivia. Jesus usa essa imagem para sua crucificação: quem "olha" para ele em fé recebe vida eterna.' },
      11: { historico: 'A ressurreição de Lázaro (provavelmente 30 d.C.) é o ápice dos sete sinais de João. Ocorre em Betânia, a 3km de Jerusalém, e precipita diretamente a decisão do Sinédrio de matar Jesus (Jo 11:45-53).', geografico: 'Betânia (atual El-Azariyeh, cujo nome árabe vem de "Lázaro") fica no lado leste do Monte das Oliveiras. O túmulo de Lázaro é visitado até hoje, cavado na rocha calcária da região.', cultural: '"Lázaro" é a forma grega de Eleazar ("Deus ajudou"). O luto judaico durava 7 dias com visitantes consolando a família. A frase de Marta "já cheira mal, pois há quatro dias que está sepultado" indica certeza absoluta da morte — no mundo antigo, havia crença popular de que a alma rondava o corpo por três dias.', texto: '"Jesus chorou" (v.35) — o versículo mais curto da Bíblia em português e um dos mais teológicos. Deus encarnado chora. Não por ignorância (vai ressuscitar Lázaro), mas por compaixão genuína diante da dor humana. O sétimo sinal anuncia a própria ressurreição de Jesus.' }
    }
  },

  acts: {
    historico: 'Atos foi escrito por Lucas, continuando seu evangelho (30-62 d.C.). Cobre a expansão da igreja desde Jerusalém até Roma, seguindo o padrão de Atos 1:8 (Jerusalém → Judeia → Samaria → fins da terra). Paulo faz três viagens missionárias e é preso duas vezes.',
    geografico: 'A narrativa move-se de Jerusalém → Antioquia → Ásia Menor (atual Turquia) → Grécia → Roma. Esta era a rota das estradas romanas — o Império Romano era, ironicamente, a infraestrutura que permitiu a expansão do evangelho.',
    cultural: 'O Pentecostes (Atos 2) ocorreu em Jerusalém com judeus de toda a diáspora. A Pax Romana (paz romana) e a koinê grega (língua comum) criaram condições únicas para a missão. Cidadania romana de Paulo (Atos 22:25-28) era um escudo legal valioso.',
    texto: 'Atos é historia teológica, não apenas relato. O Espírito Santo aparece mais de 50 vezes. A missão se expande em círculos concêntricos a cada perseguição. Cada impedimento humano vira avanço divino. Paulo é convertido no capítulo 9 e domina os capítulos 13-28.',
    caps: {
      2: { historico: 'O Pentecostes ocorreu 50 dias após a Páscoa, quando Jerusalém estava cheia de judeus peregrinos de todo o Império Romano. Estavam presentes pessoas de pelo menos 15 regiões diferentes (v.9-11).', geografico: 'Jerusalém no período do Pentecostes podia ter 1-2 milhões de peregrinos além da população normal. O discurso de Pedro no templo era em local público — os pórticos do Templo eram como praças públicas.', cultural: 'Falar em línguas (glossolalia) era entendido pelos presentes como sinais dos "últimos dias" de Joel 2. O fogo, o vento e as línguas evocavam a teofania do Sinai — novo pacto, novo povo, novo Espírito.', texto: 'O discurso de Pedro (v.14-40) é o primeiro sermão cristão registrado. Estrutura: cumprimento das Escrituras (Joel 2), testemunho da ressurreição, apelo ao arrependimento. 3000 pessoas batizadas no mesmo dia — a igreja nasce não de programa, mas de poder.' }
    }
  },

  romans: {
    historico: 'Escrita por Paulo em Corinto, no inverno de 56-57 d.C., antes de sua viagem a Jerusalém com a oferta das igrejas gentias. A carta foi enviada para uma comunidade que Paulo não fundou, preparando sua visita e possível missão à Espanha.',
    geografico: 'Roma era a capital do Império, com 1 milhão de habitantes — a maior cidade do mundo ocidental. A comunidade cristã romana era mista (judeus e gentios) e provavelmente se reunia em casas particulares de diferentes bairros.',
    cultural: 'O contexto é pós-édito de Cláudio (49 d.C.), que expulsou judeus de Roma. Quando Nero permitiu o retorno, a comunidade cristã estava parcialmente gentilizada. Tensão entre cristãos judeus (que guardavam a Lei) e gentios era o problema prático por trás da teologia de Romanos.',
    texto: 'Romanos é a exposição mais sistemática do evangelho no NT. Estrutura: pecado universal (1-3), justificação pela fé (3-5), santificação (6-8), Israel (9-11), ética (12-15). Lutero chamou de "o evangelho mais puro" — foi o texto central da Reforma Protestante.',
    caps: {
      1: { historico: 'Paulo apresenta-se a uma igreja que não conhece pessoalmente. O v.16-17 ("não me envergonho do evangelho") pode aludir ao fato de que o evangelho era "loucura para os gregos" (1 Co 1:23) e escândalo político — o Messias crucificado.', geografico: 'Roma como destino missionário era ambição máxima — capital do mundo. Paulo menciona planos para a Espanha (Rm 15:24), o extremo ocidente do mundo conhecido.', cultural: 'A lista de pecados dos gentios (v.24-32) usa linguagem da filosofia estoica — Paulo dialoga com a ética greco-romana antes de superar ela. O argumento não é "vocês são piores" mas "todos sabem o que é certo e não fazem".', texto: 'Os versículos 16-17 são o "texto-chave" de Romanos — o evangelho é poder de Deus para salvação. "Justo viverá pela fé" (Habacuque 2:4) citado aqui foi o versículo que transformou Martinho Lutero.' },
      8: { historico: 'Romanos 8 foi escrito em Corinto, 56 d.C. Paulo tinha experiência direta de sofrimento (2 Co 11:23-28) — os versículos 18-39 sobre sofrimento e esperança não são teoria abstrata.', geografico: 'As "criaturas" que gemem esperando a redenção (v.19-22) refletem a visão de Paulo sobre toda a criação — universo, terra, animais — aguardando renovação. Cosmovisão muito além do individualismo moderno.', cultural: 'A adoção (huiothesia, v.15) era prática legal romana significativa — um adotado tinha todos os direitos do filho natural, incluindo herança. Paulo usa vocabulário legal romano para explicar a relação com Deus.', texto: 'O capítulo mais amado das cartas de Paulo. Começa com "nenhuma condenação" e termina com "nada nos separará". No meio: o Espírito, a adoção, os sofrimentos, a esperança, a intercessão, e a certeza absoluta do amor de Deus. Teologia transformadora.' }
    }
  },

  '1corinthians': {
    historico: 'Escrita por Paulo em Éfeso, por volta de 54-55 d.C. A comunidade de Corinto foi fundada por Paulo em sua segunda viagem missionária (51-52 d.C.) e era a mais problemática de todas as suas igrejas.',
    geografico: 'Corinto era a cidade mais rica da Grécia — porto estratégico entre o Mar Egeu e o Mar Adriático. O Istmo de Corinto evitava a perigosa rota ao redor do Peloponeso. Sede dos Jogos Ístmicos, segunda maior celebração atlética após as Olimpíadas.',
    cultural: 'A cultura coríntia era cosmopolita, hedonista e competitiva. "Corintizar" era sinônimo de imoralidade sexual no mundo antigo. A cidade tinha o templo de Afrodite com (segundo rumores) mil prostitutas sagradas. As divisões na igreja refletiam o espírito agonístico (competitivo) da cidade.',
    texto: 'Paulo responde a uma carta e a relatórios orais sobre problemas: divisões partidárias, imoralidade, processos judiciais entre cristãos, casamento e celibato, ídolos, dons espirituais, ressurreição dos mortos. O capítulo 13 (hino do amor) e o 15 (ressurreição) são os mais famosos.',
    caps: {
      13: { historico: 'O "hino ao amor" de 1 Coríntios 13 foi escrito no contexto de uma igreja dividida por competição de dons espirituais. Paulo não é abstrato — ele responde a um problema real de arrogância espiritual.', geografico: 'Paulo usa imagem dos jogos atléticos (9:24-27) e do banquete — contextos coríntios vivos. O amor descrito aqui contrasta diretamente com os comportamentos competitivos do espírito grego.', cultural: 'O agapê (amor) que Paulo descreve era diferente do eros (paixão) e philia (amizade) gregos. Agapê era quase um neologismo cristão — amor que escolhe o bem do outro independente de sentimento ou reciprocidade.', texto: 'Estrutura do capítulo: superioridade do amor (1-3), características do amor (4-7), permanência do amor (8-13). O versículo 13 ("agora permanecem a fé, a esperança e o amor, mas o maior destes é o amor") é um dos mais citados da Bíblia.' }
    }
  },

  '2corinthians': {
    historico: 'Escrita por Paulo em 56-57 d.C., após uma visita dolorosa a Corinto e uma carta severa (agora perdida). É a mais autobiográfica das cartas de Paulo — revela sua vulnerabilidade, sofrimentos e defesa de seu apostolado contra "superapóstolos".',
    geografico: 'A Macedônia, de onde Paulo escreve, era a região norte da Grécia atual. Tito, portador de boas notícias de Corinto, encontrou Paulo lá (2:13, 7:5-7). As igrejas da Macedônia são elogiadas pela generosidade apesar da pobreza (8:1-5).',
    cultural: 'A cultura greco-romana valorizava a retórica poderosa, a presença física impressionante e a autoelogio. Paulo era criticado por ser "fraco em pessoa e desprezível em palavra" (10:10). Sua "fraqueza" como estratégia apostólica era incompreensível para essa cultura.',
    texto: 'Os temas centrais são: reconciliação (1-7), oferta para Jerusalém (8-9), defesa do apostolado (10-13). O "espinho na carne" (12:7) é uma das maiores questões abertas do NT — nunca é identificado. A teologia da fraqueza ("quando sou fraco, então sou forte") é o coração da carta.'
  },

  galatians: {
    historico: 'A carta mais urgente de Paulo — escrita provavelmente em 48-49 d.C. (ou 54-55 d.C., dependendo da datação) em resposta a "judaizantes" que exigiam circuncisão dos gentios convertidos. É a "Magna Carta" da liberdade cristã.',
    geografico: 'As igrejas da Galácia estavam no interior da Ásia Menor (atual Turquia central). Eram comunidades jovens, fundadas na primeira viagem missionária de Paulo, vulneráveis a influências teológicas externas.',
    cultural: 'A circuncisão não era apenas ritual religioso — era marcador de identidade étnica, pertencimento à aliança e status social no judaísmo. Exigir circuncisão dos gentios era dizer: "você precisa se tornar judeu para ser cristão."',
    texto: 'Gálatas foi a faísca da Reforma Protestante — Lutero a comentou duas vezes. Conteúdo: defesa do evangelho (1-2), justificação pela fé versus obras da Lei (3-4), liberdade e fruto do Espírito (5-6). "Já não há judeu nem grego, escravo nem livre, homem nem mulher" (3:28) é a declaração de igualdade mais radical da antiguidade.'
  },

  ephesians: {
    historico: 'Escrita por Paulo (ou discípulo paulino) em Roma, por volta de 60-62 d.C. durante seu primeiro encarceramento. É uma carta circular — talvez a versão de Éfeso de uma carta enviada para várias igrejas da Ásia Menor.',
    geografico: 'Éfeso era a terceira maior cidade do Império Romano e capital da província da Ásia. O templo de Ártemis/Diana de Éfeso era uma das 7 Maravilhas do mundo antigo. Paulo passou 3 anos lá (Atos 19-20).',
    cultural: 'Éfeso era centro de magia, ocultismo e a adoração a Ártemis. A queima de livros mágicos em Atos 19:19 (50 mil denários de valor) mostra o tamanho da indústria esotérica. A carta de Efésios responde com a armor of God (6:10-17) — não coincidência.',
    texto: 'Efésios é dividida igualmente: teologia (1-3, o que Deus fez) e ética (4-6, como devemos viver). O centro é 2:8-9 ("pela graça sois salvos, mediante a fé"). A oração de Paulo em 1:15-23 e 3:14-21 são algumas das mais poderosas do NT.'
  },

  philippians: {
    historico: 'Escrita da prisão (Roma ou Éfeso), por volta de 60-62 d.C. Filipos era a primeira cidade europeia onde Paulo pregou (Atos 16:12) e a comunidade mais amada por ele — a única que lhe enviou suporte financeiro (4:15-16).',
    geografico: 'Filipos era colônia romana na Macedônia (Grécia do Norte), com status de cidade romana — seus cidadãos tinham direitos romanos plenos. O paralelo com "nossa cidadania está nos céus" (3:20) é intencional.',
    cultural: 'A colônia romana de Filipos era orgulhosa de sua cidadania romana — veteranos do exército de Augusto foram assentados ali. O hino cristológico (2:5-11) usa linguagem imperial para dizer: o verdadeiro Senhor é Jesus, não César.',
    texto: 'A carta da alegria — "alegrai-vos" aparece 16 vezes. O hino de Cristo (2:5-11) é o texto cristológico mais antigo e completo do NT. O "segredo do contentamento" (4:11-13) foi aprendido em prisão, fome e naufrágio — não é positvismo barato.'
  },

  colossians: {
    historico: 'Escrita por Paulo (ou discípulo) em Roma, 60-62 d.C. A heresia em Colossos combinava elementos judaicos (calendário, circuncisão), filosóficos gregos e práticas de anjos — um sincretismo espiritual similar ao gnosticismo nascente.',
    geografico: 'Colossos ficava no vale do rio Lico, na Frígia (atual Turquia). Havia sofrido terremoto devastador em 60-61 d.C. Paulo nunca visitou pessoalmente — a comunidade foi fundada por Epafras.',
    cultural: 'A adoração de anjos em Colossos refletia uma visão de Deus como distante e inacessível, que só pode ser abordado através de intermediários espirituais. Paulo responde com a supremacia absoluta de Cristo sobre toda hierarquia espiritual.',
    texto: 'O hino cristológico de 1:15-20 é o texto mais elevado sobre a identidade de Cristo no NT. "Primogênito de toda a criação" não significa o primeiro criado, mas o herdeiro supremo (uso hebraico de "primogênito"). "Nele foram criadas todas as coisas" — Cristo como agente da criação.'
  },

  '1thessalonians': {
    historico: 'Provavelmente a carta mais antiga de Paulo (50-51 d.C.) — possivelmente o documento cristão escrito mais antigo do NT. Paulo estava em Corinto quando a escreveu, enviada por Timóteo com boas notícias de Tessalônica.',
    geografico: 'Tessalônica era a capital da província da Macedônia (atual Thessaloniki, a segunda maior cidade da Grécia). Porto estratégico na Via Egnatia — a principal estrada romana que cruzava a Grécia.',
    cultural: 'A comunidade foi expulsa de Tessalônica por perseguição judaica (Atos 17:1-10). A preocupação sobre os mortos (4:13-18) era questão real — membros da comunidade tinham morrido e os vivos perguntavam se os mortos perderiam a ressurreição.',
    texto: 'A carta mais pessoal e calorosa de Paulo — a "pastoral" da família. Contém o texto mais antigo sobre a parusia (retorno de Cristo, 4:13-18) e a exortação "orai sem cessar" (5:17). A comunidade é modelo para outras igrejas (1:7-8).'
  },

  '2thessalonians': {
    historico: 'Escrita pouco após a primeira (51 d.C. ou 80-90 d.C. se pseudônima). Alguém estava ensinando que o "dia do Senhor" já tinha chegado, causando abandono do trabalho e agitação na comunidade.',
    geografico: 'Mesmo contexto de 1 Tessalônica. A proximidade geográfica com Filipos, Bereia e Corinto explica a influência de diferentes tradições teológicas circulando na região.',
    cultural: 'A máxima "quem não trabalha, não coma" (3:10) era provérbio comum no judaísmo e no mundo greco-romano. O trabalho era dignidade, não punição. O ócio em nome da expectativa escatológica era desorganização social e teológica.',
    texto: 'O "homem da iniquidade" (2:3-12) é uma das passagens proféticas mais debatidas do NT — interpretado como poder romano, papado, um anticristo futuro ou símbolo do mal organizado. O tema: não abandonar responsabilidades presentes por expectativa do futuro.'
  },

  '1timothy': {
    historico: 'Carta pastoral a Timóteo, jovem líder da comunidade de Éfeso, escrita por Paulo (ou discípulo paulino) por volta de 62-66 d.C. Timóteo era filho de mãe judia e pai grego, circuncidado por Paulo para a missão (Atos 16:1-3).',
    geografico: 'Éfeso era a maior metrópole da Ásia Menor, com complexidade sociocultural imensa. Liderar a igreja ali requeria sabedoria política e teológica sofisticada. A carta é manual prático de liderança eclesial.',
    cultural: 'As instruções sobre mulheres (2:9-15) e sobre bispos/diáconos (3:1-13) refletem contexto específico de uma comunidade em formação. Os critérios de liderança valorizam reputação pública — fundamental em cultura de honra/vergonha.',
    texto: 'Junto com 2 Timóteo e Tito, forma as "Cartas Pastorais" — focadas em organização e saudabilidade da comunidade cristã. Contêm os únicos textos do NT sobre requisitos de liderança eclesial. O versículo central: "Cristo Jesus veio ao mundo para salvar os pecadores" (1:15).'
  },

  '2timothy': {
    historico: 'A última carta de Paulo, escrita da prisão em Roma, cerca de 66-67 d.C., pouco antes de seu martírio. Paulo sabia que estava próximo da morte (4:6-8). Timóteo estava em Éfeso e Paulo pedia que fosse até Roma antes do inverno (4:21).',
    geografico: 'Paulo estava preso em Roma — segundo encarceramento, muito mais severo que o primeiro. Os colaboradores tinham partido ou abandonado (4:10-16). Só Lucas estava com ele.',
    cultural: 'A transmissão fiel do ensino (2:2 — "o que ouviste de mim... transmite a homens fiéis") era o mecanismo de preservação cultural no mundo antigo, antes da imprensa. Oral e relacional, não textual e institucional.',
    texto: 'A carta mais emocionante de Paulo. "Combati o bom combate, terminei a corrida, guardei a fé" (4:7) é autobiografia e testamento. O desafio a Timóteo de "pregar a palavra a tempo e fora de tempo" (4:2) e a afirmação de que toda Escritura é inspirada (3:16) são os pilares.'
  },

  titus: {
    historico: 'Carta a Tito, líder das igrejas em Creta, escrita por Paulo em 62-66 d.C. Cretenses tinham má reputação no mundo antigo — o próprio Paulo cita um poeta cretense: "Os cretenses são sempre mentirosos, animais ruins, ventres preguiçosos" (1:12).',
    geografico: 'Creta é a maior ilha grega, no Mediterrâneo, com cidades como Cnossos (centro da civilização minoana). Rota marítima estratégica entre o Mediterrâneo oriental e ocidental.',
    cultural: 'A instrução de Tito é contextual: a cultura cretense requeria liderança especialmente firme e prática. As instruções sobre diferentes grupos (idosos, jovens, escravos) refletem as categorias sociais reais da comunidade.',
    texto: 'A "fórmula" de Tito: boa teologia produz boa prática. A "graça de Deus" (2:11) é o fundamento; a vida santa é a consequência. O hino batismal de 3:4-7 é uma das declarações mais belas de redenção no NT.'
  },

  philemon: {
    historico: 'O bilhete mais pessoal de Paulo — intercede por Onésimo, escravo fugitivo de Filêmon (colosense rico). Escrito da prisão em Roma, 60-62 d.C. É o único texto do NT que aborda diretamente a escravidão com um caso real.',
    geografico: 'Filêmon morava em Colossos, na Frígia (Turquia). Onésimo viajou centenas de quilômetros até Roma, onde encontrou Paulo na prisão — coincidência que Paulo interpreta como providência divina.',
    cultural: 'No Império Romano, escravos fugitivos podiam ser executados ou marcados a ferro. Paulo não abole a escravidão diretamente, mas semeia princípios que a destroem: "não mais como escravo, mas como irmão amado" (v.16). A lógica do evangelho é subversiva de dentro.',
    texto: 'A carta mais curta de Paulo (25 versículos), mas teologicamente profunda. Paulo usa três apelos: autoridade apostólica (v.8-9), amor fraternal (v.9-10) e imputação (v.17-18 — "lança na minha conta"). Este último é metáfora da justificação: Deus lança nossos pecados na conta de Cristo.'
  },

  hebrews: {
    historico: 'Autor desconhecido — candidatos incluem Paulo, Apolo, Barnabé ou Priscila. Escrito antes de 70 d.C. (o Templo ainda existe) para judeus cristãos tentados a retornar ao judaísmo, possivelmente diante de perseguição.',
    geografico: 'Provavelmente endereçada a uma comunidade em Roma ou Palestina. O sistema de sacrifícios descrito em Hebreus era ainda ativo — o Templo de Herodes ainda estava em pé.',
    cultural: 'A tentação de "voltar atrás" era real — o judaísmo era religio licita (religião legal) no Império Romano; o cristianismo não. Ser cristão significava perda de status social e proteção legal. Hebreus responde: Cristo é superior a tudo que você está abandonando.',
    texto: 'Hebreus é o tratado teológico mais sofisticado do NT. Argumento central: Cristo é superior aos anjos, a Moisés, ao sacerdócio levítico, ao sistema de sacrifícios. O "salão da fé" (capítulo 11) e a corrida com perseverança (12:1-2) são os textos mais famosos.',
    caps: {
      11: { historico: 'O "Salão da Fé" lista heróis do AT — Abel, Enoque, Noé, Abraão, Sara, Isaac, Jacó, José, Moisés, Raabe, Gideão, Sansão, Davi, Samuel, os profetas. Todos "morreram na fé, sem ter recebido as promessas" (v.13).', geografico: 'As referências geográficas percorrem toda a história bíblica: jardim do Éden, dilúvio universal, Ur dos Caldeus, Canaã, Egito, deserto do Sinai, Jericó. A fé atravessa toda a história e toda a geografia.', cultural: 'O conceito de fé (pistis) em Hebreus 11:1 é filosófico-prático: "substância das coisas que se esperam, prova de coisas que não se veem." Não é sentimento — é convicção que reorganiza a vida presente baseada em realidades futuras.', texto: 'A lista não é panteão de perfeitos — inclui Raabe a prostituta, Sansão o impulsivo, Davi o adúltero. A fé não é qualidade moral, é orientação de vida. O ponto final: eles aguardavam algo que nós já recebemos (v.39-40). Nós somos o cumprimento deles.' }
    }
  },

  james: {
    historico: 'Escrita por Tiago, irmão de Jesus e líder da igreja de Jerusalém, entre 45-62 d.C. — possivelmente a carta mais antiga do NT. Tiago foi martirizado em 62 d.C. segundo Flávio Josefo.',
    geografico: 'Endereçada às "doze tribos da dispersão" — judeus cristãos espalhados fora da Palestina. A diáspora judaica estava presente em toda a bacia do Mediterrâneo.',
    cultural: 'Tiago usa linguagem da sabedoria judaica (Provérbios, Sirácide) mais do que teologia paulina. Seu foco é prático: como a fé se mostra no comportamento real — trato com pobres, controle da língua, oração, paciência.',
    texto: 'A carta que Lutero chamou de "epístola de palha" (por aparente tensão com Paulo sobre fé e obras) é na verdade complementar: Paulo diz que a fé salva sem obras prévias; Tiago diz que a fé genuína produz obras. A fé morta é teoria sem transformação.'
  },

  '1peter': {
    historico: 'Escrita por Pedro (ou discípulo petrina) em Roma ("Babilônia" em 5:13), por volta de 60-64 d.C., pouco antes ou durante a perseguição de Nero. Os cristãos estavam sendo marginalizados e sofrendo socialmente.',
    geografico: 'Endereçada a "estrangeiros dispersos" pelo Ponto, Galácia, Capadócia, Ásia e Bitínia — região da atual Turquia. Pedro, que ministrou principalmente em Jerusalém, alcança aqui a diáspora.',
    cultural: 'Os cristãos eram vistos como "estrangeiros" sociais — não participavam dos festivais cívicos (que tinham dimensão religiosa), dos banquetes (com comida sacrificada a ídolos), das práticas sexuais comuns. Isso os tornava suspeitos e marginais.',
    texto: 'A teologia do sofrimento é o tema central. Cristo sofreu como exemplo (2:21-25). O sofrimento não é castigo, é participação no padrão de Cristo. A esperança na herança imperecível (1:3-5) é a âncora. A "pedra viva" e o "sacerdócio real" (2:4-9) são imagens de identidade cristã.'
  },

  '2peter': {
    historico: 'Escrita por Pedro ou discípulo petrina, 64-68 d.C. (ou 80-90 d.C.). O contexto é combate a falsos mestres que negavam o retorno de Cristo ("onde está a promessa de sua vinda?", 3:4) e usavam essa negação para justificar imoralidade.',
    geografico: 'Sem destinatário específico — carta geral (católica) para toda a comunidade cristã dispersa.',
    cultural: 'Os falsos mestres usavam liberdade como desculpa para libertinagem (2:19) — padrão conhecido no mundo greco-romano onde algumas filosofias separavam a alma (importante) do corpo (irrelevante, logo qualquer comportamento físico era aceitável).',
    texto: 'O capítulo 1 contém a única referência epistolar à transfiguração (v.16-18). O capítulo 3 sobre o retorno de Cristo é a teologia mais clara do NT sobre o fim: "para o Senhor, um dia é como mil anos" (v.8). A carta termina referenciando Paulo como "amado irmão" — rara alusão entre apóstolos.'
  },

  '1john': {
    historico: 'Escrita por João em Éfeso, por volta de 90-100 d.C. Combate o proto-gnosticismo docetista que afirmava que Cristo não veio "em carne" real — o divino não poderia tocar o material impuro.',
    geografico: 'Éfeso, metrópole da Ásia Menor, era centro de misticismo, filosofia e religiosidade sincretista. O contexto cultural favorecia mistura de tradições — exatamente o que João combate.',
    cultural: 'O gnosticismo ensinava que o conhecimento secreto (gnosis), não a fé pública, salvava. A ética era ou irrelevante (o corpo não importa) ou extremamente ascética. João responde: conhecer a Deus se prova no amor fraternal, não em experiências místicas privadas.',
    texto: '"Deus é amor" (4:8,16) aparece só em 1 João em toda a Bíblia. O teste triplo da comunidade com Deus: crença correta (Jesus em carne), comportamento ético (guardar os mandamentos) e amor fraternal. O versículo mais memorizado: "se confessarmos nossos pecados, ele é fiel e justo para perdoar" (1:9).'
  },

  '2john': {
    historico: 'A carta mais curta do NT (13 versículos). Escrita por João, o "presbítero", para uma comunidade específica. O contexto é o mesmo de 1 João — combate ao docetismo que negava a encarnação real de Cristo.',
    geografico: 'Endereçada à "senhora eleita e seus filhos" — provavelmente metáfora para uma comunidade local específica, não uma pessoa individual.',
    cultural: 'A hospitalidade cristã era recurso missionário vital — os pregadores viajantes dependiam de casas para se hospedar. João adverte para não acolher falsos mestres, pois dar-lhes hospedagem era participar de sua obra.',
    texto: 'O versículo 10-11 ("se alguém vem... não o recebais em casa") chocou cristãos modernos, mas o contexto é claro: não oferecer plataforma institucional para quem nega a encarnação de Cristo. A "verdade" (alétheia) aparece 5 vezes em 13 versículos.'
  },

  '3john': {
    historico: 'Carta pessoal de João para Gaio, cristão hospitaleiro. É a única carta do NT sem conteúdo doutrinário explícito — é totalmente relacional. Escrita no mesmo contexto de 2 João, 90-100 d.C.',
    geografico: 'Sem localização específica. Diótrefes ("nutrir-se de Zeus") — nome grego — liderava uma comunidade onde excluía os missionários de João. Gaio e Demétrio eram figuras positivas na mesma região.',
    cultural: 'O conflito entre João e Diótrefes revela tensão real de autoridade nas igrejas do século I — um líder local rejeitando a autoridade apostólica. Não havia hierarquia institucional consolidada, apenas autoridade relacional e moral.',
    texto: 'A única carta do NT que não menciona Jesus explicitamente. Gaio é modelo de hospitalidade missionária. Diótrefes é advertência contra ambição de poder eclesiástico. O versículo 4 ("nenhuma alegria é maior que saber que meus filhos andam na verdade") é o coração de João como pastor idoso.'
  },

  jude: {
    historico: 'Escrita por Judas, irmão de Jesus, antes de 80 d.C. Provavelmente planejava escrever sobre salvação, mas mudou de rota diante de infiltração de falsos mestres na comunidade.',
    geografico: 'Sem destinatário específico — carta circular. A linguagem apocalíptica (referências a Enoque, Miguel e o diabo disputando o corpo de Moisés) sugere contexto de judaísmo apocalíptico.',
    cultural: 'Judas cita o livro de Enoque (v.14-15), texto apócrifo muito popular no judaísmo do primeiro século, encontrado em Qumrã. Isso era normal — Paulo também citou poetas gregos pagãos (Atos 17:28, 1 Co 15:33).',
    texto: 'A doxologia final (v.24-25) é uma das mais belas do NT: "Àquele que é poderoso para vos guardar sem tropeço e para vos apresentar imaculados diante da sua glória..." Judas é o antessala do Apocalipse — mesmo vocabulário e urgência.'
  },

  revelation: {
    historico: 'Escrito por João em Patmos, ilha grega no Egeu onde estava exilado, por volta de 95 d.C. sob o imperador Domiciano. O contexto é perseguição imperial — cristãos eram executados por recusar adorar a César como divino.',
    geografico: 'Patmos é uma pequena ilha rochosa (13 km²) no Mar Egeu, a 60 km da costa da Ásia Menor. As sete igrejas destinatárias (Éfeso, Esmirna, Pérgamo, Tiatira, Sardes, Filadélfia, Laodiceia) formam um circuito postal na Ásia Menor.',
    cultural: 'O Apocalipse usa linguagem cifrada do gênero apocalíptico judaico (Daniel, Ezequiel, Zacarais) que os cristãos do século I reconheceriam mas os romanos não entenderiam. "Babilônia" é código para Roma. 666 provavelmente alude a Nero em gematria (cálculo numérico de letras).',
    texto: 'O Apocalipse é adoração em meio à perseguição — não manual de previsão histórica. Estrutura: cartas às sete igrejas (1-3), visões celestes (4-5), sete selos/trombetas/taças (6-16), queda de Babilônia (17-18), retorno de Cristo e nova criação (19-22). A mensagem: Cristo vence; persevere.',
    caps: {
      1: { historico: 'A visão do Cristo glorificado (v.12-20) foi recebida "no dia do Senhor" (domingo) em Patmos, por volta de 95 d.C. João era o último apóstolo vivo — testemunha de Jesus transformada em profeta visionário.', geografico: 'Patmos, ilha de exílio, contrasta com a visão celestial. O exilado recebe a maior revelação. A ilha estava a um dia de navegação de Éfeso — João conhecia bem as comunidades destinatárias.', cultural: 'A figura do "filho do homem" (v.13) é intencionalmente de Daniel 7. Jesus aparece não como o rabbi galileu, mas como juiz cósmico. Os elementos — vestes longas, cinto dourado, cabelos brancos, olhos de fogo, voz de muitas águas — são linguagem teofânica do AT.', texto: '"Eu sou o Alfa e o Ômega" (v.8) — a primeira e última letra do alfabeto grego. Cristo engloba toda a história. O versículo 17-18 é o coração: "Não temas... estive morto, mas eis que estou vivo pelos séculos dos séculos." A toda perseguição, esta resposta.' },
      21: { historico: 'A visão da nova Jerusalém (21-22) é o clímax de toda a Bíblia. Escrito para cristãos sendo executados em Roma — a promessa de nova criação era sua esperança concreta, não escapismo.', geografico: 'A nova Jerusalém desce do céu (v.2) — a redenção não é fuga da terra, é renovação da terra. As dimensões (12.000 estádios = aprox. 2.200 km) são simbólicas de perfeição e plenitude, não arquitetura literal.', cultural: 'O cubo perfeito da cidade (v.16) ecoa o Santo dos Santos do Templo de Salomão — também um cubo. A cidade inteira é o Santo dos Santos: acesso total e imediato à presença de Deus. O Templo desaparece porque Deus mesmo é o templo (v.22).', texto: '"Ele enxugará dos seus olhos toda lágrima, e não haverá mais morte, nem pranto, nem lamento, nem dor" (v.4) — o versículo mais consolador da Bíblia. Não é fuga da realidade, é promessa de transformação. A Bíblia começa com jardim e termina com cidade-jardim.' }
    }
  }

};

// Função pública para buscar contexto
function buscarContextoLocal(slug, cap) {
  const livro = CONTEXTO_LOCAL[slug];
  if (!livro) return null;
  const base = {
    historico: livro.historico,
    geografico: livro.geografico,
    cultural: livro.cultural,
    texto: livro.texto
  };
  // Se tem contexto específico do capítulo, mescla/sobrepõe
  if (cap && livro.caps && livro.caps[cap]) {
    const capCtx = livro.caps[cap];
    return {
      historico: capCtx.historico || base.historico,
      geografico: capCtx.geografico || base.geografico,
      cultural: capCtx.cultural || base.cultural,
      texto: capCtx.texto || base.texto,
      temCapEspecifico: true
    };
  }
  return { ...base, temCapEspecifico: false };
}
