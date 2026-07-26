const params = new URLSearchParams(window.location.search);
const volgende = params.get("volgende") || "index.html";

const huidigeModus = haalModusOp();
document.querySelector(`input[name="modus"][value="${huidigeModus}"]`).checked = true;

document.getElementById("instellingen-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const gekozen = document.querySelector('input[name="modus"]:checked').value;
  zetModus(gekozen);
  window.location.href = volgende;
});
