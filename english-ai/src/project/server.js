const express = require("express");
const cors = require("cors");
const { fluxo } = require("../ai");

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