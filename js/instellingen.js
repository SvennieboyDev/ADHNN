const params = new URLSearchParams(window.location.search);
const volgende = params.get("volgende") || "index.html";

const huidigeModus = haalModusOp();
document.querySelector(`input[name="modus"][value="${huidigeModus}"]`).checked = true;

const geslachtFieldset = document.getElementById("geslacht-fieldset");
const heeftGeslacht =
  volgende === "bepaald-lidwoord.html" ||
  volgende === "onbepaald-lidwoord.html" ||
  volgende.startsWith("bijvoeglijk-naamwoord");
geslachtFieldset.hidden = !heeftGeslacht;
if (heeftGeslacht) {
  const huidigeGeslacht = haalToonGeslachtOp() ? "aan" : "uit";
  document.querySelector(`input[name="geslacht"][value="${huidigeGeslacht}"]`).checked = true;
}

// Geldt voor precies dezelfde categorieën als de geslachtsinstelling: elke
// oefening met een zelfstandig naamwoord.
const datiefVormFieldset = document.getElementById("datief-vorm-fieldset");
datiefVormFieldset.hidden = !heeftGeslacht;
if (heeftGeslacht) {
  const huidigeDatiefVorm = haalDatiefVormOp();
  document.querySelector(`input[name="datief-vorm"][value="${huidigeDatiefVorm}"]`).checked = true;
}

const klinkerFieldset = document.getElementById("klinker-fieldset");
const heeftBijvoeglijkeNaamwoorden = volgende.startsWith("bijvoeglijk-naamwoord");
klinkerFieldset.hidden = !heeftBijvoeglijkeNaamwoorden;
if (heeftBijvoeglijkeNaamwoorden) {
  const huidigeKlinker = haalKlinkerspellingOp();
  document.querySelector(`input[name="klinker"][value="${huidigeKlinker}"]`).checked = true;
}

const archaischFieldset = document.getElementById("archaisch-fieldset");
const heeftArchaischeVormen = volgende === "persoonlijke-voornaamwoorden.html";
archaischFieldset.hidden = !heeftArchaischeVormen;
if (heeftArchaischeVormen) {
  document.querySelector('input[name="archaisch-du"]').checked = haalArchaischDuOp();
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
  if (heeftArchaischeVormen) {
    zetArchaischDu(document.querySelector('input[name="archaisch-du"]').checked);
    zetArchaischGijlieden(document.querySelector('input[name="archaisch-gijlieden"]').checked);
    zetArchaischWijlieden(document.querySelector('input[name="archaisch-wijlieden"]').checked);
  }
  if (heeftGenitiefVnw) {
    const genitiefTonen = document.querySelector('input[name="genitief-vnw"]:checked').value === "aan";
    zetToonGenitiefVnw(genitiefTonen);
  }
  window.location.href = volgende;
});
