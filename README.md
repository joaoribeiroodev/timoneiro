# Timoneiro

Sistema de mapeamento 3D das embarcações da Internacional Travessias Salvador,
para o setor de TI acompanhar onde cada câmera e televisão está instalada em
cada convés da frota.

## Stack

- **Next.js 14** (App Router) — frontend e backend (API routes) no mesmo projeto
- **Supabase** (Postgres) — usuários e cadastro de equipamentos, via service role key
- **Three.js** — modelo 3D do casco e dos conveses de cada embarcação
- Autenticação própria (bcrypt + JWT em cookie httpOnly), no mesmo padrão do ITS-Demandas
- Identidade visual: navy `#00335e` + verde `#8ac640` (marca Internacional Travessias)

## Embarcações modeladas

| Embarcação | Fonte da planta | Situação |
|---|---|---|
| Dorival Caymmi | Arranjo Geral (121D01 · INT-DCI-01-001) | Totalmente confirmado: dimensões (boca 17,56 m, pontal 3,90 m, calado 2,72 m), passageiros (988), tripulação (8) e os 6 conveses |
| Rio Paraguaçu | Arranjo Geral (INT-RPG-01-001) | Dimensões e conveses confirmados |
| Zumbi dos Palmares | Arranjo Geral (121D01 Rev. C · EFT IM-ZP-2016-002) + Plano de Docagem | Totalmente confirmado: dimensões, passageiros (1.104), tripulantes (10) e os 7 conveses |
| Maria Bethânia | Arranjo Geral Rev. B (121D01 · IM-MB-2014-002) | Dimensões e conveses confirmados |

Frota 100% com dimensões reais confirmadas.

## Editar embarcações sem mexer no código

`/admin/navios` (só para usuários `admin`) lista as 4 embarcações; clicando
em uma delas você edita:
- Nome, estaleiro, documento de origem
- Características principais (comprimento, boca, pontal, calado, tripulação, passageiros)
- Conveses: adicionar/remover, código, nome, altura (Z) e pé-direito
- Compartimentos de cada convés: nome, tipo (define a cor no 3D), posição (x, y) e tamanho (largura, comprimento)
- Upload de um modelo 3D real (.glb)

Tudo isso grava direto na tabela `vessels` do Supabase — nenhuma dessas
mudanças exige alterar `lib/vessels.js` ou fazer novo deploy.

## Modelo 3D real (GLTF/GLB)

Quando você tiver o arquivo CAD de uma embarcação, exporte como `.glb`
(glTF binário) e envie em `/admin/navios/<slug>` → "Modelo 3D real". O
arquivo vai para o bucket público `models` no Supabase Storage; a partir
daí, a visão "navio inteiro" dessa embarcação passa a carregar e mostrar
esse modelo real (auto-escalado pelo comprimento total cadastrado) no
lugar do casco reconstruído por parâmetros — sem precisar mexer em nada
mais. O cadastro de câmeras/TVs por convés continua funcionando do mesmo
jeito, independente de qual dos dois modelos está sendo mostrado. Clique
em "remover" para voltar ao casco paramétrico a qualquer momento.

Limite atual: só `.glb` (arquivo único, sem texturas/binários externos
separados), até 60 MB.

## Histórico de manutenção por equipamento

Ao abrir os detalhes de uma câmera ou TV já cadastrada, agora existe uma
seção "Histórico de manutenção": qualquer `admin`/`tecnico` pode registrar
uma entrada (data, tipo — preventiva/corretiva/instalação/outro, o que foi
feito, quem fez); só `admin` pode excluir um registro. Fica guardado na
tabela `equipment_maintenance`, vinculado ao equipamento.

## Acesso

O sistema inteiro exige login — um middleware (`middleware.js`) barra
qualquer página ou rota de API antes da autenticação e redireciona para
`/login`, preservando a página que a pessoa tentou abrir. Não existe mais
navegação anônima até a tela de escolha das embarcações.

`/admin/usuarios` (só para `admin`) cria, edita (nome, e-mail, papel,
redefinição de senha) e exclui usuários — sem precisar mexer direto na
tabela `users` do Supabase no dia a dia. Sempre precisa restar pelo menos
um usuário `admin`, e ninguém pode excluir a própria conta.

## Pintura e aparência de cada embarcação

