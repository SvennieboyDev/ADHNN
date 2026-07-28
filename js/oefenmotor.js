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
    return { prefix: "De naam", suffix: "" };
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
      return { prefix: "De naam", suffix: "", moderneZin: `De naam van ${moderneFraseFn(woordObj)}` };
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
  return `${woordObj.woord}${geslachtSuffix(woordObj.geslacht)}`;
}

function normaliseer(tekst) {
  return tekst.trim().toLowerCase().replace(/\s+/g, " ");
}

function alsLijst(waarde) {
  return Array.isArray(waarde) ? waarde : [waarde];
}

// Zet een vast prefix/suffix-stuk om in los beoordeelde woord-segmenten.
// Categorieën kunnen zelf al een lijst van {tekst, kritiek}-segmenten
// aanleveren (bv. omdat het zelfstandig naamwoord daar ook naamvals-
// afhankelijk verandert en dus exact moet kloppen, geen typfout-coulance);
// anders wordt de hele tekststring als niet-kritiek behandeld.
function segmentenVan(delen, tekst) {
  if (delen) return delen;
  return tekst ? tekst.split(" ").map((t) => ({ tekst: t, kritiek: false })) : [];
}

// Beoordeelt één kandidaat-antwoord voor een volledig overgetypte zin: het
// naamval-gedeelte (kritiek) moet exact kloppen, kleine typefouten in de
// rest van de zin mogen. Een segment mag zelf ook meerdere geldige woorden
// hebben (bv. een zelfstandig naamwoord dat met én zonder -e goed is) —
// dat wordt aangeleverd als een array in plaats van een string.
function beoordeelZinKandidaat(waarde, config, kritiekVorm) {
  const segmenten = [
    ...segmentenVan(config.prefixDelen, config.prefix),
    ...kritiekVorm.split(" ").map((t) => ({ tekst: t, kritiek: true })),
    ...segmentenVan(config.suffixDelen, config.suffix),
  ];
  const actueleWoorden = normaliseer(waarde).split(" ").filter(Boolean);
  if (actueleWoorden.length !== segmenten.length) {
    return { juist: false, typo: false };
  }
  let typoGevonden = false;
  for (let i = 0; i < segmenten.length; i++) {
    const opties = alsLijst(segmenten[i].tekst).map((t) => t.toLowerCase());
    const actueelWoord = actueleWoorden[i];
    if (opties.includes(actueelWoord)) continue;
    if (segmenten[i].kritiek) {
      return { juist: false, typo: false };
    }
    const kleinsteAfstand = Math.min(...opties.map((optie) => bewerkingsafstand(optie, actueelWoord)));
    if (kleinsteAfstand <= toegestaneTypoAfstand(opties[0])) {
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

// Bouwt de volledige zin op voor de "antwoord tonen"-knop in zin-modus. Zijn
// er meerdere geldige naamvalsvormen, dan worden die allemaal getoond,
// gescheiden door " / ".
function volledigeZinTekst(config, kritiekVormen) {
  const middenTekst = alsLijst(kritiekVormen).join(" / ");
  const segmenten = [
    ...segmentenVan(config.prefixDelen, config.prefix),
    { tekst: middenTekst },
    ...segmentenVan(config.suffixDelen, config.suffix),
  ];
  const tekst = segmenten.map((s) => alsLijst(s.tekst).join(" / ")).join(" ");
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

// De oefenkaart heeft een vaste standaardbreedte (zie .woordkaart in
// style.css), zodat alle categorieën er hetzelfde uitzien. Past de tekst in
// een zin daar niet binnen twee regels in, dan wordt de kaart stapsgewijs
// breder gemaakt tot het wél past, in plaats van de zin lelijk over veel
// regels te laten breken. Nooit breder dan het scherm toelaat.
const KAART_STANDAARDBREEDTE_REM = 36;
const KAART_MAXBREEDTE_REM = 60;
const KAART_BREEDTESTAP_REM = 4;
const KAART_MAX_REGELS = 2;

function telTekstregels(el) {
  const bereik = document.createRange();
  bereik.selectNodeContents(el);
  return bereik.getClientRects().length;
}

function telFlexRijen(el) {
  const tops = new Set();
  Array.from(el.children).forEach((kind) => tops.add(Math.round(kind.offsetTop)));
  return tops.size;
}

function kaartHeeftTeVeelRegels(kaart) {
  const tekstBlokken = kaart.querySelectorAll(".moderne-zin");
  for (const el of tekstBlokken) {
    if (telTekstregels(el) > KAART_MAX_REGELS) return true;
  }
  const zinRijen = kaart.querySelectorAll(".zin");
  for (const el of zinRijen) {
    if (telFlexRijen(el) > KAART_MAX_REGELS) return true;
  }
  return false;
}

// Meet de daadwerkelijk gerenderde kaart en verbreedt die pas als het echt
// nodig is (in plaats van vooraf te gokken op basis van tekstlengte). De
// header/titel erboven schalen mee, zodat de hele pagina in de pas blijft
// lopen met de kaart in plaats van er smaller naast te staan.
function pasKaartBreedteAan(kaart) {
  function zetBreedte(breedte) {
    const waarde = `min(94vw, ${breedte}rem)`;
    kaart.style.maxWidth = waarde;
    document.querySelectorAll(".oefen-header, .categorie-titel").forEach((el) => {
      el.style.maxWidth = waarde;
    });
  }

  let breedte = KAART_STANDAARDBREEDTE_REM;
  zetBreedte(breedte);
  while (breedte < KAART_MAXBREEDTE_REM && kaartHeeftTeVeelRegels(kaart)) {
    breedte += KAART_BREEDTESTAP_REM;
    zetBreedte(breedte);
  }
}

function startOefening({
  vormenFn,
  moderneFraseFn,
  zinsdelenFn = zinsdelen,
  volledigeZinConfigFn = maakStandaardVolledigeZinConfig(moderneFraseFn),
  titelFn = standaardTitel,
  ondertitelFn = () => null,
  woordenFilterFn = null,
  woordenBronFn = laadWoorden,
  casesFn = () => CASES,
}) {
  let woorden = [];
  let modus = "deel";
  let cases = CASES;
  let idx = 0;
  let score = { correct: 0, total: 0 };
  let attempted = {};
  let correctDone = {};
  let opgegeven = {};
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
    opgegeven = {};
    const inputsByCase = {};
    const toonBtnByCase = {};
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

    function naVoltooiing() {
      checkVolledig();
      const volgendeGeval = cases.find((c) => !correctDone[c] && !opgegeven[c]);
      if (volgendeGeval) {
        inputsByCase[volgendeGeval].focus();
      } else if (!volgendeBtn.hidden) {
        volgendeBtn.focus();
      }
    }

    function maakBeoordelaar(geval, input, feedback, checkFn) {
      return function beoordeel() {
        if (correctDone[geval] || opgegeven[geval]) return;
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
          toonBtnByCase[geval].hidden = true;
          feedback.classList.toggle("typo-opmerking", !!resultaat.typo);
          feedback.textContent = resultaat.typo ? "Goed! (kleine typefout genegeerd)" : "";
          updateScore();
          naVoltooiing();
        } else {
          input.classList.remove("correct");
          input.classList.add("incorrect");
          feedback.classList.remove("typo-opmerking");
          feedback.textContent = "Nog niet juist, probeer opnieuw.";
          updateScore();
        }
      };
    }

    function maakToonAntwoord(geval, input, feedback, toonBtn, antwoordTekstFn) {
      return function toonAntwoord() {
        if (correctDone[geval] || opgegeven[geval]) return;

        const isEersteKeer = !attempted[geval];
        if (isEersteKeer) {
          attempted[geval] = true;
          score.total++;
        }

        opgegeven[geval] = true;
        input.value = antwoordTekstFn();
        input.disabled = true;
        input.classList.remove("correct");
        input.classList.add("incorrect");
        toonBtn.hidden = true;
        feedback.classList.remove("typo-opmerking");
        feedback.textContent = "Antwoord getoond.";
        updateScore();
        naVoltooiing();
      };
    }

    cases.forEach((geval) => {
      const verwacht = antwoorden[geval];

      const rij = document.createElement("div");
      rij.className = "vraag";

      const label = document.createElement("label");
      label.textContent = LABELS[geval];
      rij.appendChild(label);

      let input;
      let checkFn;
      let antwoordTekstFn;

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
        antwoordTekstFn = () => volledigeZinTekst(config, verwacht);
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
        antwoordTekstFn = () => alsLijst(verwacht).join(" / ");
      }

      inputsByCase[geval] = input;

      const toonBtn = document.createElement("button");
      toonBtn.type = "button";
      toonBtn.className = "toon-antwoord-btn";
      toonBtn.textContent = "Antwoord tonen";
      rij.appendChild(toonBtn);
      toonBtnByCase[geval] = toonBtn;

      const feedback = document.createElement("div");
      feedback.className = "feedback";
      rij.appendChild(feedback);

      kaart.appendChild(rij);

      const beoordeel = maakBeoordelaar(geval, input, feedback, checkFn);
      const toonAntwoord = maakToonAntwoord(geval, input, feedback, toonBtn, antwoordTekstFn);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          beoordeel();
        }
      });
      input.addEventListener("blur", beoordeel);
      toonBtn.addEventListener("click", toonAntwoord);
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
    pasKaartBreedteAan(kaart);

    const eersteInput = kaart.querySelector(".antwoord-input, .zin-input");
    if (eersteInput) eersteInput.focus();

    function checkVolledig() {
      if (cases.every((c) => correctDone[c] || opgegeven[c])) {
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

  woordenBronFn()
    .then((data) => {
      modus = haalModusOp();
      cases = casesFn();
      const gefilterd = woordenFilterFn ? data.filter(woordenFilterFn) : data;
      woorden = schudArray(gefilterd);
      updateScore();
      renderWoord(idx);
      startTimer(haalTijdslimietOp());
    })
    .catch(() => {
      content.innerHTML = `<p class="foutmelding">De woordenlijst kon niet geladen worden. Bekijk deze pagina via GitHub Pages of een lokale server (niet als los bestand).</p>`;
    });
}
