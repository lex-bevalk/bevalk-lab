
  /* ================= Product Experience Lab · estado y casos ================= */
  // Cinco dimensiones independientes: flujo (state.flow) · plan (world().plan, preferencia state.labPlan)
  // · entorno (offline, bio, camPerm, notiPerm, labFail) · caso (state.lab.case) · rol familiar (state.fam.role).
  labFlows(){ return FLOWS; }
  labScenJSON(){ return JSON.stringify(SCEN); }
  labF(){ return FLOWS.find(f => f.id === this.state.flow) || null; }
  labD(id){ return LAB[id || this.state.flow] || null; }
  labN(f){ const i = FLOWS.indexOf(f); return i < 0 ? "" : "F" + String(i + 1).padStart(2, "0"); }
  labAllowed(f){ const d = f ? LAB[f.id] : null; return d && d.plans ? d.plans : ["free", "premium"]; }
  labPref(){ return this.state.labPlan || this.world().plan || "premium"; }
  labPlanFor(f){ const al = this.labAllowed(f), p = this.labPref(); return al.indexOf(p) >= 0 ? p : al[0]; }
  labCase(){ const d = this.labD(), id = this.state.lab.case; return d && id ? (d.cases || []).find(x => x.id === id) || null : null; }
  // Componer la modalidad sobre un escenario base, con la misma regla que activatePremium:
  // pasar a Premium no pone datos en vigilancia; volver a Freemium restaura los 4 avisos del mes.
  planWorld(w, plan){
    if (!plan || w.plan === plan) return w;
    w.plan = plan;
    w.alertsLeft = plan === "premium" ? 99 : 4;
    return w;
  }
  labW(fn){ const w = JSON.parse(JSON.stringify(this.world())); fn(w); this.setState({world:w}); }
  labSetSimPlan(plan){
    const nw = this.planWorld(JSON.parse(JSON.stringify(this.world())), plan);
    this.setState({labPlan:plan, simPlan:plan, world: this.state.world ? nw : null});
    this.animateTo(this.scoreOf(nw));
  }
  labNet(key, msg){ this.setState({netBlock:key}); this.showToast(msg); this.say(msg); }
  anFail(){
    const f = this.state.labFail;
    if (f === "once") { this.setState({labFail:null}); return true; }
    if (f === "always") return true;
    return !!this.props.falloAnalisis;
  }
  labLabSet(patch){ this.setState(st => ({lab: Object.assign({}, st.lab, patch)})); }
  labEnvSnap(){ const s = this.state; return {offline:s.offline, bio:s.bio, bioOk:s.bioOk, camPerm:s.camPerm, notiPerm:s.notiPerm, autoOn:s.autoOn}; }

  labSelect(f, opts){
    const o = opts || {};
    const plan = o.plan || this.labPlanFor(f);
    const d = LAB[f.id] || {};
    const key = (d.alt && d.alt[plan]) || f.scen;
    const fam = d.famByPlan && d.famByPlan[plan] ? d.famByPlan[plan] : null;
    const pref = this.labPref();
    if (!o.keepCase && this.state.lab.snap) this.setState(Object.assign({}, this.state.lab.snap));
    this.setState(st => ({labPlan: st.labPlan || pref, netBlock:null, labFail: null, toast:null,
      lab: Object.assign({}, st.lab, o.nav ? {tab:"info"} : {}, {view:"flow", case: o.keepCase ? st.lab.case : null, reached:{}, armed:{}, prepping:false,
        snap: o.keepCase ? st.lab.snap : null, notice: o.notice || null})}));
    this.selectFlow(fam ? Object.assign({}, f, {fam}) : f, key, plan);
    if (!o.keepScroll) this.later(() => { const el = document.querySelector('[data-lab-center]'); if (el) el.scrollTop = 0; }, 0);
  }

  labStartCase(id, opts){
    const o = opts || {};
    const f = this.labF(), d = this.labD();
    if (!f || !d) return;
    const cs = (d.cases || []).find(x => x.id === id);
    if (!cs) return;
    const al = cs.plans || this.labAllowed(f);
    let plan = this.labPlanFor(f);
    if (al.indexOf(plan) < 0) plan = al[0];
    const snap = this.state.lab.case && this.state.lab.snap ? this.state.lab.snap : this.labEnvSnap();
    this.setState(Object.assign({}, snap));
    if (o.explicitPlan) this.setState({labPlan:plan});
    this.labSelect(f, {plan, keepCase:true, keepScroll:true});
    this.setState(st => ({lab: Object.assign({}, st.lab, {case:id, reached:{0:1}, armed:{}, prepping:true, snap, tab:"phone", pv:"open", notice: o.notice || null})}));
    this.later(() => {
      try { cs.prep(this); } catch (e) { console.error("[lab] prep", id, e); }
      this.later(() => this.labLabSet({prepping:false}), 80);
    }, 40);
    this.later(() => { const el = document.getElementById("lab-case-detail"); if (el && el.scrollIntoView) el.scrollIntoView({block:"nearest", behavior:"smooth"}); }, 120);
  }
  labExitCase(){
    const f = this.labF();
    if (!f) return;
    this.labSelect(f, {keepScroll:true});
  }
  labTrack(){
    const L = this.state.lab;
    if (!L || !L.case || L.prepping) return;
    const cs = this.labCase();
    if (!cs || !cs.steps || !cs.steps.length) return;
    const s = this.state;
    const armed = Object.assign({}, L.armed), reached = Object.assign({}, L.reached);
    let ch = false;
    const vals = cs.steps.map(st => { try { return !!st.ok(s, this); } catch (e) { return false; } });
    vals.forEach((v, k) => { if (!v && !armed[k + 1]) { armed[k + 1] = 1; ch = true; } });
    for (let k = 1; k <= cs.steps.length; k++) {
      if (!reached[k] && reached[k - 1] && armed[k] && vals[k - 1]) { reached[k] = 1; ch = true; }
    }
    if (ch) this.setState({lab: Object.assign({}, L, {armed, reached})});
  }
  labPickPlan(p){
    const f = this.labF();
    const L = this.state.lab;
    if (f && this.labAllowed(f).indexOf(p) < 0) {
      return this.labLabSet({notice: this.labN(f) + " solo existe en " + LAB_PLAN_NAME[this.labAllowed(f)[0]] + ". " + ((LAB[f.id] || {}).pinWhy || "") + " Tu elección se aplicará en los demás flujos."});
    }
    if (this.world().plan === p && this.state.labPlan === p) return;
    if (!f) return this.labSetSimPlan(p);
    const d = LAB[f.id] || {};
    if (L.case) {
      const cs = this.labCase(); const al = (cs && cs.plans) || this.labAllowed(f);
      this.setState({labPlan:p});
      if (al.indexOf(p) >= 0) return this.later(() => this.labStartCase(L.case, {notice:"Caso reiniciado en " + LAB_PLAN_NAME[p] + "."}), 0);
      return this.later(() => this.labSelect(f, {plan:p, keepScroll:true, notice:"«" + (cs ? cs.t : "El caso") + "» solo aplica a " + LAB_PLAN_NAME[al[0]] + ". Hemos vuelto al flujo normal en " + LAB_PLAN_NAME[p] + "."}), 0);
    }
    if (d.alt || d.famByPlan) {
      this.setState({labPlan:p});
      return this.later(() => this.labSelect(f, {plan:p, keepScroll:true, notice:"En " + LAB_PLAN_NAME[p] + " este flujo parte de otro estado, así que lo hemos reiniciado."}), 0);
    }
    this.labSetSimPlan(p);
  }
  labLoose(k){
    const pl = (SCEN[k] || {}).plan;
    this.setState(st => ({labPlan: pl || st.labPlan, simPlan: pl || null, netBlock:null, labFail:null, toast:null,
      lab: Object.assign({}, st.lab, {view:"loose", loose:k, case:null, reached:{}, armed:{}, notice:null})}));
    this.setScen(k, pl);
    this.setState({flow:null, les:null, from:"home", fam: Object.assign(FAM0(), {role:"none"}), br: BR0(false), cases:[], alDone:{}, autoOn:false});
  }
  labStage = el => {
    if (this._stEl === el) return;
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
    this._stEl = el;
    if (!el || typeof ResizeObserver === "undefined") return;
    this._ro = new ResizeObserver(() => this.labFit());
    this._ro.observe(el);
    this.labFit();
  };
  labFit(){
    const el = this._stEl;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width < 60 || r.height < 60) return;
    const sc = Math.max(0.45, Math.min(1, (r.width - 16) / 393, (r.height - 8) / 852));
    const v = Math.floor(sc * 1000) / 1000;
    if (Math.abs(v - (this.state.labScale || 1)) > 0.003) this.setState({labScale:v});
  }

  labVals(){
    const s = this.state, L = s.lab, f = this.labF(), d = this.labD();
    const w = this.world(), plan = w.plan;
    const norm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const q = norm(L.q || "").trim();
    const allowed = f ? this.labAllowed(f) : ["free", "premium"];
    const pin = allowed.length === 1;
    const sevOf = k => LAB_SEV[k] || LAB_SEV.low;
    const caseCount = id => ((LAB[id] || {}).cases || []).length;

    /* ---- navegación ---- */
    const groups = [];
    FLOWS.forEach((fl, i) => {
      const dd = LAB[fl.id] || {};
      const hay = norm([fl.label, fl.sub, fl.group, dd.desc, dd.role, dd.stage].join(" "));
      if (q && hay.indexOf(q) < 0) return;
      let g = groups.find(x => x.label === fl.group);
      if (!g) { g = {label: fl.group, items: []}; groups.push(g); }
      const on = fl.id === s.flow, pl = dd.plans && dd.plans.length === 1 ? dd.plans[0] : null, n = caseCount(fl.id);
      g.items.push({n: String(i + 1).padStart(2, "0"), label: fl.label, current: on ? "page" : "false",
        aria: "Flujo " + (i + 1) + ": " + fl.label + (pl ? ", solo " + LAB_PLAN_NAME[pl] : "") + (n ? ", " + n + (n === 1 ? " caso extremo" : " casos extremos") : ""),
        bg: on ? "var(--purple-50)" : "transparent", hover: on ? "var(--purple-50)" : "var(--neutral-100)",
        fg: on ? "var(--color-primary)" : "var(--neutral-900)", font: (on ? "600" : "500") + " 0.8125rem/1.125rem var(--font-sans)",
        numBg: on ? "var(--color-primary)" : "var(--neutral-100)", numFg: on ? "#FFFFFF" : "var(--neutral-700)",
        hasPin: !!pl, pin: pl === "premium" ? "Premium" : "Free", pinTitle: pl ? "Solo " + LAB_PLAN_NAME[pl] : "",
        hasCases: n > 0, cases: String(n),
        select: () => this.labSelect(fl, {nav:true})});
    });
    groups.forEach(g => { g.n = String(g.items.length); });
    const nav = {
      count: FLOWS.length + " flujos · " + FLOWS.reduce((a, x) => a.indexOf(x.group) < 0 ? a.concat([x.group]) : a, []).length + " grupos",
      q: L.q || "", hasQ: !!(L.q || ""), setQ: e => this.labLabSet({q: e.target.value}), clearQ: () => this.labLabSet({q:""}),
      groups, empty: groups.length === 0,
      plans: ["free", "premium"].map(k => {
        const on = plan === k, dis = allowed.indexOf(k) < 0;
        return {label: LAB_PLAN_NAME[k], icon: k === "premium" ? "crown" : "shield", on: on ? "true" : "false", disabled: dis ? "true" : "false",
          bg: on ? "var(--white)" : "transparent", fg: on ? "var(--color-primary)" : dis ? "var(--neutral-500)" : "var(--neutral-700)",
          bd: on ? "var(--purple-200)" : "transparent", sh: on ? "0 1px 2px rgba(10,10,10,.08)" : "none",
          cursor: dis ? "not-allowed" : "pointer", op: dis && !on ? "0.7" : "1",
          title: dis ? "No disponible en este flujo" : "Simular " + LAB_PLAN_NAME[k],
          pick: () => this.labPickPlan(k)};
      }),
      hasPinNote: !!f && pin, pinNote: f && pin ? "Este flujo solo existe en " + LAB_PLAN_NAME[allowed[0]] + (this.labPref() !== allowed[0] ? ". Tu selección (" + LAB_PLAN_NAME[this.labPref()] + ") vuelve en los demás flujos." : ".") : ""
    };

    /* ---- caso activo ---- */
    const cur = this.labCase();
    const reached = L.reached || {};
    const stepsN = cur && cur.steps ? cur.steps.length : 0;
    const doneN = cur ? Object.keys(reached).filter(k => k !== "0" && reached[k]).length : 0;
    const resolved = !!cur && stepsN > 0 && doneN >= stepsN;
    const curState = !cur ? "" : cur.obs ? "Caso de observación" : resolved ? "Resuelto" : doneN > 0 ? "En curso" : L.prepping ? "Preparando" : "Preparado";
    const cards = d ? (d.cases || []).map((c, i) => {
      const sv = sevOf(c.sev), al = c.plans || allowed, ok = al.indexOf(plan) >= 0, act = !!cur && cur.id === c.id;
      return {code: this.labN(f) + "·C" + (i + 1), t: c.t, d: c.d, cat: c.cat, sev: sv.label, sevIcon: sv.icon, sevFg: sv.fg, sevBg: sv.bg, sevBd: sv.bd,
        plans: al.length === 2 ? "Ambos planes" : "Solo " + LAB_PLAN_NAME[al[0]], obs: !!c.obs,
        bd: act ? "var(--color-primary)" : "var(--neutral-200)", sh: act ? "0 0 0 3px var(--purple-50)" : "none",
        expanded: act ? "true" : "false",
        btn: act ? "Caso activo" : ok ? (c.obs ? "Preparar" : "Probar caso") : "Probar en " + LAB_PLAN_NAME[al[0]],
        btnIcon: act ? "radio" : ok ? "play" : "repeat",
        btnBg: act ? "var(--purple-50)" : ok ? "var(--color-primary)" : "var(--white)",
        btnFg: act ? "var(--color-primary)" : ok ? "#FFFFFF" : "var(--neutral-900)",
        btnBd: act ? "var(--purple-200)" : ok ? "var(--color-primary)" : "var(--neutral-300)",
        st: act ? curState : "",
        stFg: act && resolved ? "var(--green-700)" : "var(--neutral-600)",
        go: () => act ? this.labLabSet({tab:"phone", pv:"open"}) : this.labStartCase(c.id, {explicitPlan: !ok,
          notice: ok ? null : "Has cambiado a " + LAB_PLAN_NAME[al[0]] + " para probar este caso. Tu selección se mantiene así hasta que la cambies."})};
    }) : [];
    const firstOpen = cur && cur.steps ? cur.steps.findIndex((x, k) => !reached[k + 1]) : -1;
    const journey = cur && cur.steps && cur.steps.length ? [{l:"Estado inicial preparado", done: !L.prepping}].concat(cur.steps.map((x, k) => ({l:x.l, done: !!reached[k + 1]}))).map((x, k) => {
      const isCur = !x.done && (k === 0 ? true : k - 1 === firstOpen);
      return {l:x.l, current: isCur ? "step" : "false", state: x.done ? "hecho" : isCur ? "siguiente" : "pendiente",
        bar: x.done ? "var(--color-primary)" : isCur ? "var(--purple-200)" : "var(--neutral-200)",
        fg: x.done ? "var(--neutral-950)" : isCur ? "var(--color-primary)" : "var(--neutral-600)",
        icon: x.done ? "circle-check" : isCur ? "circle-dot" : "circle"};
    }) : [];
    const cs = {
      active: !!cur, none: !!d && !(d.cases || []).length,
      noneWhy: "Este flujo no necesita casos extremos adicionales: su comportamiento excepcional ya está cubierto por otros flujos.",
      summary: d ? (() => { const list = d.cases || []; if (!list.length) return "Sin casos";
        const crit = list.filter(x => x.sev === "critical").length, high = list.filter(x => x.sev === "high").length;
        return list.length + (list.length === 1 ? " caso" : " casos") + (crit ? " · " + crit + " critical" : "") + (high ? " · " + high + " high" : ""); })() : "",
      cards,
      cur: cur ? {
        code: this.labN(f) + "·C" + ((d.cases || []).indexOf(cur) + 1), t: cur.t, cat: cur.cat,
        st: curState, stIcon: resolved ? "circle-check" : cur.obs ? "eye" : "flask-conical",
        stBg: resolved ? "var(--green-50)" : "var(--purple-50)", stFg: resolved ? "var(--green-700)" : "var(--color-primary)",
        hasSteps: stepsN > 0, journey,
        progress: cur.obs ? "Observa el móvil" : resolved ? "Resuelto · " + doneN + " de " + stepsN + " pasos observados" : doneN + " de " + stepsN + " pasos observados",
        facts: [["Escenario", cur.scen, "map-pin"], ["Trigger", cur.trig, "mouse-pointer-click"], ["Comportamiento esperado", cur.exp, "badge-check"],
          ["Recuperación", cur.rec, "life-buoy"], ["Estado final", cur.end, "flag"]].map(x => ({k:x[0], v:x[1], icon:x[2]})),
        ac: (cur.ac || []).map(t => ({t})),
        hasFire: !!cur.fire, fireLabel: cur.fire ? cur.fire.label : "",
        hint: cur.obs ? "Caso de observación: el estado está preparado en el móvil. Compruébalo a simple vista; no se marca como resuelto automáticamente."
          : resolved ? "Todos los pasos se han observado en el simulador." : firstOpen >= 0 && cur.steps[firstOpen] ? "Siguiente: " + cur.steps[firstOpen].l + ". Hazlo en el móvil." : ""
      } : {code:"", t:"", cat:"", st:"", stIcon:"circle", stBg:"", stFg:"", hasSteps:false, journey:[], progress:"", facts:[], ac:[], hasFire:false, fireLabel:"", hint:""},
      fire: () => { if (cur && cur.fire) { try { cur.fire.run(this); } catch (e) { console.error("[lab] fire", e); } } },
      reset: () => cur && this.labStartCase(cur.id),
      exit: () => this.labExitCase()
    };

    /* ---- ficha ---- */
    const planName = LAB_PLAN_NAME[plan];
    const fl = f && d ? (() => {
      const pd = d.plan || {same:true, note:""};
      const money = d.money ? [["Momento de descubrimiento", d.money.moment], ["Necesidad", d.money.need], ["Diferencia funcional", d.money.diff],
        ["Oportunidad de upgrade", d.money.opp], ["Riesgo UX del bloqueo", d.money.risk], ["Si no convierte", d.money.noConvert]].map(x => ({k:x[0], v:x[1]})) : [];
      const acBy = i => ((LAB_AC_BY[f.id] || [])[i]) || "";
      const acVer = i => !!acBy(i) && !!LAB_QA.cases[f.id + "." + acBy(i)];
      return {
        id: this.labN(f), group: f.group, stage: d.stage || "", title: f.label, desc: d.desc || f.sub, tip: f.tip,
        meta: [{k:"Rol", v: d.role || "", icon:"user-round"}, {k:"Disponible en", v: pin ? "Solo " + LAB_PLAN_NAME[allowed[0]] : "Freemium y Premium", icon:"layers"},
          {k:"Objetivo", v: d.value ? d.value.dim : "", icon:"target"}, {k:"Casos", v: String((d.cases || []).length), icon:"flask-conical"}],
        story: d.story || {as:"", want:"", so:""},
        ctx: d.ctx ? [{k:"Problema", v:d.ctx.problem}, {k:"Necesidad", v:d.ctx.need}, {k:"Resultado esperado", v:d.ctx.result}] : [],
        value: {dim: d.value ? d.value.dim : "", why: d.value ? d.value.why : "", icon: LAB_VALUE_ICON[d.value ? d.value.dim : ""] || "sparkles"},
        planNow: planName,
        pl: {hasPin: pin, pinTitle: pin ? "Solo " + LAB_PLAN_NAME[allowed[0]] : "", pinWhy: d.pinWhy || "",
          same: !!pd.same && !pin, diff: !pd.same, note: pd.note || "", up: pd.up || "", data: pd.data || "",
          cols: pd.same ? [] : [["free", pd.free || []], ["premium", pd.prem || []]].map(x => ({name: LAB_PLAN_NAME[x[0]], now: plan === x[0],
            icon: x[0] === "premium" ? "crown" : "shield", ic: x[0] === "premium" ? "var(--color-primary)" : "var(--neutral-700)",
            bd: plan === x[0] ? "var(--color-primary)" : "var(--neutral-200)", sh: plan === x[0] ? "0 0 0 3px var(--purple-50)" : "none",
            items: x[1].map(t => ({t}))}))},
        hasMoney: money.length > 0, money,
        ac: (d.ac || []).map((a, i) => ({n: String(i + 1).padStart(2, "0"), g:a.g, w:a.w, t:a.t,
          st: a.st === "gap" ? "Sin implementar" : acVer(i) ? "Verificado · " + this.labN(f) + "·" + acBy(i).toUpperCase() : "Implementado · sin prueba automatizada",
          stBg: a.st === "gap" ? "var(--red-50)" : acVer(i) ? "var(--green-50)" : "var(--neutral-100)",
          stFg: a.st === "gap" ? "var(--red-700)" : acVer(i) ? "var(--green-800)" : "var(--neutral-700)"})),
        acCount: String((d.ac || []).length)
      };
    })() : null;
    const blankFl = {id:"", group:"", stage:"", title:"", desc:"", tip:"", meta:[], story:{as:"", want:"", so:""}, ctx:[], value:{dim:"", why:"", icon:"sparkles"},
      planNow:"", pl:{hasPin:false, pinTitle:"", pinWhy:"", same:false, diff:false, note:"", up:"", data:"", cols:[]}, hasMoney:false, money:[], ac:[], acCount:"0"};

    /* ---- portada ---- */
    const allCases = FLOWS.reduce((a, x) => a.concat(((LAB[x.id] || {}).cases || []).map(c => Object.assign({fid:x.id}, c))), []);
    const loose = L.view === "loose" && !f;
    const welcome = {
      eyebrow: loose ? "Estado suelto" : "BeValk · Product Experience Lab",
      title: loose ? ((SCEN[L.loose] || {}).label || "Estado libre") : "Explora, compara y pon a prueba cada flujo",
      body: loose ? "Has cargado un estado de la protección sin flujo guiado. Usa el móvil libremente o elige un flujo para ver su ficha, sus diferencias de plan y sus casos extremos."
        : "Elige un flujo en la lista: el móvil se reinicia en ese punto y aquí verás para quién es, por qué existe, qué cambia entre Freemium y Premium y qué pasa cuando el camino feliz falla.",
      stats: [{v: String(FLOWS.length), l:"flujos"}, {v: String(nav.count.split("·")[1]).trim().split(" ")[0], l:"grupos funcionales"},
        {v: String(allCases.filter(c => !c.obs).length), l:"casos ejecutables"}, {v: String(allCases.filter(c => c.obs).length), l:"casos de observación"}],
      how: [{n:"1", t:"Elige un flujo", d:"El móvil arranca en ese punto con su escenario."}, {n:"2", t:"Fija la modalidad", d:"Freemium o Premium se mantiene al cambiar de flujo."},
        {n:"3", t:"Prueba un caso extremo", d:"Prepara el estado y sigue los pasos en el móvil."}, {n:"4", t:"Vuelve al flujo normal", d:"Restaura el entorno con un toque."}],
      starts: ["nuevo", "tope", "famadmin"].map(id => { const x = FLOWS.find(y => y.id === id);
        return {id: this.labN(x), group: x.group, label: x.label, why: {nuevo:"El primer contacto: cuánto pide antes de enseñar valor.", tope:"El límite gratuito sin dejar a nadie desprotegido.", famadmin:"El núcleo de Mi Familia: responder con seguridad."}[id], go: () => this.labSelect(x, {nav:true})}; }),
      qaNote: "Implementados: casos conectados al prototipo. Verificados: casos cuyo recorrido completo se ejecutó con éxito en la batería automática del " + LAB_QA.date + ". Los casos de observación no se cuentan como verificados.",
      rows: FLOWS.map(x => { const dd = LAB[x.id] || {}, list = dd.cases || [];
        return {id: this.labN(x), label: x.label, plan: dd.plans && dd.plans.length === 1 ? "Solo " + LAB_PLAN_NAME[dd.plans[0]] : "Ambos",
          cases: String(list.length), impl: String(list.filter(c => !c.obs).length), ver: String(list.filter(c => LAB_QA.cases[x.id + "." + c.id]).length),
          go: () => this.labSelect(x)}; })
    };

    /* ---- entorno ---- */
    const swv = on => ({checked: on ? "true" : "false", track: on ? "var(--color-primary)" : "var(--neutral-300)", justify: on ? "flex-end" : "flex-start"});
    const radio = (label, cur0, opts, pick) => ({label, opts: opts.map(o => { const on = cur0 === o;
      return {label:o, on: on ? "true" : "false", bd: on ? "var(--color-primary)" : "var(--neutral-300)", bg: on ? "var(--purple-50)" : "var(--white)",
        fg: on ? "var(--color-primary)" : "var(--neutral-800)", pick: () => pick(o)}; })});
    const failOn = !!s.labFail || !!this.props.falloAnalisis;
    const env = {
      switches: [
        Object.assign({label:"Sin conexión", sub:"El móvil pierde la red", icon:"wifi-off", toggle: () => this.setState({offline: !this.off()})}, swv(this.off())),
        Object.assign({label:"Face ID para Mi huella", sub:"Pide desbloqueo antes de ver filtraciones", icon:"scan-face", toggle: () => this.setState({bio: !this.bioOn(), bioOk:false})}, swv(this.bioOn())),
        Object.assign({label:"Fallo del servicio de análisis", sub:"Cada análisis falla hasta apagarlo", icon:"server-crash", toggle: () => this.setState({labFail: failOn ? null : "always"})}, swv(failOn))
      ],
      radios: [
        radio("Permiso de cámara", this.camPerm(), ["Sin preguntar", "Concedido", "Denegado"], o => this.setState({camPerm:o})),
        radio("Permiso de avisos del móvil", this.notiPerm(), ["Sin preguntar", "Concedido", "Denegado"], o => this.setState({notiPerm:o}))
      ],
      actions: [
        {label:"Entrar desde un aviso push", icon:"bell-ring", go: () => this.setState({screen:"alertas", push:true, from:"home", sheet:null, les:null})},
        {label:"Ir a Inicio", icon:"house", go: () => this.go("home")}
      ],
      more: FLOW_MORE.map(k => { const on = L.view === "loose" && L.loose === k && !f;
        return {label: SCEN[k].label, on: on ? "true" : "false", bd: on ? "var(--color-primary)" : "var(--neutral-300)", bg: on ? "var(--purple-50)" : "var(--white)", select: () => this.labLoose(k)}; }),
      summary: [this.off() ? "Sin conexión" : "", this.bioOn() ? "Face ID" : "", failOn ? "Fallo de servicio" : "", this.camPerm() === "Denegado" ? "Cámara denegada" : "", this.notiPerm() === "Denegado" ? "Avisos denegados" : ""].filter(Boolean).join(" · ") || "Condiciones normales"
    };

    /* ---- cabecera del preview ---- */
    const chips = [];
    if (this.off()) chips.push({label:"Sin conexión", icon:"wifi-off", aria:"Quitar sin conexión", off: () => this.setState({offline:false})});
    if (failOn) chips.push({label:"Fallo de servicio", icon:"server-crash", aria:"Quitar fallo de servicio", off: () => this.setState({labFail:null})});
    if (this.bioOn()) chips.push({label:"Face ID", icon:"scan-face", aria:"Quitar Face ID", off: () => this.setState({bio:false, bioOk:false})});
    if (this.camPerm() === "Denegado") chips.push({label:"Cámara denegada", icon:"camera-off", aria:"Restablecer permiso de cámara", off: () => this.setState({camPerm:null})});
    if (this.notiPerm() === "Denegado") chips.push({label:"Avisos denegados", icon:"bell-off", aria:"Restablecer permiso de avisos", off: () => this.setState({notiPerm:null})});

    const sc = s.labScale || 1;
    const tabs = [["flows", "Flujos", "list"], ["info", "Ficha", "file-text"], ["phone", "Móvil", "smartphone"]].map(t => { const on = (L.tab || "info") === t[0];
      return {label:t[1], icon:t[2], on: on ? "true" : "false", bg: on ? "var(--purple-50)" : "transparent", fg: on ? "var(--color-primary)" : "var(--neutral-700)",
        pick: () => this.labLabSet({tab:t[0]})}; });
    return {
      tab: L.tab || "info", pv: L.pv === "open" ? "open" : "closed", tabs,
      nav, cs, env,
      hasFlow: !!fl, fl: fl || blankFl, isWelcome: !fl,
      welcome,
      crumbs: fl ? [{label: f.group, current:"false", fg:"var(--neutral-600)"}, {label: fl.id + " · " + f.label, current:"page", fg:"var(--neutral-950)"}]
        : [{label: loose ? "Estado suelto" : "Portada", current:"page", fg:"var(--neutral-950)"}],
      hasNotice: !!L.notice, notice: L.notice || "", dismissNotice: () => this.labLabSet({notice:null}),
      goHome: () => { this.labLabSet({view:"welcome", case:null, notice:null, tab:"info"}); this.setState({flow:null}); if (L.snap) this.setState(Object.assign({}, L.snap)); },
      restartFlow: () => f && this.labSelect(f, {keepScroll:true}),
      tryFlow: () => { if (f) this.labSelect(f, {keepScroll:true}); this.labLabSet({pv:"open", tab:"phone"}); },
      closePv: () => this.labLabSet({pv:"closed"}),
      pvh: {plan: planName, planBg: plan === "premium" ? "var(--color-primary)" : "var(--neutral-200)", planFg: plan === "premium" ? "#FFFFFF" : "var(--neutral-900)",
        flow: fl ? fl.id + " · " + f.label : loose ? (SCEN[L.loose] || {}).label || "Estado suelto" : "Estado inicial del prototipo", chips},
      stageRef: this.labStage,
      scale: String(sc), pw: Math.round(393 * sc) + "px", ph: Math.round(852 * sc) + "px"
    };
  }
