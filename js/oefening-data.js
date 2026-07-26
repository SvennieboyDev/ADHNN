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

// --- Bijvoeglijke naamwoorden: zwakke verbuiging ---
// Na een bepaald lidwoord krijgt het bijvoeglijk naamwoord altijd de
// zwakke verbuiging (-e in de nominatief, verder meestal -en).
const ZWAK_BIJV_UITGANGEN = {
  nominatief: { m: "e", v: "e", o: "e" },
  genitief: { m: "en", v: "e", o: "en" },
  datief: { m: "en", v: "e", o: "en" },
  accusatief: { m: "en", v: "e", o: "e" },
};

// Een handvol bijvoeglijke naamwoorden, met hun al correct afgeleide
// -e en -en vorm (rekening houdend met de gewone Nederlandse spellingregels:
// klinkerverdubbeling die wegvalt in een open lettergreep ("groot" -> "grote"),
// medeklinkerverdubbeling na een korte klinker ("zwak" -> "zwakke") en
// stemhebbend worden van -s/-f ("lief" -> "lieve")).
// Modern Nederlands schrijft die open lettergreep altijd met een enkele
// klinker ("hele", "grote", "hoge"), maar in de oude spelling (van vóór de
// afschaffing van de naamvallen) werd de dubbele klinker vaak nog gehandhaafd
// ("heele", "groote", "hooge"). Welke van de twee gebruikt wordt is
// instelbaar; de "enkel"-tabel is ook de vaste basis voor de moderne zin.
const BIJV_ZWAK_VORMEN_ENKEL = {
  goed: { e: "goede", en: "goeden" },
  heel: { e: "hele", en: "helen" },
  groot: { e: "grote", en: "groten" },
  hoog: { e: "hoge", en: "hogen" },
  klein: { e: "kleine", en: "kleinen" },
  sterk: { e: "sterke", en: "sterken" },
  rijk: { e: "rijke", en: "rijken" },
  oud: { e: "oude", en: "ouden" },
  zwak: { e: "zwakke", en: "zwakken" },
  lief: { e: "lieve", en: "lieven" },
};
const BIJV_ZWAK_VORMEN_DUBBEL = {
  ...BIJV_ZWAK_VORMEN_ENKEL,
  heel: { e: "heele", en: "heelen" },
  groot: { e: "groote", en: "grooten" },
  hoog: { e: "hooge", en: "hoogen" },
};
const BIJV_ZWAK_ADJECTIEVEN = Object.keys(BIJV_ZWAK_VORMEN_ENKEL);

const INSTELLING_KLINKER_KEY = "adhnn_klinkerspelling";

function haalKlinkerspellingOp() {
  return localStorage.getItem(INSTELLING_KLINKER_KEY) === "dubbel" ? "dubbel" : "enkel";
}

function zetKlinkerspelling(waarde) {
  localStorage.setItem(INSTELLING_KLINKER_KEY, waarde === "dubbel" ? "dubbel" : "enkel");
}

function bijvVormenTabel() {
  return haalKlinkerspellingOp() === "dubbel" ? BIJV_ZWAK_VORMEN_DUBBEL : BIJV_ZWAK_VORMEN_ENKEL;
}

function bijvNaamwoordVorm(adjectief, geslacht, geval) {
  const uitgang = ZWAK_BIJV_UITGANGEN[geval][geslacht];
  return bijvVormenTabel()[adjectief][uitgang];
}

// Elk woord krijgt willekeurig één bijvoeglijk naamwoord toegewezen, maar wel
// steeds hetzelfde voor alle 4 vragen van dat woord. De keuze wordt op het
// woordobject zelf onthouden.
function kiesBijvoeglijkNaamwoord(woordObj) {
  if (!woordObj._bijvNaamwoord) {
    woordObj._bijvNaamwoord = BIJV_ZWAK_ADJECTIEVEN[Math.floor(Math.random() * BIJV_ZWAK_ADJECTIEVEN.length)];
  }
  return woordObj._bijvNaamwoord;
}

