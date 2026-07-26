const CASES = ["nominatief", "genitief", "datief", "accusatief"];
const LABELS = {
  nominatief: "Nominatief",
  genitief: "Genitief",
  datief: "Datief",
  accusatief: "Accusatief",
};

function zinsdelen(woordObj, geval) {
  if (geval === "nominatief") {
    return { prefix: "", suffix: "" };
  }
  if (geval === "genitief") {
    return { prefix: "de naam", suffix: "" };
  }
  if (geval === "datief") {
    if (isPersoon(woordObj)) {
      return { prefix: "Ik geef", suffix: "een geschenk" };
    }
    return { prefix: "Hij spreekt van", suffix: "" };
  }
  if (geval === "accusatief") {
    return { prefix: "Ik zie", suffix: "" };
  }
}

function normaliseer(tekst) {
  return tekst.trim().toLowerCase().replace(/\s+/g, " ");
}

let woorden = [];
let idx = 0;
let score = { correct: 0, total: 0 };
let attempted = {};
let correctDone = {};
let enterHandler = null;

const content = document.getElementById("oefen-content");
const scoreEl = document.getElementById("score");

function updateScore() {
  scoreEl.textContent = `${score.correct}/${score.total}`;
}

function renderWoord(i) {
  attempted = {};
  correctDone = {};
  if (enterHandler) {
    document.removeEventListener("keydown", enterHandler);
    enterHandler = null;
  }

  if (i >= woorden.length) {
    content.innerHTML = `
      <div class="woordkaart">
        <h1>Klaar!</h1>
        <p class="eindscore">Score: ${score.correct}/${score.total}</p>
      </div>
    `;
    return;
  }

  const woordObj = woorden[i];
  const antwoorden = vormen(woordObj);

  const kaart = document.createElement("div");
  kaart.className = "woordkaart";

  const top = document.createElement("div");
  top.className = "woordkaart-top";
  top.innerHTML = `<h1>${woordObj.woord} (${woordObj.geslacht})</h1>`;
  const skipBtn = document.createElement("button");
  skipBtn.type = "button";
  skipBtn.className = "skip-button";
  skipBtn.textContent = "Woord overslaan";
  skipBtn.addEventListener("click", () => {
    idx++;
    renderWoord(idx);
  });
  top.appendChild(skipBtn);
  kaart.appendChild(top);

  CASES.forEach((geval) => {
    const { prefix, suffix } = zinsdelen(woordObj, geval);
    const verwacht = antwoorden[geval];

    const rij = document.createElement("div");
    rij.className = "vraag";

    const label = document.createElement("label");
    label.textContent = LABELS[geval];
    rij.appendChild(label);

    const zin = document.createElement("div");
    zin.className = "zin";
    if (prefix) {
      const prefixSpan = document.createElement("span");
      prefixSpan.textContent = prefix;
      zin.appendChild(prefixSpan);
    }
    const input = document.createElement("input");
    input.type = "text";
    input.className = "antwoord-input";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    zin.appendChild(input);
    if (suffix) {
      const suffixSpan = document.createElement("span");
      suffixSpan.textContent = suffix;
      zin.appendChild(suffixSpan);
    }
    rij.appendChild(zin);

    const feedback = document.createElement("div");
    feedback.className = "feedback";
    rij.appendChild(feedback);

    kaart.appendChild(rij);

    function beoordeel() {
      if (correctDone[geval]) return;
      const waarde = input.value;
      if (normaliseer(waarde) === "") return;

      const isEersteKeer = !attempted[geval];
      if (isEersteKeer) {
        attempted[geval] = true;
        score.total++;
      }

      if (normaliseer(waarde) === normaliseer(verwacht)) {
        if (isEersteKeer) score.correct++;
        correctDone[geval] = true;
        input.classList.remove("incorrect");
        input.classList.add("correct");
        input.disabled = true;
        feedback.textContent = "";
        updateScore();
        checkVolledig();
      } else {
        input.classList.remove("correct");
        input.classList.add("incorrect");
        feedback.textContent = "Nog niet juist, probeer opnieuw.";
        updateScore();
      }
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        beoordeel();
      }
    });
    input.addEventListener("blur", beoordeel);
  });

  const volgendeBtn = document.createElement("button");
  volgendeBtn.type = "button";
  volgendeBtn.className = "volgende-button";
  volgendeBtn.textContent = "Volgende woord →";
  volgendeBtn.hidden = true;
  volgendeBtn.addEventListener("click", () => {
    idx++;
    renderWoord(idx);
  });
  kaart.appendChild(volgendeBtn);

  content.innerHTML = "";
  content.appendChild(kaart);

  const eersteInput = kaart.querySelector(".antwoord-input");
  if (eersteInput) eersteInput.focus();

  function checkVolledig() {
    if (CASES.every((c) => correctDone[c])) {
      volgendeBtn.hidden = false;
      enterHandler = (e) => {
        if (e.key === "Enter") {
          idx++;
          renderWoord(idx);
        }
      };
      document.addEventListener("keydown", enterHandler);
    }
  }
}

laadWoorden()
  .then((data) => {
    woorden = data;
    updateScore();
    renderWoord(idx);
  })
  .catch(() => {
    content.innerHTML = `<p class="foutmelding">De woordenlijst kon niet geladen worden. Bekijk deze pagina via GitHub Pages of een lokale server (niet als los bestand).</p>`;
  });
