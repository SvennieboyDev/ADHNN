// Generieke motor voor de naamval-oefeningen (bepaald lidwoord, onbepaald
// lidwoord, ...). Elke oefenpagina roept startOefening() aan met de
// vervoegingsfuncties die specifiek zijn voor die categorie; de rest van de
// mechaniek (deel/zin-modus, typfouttolerantie, timer, score, focus) is
// identiek voor alle categorieën.

const CASES = ["nominatief", "genitief", "datief", "accusatief"];
const LABELS = {
  nominatief: "Nominatief",
  genitief: "Genitief",
  datief: "Datief",
  accusatief: "Accusatief",
};

// "Deel"-modus: alleen het ontbrekende stukje van een vaste zin.
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

// "Zin"-modus: dezelfde vaste tekst als hierboven (het historische skelet),
// aangevuld met een moderne prefix om de moderne zin te kunnen tonen.
function volledigeZinConfig(woordObj, geval) {
  if (geval === "nominatief") {
    return { modernPrefix: "Dit is", prefix: "Dit is", suffix: "" };
  }
  if (geval === "genitief") {
    return { modernPrefix: "de naam van", prefix: "de naam", suffix: "" };
  }
  if (geval === "datief") {
    if (isPersoon(woordObj)) {
      return { modernPrefix: "Ik geef", prefix: "Ik geef", suffix: "een geschenk" };
    }
    return { modernPrefix: "Hij spreekt van", prefix: "Hij spreekt van", suffix: "" };
  }
  if (geval === "accusatief") {
    return { modernPrefix: "Ik zie", prefix: "Ik zie", suffix: "" };
  }
}

function normaliseer(tekst) {
  return tekst.trim().toLowerCase().replace(/\s+/g, " ");
}

// Beoordeelt een volledig overgetypte zin: het naamval-gedeelte (kritiek)
// moet exact kloppen, kleine typefouten in de rest van de zin mogen.
function beoordeelZin(waarde, config, kritiekVorm) {
  const segmenten = [
    ...(config.prefix ? config.prefix.split(" ") : []).map((t) => ({ tekst: t, kritiek: false })),
    ...kritiekVorm.split(" ").map((t) => ({ tekst: t, kritiek: true })),
    ...(config.suffix ? config.suffix.split(" ") : []).map((t) => ({ tekst: t, kritiek: false })),
  ];
  const actueleWoorden = normaliseer(waarde).split(" ").filter(Boolean);
  if (actueleWoorden.length !== segmenten.length) {
    return { juist: false, typo: false };
  }
  let typoGevonden = false;
  for (let i = 0; i < segmenten.length; i++) {
    const verwachtWoord = segmenten[i].tekst.toLowerCase();
    const actueelWoord = actueleWoorden[i];
    if (verwachtWoord === actueelWoord) continue;
    if (segmenten[i].kritiek) {
      return { juist: false, typo: false };
    }
    const afstand = bewerkingsafstand(verwachtWoord, actueelWoord);
    if (afstand <= toegestaneTypoAfstand(verwachtWoord)) {
      typoGevonden = true;
      continue;
    }
    return { juist: false, typo: false };
  }
  return { juist: true, typo: typoGevonden };
}