O casco e a casaria de cada navio usam o esquema de pintura visto nas
fotos reais da frota (`lib/three/livery.js`): Dorival Caymmi e Zumbi dos
Palmares com casco branco, faixa de acabamento e muitas janelas ao longo
do convés de passageiros; Rio Paraguaçu com casco azul-marinho sólido e
poucas janelas (é bem mais uma balsa utilitária que um ferry envidraçado,
igual na foto); Maria Bethânia branca com antiincrustante azul-escuro. O
passadiço agora tem as asas laterais (bridge wings) visíveis nas fotos.

## Convés isolado: sem blocos

O corte de convés (quando você isola um nível) não usa mais um bloco
colorido sólido por compartimento. Cada compartimento agora é uma "sala"
de verdade — piso tingido pela cor do tipo, 4 paredes baixas (baixas o
bastante pra ver o conteúdo de cima) e móveis representativos do tipo
(`lib/three/furniture.js`): bancos em fileira para salões de passageiros,
fileiras de carros para garagens, blocos de motor para praça de máquinas,
beliches para camarotes, console + roda de leme para o comando, balcão
para copa/bar, caixotes para paióis, bancos para áreas abertas.

## Modelos 3D reais (Dorival Caymmi, Maria Bethânia, Rio Paraguaçu, Zumbi dos Palmares)

Os 4 arquivos `.glb` que você mandou já vêm **prontos e ativados** — não
precisa fazer upload manual em lugar nenhum. Eles estão em
`public/models/<slug>.glb`, e `supabase/seed-vessels.json` já aponta o
`gltf_url` de cada embarcação pra esse caminho. Se você já tinha rodado
`npm run seed` antes desta entrega, **rode de novo**:

```
npm run seed
```

Isso atualiza as 4 embarcações (mesmo `slug`, então é seguro rodar de
novo) com o campo `gltf_url` preenchido. A partir daí, abrir qualquer
`/navio/<slug>` já carrega o modelo real automaticamente — nenhum clique
extra, nenhuma tela de admin envolvida.

Se um dia você quiser trocar por outro arquivo `.glb` sem mexer em código,
`/admin/navios/<slug>` → "Modelo 3D real" continua funcionando normalmente
(ele grava num bucket do Supabase Storage e sobrescreve esse `gltf_url`).

**O que eu ajustei nos arquivos antes de entregar, e por quê:**
- **Tamanho do arquivo**: cada `.glb` original tinha ~53–55 MB (quase
  1 milhão de vértices, sem textura). Rodei uma compressão sem perda de
  geometria (`meshopt`, via `gltf-transform`) que reduziu pra ~6,6–6,8 MB
  cada, sem simplificar a malha — só codificação mais eficiente. O app já
  vem com o decodificador (`meshoptimizer`) configurado no carregador 3D.
- **Orientação**: nem todos os 4 arquivos têm o comprimento no mesmo eixo
  (o do Zumbi dos Palmares vinha girado 90° em relação aos outros três).
  O visualizador agora detecta e alinha automaticamente o eixo mais
  comprido com a proa-popa, então isso é resolvido sozinho ao carregar,
  qualquer que seja a orientação do arquivo.
- **Escala**: os arquivos não trazem uma escala de mundo real confiável
  (o metadado interno de "unidade" deles, se aplicado ao pé da letra,
  resultaria num navio de poucos centímetros). O sistema ignora essa
  escala interna e redimensiona o modelo pelo comprimento total (LOA) já
  cadastrado — o mesmo valor confirmado nas plantas de arranjo geral.
- **Cor**: os arquivos vêm sem nenhuma textura ou cor (material cinza
  padrão) — são reconstruções geométricas puras. Pintei cada um por
  altura em relação à linha d'água, usando exatamente a paleta de cada
  embarcação tirada das fotos reais (`lib/three/livery.js`) e as cotas
  reais de calado/pontal já confirmadas nos documentos: antiincrustante
  abaixo da linha d'água, casco acima, casaria no topo.

**Sendo direto sobre a fidelidade:** analisando a estrutura interna dos
arquivos (`asset.generator`, nome do nó raiz `sparc3d-physical-root`,
malha única sem textura), tudo indica que eles vêm de uma reconstrução
3D automática a partir de uma única foto (esse é o padrão de saída de
ferramentas de "imagem para 3D"), não de um desenho CAD de projeto naval.
Isso não invalida o uso — a silhueta e o volume tendem a ficar bem mais
realistas que a reconstrução paramétrica —, mas explica por que não têm
textura/cor própria e por que não dá pra esperar detalhes finos (portas,
corrimãos, janelas individuais) separados como objetos: é uma casca única
e sólida. O corte por convés (compartimentos, câmeras, TVs) continua
funcionando do mesmo jeito de sempre, independente do modelo externo
usado por baixo.

