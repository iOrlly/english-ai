const URL = 'http://127.0.0.1:1234/v1/chat/completions';

async function buscarDados(mensagem) {
    try {
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
                        Você é um revisor de inglês.

                        Tarefa:
                        1. Corrigir a frase
                        2. Explicar o erro
                        3. Criar 1 exercício simples sobre o mesmo tema

                        Regras do exercício:
                        - Peça para o usuário escrever uma frase simples em inglês
                        - Diga exatamente quais palavras devem ser usadas
                        - Inclua um exemplo correto
                        - Inclua a resposta esperada (modelo)

                        Regras:
                        - NÃO traduza a frase
                        - Correção em inglês
                        - Explicação em português
                        - NÃO use espanhol
                        - NÃO adicione nada além do formato

                        Processo:
                        Verifique se os termos gramaticais estão corretos.
                        Não use termos errados.
                        Use explicações simples e diretas (máximo 2 frases).
                        Verificar se a correção e a explicação estão corretas.
                        
                        Formato obrigatório (responda apenas isso):
                        
                        Correção: [frase corrigida em inglês]
                        Explicação: [explicação em português]
                        Exercício: [Criar exercício relacionado ao tema]
                        Exemplo: [Dê um exemplo de resposta]
                        Resposta:[Responder exercício]
                        
                        Pare a resposta após a explicação.
                        `
                    },
                    {
                    role: "user",
                    content: "Corrija e explique: " + mensagem
                    }
                ],
                temperature: 0.4
            })
        });

        if(!resposta.ok) {
            throw new Error('erro na requisição: ' + resposta.status);
        }
        const dados = await resposta.json()
        console.log("resposta do servidor: ", dados)

        const respostaModelo = dados.choices[0].message.content;
        console.log("Modelo: ", respostaModelo)

    } catch (erro) {
        console.error('Ops! Algo deu errado: ', erro);
    }
}

buscarDados("She go to school yesterday");