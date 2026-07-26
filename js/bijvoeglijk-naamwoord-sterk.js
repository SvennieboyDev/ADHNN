startOefening({
  vormenFn: vormenBijvSterk,
  zinsdelenFn: zinsdelenBijvSterk,
  volledigeZinConfigFn: volledigeZinConfigBijvSterk,
  titelFn: titelBijvSterk,
  woordenFilterFn: (w) => STERK_GESCHIKTE_WOORDEN.includes(w.woord),
});
