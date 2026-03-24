function popularVozes() {
    const select = document.getElementById("voz");
    if (!select) return;

    const valorAtual = select.value;
    const todas = speechSynthesis.getVoices();
    const ingles = todas.filter((v) => v.lang.toLowerCase().startsWith("en"));
    const lista = ingles.length ? ingles : todas;

    lista.sort((a, b) => {
        const aUs = a.lang.toLowerCase() === "en-us" ? 0 : 1;
        const bUs = b.lang.toLowerCase() === "en-us" ? 0 : 1;
        if (aUs !== bUs) return aUs - bUs;
        return a.name.localeCompare(b.name);
    });

    select.innerHTML = "";

    for (const v of lista) {
        const opt = document.createElement("option");
        opt.value = `${v.name}|${v.lang}`;
        opt.textContent = `${v.name} (${v.lang})`;
        select.appendChild(opt);
    }

    if (valorAtual && [...select.options].some((o) => o.value === valorAtual)) {
        select.value = valorAtual;
    }
}

function vozEscolhida() {
    const select = document.getElementById("voz");
    if (!select || !select.value) return null;

    const barra = select.value.indexOf("|");
    if (barra === -1) return null;

    const name = select.value.slice(0, barra);
    const lang = select.value.slice(barra + 1);

    return speechSynthesis.getVoices().find((v) => v.name === name && v.lang === lang) || null;
}

function falarTexto(texto) {
    const limpo = texto.trim();
    if (!limpo) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(limpo);

    const voz = vozEscolhida();
    if (voz) {
        utterance.voice = voz;
        utterance.lang = voz.lang;
    } else {
        utterance.lang = "en-US";
    }

    utterance.rate = 0.9;

    speechSynthesis.speak(utterance);
}

function ouvir() {
    const resposta = document.getElementById("resposta").textContent;

    const correcao = resposta.split("Correção:")[1]?.split("\n")[0];

    if (correcao) {
        falarTexto(correcao);
    }
}

speechSynthesis.addEventListener("voiceschanged", popularVozes);
popularVozes();