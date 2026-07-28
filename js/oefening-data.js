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
  // Accusatief-vorm van het zelfstandig naamwoord zelf (los van het
  // lidwoord): blijft altijd de kale stam.
  return woordObj.woord;
}

// Correcte -e vorm voor de woorden waarbij het woordenbestand ("datief_e")
// aangeeft dat de volle historische datief op -e natuurlijk is. Net als bij
// ZWAKKE_VORMEN en BIJV_ZWAK_VORMEN_ENKEL is dit met de hand afgeleid met
// de gewone Nederlandse spellingregels: klinkerverdubbeling die wegvalt in
// een open lettergreep ("zoon" -> "zone", net als het meervoud "zonen"),
// s/f die stemhebbend worden ("huis" -> "huize", "brief" -> "brieve") en
// waar nodig medeklinkerverdubbeling ("man" -> "manne").
const DATIEF_E_VORMEN = {
  man: "manne",
  zoon: "zone",
  broer: "broere",
  heer: "here",
  graaf: "grave",
  vorst: "vorste",
  prins: "prinse",
  held: "helde",
  boer: "boere",
  mens: "mense",
  knaap: "knape",
  dag: "dage",
  tijd: "tijde",
  nacht: "nachte",
  berg: "berge",
  steen: "stene",
  boom: "bome",
  weg: "wege",
  troon: "trone",
  brief: "brieve",
  muur: "mure",
  stoel: "stoele",
  arm: "arme",
  voet: "voete",
  huis: "huize",
  land: "lande",
  rijk: "rijke",
  dorp: "dorpe",
  volk: "volke",
  kind: "kinde",
  hart: "harte",
  hoofd: "hoofde",
  woord: "woorde",
  geld: "gelde",
  goud: "goude",
  brood: "brode",
  licht: "lichte",
  vuur: "vure",
  bloed: "bloede",
  boek: "boeke",
  veld: "velde",
};

