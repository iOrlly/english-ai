const URL = 'http://127.0.0.1:1234/v1/chat/completions';

// Resposta
async function buscarDados(mensagem) {
    const resposta = await fetch(URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: "phi-3.1-mini-4k-instruct",
            // max_tokens: 500,
            messages: [
                {
                    role: "system",
                    content: `
                    Você é um professor de inglês.

                    Tarefa:
                    1. Corrigir a frase
                    2. Explicar o erro
                    3. Criar 1 exercício

                    Regras:
                    - Correção em inglês
                    - Explicação em português (máximo 2 frases)
                    - Não traduza a frase

                    Exercício:
                    - Peça para escrever uma frase
                    - Defina palavras obrigatórias
                    - Inclua exemplo
                    - Inclua resposta modelo
                    
                    Formato obrigatório (responda apenas isso):
                    Correção: [frase corrigida em inglês]
                    Explicação: [explicação em português]
                    Exercício: [Criar exercício relacionado ao tema em inglês(máximo 1 frase)]
                    Exemplo: [Dê um exemplo de resposta em inglês(máximo 1 frase)]
                    Resposta:[Responder exercício]`
                },
                {
                role: "user",
                content: "Corrija e explique: " + mensagem
                }
            ],
            temperature: 0.4
        })
    });
    const dados = await resposta.json();
    return dados.choices[0].message.content;
}

// revisar resposata
async function revisarResposta(respostaOriginal) {
    const resposta = await fetch(URL, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
            model: "phi-3.1-mini-4k-instruct",
            messages:
            [
                {
                    role: "system",
                    content: `Você é um corretor de respostas.

                    Tarefa:
                    - Corrigir erros de gramática e explicação
                    - Garantir que a resposta siga este formato:
                    Correção: [frase corrigida em inglês]
                    Explicação: [explicação em português]
                    Exercício: [Criar exercício relacionado ao tema em inglês(máximo 1 frase)]
                    Exemplo: [Dê um exemplo de resposta em inglês(máximo 1 frase)]
                    Resposta:[Responder exercício]

                    Regras:
                    - NÃO avalie
                    - NÃO comente
                    - NÃO explique o que mudou
                    - NÃO adicione texto extra

                    Se estiver errado, corrija.
                    Se estiver certo, repita exatamente a resposta original.

                    Responda apenas com a resposta final corrigida ou revisada.`
                },
                {
                    role: "user",
                    content: respostaOriginal
                }
            ]
        })
    })
    const dados = await resposta.json();
    return dados.choices[0].message.content;
}

function validarFormato(resposta) {
    return (
        resposta.includes("Correção:") &&
        resposta.includes("Explicação:") &&
        resposta.includes("Exercício:") &&
        resposta.includes("Exemplo:") &&
        resposta.includes("Resposta:")
    )
}

function validarQualidade(resposta) {
    if (resposta.includes("pretérito perfeito")) return false;
    if (resposta.includes("past perfect")) return false;   
    if(resposta.includes("Instrucción")) return false;
    if(resposta.length < 50) return false;

    return true
}

function validarCoerencia(resposta) {
    if (resposta.includes("to be")) {
        if (
            resposta.includes("went") ||
            resposta.includes("saw") ||
            resposta.includes("ate")
        ) {
            return false;
        }
    }
    return true
}

function validarResposta(resposta) {
    const formato = validarFormato(resposta);
    const qualidade = validarQualidade(resposta);
    const coerencia = validarCoerencia(resposta);

    if (!formato) console.log("Erro: formato");
    if (!qualidade) console.log("Erro: qualidade");
    if (!coerencia) console.log("Erro: coerência");

    return formato && qualidade && coerencia;
}

function parseResposta(texto) {
    function extrair(secao) {
        const regex = new RegExp(secao + ":(.*?)(?=\\n\\w+:|$)", "s");
        const match = texto.match(regex);
        return match ? match[1].trim() : "";
    }

    return {
        correction: extrair("Correção"),
        explication: extrair("Explicação"),
        exercise: extrair("Exercício"),
        example: extrair("Exemplo"),
        answer: extrair("Resposta")
    };
}

// Resposta revisada: Orquestrador
async function fluxo(mensagem) {
    let tentativas = 0;
    let contexto = mensagem;

    while (tentativas < 3) {
        const resposta = await buscarDados(contexto);
        const revisada = await revisarResposta(resposta);

        if (validarResposta(revisada)) {
            console.log("\nResposta final:\n");
            console.log(revisada);
            return revisada;
        }

        tentativas++;
        contexto = mensagem + "\n\nA resposta anterior estava fora do formato. Corrija melhor.";
    }

    const erro = "Não consegui gerar uma resposta válida.";
    console.log(erro);
    return erro;
}

module.exports = { fluxo };