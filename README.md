# Corretor de Inglês (English AI)

Interface web para enviar frases em inglês e receber **correção**, **explicação em português** e um **exercício** gerados por um modelo de linguagem rodando localmente (API compatível com OpenAI, por exemplo via **LM Studio**).

O código da aplicação fica em [`english-ai/`](english-ai/).

## Funcionalidades atuais

- **Corrigir**: envia o texto para o backend; a resposta segue o formato estruturado definido em `src/ai.js` (Correção, Explicação, Exercício, Exemplo, Resposta).
- **Fluxo no servidor**: geração, revisão automática da resposta e validações de formato/qualidade antes de devolver ao cliente.
- **Ouvir (TTS)**: leitura em voz alta da linha **Correção:** usando a [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis); seleção de **voz em inglês** (lista preenchida conforme o sistema/navegador).
- **Layout**: página com `header` / `main` / `footer`, área de entrada (`#entrada`) e cards (`#result`) com cada parte da correção (Correção, Explicação, Exercício, Exemplo, Resposta).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML, CSS, JavaScript (`src/project/`) |
| API | [Express](https://expressjs.com/) + [cors](https://github.com/expressjs/cors) (`src/project/server.js`) |
| LLM | `fetch` para `http://127.0.0.1:1234/v1/chat/completions` (`src/ai.js`; modelo configurável no corpo da requisição) |

**Requisito de Node.js:** versão **18+** (uso de `fetch` nativo no backend).

## Estrutura do projeto

```
english-ai/
├── package.json
└── src/
    ├── ai.js                 # Chamadas ao LLM, revisão, validações, exporta fluxo()
    └── project/
        ├── server.js         # POST /api → fluxo(mensagem)
        ├── index.html      # UI
        ├── script.js       # enviar() → fetch na API
        ├── voice.js        # TTS e select de voz
        └── style.css
```

## Como rodar

### 1. Instalar dependências

```bash
cd english-ai
npm install
```

### 2. Subir o modelo local (LM Studio ou similar)

- Inicie o servidor de API no host/porta esperados por `src/ai.js` (padrão: **`http://127.0.0.1:1234`**).
- Ajuste **`URL`** e o nome do **`model`** em `english-ai/src/ai.js` se o seu ambiente usar outro endereço ou modelo.

### 3. Iniciar a API Node

```bash
cd english-ai
npm run start:api
```

O servidor escuta em **`http://127.0.0.1:3000`**. O endpoint principal é:

- **`POST /api`**  
  - Corpo JSON: `{ "mensagem": "sua frase em inglês" }`  
  - Resposta: `{ "resposta": "..." }` ou erro com `{ "erro": "..." }`.

### 4. Abrir a interface

Abra no navegador o arquivo:

`english-ai/src/project/index.html`

(duplo clique ou “Abrir com…” o navegador). Se houver bloqueio de `fetch` por abrir como `file://`, sirva a pasta `src/project` com um servidor estático local (por exemplo `npx serve src/project`) e acesse pela URL que o próprio `serve` mostrar — a API continua em `http://127.0.0.1:3000` e o CORS já está habilitado no Express.

## Scripts npm (`english-ai/package.json`)

| Script | Descrição |
|--------|-----------|
| `npm run start:api` | Sobe `node src/project/server.js` |

## Solução de problemas

- **`Failed to fetch` no navegador:** a API em `127.0.0.1:3000` não está rodando ou a porta está ocupada; confira o terminal após `npm run start:api`.
- **Resposta genérica de falha do modelo:** o LM Studio precisa estar ativo na URL configurada em `src/ai.js`; modelo e parâmetros devem estar compatíveis com a API de chat completions.
- **TTS sem voz ou lista vazia:** em alguns navegadores as vozes só aparecem após o evento `voiceschanged`; tente recarregar ou interagir com a página antes de usar **Ouvir**.

## Licença

ISC (conforme `english-ai/package.json`).