// Sommige mannelijke/onzijdige woorden kregen in de datief enkelvoud van
// nature ook een extra -e ("den goeden gelde"), andere bleven kaal ("den
// goeden man"); vrouwelijke woorden krijgen sowieso geen uitgang. Het veld
// "datief_e" in het woordenbestand geeft dit per woord aan. Is de -e
// natuurlijk, dan worden beide vormen (mét en zonder -e) goedgerekend.
function datiefVormen(woordObj) {
  if (woordObj.geslacht !== "v" && woordObj.datief_e) {
    return [DATIEF_E_VORMEN[woordObj.woord] || `${woordObj.woord}e`, woordObj.woord];
  }
  return [woordObj.woord];
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
    datief: datiefVormen(woordObj).map((v) => `${artikelen.datief} ${v}`),
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
    datief: datiefVormen(woordObj).map((v) => `${artikelen.datief} ${v}`),
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
// lidwoord (zwakke/sterke genitief enz.). Geeft de primaire (weer te geven)
// vorm terug — bij de datief dus de vorm mét -e als die natuurlijk is.
function naamwoordVormVoorZin(woordObj, geval) {
  if (geval === "nominatief") return stamVorm(woordObj);
  if (geval === "genitief") return genitiefVorm(woordObj);
  if (geval === "datief") return datiefVormen(woordObj)[0];
  return obliekeVorm(woordObj);
}

// Zelfde als hierboven, maar geeft alle geaccepteerde varianten terug (voor
// de exacte match in zin-modus, waar zowel mét als zonder -e goed moet
// worden gerekend).
function naamwoordVormenVoorZin(woordObj, geval) {
  if (geval === "datief") return datiefVormen(woordObj);
  return [naamwoordVormVoorZin(woordObj, geval)];
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
  return `${kiesBijvoeglijkNaamwoord(woordObj)} + ${woordObj.woord}${geslachtSuffix(woordObj.geslacht)}`;
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
  const noun = naamwoordVormenVoorZin(woordObj, geval);

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
// De sterke verbuiging komt in natuurlijk Nederlands alleen voor bij
// stofnamen en abstracta, die (in tegenstelling tot telbare zelfstandige
// naamwoorden zoals "visser" of "koning") ook zonder lidwoord een grammaticaal
// correcte zin vormen ("Goud is kostbaar", niet "Visser is sterk"). Deze
// categorie gebruikt daarom een kleinere, aparte woordenlijst.
const STERK_GESCHIKTE_WOORDEN = [
  "bloed", "goud", "water", "vuur", "brood", "licht",
  "trouw", "deugd", "macht", "kracht", "hoop", "gunst",
  "kunst", "liefde", "vreugde", "waarheid", "goedheid",
  "vrijheid", "wijsheid", "schoonheid", "geld", "leven",
  "geloof", "gevoel", "taal", "tijd",
];

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
  return `${kiesBijvoeglijkNaamwoord(woordObj)} + ${woordObj.woord}${geslachtSuffix(woordObj.geslacht)}`;
}

function zinsdelenBijvSterk(woordObj, geval) {
  const noun = naamwoordVormVoorZin(woordObj, geval);
  const hint = `bijvoeglijk naamwoord: ${kiesBijvoeglijkNaamwoord(woordObj)}`;
  if (geval === "nominatief") {
    return { prefix: "", suffix: `${noun} is nodig`, hint };
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

// Deze categorie draait juist om het weglaten van het lidwoord — dat geldt
// dus ook voor de moderne zin. Bij een de-woord blijft het bijvoeglijk
// naamwoord zonder lidwoord toch "-e" (goede koning), bij een het-woord
// onverbogen (goed kind) — precies zoals modern Nederlands een bijvoeglijk
// naamwoord zonder lidwoord al behandelt.
function volledigeZinConfigBijvSterk(woordObj, geval) {
  const g = woordObj.geslacht;
  const adjectief = kiesBijvoeglijkNaamwoord(woordObj);
  const modernAdj = g === "o" ? adjectief : BIJV_ZWAK_VORMEN_ENKEL[adjectief].e;
  const modernNoun = woordObj.woord;
  const noun = naamwoordVormenVoorZin(woordObj, geval);

  function bouw(modernPrefix, prefix, extraVast) {
    const suffixDelen = [
      { tekst: noun, kritiek: true },
      ...(extraVast ? extraVast.split(" ").map((t) => ({ tekst: t, kritiek: false })) : []),
    ];
    const moderneZinTekst = [modernPrefix, modernAdj, modernNoun, extraVast]
      .filter(Boolean)
      .join(" ");
    const moderneZin = moderneZinTekst.charAt(0).toUpperCase() + moderneZinTekst.slice(1);
    return { prefix, suffixDelen, moderneZin };
  }

  if (geval === "nominatief") return bouw("", "", "is nodig");
  if (geval === "genitief") return bouw("De naam van", "De naam", "");
  if (geval === "datief") {
    if (isPersoon(woordObj)) return bouw("Ik geef", "Ik geef", "een geschenk");
    return bouw("Hij spreekt van", "Hij spreekt van", "");
  }
  if (geval === "accusatief") return bouw("Ik zie", "Ik zie", "");
}

// --- Bijvoeglijke naamwoorden: gemengde verbuiging (na "een") ---
// Een mix: bij onzijdig blijven nominatief/accusatief onverbogen, net als bij
// de sterke verbuiging (het onbepaald lidwoord draagt daar geen
// naamvalsmarkering) — maar genitief/datief (en bij mannelijk ook de
// nominatief) krijgen de zwakke -e/-en-uitgang.
const GEMENGD_BIJV_UITGANGEN = {
  nominatief: { m: "e", v: "e", o: "" },
  genitief: { m: "en", v: "e", o: "en" },
  datief: { m: "en", v: "e", o: "en" },
  accusatief: { m: "en", v: "e", o: "" },
};

function bijvNaamwoordVormGemengd(adjectief, geslacht, geval) {
  const uitgang = GEMENGD_BIJV_UITGANGEN[geval][geslacht];
  if (uitgang === "") return adjectief;
  return bijvVormenTabel()[adjectief][uitgang]; // "e" of "en": identiek aan de zwakke vorm
}

function vormenBijvGemengd(woordObj) {
  const adjectief = kiesBijvoeglijkNaamwoord(woordObj);
  const g = woordObj.geslacht;
  const det = ONBEPAALD_ARTIKELEN[g];
  const resultaat = {};
  CASES.forEach((geval) => {
    resultaat[geval] = `${det[geval]} ${bijvNaamwoordVormGemengd(adjectief, g, geval)}`;
  });
  return resultaat;
}

function titelBijvGemengd(woordObj) {
  return `${kiesBijvoeglijkNaamwoord(woordObj)} + ${woordObj.woord}${geslachtSuffix(woordObj.geslacht)}`;
}

function zinsdelenBijvGemengd(woordObj, geval) {
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

function volledigeZinConfigBijvGemengd(woordObj, geval) {
  const g = woordObj.geslacht;
  const adjectief = kiesBijvoeglijkNaamwoord(woordObj);
  const modernDet = "een"; // modern onbepaald lidwoord verbuigt niet
  // Modern Nederlands: na "een" krijgt het bijvoeglijk naamwoord alleen "-e"
  // bij een de-woord; bij een het-woord blijft het onverbogen ("een oud gevoel").
  const modernAdj = g === "o" ? adjectief : BIJV_ZWAK_VORMEN_ENKEL[adjectief].e;
  const modernNoun = woordObj.woord;
  const noun = naamwoordVormenVoorZin(woordObj, geval);

  function bouw(modernPrefix, prefix, extraVast) {
    const suffixDelen = [
      { tekst: noun, kritiek: true },
      ...(extraVast ? extraVast.split(" ").map((t) => ({ tekst: t, kritiek: false })) : []),
    ];
    const moderneZinTekst = [modernPrefix, modernDet, modernAdj, modernNoun, extraVast]
      .filter(Boolean)
      .join(" ");
    const moderneZin = moderneZinTekst.charAt(0).toUpperCase() + moderneZinTekst.slice(1);
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

// --- Persoonlijke voornaamwoorden ---
// Geen woordenlijst dit keer, maar een vaste set personen. "zij" (enkelvoud)
// en "zij" (meervoud) zien er in modern Nederlands identiek uit maar hebben
// een andere historische verbuiging, dus die staan als twee aparte items met
// een verduidelijkend label.
const PERSOONLIJKE_VOORNAAMWOORDEN = [
  {
    id: "ik",
    label: "ik",
    werkwoordVorm: "loop",
    modernSubject: "ik",
    modernObject: "mij",
    vorm: () => ({ nominatief: "ik", genitief: "mijner", datief: "mij", accusatief: "mij" }),
  },
  {
    id: "jij",
    label: "jij",
    werkwoordVorm: "loopt",
    // "du" vervoegt met -st (du loopst), net als in het Duits/Engels ("thou
    // walkest") — dat is een andere uitgang dan de -t van "gij" (gij loopt).
    historischWerkwoordVorm: () => (haalArchaischDuOp() ? "loopst" : "loopt"),
    modernSubject: "jij",
    modernObject: "jou",
    vorm: () =>
      haalArchaischDuOp()
        ? { nominatief: "du", genitief: ["dijner", "diner"], datief: ["di", "dij"], accusatief: ["di", "dij"] }
        : { nominatief: "gij", genitief: "uwer", datief: "u", accusatief: "u" },
  },
  {
    id: "u",
    label: "u",
    werkwoordVorm: "loopt",
    historischWerkwoordVorm: () => (haalArchaischDuOp() ? "loopst" : "loopt"),
    modernSubject: "u",
    modernObject: "u",
    vorm: () =>
      haalArchaischDuOp()
        ? { nominatief: "du", genitief: ["dijner", "diner"], datief: ["di", "dij"], accusatief: ["di", "dij"] }
        : { nominatief: "gij", genitief: "uwer", datief: "u", accusatief: "u" },
  },
  {
    id: "hij",
    label: "hij",
    werkwoordVorm: "loopt",
    modernSubject: "hij",
    modernObject: "hem",
    vorm: () => ({ nominatief: "hij", genitief: "zijner", datief: "hem", accusatief: "hem" }),
  },
  {
    id: "zij-ev",
    label: "zij (enkelvoud)",
    werkwoordVorm: "loopt",
    modernSubject: "zij",
    modernObject: "haar",
    vorm: () => ({ nominatief: "zij", genitief: "harer", datief: "haar", accusatief: "haar" }),
  },
  {
    id: "het",
    label: "het",
    werkwoordVorm: "loopt",
    modernSubject: "het",
    modernObject: "het",
    vorm: () => ({ nominatief: "het", genitief: "zijner", datief: "het", accusatief: "het" }),
  },
  {
    id: "wij",
    label: "wij",
    werkwoordVorm: "lopen",
    modernSubject: "wij",
    modernObject: "ons",
    vorm: () =>
      haalArchaischWijliedenOp()
        ? {
            nominatief: "wijlieden",
            genitief: ["onzer", "onzelieder"],
            datief: ["ons", "onslieden"],
            accusatief: ["ons", "onslieden"],
          }
        : { nominatief: "wij", genitief: "onzer", datief: "ons", accusatief: "ons" },
  },
  {
    id: "jullie",
    label: "jullie",
    werkwoordVorm: "lopen",
    // "gij" vervoegt historisch enkelvoudig ("gij loopt"), ook waar het "jullie"
    // vervangt — alleen het archaïsche "gijlieden" is echt meervoud ("gijlieden lopen").
    historischWerkwoordVorm: () => (haalArchaischGijliedenOp() ? "lopen" : "loopt"),
    modernSubject: "jullie",
    modernObject: "jullie",
    vorm: () =>
      haalArchaischGijliedenOp()
        ? {
            nominatief: "gijlieden",
            genitief: ["uwer", "ulieder"],
            datief: ["u", "ulieden"],
            accusatief: ["u", "ulieden"],
          }
        : { nominatief: "gij", genitief: "uwer", datief: "u", accusatief: "u" },
  },
  {
    id: "zij-mv",
    label: "zij (meervoud)",
    werkwoordVorm: "lopen",
    modernSubject: "zij",
    // In modern Nederlands is er een naamvalsonderscheid overgebleven: "hun"
    // als meewerkend voorwerp (datief), "hen" als lijdend voorwerp
    // (accusatief) of na een voorzetsel (genitief-zin "denkt aan hen").
    modernObject: { genitief: "hen", datief: "hun", accusatief: "hen" },
    vorm: () => ({ nominatief: "zij", genitief: "hunner", datief: "hun", accusatief: "hen" }),
  },
];

function laadPersoonlijkeVoornaamwoorden() {
  return Promise.resolve(PERSOONLIJKE_VOORNAAMWOORDEN);
}

function vormenPersoonlijk(item) {
  return item.vorm();
}

function titelPersoonlijk(item) {
  return item.label;
}

function historischWerkwoordVormVoor(item) {
  return item.historischWerkwoordVorm ? item.historischWerkwoordVorm() : item.werkwoordVorm;
}

function zinsdelenPersoonlijk(item, geval) {
  if (geval === "nominatief") {
    return { prefix: "", suffix: `${historischWerkwoordVormVoor(item)} hard` };
  }
  if (geval === "genitief") {
    return { prefix: "Men gedenke", suffix: "" };
  }
  if (geval === "datief") {
    return { prefix: "Zij geeft", suffix: "een geschenk" };
  }
  if (geval === "accusatief") {
    return { prefix: "Zij ziet", suffix: "" };
  }
}

// De genitief-zin gebruikt bewust een ander werkwoord in de moderne vorm
// ("denkt aan") dan in de historische vorm ("gedenke"): een genitief-
// voornaamwoord zonder voorzetsel bestaat in modern Nederlands namelijk niet
// meer, dus de "vertaling" zit hier ook al deels in het werkwoord zelf.
function modernObjectVoor(item, geval) {
  return typeof item.modernObject === "object" ? item.modernObject[geval] : item.modernObject;
}

function volledigeZinConfigPersoonlijk(item, geval) {
  function bouw(modernZin, prefix, suffix, suffixDelen) {
    return {
      prefix,
      suffix,
      suffixDelen,
      moderneZin: modernZin.charAt(0).toUpperCase() + modernZin.slice(1),
    };
  }

  if (geval === "nominatief") {
    // Het werkwoord is naamvals-/instellingsafhankelijk (du/gij/gijlieden
    // vervoegen elk anders), dus dat woord moet in zin-modus exact kloppen
    // en mag niet als "kleine typefout" worden goedgekeurd.
    const historischeVorm = historischWerkwoordVormVoor(item);
    return bouw(
      `${item.modernSubject} ${item.werkwoordVorm} hard`,
      "",
      `${historischeVorm} hard`,
      [
        { tekst: historischeVorm, kritiek: true },
        { tekst: "hard", kritiek: false },
      ],
    );
  }
  if (geval === "genitief") {
    return bouw(`men denkt aan ${modernObjectVoor(item, "genitief")}`, "Men gedenke", "");
  }
  if (geval === "datief") {
    return bouw(
      `zij geeft ${modernObjectVoor(item, "datief")} een geschenk`,
      "Zij geeft",
      "een geschenk",
    );
  }
  if (geval === "accusatief") {
    return bouw(`zij ziet ${modernObjectVoor(item, "accusatief")}`, "Zij ziet", "");
  }
}

// --- Instellingen (opgeslagen in localStorage, gelden voor alle oefeningen) ---
const INSTELLING_MODUS_KEY = "adhnn_modus";

function haalModusOp() {
  return localStorage.getItem(INSTELLING_MODUS_KEY) === "zin" ? "zin" : "deel";
}

function zetModus(modus) {
  localStorage.setItem(INSTELLING_MODUS_KEY, modus === "zin" ? "zin" : "deel");
}

const INSTELLING_GESLACHT_KEY = "adhnn_toon_geslacht";

function haalToonGeslachtOp() {
  return localStorage.getItem(INSTELLING_GESLACHT_KEY) !== "uit";
}

function zetToonGeslacht(tonen) {
  localStorage.setItem(INSTELLING_GESLACHT_KEY, tonen ? "aan" : "uit");
}

// Gebruikt door elke titelfunctie die het geslacht na het zelfstandig
// naamwoord toont, zodat de "geslacht tonen"-instelling overal hetzelfde
// werkt.
function geslachtSuffix(geslacht) {
  return haalToonGeslachtOp() ? ` (${geslacht})` : "";
}

// Drie onafhankelijke instellingen om archaïsche/dialectische vormen wel of
// niet mee te nemen bij de persoonlijke voornaamwoorden. Allemaal standaard
// uit.
const INSTELLING_ARCHAISCH_DU_KEY = "adhnn_archaisch_du";
const INSTELLING_ARCHAISCH_GIJLIEDEN_KEY = "adhnn_archaisch_gijlieden";
const INSTELLING_ARCHAISCH_WIJLIEDEN_KEY = "adhnn_archaisch_wijlieden";

function haalArchaischDuOp() {
  return localStorage.getItem(INSTELLING_ARCHAISCH_DU_KEY) === "aan";
}
function zetArchaischDu(aan) {
  localStorage.setItem(INSTELLING_ARCHAISCH_DU_KEY, aan ? "aan" : "uit");
}

function haalArchaischGijliedenOp() {
  return localStorage.getItem(INSTELLING_ARCHAISCH_GIJLIEDEN_KEY) === "aan";
}
function zetArchaischGijlieden(aan) {
  localStorage.setItem(INSTELLING_ARCHAISCH_GIJLIEDEN_KEY, aan ? "aan" : "uit");
}

function haalArchaischWijliedenOp() {
  return localStorage.getItem(INSTELLING_ARCHAISCH_WIJLIEDEN_KEY) === "aan";
}
function zetArchaischWijlieden(aan) {
  localStorage.setItem(INSTELLING_ARCHAISCH_WIJLIEDEN_KEY, aan ? "aan" : "uit");
}

// De genitief van persoonlijke voornaamwoorden komt in natuurlijk Nederlands
// nog maar zelden voor, dus is die standaard uitgeschakeld.
const INSTELLING_GENITIEF_VNW_KEY = "adhnn_genitief_voornaamwoorden";

function haalToonGenitiefVnwOp() {
  return localStorage.getItem(INSTELLING_GENITIEF_VNW_KEY) === "aan";
}
function zetToonGenitiefVnw(aan) {
  localStorage.setItem(INSTELLING_GENITIEF_VNW_KEY, aan ? "aan" : "uit");
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
