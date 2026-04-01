const MARCADORES_RESPOSTA = [
    ["Correção:", "correction"],
    ["Explicação:", "explication"],
    ["Exercício:", "exercise"],
    ["Exemplo:", "example"],
    ["Resposta:", "answer"],
];

let correctAnswer = "";

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

const MAX_HISTORICO = 15;

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
        const partes = extrairCampos(bruto);
        correctAnswer = (partes.answer || "").trim();
        preencherCards(partes);
        salvarHistorico({
            message: texto,
            correction: partes.correction,
            explication: partes.explication,
            exercise: partes.exercise,
            example: partes.example,
            answer: partes.answer,
            date: new Date().toLocaleString(),
        });
        renderizarHistorico();
        definirStatus("");
    } catch (erro) {
        definirStatus(`Erro: ${erro.message}`);
        limparCards();
    }
}

function salvarHistorico(item) {
    const historico = JSON.parse(localStorage.getItem("historico")) || [];
    historico.push(item);
    while (historico.length > MAX_HISTORICO) {
        historico.shift();
    }
    localStorage.setItem("historico", JSON.stringify(historico));
}

function carregarHistorico() {
    return JSON.parse(localStorage.getItem("historico")) || [];
}

function renderizarHistorico() {
    const historico = carregarHistorico();
    const container = document.getElementById("historico");
    if (!container) return;

    container.innerHTML = "";

    historico
        .slice()
        .reverse()
        .forEach((item) => {
            const div = document.createElement("div");
            div.className = "card";
            const frase = item.message ?? item.messege ?? "";
            div.innerHTML = `
        <p><strong>Frase:</strong> ${frase}</p>
        <p><strong>Correção:</strong> ${item.correction ?? ""}</p>
        <p><strong>Explicação:</strong> ${item.explication ?? ""}</p>
        <p><strong>Exercício:</strong> ${item.exercise ?? ""}</p>
        <p><strong>Exemplo:</strong> ${item.example ?? ""}</p>
        <p><strong>Resposta:</strong> ${item.answer ?? ""}</p>
        <small>${item.date ?? ""}</small>`;
            container.appendChild(div);
        });
}

function toggleHistorico() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("aberto");
    document.body.classList.toggle("historico-aberto", sidebar.classList.contains("aberto"));
}

function normalizar(text) {
    return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, "");
}

function interpretarResultadoIA(texto) {
    const validation = document.getElementById("showVerification");

    if (!texto || !texto.toLowerCase().includes("correto:")) {
        validation.textContent = "Erro na validação, tente novamente.";
        return;
    }

    const correto = texto.toLowerCase().includes("correto: sim");

    if (correto) {
        validation.textContent = "✅ Correto!";
    } else {
        validation.textContent = "❌ " + extrairFeedback(texto);
    }
}

async function verifyUserAnswer() {
    const input = document.getElementById("userAnswer").value;
    const validation = document.getElementById("showVerification");

    console.log("verifyUserAnswer called");
    console.log("Input:", input);
    console.log("Correct answer:", correctAnswer);

    if(!input.trim()) {
        validation.textContent = "Digite uma resposta";
        return;
    }

    if(!correctAnswer.trim()) {
        validation.textContent = "Primeiro faça uma correção para ter uma resposta de referência";
        return;
    }

    // Pegar o exercício atual do card
    const exercicioElement = document.getElementById("exercise");
    const exercicioAtual = exercicioElement ? exercicioElement.textContent.trim() : "";

    console.log("Exercise:", exercicioAtual);

    validation.textContent = "Validando...";

    try {
        console.log("Making fetch request...");
        const resposta = await fetch("http://127.0.0.1:3000/validar", {
            method: "POST",
            headers: {
                "content-type":"application/json"
            },
            body: JSON.stringify({
                respostaUsuario: input,
                respostaCorreta: correctAnswer,
                exercicio: exercicioAtual
            })
        });

        console.log("Fetch response status:", resposta.status);

        if (!resposta.ok) {
            throw new Error("Erro na validação");
        }

        const data = await resposta.json();

        console.log("DATA:", data);
        console.log("RESULTADO:", data.resultado);

        interpretarResultadoIA(data.resultado);
    } catch (error) {
        console.error("Erro:", error);
        validation.textContent = "Erro na validação, tente novamente.";
    }
}

function extrairFeedback(texto) {
    const match = texto.match(/Feedback:\s*(.*)/i);
    return match ? match[1] : "Resposta incorreta.";
}

window.onload = function () {
    renderizarHistorico();
};