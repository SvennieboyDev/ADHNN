// Generieke motor voor de naamval-oefeningen (bepaald lidwoord, onbepaald
// lidwoord, bijvoeglijke naamwoorden, ...). Elke oefenpagina roept
// startOefening() aan met de vervoegingsfuncties die specifiek zijn voor die
// categorie; de rest van de mechaniek (deel/zin-modus, typfouttolerantie,
// timer, score, focus) is identiek voor alle categorieën.

const CASES = ["nominatief", "genitief", "datief", "accusatief"];
const LABELS = {
  nominatief: "Nominatief",
  genitief: "Genitief",
  datief: "Datief",
  accusatief: "Accusatief",
};

// "Deel"-modus (standaard): alleen het ontbrekende stukje van een vaste zin.
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

// "Zin"-modus (standaard): dezelfde vaste tekst als hierboven (het
// historische skelet), aangevuld met de moderne zin.
function maakStandaardVolledigeZinConfig(moderneFraseFn) {
  return function (woordObj, geval) {
    if (geval === "nominatief") {
      return { prefix: "Dit is", suffix: "", moderneZin: `Dit is ${moderneFraseFn(woordObj)}` };
    }
    if (geval === "genitief") {
      return { prefix: "de naam", suffix: "", moderneZin: `de naam van ${moderneFraseFn(woordObj)}` };
    }
    if (geval === "datief") {
      if (isPersoon(woordObj)) {
        return {
          prefix: "Ik geef",
          suffix: "een geschenk",
          moderneZin: `Ik geef ${moderneFraseFn(woordObj)} een geschenk`,
        };
      }
      return {
        prefix: "Hij spreekt van",
        suffix: "",
        moderneZin: `Hij spreekt van ${moderneFraseFn(woordObj)}`,
      };
    }
    if (geval === "accusatief") {
      return { prefix: "Ik zie", suffix: "", moderneZin: `Ik zie ${moderneFraseFn(woordObj)}` };
    }
  };
}

function standaardTitel(woordObj) {
  return `${woordObj.woord} (${woordObj.geslacht})`;
}

function normaliseer(tekst) {
  return tekst.trim().toLowerCase().replace(/\s+/g, " ");
}

function alsLijst(waarde) {
  return Array.isArray(waarde) ? waarde : [waarde];
}

// Beoordeelt één kandidaat-antwoord voor een volledig overgetypte zin: het
// naamval-gedeelte (kritiek) moet exact kloppen, kleine typefouten in de
// rest van de zin mogen.
function beoordeelZinKandidaat(waarde, config, kritiekVorm) {
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

// Sommige vragen hebben meer dan één historisch aanvaard antwoord (bv.
// "den goeden" naast het ook toegestane "het goede"). Probeer elke
// kandidaat en geef de beste match terug.
function beoordeelZin(waarde, config, kritiekVormen) {
  let besteResultaat = { juist: false, typo: false };
  for (const kandidaat of alsLijst(kritiekVormen)) {
    const resultaat = beoordeelZinKandidaat(waarde, config, kandidaat);
    if (resultaat.juist && !resultaat.typo) return resultaat;
    if (resultaat.juist) besteResultaat = resultaat;
  }
  return besteResultaat;
}

function startOefening({
  vormenFn,
  moderneFraseFn,
  zinsdelenFn = zinsdelen,
  volledigeZinConfigFn = maakStandaardVolledigeZinConfig(moderneFraseFn),
  titelFn = standaardTitel,
  ondertitelFn = () => null,
}) {
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

    const titelBlok = document.createElement("div");
    titelBlok.className = "woordkaart-titel-blok";
    const titelEl = document.createElement("h1");
    titelEl.textContent = titelFn(woordObj);
    titelBlok.appendChild(titelEl);
    const ondertitelTekst = ondertitelFn(woordObj);
    if (ondertitelTekst) {
      const ondertitelEl = document.createElement("p");
      ondertitelEl.className = "woordkaart-ondertitel";
      ondertitelEl.textContent = ondertitelTekst;
      titelBlok.appendChild(ondertitelEl);
    }
    top.appendChild(titelBlok);

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
        const config = volledigeZinConfigFn(woordObj, geval);

        const moderneZinEl = document.createElement("div");
        moderneZinEl.className = "moderne-zin";
        moderneZinEl.textContent = config.moderneZin;
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
        const { prefix, suffix, hint } = zinsdelenFn(woordObj, geval);

        if (hint) {
          const hintEl = document.createElement("div");
          hintEl.className = "moderne-zin";
          hintEl.textContent = hint;
          rij.appendChild(hintEl);
        }

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

        checkFn = (waarde) => ({
          juist: alsLijst(verwacht).some((optie) => normaliseer(waarde) === normaliseer(optie)),
          typo: false,
        });
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
