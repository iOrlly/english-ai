const URL = 'http://127.0.0.1:1234/v1/chat/completions';

// Resposta
async function buscarDados(mensagem) {
    const resposta = await fetch(URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: "qwen/qwen3-8b",
            // max_tokens: 500,
            messages: [
                {
                    role: "system",
                    content: `
                    Você é um professor de inglês direto, claro e rigoroso.

                    OBJETIVO:
                    Ajudar o aluno a aprender corrigindo erros de forma prática.

                    TAREFA:
                    1. Corrigir a frase
                    2. Explicar o erro de forma simples
                    3. Criar um exercício focado no mesmo erro
                    4. Dar um exemplo correto
                    5. Resolver o exercício

                    REGRAS:

                    CORREÇÃO:
                    - Corrija a frase em inglês
                    - NÃO traduza
                    - NÃO explique aqui

                    EXPLICAÇÃO:
                    - Em português
                    - Máximo 2 frases
                    - Explique exatamente o erro (tempo verbal, preposição, ordem, etc.)
                    - Seja direto, sem enrolação

                    EXERCÍCIO:
                    - Escreva UMA instrução em inglês
                    - Diga EXATAMENTE quais palavras o usuário deve usar
                    - O exercício deve focar no mesmo erro da frase original

                    EXEMPLO:
                    - Uma frase simples seguindo o exercício
                    - Use exatamente as palavras pedidas (ou muito próximas)

                    RESPOSTA:
                    - Dê uma resposta modelo correta usando as mesmas regras do exercício
                    
                    FORMATO OBRIGATÓRIO (responda exatamente assim):
                    Correção: [frase corrigida em inglês]
                    Explicação: [explicação em português]
                    Exercício: [Criar exercício relacionado ao tema em inglês(máximo 1 frase)]
                    Exemplo: [Dê um exemplo de resposta(máximo 1 frase)]
                    Resposta:[Responder exercício]
                    
                    REGRAS FINAIS:
                    - NÃO adicione comentários
                    - NÃO fuja do formato
                    - NÃO use mais de 1 frase em Exercício, Exemplo ou Resposta
                    - NÃO seja genérico`
                },
                {
                role: "user",
                content: "Corrija e explique: " + mensagem
                }
            ],
            temperature: 0.2
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
            model: "qwen/qwen3-8b",
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
                    Exemplo: [Dê um exemplo de resposta(máximo 1 frase)]
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