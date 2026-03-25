const MARCADORES_RESPOSTA = [
    ["Correção:", "correction"],
    ["Explicação:", "explication"],
    ["Exercício:", "exercise"],
    ["Exemplo:", "example"],
    ["Resposta:", "answer"],
];

function extrairCampos(textoBruto) {
    const out = {
        correction: "",
        explication: "",
        exercise: "",
        example: "",
        answer: "",
    };

    if (!textoBruto || typeof textoBruto !== "string") {
        return out;
    }

    for (let i = 0; i < MARCADORES_RESPOSTA.length; i++) {
        const [marcador, chave] = MARCADORES_RESPOSTA[i];
        const i0 = textoBruto.indexOf(marcador);
        if (i0 === -1) {
            continue;
        }

        const inicio = i0 + marcador.length;
        const proximoMarcador =
            i < MARCADORES_RESPOSTA.length - 1
                ? textoBruto.indexOf(MARCADORES_RESPOSTA[i + 1][0], inicio)
                : -1;
        const fim = proximoMarcador === -1 ? textoBruto.length : proximoMarcador;

        out[chave] = textoBruto.slice(inicio, fim).trim();
    }

    return out;
}

function limparCards() {
    for (const [, id] of MARCADORES_RESPOSTA) {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    }
}

function definirStatus(texto) {
    const el = document.getElementById("status");
    if (el) el.textContent = texto || "";
}

function preencherCards(campos) {
    for (const [, id] of MARCADORES_RESPOSTA) {
        const el = document.getElementById(id);
        if (el) el.textContent = campos[id] || "";
    }
}

async function enviar() {
    const texto = document.querySelector("#entrada").value;

    if (!texto.trim()) {
        definirStatus("Digite uma frase para corrigir.");
        limparCards();
        return;
    }

    definirStatus("Corrigindo...");
    limparCards();

    try {
        const resposta = await fetch("http://127.0.0.1:3000/api", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ mensagem: texto }),
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Falha ao consultar a API.");
        }

        const bruto = dados.resposta ?? "";
        preencherCards(extrairCampos(bruto));
        definirStatus("");
    } catch (erro) {
        definirStatus(`Erro: ${erro.message}`);
        limparCards();
    }
}
