// ── Palavra do Dia — devocional diário (offline) ───────────────────────────
// Estrutura: { tema, versiculo, referencia, reflexao, oracao }
// Seleção determinística por dia do ano (ver devocionalDeHoje em app.js).
// Para "nunca repetir no ano", é só ir adicionando entradas até chegar a 366.
// A rotação usa: DEVOCIONAIS[diaDoAno % DEVOCIONAIS.length]

const DEVOCIONAIS = [
  {
    tema: 'Descanso',
    versiculo: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.',
    referencia: 'Mateus 11:28',
    reflexao: 'Tem dias em que a gente acorda já cansado — não do corpo, mas de carregar tudo sozinho. Jesus não diz "se esforça mais"; ele diz "vem". O convite é entregar o peso, não administrá-lo melhor. Hoje, antes de resolver qualquer coisa, comece reconhecendo que você não foi feito pra sustentar o mundo nas costas.',
    oracao: 'Senhor, eu venho como estou — cansado e cheio de pendências. Toma o que eu não dou conta e me ensina a descansar em ti.'
  },
  {
    tema: 'Graça',
    versiculo: 'Porque pela graça sois salvos, por meio da fé; e isso não vem de vós; é dom de Deus.',
    referencia: 'Efésios 2:8',
    reflexao: 'A maior tentação do coração religioso é achar que precisa pagar por aquilo que já foi dado de graça. Mas graça que se paga deixa de ser graça. Você não está sendo tolerado por Deus enquanto melhora — você já foi aceito antes de qualquer mérito. Viva hoje a partir dessa aceitação, não correndo atrás dela.',
    oracao: 'Pai, obrigado porque o teu amor por mim não depende do meu desempenho. Me ajuda a descansar na graça e a tratar os outros com ela.'
  },
  {
    tema: 'Ansiedade',
    versiculo: 'Não andeis ansiosos por coisa alguma; antes, em tudo, sejam os vossos pedidos conhecidos diante de Deus pela oração e pela súplica, com ações de graças.',
    referencia: 'Filipenses 4:6',
    reflexao: 'A ansiedade promete que, se você se preocupar o suficiente, ganha controle. É mentira — só rouba o presente sem mudar o futuro. Paulo não manda fingir que está tudo bem; manda transformar preocupação em oração. Cada pensamento que dá um nó no peito hoje pode virar uma frase dita a Deus.',
    oracao: 'Senhor, eu troco a minha preocupação por uma conversa contigo. Recebe os meus medos e me dá a tua paz no lugar.'
  },
  {
    tema: 'Identidade',
    versiculo: 'Vede que grande amor nos tem concedido o Pai, a ponto de sermos chamados filhos de Deus; e, de fato, somos filhos de Deus.',
    referencia: '1 João 3:1',
    reflexao: 'O mundo define você pelo que produz, pelo que tem, pelo que os outros acham. Deus define você por uma palavra: filho. Isso não é um título que você conquista no fim — é o ponto de partida de tudo. Quando essa verdade desce do pensamento pro coração, ela tira de você o peso de provar o próprio valor.',
    oracao: 'Pai, antes de qualquer coisa que eu faça hoje, me lembra de quem eu sou em ti: teu filho, amado e seguro.'
  },
  {
    tema: 'Confiança',
    versiculo: 'Confia no Senhor de todo o teu coração e não te apoies no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.',
    referencia: 'Provérbios 3:5-6',
    reflexao: 'Confiar é diferente de entender. Tem hora que Deus não explica o caminho, ele só pede o próximo passo. O texto não diz "ignore a razão"; diz "não se apoie só nela". Você pode usar a cabeça sem fazer dela o seu deus. Hoje, onde falta clareza, escolha dar o passo que dá pra dar e deixe o resto com quem enxerga o todo.',
    oracao: 'Senhor, naquilo que eu não entendo, eu escolho confiar. Conduz os meus passos mesmo quando eu não vejo o caminho inteiro.'
  },
  {
    tema: 'Perdão',
    versiculo: 'Sede uns para com os outros benignos, compassivos, perdoando-vos uns aos outros, como também Deus, em Cristo, vos perdoou.',
    referencia: 'Efésios 4:32',
    reflexao: 'Guardar mágoa é beber veneno esperando que o outro adoeça. O perdão não é dizer que o que te feriu não foi grave — é decidir que aquilo não vai mais te controlar. E ele nasce de um lugar concreto: você também já foi perdoado de muito. Hoje, pense em uma pessoa que você ainda segura no peito e dê o primeiro passo pra soltar.',
    oracao: 'Pai, do mesmo jeito que tu me perdoaste, me dá coragem e graça pra perdoar quem me feriu.'
  },
  {
    tema: 'Perseverança',
    versiculo: 'Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.',
    referencia: 'Isaías 40:31',
    reflexao: 'Esperar no Senhor não é cruzar os braços — é continuar quando seria mais fácil parar. A promessa não é que você não vai se cansar, mas que a força certa chega pra cada etapa: asas pra subir, fôlego pra correr, persistência pra só caminhar. Tem fases que pedem voo e fases que pedem apenas continuar andando. Hoje, qualquer que seja a sua, a força vem de quem você espera.',
    oracao: 'Senhor, renova as minhas forças. Quando eu quiser desistir, me sustenta pra dar mais um passo.'
  },
  {
    tema: 'Propósito',
    versiculo: 'Porque eu bem sei os planos que tenho a vosso respeito, diz o Senhor; planos de paz e não de mal, para vos dar um futuro e uma esperança.',
    referencia: 'Jeremias 29:11',
    reflexao: 'Esse versículo foi escrito pra um povo no exílio, longe de casa, sem perspectiva. Ou seja: a promessa de futuro nasceu no meio do pior cenário, não fora dele. Deus não estava ignorando a dor deles, estava trabalhando através dela. Talvez você não veja o plano agora, mas a ausência de respostas não é ausência de propósito.',
    oracao: 'Pai, mesmo quando eu não enxergo o caminho, eu creio que tu tens um bom plano. Me dá paciência pra confiar no teu tempo.'
  },
  {
    tema: 'Coragem',
    versiculo: 'Não to ordenei eu? Sê forte e corajoso! Não te apavores nem te atemorizes, porque o Senhor, teu Deus, está contigo em todo caminho que percorreres.',
    referencia: 'Josué 1:9',
    reflexao: 'Coragem não é ausência de medo — é avançar com o medo por perto. Deus mandou Josué ser corajoso justamente porque tinha motivo pra ter medo: uma terra desconhecida, um povo pra liderar, gigantes pela frente. A base da coragem não é confiança em si mesmo, é uma presença: "o Senhor está contigo". Você não entra em nada hoje sozinho.',
    oracao: 'Senhor, onde eu sinto medo, me lembra de que tu vais comigo. Me dá coragem pra avançar no que tu me chamaste.'
  },
  {
    tema: 'Provisão',
    versiculo: 'O Senhor é o meu pastor; nada me faltará.',
    referencia: 'Salmos 23:1',
    reflexao: 'Davi era pastor antes de ser rei — ele sabia exatamente o que um pastor faz pelas ovelhas: guia, alimenta, protege, cuida das feridas. Dizer "nada me faltará" não é prometer que você terá tudo que quer, mas tudo que precisa. A questão não é se Deus tem recursos, é se você confia em quem está pastoreando a sua vida. Hoje, descanse no cuidado de quem nunca abandona o rebanho.',
    oracao: 'Senhor, tu és o meu pastor. Eu confio que não vai me faltar o que eu realmente preciso. Me conduz hoje.'
  },
  {
    tema: 'Palavra',
    versiculo: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.',
    referencia: 'Salmos 119:105',
    reflexao: 'Uma lâmpada antiga não iluminava o horizonte inteiro — clareava só o próximo passo. É assim que a Palavra costuma funcionar: não te mostra o fim do caminho, mas o suficiente pra você não tropeçar agora. Por isso a leitura precisa ser diária, não ocasional. A luz de ontem ilumina o chão de ontem. Hoje, deixe a Palavra clarear o passo de hoje.',
    oracao: 'Pai, ilumina o meu caminho com a tua Palavra. Que eu não ande no escuro tentando enxergar sozinho.'
  },
  {
    tema: 'Contentamento',
    versiculo: 'Não digo isto por causa da pobreza, porque aprendi a viver contente em toda e qualquer situação.',
    referencia: 'Filipenses 4:11',
    reflexao: 'Contentamento não é ter tudo — é parar de precisar de tudo pra estar em paz. Paulo escreveu isso preso, e diz uma coisa importante: ele "aprendeu". Não nasceu pronto, foi aprendendo no aperto. A felicidade que depende das circunstâncias sobe e desce com elas; a que vem de Cristo permanece. Hoje, pratique gratidão pelo que você já tem em vez de medir a vida pelo que falta.',
    oracao: 'Senhor, me ensina o contentamento que não depende das circunstâncias. Que eu encontre em ti a paz que as coisas não dão.'
  },
  {
    tema: 'Fidelidade de Deus',
    versiculo: 'As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.',
    referencia: 'Lamentações 3:22-23',
    reflexao: 'Esse texto foi escrito em meio à ruína de Jerusalém — um dos momentos mais sombrios da história do povo. E mesmo ali, no fundo do poço, o profeta enxerga uma coisa: toda manhã chega de novo. A misericórdia de ontem não é a de hoje; cada amanhecer traz uma nova porção. Se você errou ontem, hoje é página nova. A fidelidade de Deus não cansa de você.',
    oracao: 'Pai, obrigado porque a tua misericórdia se renova a cada manhã. Hoje eu começo de novo na tua fidelidade.'
  },
  {
    tema: 'Oração',
    versiculo: 'Orai sem cessar.',
    referencia: '1 Tessalonicenses 5:17',
    reflexao: 'Orar sem cessar não é viver de joelhos o dia inteiro — é manter uma linha aberta com Deus no meio da vida normal. É a frase rápida no trânsito, o agradecimento no almoço, o desabafo no fim do dia. Oração não precisa ser longa nem bonita pra ser verdadeira. Hoje, transforme momentos comuns em conversas curtas com quem está sempre por perto.',
    oracao: 'Senhor, me ensina a falar contigo ao longo do dia, não só em momentos separados. Que a oração seja o ar que eu respiro.'
  },
  {
    tema: 'Amor',
    versiculo: 'Aquele que não ama não conheceu a Deus, porque Deus é amor.',
    referencia: '1 João 4:8',
    reflexao: 'Dá pra saber muita coisa sobre Deus e ainda não conhecê-lo de verdade. João coloca a prova num lugar incômodo: o jeito que você ama as pessoas. Não o amor fácil, dos que te tratam bem, mas o que custa. Conhecer a Deus transborda em amor concreto — paciência com quem irrita, perdão de quem feriu, gentileza sem plateia. Hoje, ame alguém de um jeito que custe um pouco.',
    oracao: 'Pai, que o teu amor em mim não fique só em palavra. Me dá um amor concreto pelas pessoas que estão ao meu redor hoje.'
  },
  {
    tema: 'Esperança',
    versiculo: 'E a esperança não traz confusão, porquanto o amor de Deus está derramado em nossos corações pelo Espírito Santo que nos foi dado.',
    referencia: 'Romanos 5:5',
    reflexao: 'Esperança no sentido bíblico não é otimismo de quem cruza os dedos — é certeza ancorada em quem Deus é. Por isso ela "não traz confusão": não deixa você na mão. O mundo coloca a esperança em coisas que podem falhar; a fé a coloca num amor que já foi derramado, não que talvez venha. Quando tudo parece incerto hoje, lembre que a sua esperança está apoiada em algo que não se move.',
    oracao: 'Senhor, ancora a minha esperança em ti, não nas circunstâncias. Que eu não me decepcione por esperar nas coisas erradas.'
  },
  {
    tema: 'Humildade',
    versiculo: 'Humilhai-vos, portanto, sob a poderosa mão de Deus, para que ele, em tempo oportuno, vos exalte.',
    referencia: '1 Pedro 5:6',
    reflexao: 'A cultura ensina a se promover, a aparecer, a garantir o próprio lugar. A Bíblia ensina o caminho contrário: abaixe-se, e deixe Deus levantar no tempo dele. Humildade não é se diminuir ou fingir que não tem valor — é parar de tentar controlar o reconhecimento. Há liberdade em não precisar provar nada. Hoje, faça o bem que ninguém vai ver e deixe a recompensa com Deus.',
    oracao: 'Pai, me livra da necessidade de aparecer. Me ensina a servir em humildade e a confiar que tu me levantas no tempo certo.'
  },
  {
    tema: 'Novo começo',
    versiculo: 'Portanto, se alguém está em Cristo, é nova criatura; as coisas antigas já passaram; eis que se fizeram novas.',
    referencia: '2 Coríntios 5:17',
    reflexao: 'O passado gosta de cobrar pedágio — culpa, vergonha, aquela voz que diz que você sempre vai ser o mesmo. Mas em Cristo, o veredito mudou. Você não é a soma dos seus piores momentos. "Nova criatura" não significa que tudo fica perfeito de uma vez, e sim que a sua identidade foi refeita. Hoje, recuse a definição que o seu passado tenta te impor.',
    oracao: 'Senhor, obrigado porque em ti eu sou nova criatura. Me ajuda a viver à altura disso e a soltar o que já passou.'
  },
  {
    tema: 'Generosidade',
    versiculo: 'Há quem distribua generosamente, e vê aumentar os seus bens; e há quem retenha mais do que é justo, e se torna mais pobre.',
    referencia: 'Provérbios 11:24',
    reflexao: 'A lógica do mundo diz que segurar é o caminho da segurança. A Bíblia mostra o paradoxo: mãos fechadas empobrecem a alma, mãos abertas a enriquecem. Generosidade não é sobre quanto você tem, é sobre quem é dono do seu coração — você ou as suas posses. Quem dá descobre que não estava perdendo, estava plantando. Hoje, abra a mão pra alguém, com tempo, recurso ou atenção.',
    oracao: 'Pai, abre a minha mão e o meu coração. Que eu seja um canal de bênção e não um reservatório fechado.'
  },
  {
    tema: 'Presença de Deus',
    versiculo: 'Deus é o nosso refúgio e fortaleza, socorro bem presente nas tribulações.',
    referencia: 'Salmos 46:1',
    reflexao: 'Repare na palavra "presente". Deus não é um socorro distante que você aciona e espera chegar — ele já está aqui, agora, dentro da tribulação com você. Refúgio é lugar pra onde você corre; fortaleza é o que te sustenta quando não dá pra correr. Seja qual for o aperto de hoje, você não está enfrentando de fora da presença de Deus. Ele está no meio dela.',
    oracao: 'Senhor, tu és o meu refúgio. No meio da dificuldade, me lembra de que tu já estás aqui comigo. Eu me escondo em ti.'
  }
];