## Como o modelo 3D é gerado

Não partimos de um arquivo CAD das embarcações — as plantas enviadas são
desenhos técnicos (PDF/raster). Para manter o máximo de fidelidade possível
sem esse arquivo de origem, o visualizador tem **dois modos**, que alternam
sozinhos conforme você navega:

- **"Navio inteiro"**: mostra o casco pintado (proa/popa arredondadas nas
  dimensões reais) com a casaria sólida empilhada por convés — janelas,
  faixa verde da marca, timoneira com mastro/radar no topo, amurada nos
  conveses abertos (Tijupá, Convés dos Botes) e rampas de proa/popa. É a
  visão para "ver o navio por inteiro", como um modelo de apresentação.
- **Convés isolado**: ao clicar num convés na coluna da esquerda, a casaria
  daquele nível some e aparece o corte de cima (piso + compartimentos
  coloridos, do jeito que já existia antes) — é nesse modo que você
  cadastra câmera/TV, porque dá pra clicar exatamente na área certa.

O casco é gerado por parâmetros reais de cada navio (comprimento, boca,
pontal, calado) usando uma curva de boca ao longo do comprimento
(`lib/three/hull.js`), e cada volume de convés usa o mesmo contorno
arredondado (`lib/three/exterior.js`) com a área de compartimentos
observada no arranjo geral (`lib/vessels.js`) — não são coordenadas de
projeto (CAD), e sim uma reconstrução fiel às proporções e ao empilhamento
observados nas plantas.

Se no futuro vocês conseguirem o arquivo CAD/lines-plan de alguma
embarcação, dá para trocar o gerador paramétrico por geometria importada
(GLTF/OBJ) sem mudar o resto do sistema — o componente `ThreeViewer` e o
cadastro de equipamentos não dependem de como o casco foi gerado.

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com).
2. No SQL Editor do projeto, rode `supabase/schema.sql` — isso cria as
   tabelas (`users`, `equipment`, `vessels`, `equipment_maintenance`) e o
   bucket de Storage `models` (para os arquivos `.glb`).
3. Copie `.env.example` para `.env.local` e preencha:
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   - `JWT_SECRET` (qualquer string longa aleatória)
4. `npm install`
5. `npm run seed` — carrega as 4 embarcações (dimensões e conveses) na
   tabela `vessels`. Só precisa rodar uma vez; depois disso a edição é
   toda feita pela tela `/admin/navios`.
6. `npm run dev`

Login inicial (criado pelo `schema.sql`):
- usuário: `ti.salvador`
- senha: `timoneiro123`

**Troque essa senha assim que possível** — crie um novo usuário admin direto
na tabela `users` do Supabase (gerando o hash com
`node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA', 10))"`) e
remova ou desative o usuário padrão.

## Papéis de usuário

- `admin` — cadastra, edita e **exclui** equipamentos; gerencia usuários direto no Supabase
- `tecnico` — cadastra e edita equipamentos, não exclui
- `visualizador` — apenas navega no modelo 3D e vê a lista de equipamentos

## Como cadastrar uma câmera ou TV

1. Abra a embarcação, isole o convés desejado na coluna da esquerda.
2. Clique em **+ Câmera** ou **+ TV** no canto superior direito do visualizador.
3. Clique no ponto exato do convés onde o equipamento está instalado.
4. Preencha nome, área, modelo, IP, data de instalação e status — salvar.

O pino aparece imediatamente no modelo 3D, na posição exata clicada, e na
lista lateral. Clicar em um pino ou item da lista abre os detalhes para
editar ou (se admin) excluir.

## Deploy

Recomendado: Vercel (mesmo fluxo do ITS-Demandas). Configure as três
variáveis de ambiente no painel do projeto antes do primeiro deploy.

## Próximos passos possíveis (fora do escopo desta versão)

- Status online/offline por ping de rede (hoje o cadastro é só inventário + localização)
- Suporte a `.gltf` + texturas separadas (hoje só `.glb` autocontido)
- Tela de gestão de usuários (hoje é direto na tabela `users` do Supabase)
