startOefening({
  vormenFn: vormenPersoonlijk,
  zinsdelenFn: zinsdelenPersoonlijk,
  volledigeZinConfigFn: volledigeZinConfigPersoonlijk,
  titelFn: titelPersoonlijk,
  woordenBronFn: laadPersoonlijkeVoornaamwoorden,
  casesFn: () => (haalToonGenitiefVnwOp() ? CASES : CASES.filter((c) => c !== "genitief")),
});