function startOefening({ vormenFn, moderneFraseFn }) {
  let woorden = [];
  let modus = "deel";
  let idx = 0;
  let score = { correct: 0, total: 0 };
  let attempted = {};
  let correctDone = {};
  let enterHandler = null;
  let tijdResterend = 0;
  let tijdIsOm = false;
  let tijdInterval = null;

  const content = document.getElementById("oefen-content");
  const scoreEl = document.getElementById("score");
  const tijdEl = document.getElementById("tijd");

  function updateScore() {
    scoreEl.textContent = `${score.correct}/${score.total}`;
  }

  function formatTijd(seconden) {
    const m = Math.floor(seconden / 60);
    const s = seconden % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateTijdWeergave() {
    tijdEl.textContent = formatTijd(Math.max(tijdResterend, 0));
  }

  function startTimer(minuten) {
    tijdResterend = minuten * 60;
    updateTijdWeergave();
    tijdInterval = setInterval(() => {
      tijdResterend--;
      updateTijdWeergave();
      if (tijdResterend <= 0) {
        clearInterval(tijdInterval);
        tijdIsOm = true;
      }
    }, 1000);
  }

  function gaNaarVolgendeWoord() {
    idx++;
    if (tijdIsOm) {
      toonTijdIsOmScherm();
    } else {
      renderWoord(idx);
    }
  }

  function toonTijdIsOmScherm() {
    content.innerHTML = `
      <div class="woordkaart">
        <h1>Tijd is om!</h1>
        <p class="eindscore">Score: ${score.correct}/${score.total}</p>
        <p class="eindscore-melding">Je wordt teruggestuurd naar het startscherm...</p>
      </div>
    `;
    setTimeout(() => {
      window.location.href = "index.html";
    }, 4000);
  }

  function renderWoord(i) {
    attempted = {};
    correctDone = {};
    const inputsByCase = {};
    if (enterHandler) {
      document.removeEventListener("keydown", enterHandler);
      enterHandler = null;
    }

    if (i >= woorden.length) {
      if (tijdInterval) clearInterval(tijdInterval);
      content.innerHTML = `
        <div class="woordkaart">
          <h1>Klaar!</h1>
          <p class="eindscore">Score: ${score.correct}/${score.total}</p>
        </div>
      `;
      return;
    }

    const woordObj = woorden[i];
    const antwoorden = vormenFn(woordObj);

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
      gaNaarVolgendeWoord();
    });
    top.appendChild(skipBtn);
    kaart.appendChild(top);

    function maakBeoordelaar(geval, input, feedback, checkFn) {
      return function beoordeel() {
        if (correctDone[geval]) return;
        const waarde = input.value;
        if (normaliseer(waarde) === "") return;

        const isEersteKeer = !attempted[geval];
        if (isEersteKeer) {
          attempted[geval] = true;
          score.total++;
        }

        const resultaat = checkFn(waarde);

        if (resultaat.juist) {
          if (isEersteKeer) score.correct++;
          correctDone[geval] = true;
          input.classList.remove("incorrect");
          input.classList.add("correct");
          input.disabled = true;
          feedback.classList.toggle("typo-opmerking", !!resultaat.typo);
          feedback.textContent = resultaat.typo ? "Goed! (kleine typefout genegeerd)" : "";
          updateScore();
          checkVolledig();
          const volgendeGeval = CASES.find((c) => !correctDone[c]);
          if (volgendeGeval) {
            inputsByCase[volgendeGeval].focus();
          } else if (!volgendeBtn.hidden) {
            volgendeBtn.focus();
          }
        } else {
          input.classList.remove("correct");
          input.classList.add("incorrect");
          feedback.classList.remove("typo-opmerking");
          feedback.textContent = "Nog niet juist, probeer opnieuw.";
          updateScore();
        }
      };
    }

    CASES.forEach((geval) => {
      const verwacht = antwoorden[geval];

      const rij = document.createElement("div");
      rij.className = "vraag";

      const label = document.createElement("label");
      label.textContent = LABELS[geval];
      rij.appendChild(label);

      let input;
      let checkFn;

      if (modus === "zin") {
        const config = volledigeZinConfig(woordObj, geval);
        const moderneZinTekst = [config.modernPrefix, moderneFraseFn(woordObj), config.suffix]
          .filter(Boolean)
          .join(" ");

        const moderneZinEl = document.createElement("div");
        moderneZinEl.className = "moderne-zin";
        moderneZinEl.textContent = moderneZinTekst;
        rij.appendChild(moderneZinEl);

        input = document.createElement("input");
        input.type = "text";
        input.className = "zin-input";
        input.autocomplete = "off";
        input.autocapitalize = "off";
        input.spellcheck = false;
        rij.appendChild(input);

        checkFn = (waarde) => beoordeelZin(waarde, config, verwacht);
      } else {
        const { prefix, suffix } = zinsdelen(woordObj, geval);

        const zin = document.createElement("div");
        zin.className = "zin";
        if (prefix) {
          const prefixSpan = document.createElement("span");
          prefixSpan.textContent = prefix;
          zin.appendChild(prefixSpan);
        }
        input = document.createElement("input");
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

        checkFn = (waarde) => ({ juist: normaliseer(waarde) === normaliseer(verwacht), typo: false });
      }

      inputsByCase[geval] = input;

      const feedback = document.createElement("div");
      feedback.className = "feedback";
      rij.appendChild(feedback);

      kaart.appendChild(rij);

      const beoordeel = maakBeoordelaar(geval, input, feedback, checkFn);

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
      gaNaarVolgendeWoord();
    });
    kaart.appendChild(volgendeBtn);

    content.innerHTML = "";
    content.appendChild(kaart);

    const eersteInput = kaart.querySelector(".antwoord-input, .zin-input");
    if (eersteInput) eersteInput.focus();

    function checkVolledig() {
      if (CASES.every((c) => correctDone[c])) {
        volgendeBtn.hidden = false;
        enterHandler = (e) => {
          if (e.key === "Enter") {
            gaNaarVolgendeWoord();
          }
        };
        document.addEventListener("keydown", enterHandler);
      }
    }
  }

  laadWoorden()
    .then((data) => {
      modus = haalModusOp();
      woorden = schudArray(data);
      updateScore();
      renderWoord(idx);
      startTimer(haalTijdslimietOp());
    })
    .catch(() => {
      content.innerHTML = `<p class="foutmelding">De woordenlijst kon niet geladen worden. Bekijk deze pagina via GitHub Pages of een lokale server (niet als los bestand).</p>`;
    });
}
