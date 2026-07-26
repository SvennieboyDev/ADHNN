// Gedeelde hulpfuncties en taalregels voor de naamvallenoefeningen.
// Gebaseerd op "Overzicht der historische Nederlandse naamvallen".

const ARTIKELEN = {
  m: { nominatief: "de", genitief: "des", datief: "den", accusatief: "den" },
  v: { nominatief: "de", genitief: "der", datief: "der", accusatief: "de" },
  o: { nominatief: "het", genitief: "des", datief: "den", accusatief: "het" },
};

// Zwakke (n-stam) zelfstandige naamwoorden: genitief/datief/accusatief enkelvoud
// krijgen allemaal dezelfde -en vorm (net als bij "des graven").
const ZWAKKE_VORMEN = {
  heer: "heren",
  graaf: "graven",
  vorst: "vorsten",
  prins: "prinsen",
  held: "helden",
  boer: "boeren",
  mens: "mensen",
  hertog: "hertogen",
  gezel: "gezellen",
  knaap: "knapen",
  bode: "boden",
};

// Woorden die een persoon of levend wezen aanduiden krijgen bij de datief
// een echt meewerkend voorwerp (zonder voorzetsel). De rest gebruikt "van".
const PERSOONSWOORDEN = new Set([
  "koning", "man", "zoon", "vader", "broer", "heer", "graaf", "vorst",
  "prins", "held", "boer", "mens", "hertog", "gezel", "knaap", "bode",
  "bakker", "koopman", "ridder", "visser",
  "vrouw", "dochter", "moeder", "zuster", "koningin",
  "kind",
]);

function isZwak(woordObj) {
  return !!woordObj.zwakke_genitief;
}

function stamVorm(woordObj) {
  return woordObj.woord;
}

function obliekeVorm(woordObj) {
  // Datief/accusatief-vorm van het zelfstandig naamwoord zelf (los van het
  // lidwoord). "zwakke_genitief" beïnvloedt uitsluitend de genitief-uitgang;
  // datief en accusatief enkelvoud blijven altijd de kale stam.
  return woordObj.woord;
}

function genitiefVorm(woordObj) {
  if (isZwak(woordObj)) {
    return ZWAKKE_VORMEN[woordObj.woord];
  }
  if (woordObj.geslacht === "v") {
    return woordObj.woord;
  }
  if (woordObj.woord.endsWith("s")) {
    return woordObj.woord.slice(0, -1) + "zes";
  }
  return woordObj.woord + "s";
}

function isPersoon(woordObj) {
  return PERSOONSWOORDEN.has(woordObj.woord);
}

function vormen(woordObj) {
  const g = woordObj.geslacht;
  const artikelen = ARTIKELEN[g];
  const gen = genitiefVorm(woordObj);
  const oblique = obliekeVorm(woordObj);
  return {
    nominatief: `${artikelen.nominatief} ${stamVorm(woordObj)}`,
    genitief: `${artikelen.genitief} ${gen}`,
    datief: `${artikelen.datief} ${oblique}`,
    accusatief: `${artikelen.accusatief} ${oblique}`,
  };
}

// Modern Nederlands kent geen naamvalsverbuiging meer: het lidwoord is altijd
// de nominatiefvorm en het woord zelf blijft de kale stam.
function moderneFrase(woordObj) {
  return `${ARTIKELEN[woordObj.geslacht].nominatief} ${woordObj.woord}`;
}

const ONBEPAALD_ARTIKELEN = {
  m: { nominatief: "een", genitief: "eens", datief: "eenen", accusatief: "eenen" },
  v: { nominatief: "eene", genitief: "eener", datief: "eener", accusatief: "eene" },
  o: { nominatief: "een", genitief: "eens", datief: "eenen", accusatief: "een" },
};

// Het zelfstandig naamwoord zelf verbuigt precies hetzelfde als bij het
// bepaalde lidwoord (zwakke/sterke genitief enz.); alleen het lidwoord
// verandert.
function vormenOnbepaald(woordObj) {
  const artikelen = ONBEPAALD_ARTIKELEN[woordObj.geslacht];
  const gen = genitiefVorm(woordObj);
  const oblique = obliekeVorm(woordObj);
  return {
    nominatief: `${artikelen.nominatief} ${stamVorm(woordObj)}`,
    genitief: `${artikelen.genitief} ${gen}`,
    datief: `${artikelen.datief} ${oblique}`,
    accusatief: `${artikelen.accusatief} ${oblique}`,
  };
}

// Modern Nederlands kent nog maar één onbepaald lidwoord voor alle
// geslachten: "een".
function moderneOnbepaaldeFrase(woordObj) {
  return `een ${woordObj.woord}`;
}

// --- Instellingen (opgeslagen in localStorage, gelden voor alle oefeningen) ---
const INSTELLING_MODUS_KEY = "adhnn_modus";

function haalModusOp() {
  return localStorage.getItem(INSTELLING_MODUS_KEY) === "zin" ? "zin" : "deel";
}

function zetModus(modus) {
  localStorage.setItem(INSTELLING_MODUS_KEY, modus === "zin" ? "zin" : "deel");
}

const INSTELLING_TIJD_KEY = "adhnn_tijdslimiet_minuten";

function haalTijdslimietOp() {
  const waarde = parseInt(localStorage.getItem(INSTELLING_TIJD_KEY), 10);
  if (!Number.isFinite(waarde) || waarde < 1 || waarde > 30) return 15;
  return waarde;
}

function zetTijdslimiet(minuten) {
  localStorage.setItem(INSTELLING_TIJD_KEY, String(minuten));
}

// Damerau-Levenshtein-afstand (inclusief transposities zoals "gefe" i.p.v.
// "geef") tussen twee losse woorden, gebruikt om kleine typefouten in het
// niet-kritieke deel van een zin door de vingers te zien.
function bewerkingsafstand(a, b) {
  const al = a.length;
  const bl = b.length;
  const d = [];
  for (let i = 0; i <= al; i++) d[i] = [i];
  for (let j = 0; j <= bl; j++) d[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + kosten
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + kosten);
      }
    }
  }
  return d[al][bl];
}

function toegestaneTypoAfstand(woord) {
  if (woord.length <= 2) return 0;
  if (woord.length <= 7) return 1;
  return 2;
}

function schudArray(array) {
  const resultaat = array.slice();
  for (let i = resultaat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resultaat[i], resultaat[j]] = [resultaat[j], resultaat[i]];
  }
  return resultaat;
}

async function laadWoorden() {
  const response = await fetch("data/naamwoorden.json");
  if (!response.ok) {
    throw new Error("Kon woordenlijst niet laden");
  }
  const data = await response.json();
  return data.woorden;
}
