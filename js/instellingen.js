const params = new URLSearchParams(window.location.search);
const volgende = params.get("volgende") || "index.html";

const huidigeModus = haalModusOp();
document.querySelector(`input[name="modus"][value="${huidigeModus}"]`).checked = true;

const geslachtFieldset = document.getElementById("geslacht-fieldset");
const heeftGeslacht =
  volgende === "bepaald-lidwoord.html" ||
  volgende === "onbepaald-lidwoord.html" ||
  volgende === "bezittelijke-voornaamwoorden.html" ||
  volgende.startsWith("bijvoeglijk-naamwoord");
geslachtFieldset.hidden = !heeftGeslacht;
if (heeftGeslacht) {
  const huidigeGeslacht = haalToonGeslachtOp() ? "aan" : "uit";
  document.querySelector(`input[name="geslacht"][value="${huidigeGeslacht}"]`).checked = true;
}

// Geldt voor precies dezelfde categorieën als de geslachtsinstelling: elke
// oefening met een zelfstandig naamwoord. De "modernere vorm met het"-optie
// is alleen zinvol waar er ook echt een den/het-keuze bestaat (bepaald
// lidwoord zelf en de zwakke verbuiging, die dat lidwoord ook gebruikt) —
// bij onbepaald lidwoord, sterke/gemengde verbuiging en bezittelijke
// voornaamwoorden bestaat dat den/het-onderscheid niet, dus daar wordt die
// optie verborgen (en gedraagt hij zich, mocht hij toch nog opgeslagen
// staan, identiek aan "vervoegen volgens de regels").
const datiefVormFieldset = document.getElementById("datief-vorm-fieldset");
datiefVormFieldset.hidden = !heeftGeslacht;
const heeftModernDatiefVorm =
  volgende === "bepaald-lidwoord.html" || volgende === "bijvoeglijk-naamwoord-zwak.html";
document.getElementById("datief-vorm-modern-optie").hidden = !heeftModernDatiefVorm;
if (heeftGeslacht) {
  let huidigeDatiefVorm = haalDatiefVormOp();
  if (huidigeDatiefVorm === "modern" && !heeftModernDatiefVorm) {
    huidigeDatiefVorm = "tabel";
  }
  document.querySelector(`input[name="datief-vorm"][value="${huidigeDatiefVorm}"]`).checked = true;
}

const klinkerFieldset = document.getElementById("klinker-fieldset");
const heeftBijvoeglijkeNaamwoorden = volgende.startsWith("bijvoeglijk-naamwoord");
klinkerFieldset.hidden = !heeftBijvoeglijkeNaamwoorden;
if (heeftBijvoeglijkeNaamwoorden) {
  const huidigeKlinker = haalKlinkerspellingOp();
  document.querySelector(`input[name="klinker"][value="${huidigeKlinker}"]`).checked = true;
}

// "Du" i.p.v. "gij" is ook relevant bij bezittelijke voornaamwoorden
// ("dijn" i.p.v. "uw"); "gijlieden"/"wijlieden" gelden vooralsnog alleen bij
// de persoonlijke voornaamwoorden zelf, dus die twee opties worden verborgen
// als ze niets doen — anders zou de instelling verwarrend lijken.
const archaischFieldset = document.getElementById("archaisch-fieldset");
const heeftDu =
  volgende === "persoonlijke-voornaamwoorden.html" || volgende === "bezittelijke-voornaamwoorden.html";
const heeftGijliedenWijlieden = volgende === "persoonlijke-voornaamwoorden.html";
const heeftArchaischeVormen = heeftDu || heeftGijliedenWijlieden;
archaischFieldset.hidden = !heeftArchaischeVormen;
document.getElementById("archaisch-du-optie").hidden = !heeftDu;
document.getElementById("archaisch-gijlieden-optie").hidden = !heeftGijliedenWijlieden;
document.getElementById("archaisch-wijlieden-optie").hidden = !heeftGijliedenWijlieden;
if (heeftDu) {
  document.querySelector('input[name="archaisch-du"]').checked = haalArchaischDuOp();
}
if (heeftGijliedenWijlieden) {
  document.querySelector('input[name="archaisch-gijlieden"]').checked = haalArchaischGijliedenOp();
  document.querySelector('input[name="archaisch-wijlieden"]').checked = haalArchaischWijliedenOp();
}

const genitiefVnwFieldset = document.getElementById("genitief-vnw-fieldset");
const heeftGenitiefVnw = volgende === "persoonlijke-voornaamwoorden.html";
genitiefVnwFieldset.hidden = !heeftGenitiefVnw;
if (heeftGenitiefVnw) {
  const huidigeGenitiefVnw = haalToonGenitiefVnwOp() ? "aan" : "uit";
  document.querySelector(`input[name="genitief-vnw"][value="${huidigeGenitiefVnw}"]`).checked = true;
}

const tijdSlider = document.getElementById("tijd-slider");
const tijdWaardeGetal = document.getElementById("tijd-waarde-getal");
const tijdWaarschuwing = document.getElementById("tijd-waarschuwing");
const beginKnop = document.getElementById("begin-knop");

function werkTijdWeergaveBij() {
  const minuten = parseInt(tijdSlider.value, 10);
  tijdWaardeGetal.textContent = minuten;
  const geldig = minuten >= 1;
  tijdWaarschuwing.hidden = geldig;
  beginKnop.disabled = !geldig;
}

// De slider start elke keer weer op 15 minuten (het midden), in plaats van
// de vorige keuze te onthouden. Dit moet ook gebeuren wanneer de pagina uit
// de bfcache van de browser komt (bv. na "Terug naar startscherm" en
// opnieuw op een oefening klikken), want dan draait dit script niet
// opnieuw en kan de browser zelf de oude schuifpositie herstellen.
function resetTijdSlider() {
  tijdSlider.value = "15";
  werkTijdWeergaveBij();
}

resetTijdSlider();
window.addEventListener("pageshow", resetTijdSlider);

tijdSlider.addEventListener("input", werkTijdWeergaveBij);

document.getElementById("instellingen-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const minuten = parseInt(tijdSlider.value, 10);
  if (minuten < 1) return;
  const gekozen = document.querySelector('input[name="modus"]:checked').value;
  zetModus(gekozen);
  zetTijdslimiet(minuten);
  if (heeftGeslacht) {
    const geslachtTonen = document.querySelector('input[name="geslacht"]:checked').value === "aan";
    zetToonGeslacht(geslachtTonen);
    const datiefVorm = document.querySelector('input[name="datief-vorm"]:checked').value;
    zetDatiefVorm(datiefVorm);
  }
  if (heeftBijvoeglijkeNaamwoorden) {
    const klinker = document.querySelector('input[name="klinker"]:checked').value;
    zetKlinkerspelling(klinker);
  }
  if (heeftDu) {
    zetArchaischDu(document.querySelector('input[name="archaisch-du"]').checked);
  }
  if (heeftGijliedenWijlieden) {
    zetArchaischGijlieden(document.querySelector('input[name="archaisch-gijlieden"]').checked);
    zetArchaischWijlieden(document.querySelector('input[name="archaisch-wijlieden"]').checked);
  }
  if (heeftGenitiefVnw) {
    const genitiefTonen = document.querySelector('input[name="genitief-vnw"]:checked').value === "aan";
    zetToonGenitiefVnw(genitiefTonen);
  }
  window.location.href = volgende;
});
