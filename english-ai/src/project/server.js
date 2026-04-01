const express = require("express");
const cors = require("cors");
const { fluxo } = require("../ai");

const URL = 'http://127.0.0.1:1234/v1/chat/completions';
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api", async (req, res) => {
    try {
        const mensagem = req.body.mensagem;

        if (!mensagem || typeof mensagem !== "string") {
            return res.status(400).json({ erro: "Campo 'mensagem' é obrigatório." });
        }

        const resposta = await fluxo(mensagem);
        return res.json({ resposta });
    } catch (erro) {
        console.error("Erro ao processar /api:", erro);
        return res.status(500).json({ erro: "Erro interno ao processar a mensagem." });
    }
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://127.0.0.1:3000");
});

app.post("/validar", async (req, res) => {
    console.log("Recebida requisição /validar");
    console.log("Body:", req.body);

    const { respostaUsuario, respostaCorreta, exercicio } = req.body;

    const prompt = `
    Você é um avaliador de respostas de inglês.

    TAREFA:
    Comparar a resposta do aluno com a resposta esperada.

    REGRAS:
    - Considere correto mesmo com pequenas variações
    - Ignore pontuação
    - Ignore letras maiúsculas/minúsculas
    - Foque no significado e gramática

    Responda APENAS neste formato:

    Correto: sim/não
    Feedback: uma frase curta explicando

    EXERCÍCIO: ${exercicio}
    RESPOSTA ESPERADA: ${respostaCorreta}
    RESPOSTA DO ALUNO: ${respostaUsuario}
    `;

    console.log("Prompt enviado para IA:", prompt);

    try {
        const resposta = await fetch(URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                model: "qwen/qwen3-8b",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2
            })
        });
        const dados = await resposta.json();
        const resultado = dados.choices[0].message.content;

        console.log("Resposta da IA:", resultado);

        res.json({ resultado });
    } catch (e) {
        console.error("Erro ao validar:", e);
        res.status(500).json({ erro: "erro ao validar" });
    }
});

