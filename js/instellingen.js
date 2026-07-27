const params = new URLSearchParams(window.location.search);
const volgende = params.get("volgende") || "index.html";

const huidigeModus = haalModusOp();
document.querySelector(`input[name="modus"][value="${huidigeModus}"]`).checked = true;

const huidigeGeslacht = haalToonGeslachtOp() ? "aan" : "uit";
document.querySelector(`input[name="geslacht"][value="${huidigeGeslacht}"]`).checked = true;

const klinkerFieldset = document.getElementById("klinker-fieldset");
const heeftBijvoeglijkeNaamwoorden = volgende.startsWith("bijvoeglijk-naamwoord");
klinkerFieldset.hidden = !heeftBijvoeglijkeNaamwoorden;
if (heeftBijvoeglijkeNaamwoorden) {
  const huidigeKlinker = haalKlinkerspellingOp();
  document.querySelector(`input[name="klinker"][value="${huidigeKlinker}"]`).checked = true;
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
  const geslachtTonen = document.querySelector('input[name="geslacht"]:checked').value === "aan";
  zetToonGeslacht(geslachtTonen);
  if (heeftBijvoeglijkeNaamwoorden) {
    const klinker = document.querySelector('input[name="klinker"]:checked').value;
    zetKlinkerspelling(klinker);
  }
  window.location.href = volgende;
});