// Het zelfstandig naamwoord zelf verbuigt exact zoals bij het bepaalde
// lidwoord (zwakke/sterke genitief enz.).
function naamwoordVormVoorZin(woordObj, geval) {
  if (geval === "nominatief") return stamVorm(woordObj);
  if (geval === "genitief") return genitiefVorm(woordObj);
  return obliekeVorm(woordObj);
}

function vormenBijvZwak(woordObj) {
  const adjectief = kiesBijvoeglijkNaamwoord(woordObj);
  const g = woordObj.geslacht;
  const det = ARTIKELEN[g];
  const resultaat = {};
  CASES.forEach((geval) => {
    resultaat[geval] = `${det[geval]} ${bijvNaamwoordVorm(adjectief, g, geval)}`;
  });
  // Bij de datief onzijdig werd ook al de onverbogen vorm ("het goede")
  // gebruikt naast de volledig verbogen vorm ("den goeden").
  if (g === "o") {
    resultaat.datief = [resultaat.datief, `het ${bijvNaamwoordVorm(adjectief, g, "nominatief")}`];
  }
  return resultaat;
}

function titelBijvZwak(woordObj) {
  return `${kiesBijvoeglijkNaamwoord(woordObj)} + ${woordObj.woord} (${woordObj.geslacht})`;
}

function zinsdelenBijvZwak(woordObj, geval) {
  const noun = naamwoordVormVoorZin(woordObj, geval);
  const hint = `lidwoord + bijvoeglijk naamwoord: ${kiesBijvoeglijkNaamwoord(woordObj)}`;
  if (geval === "nominatief") {
    return { prefix: "", suffix: noun, hint };
  }
  if (geval === "genitief") {
    return { prefix: "De naam", suffix: noun, hint };
  }
  if (geval === "datief") {
    if (isPersoon(woordObj)) {
      return { prefix: "Ik geef", suffix: `${noun} een geschenk`, hint };
    }
    return { prefix: "Hij spreekt van", suffix: noun, hint };
  }
  if (geval === "accusatief") {
    return { prefix: "Ik zie", suffix: noun, hint };
  }
}

// In "hele zin"-modus moet het zelfstandig naamwoord (dat soms óók verandert,
// bv. de genitief "paleizes") exact kloppen, net als de kritieke naamvalsvorm
// zelf — alleen de echt vaste woorden eromheen krijgen typfout-coulance.
function volledigeZinConfigBijvZwak(woordObj, geval) {
  const g = woordObj.geslacht;
  const modernDet = ARTIKELEN[g].nominatief; // modern lidwoord verbuigt niet
  const modernAdj = BIJV_ZWAK_VORMEN_ENKEL[kiesBijvoeglijkNaamwoord(woordObj)].e; // modern: altijd enkele klinker, altijd -e
  const modernNoun = woordObj.woord;
  const noun = naamwoordVormVoorZin(woordObj, geval);

  function bouw(modernPrefix, prefix, extraVast) {
    const suffixDelen = [
      { tekst: noun, kritiek: true },
      ...(extraVast ? extraVast.split(" ").map((t) => ({ tekst: t, kritiek: false })) : []),
    ];
    const moderneZin = [modernPrefix, modernDet, modernAdj, modernNoun, extraVast]
      .filter(Boolean)
      .join(" ");
    return { prefix, suffixDelen, moderneZin };
  }

  if (geval === "nominatief") return bouw("Dit is", "Dit is", "");
  if (geval === "genitief") return bouw("De naam van", "De naam", "");
  if (geval === "datief") {
    if (isPersoon(woordObj)) return bouw("Ik geef", "Ik geef", "een geschenk");
    return bouw("Hij spreekt van", "Hij spreekt van", "");
  }
  if (geval === "accusatief") return bouw("Ik zie", "Ik zie", "");
}

