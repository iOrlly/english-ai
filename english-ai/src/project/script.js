async function enviar() {
    const texto = document.querySelector("#entrada").value;
    const saida = document.querySelector("#resposta");

    if (!texto.trim()) {
        saida.textContent = "Digite uma frase para corrigir.";
        return;
    }

    saida.textContent = "Corrigindo...";

    try {
        const resposta = await fetch("http://127.0.0.1:3000/api", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({ mensagem: texto })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Falha ao consultar a API.");
        }

        saida.textContent = dados.resposta;
    } catch (erro) {
        saida.textContent = `Erro: ${erro.message}`;
    }
}