// --- Bijvoeglijke naamwoorden: sterke verbuiging (zonder lidwoord) ---
// Zonder lidwoord, aanwijzend of bezittelijk voornaamwoord ervoor neemt het
// bijvoeglijk naamwoord zelf de sterkere, "lidwoord-achtige" uitgang over.
// Onzijdig nominatief/accusatief blijft daarbij helemaal onverbogen ("goed").
const STERK_BIJV_UITGANGEN = {
  nominatief: { m: "e", v: "e", o: "" },
  genitief: { m: "s", v: "er", o: "s" },
  datief: { m: "en", v: "er", o: "en" },
  accusatief: { m: "en", v: "e", o: "" },
};

function bijvNaamwoordVormSterk(adjectief, geslacht, geval) {
  const uitgang = STERK_BIJV_UITGANGEN[geval][geslacht];
  if (uitgang === "") return adjectief;
  if (uitgang === "s") return adjectief + "s"; // medeklinker-uitgang: geen klinker-aanpassing nodig
  if (uitgang === "er") return bijvVormenTabel()[adjectief].e.slice(0, -1) + "er"; // zelfde klinkerregel als bij -e
  return bijvVormenTabel()[adjectief][uitgang]; // "e" of "en": identiek aan de zwakke vorm
}

function vormenBijvSterk(woordObj) {
  const adjectief = kiesBijvoeglijkNaamwoord(woordObj);
  const g = woordObj.geslacht;
  const resultaat = {};
  CASES.forEach((geval) => {
    resultaat[geval] = bijvNaamwoordVormSterk(adjectief, g, geval);
  });
  return resultaat;
}

function titelBijvSterk(woordObj) {
  return `${kiesBijvoeglijkNaamwoord(woordObj)} + ${woordObj.woord} (${woordObj.geslacht})`;
}

function zinsdelenBijvSterk(woordObj, geval) {
  const noun = naamwoordVormVoorZin(woordObj, geval);
  const hint = `bijvoeglijk naamwoord (zonder lidwoord): ${kiesBijvoeglijkNaamwoord(woordObj)}`;
  if (geval === "nominatief") {
    return { prefix: "", suffix: noun, hint };
  }
  if (geval === "genitief") {
    return { prefix: "De naam", suffix: noun, hint };
  }
  if (geval === "datief") {
    if (isPersoon(woordObj)) {
      return { prefix: "Ik geef", suffix: `${noun} een geschenk`, hint };
    }
    return { prefix: "Hij spreekt van", suffix: noun, hint };
  }
  if (geval === "accusatief") {
    return { prefix: "Ik zie", suffix: noun, hint };
  }
}

// De moderne zin gebruikt (zoals modern Nederlands vereist) wél een lidwoord;
// het historische antwoord laat het juist expres weg — dat is de kern van
// deze categorie.
function volledigeZinConfigBijvSterk(woordObj, geval) {
  const g = woordObj.geslacht;
  const modernDet = ARTIKELEN[g].nominatief;
  const modernAdj = BIJV_ZWAK_VORMEN_ENKEL[kiesBijvoeglijkNaamwoord(woordObj)].e;
  const modernNoun = woordObj.woord;
  const noun = naamwoordVormVoorZin(woordObj, geval);

  function bouw(modernPrefix, prefix, extraVast) {
    const suffixDelen = [
      { tekst: noun, kritiek: true },
      ...(extraVast ? extraVast.split(" ").map((t) => ({ tekst: t, kritiek: false })) : []),
    ];
    const moderneZin = [modernPrefix, modernDet, modernAdj, modernNoun, extraVast]
      .filter(Boolean)
      .join(" ");
    return { prefix, suffixDelen, moderneZin };
  }

  if (geval === "nominatief") return bouw("Hij geldt als", "Hij geldt als", "");
  if (geval === "genitief") return bouw("De naam van", "De naam", "");
  if (geval === "datief") {
    if (isPersoon(woordObj)) return bouw("Ik geef", "Ik geef", "een geschenk");
    return bouw("Hij spreekt van", "Hij spreekt van", "");
  }
  if (geval === "accusatief") return bouw("Ik zie", "Ik zie", "");
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
