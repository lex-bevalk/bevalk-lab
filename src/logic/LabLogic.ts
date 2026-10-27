// @ts-nocheck
// Copied from Main.dc.html lines 6715-10611; runtime-only methods paint/waitLucide are no-ops in phase 2.2.
import { DCLogic } from './DCLogic';
import { BASE, VIG, FINDINGS, ACT, SCEN, FLOWS, FLOW_MORE, LESSON_PTS, LESSONS, GUIDE, ALERTS, ALERT_TYPES, BR_SITES0, BR0, ALERT_INFO, NOTIS, AL_ITEMS, MARIA_FEATURES, MARIA_L3, MARIA_L2, MARIA_TOPICS, MARIA_CHATS, MARIA_TRANSCRIPT, AMBER, AMBER_LINE, AMBER_BG, AMBER_TEXT, ANALYZERS, AN_RECENTS, VERDICTS, AN_LEGEND, PZ_TYPE, PZ_BRANDS, PZ_WHAT, PZ_PLANS, HU_BULLETS, HU_KINDS, HU_LEAKS, AU0, OB0, OB_ZONAS, OB_EDADES, OB_TEMAS, OB_INTRO, OB_QS, OB_FINAL, richSegs, FAM_ROLES, FAM_MSGS, FAM_MOTIVES, FAM_CATS, FAM_CATS_MINE, FAM_PRICES, FAM_WHY, FAM_MEMBERS0, FAM_ADMIN_M, FAM_REQS0, FAM_SENT0, FAM_FAVS, FAM_MY_ITEMS, FAM_PETS0, FAM0, PF_CATS, PF_FEATS, PF_PLANS, PF_TOPICS, PF_REASONS, PF_CONSULTAS, PF_MONTHS, PR_ZONAS, PR_EDADES, PR_TEMAS, PR_FB, PR_LIMITS, PR_SEC, PR_MESES, PR_FA_APPS, PR_FA_KEY, PR_DEL, PR_FEATS, PR_BONUS, SOS_HELP, SOP_ASUNTOS, PW_COMMON, pwCommon, PR_PW_RULES, pwScore, pwOk, SCORE_STOPS, SCORE_BANDS, okLab, okHex, LAB_SEV, LAB_PLAN_NAME, LAB_VALUE_ICON, labTxt, labAuth, labLearned, labNoOff, LAB, LAB_AC_BY, LAB_QA } from '../data';
import { labTrack as pureLabTrack, planWorld as purePlanWorld, scoreColor } from './pure';

export class LabLogic extends DCLogic {
  state = {fam: FAM0(), br: BR0(false), cases:[], alDone:{}, autoOn:false, screen:"home", scen:null, world:null, shown:0, delta:0, actId:null, from:"home", flow:null, les:null, weekFresh:false,
    sheet:null, notiOff:{}, sessionDelta:0, prev:null, read:[],
    maria:{view:"intro", topic:null, msgs:[], node:null, rate:null}, toast:null,
    an:{type:"enlace", view:"welcome", value:"", verdict:"danger", used:0, seen:{}, dontShow:{},
      legend:false, report:false, reportText:"", reportKind:"", reportErr:false, reviewed:null, plan:"anual"},
    hu:{view:"picker", kind:"email", value:"", prefix:"+34", consent:false, declara:false,
      err:null, otp:"", attempts:0, resend:0, expired:false, taken:false, sending:false,
      items:[{kind:"email", value:"micorreo@empresa.com", added:"6 may 2026"}],
      done:{ad1:1, ad2:1, ad3:1, li3:1}, sel:0, leak:null, paso:null, fresh:false},
    guideOpen:{},
    splash:false, au: AU0(),
    pr:{view:"hub", ed:null, fb:{topic:"", text:"", err:{}}, telErr:false, avErr:false, cal:{open:false, m:0, y:1990}, sec:"", confirm:false,
      pw:{a:"", b:"", c:"", show:{}, err:{}}, del:{reason:"", other:"", err:{}}, fa:{step:"intro", code:"", err:null, n:0},
      zonas:{"Europa":1}, zonasSaved:{"Europa":1}, edad:"30-44", edadSaved:"30-44",
      temas:{compras:1, banca:1, redes:1, familia:1}, temasSaved:{compras:1, banca:1, redes:1, familia:1},
      plan:"mensual", sel:"mensual"},
    al:{view:"list", q:"", applied:"", tab:"todos", fav:{}, sel:null},
    sop:{asunto:"", desc:"", email:"micorreo@empresa.com", err:{}},
    sos:{view:"aviso", dontShow:false, help:"", service:"", desc:"", name:"", email:"micorreo@empresa.com", phone:"", consent:false, files:0, err:{}},
    ob:{step:1, tick:0, done:false}, live:"", offline:null, camPerm:null, notiPerm:null,
    bio:null, bioOk:false, push:false, obDone:false,
    pf:{view:"editar", nombre:"Elena", apellido:"Navarro", tel:"", fecha:"", avatar:"",
      err:null, errField:"", cal:false, calM:9, calY:1990, saved:false,
      cats:{compras:1, banca:1, redes:1}, plan:"basica",
      faView:"intro", faCode:"", faErr:null, faAttempts:0,
      mailMode:"pick", mailSel:"micorreo@empresa.com", mailNew:"", mailErr:null,
      pA:"", pB:"", pC:"", passErr:null,
      topic:"otros", msg:"", msgErr:null,
      delStep:"aviso", delReason:"", delOther:"", delConfirm:""},
    lab:{view:"welcome", case:null, reached:{}, armed:{}, prepping:false, snap:null, notice:null, q:"", tab:"info", pv:"closed", loose:null},
    labPlan:null, simPlan:null, labFail:null, netBlock:null, labScale:1};
  timers = [];

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
    return purePlanWorld(w, plan);
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
    const patch = pureLabTrack(this.state, this.state.lab, this.labCase(), this);
    if (patch) this.setState({lab: patch});
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


  componentDidMount(){
    this.paint(); this.waitLucide(); this.animateTo(this.scoreOf(this.world()));
    this.onKey = e => { if (e.key === "Escape") this.closeOverlays(); };
    window.addEventListener("keydown", this.onKey);
    if (this.props.primeraVez) this.setState({screen:"bienvenida", ob:{step:1, tick:0, done:false}});
    else if (this.props.desdeAviso) this.setState({screen:"alertas", push:true, from:"home"});
  }

  componentDidUpdate(prev, prevState){
    this.paint();
    const ps = prevState, cs = this.state;
    if (ps && ps.hu && ps.an && ps.maria && (ps.screen !== cs.screen || ps.hu.view !== cs.hu.view || ps.hu.paso !== cs.hu.paso
        || ps.an.view !== cs.an.view || ps.maria.view !== cs.maria.view || (ps.sos && cs.sos && ps.sos.view !== cs.sos.view) || (ps.al && cs.al && ps.al.view !== cs.al.view) || (ps.pr && cs.pr && ps.pr.view !== cs.pr.view) || (ps.fam && cs.fam && (ps.fam.view !== cs.fam.view || ps.fam.mid !== cs.fam.mid)) || (ps.les && cs.les && ps.les.i !== cs.les.i) || ps.pf !== cs.pf && ps.pf.view !== cs.pf.view))
    { document.querySelectorAll(".tp-scroll").forEach(el => { el.scrollTop = 0; });
      this.later(() => document.querySelectorAll(".tp-scroll").forEach(el => { el.scrollTop = 0; }), 0); }
    if (prev && prev.primeraVez !== this.props.primeraVez && this.props.primeraVez)
      this.setState({screen:"bienvenida", ob:{step:1, tick:0, done:false}, obDone:false});
    if (prev && prev.desdeAviso !== this.props.desdeAviso && this.props.desdeAviso)
      this.setState({screen:"alertas", push:true, from:"home"});
    if (prev && prev.miFamilia !== this.props.miFamilia) this.setState({fam: FAM0(), screen:"home", sheet:null});
    this.labTrack();
  }

  componentWillUnmount(){ this.clearT(); window.removeEventListener("keydown", this.onKey); if (this._ro) this._ro.disconnect(); }

  clearT(){ this.timers.forEach(clearTimeout); this.timers = []; }
  later(fn, ms){ this.timers.push(setTimeout(fn, ms)); }

  waitLucide(n){
  }

  paint(){
  }

  off(){ const v = this.state.offline; return v === null || v === undefined ? !!this.props.sinConexion : v; }
  camPerm(){ return this.state.camPerm || this.props.permisoCamara || "Sin preguntar"; }
  notiPerm(){ return this.state.notiPerm || this.props.permisoAvisos || "Sin preguntar"; }
  bioOn(){ const v = this.state.bio; return v === null || v === undefined ? !!this.props.bloqueoBiometrico : v; }

  closeOverlays(){
    const s = this.state;
    if (s.fam && s.fam.sheet) return this.famClose();
    if (s.sheet) return this.setState({sheet:null});
    if (s.an.legend || s.an.report) return this.anSet({legend:false, report:false});
    if (s.lab && s.lab.pv === "open") return this.labLabSet({pv:"closed"});
  }

  trapKey(e){
    if (e.key !== "Tab") return;
    const box = e.currentTarget;
    const items = box.querySelectorAll('button:not([disabled]),input,textarea,[href],[tabindex]:not([tabindex="-1"])');
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  globalBack(){
    const s = this.state;
    if (s.sheet || s.an.legend || s.an.report || (s.fam && s.fam.sheet)) return this.closeOverlays();
    if (s.screen === "home" || s.screen === "bienvenida") return;
    if (s.screen === "familia") return this.famBack();
    if (/anal/.test(s.screen)) return this.anBack();
    if (s.screen === "huflow") return this.huBack();
    if (/^pf/.test(s.screen)) return this.pfBack();
    return this.go(s.from || "home");
  }

  wbNext(){
    const st = this.state.ob;
    if (st.step === 1) return this.setState({ob:{step:2, tick:0, done:false}});
    if (st.step === 2) { this.setState({ob:{step:3, tick:0, done:false}}); return this.obRun(); }
    if (!st.done) return;
    this.setState({obDone:true, screen:"home"});
    this.animateTo(this.scoreOf(this.world()));
    this.say("Listo. Tu protección es " + this.scoreOf(this.world()) + " de 100.");
  }

  obRun(){
    [1,2,3,4].forEach((n, i) => this.later(() => {
      this.setState(s => ({ob: Object.assign({}, s.ob, {tick:n, done: n === 4})}));
      if (n === 4) this.say("Ya tenemos tu protección: " + this.scoreOf(this.world()) + " de 100.");
    }, 750 * (i + 1)));
  }

  scenKey(){ return this.state.scen || this.props.escenario || "prem-amitad"; }

  world(){
    if (this.state.world) return this.state.world;
    return this.planWorld(this.scenWorld(SCEN[this.scenKey()] || SCEN["prem-amitad"]), this.state.simPlan);
  }

  scenWorld(s){
    return {plan:s.plan, base:Object.assign({}, s.base), vig:Object.assign({}, s.vig || {}),
      done:(s.done || []).slice(), act:Object.assign({}, s.act || {}),
      alertsLeft: s.alertsLeft === undefined ? 99 : s.alertsLeft,
      weeks:s.weeks, freezes:s.freezes, lost:s.lost || 0, checked:s.checked, delta:s.delta,
      nuevo:!!s.nuevo, active:s.weeks > 0, huClean:!!s.huClean,
      learn:(s.learn || []).slice(), wk:Object.assign({}, s.wk || {})};
  }

  // Tu semana: tres tareas cortas (Protege · Aprende · Usa). Cada una se cumple con una acción real.
  weekSlots(w){
    const prem = w.plan === "premium";
    const wk = w.wk || {};
    const learned = w.learn || [];
    const fresh = a => { const d = w.act[a.id]; return w.nuevo || (d !== undefined && d !== null && d <= a.win); };
    const avail = a => (prem ? a.prem : a.free) > 0 && !(a.id === "alerta" && !prem && w.alertsLeft <= 0);
    // Una petición de ayuda de la familia es lo más importante que proteger esta semana.
    const fam = this.state.fam || {};
    const famReq = this.famRole() === "admin" ? (fam.reqs || []).find(r => !r.reply) : null;
    if (famReq) {
      const m = this.famMember(famReq.from) || {nick:"Alguien de tu familia"};
      return [
        {key:"protect", done:false, auto:false, item:{kind:"fam", pts:0, def:{id:famReq.id, title: m.nick + " te pide ayuda con un enlace", time:"1 min"}, req:famReq}},
        {key:"learn", done: !!wk.learn || !LESSONS.find(l => learned.indexOf(l.id) < 0), lesson: LESSONS.find(l => learned.indexOf(l.id) < 0)},
        (() => { const use = ACT.filter(a => a.id !== "alerta" && avail(a) && !fresh(a)).sort((a, b) => (prem ? b.prem - a.prem : b.free - a.free))[0] || ACT.find(a => a.id === "scan");
          return {key:"use", done: !!wk.use, act: use, fresh: fresh(use)}; })()
      ];
    }
    let pItem = this.pending(w).find(x => x.kind === "base" || x.kind === "vig" || x.kind === "step");
    if (!pItem) {
      const al = ACT.find(a => a.id === "alerta");
      if (avail(al) && !fresh(al)) pItem = {kind:"act", pts: prem ? al.prem : al.free, def:al, group:"Tu día a día", icon:"bell"};
    }
    const lesson = LESSONS.find(l => learned.indexOf(l.id) < 0);
    const use = ACT.filter(a => a.id !== "alerta" && avail(a) && !fresh(a))
      .sort((a, b) => (prem ? b.prem - a.prem : b.free - a.free))[0] || ACT.find(a => a.id === "scan");
    return [
      {key:"protect", done: !!wk.protect || !pItem, auto: !pItem, item: pItem},
      {key:"learn", done: !!wk.learn || !lesson, lesson},
      {key:"use", done: !!wk.use, act: use, fresh: fresh(use)}
    ];
  }
  weekCount(w){ return this.weekSlots(w).filter(x => x.done).length; }
  markWeek(w, it){
    w.wk = Object.assign({}, w.wk || {});
    if (it.kind === "learn") w.wk.learn = 1;
    else if (it.kind === "act" && it.def.id !== "alerta") w.wk.use = 1;
    else w.wk.protect = 1;
  }
  // La gracia del recién llegado se convierte en actividad real al hacer su primera acción.
  settleNuevo(w){
    if (w.nuevo) ACT.forEach(a => { if (w.act[a.id] === undefined || w.act[a.id] === null) w.act[a.id] = 0; });
    w.nuevo = false;
  }
  openItem(it){
    if (!it) return () => {};
    if (it.kind === "act") return it.def.id === "scan" ? () => this.anOpen("enlace") : () => this.go(it.def.screen, {from:"home"});
    if (it.kind === "learn") return () => this.openLesson(it.def.id);
    if (it.kind === "fam") return () => this.famSheet({kind:"reply", req:it.def.id, msg:null});
    return () => this.setState(st => ({screen:"pasos", actId:it.def.id, from:st.screen, sheet:null}));
  }
  bridgeOpen(b){
    if (b.to === "enlace") return () => this.anOpen("enlace");
    if (b.to === "sos") return () => this.sosOpen();
    if (b.to === "familia") return () => this.famOpen("home");
    return () => this.go(b.to, {from:"home"});
  }
  openLesson(id){
    this.setState(st => ({screen:"leccion", sheet:null,
      les:{id, i:0, pick:null, checked:false, from: st.screen === "leccion" ? ((st.les && st.les.from) || "aprende") : st.screen}}));
  }
  finishLesson(id){
    const w = this.world();
    if ((w.learn || []).indexOf(id) >= 0) {
      const nw = JSON.parse(JSON.stringify(w));
      const before = this.weekCount(nw);
      nw.wk = Object.assign({}, nw.wk, {learn:1});
      const after = this.weekCount(nw);
      this.setState({world:nw, screen:"aprende", les:null});
      this.showToast(after === 3 && before < 3 ? "Repaso hecho. Semana completa: 3 de 3." : "Repaso hecho. Lo aprendido no caduca.");
      return;
    }
    this.setState({les:null});
    this.complete(id);
  }
  selectFlow(f, scenOverride, plan){
    this.setScen(scenOverride || f.scen, plan);
    const fam0 = Object.assign(FAM0(), {role: f.fam || "none"});
    if (f.famClear) fam0.reqs = fam0.reqs.map(r => Object.assign({}, r, {reply:1}));
    if (f.famPatch) Object.assign(fam0, JSON.parse(JSON.stringify(f.famPatch)));
    this.setState(st => ({flow:f.id, les:null, bioOk:false, push:false, fam: fam0, from:"home",
      br: BR0(f.br === "fresh"), cases: f.cases ? JSON.parse(JSON.stringify(f.cases)) : [], alDone:{}, autoOn:false,
      maria:{view:"intro", topic:null, msgs:[], node:null, rate:null},
      an: Object.assign({}, st.an, {view:"main", value:"", used:0, legend:false, report:false, pz:{plan:null, done:{}}})}));
    if (f.start === "auth") this.logout();
    else if (f.start === "signup") this.setState({screen:"auth", splash:false, au: Object.assign(AU0(), {view:"signup"})});
    else if (f.start === "onb") this.setState({screen:"auth", splash:false, au: Object.assign(AU0(), {view:"onb"})});
    else if (f.start === "lesson") this.openLesson(f.lesson);
    else if (f.start === "screen") this.go(f.screen, Object.assign({from: f.screen}, f.patch ? JSON.parse(JSON.stringify(f.patch)) : {}));
    else if (f.start === "an") this.setState(st => ({screen:"analizador", sheet:null,
      an: Object.assign({}, st.an, {type: f.anType, from:"escaner", value:"", shot:false, view:"main", pz:{plan:null, done:{}}})}));
    else if (f.start === "pz") this.setState(st => ({screen:"analizador", sheet:null,
      an: Object.assign({}, st.an, {type:"enlace", from:"escaner", value:"https://clc.li/SeurPago-esp", verdict:"danger", view: f.pzView, pz:{plan: f.plan || null, done:{}}})}));
    else if (f.start === "fam") this.setState(st => ({screen:"familia", sheet:null,
      fam: Object.assign({}, st.fam, {view: f.famView || "hub", from:"tab", mid: f.mid || null, sheet: f.famSheet ? JSON.parse(JSON.stringify(f.famSheet)) : null})}));
  }

  allSteps(){ return FINDINGS.reduce((a, f) => a.concat(f.steps), []); }
  stepOwner(id){ return FINDINGS.find(f => f.steps.some(s => s.id === id)); }

  parts(w){
    const prem = w.plan === "premium";
    const baseE = BASE.reduce((t, b) => t + (w.base[b.id] ? b.pts : 0), 0);
    const vigList = VIG.filter(v => !v.soon);
    const vigE = prem ? vigList.reduce((t, v) => t + (w.vig[v.id] ? v.pts : 0), 0) : 0;
    const vigA = prem ? vigList.reduce((t, v) => t + v.pts, 0) : 0;
    const total = this.allSteps().length;
    const recDen = Math.min(5, total) * 4;
    const recE = prem ? Math.min(w.done.length, 5) * 4 : 0;
    const recA = prem ? recDen : 0;
    let actE = 0, actA = 0;
    ACT.forEach(a => {
      const pts = prem ? a.prem : a.free;
      if (!pts) return;
      if (a.id === "alerta" && !prem && w.alertsLeft <= 0) return;
      actA += pts;
      const d = w.act[a.id];
      if (w.nuevo || (d !== undefined && d !== null && d <= a.win)) actE += pts;
    });
    const learnA = LESSONS.length * LESSON_PTS;
    const learnE = (w.learn || []).filter(id => LESSONS.some(l => l.id === id)).length * LESSON_PTS;
    return {baseE, baseA:30, vigE, vigA, recE, recA, actE, actA, learnE, learnA,
      earned: baseE + vigE + recE + actE + learnE, avail: 30 + vigA + recA + actA + learnA};
  }

  scoreOf(w){ const p = this.parts(w); return Math.max(1, Math.round(p.earned / p.avail * 100)); }
  levelOf(sc){ return sc >= 85 ? "green" : sc >= 60 ? "amber" : "red"; }

  say(msg){ this.setState({live:""}); this.later(() => this.setState({live: msg}), 120); }

  animateTo(to){
    this.clearT();
    const from = this.state.shown;
    const ms = Math.max(14, Math.round(950 / Math.max(1, Math.abs(to - from))));
    const step = () => this.setState(s => {
      if (s.shown === to) return {};
      const v = s.shown + (s.shown < to ? 1 : -1);
      if (v !== to) this.later(step, ms);
      return {shown: v};
    });
    this.later(step, 320);
  }

  go(screen, extra){
    if (screen === "huella" && this.bioOn() && !this.state.bioOk)
      return this.setState(Object.assign({screen:"bloqueo", sheet:null}, extra || {}));
    if (this.state.an && this.state.an.resume && screen !== "paywall") this.anSet({resume:false});
    this.setState(Object.assign({screen, sheet:null, push: screen === "alertas" ? this.state.push : false}, extra || {}));
    if (screen === "huella") {
      const w = this.world();
      if (w.plan === "premium") {
        this.later(() => this.awardSilent("huella", "Repasar tus datos vigilados cuenta en tu día a día."), 500);
      }
    }
  }

  // Activar Premium no pone datos en vigilancia: cada dato se activa después, con su propio permiso.
  activatePremium(period, stay){
    const nw = JSON.parse(JSON.stringify(this.world()));
    nw.plan = "premium"; nw.alertsLeft = 99;
    const p = period === "anual" ? "anual" : "mensual";
    const resume = !stay && !!(this.state.an && this.state.an.resume && this.state.an.value);
    this.setState(st => Object.assign({world:nw, shown:0, labPlan:"premium", simPlan:"premium", pr: Object.assign({}, st.pr, {plan:p, sel:p, selTouched:false})}, stay ? {} : {screen:"home", sheet:null},
      resume ? {screen:"analizador", an: Object.assign({}, st.an, {view:"main", resume:false})} : {}));
    this.animateTo(this.scoreOf(nw));
    if (resume) return this.showToast((p === "anual" ? "Protección anual activada." : "Protección mensual activada.") + " Tu enlace sigue aquí: ya puedes analizarlo sin límite.");
    this.showToast((p === "anual" ? "Protección anual activada." : "Protección mensual activada.") + " Ahora elige qué datos vigilamos: te pedimos permiso para cada uno.");
  }

  showToast(text){
    this.setState({toast:{text}});
    this.later(() => this.setState(s => (s.toast && s.toast.text === text ? {toast:null} : {})), 3200);
  }

  awardSilent(id, why){
    const it = this.findAction(id);
    if (!it) return;
    const w = JSON.parse(JSON.stringify(this.world()));
    const before = this.scoreOf(w);
    const wkBefore = this.weekCount(w);
    this.settleNuevo(w);
    if (it.kind === "act") w.act[id] = 0;
    else if (it.kind === "base") w.base[id] = 1;
    else if (it.kind === "vig") w.vig[id] = 1;
    if (id === "alerta" && w.plan === "free" && w.alertsLeft > 0) w.alertsLeft -= 1;
    this.markWeek(w, it);
    if (!w.active) { w.active = true; w.weeks = Math.max(1, w.weeks); w.lost = 0; }
    const after = this.scoreOf(w);
    const wkAfter = this.weekCount(w);
    const wkLine = wkAfter > wkBefore ? (wkAfter === 3 ? " Semana completa: 3 de 3." : " Cuenta para tu semana: " + wkAfter + " de 3.") : "";
    if (after === before) {
      if (wkAfter > wkBefore || !this.world().active || w.alertsLeft !== this.world().alertsLeft) { this.setState({world:w}); if (wkLine) this.showToast(wkLine.trim()); }
      return;
    }
    this.setState({world:w, prev:this.world(), sessionDelta:this.state.sessionDelta + (after - before)});
    this.animateTo(after);
    this.showToast((after > before ? "+" : "") + (after - before) + " puntos. " + why + wkLine);
  }

  mariaSet(patch){ this.setState(s => ({maria: Object.assign({}, s.maria, patch)})); }

  mariaBack(){
    const m = this.state.maria;
    if (m.view === "list") this.mariaSet({view:"chat"});
    else if (m.msgs.length) this.mariaSet({msgs:[], node:null, topic:null, rate:null});
    else this.mariaSet({view:"intro"});
  }

  goActivity(a){ return () => this.go(a.screen); }

  anSet(patch){ this.setState(s => ({an: Object.assign({}, s.an, patch)})); }

  // Directo a la herramienta: sin pantalla de bienvenida previa. La explicación va en una línea encima del campo.
  anOpen(type){
    const a = this.state.an;
    const from = this.state.screen === "analizador" ? (a.from || "escaner") : this.state.screen;
    const perm = this.camPerm();
    const view = ANALYZERS[type].camera ? (perm === "Concedido" ? "camera" : perm === "Denegado" ? "denegado" : "permiso") : "main";
    this.setState({screen:"analizador", sheet:null,
      an: Object.assign({}, a, {type, from, value:"", shot:false, legend:false, report:false, reportText:"", view, resume:false, pz:{plan:null, done:{}}})});
  }

  // Raíz a la que vuelve una pantalla secundaria (Ayuda, Comprobar, Aprende o Inicio).
  backRoot(){ const f = this.state.from; return ["ayuda", "escaner", "aprende", "huella"].indexOf(f) >= 0 ? f : "home"; }
  openPaid(from){
    this.setState(st => ({screen:"analizador", sheet:null,
      an: Object.assign({}, st.an, {type:"enlace", view:"quepaso", value:"", from: from || "ayuda", legend:false, report:false, pz:{plan:null, done:{}}})}));
  }

  // Mis casos: cada plan PAUSA abierto o caso enviado al equipo queda guardado en Ayuda
  caseUpsert(c){
    this.setState(st => { const list = (st.cases || []).filter(x => x.id !== c.id);
      const prev = (st.cases || []).find(x => x.id === c.id) || {};
      return {cases: [Object.assign({}, prev, c)].concat(list)}; });
  }
  openPlan(id, from){
    const prev = (this.state.cases || []).find(x => x.id === "pz-" + id);
    const done = prev && prev.done ? Object.assign({}, prev.done) : {};
    this.caseUpsert({id:"pz-" + id, kind:"plan", plan:id, done, when: prev ? prev.when : "hoy"});
    this.setState(st => ({screen:"analizador", sheet:null,
      an: Object.assign({}, st.an, {type:"enlace", view:"plan", value:"", from: from || st.an.from || "ayuda", legend:false, report:false, pz:{plan:id, done}})}));
  }

  // En un mensaje de texto solo hay suplantación si lleva un enlace que no es de la web oficial.
  pzBrand(value){
    const v = String(value || "");
    const isText = /\s/.test(v.trim());
    const target = isText ? this.linkIn(v) : v;
    if (isText && !target) return null;
    return PZ_BRANDS.find(b => b.re.test(v) && target.toLowerCase().indexOf(b.host) < 0) || null;
  }
  linkIn(t){
    const m = String(t || "").match(/(https?:\/\/\S+|www\.\S+|\b[a-z0-9-]+\.(?:com|es|net|info|xyz|top|li|ly|me|org|store|shop)(?:\/\S*)?)/i);
    return m ? m[0] : "";
  }
  // Ocultamos datos personales antes de analizar: correo, teléfono, DNI y tarjeta.
  maskText(t){
    return String(t || "")
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "••••@••••")
      .replace(/(\+34\s?)?[6789]\d{2}[\s.]?\d{2,3}[\s.]?\d{2}[\s.]?\d{2,3}/g, "•••\u00a0•••\u00a0•••")
      .replace(/\b\d{8}[A-HJ-NP-TV-Z]\b/g, "•••••••••")
      .replace(/\b(?:\d[ -]?){13,19}\b/g, "•••• •••• •••• ••••");
  }
  msgSignals(t){
    const x = String(t || "").toLowerCase(), out = [];
    if (/hoy|urgente|inmediat|24 ?h|ahora mismo|último aviso|bloquead|retenid|devuelto|caduca/.test(x)) out.push({icon:"timer", t:"Te mete prisa o te asusta para que no lo pienses."});
    if (/pag|abon|€|euros|bizum|transferencia/.test(x)) out.push({icon:"hand-coins", t:"Pide dinero o un pago."});
    if (/clave|\bpin\b|código|contraseña|\bdni\b|tarjeta/.test(x)) out.push({icon:"key-round", t:"Pide claves, códigos o datos personales."});
    if (/no se lo digas|no se lo cuentes|en secreto|número nuevo|se me ha roto el móvil/.test(x)) out.push({icon:"user-x", t:"Dice ser alguien conocido con un número nuevo y pide secreto."});
    const link = this.linkIn(t), br = this.pzBrand(t);
    if (link && br) out.push({icon:"link", t:"El enlace imita a " + br.brand + ", pero no es su web."});
    else if (link) out.push({icon:"link", t:"Lleva un enlace para que lo pulses."});
    return out;
  }

  anBack(){
    const a = this.state.an;
    const cam = ANALYZERS[a.type].camera;
    if (a.view === "quepaso" && !a.value) return this.go(a.from || "ayuda");
    if (a.view === "oficial" || a.view === "quepaso") return this.anSet({view:"result"});
    if (a.view === "generico") return this.anSet({view: this.pzBrand(a.value) ? "oficial" : "result"});
    if (a.view === "plan") return this.anSet({view:"quepaso"});
    if (a.view === "details") this.anSet({view:"result"});
    else if (a.view === "result") this.anSet({view: cam ? "camera" : "main", value:""});
    else if (a.view === "limite") this.anSet({view: cam ? "camera" : "main"});
    else if (a.view === "main" && cam) this.anSet({view:"camera"});
    else this.go(a.from || "escaner");
  }

  anAnalyze(value){
    const a = this.state.an;
    if (this.off()) { this.anSet({view:"error", errKind:"red", value:(value || a.value || "").trim()}); return; }
    const prem = this.world().plan === "premium";
    const left = 3 - a.used;
    const val = (value || a.value || "").trim();
    if (!val) return;
    if (!prem && left <= 0) { this.anSet({view:"limite", value:val}); return; }
    const known = (AN_RECENTS[a.type] || []).find(r => r.value === val);
    const cycle = ["danger", "safe", "suspicious", "unknown"];
    const msgVerdict = () => { const n = this.msgSignals(val).length; return n >= 2 ? "danger" : n === 1 ? "suspicious" : this.linkIn(val) ? "unknown" : "safe"; };
    const verdict = known ? known.v : this.pzBrand(val) ? "danger" : a.type === "mensaje" ? msgVerdict() : cycle[a.used % 4];
    this.anSet({view:"scanning", value:val, reviewed:null, reportKind:""});
    if (this.anFail()) { this.later(() => this.anSet({view:"error", errKind:"servicio"}), 1700); return; }
    this.later(() => {
      this.anSet({view:"result", verdict, used: this.state.an.used + 1});
      this.say("Análisis terminado. " + (VERDICTS[verdict] || {}).risk + ".");
      this.awardSilent("scan", "Analizar algo cuenta en tu día a día.");
    }, 1700);
  }

  prSet(patch){ this.setState(s => ({pr: Object.assign({}, s.pr, patch)})); }
  prGo(view, patch){ this.setState(s => ({screen:"perfil", sheet:null, pr: Object.assign({}, s.pr, {view}, patch || {})})); }
  prSecReset(){ return {sec:"", confirm:false, pw:{a:"", b:"", c:"", show:{}, err:{}}, del:{reason:"", other:"", err:{}}}; }
  prBack(){
    const r = this.state.pr, v = r.view;
    if (v === "fa" && (r.fa.step === "pairing" || r.fa.step === "code")) return this.prSet({fa: Object.assign({}, r.fa, {step: r.fa.step === "code" ? "pairing" : "intro", err:null, code:""})});
    if (v === "fa" || v === "passok") return this.prGo("seguridad", this.prSecReset());
    if (v === "seguridad") return this.prGo("hub", this.prSecReset());
    if (["zona", "edad", "temas"].indexOf(v) >= 0) return this.prCancelPrefs(v);
    if (v === "hub") return this.go("home");
    return this.prGo("hub");
  }
  prCancelPrefs(v){
    const r = this.state.pr;
    const patch = v === "zona" ? {zonas: Object.assign({}, r.zonasSaved)} : v === "edad" ? {edad: r.edadSaved} : {temas: Object.assign({}, r.temasSaved)};
    this.prGo("alertas", patch);
  }
  prSavePass(){
    const w = this.state.pr.pw, err = {};
    if (!w.a) err.a = "Introduce tu contraseña actual.";
    if ((w.b || "").length < 12) err.b = "La contraseña debe tener al menos 12 caracteres.";
    else if (!pwOk(w.b)) err.b = "Es una contraseña muy conocida. Elige otra.";
    else if (w.b === w.a) err.b = "La nueva contraseña debe ser distinta de la actual.";
    if (!w.c) err.c = "Vuelve a escribir la contraseña nueva.";
    else if (w.c !== w.b) err.c = "Las contraseñas no coinciden.";
    if (Object.keys(err).length) { this.say("Revisa los campos marcados."); return this.prSet({pw: Object.assign({}, w, {err})}); }
    this.prGo("passok", this.prSecReset());
  }
  prFaSubmit(){
    const f = this.state.pr.fa, d = (f.code || "").replace(/\D/g, "");
    if (!d.length) return this.prSet({fa: Object.assign({}, f, {err:"Introduce el código para continuar."})});
    if (d !== "123456") return this.prSet({fa: Object.assign({}, f, {err: d.length < 6 ? "Faltan cifras. El código tiene 6 dígitos." : "El código introducido no es correcto.", n:(f.n || 0) + 1})});
    this.prSet({fa: Object.assign({}, f, {step:"success", err:null, code:""})});
    this.awardIf2fa();
  }
  prDelete(){
    this.prGo("deleting", {confirm:false});
    this.later(() => { if (this.state.pr.view === "deleting") this.prSet({view:"deleted"}); }, 2200);
    this.later(() => { if (this.state.pr.view === "deleted") this.setState(st => ({screen:"auth", au: AU0(), pr: Object.assign({}, st.pr, {view:"hub"}, this.prSecReset())})); }, 4600);
  }
  prLogout(){ this.logout(); }
  logout(){
    this.setState(st => ({screen:"auth", sheet:null, splash:true, au: AU0(), pr: Object.assign({}, st.pr, {view:"hub"}, this.prSecReset())}));
    this.later(() => this.setState({splash:false}), 1500);
  }
  auSet(p){ this.setState(st => ({au: Object.assign({}, st.au, p)})); }
  auGo(view, p){ this.setState(st => ({screen:"auth", sheet:null, au: Object.assign({}, st.au, {view}, p || {})})); }
  auEnter(msg){ this.setState({screen:"home", splash:false, au: AU0()}); if (msg) this.showToast(msg); }
  auBack(){
    const v = this.state.au.view;
    if (v === "login" || v === "signup") return this.auGo("intro", {err:{}, tried:false});
    if (v === "l2fa") return this.auGo("login", {code:"", codeErr:null});
    if (v === "onb") return this.obBack();
  }
  auEmailErr(e){ e = (e || "").trim(); return !e ? "Escribe tu correo electrónico." : !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e) ? "Formato no válido. Ej. nombre@empresa.com" : null; }
  auLogin(){
    const a = this.state.au, err = {email: this.auEmailErr(a.email),
      pass: !a.pass ? "Escribe tu contraseña." : a.pass.length < 12 ? "La contraseña necesita al menos 12 caracteres." : null};
    if (err.email || err.pass) { this.say("Revisa los campos marcados."); return this.auSet({err}); }
    if (this.off()) return this.labNet("login", "Sin conexión. Revisa la red e inténtalo otra vez: lo que has escrito sigue aquí.");
    // Solo pedimos el código a quien activó la verificación en dos pasos.
    if (this.world().base.twofa) return this.auGo("l2fa", {err:{}, code:"", codeErr:null});
    this.auEnter("Sesión iniciada. Bienvenida de nuevo.");
  }
  auSignup(){
    const a = this.state.au, pv = a.pass || "";
    const err = {email: this.auEmailErr(a.email),
      pass: pv.length < 12 ? "La contraseña necesita al menos 12 caracteres." : !pwOk(pv) ? "Es una contraseña muy conocida. Elige otra." : null,
      terms: !a.terms};
    if (err.email || err.pass || err.terms) { this.say("Revisa los campos marcados."); return this.auSet({err, tried:true}); }
    if (this.off()) return this.labNet("signup", "Sin conexión. No hemos podido crear tu cuenta: tus datos siguen escritos para cuando vuelva la red.");
    this.auGo("onb", {err:{}, tried:false, onb: OB0()});
  }
  auVerify(){
    const a = this.state.au, d = (a.code || "").replace(/\D/g, "");
    if (!d) return this.auSet({codeErr:"Introduce el código para continuar."});
    if (d !== "123456") return this.auSet({codeErr: d.length < 6 ? "Faltan cifras. El código tiene 6 dígitos." : "El código introducido no es correcto."});
    this.auGo("lok", {codeErr:null});
    this.later(() => { if (this.state.au.view === "lok") this.auEnter("Sesión iniciada. Bienvenida de nuevo."); }, 1900);
  }
  obSet(p){ this.setState(st => ({au: Object.assign({}, st.au, {onb: Object.assign({}, st.au.onb, p)})})); }
  obScrollEnd(){ this.later(() => { const el = document.querySelector('[data-screen-label="Acceso"] .tp-scroll'); if (el) el.scrollTo({top: el.scrollHeight, behavior:"smooth"}); }, 80); }
  obBack(){
    const o = this.state.au.onb, st = o.step;
    if ((st === "url" || st === "qr") && o.phase !== "input") return this.obSet({phase:"input"});
    const order = ["intro", "url", "temas"], i = order.indexOf(st);
    if (i <= 0) return this.auGo("signup", {err:{}, tried:false});
    this.obSet({step: order[i - 1], phase:"input", err:null});
  }
  // Bienvenida en 3 pasos: qué hace BeValk, una prueba en un toque y sobre qué avisamos.
  obNext(){
    const o = this.state.au.onb, st = o.step;
    if (st === "intro") return this.obSet({step:"url", phase:"input"});
    if (st === "url" && o.phase === "input" && this.off()) {
      this.obSet({step:"temas", phase:"input"});
      return this.labNet("onb", "Sin conexión: la prueba necesita red. Seguimos con la bienvenida y podrás hacerla luego en Comprobar.");
    }
    if (st === "url" && o.phase === "input") {
      this.obSet({phase:"scan", verdict:"danger"});
      return this.later(() => { const n = this.state.au.onb;
        if (n.step === "url" && n.phase === "scan") { this.obSet({phase:"result"}); this.say("No abras este enlace. Se hace pasar por Correos."); } }, 1400);
    }
    if (st === "url") return this.obSet({step:"temas", phase:"input"});
    this.obFinish();
  }
  obFinish(){
    const o = this.state.au.onb;
    const all = o.zona === OB_ZONAS[4];
    const zonas = all ? PR_ZONAS.reduce((m, z) => (m[z] = 1, m), {}) : {[o.zona]: 1};
    const picked = OB_TEMAS.filter(x => o.temas[x.id]);
    const noTemas = o.step === "temas" && picked.length === 0;
    const temas = picked.length ? picked.reduce((m, x) => { x.map.forEach(k => m[k] = 1); return m; }, {}) : noTemas ? {} : null;
    this.setState(st2 => ({pr: Object.assign({}, st2.pr, {zonas, zonasSaved: Object.assign({}, zonas)}, o.edad ? {edad: o.edad, edadSaved: o.edad} : {}, temas ? {temas, temasSaved: Object.assign({}, temas)} : {})}));
    this.auEnter(noTemas ? "Listo. No te enviaremos consejos por temas. Los avisos sobre tus propios datos te llegan siempre." : "Todo listo. Tu protección ya está configurada.");
  }
  prSendFb(){
    const f = this.state.pr.fb || {};
    const err = {topic: !f.topic, text: !!f.topic && !(f.text || "").trim()};
    if (err.topic || err.text) { this.say("Revisa los campos marcados."); return this.prSet({fb: Object.assign({}, f, {err})}); }
    this.prGo("opinionok", {fb:{topic:"", text:"", err:{}}});
  }

  sosSet(patch){ this.setState(s => ({sos: Object.assign({}, s.sos, patch)})); }
  sosOpen(){ this.setState(s => ({screen:"sos", sheet:null, sos: Object.assign({}, s.sos, {view: s.sos.dontShow ? "form" : "aviso", err:{}})})); }
  sosSend(){
    const o = this.state.sos;
    const err = {
      help: !o.help, desc: !(o.desc || "").trim(),
      name: !(o.name || "").trim(), email: !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test((o.email || "").trim()),
      consent: !o.consent
    };
    if (Object.keys(err).some(k => err[k])) {
      this.sosSet({err}); this.say("Revisa los campos marcados.");
      this.later(() => { const el = document.querySelector('[data-screen-label="SOS"] [role="alert"]'); if (el) el.scrollIntoView({block:"center"}); }, 60);
      return;
    }
    if (this.off()) return this.labNet("sos", "Sin conexión: no hemos podido enviar tu caso. Sigue aquí escrito. Si es urgente, llama al 017.");
    this.caseUpsert({id:"sos-" + Date.now(), kind:"team", when:"hoy", email:o.email.trim()});
    this.setState(s => ({screen:"ayuda", from:"ayuda", sos: Object.assign({}, s.sos, {view:"aviso", help:"", service:"", desc:"", consent:false, files:0, err:{}})}));
    this.showToast("Caso enviado. Lo tienes en Mis casos y te escribiremos a " + o.email.trim() + ".");
  }

  huSet(patch){ this.setState(s => ({hu: Object.assign({}, s.hu, patch)})); }
  huGo(view, patch){ this.setState(s => ({screen:"huflow", sheet:null, hu: Object.assign({}, s.hu, {view}, patch || {})})); }

  huCount(kind){ return this.state.hu.items.filter(i => i.kind === kind).length; }

  huOpen(kind){
    const prem = this.world().plan === "premium";
    if (kind !== "email" && !prem) { this.go("paywall"); return; }
    const max = kind === "email" ? (prem ? 5 : 1) : kind === "phone" ? 2 : 1;
    if (this.huCount(kind) >= max) { this.huGo("limite", {kind}); return; }
    this.huGo("intro", {kind, value:"", consent:false, declara:false, err:null, otp:"", attempts:0, fresh:false});
  }

  huBack(){
    const h = this.state.hu;
    if (h.view === "paso") return this.huGo("leak");
    if (h.view === "leak") return this.huGo(h.fresh ? "result" : "dato");
    if (h.view === "result") return this.huLeaveResult();
    if (h.view === "salida") return this.huGo("result");
    if (h.view === "dato") return this.huLeaveResult();
    if (h.view === "picker" || h.view === "limite") return this.go("huella");
    if (h.view === "otp" || h.view === "bloqueo") return this.huGo("input", {err:null, otp:"", attempts:0});
    if (h.view === "input") return this.huGo("intro");
    return this.go("huella");
  }

  huSubmit(){
    const h = this.state.hu, k = h.kind, val = (h.value || "").trim();
    if (k === "email") {
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(val)) return this.huSet({err:"Escribe un correo completo, con arroba y dominio."});
      if (!h.consent) return this.huSet({err:"Marca la casilla para que podamos vigilar este correo."});
      return this.huScan(val);
    }
    if (k === "phone") {
      const d = val.replace(/\D/g, "");
      if (d.length !== 9) return this.huSet({err:"Un número español tiene nueve cifras."});
      if (!h.consent) return this.huSet({err:"Marca la casilla para que podamos comprobar el número."});
      return this.huSendOtp();
    }
    const up = val.toUpperCase().replace(/[\s-]/g, "");
    if (!/^\d{8}[A-Z]$/.test(up)) return this.huSet({err:"Escribe 8 números y una letra, sin espacios."});
    if ("TRWAGMYFPDXBNJZSQVHLCKE".charAt(parseInt(up.slice(0, 8), 10) % 23) !== up.charAt(8))
      return this.huSet({err:"La letra no cuadra con los números. Revísalo antes de seguir."});
    if (!h.declara) return this.huSet({err:"Tienes que declarar que este DNI es tuyo para continuar."});
    return this.huScan(up);
  }

  huSendOtp(){
    const d = (this.state.hu.value || "").replace(/\D/g, "");
    this.huGo("otp", {sending:true, otp:"", err:null, attempts:0, resend:30, expired:false, taken: d.slice(-2) === "00"});
    this.later(() => { if (this.state.hu.view === "otp") { this.huSet({sending:false}); this.huTick(); } }, 1300);
    this.later(() => { if (this.state.hu.view === "otp" && !this.state.hu.sending) this.huSet({expired:true}); }, 90000);
  }

  huTick(){
    if (this.state.hu.view !== "otp") return;
    const r = this.state.hu.resend;
    if (r > 0) { this.huSet({resend: r - 1}); this.later(() => this.huTick(), 1000); }
  }

  huOtpType(v){
    const d = (v || "").replace(/\D/g, "").slice(0, 6);
    this.huSet({otp:d, err:null});
    if (d.length === 6) this.later(() => this.huOtpSubmit(), 300);
  }

  huOtpSubmit(){
    const h = this.state.hu;
    if (h.taken || h.sending) return;
    if (h.otp.length < 6) return this.huSet({err:"Escribe las seis cifras del código."});
    if (h.expired) return this.huSet({err:"caducado"});
    if (h.otp === "123456") return this.huScan((h.prefix || "+34") + " " + h.value.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3"));
    const n = (h.attempts || 0) + 1;
    if (n >= 3) return this.huGo("bloqueo", {attempts:n});
    this.huSet({attempts:n, err:"incorrecto", otp:""});
  }

  huResend(){
    if (this.state.hu.resend > 0 || this.state.hu.sending) return;
    this.huSet({sending:true, otp:"", err:null, expired:false, resend:30});
    this.later(() => { this.huSet({sending:false}); this.showToast("Te hemos enviado un código nuevo."); this.huTick(); }, 900);
  }

  huScan(val){
    this.huGo("scanning", {value:val, err:null});
    this.later(() => {
      const h = this.state.hu;
      const items = h.items.concat([{kind:h.kind, value:val, added:"hoy"}]);
      this.huSet({view:"result", items, sel: items.length - 1, fresh:true});
      const w = this.world();
      if (w.plan === "premium") this.awardSilent("huella", "Revisar tus datos vigilados cuenta en tu día a día.");
    }, 2200);
  }

  huLeaksOf(kind){ return (HU_LEAKS[kind] || []).filter(l => kind !== "dni" || this.state.hu.dniLeak !== false); }

  huLeakState(l){
    const done = this.state.hu.done;
    const total = l.steps.length;
    const n = l.steps.filter(st => done[st.id]).length;
    return {n, total, resolved: n >= total};
  }

  huMarkDone(id){
    this.setState(s => ({hu: Object.assign({}, s.hu, {done: Object.assign({}, s.hu.done, {[id]: 1})})}));
    this.showToast("Paso marcado como hecho.");
    this.huGo("leak");
  }

  huRemove(){
    const h = this.state.hu;
    const items = h.items.filter((it, i) => i !== h.sel);
    this.setState({sheet:null, screen:"huella", hu: Object.assign({}, h, {items, sel:0, fresh:false})});
    this.showToast("Hemos dejado de vigilar ese dato.");
  }

  huLeaveResult(){
    const h = this.state.hu, prem = this.world().plan === "premium";
    const it = h.items[h.sel] || h.items[0];
    const key = it ? it.kind + ":" + it.value : "x";
    if (prem || (h.exitSeen || {})[key]) return this.go("huella");
    this.setState(s => ({hu: Object.assign({}, s.hu, {exitSeen: Object.assign({}, s.hu.exitSeen, {[key]: 1})})}));
    this.huGo("salida");
  }

  huMask(it){
    if (it.kind !== "dni") return it.value;
    return "xxxxxx" + String(it.value).slice(6);
  }

  huItemLeaks(it){
    if (this.world().huClean) return [];
    const same = this.state.hu.items.filter(x => x.kind === it.kind);
    if (same.length && same[0] !== it) return [];
    return HU_LEAKS[it.kind] || [];
  }

  huBanner(prem){
    const it = this.state.hu.items[0];
    let un = 0;
    this.state.hu.items.forEach(x => this.huItemLeaks(x).forEach(l => { if (!this.huLeakState(l).resolved) un += 1; }));
    if (!prem) return {icon:"lock", title:"Tu escaneo del 6 mayo 2026", sub:"Activa Premium para vigilancia 24/7",
      bg:"var(--color-accent)", bd:"var(--color-border)", fg:"var(--color-foreground)", tone:"var(--color-accent-foreground)"};
    if (un > 0) return {icon:"shield-alert", title: un === 1 ? "1 filtración por revisar" : un + " filtraciones por revisar",
      sub:"Última revisión hace 47 min", bg:"var(--yellow-50)", bd:"var(--yellow-600)", fg:AMBER_TEXT, tone:"var(--color-accent-foreground)"};
    return {icon:"shield-check", title:"Nos encargamos de cuidarte 24/7", sub:"Última revisión hace 47 min",
      bg:"var(--green-50)", bd:"var(--color-positive)", fg:"var(--color-positive)", tone:"var(--color-accent-foreground)"};
  }

  huRowsOf(it, prem){
    const self = this;
    return this.huItemLeaks(it).map(l => {
      const st = self.huLeakState(l);
      return {name:l.name, date:l.date,
        exposed: l.countOnly ? "Solo te decimos dónde y cuándo" : "Se filtró: " + l.exposed.join(", ").toLowerCase(),
        exposedList: l.countOnly ? "solo dónde y cuándo" : l.exposed.join(", ").toLowerCase().replace("correo electrónico", "correo"),
        btnRadius: st.resolved ? "var(--radius-menu)" : "var(--radius-control)",
        btnPad: st.resolved ? "2px 10px" : "8px 14px",
        btnLabel: st.resolved ? "Resuelto" : "Solucionar",
        btnBg: st.resolved ? "var(--color-positive)" : "var(--color-primary)",
        blur: prem ? "none" : "blur(4px)",
        locked: !prem,
        open: () => prem ? self.huGo("leak", {leak:l.id, kind:it.kind}) : self.go("paywall")};
    });
  }

  huVals(prem){
    const self = this, h = this.state.hu, v = h.view;
    const cfg = HU_KINDS[h.kind] || HU_KINDS.email;
    const it = h.items[h.sel] || h.items[0] || {kind:"email", value:""};
    const itCfg = HU_KINDS[it.kind] || HU_KINDS.email;
    const itLeaks = this.huItemLeaks(it);
    const unres = itLeaks.filter(l => !this.huLeakState(l).resolved).length;
    const leak = (HU_LEAKS[h.kind] || []).find(l => l.id === h.leak) || (HU_LEAKS[it.kind] || []).find(l => l.id === h.leak) || null;
    const paso = leak ? leak.steps.find(st => st.id === h.paso) : null;
    const stepIdx = leak && paso ? leak.steps.indexOf(paso) : -1;
    const nextStep = leak && stepIdx >= 0 ? leak.steps.slice(stepIdx + 1).find(st => !h.done[st.id]) : null;
    const dot = n => ({bg: n <= (v === "intro" ? 1 : v === "input" || v === "otp" || v === "bloqueo" ? 2 : 3) ? "var(--color-primary)" : "var(--color-secondary)"});

    const scanLeaks = this.huItemLeaks(it);
    const clean = scanLeaks.length === 0;
    const otpErrText = h.err === "incorrecto" ? "Ese código no es correcto. Te " + (3 - h.attempts === 1 ? "queda 1 intento" : "quedan " + (3 - h.attempts) + " intentos") + "."
      : h.err === "caducado" ? "El código ha caducado. Pide uno nuevo."
      : h.err || "";

    return {
      back: () => this.huBack(),
      showOtpForm: !h.taken,
      heading: v === "leak" && leak ? leak.name + " - ¿Qué hacer?" : v === "paso" && paso ? paso.title.replace(" en " + paso.service, "") : "Mi huella",
      showSteps: ["intro", "input", "otp", "scanning"].indexOf(v) >= 0,
      stepsLabel: "Paso " + (v === "intro" ? 1 : v === "scanning" ? 3 : 2) + " de 3",
      consentChecked: h.consent ? "true" : "false",
      declaraChecked: h.declara ? "true" : "false",
      dots: [dot(1), dot(2), dot(3)],
      isPicker: v === "picker", isIntro: v === "intro", isInput: v === "input", isOtp: v === "otp",
      isBloqueo: v === "bloqueo", isScanning: v === "scanning", isResult: v === "result",
      isDato: v === "dato", isLeak: v === "leak", isPaso: v === "paso", isLimite: v === "limite",
      isSalida: v === "salida",

      title: v === "intro" ? cfg.introTitle : v === "input" ? cfg.inputTitle
        : v === "otp" ? "Escribe el código que te hemos enviado"
        : v === "bloqueo" ? "Demasiados intentos"
        : v === "scanning" ? cfg.scanTitle
        : v === "picker" ? "¿Qué quieres vigilar?"
        : v === "limite" ? cfg.limitTitle : "",
      hasTitle: ["intro", "input", "otp", "bloqueo", "scanning", "picker", "limite"].indexOf(v) >= 0,

      pickRows: ["email", "phone", "dni"].map(k => {
        const c = HU_KINDS[k];
        return {label:c.label, desc: k !== "email" && !prem ? "Con Premium" : c.pick, icon:c.icon,
          lockIcon: k !== "email" && !prem ? "lock" : "chevron-right",
          open: () => self.huOpen(k)};
      }),
      cancel: () => this.go("huella"),

      introBody: cfg.introBody,
      bullets: cfg.bullets.map(b => ({icon:b[0], title:b[1], sub:b[2]})),
      hasNote: !!cfg.note, note: cfg.note || "",
      cta: cfg.cta, start: () => this.huGo("input", {err:null}), later: () => this.go("huella"),

      inputBody: cfg.inputBody || "", hasInputBody: !!cfg.inputBody,
      placeholder: cfg.placeholder, inputIcon: cfg.inputIcon,
      value: h.value || "", type: e => this.huSet({value: e.target.value, err:null}),
      keyDown: e => { if (e.key === "Enter") { e.preventDefault(); this.huSubmit(); } },
      hasPrefix: h.kind === "phone", prefix: h.prefix || "+34",
      hasHelp: !!cfg.help, help: cfg.help || "",
      privacyIcon: cfg.privacyIcon, privacyTitle: cfg.privacyTitle, privacyBody: cfg.privacyBody,
      hasConsent: h.kind !== "dni", consentText: cfg.consent || "",
      consentIcon: h.consent ? "check" : "", consentBg: h.consent ? "var(--color-primary)" : "var(--color-card)",
      consentBd: h.consent ? "var(--color-primary)" : "var(--color-ring)",
      toggleConsent: () => this.huSet({consent: !h.consent, err:null}),
      hasDeclara: h.kind === "dni",
      declaraIcon: h.declara ? "check" : "", declaraBg: h.declara ? "var(--color-primary)" : "var(--color-card)",
      declaraBd: h.declara ? "var(--color-primary)" : "var(--color-ring)",
      toggleDeclara: () => this.huSet({declara: !h.declara, err:null}),
      openLegal: () => this.setState({sheet:{kind:"hu-dni"}}),
      submit: cfg.submit, submitFn: () => this.huSubmit(),
      hasErr: !!h.err && v !== "otp", err: h.err || "",

      otpBody: h.sending ? "Enviando el código a " + (h.prefix || "+34") + " " + String(h.value || "").replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") + "…"
        : "Lo hemos enviado a " + (h.prefix || "+34") + " " + String(h.value || "").replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") + ". Son seis cifras.",
      smsNote: "El SMS llega desde un número normal, no desde BeValk. El mensaje dice: \"Tu código de BeValk es 123456\".",
      otp: h.otp || "", otpType: e => this.huOtpType(e.target.value),
      otpVerify: () => this.huOtpSubmit(),
      hasOtpErr: !!h.err && v === "otp", otpErr: otpErrText,
      resendLabel: h.resend > 0 ? "Puedes pedir otro código en " + h.resend + " s" : "Enviar otro código",
      canResend: h.resend === 0 && !h.sending,
      resendCursor: h.resend === 0 && !h.sending ? "pointer" : "not-allowed",
      resendOpacity: h.resend === 0 && !h.sending ? "1" : "0.5",
      resend: () => this.huResend(),
      hasTaken: !!h.taken,
      takenTitle: "Este número ya está verificado en otra cuenta",
      takenBody: "Cada teléfono se puede vigilar desde una sola cuenta. Si el número es tuyo y no reconoces esa cuenta, escríbenos y lo revisamos.",
      takenCta: () => this.huGo("input", {value:"", taken:false, err:null}),

      blockBody: "Has fallado el código tres veces. Por seguridad hemos bloqueado la comprobación de este número durante 15 minutos.",
      blockHint: "El código correcto en esta demo es 123456.",
      restart: () => this.huGo("input", {otp:"", attempts:0, err:null}),

      scanBody: cfg.scanBody,

      shieldGreen: clean, shieldAmber: !clean && prem, shieldRed: !clean && !prem,
      resultIcon: clean ? "shield-check" : prem ? "shield-alert" : "shield-x",
      resultTint: clean ? "var(--green-50)" : prem ? "var(--yellow-50)" : "var(--red-50)",
      resultColor: clean ? "var(--color-positive)" : prem ? AMBER : "var(--color-destructive)",
      resultTitle: clean ? "¡Estás a salvo!" : scanLeaks.length === 1 ? "¡Encontramos 1 filtración!" : "¡Encontramos " + scanLeaks.length + " filtraciones!",
      resultBody: clean ? (prem ? itCfg.cleanBody : itCfg.cleanBodyFree) : prem ? "No te preocupes, te ayudamos a solucionarlo. No es urgente, pero conviene actuar."
        : "Con Premium ves qué empresa filtró tus datos y los pasos para arreglarlo.",
      chipIcon: itCfg.icon, chipValue: this.huMask(it),
      chipState: clean ? "Sin filtraciones · revisado hace un momento" : scanLeaks.length + (scanLeaks.length === 1 ? " filtración encontrada" : " filtraciones encontradas"),
      chipColor: clean ? "var(--color-positive)" : "var(--color-destructive)",
      hasClean: clean, cleanNote: prem ? "Seguiremos vigilando cada día. Si aparece algo, te avisamos al instante."
        : "Esta comprobación es de hoy. Con Premium lo revisamos cada día y te avisamos en cuanto aparezca algo.",
      rows: this.huRowsOf(it, prem),
      locked: !prem && !clean,
      lockTitle: "Desbloquea para verlo y solucionarlo",
      lockBody: "Con Premium verás qué empresa filtró tus datos, los pasos para arreglarlo, y MarIA te ayuda con cualquier duda.",
      addMore: itCfg.addMore, addMoreFn: () => this.huGo("picker"),
      backHub: () => this.huLeaveResult(),

      salClean: clean, salLeaks: !clean,
      salTitle: clean ? "Hoy no hay nada. Mañana no lo sabremos"
        : "Solo has visto una parte",
      salBody: clean
        ? "Ahora mismo " + itCfg.salWord + " no aparece en ninguna filtración conocida. Eso puede cambiar cualquier día: las empresas sufren robos de datos y tú te enteras mucho después. Sin Premium no volveremos a revisarlo, así que no te avisaremos cuando pase."
        : "Te hemos dicho cuántas filtraciones tiene " + itCfg.salWord + ", pero no cuáles son ni cómo resolverlas. Y sin Premium no seguiremos vigilándolo: si aparece en una filtración nueva, no lo sabrás.",
      salListTitle: clean ? "Lo que hace Premium por ti" : "Lo que te quedas sin saber",
      salPoints: (clean
        ? [["calendar-check", "Lo revisamos todos los días", "Sin que tengas que entrar ni acordarte de nada."],
           ["bell", "Te avisamos el mismo día", "En cuanto " + itCfg.salWord + " aparezca en una filtración."],
           ["list-checks", "Y te decimos qué hacer", "Los pasos concretos, uno a uno, con MarIA para las dudas."]]
        : [["eye-off", "Si hay más filtraciones", "Hoy ves el número. Las que aparezcan a partir de hoy no las verás."],
           ["shield-off", "Dejamos de vigilar este dato", "La revisión diaria y los avisos son parte de Premium."],
           ["list-checks", "Qué empresa lo filtró y cómo arreglarlo", "Los pasos siguen bloqueados sin Premium."]]
      ).map((p, i, arr) => ({icon:p[0], title:p[1], sub:p[2],
        bg: clean ? "var(--green-50)" : "var(--color-accent)",
        fg: clean ? "var(--color-positive)" : "var(--color-foreground)",
        line: i === arr.length - 1 ? "0" : "1px solid var(--color-border)"})),
      salPremiumCta: clean ? "Quiero que lo vigiléis por mí" : "Ver qué incluye Premium",
      salNote: clean
        ? "Puedes hacerte Premium cuando quieras. Tu dato se queda guardado, solo que en reposo: no lo revisamos hasta entonces."
        : "Puedes hacerte Premium cuando quieras y verás el detalle al momento. Tu dato se queda guardado mientras tanto.",
      salKeepFree: () => { this.go("huella"); this.showToast(clean ? "Guardado. Vuelve cuando quieras a revisarlo a mano." : "Guardado. El detalle te espera si cambias de idea."); },
      salBackResult: () => this.huGo("result"),

      seeDato: () => this.huGo("dato", {fresh:false, kind:it.kind}),

      datoValue: this.huMask(it), datoIcon: itCfg.icon, datoKind: itCfg.label,
      datoSummary: itLeaks.length === 0 ? "Sin filtraciones conocidas"
        : "Apareció en " + itLeaks.length + (itLeaks.length === 1 ? " filtración" : " filtraciones"),
      datoSummarySub: itLeaks.length === 0 ? "Lo revisamos cada día"
        : unres + " sin resolver · " + (itLeaks.length - unres) + " resuelta" + (itLeaks.length - unres === 1 ? "" : "s"),
      datoSumIcon: itLeaks.length === 0 ? "shield-check" : "triangle-alert",
      datoBg: itLeaks.length === 0 ? "var(--green-50)" : "var(--yellow-50)",
      datoBd: itLeaks.length === 0 ? "var(--color-positive)" : "var(--yellow-600)",
      datoFg: itLeaks.length === 0 ? "var(--color-positive)" : AMBER_TEXT,
      hasPassWarn: itLeaks.some(l => l.pass && !this.huLeakState(l).resolved),
      passWarn: "Contraseña filtrada: cámbiala cuanto antes",
      datoRows: this.huRowsOf(it, prem),
      hasDatoRows: itLeaks.length > 0,
      removeLabel: it.kind === "dni" ? "Borrar mi DNI de la app" : "Dejar de vigilar este dato",
      remove: () => this.setState({sheet:{kind:"hu-del"}}),
      hasLock: it.kind === "dni",
      lockNote: "Si borras tu DNI podrás volver a añadirlo pasados 30 días.",

      leakWhat: leak ? leak.what : "",
      leakExposed: leak && !leak.countOnly ? leak.exposed : [],
      hasExposed: !!(leak && !leak.countOnly),
      hasCountOnly: !!(leak && leak.countOnly),
      countOnlyNote: "De esta filtración solo te decimos que tu DNI aparece, cuándo y dónde. No guardamos ni mostramos ningún otro dato asociado.",
      hasLeakWarn: !!(leak && leak.pass && !this.huLeakState(leak).resolved), leakWarn: "Tu contraseña fue filtrada. El primer paso es crítico.",
      leakSteps: leak ? leak.steps.map((st, i) => {
        const done = !!h.done[st.id];
        return {title:st.title, meta: done ? (st.doneMeta || "Hecho") : st.meta,
          n: i + 1, isDone: done, isTodo: !done, line: i === 0 ? "0" : "1px solid var(--color-border)",
          icon: done ? "circle-check" : "circle-dashed",
          color: done ? "var(--color-positive)" : "var(--color-foreground)",
          titleColor: done ? "var(--color-positive)" : "var(--color-accent-foreground)",
          open: () => self.huGo("paso", {paso:st.id})};
      }) : [],
      leakStepsTitle: leak ? (leak.steps.length === 1 ? "Soluciónalo en 1 paso:" : "Soluciónalo en " + leak.steps.length + " pasos:") : "",
      leakAllDone: !!(leak && this.huLeakState(leak).resolved),
      leakPending: !(leak && this.huLeakState(leak).resolved),
      leakDoneTitle: "¿Tienes alguna duda al respecto?",
      leakDoneBody: "Habla con MarIA y cuéntale qué te pasa. Está aquí para ayudarte con cualquier cosa que necesites.",
      askMaria: () => this.go("maria"),

      pasoWhy: paso ? paso.why : "",
      pasoHow: paso ? paso.how.map((t, i) => ({n: i + 1, text: t})) : [],
      pasoTip: paso ? paso.tip : "", hasTip: !!(paso && paso.tip),
      pasoService: paso ? paso.service : "",
      pasoOpenLabel: paso ? "Abrir " + paso.service : "",
      pasoOpen: () => this.showToast("Vas a salir de BeValk. Fuera de la app no podemos protegerte."),
      pasoDone: !!(paso && h.done[paso.id]),
      markDone: () => {
        if (!paso) return null;
        if (!nextStep) return this.huMarkDone(paso.id);
        this.setState(st => ({hu: Object.assign({}, st.hu, {view:"paso", paso:nextStep.id, done: Object.assign({}, st.hu.done, {[paso.id]: 1})})}));
        this.showToast("Paso marcado como hecho.");
      },
      doneLabel: nextStep ? "Siguiente paso" : "Ya lo he hecho",
      hasNext: !!nextStep, nextLabel: nextStep ? "Siguiente paso" : "",
      next: () => nextStep ? this.huGo("paso", {paso:nextStep.id}) : null,

      limitBody: cfg.limitBody,
      limitCtaLabel: prem ? "Volver a mis datos" : "Ver Premium",
      limitCta: () => prem ? this.go("huella") : this.go("paywall")
    };
  }

  pfSet(patch){ this.setState(s => ({pf: Object.assign({}, s.pf, patch)})); }
  pfFilter(groups){
    const q = (this.state.pfQ || "").trim().toLowerCase();
    if (!q) { this._pfHit = -1; return groups; }
    const out = groups
      .map(g => ({label:g.label, rows: g.rows.filter(r => (r.label + " " + r.sub).toLowerCase().indexOf(q) >= 0)}))
      .filter(g => g.rows.length);
    this._pfHit = out.reduce((n, g) => n + g.rows.length, 0);
    return out;
  }

  pfGo(view, patch){ this.setState(s => ({screen:"pfflow", sheet:null, pf: Object.assign({}, s.pf, {view, err:null, errField:""}, patch || {})})); }

  pfBack(){
    const p = this.state.pf;
    if (p.view === "dosfa" && p.faView !== "intro") return this.pfSet({faView:"intro", faCode:"", faErr:null});
    if (p.view === "dosfa") return this.prGo("seguridad", this.prSecReset());
    if (["email", "pass", "borrar"].indexOf(p.view) >= 0) return this.pfGo("seguridad");
    return this.go("perfil");
  }

  pfSaveProfile(){
    const p = this.state.pf;
    const d = (p.tel || "").replace(/\D/g, "");
    if (p.tel && d.length !== 9) return this.pfSet({err:"El formato introducido no es válido.", errField:"tel"});
    this.pfSet({saved:true, err:null, errField:""});
    this.showToast("Tus cambios se han guardado.");
    this.go("perfil");
  }

  pfAvatar(e){
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const ok = ["image/png", "image/jpeg", "image/gif", "image/svg+xml"].indexOf(file.type) >= 0;
    if (!ok) return this.pfSet({err:"El formato introducido no es válido o excede las medidas.", errField:"avatar"});
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width > 400 || img.height > 400) this.pfSet({err:"El formato introducido no es válido o excede las medidas.", errField:"avatar"});
        else this.pfSet({avatar:String(r.result), err:null, errField:""});
      };
      img.onerror = () => this.pfSet({avatar:String(r.result), err:null, errField:""});
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  }

  pfMonthShift(n){
    let m = this.state.pf.calM + n, y = this.state.pf.calY;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    this.pfSet({calM:m, calY:y});
  }

  pfPickDate(d){
    const p = this.state.pf;
    const two = n => (n < 10 ? "0" : "") + n;
    this.pfSet({fecha: two(d) + "/" + two(p.calM + 1) + "/" + p.calY, cal:false});
  }

  pfAllCats(){
    const on = PF_CATS.every(c => this.state.pf.cats[c.id]);
    const next = {};
    PF_CATS.forEach(c => { if (!on) next[c.id] = 1; });
    this.pfSet({cats: next});
  }

  pfToggleCat(id){
    const cats = Object.assign({}, this.state.pf.cats);
    if (cats[id]) delete cats[id]; else cats[id] = 1;
    this.pfSet({cats});
  }

  pfPay(){
    const id = this.state.pf.plan;
    if (id === "basica") { this.showToast("Ya tienes la protección básica."); return; }
    this.activatePremium(id, true);
    this.setState({screen:"perfil"});
  }

  pfFaSubmit(){
    const p = this.state.pf;
    const d = (p.faCode || "").replace(/\D/g, "");
    if (d.length < 6) return this.pfSet({faErr:"Escribe las seis cifras que ves en tu app de códigos."});
    if (d !== "123456") {
      const n = (p.faAttempts || 0) + 1;
      if (n >= 3) return this.pfSet({faErr:"Tres intentos fallidos. Vuelve a emparejar la app para conseguir una clave nueva.", faAttempts:n, faCode:"", faView:"pairing"});
      return this.pfSet({faErr:"Ese código no es correcto. Comprueba que no haya caducado: cambia cada 30 segundos.", faAttempts:n, faCode:""});
    }
    this.pfSet({faView:"success", faErr:null, faCode:""});
    this.awardIf2fa();
  }

  awardIf2fa(){
    const w = JSON.parse(JSON.stringify(this.world()));
    if (w.base.twofa) return;
    const before = this.scoreOf(w);
    w.base.twofa = 1;
    const after = this.scoreOf(w);
    this.setState({world:w});
    this.animateTo(after);
    this.showToast("+" + (after - before) + " puntos. La verificación en dos pasos ya está activa.");
  }

  pfSaveMail(){
    const p = this.state.pf;
    if (p.mailMode === "new") {
      const v = (p.mailNew || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) return this.pfSet({mailErr:"Escribe un correo completo, con arroba y dominio."});
      if (v === "micorreo@empresa.com") return this.pfSet({mailErr:"Ese correo ya es el de tu cuenta."});
      this.pfSet({mailErr:null, mailSel:v, mailMode:"pick"});
      this.showToast("Te hemos enviado un código a " + v + " para confirmarlo.");
      return this.pfGo("seguridad");
    }
    this.showToast("Tu correo de acceso es ahora " + p.mailSel + ".");
    this.pfGo("seguridad");
  }

  pfPassStrength(){
    const v = this.state.pf.pB || "";
    return !v ? 0 : pwCommon(v) || v.length < 8 ? 1 : v.length < 12 ? 2 : v.length < 16 ? 3 : 4;
  }

  pfSavePass(){
    const p = this.state.pf;
    if (!p.pA) return this.pfSet({passErr:"Escribe tu contraseña actual."});
    if ((p.pB || "").length < 12) return this.pfSet({passErr:"La nueva contraseña necesita al menos 12 caracteres."});
    if (p.pB !== p.pC) return this.pfSet({passErr:"Las dos contraseñas nuevas no coinciden."});
    if (p.pA === p.pB) return this.pfSet({passErr:"La nueva no puede ser igual a la actual."});
    this.pfSet({passErr:null, pA:"", pB:"", pC:""});
    this.showToast("Contraseña cambiada. Hemos cerrado el resto de sesiones.");
    this.pfGo("seguridad");
  }

  pfSendFeedback(){
    const p = this.state.pf;
    if (!(p.msg || "").trim()) return this.pfSet({msgErr:"Nos ayudaría mucho a mejorar si nos das un motivo."});
    this.pfSet({msgErr:null, view:"feedback-ok"});
  }

  pfDelNext(){
    const p = this.state.pf;
    if (p.delStep === "aviso") return this.pfSet({delStep:"motivo"});
    if (p.delStep === "motivo") {
      if (!p.delReason) return this.pfSet({err:"Elige un motivo para continuar.", errField:"reason"});
      if (p.delReason === "Otro motivo" && !(p.delOther || "").trim()) return this.pfSet({err:"Cuéntanos el motivo en una línea.", errField:"other"});
      return this.pfSet({delStep:"confirmar", err:null, errField:""});
    }
    if (p.delStep === "confirmar") {
      if ((p.delConfirm || "").trim().toUpperCase() !== "BORRAR") return this.pfSet({err:"Escribe la palabra BORRAR para confirmar.", errField:"confirm"});
      this.pfSet({delStep:"borrando", err:null});
      this.later(() => this.pfSet({delStep:"hecho"}), 2400);
    }
  }

  pfVals(prem){
    const self = this, p = this.state.pf, v = p.view;
    const heading = v === "editar" ? "Editar perfil" : v === "plan" ? "Gestionar suscripción"
      : v === "seguridad" ? "Seguridad" : v === "dosfa" ? "Verificación en dos pasos"
      : v === "email" ? "Correo de acceso" : v === "pass" ? "Cambiar contraseña"
      : v === "notiscat" ? "Notificaciones" : v === "consultas" ? "Mis consultas"
      : v === "feedback" || v === "feedback-ok" ? "Tu opinión importa" : "Eliminar cuenta";

    const two = n => (n < 10 ? "0" : "") + n;
    const first = (new Date(p.calY, p.calM, 1).getDay() + 6) % 7;
    const days = new Date(p.calY, p.calM + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push({label:"", empty:true, bg:"transparent", fg:"var(--color-muted-foreground)", cursor:"default", pick:() => {}});
    for (let d = 1; d <= days; d++) {
      const sel = p.fecha === two(d) + "/" + two(p.calM + 1) + "/" + p.calY;
      cells.push({label:String(d), empty:false, bg: sel ? "var(--color-primary)" : "transparent",
        fg: sel ? "var(--color-on-fill)" : "var(--color-foreground)", cursor:"pointer", pick:() => self.pfPickDate(d)});
    }

    const st = this.pfPassStrength();
    const topic = PF_TOPICS.find(t => t.id === p.topic) || PF_TOPICS[0];
    const catsOn = PF_CATS.filter(c => p.cats[c.id]).length;
    const allOn = catsOn === PF_CATS.length;

    return {
      heading, back: () => this.pfBack(),
      isEditar: v === "editar", isPlan: v === "plan", isSeguridad: v === "seguridad",
      isFa: v === "dosfa", isEmail: v === "email", isPass: v === "pass",
      isNotisCat: v === "notiscat", isConsultas: v === "consultas",
      isFeedback: v === "feedback", isFeedbackOk: v === "feedback-ok", isBorrar: v === "borrar",

      nombre: p.nombre, apellido: p.apellido, tel: p.tel, fecha: p.fecha,
      fechaLabel: p.fecha || "Selecciona tu fecha",
      typeNombre: e => this.pfSet({nombre: e.target.value}),
      typeApellido: e => this.pfSet({apellido: e.target.value}),
      typeTel: e => this.pfSet({tel: e.target.value, err:null, errField:""}),
      telBd: p.errField === "tel" ? "var(--color-destructive)" : "var(--color-ring)",
      telLabelFg: p.errField === "tel" ? "var(--color-destructive)" : "var(--color-foreground)",
      hasErr: !!p.err, err: p.err || "",
      avatarBd: p.errField === "avatar" ? "var(--color-destructive)" : "var(--color-border)",
      hasAvatar: !!p.avatar, avatar: p.avatar || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      initials: (String(p.nombre || "E").charAt(0) + String(p.apellido || "N").charAt(0)).toUpperCase(),
      onAvatar: e => this.pfAvatar(e),
      clearAvatar: () => this.pfSet({avatar:"", err:null, errField:""}),
      calOpen: p.cal, toggleCal: () => this.pfSet({cal: !p.cal}),
      calLabel: PF_MONTHS[p.calM] + " " + p.calY,
      calDays: ["L", "M", "X", "J", "V", "S", "D"],
      calCells: cells,
      calPrev: () => this.pfMonthShift(-1), calNext: () => this.pfMonthShift(1),
      saveProfile: () => this.pfSaveProfile(), cancelProfile: () => this.go("perfil"),

      plans: PF_PLANS.map(pl => {
        const on = p.plan === pl.id;
        const current = pl.free ? !prem : prem && pl.id === "anual";
        return {name:pl.name, price:pl.price, per:pl.per || "", sub:pl.sub || "", save:pl.save || "",
          hasSub: !!pl.sub, hasSave: !!pl.save,
          kicker: pl.kicker || "", hasKicker: !!pl.kicker && !current,
          current, currentLabel:"SUSCRIPCIÓN ACTUAL",
          bd: on ? "var(--color-primary)" : "var(--color-border)",
          dot: on ? "var(--color-primary)" : "transparent",
          dotBd: on ? "var(--color-primary)" : "var(--color-ring)",
          open: on, isFree: !!pl.free,
          limits: (pl.limits || []).map(l => ({label:l[0], value:l[1]})),
          feats: pl.free ? [] : PF_FEATS.map(x => ({label:x[0], tag:x[1], hasTag: !!x[1]})),
          bonus: (pl.bonus || []).map(b => ({icon:b[0], label:b[1]})),
          hasBonus: !!pl.bonus,
          showPay: on && !pl.free,
          select: () => this.pfSet({plan: pl.id})};
      }),
      pay: () => this.pfPay(),

      segRows: [
        {label:"Pedir Face ID para ver Mi huella",
         sub: this.bioOn() ? "Activado. Te lo pedimos cada vez que entras." : "Desactivado. Quien coja tu móvil desbloqueado ve tus filtraciones.",
         icon:"scan-face",
         open:() => { const on = !this.bioOn(); this.setState({bio:on, bioOk:false}); this.showToast(on ? "Listo. Te pediremos Face ID para entrar en Mi huella." : "Quitado. Mi huella se abre sin Face ID."); }},
        {label:"Correo de acceso", sub: p.mailSel, icon:"mail", open:() => this.pfGo("email")},
        {label:"Cambiar contraseña", sub:"La última vez, hace 4 meses", icon:"key-round", open:() => this.pfGo("pass")},
        {label:"Verificación en dos pasos", sub: this.world().base.twofa ? "Activada" : "Sin activar · suma 10 puntos", icon:"shield-check", open:() => this.pfGo("dosfa")},
        {label:"Dispositivos con sesión abierta", sub:"Este móvil y un portátil", icon:"laptop", open:() => this.showToast("Dos sesiones abiertas. Ninguna sin reconocer.")},
        {label:"Eliminar cuenta", sub:"Borra tus datos de BeValk", icon:"trash-2", open:() => this.pfGo("borrar", {delStep:"aviso", delReason:"", delOther:"", delConfirm:""})}
      ],

      faIsIntro: p.faView === "intro", faIsPairing: p.faView === "pairing",
      faIsCode: p.faView === "code", faIsSuccess: p.faView === "success",
      faOn: !!this.world().base.twofa,
      faStart: () => this.pfSet({faView:"pairing", faErr:null, faCode:"", faAttempts:0}),
      faToCode: () => this.pfSet({faView:"code", faErr:null}),
      faKey: "K7QX 4M2P 9BTR 5WZE",
      faCopy: () => this.showToast("Clave copiada. Pégala en tu app de códigos."),
      faCode: p.faCode,
      faType: e => this.pfSet({faCode: String(e.target.value).replace(/\D/g, "").slice(0, 6), faErr:null}),
      faSubmit: () => this.pfFaSubmit(),
      faHasErr: !!p.faErr, faErr: p.faErr || "",
      faCodes: ["4RT9-2KMX", "8PLQ-7WZD", "1NVB-6JHS", "5CXA-3TYE"],
      faDone: () => { this.showToast("Guarda esos códigos fuera del móvil."); this.prGo("seguridad"); },
      faOff: () => this.showToast("Para quitarla, escríbenos desde MarIA. Preferimos comprobarlo contigo."),

      mailPick: p.mailMode === "pick", mailNewMode: p.mailMode === "new",
      mailOptions: ["micorreo@empresa.com", "elena.trabajo@empresa.com"].map(m => ({label:m,
        dot: p.mailSel === m ? "var(--color-primary)" : "transparent",
        dotBd: p.mailSel === m ? "var(--color-primary)" : "var(--color-ring)",
        select: () => this.pfSet({mailSel:m, mailErr:null})})),
      mailNew: p.mailNew, typeMailNew: e => this.pfSet({mailNew: e.target.value, mailErr:null}),
      mailToNew: () => this.pfSet({mailMode:"new", mailErr:null}),
      mailToPick: () => this.pfSet({mailMode:"pick", mailErr:null}),
      mailHasErr: !!p.mailErr, mailErr: p.mailErr || "",
      saveMail: () => this.pfSaveMail(),

      pA: p.pA, pB: p.pB, pC: p.pC,
      typeA: e => this.pfSet({pA: e.target.value, passErr:null}),
      typeB: e => this.pfSet({pB: e.target.value, passErr:null}),
      typeC: e => this.pfSet({pC: e.target.value, passErr:null}),
      strengthLabel: st <= 1 ? "Débil" : st === 2 ? "Mejorable" : st === 3 ? "Buena" : "Fuerte",
      strengthColor: st <= 1 ? "var(--color-destructive)" : st === 2 ? AMBER : "var(--color-positive)",
      strengthFrac: String(Math.max(0.08, st / 4)),
      passHasErr: !!p.passErr, passErr: p.passErr || "",
      savePass: () => this.pfSavePass(),

      catsAllLabel: allOn ? "Desmarcar todas" : "Marcar todas",
      catsAllTrack: allOn ? "var(--color-primary)" : "var(--color-muted)",
      catsAllJustify: allOn ? "flex-end" : "flex-start",
      catsAll: () => this.pfAllCats(),
      catRows: PF_CATS.map(c => {
        const on = !!p.cats[c.id];
        return {label:c.label, desc:c.desc,
          trackBg: on ? "var(--color-primary)" : "var(--color-muted)",
          justify: on ? "flex-end" : "flex-start",
          toggle: () => self.pfToggleCat(c.id)};
      }),
      catsCount: catsOn === 0 ? "No recibirás avisos de ninguna categoría." : "Recibirás avisos de " + catsOn + " de " + PF_CATS.length + " categorías.",
      saveCats: () => { this.showToast("Preferencias guardadas."); this.go("perfil"); },

      consultas: PF_CONSULTAS.map(c => ({id:"Consulta " + c.id, date:c.date, state:c.state, ready:c.ready,
        badgeBg: c.ready ? "var(--color-positive)" : "var(--color-card)",
        badgeFg: c.ready ? "var(--color-on-fill)" : "var(--color-foreground)",
        badgeBd: c.ready ? "var(--color-positive)" : "var(--color-ring)",
        btnLabel: c.ready ? "Descargar" : "No disponible",
        btnBg: c.ready ? "var(--color-primary)" : "var(--color-muted)",
        btnCursor: c.ready ? "pointer" : "not-allowed",
        act: () => c.ready ? this.showToast("Descargando " + c.id + ".") : this.showToast("Aún la estamos preparando.")})),

      topics: PF_TOPICS.map(t => ({label:t.label,
        bg: p.topic === t.id ? "var(--color-secondary)" : "var(--color-card)",
        fg: p.topic === t.id ? "var(--color-secondary-foreground)" : "var(--color-foreground)",
        select: () => this.pfSet({topic:t.id, msgErr:null})})),
      topicTitle: topic.label, topicDesc: topic.desc,
      msg: p.msg, typeMsg: e => this.pfSet({msg: String(e.target.value).slice(0, 500), msgErr:null}),
      msgCount: (p.msg || "").length + "/500 caracteres",
      msgBd: p.msgErr ? "var(--color-destructive)" : "var(--color-ring)",
      msgHasErr: !!p.msgErr, msgErr: p.msgErr || "",
      sendFeedback: () => this.pfSendFeedback(),
      feedbackBack: () => { this.pfSet({msg:"", topic:"otros"}); this.go("perfil"); },

      delIsAviso: p.delStep === "aviso", delIsMotivo: p.delStep === "motivo",
      delIsConfirmar: p.delStep === "confirmar", delIsBorrando: p.delStep === "borrando",
      delIsHecho: p.delStep === "hecho",
      delLoses: [
        {icon:"eye-off", text:"Dejamos de vigilar tus datos y perderás los avisos."},
        {icon:"chart-pie", text:"Tu protección de " + this.scoreOf(this.world()) + " y tu constancia se borran."},
        {icon:"message-circle", text:"Se borra tu historial con MarIA y tus comprobaciones."},
        {icon:"credit-card", text: prem ? "Cancelamos tu suscripción. No devolvemos el tiempo no usado." : "No hay nada que cancelar: tu plan es gratuito."}
      ],
      delReasons: PF_REASONS.map(r => ({label:r,
        bd: p.delReason === r ? "var(--color-primary)" : "var(--color-border)",
        dot: p.delReason === r ? "var(--color-primary)" : "transparent",
        select: () => this.pfSet({delReason:r, err:null, errField:""})})),
      delOtherShow: p.delReason === "Otro motivo",
      delOther: p.delOther, typeDelOther: e => this.pfSet({delOther: e.target.value, err:null}),
      delConfirm: p.delConfirm, typeDelConfirm: e => this.pfSet({delConfirm: e.target.value, err:null, errField:""}),
      delConfirmBd: p.errField === "confirm" ? "var(--color-destructive)" : "var(--color-ring)",
      delNext: () => this.pfDelNext(),
      delNextLabel: p.delStep === "aviso" ? "Continuar" : p.delStep === "motivo" ? "Continuar" : "Borrar mi cuenta",
      delCancel: () => this.pfGo("seguridad"),
      delKeep: () => { this.pfGo("seguridad"); this.showToast("Tu cuenta sigue activa."); },
      delRestart: () => this.setState({screen:"home"})
    };
  }

  mariaSend(){
    const m = this.state.maria;
    const typed = (m.draft || "").trim();
    if ((typed || m.img) && this.off()) return this.labNet("maria", "Sin conexión. Tu mensaje sigue escrito: envíalo cuando vuelva la red.");
    if (m.img) {
      const text = typed || "Te adjunto esta imagen para que la revises.";
      this.mariaSet({view:"chat", msgs: m.msgs.concat([{who:"u", text, img:true}, {who:"m", text:"Déjame revisar…"}]), draft:"", img:false, node:{options:[]}, rate:null});
      this.later(() => this.setState(st => ({maria: Object.assign({}, st.maria, {msgs: st.maria.msgs.concat([{who:"m",
        text:"En efecto, se trata de un fraude de phishing: suplanta a una empresa conocida, mete prisa y te pide pulsar un enlace. No pulses nada y bórralo. Si ya has metido datos, cambia la contraseña y avisa a tu banco."}])})})), 1500);
      return this.mariaAward();
    }
    const text = typed;
    if (!text) return;
    const msgs = m.msgs.concat([{who:"u", text},
      {who:"m", text:"Lo miro ahora mismo. Si tienes el mensaje o el enlace a mano, pégamelo aquí y te digo qué señales encuentro."}]);
    this.mariaSet({view:"chat", msgs, draft:"", node:{options:[]}, rate:null});
    this.mariaAward();
  }

  mariaAward(){
    this.awardSilent("maria", "Preguntar a MarIA cuenta en tu día a día.");
  }

  mariaTopic(i){
    const t = MARIA_TOPICS[i];
    this.mariaSet({view:"chat", topic:t.label, msgs:[{who:"m", text:t.reply}], node:t, rate:null});
    this.mariaAward();
  }

  mariaOption(label){
    const s = this.state.maria;
    const node = s.node && s.node.then ? s.node.then : null;
    const msgs = s.msgs.concat([{who:"u", text:label}]);
    if (node) msgs.push({who:"m", text:node.reply});
    this.mariaSet({msgs, node: node || {options:[]}});
  }

  pending(w){
    const prem = w.plan === "premium";
    const out = [];
    BASE.forEach(b => { if (!w.base[b.id]) out.push({kind:"base", pts:b.pts, def:b, group:"Tu cuenta", icon:"user-check"}); });
    if (prem) {
      VIG.filter(v => !v.soon).forEach(v => { if (!w.vig[v.id]) out.push({kind:"vig", pts:v.pts, def:v, group:"Lo que vigilamos por ti", icon:"eye"}); });
      if (w.done.length < 5) {
        this.allSteps().forEach(st => {
          if (w.done.indexOf(st.id) < 0) {
            const f = this.stepOwner(st.id);
            out.push({kind:"step", pts:4, def:st, group:f.label, icon:"key-round", finding:f});
          }
        });
      }
    }
    ACT.forEach(a => {
      const pts = prem ? a.prem : a.free;
      if (!pts) return;
      if (a.id === "alerta" && !prem && w.alertsLeft <= 0) return;
      const d = w.act[a.id];
      const fresh = w.nuevo || (d !== undefined && d !== null && d <= a.win);
      if (!fresh) out.push({kind:"act", pts, def:a, group:"Tu día a día", icon: a.id === "scan" ? "scan-line" : a.id === "alerta" ? "bell" : a.id === "maria" ? "message-circle" : "shield",
        sub:"Cuenta otra vez durante " + a.win + " días"});
    });
    const nextLesson = LESSONS.find(l => (w.learn || []).indexOf(l.id) < 0);
    if (nextLesson) out.push({kind:"learn", pts:LESSON_PTS, def:{id:nextLesson.id, title:nextLesson.task, time:nextLesson.time},
      group:"Lo que sabes", icon:"graduation-cap", sub:"Tema de " + nextLesson.time + " · no caduca"});
    out.sort((a, b) => b.pts - a.pts);
    return out;
  }

  findAction(id){
    const b = BASE.find(x => x.id === id); if (b) return {kind:"base", pts:b.pts, def:b, group:"Tu cuenta", icon:"user-check"};
    const v = VIG.find(x => x.id === id); if (v) return {kind:"vig", pts:v.pts, def:v, group:"Lo que vigilamos por ti", icon:"eye"};
    const st = this.allSteps().find(x => x.id === id);
    if (st) { const f = this.stepOwner(id); return {kind:"step", pts:4, def:st, group:f.label, icon:"key-round"}; }
    const a = ACT.find(x => x.id === id);
    if (a) return {kind:"act", pts: this.world().plan === "premium" ? a.prem : a.free, def:a, group:"Tu día a día", icon:"scan-line"};
    const l = LESSONS.find(x => x.id === id);
    if (l) return {kind:"learn", pts:LESSON_PTS, def:{id:l.id, title:l.task, time:l.time}, group:"Lo que sabes", icon:"graduation-cap"};
    return null;
  }

  complete(id){
    const w = JSON.parse(JSON.stringify(this.world()));
    const before = this.scoreOf(w);
    const wkBefore = this.weekCount(w);
    const it = this.findAction(id);
    if (!it) return;
    this.settleNuevo(w);
    this.markWeek(w, it);
    if (it.kind === "learn") { w.learn = (w.learn || []).slice(); if (w.learn.indexOf(id) < 0) w.learn.push(id); }
    else if (it.kind === "base") w.base[id] = 1;
    else if (it.kind === "vig") w.vig[id] = 1;
    else if (it.kind === "step" && w.done.indexOf(id) < 0) w.done.push(id);
    else if (it.kind === "act") {
      w.act[id] = 0;
      if (id === "alerta" && w.plan === "free" && w.alertsLeft > 0) w.alertsLeft -= 1;
    }
    w.active = true;
    if (!this.world().active) { w.weeks = 1; w.lost = 0; }
    const after = this.scoreOf(w);
    const weekFresh = this.weekCount(w) === 3 && wkBefore < 3;
    this.setState(s => ({world:w, prev:this.world(), screen:"subida", delta: after - before, weekFresh,
      sessionDelta: s.sessionDelta + (after - before), actId:id, sheet:null, shown: before}));
    this.animateTo(after);
  }

  undoAction(id){
    const w = JSON.parse(JSON.stringify(this.world()));
    const it = this.findAction(id);
    if (!it) return;
    const before = this.scoreOf(w);
    if (it.kind === "learn") w.learn = (w.learn || []).filter(x => x !== id);
    else if (it.kind === "base") w.base[id] = 0;
    else if (it.kind === "vig") w.vig[id] = 0;
    else if (it.kind === "step") w.done = w.done.filter(x => x !== id);
    else if (it.kind === "act") {
      w.act[id] = 1;
      if (id === "alerta" && w.plan === "free") w.alertsLeft += 1;
    }
    const after = this.scoreOf(w);
    this.setState({world:w, prev:null, delta:0, shown: before, sheet:null});
    this.animateTo(after);
    this.showToast("Vuelve a estar pendiente.");
  }

  undo(){
    const p = this.state.prev;
    if (!p) { this.go("home"); return; }
    const back = this.scoreOf(p);
    this.setState({world:p, prev:null, screen:"home", delta:0});
    this.animateTo(back);
  }

  setScen(k, plan){
    const s = SCEN[k];
    this.clearT();
    if (plan !== undefined) this.setState({simPlan: plan});
    this.setState({scen:k, world:null, prev:null, screen:"home", sessionDelta:0, sheet:null, read:[],
      hu: Object.assign({}, this.state.hu, {view:"picker", kind:"email", value:"", consent:false, declara:false,
        err:null, otp:"", attempts:0, sel:0, leak:null, paso:null, fresh:false, taken:false,
        items: s.huItems ? s.huItems.slice() : [{kind:"email", value:"micorreo@empresa.com", added:"6 may 2026"}],
        exitSeen:{}, done:{ad1:1, ad2:1, ad3:1, li3:1}})});
    const w = this.planWorld(this.scenWorld(s), plan !== undefined ? plan : this.state.simPlan);
    this.setState({shown:0});
    this.animateTo(this.scoreOf(w));
  }

  openSheet(kind){
    if (kind === "ayuda") {
      this.setState({sheet:{kind:"ayuda"}});
    } else if (kind === "confirm") {
      this.setState({sheet:{kind:"confirm"}});
    }
  }

  /* ---------- Mi Familia ---------- */
  famRole(){ const r = this.state.fam.role; return r || FAM_ROLES[this.props.miFamilia ?? "Administradora"] || "admin"; }
  famSet(patch){ this.setState(s => ({fam: Object.assign({}, s.fam, patch)})); }
  famGo(view, patch){
    this.setState(s => ({screen:"familia", sheet:null, fam: Object.assign({}, s.fam, {view, sheet:null}, patch || {})}));
    this.famTop();
  }
  famTop(){ this.later(() => document.querySelectorAll('[data-screen-label="Mi Familia"] .tp-scroll').forEach(el => { el.scrollTop = 0; }), 0); }
  famOpen(from){
    const role = this.famRole();
    const view = role === "none" ? "oferta" : role === "invited" ? "unirse" : "hub";
    this.famGo(view, {from: from || "home", mid:null});
  }
  famLeaveTo(){
    const f = this.state.fam.from;
    if (f === "tab") return;
    if (f === "perfil") this.setState(s => ({screen:"perfil", sheet:null, fam: Object.assign({}, s.fam, {sheet:null}), pr: Object.assign({}, s.pr, {view:"hub"})}));
    else this.setState(s => ({screen:"home", sheet:null, fam: Object.assign({}, s.fam, {sheet:null})}));
  }
  famBack(){
    const f = this.state.fam;
    if (f.sheet) return this.famClose();
    if (["ficha", "avisos", "ajustes"].indexOf(f.view) >= 0) return this.famGo("hub");
    return this.famLeaveTo();
  }
  famSheet(sheet){ this.famSet({sheet}); }
  famClose(){ this.famSet({sheet:null}); }
  famSheetSet(patch){ this.setState(s => ({fam: Object.assign({}, s.fam, {sheet: Object.assign({}, s.fam.sheet, patch)})})); }
  famMember(id){ return id === "admin" ? FAM_ADMIN_M : (this.state.fam.members.find(m => m.id === id) || null); }
  famMsgGroups(ctx){
    // ctx: {all, obj:{kind, v}, motive}
    if (ctx.all) return [["Para todo el grupo", [10, 11, 12, 9]]];
    const urgent = ctx.motive && /dinero|datos/i.test(ctx.motive) ? [["Lo más urgente", [6, 5]]] : [];
    if (ctx.obj && ctx.obj.kind === "link") return urgent.concat(ctx.obj.v === "safe"
      ? [["Sobre este enlace", [3, 4]], ["General", [9]]]
      : [["Sobre este enlace", [1, 2, 4]], ["General", [9]]]);
    if (ctx.obj && ctx.obj.kind === "leak") return [["Sobre esta filtración", [8, 4]], ["General", [9]]];
    if (ctx.obj && ctx.obj.kind === "other") return [["Sobre un pago, un dato o una llamada", [6, 5, 7]], ["Sobre un mensaje", [2, 4]], ["General", [9]]];
    return [["Sobre un enlace o mensaje", [1, 2, 4]], ["Sobre un pago, un dato o una llamada", [6, 5, 7]], ["Si han salido sus datos", [8]], ["General", [9]]];
  }
  famSendAviso(){
    const f = this.state.fam, sh = f.sheet;
    if (!sh || !sh.msg) return this.famSheetSet({err:true});
    if (this.off()) return this.labNet("famaviso", "Sin conexión. El aviso no se ha enviado: sigue preparado para cuando vuelva la red.");
    const all = sh.to === "all";
    const m = all ? null : this.famMember(sh.to);
    const names = all ? f.members.filter(x => !x.pending).map(x => x.nick) : [m.nick];
    const entry = {msg: sh.msg, obj: sh.obj ? sh.obj.d : "", when:"Ahora", to: names.map(n => ({n, st:"Enviado"}))};
    this.famSet({sheet:null, sent:[entry].concat(f.sent)});
    this.showToast(all ? "Aviso enviado a " + names.length + " personas." : "Aviso enviado a " + m.nick + ".");
    this.say("Aviso enviado.");
  }
  famSendReply(){
    const f = this.state.fam, sh = f.sheet;
    if (!sh || !sh.msg) return this.famSheetSet({err:true});
    if (this.off()) return this.labNet("famreply", "Sin conexión. Tu respuesta no se ha enviado: sigue elegida para cuando vuelva la red.");
    const r = f.reqs.find(x => x.id === sh.req), m = this.famMember(r.from);
    // Una misma petición repetida se responde una sola vez.
    const reqs = f.reqs.map(x => x.id === sh.req || (!x.reply && x.from === r.from && x.obj === r.obj) ? Object.assign({}, x, {reply: sh.msg}) : x);
    this.famSet({sheet:null, reqs});
    // Cuidar de la familia cuenta como la tarea "Protege" de la semana.
    const w = JSON.parse(JSON.stringify(this.world()));
    const before = this.weekCount(w);
    w.wk = Object.assign({}, w.wk, {protect:1});
    const after = this.weekCount(w);
    this.setState({world:w});
    this.showToast("Respuesta enviada a " + m.nick + "." + (after > before ? (after === 3 ? " Semana completa: 3 de 3." : " Cuenta para tu semana: " + after + " de 3.") : ""));
  }
  famBuy(){
    this.famSheetSet({phase:"activating"});
    this.later(() => { this.setState(s => ({fam: Object.assign({}, s.fam, {sheet:null, view:"crear", role:"admin", created:false})})); this.labSetSimPlan("premium"); this.famTop(); }, 1600);
  }
  famCreate(){
    const f = this.state.fam;
    const name = (f.crear.name || "").trim() || "Familia Navarro";
    this.setState(s => ({fam: Object.assign({}, s.fam, {view:"hub", created:true, groupName:name, myShare: Object.assign({}, s.fam.crear.share),
      members:[], reqs:[], sent:[], sheet:{kind:"invite", step:"nick", nick:""}})}));
    this.famTop();
  }
  famJoin(){
    const j = this.state.fam.join;
    if (!j.age) return this.famSet({join: Object.assign({}, j, {err:true})});
    this.setState(s => ({fam: Object.assign({}, s.fam, {role:"member", view:"hub",
      mem: Object.assign({}, s.fam.mem, {share: Object.assign({}, j.share), showName: j.showName, welcome:true, aviso:false, pets:[]})})}));
    this.labSetSimPlan("premium");
    this.famTop();
  }
  famSendAyuda(){
    const sh = this.state.fam.sheet;
    if (!sh.motive) return this.famSheetSet({err:true});
    if (this.off()) return this.labNet("famayuda", "Sin conexión. Tu petición no se ha enviado. Si es urgente, llama al 017.");
    const pet = {t: sh.obj.t, motive: sh.motive, when:"Ahora", st:0, reply:null};
    this.setState(s => ({fam: Object.assign({}, s.fam, {sheet: Object.assign({}, sh, {step:"sent"}),
      mem: Object.assign({}, s.fam.mem, {pets:[pet].concat(s.fam.mem.pets)})})}));
    this.later(() => this.setState(s => ({fam: Object.assign({}, s.fam, {mem: Object.assign({}, s.fam.mem,
      {pets: s.fam.mem.pets.map((p, k) => k === 0 && p.st === 0 ? Object.assign({}, p, {st:1}) : p)})})})), 2600);
  }
  famInviteCreate(){
    const sh = this.state.fam.sheet;
    const nick = (sh.nick || "").trim();
    if (!nick || nick.length > 30) return this.famSheetSet({err:true});
    const id = "inv" + Date.now();
    this.setState(s => ({fam: Object.assign({}, s.fam, {sheet: Object.assign({}, sh, {step:"ready", nick, err:false}),
      members: s.fam.members.concat([{id, nick, ini: nick.charAt(0).toUpperCase(), pending:true, expires:"7 de noviembre"}])})}));
  }

  famVals(){
    const s = this.state, f = s.fam, role = this.famRole();
    const isAdmin = role === "admin", isMember = role === "member";
    const nombre = this.props.nombre ?? "Elena";
    const V = v => VERDICTS[v] || VERDICTS.unknown;
    const chip = v => ({label: V(v).risk, bg: V(v).badgeBg, fg: V(v).badgeFg, icon: V(v).icon});
    const sw = on => ({checked: on ? "true" : "false", track: on ? "var(--color-primary)" : "var(--neutral-500)", justify: on ? "flex-end" : "flex-start"});
    const shareList = (cats, cur, toggle) => cats.map((c, k) => Object.assign({label:c.label, desc:c.desc, line: k ? "1px solid var(--color-border)" : "0",
      toggle: () => toggle(c.id)}, sw(!!cur[c.id])));
    const people = f.members.filter(m => !m.pending);
    const pend = f.members.filter(m => m.pending);
    const openReqs = f.reqs.filter(r => !r.reply);
    const lvlTone = l => l === "danger" ? "var(--color-destructive)" : l === "suspicious" ? AMBER_TEXT : "var(--color-positive)";
    const lvlIcon = l => l === "danger" ? "shield-alert" : l === "suspicious" ? "triangle-alert" : "shield-check";
    const msgOpts = (groups, cur, pick) => groups.map(g => ({title: g[0], opts: g[1].map(id => ({text: FAM_MSGS[id], checked: cur === id ? "true" : "false",
      bd: cur === id ? "var(--color-primary)" : "var(--color-border)", bg: cur === id ? "var(--color-accent)" : "var(--color-card)",
      dot: cur === id ? "var(--color-primary)" : "transparent", pick: () => pick(id)}))}));
    const adminName = "Lucía Navarro", adminShort = "Lucía";

    /* ---- hub (admin) ---- */
    const req0 = openReqs[0];
    const reqFrom = req0 ? this.famMember(req0.from) : null;
    const rows = f.members.map(m => m.pending
      ? {name:m.nick, ini:m.ini, isPending:true, line:"Invitación pendiente · caduca el " + m.expires, lineIcon:"clock", lineColor:"var(--color-text-body)", shares:"",
         hasShares:false, avBg:"var(--color-accent)", aria: m.nick + ", invitación pendiente", open: () => this.famSheet({kind:"inviteView", id:m.id})}
      : {name:m.nick, ini:m.ini, isPending:false, line: m.status + " · " + m.when, lineIcon: lvlIcon(m.level), lineColor: lvlTone(m.level),
         shares: "Comparte: " + (FAM_CATS.filter(c => m.shares[c.id]).map(c => c.label === "Enlaces analizados" ? "Enlaces" : c.label).join(", ") || "nada por ahora"),
         hasShares:true, avBg:"var(--color-secondary)", aria:"Ver la ficha de " + m.nick, open: () => this.famGo("ficha", {mid:m.id})});
    const hub = {
      groupName: f.groupName, seats: (people.length + pend.length + 1) + " de 6 plazas",
      hasReq: !!req0, reqTitle: reqFrom ? reqFrom.nick + " te pide ayuda" + ((n => n > 1 ? " (" + n + " veces)" : "")(openReqs.filter(x => x.from === req0.from && x.obj === req0.obj).length)) : "",
      reqSub: req0 ? "«" + req0.motive + "» sobre " + req0.obj + " · " + req0.when : "",
      reqOpen: () => req0 && this.famSheet({kind:"reply", req:req0.id, msg:null}),
      hasPeople: f.members.length > 0, isEmpty: f.members.length === 0, rows,
      hasStats: people.length > 0,
      avisosBadge: String(openReqs.length), hasAvisosBadge: openReqs.length > 0,
      avisosAria: "Avisos y peticiones" + (openReqs.length ? ", " + openReqs.length + " petición pendiente" : ""),
      openAvisos: () => this.famGo("avisos"),
      favCount: String(people.length ? FAM_FAVS.length : 0), openFavs: () => this.famSheet({kind:"favs"}),
      invite: () => this.famSheet({kind:"invite", step:"nick", nick:""}),
      avisarAll: () => this.famSheet({kind:"avisar", to:"all", obj:null, msg:null}),
      canAvisarAll: people.length > 1
    };

    /* ---- hub (member) ---- */
    const mm = f.mem;
    const pets = mm.pets.map((p, i) => ({t:p.t, line: i ? "1px solid var(--color-border)" : "0", pad: i ? "12px" : "0", sub:"«" + p.motive + "» · " + p.when,
      steps:["Enviada", "Vista", "Respondida"].map((x, k) => ({label:x, on: p.st >= k, icon: p.st >= k ? "circle-check" : "circle", fg: p.st >= k ? "var(--color-foreground)" : "var(--color-text-body)"})),
      hasReply: !!p.reply, reply: p.reply ? "«" + FAM_MSGS[p.reply] + "»" : ""}));
    const member = {
      admin: adminName, adminShort,
      welcome: !!mm.welcome, dismissWelcome: () => this.famSet({mem: Object.assign({}, mm, {welcome:false})}),
      hasAviso: !!mm.aviso, avisoMsg: "«" + FAM_MSGS[6] + "»", avisoAbout: "Responde a tu petición: un mensaje o una llamada · «Me piden dinero»",
      understood: () => { this.famSet({mem: Object.assign({}, mm, {aviso:false})}); this.showToast(adminShort + " verá que lo has entendido."); },
      toSos: () => this.sosOpen(),
      helpAbout: () => this.famSheet({kind:"ayuda", step:"form", obj:{kind:"other", t:"Un mensaje o una llamada", v:null}, motive:"Me piden dinero"}),
      ayuda: () => this.famSheet({kind:"ayuda", step:"pick", obj:null, motive:null}),
      share: shareList(FAM_CATS_MINE, mm.share, id => { this.famSet({mem: Object.assign({}, mm, {share: Object.assign({}, mm.share, {[id]: !mm.share[id]}), saved:id})}); this.say("Guardado."); }),
      savedLine: mm.saved ? "Guardado. Se lo avisaremos a " + adminShort + "." : "Cada cambio se guarda al momento.",
      seeAdmin: () => this.famGo("ficha", {mid:"admin"}),
      adminShares: "Comparte contigo: Huella y Enlaces",
      hasPets: pets.length > 0, noPets: pets.length === 0, pets,
      muted: sw(mm.muted), toggleMute: () => this.famSet({mem: Object.assign({}, mm, {muted: !mm.muted})}),
      showName: sw(mm.showName), toggleName: () => this.famSet({mem: Object.assign({}, mm, {showName: !mm.showName})}),
      shownAs: mm.showName ? nombre + " Navarro" : "Un miembro de la familia",
      leave: () => this.famSheet({kind:"salir"})
    };

    /* ---- ficha (shared template: admin → member, member → admin) ---- */
    const fm = f.mid ? this.famMember(f.mid) : null;
    let ficha = {name:"", ini:"", links:[], huella:[], act:[], shares:[], mine:[]};
    if (fm) {
      const lt = fm.level === "danger" ? "Riesgo alto esta semana" : fm.level === "suspicious" ? "Riesgo medio esta semana" : "Sin novedades de riesgo";
      const safeN = (fm.links || []).filter(l => l.v === "safe").length;
      const r = f.reqs.find(x => x.from === fm.id && !x.reply);
      const viewer = isAdmin ? "admin" : "member";
      const who = fm.id === "admin" ? adminShort : fm.nick;
      ficha = {
        name: fm.id === "admin" ? "Lo que comparte " + adminShort : fm.nick, ini: fm.ini,
        lvlTitle: lt, lvlBody: (fm.level === "safe" ? "Último análisis " + fm.when : fm.status + " · " + fm.when) + (safeN ? ". " + safeN + (safeN === 1 ? " enlace" : " enlaces") + " de riesgo bajo." : "."),
        lvlIcon: lvlIcon(fm.level), lvlTone: lvlTone(fm.level),
        lvlBg: fm.level === "danger" ? "var(--red-50)" : fm.level === "suspicious" ? "var(--yellow-50)" : "var(--green-50)",
        canAvisar: viewer === "admin", avisarLabel: "Avisar a " + fm.nick,
        avisarBg: r && viewer === "admin" ? "var(--color-card)" : "var(--color-primary)", avisarFg: r && viewer === "admin" ? "var(--color-foreground)" : "var(--color-on-fill)", avisarBd: r && viewer === "admin" ? "var(--color-ring)" : "transparent",
        avisar: () => this.famSheet({kind:"avisar", to:fm.id, obj:null, msg:null}),
        hasReq: !!r && viewer === "admin", reqText: r ? fm.nick + " te pidió ayuda " + r.when : "", reqOpen: () => r && this.famSheet({kind:"reply", req:r.id, msg:null}),
        linksOn: !!fm.shares.enlaces, linksOff: !fm.shares.enlaces,
        links: (fm.links || []).map((l, k) => Object.assign({d:l.d, when:l.when, line: k ? "1px solid var(--color-border)" : "0",
          open: () => this.famSheet({kind:"link", mid:fm.id, k}), aria: l.d + ", " + V(l.v).risk + ", " + l.when}, {chip: chip(l.v)})),
        huellaOn: !!fm.shares.huella, huellaOff: !fm.shares.huella,
        huella: (fm.huella || []).map((h, k) => ({t:h.t, s:h.s, line: k ? "1px solid var(--color-border)" : "0", icon: h.warn ? "triangle-alert" : "shield-check", tone: h.warn ? AMBER_TEXT : "var(--color-positive)"})),
        actOn: !!fm.shares.actividad, actOff: !fm.shares.actividad,
        act: (fm.act || []).map((a, k) => ({d:a.d, t:a.t, line: k ? "1px solid var(--color-border)" : "0"})),
        hasAct: (fm.act || []).length > 0,
        noShare: who + " no comparte esto contigo.",
        readOnly: "Solo lectura. Estos datos los gestiona " + who + ".",
        isAdminView: viewer === "admin",
        nick: fm.nick, rename: () => this.famSheet({kind:"apodo", mid:fm.id, value:fm.nick}),
        shares: FAM_CATS.map(c => ({label:c.label, on: !!fm.shares[c.id], value: fm.shares[c.id] ? "Desde el " + fm.shares[c.id] : "No lo comparte",
          icon: fm.shares[c.id] ? "check" : "minus", tone: fm.shares[c.id] ? "var(--color-positive)" : "var(--color-text-body)"})),
        mine: FAM_CATS.map(c => ({label:c.label, value: f.myShare[c.id] ? "Sí" : "No"})),
        sharesTitle: fm.nick + " ha aceptado compartir", onlyThey: "Solo " + fm.nick + " puede cambiar esto.",
        mineTitle: "Lo que tú compartes con " + fm.nick,
        openAjustes: () => this.famGo("ajustes"),
        retirar: () => this.famSheet({kind:"retirar", mid:fm.id}), retirarLabel: "Retirar a " + fm.nick + " del grupo"
      };
    }

    /* ---- avisos y peticiones ---- */
    const avisos = {
      hasReqs: f.reqs.length > 0,
      reqs: f.reqs.map(r => { const m = this.famMember(r.from); return {title: m.nick + " te pide ayuda", sub: r.obj + " · «" + r.motive + "» · " + r.when,
        open: r.reply ? null : () => this.famSheet({kind:"reply", req:r.id, msg:null}), pending: !r.reply, done: !!r.reply,
        reply: r.reply ? "Respondiste: «" + FAM_MSGS[r.reply] + "»" : "", chip: chip(r.v)}; }),
      noReqs: f.reqs.length === 0,
      sent: f.sent.map(a => ({text:"«" + FAM_MSGS[a.msg] + "»", obj: a.obj, hasObj: !!a.obj, when:a.when,
        to: a.to.map(t => ({n:t.n, st:t.st, icon: t.st === "Entendido" ? "check-check" : t.st === "Visto" ? "eye" : "send", fg: t.st === "Enviado" ? "var(--color-text-body)" : "var(--color-foreground)"}))})),
      hasSent: f.sent.length > 0, noSent: f.sent.length === 0,
      newAviso: () => this.famSheet({kind:"avisar", to: people.length > 1 ? "all" : (people[0] ? people[0].id : "all"), obj:null, msg:null})
    };

    /* ---- ajustes ---- */
    const ajustes = {
      groupName: f.groupName, adminName: nombre + " Navarro",
      share: shareList(FAM_CATS_MINE.map(x => Object.assign({}, x, {desc: x.desc.replace("No ve ", "No ven ")})), f.myShare, id => { this.famSet({myShare: Object.assign({}, f.myShare, {[id]: !f.myShare[id]})}); this.showToast("Guardado. Se lo avisaremos a tus miembros."); }),
      preview: () => this.famSheet({kind:"preview"}),
      store: () => this.showToast("Te llevamos a la gestión de suscripciones de la tienda."),
      cancel: () => this.famSheet({kind:"cancel"})
    };

    /* ---- oferta ---- */
    const o = f.offer;
    const fmt = c => Math.floor(c / 100) + "," + String(c % 100).padStart(2, "0") + " €";
    const total = o.n ? (o.period === "anual" ? Math.round(FAM_PRICES[o.n] * 10 / 100) * 100 - 1 : FAM_PRICES[o.n]) : 0;
    const offer = {
      pills: [2, 3, 4, 5, 6].map(n => ({label:String(n), aria: n + " personas", checked: o.n === n ? "true" : "false",
        bg: o.n === n ? "var(--color-primary)" : "var(--color-card)", fg: o.n === n ? "var(--color-on-fill)" : "var(--color-foreground)",
        bd: o.n === n ? "var(--color-primary)" : "var(--color-ring)", pick: () => this.famSet({offer: Object.assign({}, o, {n})})})),
      isYear: o.period === "anual" ? "true" : "false", isMonth: o.period === "mensual" ? "true" : "false",
      yBg: o.period === "anual" ? "var(--color-card)" : "transparent", mBg: o.period === "mensual" ? "var(--color-card)" : "transparent",
      ySh: o.period === "anual" ? "var(--shadow-sm)" : "none", mSh: o.period === "mensual" ? "var(--shadow-sm)" : "none",
      yBd: o.period === "anual" ? "var(--color-primary)" : "transparent", mBd: o.period === "mensual" ? "var(--color-primary)" : "transparent",
      pickYear: () => this.famSet({offer: Object.assign({}, o, {period:"anual"})}), pickMonth: () => this.famSet({offer: Object.assign({}, o, {period:"mensual"})}),
      hasPrice: !!o.n, noPrice: !o.n,
      total: o.n ? fmt(total) : "", unit: o.period === "anual" ? "/ año" : "/ mes",
      per: o.n ? fmt(Math.round(total / o.n)) + " por persona " + (o.period === "anual" ? "al año" : "al mes") : "",
      save: o.period === "anual",
      cta: o.n ? "Continuar a la tienda" : "Elige cuántas personas", ctaBg: o.n ? "var(--color-primary)" : "var(--color-muted)",
      ctaFg: o.n ? "var(--color-on-fill)" : "var(--color-muted-foreground)", ctaDisabled: o.n ? "false" : "true",
      go: () => { if (!o.n) return this.say("Elige cuántas personas."); this.famSheet({kind:"store", phase:"idle"}); },
      product: "Plan familiar · " + o.n + " personas · " + (o.period === "anual" ? "Suscripción anual" : "Suscripción mensual")
    };

    /* ---- crear ---- */
    const c = f.crear;
    const crear = {
      name: c.name, setName: e => this.famSet({crear: Object.assign({}, c, {name: e.target.value.slice(0, 30)})}), count: (c.name || "").length + "/30",
      share: shareList(FAM_CATS_MINE, c.share, id => this.famSet({crear: Object.assign({}, c, {share: Object.assign({}, c.share, {[id]: !c.share[id]})})})),
      go: () => this.famCreate()
    };

    /* ---- unirse ---- */
    const j = f.join, anyJ = j.share.huella || j.share.enlaces || j.share.actividad;
    const unirse = {
      admin: adminName, adminShort,
      share: shareList(FAM_CATS_MINE, j.share, id => this.famSet({join: Object.assign({}, j, {share: Object.assign({}, j.share, {[id]: !j.share[id]})})})),
      showName: sw(j.showName), toggleName: () => this.famSet({join: Object.assign({}, j, {showName: !j.showName})}),
      shownAs: j.showName ? nombre + " Navarro" : "Un miembro de la familia",
      age: j.age ? "true" : "false", ageIcon: j.age ? "check" : "", ageBg: j.age ? "var(--color-primary)" : "var(--color-card)",
      ageBd: j.err && !j.age ? "var(--color-destructive)" : j.age ? "var(--color-primary)" : "var(--color-ring)",
      toggleAge: () => this.famSet({join: Object.assign({}, j, {age: !j.age, err:false})}), ageErr: j.err && !j.age,
      cta: anyJ ? "Unirme y compartir lo elegido" : "Unirme sin compartir nada",
      go: () => this.famJoin(), later: () => this.famLeaveTo()
    };

    /* ---- sheet ---- */
    const sh = f.sheet || {};
    const k = sh.kind || "";
    let sv = {visible: !!f.sheet, close: () => this.famClose(), title:"", kind:k};
    const toM = sh.to && sh.to !== "all" ? this.famMember(sh.to) : null;
    if (k === "avisar") {
      const all = sh.to === "all";
      const ctx = {all, obj: sh.obj ? {kind:"link", v: sh.obj.v} : null};
      sv = Object.assign(sv, {title: all ? "Avisar al grupo" : "Avisar a " + toM.nick, isAvisar:true,
        hasObj: !!sh.obj, objD: sh.obj ? sh.obj.d : "", objChip: chip(sh.obj ? sh.obj.v : "unknown"),
        guard: !!sh.obj && sh.obj.v !== "safe",
        guardText: "BeValk da a este enlace " + (sh.obj ? V(sh.obj.v).risk.toLowerCase() : "") + ". Por eso no te ofrecemos mensajes que digan que es seguro.",
        groups: msgOpts(this.famMsgGroups(ctx), sh.msg, id => this.famSheetSet({msg:id, err:false})),
        hasMsg: !!sh.msg, noMsg: !sh.msg && !sh.err, msgErr: !!sh.err && !sh.msg, errText:"Elige un mensaje para enviar.",
        preview: sh.msg ? "Esto verá " + (all ? "cada persona" : toM.nick) + ": «" + FAM_MSGS[sh.msg] + "»" : "",
        allNote: all, allText: "Lo reciben " + people.length + " personas, cada una por separado. No ven a quién más se lo has enviado.",
        send: () => this.famSendAviso(), sendLabel: "Enviar aviso"});
    } else if (k === "reply") {
      const r = f.reqs.find(x => x.id === sh.req) || {};
      const m = r.from ? this.famMember(r.from) : {nick:""};
      sv = Object.assign(sv, {title: m.nick + " te pide ayuda", isReply:true, objD: r.obj, objChip: chip(r.v || "unknown"), motive: "«" + r.motive + "» · " + r.when,
        readOnly: "Solo lectura. Estos datos los gestiona " + m.nick + ".",
        guard: r.v && r.v !== "safe", guardText: "BeValk da a este enlace " + V(r.v).risk.toLowerCase() + ". Por eso no te ofrecemos respuestas que digan que es seguro.",
        groups: msgOpts(this.famMsgGroups({obj:{kind:r.kind, v:r.v}, motive:r.motive}), sh.msg, id => this.famSheetSet({msg:id, err:false})),
        hasMsg: !!sh.msg, msgErr: !!sh.err && !sh.msg, errText:"Elige una respuesta para enviar.", preview: sh.msg ? "Esto verá " + m.nick + ": «" + FAM_MSGS[sh.msg] + "»" : "",
        send: () => this.famSendReply()});
    } else if (k === "link") {
      const m = this.famMember(sh.mid), l = m.links[sh.k];
      sv = Object.assign(sv, {title:"Enlace analizado", isLink:true, d:l.d, when:"Analizado por " + m.nick + " " + l.when, chip: chip(l.v),
        why: (FAM_WHY[l.v] || FAM_WHY.unknown).map(t => ({t})), privacy: "Solo ves el dominio. La dirección completa solo la ve " + m.nick + ".",
        canAvisar: isAdmin, avisar: () => this.famSheet({kind:"avisar", to:m.id, obj:{d:l.d, v:l.v}, msg:null}), avisarLabel: "Avisar a " + m.nick + " sobre este enlace"});
    } else if (k === "invite") {
      const left = 6 - 1 - f.members.length;
      sv = Object.assign(sv, {title: sh.step === "ready" ? "Invitación para " + sh.nick : "Invitar a alguien", isInviteNick: sh.step !== "ready", isInviteReady: sh.step === "ready",
        nick: sh.nick || "", setNick: e => this.famSheetSet({nick: e.target.value.slice(0, 30), err:false}), count: (sh.nick || "").length + "/30",
        err: !!sh.err, left: "Puedes invitar a " + left + (left === 1 ? " persona" : " personas") + " más. Cada una elige qué comparte contigo.",
        create: () => this.famInviteCreate(),
        message: "Soy " + nombre + ". Te he invitado a mi grupo familiar de BeValk, la app que uso para protegerme de estafas. Si no esperabas este mensaje, pregúntame antes de abrirlo: bevalk.es/i/7Q2K",
        share: () => this.showToast("Abriendo el menú para compartir."), copy: () => { this.showToast("Enlace copiado."); this.say("Enlace copiado."); },
        expires: "Caduca el 7 de noviembre (14 días)", done: () => this.famClose()});
    } else if (k === "inviteView") {
      const m = this.famMember(sh.id) || {nick:"", expires:""};
      sv = Object.assign(sv, {title:"Invitación para " + m.nick, isInviteView:true, status:"Esperando respuesta. Caduca el " + m.expires + ".",
        share: () => this.showToast("Abriendo el menú para compartir."), copy: () => this.showToast("Enlace copiado."),
        cancelInv: () => { this.famSet({sheet:null, members: f.members.filter(x => x.id !== sh.id)}); this.showToast("Invitación anulada. La plaza queda libre."); }});
    } else if (k === "retirar") {
      const m = this.famMember(sh.mid);
      sv = Object.assign(sv, {title:"¿Retirar a " + m.nick + " del grupo?", isRetirar:true,
        lines:[{t:"Desde ahora deja de tener Premium del grupo y de compartir contigo."}, {t:"Su plaza queda libre."}, {t:m.nick + " recibe un aviso. Sus datos siguen siendo suyos."}],
        confirm: () => { this.setState(st => ({screen:"familia", fam: Object.assign({}, st.fam, {sheet:null, view:"hub", mid:null, members: st.fam.members.filter(x => x.id !== sh.mid), reqs: st.fam.reqs.filter(x => x.from !== sh.mid)})})); this.showToast(m.nick + " ya no está en el grupo."); }});
    } else if (k === "apodo") {
      sv = Object.assign(sv, {title:"Cambiar apodo", isApodo:true, value: sh.value || "", set: e => this.famSheetSet({value: e.target.value.slice(0, 30)}),
        count: (sh.value || "").length + "/30",
        save: () => { const v = (sh.value || "").trim(); if (!v) return; this.famSet({sheet:null, members: f.members.map(x => x.id === sh.mid ? Object.assign({}, x, {nick:v}) : x)}); this.showToast("Apodo guardado."); }});
    } else if (k === "favs") {
      sv = Object.assign(sv, {title:"Alertas favoritas de la familia", isFavs:true, favs: FAM_FAVS.map((a, i) => ({t:a.t, sub:"Marcada por " + a.by + " · " + a.when, line: i ? "1px solid var(--color-border)" : "0",
        open: () => this.setState(st => ({screen:"alinfo", sheet:null, fam: Object.assign({}, st.fam, {sheet:null}), al: Object.assign({}, st.al, {view:"list"})}))}))});
    } else if (k === "preview") {
      sv = Object.assign(sv, {title:"Lo que ven tus miembros", isPreview:true, items: FAM_CATS_MINE.map(c => ({label:c.label, value: f.myShare[c.id] ? "Lo ven" : "No lo ven",
        icon: f.myShare[c.id] ? "eye" : "eye-off", tone: f.myShare[c.id] ? "var(--color-foreground)" : "var(--color-text-body)"}))});
    } else if (k === "cancel") {
      const n = people.length;
      sv = Object.assign(sv, {title:"Cancelar el plan familiar", isCancel:true,
        lines:[{t:"Tu plan sigue activo hasta el 14 de noviembre."}, {t:"Ese día, " + n + (n === 1 ? " persona pasa" : " personas pasan") + " a Basic y el grupo se deshace."},
          {t:"Dejas de ver lo que comparten y de avisarles."}, {t:"Si volvéis, cada persona tendrá que aceptar otra vez."}],
        keep: () => this.famClose(), store: () => { this.famClose(); this.showToast("Te llevamos a la tienda para cancelar."); }});
    } else if (k === "store") {
      sv = Object.assign(sv, {title:"Hoja de compra de la tienda", isStore:true, product: offer.product, total: offer.total + " " + offer.unit,
        activating: sh.phase === "activating", idle: sh.phase !== "activating",
        renew: "Se renueva hasta que la canceles en los ajustes de la tienda.", buy: () => this.famBuy()});
    } else if (k === "salir") {
      sv = Object.assign(sv, {title:"¿Salir de " + f.groupName + "?", isSalir:true,
        lines:[{t:"El cambio es inmediato: tu cuenta pasa a Basic ahora mismo."}, {t:adminShort + " deja de ver lo que compartes."}, {t:"Podrás contratar tu propio Premium cuando quieras."}],
        confirm: () => { this.setState(st => ({screen:"home", fam: Object.assign({}, st.fam, {sheet:null, role:"none", view:"oferta"})})); this.labSetSimPlan("free"); this.showToast("Has salido del grupo. Tu cuenta es Basic."); }});
    } else if (k === "ayuda") {
      const step = sh.step;
      const items = FAM_MY_ITEMS.map((it, i) => ({t:it.t, sub:it.sub, line: i ? "1px solid var(--color-border)" : "0",
        icon: it.kind === "link" ? "link" : it.kind === "alert" ? "bell" : "fingerprint",
        hasChip: !!it.v, chip: chip(it.v || "unknown"),
        pick: () => this.famSheetSet({step:"form", obj:{kind:it.kind, t:it.t, v:it.v || null}, err:false})}));
      const ob = sh.obj || {kind:"", t:""};
      const priv = ob.kind === "link" ? adminShort + " verá este enlace y su resultado. No verá nada más de lo que analizas."
        : ob.kind === "other" ? adminShort + " verá solo que has recibido un mensaje o una llamada y el motivo. No ve tus mensajes ni tus llamadas."
        : ob.kind === "leak" ? adminShort + " verá esta filtración, con tus datos ocultos en parte." : adminShort + " verá esta alerta.";
      sv = Object.assign(sv, {title: step === "sent" ? "Petición enviada" : "Pedir ayuda a " + adminShort, isAyudaPick: step === "pick", isAyudaForm: step === "form", isAyudaSent: step === "sent",
        items, analyze: () => { this.famClose(); this.anOpen("enlace"); },
        other: () => this.famSheetSet({step:"form", obj:{kind:"other", t:"Un mensaje o una llamada", v:null}, err:false}),
        objT: ob.t, objHasChip: !!ob.v, objChip: chip(ob.v || "unknown"), objIcon: ob.kind === "link" ? "link" : ob.kind === "other" ? "phone-call" : ob.kind === "leak" ? "fingerprint" : "bell",
        change: () => this.famSheetSet({step:"pick"}),
        motives: FAM_MOTIVES.map(mo => ({text:mo, checked: sh.motive === mo ? "true" : "false", bd: sh.motive === mo ? "var(--color-primary)" : "var(--color-border)",
          bg: sh.motive === mo ? "var(--color-accent)" : "var(--color-card)", dot: sh.motive === mo ? "var(--color-primary)" : "transparent",
          pick: () => this.famSheetSet({motive:mo, err:false})})),
        err: !!sh.err && !sh.motive, privacy: priv, send: () => this.famSendAyuda(),
        sentText: adminShort + " recibe tu petición ahora. Te responderá aquí y con una notificación.",
        money: sh.motive === "Me piden dinero", toSos: () => { this.famClose(); this.sosOpen(); },
        done: () => { this.famClose(); if (s.screen !== "familia") this.famOpen("home"); }});
    }

    /* ---- headings ---- */
    const heading = {hub:"Mi Familia", oferta:"Plan familiar", crear:"Crea tu grupo", ficha: ficha.name, avisos:"Avisos y peticiones", ajustes:"Ajustes de Mi Familia", unirse:"Invitación"}[f.view] || "Mi Familia";
    return {
      role, isAdmin, isMember, heading, back: () => this.famBack(),
      canBack: !(f.from === "tab" && ["hub", "oferta", "unirse", "crear"].indexOf(f.view) >= 0),
      isHub: f.view === "hub", isAdminHub: f.view === "hub" && isAdmin, isMemberHub: f.view === "hub" && isMember,
      isOffer: f.view === "oferta", isCrear: f.view === "crear", isFicha: f.view === "ficha" && !!fm, isAvisos: f.view === "avisos",
      isAjustes: f.view === "ajustes", isUnirse: f.view === "unirse",
      showSettings: f.view === "hub" && isAdmin, openSettings: () => this.famGo("ajustes"),
      hub, member, ficha, avisos, ajustes, offer, crear, unirse, sh: sv
    };
  }

  famHomeVals(){
    const role = this.famRole(), f = this.state.fam;
    const people = f.members.filter(m => !m.pending), open = f.reqs.filter(r => !r.reply);
    // Grupo de avatares en el mismo hueco de 48 px que el resto de elementos iniciales: uno lleno, o dos de 32 px en diagonal.
    const av = list => list.length <= 1
      ? list.map(x => ({ini:x, z:"1", top:"0", left:"0", size:"48px", font:"700 1.0625rem/1 var(--font-sans)"}))
      : [{ini:list[0], z:"2", top:"0", left:"0", size:"32px", font:"700 0.8125rem/1 var(--font-sans)"},
         {ini: list.length > 2 ? "+" + (list.length - 1) : list[1], z:"1", top:"16px", left:"16px", size:"32px", font:"700 0.8125rem/1 var(--font-sans)"}];
    const ini = av(people.map(m => m.ini));
    if (role === "admin") {
      const req = open[0], rm = req ? this.famMember(req.from) : null;
      const risky = people.filter(m => m.level !== "safe" && (!rm || m.id !== rm.id));
      return {title:"Mi Familia", hasBadge: open.length > 0, badge: (n => n === 1 ? "1 petición" : n + " peticiones")(open.filter((r, i) => open.findIndex(x => x.from === r.from && x.obj === r.obj) === i).length),
        body: rm ? rm.nick + " te pide ayuda con un enlace." + (risky[0] ? " " + risky[0].nick + ": " + risky[0].status.toLowerCase() + "." : "")
          : people.length ? (risky.length ? risky[0].nick + ": " + risky[0].status.toLowerCase() + "." : "Todo en orden en " + f.groupName + ".") : "Invita a tu familia para empezar.",
        avatars: ini.length ? ini : av(["+"]), hasAvatars:true, hasIcon:false, icon:"", open: () => this.famOpen("home"),
        aria: "Mi Familia" + (open.length ? ", " + open.length + " petición de ayuda pendiente" : "")};
    }
    if (role === "member") return {title:"Familia Navarro", hasBadge: !!f.mem.aviso, badge:"1 aviso nuevo",
      body: f.mem.aviso ? "Lucía ha respondido a tu petición de ayuda." : "¿Dudas con un mensaje o una llamada? Pide ayuda a Lucía.",
      avatars: av(["L"]), hasAvatars:true, hasIcon:false, icon:"", open: () => this.famOpen("home"), aria:"Mi Familia" + (f.mem.aviso ? ", 1 aviso nuevo" : "")};
    if (role === "invited") return {title:"Te han invitado", hasBadge:true, badge:"Invitación",
      body:"Lucía Navarro te invita a Familia Navarro. Revisa qué compartirías antes de unirte.", avatars: av(["L"]), hasAvatars:true, hasIcon:false, icon:"",
      open: () => this.famOpen("home"), aria:"Invitación de Lucía Navarro a Familia Navarro"};
    return {title:"Plan familiar", hasBadge:false, badge:"", body:"Cuida de las personas adultas de tu familia. Cada una decide qué comparte contigo.",
      avatars:[], hasAvatars:false, hasIcon:true, icon:"users-round", open: () => this.famOpen("home"), aria:"Plan familiar"};
  }

  renderVals(){
    const s = this.state;
    const w = this.world();
    const prem = w.plan === "premium";
    const p = this.parts(w);
    const score = this.scoreOf(w);
    const level = this.levelOf(score);
    const ringColor = scoreColor(s.shown, "ring"), scoreTextColor = scoreColor(score, "text");
    const pending = this.pending(w);
    const nOpen = pending.filter(x => x.kind === "step" || x.kind === "base" || x.kind === "vig").length;

    let title, subtitle;
    if (level === "green") {
      title = pending.length === 0 ? "Todo al día" : "Todo en orden";
      subtitle = w.checked + (w.delta ? " · " + w.delta : "");
    } else if (level === "amber") {
      title = w.active === false && !w.nuevo ? "Tu protección ha bajado" : nOpen > 0 ? ("Tienes " + nOpen + (nOpen === 1 ? " cosa pendiente" : " cosas pendientes")) : "Te faltan " + pending.length + " cosas";
      subtitle = w.checked;
    } else {
      title = "Hay algo que necesita tu atención";
      subtitle = w.checked;
    }

    const nextUp = pending[0];
    const openAction = id => () => this.setState({screen:"pasos", actId:id, from:s.screen === "pasos" ? s.from : s.screen, sheet:null});

    const challengeOpen = nextUp
      ? (nextUp.kind === "act" ? this.goActivity(nextUp.def) : nextUp.kind === "learn" ? (() => this.openLesson(nextUp.def.id)) : openAction(nextUp.def.id))
      : (() => {});

    const chips = [];
    chips.push(w.base.email ? {label:"Correo verificado", ok:1} : {label:"Falta verificar el correo", ok:0});
    chips.push(w.base.twofa ? {label:"Verificación en dos pasos puesta", ok:1} : {label:"Falta la verificación en dos pasos", ok:0});
    if (prem) {
      chips.push({label:"Vigilamos " + Object.keys(w.vig).length + " datos", ok:1});
      const left = Math.max(0, Math.min(5, this.allSteps().length) - w.done.length);
      chips.push(left ? {label:"Te faltan " + left + (left === 1 ? " paso" : " pasos"), ok:0} : {label:"Todos los pasos hechos", ok:1});
    } else {
      const scanFresh = w.nuevo || (w.act.scan !== undefined && w.act.scan <= 30);
      chips.push(scanFresh ? {label:"Has comprobado algo este mes", ok:1} : {label:"Sin comprobar nada este mes", ok:0});
      const alFresh = w.nuevo || (w.act.alerta !== undefined && w.act.alerta <= 30);
      chips.push(w.alertsLeft <= 0 ? {label:"Has usado tus 4 avisos", ok:2} : alFresh ? {label:"Has leído tus avisos", ok:1} : {label:"Tienes avisos sin leer", ok:0});
    }
    const chipStyle = c => c.ok === 1
      ? {icon:"check", bg:"var(--green-50)", fg:"var(--color-positive)", text:"var(--color-accent-foreground)"}
      : c.ok === 2 ? {icon:"lock", bg:"var(--color-accent)", fg:"var(--color-foreground)", text:"var(--color-accent-foreground)"}
      : {icon:"circle-dashed", bg:"var(--yellow-50)", fg:AMBER_TEXT, text:AMBER_TEXT};

    const expDef = ACT.map(a => {
      const pts = prem ? a.prem : a.free;
      const d = w.act[a.id];
      if (!pts || d === undefined || d === null || d > a.win) return null;
      const left = a.win - d;
      return left <= 3 ? {a, d, left, pts} : null;
    }).filter(Boolean)[0];

    const cmpVisible = (this.props.mostrarComparacion ?? true) && level !== "red";
    let comparison = {headline:"", detail:""};
    if (score >= 85) comparison = {headline:"Vas mejor que la mayoría.", detail:"De cada 10 personas como tú, 8 están por debajo."};
    else if (nextUp && nextUp.def.id === "twofa") comparison = {headline:"7 de cada 10 personas como tú ya tienen la verificación en dos pasos.", detail:"Es lo que más protege de todo lo que puedes hacer hoy."};
    else comparison = {headline:"La mayoría va un poco por delante.", detail:"De cada 10 personas como tú, 6 tienen más protección."};

    const streakVisible = w.weeks > 0 || w.lost > 0;
    const streak = {visible: streakVisible,
      label: w.weeks > 0 ? w.weeks + (w.weeks === 1 ? " semana seguida" : " semanas seguidas") : "Constancia perdida",
      sublabel: w.weeks > 0 ? "Sin fallar ni una semana" : "Llegaste a " + w.lost + " semanas. Se recupera usando la app.",
      freezes: w.freezes,
      icon: w.weeks > 0 ? "flame" : "flame-kindling",
      iconBg: w.weeks > 0 ? "var(--color-secondary)" : "var(--color-accent)",
      iconFg: w.weeks > 0 ? "var(--color-foreground)" : "var(--color-muted-foreground)"};

    const actPtsOf = a => prem ? a.prem : a.free;
    const rowOf = it => {
      const isAct = it.kind === "act";
      return {title: it.def.title, sub: it.kind === "step" ? it.group : isAct ? it.sub : it.def.time,
        icon: it.icon, pill: "+" + it.pts,
        tint:"var(--color-accent)", color:"var(--color-foreground)",
        titleColor:"var(--color-accent-foreground)",
        pillBg:"var(--color-accent)", pillBd:"var(--color-border)", pillFg:"var(--color-foreground)",
        open: isAct ? this.goActivity(it.def) : it.kind === "learn" ? (() => this.openLesson(it.def.id)) : openAction(it.def.id)};
    };

    const homeActions = level === "red" ? [] : pending.slice(1, 4).map(rowOf);

    const lockedSlots = VIG.filter(v => !v.soon).map(v => ({label:v.title.replace("Que vigilemos ", "").replace("Añade un ", ""), pts:"+" + v.pts, open:() => this.go("paywall")}));
    const upsellVisible = !prem && (score >= 85 || pending.length === 0);

    const catalog = [];
    catalog.push({label:"Tu cuenta", meta:"30 puntos", items: BASE.map(b => {
      const done = !!w.base[b.id];
      return {title:b.title, sub: done ? "Hecho" : b.time, icon: done ? "check" : "user-check",
        pill:"+" + b.pts, tint: done ? "var(--green-50)" : "var(--color-accent)",
        color: done ? "var(--color-positive)" : "var(--color-foreground)",
        titleColor: done ? "var(--color-text-body)" : "var(--color-accent-foreground)",
        pillBg: done ? "var(--green-50)" : "var(--color-accent)", pillBd: done ? "var(--color-positive)" : "var(--color-border)",
        pillFg: done ? "var(--color-positive)" : "var(--color-foreground)",
        open: openAction(b.id)};
    })});
    catalog.push({label:"Lo que sabes", meta: (LESSONS.length * LESSON_PTS) + " puntos · no caduca", items: LESSONS.map(l => {
      const done = (w.learn || []).indexOf(l.id) >= 0;
      return {title:l.task, sub: done ? "Aprendido" : "Tema de " + l.time, icon: done ? "check" : "graduation-cap",
        pill:"+" + LESSON_PTS, tint: done ? "var(--green-50)" : "var(--color-accent)",
        color: done ? "var(--color-positive)" : "var(--color-foreground)",
        titleColor: done ? "var(--color-text-body)" : "var(--color-accent-foreground)",
        pillBg: done ? "var(--green-50)" : "var(--color-accent)", pillBd: done ? "var(--color-positive)" : "var(--color-border)",
        pillFg: done ? "var(--color-positive)" : "var(--color-foreground)",
        open: () => this.openLesson(l.id)};
    })});
    catalog.push({label:"Lo que vigilamos por ti", meta:"40 puntos", items: VIG.map(v => {
      const done = prem && !!w.vig[v.id];
      const locked = !prem && !v.soon;
      return {title:v.title, sub: v.soon ? "Próximamente" : done ? "Vigilándolo cada día" : locked ? "Con Premium" : v.time,
        icon: v.soon ? "clock" : done ? "check" : locked ? "lock" : "eye",
        pill:"+" + v.pts,
        tint: done ? "var(--green-50)" : "var(--color-accent)",
        color: done ? "var(--color-positive)" : v.soon ? "var(--color-muted-foreground)" : "var(--color-foreground)",
        titleColor: v.soon ? "var(--color-muted-foreground)" : done ? "var(--color-text-body)" : "var(--color-accent-foreground)",
        pillBg:"var(--color-accent)", pillBd:"var(--color-border)",
        pillFg: v.soon ? "var(--color-muted-foreground)" : "var(--color-foreground)",
        open: v.soon ? (() => {}) : locked ? (() => this.go("paywall")) : openAction(v.id)};
    })});
    catalog.push({label:"Lo que resuelves", meta:"hasta 20 puntos", items: this.allSteps().map(st => {
      const done = w.done.indexOf(st.id) >= 0;
      const locked = !prem;
      const f = this.stepOwner(st.id);
      return {title:st.title, sub: done ? "Hecho" : locked ? "Con Premium" : f.label,
        icon: done ? "check" : locked ? "lock" : "key-round", pill:"+4",
        tint: done ? "var(--green-50)" : "var(--color-accent)",
        color: done ? "var(--color-positive)" : "var(--color-foreground)",
        titleColor: done ? "var(--color-text-body)" : "var(--color-accent-foreground)",
        pillBg: done ? "var(--green-50)" : "var(--color-accent)", pillBd: done ? "var(--color-positive)" : "var(--color-border)",
        pillFg: done ? "var(--color-positive)" : "var(--color-foreground)",
        open: locked ? (() => this.go("paywall")) : openAction(st.id)};
    })});
    catalog.push({label:"Tu día a día", meta:"caduca", items: ACT.filter(a => actPtsOf(a) > 0).map(a => {
      const d = w.act[a.id];
      const fresh = w.nuevo || (d !== undefined && d !== null && d <= a.win);
      return {title:a.title, sub: fresh ? "Al día · hay que repetirlo cada " + a.win + " días" : "Repítelo y recuperas estos puntos",
        icon: fresh ? "check" : "rotate-ccw", pill:"+" + actPtsOf(a),
        tint: fresh ? "var(--green-50)" : "var(--yellow-50)",
        color: fresh ? "var(--color-positive)" : AMBER_TEXT,
        titleColor:"var(--color-accent-foreground)",
        pillBg: fresh ? "var(--green-50)" : "var(--yellow-50)", pillBd: fresh ? "var(--color-positive)" : "var(--yellow-600)",
        pillFg: fresh ? "var(--color-positive)" : AMBER_TEXT,
        open: this.goActivity(a)};
    })});

    const bcolor = (e, a, risk) => e >= a ? "var(--color-positive)" : risk ? AMBER : "var(--color-primary)";
    const blocks = [
      {label:"Tu cuenta", earned:p.baseE, avail:30,
       description:"Correo verificado, configuración terminada y verificación en dos pasos. No caduca nunca."},
      {label:"Lo que sabes", earned:p.learnE, avail:p.learnA,
       description:"Cada tema de Aprende que superas suma " + LESSON_PTS + " puntos. Saber reconocer un fraude te protege, y no caduca."},
      {label:"Lo que vigilamos por ti", earned:p.vigE, avail:p.vigA,
       description: prem ? "Miramos tu correo, tu nombre y tu segundo correo cada día." : "Con el plan gratuito esto no cuenta en tu protección. Los slots siguen visibles con su valor.",
       note:"Teléfono y DNI llegan pronto: hasta entonces no cuentan ni te restan.", hasNote:true},
      {label: p.recE >= p.recA && prem ? "Lo que has resuelto" : "Lo que tienes pendiente", earned:p.recE, avail:p.recA,
       description: prem ? "Cada paso que cierras vale 4 puntos, hasta 5 pasos. Lo hecho no se deshace." : "Los pasos para cerrar una filtración llegan con Premium."},
      {label:"Tu día a día", earned:p.actE, avail:p.actA,
       description:"Avisos, escáner y MarIA. Es lo único que caduca, y como mucho son " + p.actA + " puntos."}
    ].filter(b => b.avail > 0).map(b => ({label:b.label, ratio: b.earned + " de " + b.avail,
      frac: (b.earned / b.avail).toFixed(3), color: bcolor(b.earned, b.avail, /pendiente/.test(b.label)),
      description:b.description, note:b.note || "", hasNote:!!b.hasNote && prem}));

    const act = s.actId ? this.findAction(s.actId) : null;
    const actDone = act ? (act.kind === "base" ? !!w.base[act.def.id]
      : act.kind === "vig" ? !!w.vig[act.def.id]
      : act.kind === "step" ? w.done.indexOf(act.def.id) >= 0
      : !w.act[act.def.id]) : false;
    const actView = act ? {group: act.group, title: act.def.title, why: act.def.why || "Suma " + act.pts + " puntos a tu protección.",
      pts: act.pts, time: act.def.time || "2 min", icon: act.icon,
      steps: (act.def.steps || []).map((t, i) => ({n: i + 1, text: t})),
      primaryLabel: act.def.cta || "Hacerlo ahora", primaryIcon: act.def.ctaIcon || "arrow-right",
      done: actDone, notDone: !actDone, undoThis: () => this.undoAction(act.def.id),
      primary: () => this.openSheet("confirm")}
      : {group:"", title:"", why:"", pts:0, time:"", icon:"circle", steps:[], primaryLabel:"", primaryIcon:"arrow-right",
         done:false, notDone:true, undoThis:() => {}, primary:() => {}};

    const nextPending = pending.filter(x => !s.actId || (x.def.id !== s.actId))[0];
    const subLesson = LESSONS.find(l => l.id === s.actId) || null;

    // Tu semana · Aprende · Lección · barra lateral
    const learned = w.learn || [];
    const lessonNext = LESSONS.find(l => learned.indexOf(l.id) < 0) || null;
    const wkSlots = this.weekSlots(w).slice().sort((a, b) => (b.done ? 1 : 0) - (a.done ? 1 : 0));
    const wkCount = wkSlots.filter(x => x.done).length;
    const wkFirstOpen = wkSlots.findIndex(x => !x.done);
    const ACT_ICON = {scan:"link", maria:"message-circle-more", huella:"fingerprint", alerta:"bell-ring"};
    const VIG_SHORT = {vemail:"Añade tu correo a Mi huella", vname:"Añade tu nombre a Mi huella", vemail2:"Añade otro correo a Mi huella"};
    const week = {
      count: String(wkCount), complete: wkCount === 3,
      sub: wkCount === 3 ? "3 de 3 · semana completa" : wkCount + " de 3 hechas · hasta el\u00a0domingo",
      bars: [0, 1, 2].map(k => ({bg: k < wkCount ? "var(--color-positive)" : "var(--color-secondary)"})),
      streakShort: w.weeks > 0 ? w.weeks + (w.weeks === 1 ? " semana" : " semanas") : "Semana 1",
      streakIcon: w.weeks > 0 ? "flame" : "flame-kindling",
      streakBg: w.weeks > 0 ? "var(--color-secondary)" : "var(--color-card)",
      streakAria: (w.weeks > 0 ? "Tu constancia: " + w.weeks + (w.weeks === 1 ? " semana seguida" : " semanas seguidas") : "Tu constancia") + ". Ver el detalle",
      slots: wkSlots.map((x, i) => {
        let eyebrow, title, meta, icon, open, urgent = false;
        if (x.key === "protect") {
          const it = x.item;
          eyebrow = (i + 1) + " · Protege";
          const isFam = !!it && it.kind === "fam";
          urgent = !x.done && (level === "red" || isFam);
          title = x.done ? (x.auto ? "Tu cuenta está al día" : "Has protegido tu cuenta esta semana")
            : it.kind === "vig" ? (VIG_SHORT[it.def.id] || it.def.title) : it.def.title;
          meta = x.done ? (x.auto ? "No hay nada pendiente" : "Hecho")
            : isFam ? "Importante · 1 min · cuenta para tu semana"
            : [urgent ? "Importante" : "", it.def.time || "2 min", "+" + it.pts + " puntos"].filter(Boolean).join(" · ");
          icon = isFam ? "hand-heart" : it && it.kind === "act" ? "bell-ring" : "shield-check";
          open = it ? this.openItem(it) : (() => this.go("desglose"));
        } else if (x.key === "learn") {
          eyebrow = (i + 1) + " · Aprende";
          title = x.done ? (x.lesson ? "Ya has aprendido algo esta semana" : "Has aprendido los 5 temas") : x.lesson.task;
          meta = x.done ? "Hecho · lo aprendido no caduca" : x.lesson.time + " · +" + LESSON_PTS + " puntos";
          icon = "graduation-cap";
          open = x.done || !x.lesson ? (() => this.go("aprende")) : (() => this.openLesson(x.lesson.id));
        } else {
          const a = x.act;
          eyebrow = (i + 1) + " · Usa una herramienta";
          title = x.done ? "Has usado una herramienta esta semana" : a.title;
          meta = x.done ? "Hecho" : a.time + (x.fresh ? " · cuenta para tu semana" : " · +" + (prem ? a.prem : a.free) + " puntos");
          icon = ACT_ICON[a.id] || "wrench";
          open = this.openItem({kind:"act", def:a});
        }
        const focus = i === wkFirstOpen;
        return {eyebrow, title, meta, open,
          icon: x.done ? "check" : icon,
          iconBg: x.done ? "var(--green-50)" : urgent ? "var(--red-50)" : focus ? "var(--color-card)" : "var(--color-accent)",
          iconFg: x.done ? "var(--color-positive)" : urgent ? "var(--color-destructive)" : "var(--color-foreground)",
          bg: focus ? "var(--color-accent)" : "var(--color-card)",
          bd: focus ? "var(--color-ring)" : "var(--color-border)",
          titleFg: x.done ? "var(--color-text-body)" : "var(--color-accent-foreground)",
          label: eyebrow + ". " + title + ". " + meta};
      })
    };
    const famHome = Object.assign(this.famHomeVals(), {top: this.famRole() !== "none"});
    const camino = {
      sub: lessonNext ? learned.length + " de " + LESSONS.length + " temas · Siguiente: " + lessonNext.topic : "5 de 5 temas · lo has aprendido todo",
      dots: LESSONS.map(l => ({bg: learned.indexOf(l.id) >= 0 ? "var(--color-positive)" : "var(--color-secondary)"}))
    };
    const ap = {
      progressLabel: learned.length + " de " + LESSONS.length + " temas aprendidos",
      ptsLabel: "+" + p.learnE + " de " + p.learnA + " puntos",
      frac: (learned.length / LESSONS.length).toFixed(3),
      topics: LESSONS.map((l, i) => {
        const done = learned.indexOf(l.id) >= 0, next = !!lessonNext && lessonNext.id === l.id;
        return {n: String(i + 1), topic: l.topic, title: l.title,
          meta: done ? "Aprendido · puedes repasarlo" : (next ? "Siguiente · " : "") + l.time + " · +" + LESSON_PTS + " puntos",
          nodeIcon: done ? "check" : l.icon,
          nodeBg: done ? "var(--green-50)" : next ? "var(--color-primary)" : "var(--color-accent)",
          nodeFg: done ? "var(--color-positive)" : next ? "var(--color-on-fill)" : "var(--color-foreground)",
          bg: next ? "var(--color-accent)" : "var(--color-card)", bd: next ? "var(--color-ring)" : "var(--color-border)",
          line: i === LESSONS.length - 1 ? "transparent" : done ? "var(--color-positive)" : "var(--color-border)",
          open: () => this.openLesson(l.id)};
      }),
      hasSkills: learned.length > 0, noSkills: learned.length === 0,
      skills: LESSONS.filter(l => learned.indexOf(l.id) >= 0).map(l => ({text: l.skill}))
    };
    const le = (() => {
      const L = s.les ? LESSONS.find(x => x.id === s.les.id) : null;
      const blank = {n:"", topic:"", stepN:"1", stepLabel:"", bars:[], isCard:false, isQuiz:false, card:{icon:"circle", title:"", body:""},
        q:"", hasMsg:false, msg:"", msgKind:"", msgFrom:"", msgIcon:"message-square", opts:[], showFeedback:false,
        fbTitle:"", fbText:"", fbIcon:"info", fbFg:"var(--color-foreground)", fbBg:"var(--color-accent)", fbBd:"var(--color-border)",
        primaryLabel:"", primaryDisabled:"false", primaryBg:"var(--color-primary)", primaryFg:"var(--color-on-fill)", primaryCursor:"pointer",
        primary:() => {}, hasSecondary:false, secondaryLabel:"", secondary:() => {}, close:() => this.go("aprende")};
      if (!L) return blank;
      const st = s.les, i = st.i, nCards = L.cards.length, isQuiz = i >= nCards, total = nCards + 1;
      const card = L.cards[Math.min(i, nCards - 1)];
      const q = L.quiz;
      const picked = st.pick !== null && st.pick !== undefined ? q.opts[st.pick] : null;
      const checked = !!st.checked, right = checked && !!picked && picked.ok;
      const repeat = learned.indexOf(L.id) >= 0;
      const set = patch => this.setState(x => ({les: Object.assign({}, x.les, patch)}));
      const KIND_ICON = {"SMS":"message-square", "WhatsApp":"message-circle", "Anuncio":"megaphone"};
      const blocked = isQuiz && !checked && !picked;
      return Object.assign({}, blank, {
        n: String(LESSONS.indexOf(L) + 1), topic: L.topic,
        stepN: String(i + 1), stepLabel: (i + 1) + " de " + total,
        bars: Array.from({length: total}, (_, k) => ({bg: k <= i ? "var(--color-primary)" : "var(--color-secondary)"})),
        isCard: !isQuiz, isQuiz, card: {icon: card.icon, title: card.title, body: card.body},
        q: q.q, hasMsg: !!q.msg, msg: q.msg, msgKind: q.kind, msgFrom: q.from, msgIcon: KIND_ICON[q.kind] || "message-square",
        opts: q.opts.map((o, k) => {
          const sel = st.pick === k, okNow = checked && sel && o.ok, badNow = checked && sel && !o.ok;
          return {t: o.t, pressed: sel ? "true" : "false",
            bd: okNow ? "var(--color-positive)" : badNow ? "var(--color-destructive)" : sel ? "var(--color-primary)" : "var(--color-border)",
            bg: okNow ? "var(--green-50)" : badNow ? "var(--red-50)" : sel ? "var(--color-accent)" : "var(--color-card)",
            dotBd: okNow ? "var(--color-positive)" : badNow ? "var(--color-destructive)" : sel ? "var(--color-primary)" : "var(--color-ring)",
            dotBg: okNow ? "var(--color-positive)" : badNow ? "var(--color-destructive)" : sel ? "var(--color-primary)" : "var(--color-card)",
            dotIcon: badNow ? "x" : "check", dotFg: sel ? "var(--color-on-fill)" : "var(--color-card)",
            cursor: checked ? "default" : "pointer",
            pick: () => { if (!checked) set({pick: k}); }};
        }),
        showFeedback: checked && !!picked,
        fbTitle: right ? "¡Eso es!" : "Casi. Piénsalo otra vez",
        fbText: picked ? picked.why : "",
        fbIcon: right ? "circle-check" : "lightbulb",
        fbFg: right ? "var(--color-positive)" : AMBER_TEXT,
        fbBg: right ? "var(--green-50)" : "var(--yellow-50)",
        fbBd: right ? "var(--color-positive)" : "var(--yellow-600)",
        primaryLabel: !isQuiz ? (i === nCards - 1 ? "Ir a la pregunta" : "Siguiente")
          : !checked ? "Comprobar" : right ? (repeat ? "Terminar el repaso" : "Terminar el tema") : "Probar otra vez",
        primaryDisabled: blocked ? "true" : "false",
        primaryBg: blocked ? "var(--color-muted)" : "var(--color-primary)",
        primaryFg: blocked ? "var(--color-muted-foreground)" : "var(--color-on-fill)",
        primaryCursor: blocked ? "not-allowed" : "pointer",
        primary: () => {
          if (!isQuiz) return set({i: i + 1});
          if (!checked) { if (!picked) return; set({checked:true}); this.say(picked.ok ? "Correcto. " + picked.why : "No es correcto. " + picked.why); return; }
          if (right) return this.finishLesson(L.id);
          set({pick:null, checked:false});
        },
        hasSecondary: i > 0 && !right,
        secondaryLabel: isQuiz ? "Repasar las tarjetas" : "Anterior",
        secondary: () => set({i: isQuiz ? 0 : i - 1, pick:null, checked:false}),
        close: () => this.go(st.from || "aprende")
      });
    })();
    const curFlow = s.flow || ((FLOWS.find(f => !f.start && f.scen === this.scenKey() && (f.fam || "none") === this.famRole()) || {}).id) || null;
    const flowRow = (f, n) => {
      const on = f.id === curFlow;
      return {n: String(n), label: f.label, sub: f.sub, current: on ? "true" : "false", isOn: on, tip: f.tip,
        restart: () => this.selectFlow(f),
        bg: on ? "var(--color-accent)" : "transparent", bd: on ? "var(--color-ring)" : "transparent",
        numBg: on ? "var(--color-primary)" : "var(--color-secondary)", numFg: on ? "var(--color-on-fill)" : "var(--color-foreground)",
        select: () => this.selectFlow(f)};
    };
    const flowGroups = [];
    FLOWS.forEach((f, i) => {
      let g = flowGroups.find(x => x.label === f.group);
      if (!g) { g = {label: f.group, items: []}; flowGroups.push(g); }
      g.items.push(flowRow(f, i + 1));
    });
    const sw = on => ({checked: on ? "true" : "false", track: on ? "var(--color-primary)" : "var(--color-secondary)", justify: on ? "flex-end" : "flex-start"});
    const side = {
      groups: flowGroups,
      more: FLOW_MORE.map(k => ({label: SCEN[k].label, current: !s.flow && this.scenKey() === k ? "true" : "false",
        bg: !s.flow && this.scenKey() === k ? "var(--color-secondary)" : "var(--color-card)",
        select: () => { this.setScen(k); this.setState({flow:null, les:null, from:"home", fam: Object.assign(FAM0(), {role:"none"}), br: BR0(false), cases:[], alDone:{}, autoOn:false}); }})),
      tip: curFlow ? (FLOWS.find(f => f.id === curFlow) || {}).tip : "Estado suelto: " + ((SCEN[this.scenKey()] || {}).label || "") + ". Usa el prototipo libremente.",
      loose: !curFlow, flowCount: String(FLOWS.length) + " flujos",
      restart: () => { const f = FLOWS.find(x => x.id === curFlow); if (f) this.selectFlow(f); else this.setScen(this.scenKey()); },
      offline: sw(this.off()), toggleOffline: () => this.setState({offline: !this.off()}),
      bio: sw(this.bioOn()), toggleBio: () => this.setState({bio: !this.bioOn(), bioOk:false}),
      openPush: () => this.setState({screen:"alertas", push:true, from:"home", sheet:null, les:null})
    };

    const weeksGrid = [0,1,2,3,4,5,6,7].map(i => {
      const active = i < Math.min(w.weeks, 8);
      return {label: i === 7 ? "Ahora" : "S" + (i + 1),
        icon: active ? "flame" : "circle",
        bg: active ? "var(--color-secondary)" : "var(--color-card)",
        bd: active ? "var(--color-ring)" : "var(--color-border)",
        fg: active ? "var(--color-foreground)" : "var(--color-muted-foreground)"};
    });

    const scans = 30 + (w.act.scan === 0 ? 1 : 0);
    const milestones = [
      {label:"Enlaces y códigos comprobados", value: String(scans), frac:"0.75", hint:"Cada 10 más, te lo contamos.", icon:"scan-line", tint:"var(--color-accent)", color:"var(--color-foreground)"},
      {label:"Pasos cerrados", value: String(w.done.length + 5), frac: String(Math.min(1, (w.done.length + 5) / 15)), hint:"Van 10 de los 15 del siguiente hito.", icon:"circle-check", tint:"var(--green-50)", color:"var(--color-positive)"},
      {label:"Meses cuidando tus datos", value:"6", frac:"0.5", hint:"En 6 más llegas al año.", icon:"calendar-check", tint:"var(--color-accent)", color:"var(--color-foreground)"}
    ];

    const readIds = s.read || [];
    const alerts = ALERTS.map((a, i) => {
      const unread = readIds.indexOf(a.id) < 0 && !!a.unread;
      const blocked = !prem && w.alertsLeft <= 0 && unread && a.type === "tip";
      const tp = ALERT_TYPES[a.type] || ALERT_TYPES.tip;
      return {title: blocked ? "Consejo bloqueado en el plan gratuito" : a.title,
        body: blocked ? "Es un consejo, no una filtración tuya. Con Premium lo lees entero." : a.body,
        date:a.date, meta: tp.label + " · " + a.date + ((s.alDone || {})[a.id] ? " · Resuelto" : ""), unread: unread && !blocked,
        titleFont: (unread ? "700" : "500") + " 0.9375rem/1.25rem var(--font-sans)",
        icon: blocked ? "lock" : tp.icon,
        tint: blocked ? "var(--color-accent)" : a.grave ? "var(--red-50)" : "var(--color-accent)",
        color: blocked ? "var(--color-foreground)" : a.grave ? "var(--color-destructive)" : "var(--color-foreground)",
        border: unread && !blocked ? "var(--color-ring)" : "var(--color-border)",
        open: blocked ? (() => this.go("paywall"))
          : (() => {
              this.setState(st => ({screen:"aviso", alSel:a.id, sheet:null, read: st.read.indexOf(a.id) < 0 ? st.read.concat([a.id]) : st.read}));
              if (unread) this.awardSilent("alerta", "Leer un aviso cuenta en tu día a día.");
            })};
    });

    const alertaFresh = w.nuevo || (w.act.alerta !== undefined && w.act.alerta <= 30);
    const scanFresh2 = w.nuevo || (w.act.scan !== undefined && w.act.scan <= 30);

    const tabDef = [
      // Suite: cada pestaña es una tarea. Perfil vive en el encabezado de Inicio.
      {id:"home", label:"Inicio", icon:"house", screens:["home","desglose","acciones","pasos","hitos","alertas","aviso","alinfo","aprende","leccion","perfil","notificaciones","pfflow","subida"]},
      {id:"comprobar", label:"Comprobar", icon:"scan-search", screens:["escaner","analizador"]},
      {id:"huella", label:"Mi huella", icon:"fingerprint", screens:["huella","huflow","bloqueo","borrar"]},
      {id:"familia", label:"Familia", icon:"users", screens:["familia"]},
      {id:"ayuda", label:"Ayuda", icon:"life-buoy", screens:["ayuda","sos","maria","guia","soporte"]}
    ];
    const activeTab = s.screen === "analizador" && s.an.from === "ayuda" ? "ayuda"
      : s.screen === "maria" && s.from === "escaner" ? "comprobar"
      : (tabDef.find(t => t.screens.indexOf(s.screen) >= 0) || tabDef[0]).id;
    const famBadge = this.famRole() === "admin" ? (s.fam.reqs || []).some(r => !r.reply)
      : this.famRole() === "member" ? !!(s.fam.mem && s.fam.mem.aviso) : this.famRole() === "invited";

    const sheetKind = s.sheet ? s.sheet.kind : null;
    const optTarget = s.sheet && s.sheet.kind === "opts" ? s.sheet.target : null;
    const optList = optTarget === "sos" ? SOS_HELP : optTarget === "sop" ? SOP_ASUNTOS : optTarget === "prdel" ? PR_DEL : optTarget === "prsec" ? PR_SEC.map(x => x[1]) : optTarget === "prfb" ? PR_FB.map(x => x[0]) : [];
    const optCur = optTarget === "sos" ? s.sos.help : optTarget === "sop" ? s.sop.asunto : optTarget === "prdel" ? s.pr.del.reason : optTarget === "prsec" ? ((PR_SEC.find(x => x[0] === s.pr.sec) || [])[1] || "") : optTarget === "prfb" ? ((s.pr.fb || {}).topic || "") : "";
    const sheetBase = sheetKind === "opts"
      ? {visible:false, target: optTarget, title: s.sheet.title || "", body:"", hasList:false, list:[], hasPrimary:false, primaryLabel:"", primary:() => {},
         hasOpts:true, titleAlign:"left",
         opts: optList.map(label => ({label, selected: label === optCur,
           bg: label === optCur ? "var(--color-accent)" : "transparent",
           pick: () => optTarget === "prfb" ? this.setState(st => ({sheet:null, pr: Object.assign({}, st.pr, {fb: Object.assign({}, st.pr.fb, {topic:label, err: Object.assign({}, (st.pr.fb || {}).err, {topic:false})})})}))
             : optTarget === "prsec" ? (label === PR_SEC[1][1]
               ? this.prGo("fa", Object.assign(this.prSecReset(), {fa:{step:"intro", code:"", err:null, n:0}}))
               : this.setState(st => ({sheet:null, pr: Object.assign({}, st.pr, this.prSecReset(), {sec: label === PR_SEC[0][1] ? "pass" : "borrar"})})))
             : this.setState(st => optTarget === "prdel"
             ? {sheet:null, pr: Object.assign({}, st.pr, {del:{reason:label, other: st.pr.del.other || "", err:{}}})}
             : optTarget === "sos"
             ? {sheet:null, sos: Object.assign({}, st.sos, {help:label, err: Object.assign({}, st.sos.err, {help:false})})}
             : {sheet:null, sop: Object.assign({}, st.sop, {asunto:label, err: Object.assign({}, st.sop.err, {asunto:false})})})})),
         closeLabel:"", close:() => this.setState({sheet:null})}
      : sheetKind === "pr-del"
      ? {visible:true, title:"¿Eliminar tu cuenta?",
         body:"Se borran tus datos, tu historial con MarIA y los datos que vigilamos. No se puede deshacer.",
         hasList:false, list:[], hasPrimary:false, primaryLabel:"", primary:() => {},
         hasDanger:true, dangerLabel:"Eliminar cuenta",
         danger:() => { this.setState(st => ({sheet:null, screen:"home", pr: Object.assign({}, st.pr, {view:"hub", del:{reason:"", err:false}})})); this.showToast("Tu cuenta se ha eliminado."); },
         closeLabel:"Cancelar", close:() => this.setState({sheet:null})}
      : sheetKind === "pr-cancel"
      ? {visible:true, title:"¿Cancelar tu suscripción?",
         body:"Seguirás teniendo Premium hasta el final del periodo ya pagado. Después dejaremos de vigilar tus datos cada día.",
         hasList:false, list:[], hasPrimary:false, primaryLabel:"", primary:() => {},
         hasDanger:true, dangerLabel:"Cancelar suscripción",
         danger:() => { this.setState({sheet:null}); this.showToast("Suscripción cancelada. Premium sigue activo hasta fin de periodo."); },
         closeLabel:"Mantener Premium", close:() => this.setState({sheet:null})}
      : sheetKind === "hu-premium"
      ? {visible:true, title:"Vigila más datos con Premium", body:"",
         hasList:true, list:[
           {icon:"check", text:"Pasos guiados para solucionar cada filtración"},
           {icon:"check", text:"Teléfono y DNI vigilados, con aviso al instante en tu móvil"},
           {icon:"check", text:"Hasta 5 correos, 2 teléfonos y tu DNI"},
           {icon:"check", text:"MarIA te ayuda con cualquier duda"}],
         hasPrimary:true, primaryLabel:"Activar Premium · 4,17 €/mes",
         primary:() => this.go("paywall"),
         closeLabel:"Ahora no", close:() => this.setState({sheet:null})}
      : sheetKind === "hu-pick"
      ? {visible:true, title:"¿Qué quieres vigilar?", body:"",
         hasList:false, list:[],
         hasPick:true, pick: this.huVals(prem).pickRows.map(r => Object.assign({}, r, {open: () => { this.setState({sheet:null}); r.open(); }})),
         hasPrimary:false, primaryLabel:"", primary:() => {},
         closeLabel:"Cancelar", close:() => this.setState({sheet:null})}
      : sheetKind === "pf-logout"
      ? {visible:true, title:"¿Cerrar sesión?",
         body:"Seguiremos vigilando tus datos. Al volver a entrar te pediremos el correo y la contraseña.",
         hasList:false, list:[], hasPrimary:false, primaryLabel:"", primary:() => {},
         hasDanger:true, dangerLabel:"Cerrar sesión", danger:() => this.logout(),
         closeLabel:"Cancelar", close:() => this.setState({sheet:null})}
      : sheetKind === "hu-dni"
      ? {visible:true, title:"Condiciones de la vigilancia del DNI",
         body:"Texto provisional, pendiente de revisión legal.",
         hasList:true, list:[
           {icon:"check", text:"Buscamos tu DNI en filtraciones conocidas y te avisamos si aparece."},
           {icon:"check", text:"No lo vendemos, no lo compartimos y no lo usamos para ninguna otra cosa."},
           {icon:"check", text:"La base legal es tu consentimiento explícito. Puedes retirarlo cuando quieras borrando el DNI de la app."},
           {icon:"check", text:"Responsable del tratamiento: BeValk. Puedes ejercer tus derechos desde Tu cuenta."}],
         hasPrimary:true, primaryLabel:"Leer el documento completo",
         primary:() => { this.setState({sheet:null}); this.showToast("Abriendo el documento legal completo."); },
         closeLabel:"Cerrar", close:() => this.setState({sheet:null})}
      : sheetKind === "hu-del"
      ? {visible:true, title: ((s.hu.items[s.hu.sel] || {}).kind === "email") ? "¿Dejar de vigilar este email?" : "¿Dejar de vigilar este dato?",
         body:"Dejaremos de avisarte si aparece en filtraciones nuevas. Las filtraciones ya detectadas se eliminarán de tu historial.",
         hasList:false, list:[], hasPrimary:false, primaryLabel:"", primary:() => {},
         hasDanger:true, dangerLabel:"Sí, eliminar", danger:() => this.huRemove(),
         closeLabel:"Cancelar", close:() => this.setState({sheet:null})}
      : sheetKind === "ayuda"
      ? {visible:true, title:"De dónde sale este número",
         body:"Tu protección se calcula sobre lo que puedes conseguir con tu plan. Hoy llevas " + p.earned + " de " + p.avail + " puntos posibles.",
         hasList:true, list:[
           {icon:"user-check", text:"Tu cuenta: lo que dejas configurado una vez y no se pierde."},
           {icon:"graduation-cap", text:"Lo que sabes: los temas de Aprende que has superado. Tampoco caduca."},
           {icon:"eye", text:"Lo que vigilamos por ti: los datos que miramos cada día."},
           {icon:"key-round", text:"Lo que resuelves: cada paso que cierras de una filtración."},
           {icon:"rotate-ccw", text:"Tu día a día: hasta " + p.actA + " puntos por usar la app. Se renuevan solos, no se pierden para siempre."}],
         hasPrimary:true, primaryLabel:"Ver el desglose", primary:() => this.go("desglose"),
         closeLabel:"Entendido", close:() => this.setState({sheet:null})}
      : sheetKind === "perm-noti"
      ? {visible:true, title:"¿Te avisamos en el móvil?",
         body:"Para que te llegue un aviso cuando tus datos aparezcan en una filtración, el móvil tiene que dejarnos. Si dices que no, seguirás viendo los avisos dentro de la app.",
         hasList:true, list:[
           {icon:"shield-alert", text:"Filtraciones que te afectan: te avisamos el mismo día."},
           {icon:"clock", text:"Nada más. No mandamos ofertas ni recordatorios sueltos."}],
         hasPrimary:true, primaryLabel:"Permitir los avisos",
         primary:() => { this.setState({sheet:null, notiPerm:"Concedido"}); this.showToast("Listo. Te avisaremos en el móvil."); },
         closeLabel:"Ahora no",
         close:() => { this.setState({sheet:null, notiPerm:"Denegado"}); this.showToast("De acuerdo. Los verás solo dentro de la app."); }}
      : sheetKind === "auto"
      ? (s.autoOn
        ? {visible:true, title:"Avisos automáticos activados", hasIcon:true, icon:"shield-check", iconBg:"var(--green-50)", iconFg:"var(--color-positive)",
           body:"Te avisaremos si llega un SMS sospechoso o te llama un número denunciado. No tienes que hacer nada más.",
           hasList:false, list:[], hasPrimary:true, primaryLabel:"Entendido", primary:() => this.setState({sheet:null}),
           hasSubtle:true, subtleLabel:"Desactivar los avisos automáticos", subtle:() => { this.setState({sheet:null, autoOn:false}); this.showToast("Avisos automáticos desactivados."); },
           closeLabel:"", close:() => this.setState({sheet:null})}
        : {visible:true, title:"Que BeValk revise tus SMS y llamadas", hasIcon:true, icon:"shield", iconBg:"var(--color-accent)", iconFg:"var(--color-foreground)",
           body:"Te avisamos sin que tengas que copiar nada. Así funciona:",
           hasList:true, list:[
             {icon:"message-square-warning", text:"En iPhone, apartamos los SMS sospechosos de números que no tienes guardados."},
             {icon:"phone-off", text:"En Android, te avisamos si te llama un número denunciado como estafa."},
             {icon:"eye-off", text:"No vemos los mensajes de tus contactos ni guardamos tus conversaciones."},
             {icon:"settings", text:"Se activa en los ajustes del móvil. Te guiamos paso a paso."}],
           hasPrimary:true, primaryLabel:"Activar", primary:() => { this.setState({sheet:null, autoOn:true}); this.showToast(this.notiPerm() === "Denegado" ? "Activados, pero los avisos del móvil están apagados: no te llegará nada hasta que los permitas en Ajustes." : "Listo. Te avisaremos si llega algo sospechoso."); },
           closeLabel:"Ahora no", close:() => this.setState({sheet:null})})
      : sheetKind === "access" && s.an.verdict !== "safe"
      ? (() => { const pt = PZ_TYPE[s.an.type] || PZ_TYPE.enlace, br = this.pzBrand(s.an.value);
          return {visible:true, title: pt.openQ, hasIcon:true, icon:"triangle-alert", iconBg:"var(--red-50)", iconFg:"var(--red-700)",
            body: (br ? (pt.noun.charAt(0).toUpperCase() + pt.noun.slice(1)) + " se hace pasar por " + br.brand + "." : "No hemos podido confirmar que sea de fiar.") + " Si sigues, ten en cuenta esto:",
            hasList:true, list:[{icon:"credit-card", text:"No pagues nada, aunque te lo pida."}, {icon:"key-round", text:"No escribas contraseñas, datos ni códigos."}, {icon:"undo-2", text:"Si te pide algo, ciérralo y vuelve aquí."}],
            hasPrimary:true, primaryLabel:"Mejor no lo hago", primary:() => { this.setState({sheet:null}); this.showToast("Bien hecho. No hemos abierto nada."); },
            hasSubtle:true, subtleLabel: pt.openBtn, subtle:() => { this.setState({sheet:null}); this.showToast("Has salido de BeValk. Recuerda: no pagues ni des datos."); },
            closeLabel:"", close:() => this.setState({sheet:null})}; })()
      : sheetKind === "access"
      ? {visible:true, centered:true, title:"¡Atención!",
         body: (s.an.verdict === "unknown" ? "Estás a punto de acceder a un sitio que no hemos podido verificar." : "Estás a punto de acceder a un sitio reconocido como potencialmente inseguro.") + " Si pulsas \u201cContinuar\u201d, BeValk no se responsabiliza de lo que pueda suceder.",
         hasList:false, list:[], hasPrimary:true, primaryLabel:"Continuar",
         primary:() => { this.setState({sheet:null}); this.showToast("Has salido de BeValk. Ten mucho cuidado con lo que compartes."); },
         closeLabel:"Volver",
         close:() => this.setState({sheet:null})}
      : sheetKind === "premium-img"
      ? {visible:true, title:"Adjuntar una imagen es Premium",
         body:"Con Premium puedes enviarle a MarIA capturas y fotos, y te dice si hay fraude en lo que ves. Escribirle y pegarle enlaces sigue siendo gratis.",
         hasList:false, list:[], hasPrimary:true, primaryLabel:"Ver Premium",
         primary:() => this.go("paywall"), closeLabel:"Ahora no",
         close:() => this.setState({sheet:null})}
      : sheetKind === "confirm"
      ? {visible:true, title:"¿Ya lo has hecho?",
         body:"Lo damos por hecho y tu protección sube " + (act ? act.pts : 0) + " puntos. Si te has liado, puedes deshacerlo en la pantalla siguiente.",
         hasList:false, list:[], hasPrimary:true, primaryLabel:"Sí, ya está",
         primary:() => this.complete(s.actId), closeLabel:"Todavía no",
         close:() => this.setState({sheet:null})}
      : {visible:false, title:"", body:"", hasList:false, list:[], hasPrimary:false, primaryLabel:"", primary:() => {}, closeLabel:"", close:() => {}};
    const sheet = Object.assign({hasPick:false, pick:[], hasOpts:false, opts:[], titleAlign:"center", centered:false, hasDanger:false, hasSubtle:false, hasIcon:false, icon:"circle", iconBg:"var(--color-accent)", iconFg:"var(--color-foreground)"}, sheetBase,
      {hasBody: !!sheetBase.body, hasClose: !!sheetBase.closeLabel});
    Object.assign(sheet, {hasHandle: !sheet.centered, justify: sheet.centered ? "center" : "flex-end", outerPad: sheet.centered ? "16px" : "0",
      radius: sheet.centered ? "16px" : "24px 24px 44px 44px"});

    const so = s.sos, soErr = so.err || {};
    const sosBd = bad => bad ? "var(--color-destructive)" : "var(--color-ring)";
    return {
      isAlInfo: s.screen === "alinfo",
      al: (() => {
        const a = s.al, set = p => this.setState(st => ({al: Object.assign({}, st.al, p)}));
        const qn = (a.applied || "").trim().toLowerCase();
        const list = AL_ITEMS.filter(x => (a.tab !== "favoritos" || a.fav[x.id]) && (!qn || x.title.toLowerCase().indexOf(qn) >= 0));
        const cur = AL_ITEMS.find(x => x.id === a.sel) || AL_ITEMS[0];
        const isFav = !!a.fav[cur.id];
        const segs = str => String(str).split("**").map((tx, i) => ({text:tx, weight: i % 2 ? "600" : "400"})).filter(x => x.text);
        return {
          isList: a.view === "list", isDetail: a.view === "detail",
          back: () => a.view === "detail" ? set({view:"list"}) : this.go(s.from === "aprende" ? "aprende" : "home"),
          q: a.q, type: e => set({q: e.target.value, applied: e.target.value === "" ? "" : a.applied}),
          submit: e => { if (e && e.preventDefault) e.preventDefault(); set({applied: a.q}); },
          tabs: [["todos","Todos"],["favoritos","Favoritos"]].map(([k, l]) => ({label:l, selected: a.tab === k ? "true" : "false",
            bg: a.tab === k ? "var(--color-card)" : "transparent", shadow: a.tab === k ? "var(--shadow-sm)" : "none", pick: () => set({tab:k})})),
          isEmpty: list.length === 0,
          emptyIcon: qn ? "search-x" : "bookmark",
          emptyTitle: qn ? "Sin resultados" : "Todavía no tienes favoritas",
          emptyBody: qn ? "No hay alertas que coincidan con \"" + a.applied.trim() + "\". Prueba con otra palabra." : "Abre una alerta y toca Favorito para guardarla aquí.",
          items: list.map(x => ({title:x.title, read:x.read, date:x.date, img:x.img, imgAlt:x.imgAlt,
            openLabel: "Leer más: " + x.title, open: () => set({view:"detail", sel:x.id})})),
          cur: {title:cur.title, date:cur.date, img:cur.img, imgAlt:cur.imgAlt},
          body: cur.body.map(p => {
            const it = /^_.*_$/.test(p);
            return {font: (it ? "italic " : "") + "400 1rem/1.625rem var(--font-sans)", segs: segs(it ? p.slice(1, -1) : p)};
          }),
          favPressed: isFav ? "true" : "false", favIcon: isFav ? "bookmark-check" : "bookmark",
          favLabel: isFav ? "En favoritos" : "Favorito",
          toggleFav: () => { set({fav: Object.assign({}, a.fav, {[cur.id]: !isFav})}); this.showToast(isFav ? "Quitada de favoritos." : "Guardada en favoritos."); }
        };
      })(),
      isGuia: s.screen === "guia",
      guide: GUIDE.map(g => ({title:g.title, qs:g.qs.map(q => {
        const key = g.id + "." + q.id, open = !!(s.guideOpen || {})[key];
        return {q:q.q, open, expanded: open ? "true" : "false", chevron: open ? "chevron-up" : "chevron-down",
          toggle: () => this.setState(st => ({guideOpen: Object.assign({}, st.guideOpen, {[key]: !open})})),
          blocks: q.a.map(b => b[0] === "p"
            ? {isP:true, isList:false, segs: richSegs(b[1]), items:[]}
            : {isP:false, isList:true, segs:[], items: b[1].map((txt, i) => ({mark: b[0] === "ol" ? (i + 1) + "." : "•", segs: richSegs(txt)}))})};
      })})),
      isSoporte: s.screen === "soporte",
      sop: (() => {
        const o = s.sop, e = o.err || {};
        const bd = bad => bad ? "var(--color-destructive)" : "var(--color-ring)";
        const set = patch => this.setState(st => ({sop: Object.assign({}, st.sop, patch)}));
        return {
          asuntoLabel: o.asunto || "Selecciona un asunto", asuntoFg: o.asunto ? "var(--color-accent-foreground)" : "#737373",
          asuntoBd: bd(e.asunto), errAsunto: !!e.asunto,
          pickAsunto: () => this.setState({sheet:{kind:"opts", target:"sop", title:"¿Qué asunto quieres consultar?"}}),
          desc: o.desc, setDesc: ev => set({desc: ev.target.value.slice(0, 1000), err: Object.assign({}, e, {desc:false})}),
          descCount: (o.desc || "").length + "/1000 caracteres", descBd: bd(e.desc), errDesc: !!e.desc,
          email: o.email, setEmail: ev => set({email: ev.target.value, err: Object.assign({}, e, {email:false})}),
          emailBd: bd(e.email), errEmail: !!e.email,
          send: () => {
            const err = {asunto: !o.asunto, desc: !(o.desc || "").trim(), email: !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test((o.email || "").trim())};
            if (err.asunto || err.desc || err.email) { set({err}); this.say("Revisa los campos marcados."); return; }
            this.setState(st => ({screen:"home", sop: Object.assign({}, st.sop, {asunto:"", desc:"", err:{}})}));
            this.showToast("Solicitud enviada. Te responderemos en " + o.email.trim() + ".");
          }
        };
      })(),
      pr: (() => {
        const r = s.pr, v = r.view, pf = s.pf;
        const set = p => this.prSet(p);
        const nav = (title, desc, open, extra) => Object.assign({title, desc, open, isNav:true, isSoon:false, isSwitch:false,
          icon:"chevron-right", tone:"var(--color-foreground)", bd:"var(--color-border)", checked:"false", track:"", justify:""}, extra || {}, {titleFg: extra && extra.tone && extra.tone !== "var(--color-foreground)" ? extra.tone : "var(--color-accent-foreground)"});
        const soon = (title, desc) => ({title, desc, isNav:false, isSoon:true, isSwitch:false, open:() => {}, icon:"clock", tone:"", bd:"", checked:"false", track:"", justify:"", titleFg:"var(--color-accent-foreground)"});
        const bio = this.bioOn();
        const cards = v === "hub" ? [
            nav("Editar perfil", "Cambia tu nombre, tu teléfono o tu foto.", () => { const fm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(pf.fecha || "");
              this.prGo("editar", {ed:{nombre:pf.nombre, apellido:pf.apellido, tel:pf.tel, fecha:pf.fecha, avatar:pf.avatar}, telErr:false, avErr:false,
                cal:{open:false, m: fm ? +fm[2] - 1 : 0, y: fm ? +fm[3] : 1990}}); }),
            nav("Gestiona tu plan", "Cambia tu plan entre mensual y anual, o cancela tu suscripción.", () => this.prGo("plan", {sel: r.plan})),
            nav("Mi Familia", {admin:"Tu grupo, los avisos y las peticiones de ayuda.", member:"Lo que compartes y tus peticiones de ayuda.", invited:"Tienes una invitación pendiente de Lucía Navarro.", none:"Cuida de las personas adultas de tu familia con el plan familiar."}[this.famRole()], () => this.famOpen("perfil")),
            nav("Seguridad", "Activa seguridad, revisa tus accesos y mantén la cuenta protegida.", () => this.prGo("seguridad", this.prSecReset())),
            nav("Alertas", "Elige qué alertas quieres recibir y cómo prefieres que te avisemos.", () => this.prGo("alertas")),
            nav("Mis consultas", "Consulta en un solo lugar todas tus verificaciones y acciones dentro de la app.", () => this.prGo("consultas")),
            nav("Tu opinión importa", "Comparte tu opinión y ayúdanos a mejorar BeValk.", () => this.prGo("opinion", {fb:{topic:"", text:"", err:{}}})),
            nav("Cerrar sesión", "Cierra sesión correctamente para proteger tu información personal y actividad.", () => this.setState({sheet:{kind:"pf-logout"}}), {icon:"log-out"})]
          : v === "alertas" ? [
            nav("Zona geográfica", "Elige las regiones sobre las que quieres recibir alertas.", () => this.prGo("zona")),
            nav("Edad", "Ajusta tu franja de edad para personalizar las alertas.", () => this.prGo("edad")),
            nav("Temas", "Elige los temas de seguridad sobre los que quieres que te avisemos.", () => this.prGo("temas"))]
          : [];

        const ed = r.ed || {};
        const setEd = p => set({ed: Object.assign({}, ed, p)});
        const allZ = PR_ZONAS.every(z => r.zonas[z]);
        const same = (a, b) => JSON.stringify(Object.keys(a).filter(k => a[k]).sort()) === JSON.stringify(Object.keys(b).filter(k => b[k]).sort());
        const allT = PR_TEMAS.every(x => r.temas[x.id]);
        const dirty = v === "zona" ? !same(r.zonas, r.zonasSaved) : v === "edad" ? r.edad !== r.edadSaved : v === "temas" ? !same(r.temas, r.temasSaved) : true;
        const pw = r.pw;
        const pwField = (k, label, ph, ac) => ({label, ph, ac, value: pw[k] || "", type: pw.show[k] ? "text" : "password",
          shown: pw.show[k] ? "true" : "false", eye: pw.show[k] ? "eye-off" : "eye", eyeLabel: pw.show[k] ? "Ocultar contraseña" : "Mostrar contraseña",
          toggle: () => set({pw: Object.assign({}, pw, {show: Object.assign({}, pw.show, {[k]: !pw.show[k]})})}),
          set: e => set({pw: Object.assign({}, pw, {[k]: e.target.value, err: Object.assign({}, pw.err, {[k]: null})})}),
          hasErr: !!pw.err[k], err: pw.err[k] || "", bd: pw.err[k] ? "var(--color-destructive)" : "var(--color-ring)",
          labelFg: pw.err[k] ? "var(--color-destructive)" : "var(--color-foreground)", invalid: pw.err[k] ? "true" : "false", hasMeter: k === "b" && !!pw.b});

        const footer = v === "editar" ? {secondaryLabel:"Cancelar", secondary:() => this.prGo("hub", {ed:null}), primaryLabel:"Guardar",
            primary:() => { const d = (ed.tel || "").replace(/\D/g, ""); if (ed.tel && (d.length !== 9 || /[^\d\s]/.test(ed.tel))) { this.say("El teléfono no es válido."); return set({telErr:true}); }
              if (r.avErr) return;
              this.setState(st => ({pf: Object.assign({}, st.pf, {nombre:ed.nombre, apellido:ed.apellido, tel:ed.tel, fecha:ed.fecha, avatar:ed.avatar})}));
              this.prGo("hub", {ed:null}); this.showToast("Tus cambios se han guardado."); }}
          : v === "seguridad" && r.sec === "borrar" ? {secondaryLabel:"Cancelar", secondary:() => this.prGo("hub", this.prSecReset()), primaryLabel:"Eliminar cuenta", danger:true,
            primary:() => { const err = {reason: !r.del.reason, other: r.del.reason === "Otros" && !(r.del.other || "").trim()};
              if (err.reason || err.other) { this.say("Revisa los campos marcados."); return set({del: Object.assign({}, r.del, {err})}); }
              set({confirm:true}); }}
          : v === "seguridad" ? {secondaryLabel:"Cancelar", secondary:() => this.prGo("hub", this.prSecReset()), primaryLabel:"Guardar",
            primary:() => { if (r.sec === "pass") this.prSavePass(); }}
          : ["zona", "edad", "temas"].indexOf(v) >= 0 ? {secondaryLabel:"Volver", secondary:() => this.prCancelPrefs(v), primaryLabel:"Guardar",
            primary:() => { if (!dirty) return;
              const patch = v === "zona" ? {zonasSaved: Object.assign({}, r.zonas)} : v === "edad" ? {edadSaved: r.edad} : {temasSaved: Object.assign({}, r.temas)};
              this.prGo("alertas", patch); this.showToast("Preferencias guardadas."); }}
          : null;
        const off = footer && !footer.danger && (!dirty || (v === "seguridad" && !r.sec));
        const fa = r.fa || {step:"intro", code:"", err:null};
        const single = v === "passok" ? {label:"Cerrar sesión", icon:true, outline:true, run:() => this.prLogout()}
          : v === "opinion" ? {label:"Enviar comentario", icon:false, outline:false, run:() => this.prSendFb()}
          : v === "opinionok" ? {label:"Volver", icon:false, outline:true, run:() => this.prGo("hub")}
          : v === "fa" ? (fa.step === "success" ? {label:"Cerrar sesión", icon:true, outline:true, run:() => this.prLogout()}
            : {label: fa.step === "code" ? "Finalizar" : "Continuar", icon:false, outline:false,
               run:() => fa.step === "intro" ? set({fa: Object.assign({}, fa, {step:"pairing"})}) : fa.step === "pairing" ? set({fa: Object.assign({}, fa, {step:"code", err:null, code:""})}) : this.prFaSubmit()})
          : null;
        const full = v === "deleting" || v === "deleted";
        const pwv = pw.b || "", score = pwScore(pwv);
        const lvl = [["Muy débil", "var(--color-destructive)"], ["Muy débil", "var(--color-destructive)"], ["Débil", "#C2410C"], ["Media", "#A16207"], ["Fuerte", "var(--color-positive)"], ["Muy fuerte", "var(--color-positive)"]][score];
        const del = r.del, dErr = del.err || {};
        const ed2 = r.ed || {};
        const cal = r.cal || {open:false, m:0, y:1990};
        const now = new Date(), maxY = now.getFullYear(), maxM = now.getMonth();
        const fm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ed2.fecha || "");
        const selD = fm ? {d:+fm[1], m:+fm[2] - 1, y:+fm[3]} : null;
        const pad = n => String(n).padStart(2, "0");
        const calDays = (() => { const first = new Date(cal.y, cal.m, 1), lead = (first.getDay() + 6) % 7, out = [];
          const start = new Date(cal.y, cal.m, 1 - lead);
          const total = Math.ceil((lead + new Date(cal.y, cal.m + 1, 0).getDate()) / 7) * 7;
          for (let k = 0; k < total; k++) { const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + k);
            const inM = dt.getMonth() === cal.m, future = dt > now, sel = selD && selD.d === dt.getDate() && selD.m === dt.getMonth() && selD.y === dt.getFullYear();
            out.push({n: dt.getDate(), aria: dt.getDate() + " de " + PR_MESES[dt.getMonth()].toLowerCase() + " de " + dt.getFullYear(),
              pressed: sel ? "true" : "false", disabled: future ? "true" : "false", cursor: future ? "default" : "pointer",
              bg: sel ? "var(--color-primary)" : "transparent", fg: sel ? "var(--color-on-fill)" : future ? "#C4B5FD" : inM ? "var(--color-foreground)" : "#A3A3A3",
              font: (sel ? "600" : "400") + " 0.9375rem/1 var(--font-sans)",
              pick: () => { if (future) return; set({ed: Object.assign({}, ed2, {fecha: pad(dt.getDate()) + "/" + pad(dt.getMonth() + 1) + "/" + dt.getFullYear()}), cal: Object.assign({}, cal, {open:false, m: dt.getMonth(), y: dt.getFullYear()})}); }}); }
          return out; })();
        const nextOff = cal.y > maxY || (cal.y === maxY && cal.m >= maxM);
        const box = (fa.code || "").replace(/\D/g, "");

        return {
          view: v, back: () => this.prBack(),
          heading: {hub:"Perfil", editar:"Editar perfil", plan:"Gestionar suscripción", opinion:"Tu opinión importa", opinionok:"Tu opinión importa", seguridad:"Seguridad", passok:"Seguridad", fa:"2FA",
            borrar:"Eliminar cuenta", alertas:"Alertas", zona:"Zona geográfica", edad:"Edad", temas:"Temas", consultas:"Mis consultas"}[v] || "Perfil",
          isList: ["hub", "alertas", "plan"].indexOf(v) >= 0, isHub: v === "hub",
          isForm: ["hub", "alertas", "plan"].indexOf(v) < 0 && !full,
          isOpinion: v === "opinion",
          fb: (() => { const f = r.fb || {}, fe = f.err || {}, d = PR_FB.find(x => x[0] === f.topic);
            return {label: f.topic || "Selecciona una opción", fg: f.topic ? "var(--color-foreground)" : "#737373",
              bd: fe.topic ? "var(--color-destructive)" : "var(--color-ring)", topicErr: !!fe.topic,
              pick: () => this.setState({sheet:{kind:"opts", target:"prfb", title:"¿Sobre qué nos quieres contar?"}}),
              has: !!d, title: d ? d[1] : "", desc: d ? d[2] : "",
              text: f.text || "", count: (f.text || "").length + "/500 caracteres",
              setText: e => set({fb: Object.assign({}, f, {text: e.target.value.slice(0, 500), err: Object.assign({}, fe, {text:false})})}),
              textErr: !!fe.text, textInvalid: fe.text ? "true" : "false",
              textFg: fe.text ? "var(--color-destructive)" : "var(--color-foreground)", textBd: fe.text ? "var(--color-destructive)" : "var(--color-ring)"}; })(),
          limits: PR_LIMITS.map((l, k) => ({label:l[0], value:l[1], bd: k === PR_LIMITS.length - 1 ? "transparent" : "var(--color-border)"})), isFull: full, hasHeader: !full,
          fullImg: v === "deleted" ? "/assets/1f4970e2c03823995d4c048239166e23.png" : "/assets/d78c26509efc1f93c26c1cdda2ae760b.png",
          fullTitle: v === "deleted" ? "¡Tu cuenta fue eliminada!" : "Danos unos instantes… estamos procesando tu petición.",
          hasFullBody: v === "deleted", fullBody: "Te llevamos a la pantalla de inicio.",
          isEditar: v === "editar", isSeg: v === "seguridad", isResult: v === "passok" || v === "opinionok" || (v === "fa" && fa.step === "success"),
          resImg: v === "opinionok" ? "/assets/f2496f1f5a034f6e1a7ff934fc47fd84.png" : "/assets/efc7cf49a55551709cd5831ee9e60802.png", isZona: v === "zona",
          resTitle: v === "opinionok" ? "¡Gracias por contárnoslo!" : v === "passok" ? "¡Contraseña modificada con éxito!" : "¡Factor de doble autenticación activado con éxito!",
          resBody: v === "opinionok" ? "Hemos recibido tu mensaje y lo tendremos en cuenta para seguir mejorando BeValk." : v === "passok" ? "Recomendamos cerrar sesión y volver a iniciarla con tu nueva contraseña." : "Recomendamos cerrar sesión y volver a iniciarla para hacer uso del 2FA.",
          isFa: v === "fa" && fa.step !== "success",
          fa: {title: fa.step === "pairing" ? "Vincula tu cuenta" : fa.step === "code" ? "Introduce el código" : "Antes de empezar",
            isIntro: fa.step === "intro", isPairing: fa.step === "pairing", isCode: fa.step === "code",
            apps: PR_FA_APPS, key: PR_FA_KEY,
            copy: () => { try { navigator.clipboard && navigator.clipboard.writeText(PR_FA_KEY.replace(/\s/g, "")); } catch (e) {} this.showToast("Clave copiada."); },
            code: box, type: e => set({fa: Object.assign({}, fa, {code: e.target.value.replace(/\D/g, "").slice(0, 6), err:null})}),
            paste: () => set({fa: Object.assign({}, fa, {code:"123456", err:null})}),
            boxes: [0, 1, 2, 3, 4, 5].map(k => ({d: box[k] || "", bd: fa.err ? "var(--color-destructive)" : "var(--color-border)",
              cls: k === Math.min(box.length, 5) ? "tp-otp-cur" : ""})),
            hasErr: !!fa.err, err: fa.err || "", invalid: fa.err ? "true" : "false"},
          sec: {label: (PR_SEC.find(x => x[0] === r.sec) || [0, "Selecciona una opción"])[1], fg: r.sec ? "var(--color-foreground)" : "#737373", bd:"var(--color-ring)",
            isPass: r.sec === "pass", isBorrar: r.sec === "borrar",
            pick: () => this.setState({sheet:{kind:"opts", target:"prsec", title:"¿Qué quieres gestionar?"}})},
          confirmOpen: v === "seguridad" && !!r.confirm, confirmClose: () => set({confirm:false}), confirmDelete: () => this.prDelete(),
          hasSingle: !!single && !full, singleLabel: single ? single.label : "", singleHasIcon: !!(single && single.icon), single: single ? single.run : () => {},
          singleBg: single && single.outline ? "var(--color-card)" : "var(--color-primary)", singleFg: single && single.outline ? "var(--color-foreground)" : "var(--color-on-fill)",
          singleBd: single && single.outline ? "var(--color-ring)" : "var(--color-primary)",
          cal: {open: !!cal.open, expanded: cal.open ? "true" : "false", toggle: () => { set({cal: Object.assign({}, cal, {open: !cal.open})}); if (!cal.open) this.later(() => { const el = document.querySelector('[aria-label="Elegir fecha de nacimiento"]'); if (el) el.scrollIntoView({block:"nearest", behavior:"smooth"}); }, 60); },
            fieldLabel: ed2.fecha || "Selecciona tu fecha", fieldFg: ed2.fecha ? "var(--color-accent-foreground)" : "#737373",
            fieldBd: cal.open ? "var(--color-ring)" : "var(--color-ring)",
            m: String(cal.m), y: String(cal.y),
            months: PR_MESES.map((l, k) => ({v: String(k), label: l.slice(0, 3)})),
            years: Array.from({length: 107}, (_, k) => ({v: String(maxY - k)})),
            setM: e => set({cal: Object.assign({}, cal, {m: +e.target.value})}), setY: e => set({cal: Object.assign({}, cal, {y: +e.target.value})}),
            prev: () => set({cal: Object.assign({}, cal, cal.m === 0 ? {m:11, y: cal.y - 1} : {m: cal.m - 1})}),
            next: () => { if (nextOff) return; set({cal: Object.assign({}, cal, cal.m === 11 ? {m:0, y: cal.y + 1} : {m: cal.m + 1})}); },
            nextOff: nextOff ? "true" : "false", nextOp: nextOff ? "0.35" : "1",
            dow: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map(l => ({l})), days: calDays},
          isEdad: v === "edad", isTemas: v === "temas", isConsultas: v === "consultas", isPlan: v === "plan",
          cards,
          name: ((pf.nombre || "") + " " + (pf.apellido || "")).trim() || "Tu nombre",
          email: "micorreo@empresa.com", isPrem: prem,
          hasAvatar: !!(v === "editar" ? ed.avatar : pf.avatar), noAvatar: !(v === "editar" ? ed.avatar : pf.avatar),
          avatar: (v === "editar" ? ed.avatar : pf.avatar) || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          initials: (String((v === "editar" ? ed.nombre : pf.nombre) || "E").charAt(0) + String((v === "editar" ? ed.apellido : pf.apellido) || "N").charAt(0)).toUpperCase(),
          ed: {nombre: ed.nombre || "", apellido: ed.apellido || "", tel: ed.tel || "", fecha: ed.fecha || "",
            setNombre: e => setEd({nombre: e.target.value}), setApellido: e => setEd({apellido: e.target.value}),
            setTel: e => set({ed: Object.assign({}, ed, {tel: e.target.value}), telErr:false}),
            telErr: !!r.telErr, telInvalid: r.telErr ? "true" : "false", telBd: r.telErr ? "var(--color-destructive)" : "var(--color-ring)", telFg: r.telErr ? "var(--color-destructive)" : "var(--color-foreground)",
            avErr: !!r.avErr, avInvalid: r.avErr ? "true" : "false", avBd: r.avErr ? "var(--color-destructive)" : "var(--color-ring)", avFg: r.avErr ? "var(--color-destructive)" : "var(--color-foreground)",
            removeAvatar: () => set({ed: Object.assign({}, ed, {avatar:""}), avErr:false}),
            onAvatar: e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
              if (["image/svg+xml", "image/png", "image/jpeg", "image/gif"].indexOf(f.type) < 0) return set({avErr:true});
              const rd = new FileReader();
              rd.onload = () => { const url = String(rd.result), im = new Image();
                im.onload = () => { const ok = f.type === "image/svg+xml" || (im.naturalWidth <= 400 && im.naturalHeight <= 400);
                  this.setState(st => ({pr: Object.assign({}, st.pr, ok ? {ed: Object.assign({}, st.pr.ed, {avatar:url}), avErr:false} : {avErr:true})})); };
                im.onerror = () => this.prSet({avErr:true});
                im.src = url; };
              rd.readAsDataURL(f); }},
          pw: {fields: [pwField("a", "Contraseña actual", "Introduce tu contraseña actual", "current-password"),
            pwField("b", "Contraseña nueva", "Introduce tu contraseña nueva", "new-password"),
            pwField("c", "Confirmar contraseña nueva", "Vuelve a introducir tu contraseña nueva", "new-password")],
            score: String(score), pct: (score / 5 * 100) + "%", level: lvl[0], levelFg: lvl[1],
            rules: PR_PW_RULES.map(x => { const ok = x[1](pwv); return {label:x[0], icon: ok ? "check" : "minus", fg: ok ? "var(--color-positive)" : "var(--color-foreground)", sr: ok ? " (cumplido)" : " (pendiente)"}; })},
          del: {label: del.reason || "Selecciona un motivo", fg: del.reason ? "var(--color-foreground)" : "#737373",
            bd: dErr.reason ? "var(--color-destructive)" : "var(--color-ring)", hasErr: !!dErr.reason,
            isOtros: del.reason === "Otros", other: del.other || "", count: (del.other || "").length + "/500 caracteres",
            setOther: e => set({del: Object.assign({}, del, {other: e.target.value.slice(0, 500), err: Object.assign({}, dErr, {other:false})})}),
            otherErr: !!dErr.other, otherInvalid: dErr.other ? "true" : "false",
            otherFg: dErr.other ? "var(--color-destructive)" : "var(--color-foreground)", otherBd: dErr.other ? "var(--color-destructive)" : "var(--color-ring)",
            pick: () => this.setState({sheet:{kind:"opts", target:"prdel", title:"¿Por qué quieres eliminar tu cuenta?"}})},
          zonas: PR_ZONAS.map(z => ({label:z, on: !!r.zonas[z]})).concat([{label:"Quiero recibirlas todas", on: allZ, all:true}]).map(o => ({label:o.label,
            checked: o.on ? "true" : "false", icon: o.on ? "check" : "", bd: o.on ? "var(--color-foreground)" : "var(--color-border)",
            bg: o.on ? "var(--color-accent)" : "var(--color-card)", boxBd: o.on ? "var(--color-primary)" : "var(--color-ring)", boxBg: o.on ? "var(--color-primary)" : "var(--color-card)",
            toggle: () => set({zonas: o.all ? (allZ ? {} : PR_ZONAS.reduce((m, z) => (m[z] = 1, m), {})) : Object.assign({}, r.zonas, {[o.label]: !r.zonas[o.label]})})})),
          edades: PR_EDADES.map(e => ({label:e, checked: r.edad === e ? "true" : "false",
            bd: r.edad === e ? "var(--color-foreground)" : "var(--color-border)", bg: r.edad === e ? "var(--color-accent)" : "var(--color-card)",
            dotBd: r.edad === e ? "var(--color-foreground)" : "var(--color-ring)", dot: r.edad === e ? "var(--color-foreground)" : "transparent",
            pick: () => set({edad:e})})),
          temasAll: {checked: allT ? "true" : "false", track: allT ? "var(--color-primary)" : "var(--color-secondary)", justify: allT ? "flex-end" : "flex-start",
            toggle: () => set({temas: allT ? {} : PR_TEMAS.reduce((m, x) => (m[x.id] = 1, m), {})})},
          temas: PR_TEMAS.map(x => { const on = !!r.temas[x.id]; return {label:x.label, desc:x.desc, checked: on ? "true" : "false",
            track: on ? "var(--color-primary)" : "var(--color-secondary)", justify: on ? "flex-end" : "flex-start",
            toggle: () => set({temas: Object.assign({}, r.temas, {[x.id]: !on})})}; }),
          plans: [
            {id:"basica", name:"Protección básica"},
            {id:"anual", name:"Protección anual", price:"49,99 €", per:"/año", monthly:"4,17 €/mes", save:"Ahorra un 30%", best:true},
            {id:"mensual", name:"Protección mensual", price:"5,99 €", per:"/mes"}
          ].map(pl => { const curPlan = this.world().plan === "premium" ? (r.plan === "anual" ? "anual" : "mensual") : "basica";
            const selPlan = r.selTouched ? r.sel : curPlan;
            const cur = curPlan === pl.id, sel = selPlan === pl.id, basic = pl.id === "basica";
            const head = cur ? "SUSCRIPCIÓN ACTUAL" : pl.best ? "MEJOR VALORADO · OPCIÓN MÁS ELEGIDA" : "";
            return {name:pl.name, price:pl.price || "", per:pl.per || "", monthly:pl.monthly || "", save:pl.save || "", hasSave: !!pl.save,
              isBasic: basic, isPaid: !basic, hasHead: !!head, head,
              headBg: cur ? "var(--color-secondary)" : "var(--color-primary)", headFg: cur ? "var(--color-foreground)" : "var(--color-on-fill)",
              bd: sel ? "var(--color-primary)" : "var(--color-border)",
              checked: sel ? "true" : "false", dot: sel ? "var(--color-primary)" : "transparent", dotBd: sel ? "var(--color-primary)" : "var(--color-ring)",
              open: sel, hasBonus: pl.id === "anual",
              canPay: sel && !basic && !cur, canCancel: sel && cur && !basic, canDowngrade: sel && basic && !cur,
              select: () => set({sel: pl.id, selTouched:true}),
              pay: () => this.activatePremium(pl.id, true)}; }),
          feats: PR_FEATS.map(f => ({label:f[0], soon:f[1]})),
          bonus: PR_BONUS.map(b => ({icon:b[0], label:b[1]})),
          upgradeLabel: r.plan === "anual" ? "Pasarme a pago mensual" : "Pasarme a pago anual",
          toAnnual: () => set({sel: r.plan === "anual" ? "mensual" : "anual"}),
          cancelSub: () => this.setState({sheet:{kind:"pr-cancel"}}),
          hasFooter: !!footer,
          secondaryLabel: footer ? footer.secondaryLabel : "", secondary: footer ? footer.secondary : () => {},
          primaryLabel: footer ? footer.primaryLabel : "", primary: footer ? footer.primary : () => {},
          primaryBg: footer && footer.danger ? "var(--color-destructive)" : "var(--color-primary)",
          primaryOpacity: off ? "0.55" : "1", primaryCursor: off ? "not-allowed" : "pointer", primaryDisabled: off ? "true" : "false"
        };
      })(),
      isSos: s.screen === "sos",
      sos: {
        isAviso: so.view === "aviso", isForm: so.view === "form",
        back: () => so.view === "form" && !so.dontShow ? this.sosSet({view:"aviso", err:{}}) : this.go(this.backRoot()),
        dontShowChecked: so.dontShow ? "true" : "false",
        dontShowIcon: so.dontShow ? "check" : "", dontShowBg: so.dontShow ? "var(--color-primary)" : "var(--color-card)",
        dontShowBd: so.dontShow ? "var(--color-primary)" : "var(--color-ring)",
        toggleDontShow: () => this.sosSet({dontShow: !so.dontShow}),
        continue: () => this.sosSet({view:"form"}),
        help: so.help, helpLabel: so.help || "Selecciona una opción",
        pickHelp: () => this.setState({sheet:{kind:"opts", target:"sos", title:"¿Con qué necesitas ayuda?"}}),
        helpFg: so.help ? "var(--color-accent-foreground)" : "#737373", helpBd: sosBd(soErr.help), errHelp: !!soErr.help,
        service: so.service, setService: e => this.sosSet({service: e.target.value, err: Object.assign({}, soErr, {service:false})}),
        serviceFg: so.service ? "var(--color-accent-foreground)" : "#737373", serviceBd: sosBd(soErr.service), errService: !!soErr.service,
        desc: so.desc, setDesc: e => this.sosSet({desc: e.target.value.slice(0, 1000), err: Object.assign({}, soErr, {desc:false})}),
        descCount: (so.desc || "").length + "/1000 caracteres", descBd: sosBd(soErr.desc), errDesc: !!soErr.desc,
        attach: () => { this.sosSet({files: (so.files || 0) + 1}); this.showToast("Archivo añadido."); },
        attachLabel: so.files ? (so.files === 1 ? "1 archivo adjunto · añadir otro" : so.files + " archivos adjuntos · añadir otro") : "Adjuntar archivo",
        name: so.name, setName: e => this.sosSet({name: e.target.value, err: Object.assign({}, soErr, {name:false})}),
        nameBd: sosBd(soErr.name), errName: !!soErr.name,
        email: so.email, setEmail: e => this.sosSet({email: e.target.value, err: Object.assign({}, soErr, {email:false})}),
        emailBd: sosBd(soErr.email), errEmail: !!soErr.email,
        phone: so.phone, setPhone: e => this.sosSet({phone: e.target.value}),
        consentChecked: so.consent ? "true" : "false",
        consentIcon: so.consent ? "check" : "", consentBg: so.consent ? "var(--color-primary)" : "var(--color-card)",
        consentBd: soErr.consent ? "var(--color-destructive)" : so.consent ? "var(--color-primary)" : "var(--color-ring)",
        toggleConsent: () => this.sosSet({consent: !so.consent, err: Object.assign({}, soErr, {consent:false})}),
        errConsent: !!soErr.consent,
        send: () => this.sosSend(),
        call017: () => this.showToast("Llamando al 017, la línea gratuita de INCIBE."),
        maria: () => this.go("maria", {from:"ayuda"})
      },
      week, camino, ap, le, side, lab: this.labVals(),
      isFamilia: s.screen === "familia", fam: this.famVals(), famHome: famHome,
      showFamHome: famHome.top,
      famAn: (() => { const show = this.famRole() === "member" && s.screen === "analizador" && s.an.view === "result";
        let host = String(s.an.value || ""); try { host = new URL(/^https?:/.test(host) ? host : "https://" + host).hostname.replace(/^www\./, ""); } catch (e) {}
        return {show, label:"Pedir ayuda a Lucía con esto",
          open: () => this.famSheet({kind:"ayuda", step:"form", obj:{kind:"link", t: host, v: s.an.verdict}, motive:null})}; })(),
      isAprende: s.screen === "aprende",
      isLeccion: s.screen === "leccion",
      goAprende: () => this.go("aprende"),
      goDesglose: () => this.go("desglose"),
      miniOffset: (169.6 * (1 - s.shown / 100)).toFixed(1),
      scoreCardLabel: "Tu protección: " + score + " de 100. " + title + ". Ver de dónde sale",
      isHome: s.screen === "home",
      homeTitle: prem ? "BeValk Premium" : "BeValk",
      homeNow: (() => {
        const it = nextUp;
        if (!it) return {hasAction:false, isClear:true, hasMore:false, title:"", meta:"", icon:"circle-check", iconBg:"var(--green-50)", iconFg:"var(--color-positive)", open:() => {}};
        const VIG_NOW = {vemail:"Añade tu correo a Mi huella", vname:"Añade tu nombre a Mi huella", vemail2:"Añade otro correo a Mi huella"};
        const ICONS = {email:"mail", onb:"list-checks", twofa:"shield-check", alerta:"bell-ring", scan:"link", maria:"message-circle-more", huella:"fingerprint"};
        const title = it.kind === "vig" ? (VIG_NOW[it.def.id] || it.def.title) : it.def.title;
        const label = it.kind === "base" ? "Tu cuenta" : it.kind === "vig" ? "Mi huella" : it.kind === "step" ? it.group : "";
        const urgent = level === "red";
        return {hasAction:true, isClear:false, hasMore: pending.length > 1, title,
          meta: [urgent ? "Importante" : "", label, it.def.time || ""].filter(Boolean).join(" · "),
          icon: it.kind === "step" ? "key-round" : it.kind === "vig" ? "fingerprint" : (ICONS[it.def.id] || it.icon),
          iconBg: urgent ? "var(--red-50)" : "var(--color-card)",
          iconFg: urgent ? "var(--color-destructive)" : "var(--color-foreground)",
          open: challengeOpen};
      })(),
      homeTools: [
        {title:"Analizador de enlaces", icon:"link", isNew:false, open:() => this.anOpen("enlace")},
        {title:"Mi huella", icon:"fingerprint", isNew:true, open:() => this.go("huella")},
        {title:"Chat con MarIA", icon:"message-circle-more", isNew:false, open:() => this.go("maria")},
        {title:"Escáner de QRs", icon:"qr-code", isNew:false, open:() => this.anOpen("qr")},
        {title:"Alertas", icon:"bell-ring", isNew:false, open:() => this.setState(st => ({screen:"alinfo", sheet:null, al: Object.assign({}, st.al, {view:"list"})}))},
        {title:"Mi Familia", icon:"users", isNew:true, open:() => this.famOpen("home")},
        {title:"¿Cómo se usa BeValk?", icon:"circle-help", isNew:false, open:() => this.go("guia")},
        {title:"Soporte técnico", icon:"headset", isNew:false, open:() => this.setState(st => ({screen:"soporte", sheet:null, sop: Object.assign({}, st.sop, {err:{}})}))}
      ],
      isDesglose: s.screen === "desglose",
      isAcciones: s.screen === "acciones",
      isPasos: s.screen === "pasos",
      isSubida: s.screen === "subida",
      isAlertas: s.screen === "alertas",
      isEscaner: s.screen === "escaner",
      isHitos: s.screen === "hitos",
      isPerfil: s.screen === "perfil",
      isAuth: s.screen === "auth", splash: !!s.splash,
      restartApp: () => this.logout(),
      au: (() => {
        const a = s.au, v = a.view, set = p => this.auSet(p), err = a.err || {};
        const isLogin = v === "login", isSignup = v === "signup";
        const pv = a.pass || "", score = pwScore(pv);
        const lv = [["Muy débil", "var(--color-destructive)"], ["Muy débil", "var(--color-destructive)"], ["Débil", "#B45309"], ["Media", "var(--color-foreground)"], ["Fuerte", "var(--color-positive)"], ["Muy fuerte", "var(--color-positive)"]][score];
        const code = (a.code || "").replace(/\D/g, "");
        const red = "var(--color-destructive)";
        return {
          isIntro: v === "intro", hasHeader: v !== "intro",
          heading: {login:"Iniciar sesión", signup:"Crear cuenta", l2fa:"2FA", lok:"2FA", onb:"Bienvenida"}[v] || "",
          back: () => this.auBack(),
          toLogin: () => this.auGo("login", {err:{}, tried:false}), toSignup: () => this.auGo("signup", {err:{}, tried:false}),
          hasTabs: isLogin || isSignup,
          tabs: [["login", "Iniciar sesión"], ["signup", "Crear cuenta"]].map(x => ({label:x[1], selected: v === x[0] ? "true" : "false",
            bg: v === x[0] ? "var(--color-card)" : "transparent", shadow: v === x[0] ? "var(--shadow-sm)" : "none",
            pick: () => this.auGo(x[0], {err:{}, tried:false, pass:""})})),
          isForm: isLogin || isSignup, isLogin, isSignup,
          email: a.email || "", setEmail: e => set({email: e.target.value, err: Object.assign({}, err, {email:null})}),
          hasEmailErr: !!err.email, emailErr: err.email || "", emailInvalid: err.email ? "true" : "false",
          emailFg: err.email ? red : "var(--color-foreground)", emailBd: err.email ? red : "var(--color-ring)",
          pass: pv, setPass: e => set({pass: e.target.value, err: Object.assign({}, err, {pass:null})}),
          passType: a.show ? "text" : "password", passAc: isSignup ? "new-password" : "current-password",
          toggleShow: () => set({show: !a.show}), eye: a.show ? "eye-off" : "eye", eyeLabel: a.show ? "Ocultar contraseña" : "Mostrar contraseña", shown: a.show ? "true" : "false",
          hasPassErr: !!err.pass, passErr: err.pass || "", passInvalid: err.pass ? "true" : "false",
          passFg: err.pass ? red : "var(--color-foreground)", passBd: err.pass ? red : "var(--color-ring)",
          forgot: () => { const e = this.auEmailErr(a.email); if (e) return set({err: Object.assign({}, err, {email:"Escribe tu correo y te enviamos un enlace para crear otra contraseña."})});
            this.showToast("Te hemos enviado un enlace a " + a.email.trim() + "."); },
          hasMeter: isSignup && (!!pv || !!a.tried), level: lv[0], levelFg: lv[1], score: String(score), pct: (score / 5 * 100) + "%",
          rules: PR_PW_RULES.map(x => { const ok = x[1](pv), bad = !ok && a.tried;
            return {label:x[0], icon: ok ? "check" : bad ? "x" : "minus", fg: ok ? "var(--color-positive)" : bad ? red : "var(--color-foreground)", sr: ok ? " (cumplido)" : " (pendiente)"}; }),
          keepChecked: a.keep ? "true" : "false", keepTrack: a.keep ? "var(--color-primary)" : "var(--color-secondary)", keepJustify: a.keep ? "flex-end" : "flex-start",
          toggleKeep: () => set({keep: !a.keep}),
          termsChecked: a.terms ? "true" : "false", termsIcon: a.terms ? "check" : "", termsBg: a.terms ? "var(--color-primary)" : "var(--color-card)",
          termsBd: err.terms ? red : a.terms ? "var(--color-primary)" : "var(--color-ring)", termsErr: !!err.terms, termsInvalid: err.terms ? "true" : "false",
          toggleTerms: () => set({terms: !a.terms, err: Object.assign({}, err, {terms:false})}),
          openPrivacy: () => this.showToast("Abriendo la Política de privacidad."), openTerms: () => this.showToast("Abriendo las Condiciones de Uso."),
          submitLabel: isLogin ? "Iniciar sesión" : "Crear cuenta",
          submit: e => { if (e && e.preventDefault) e.preventDefault(); isLogin ? this.auLogin() : this.auSignup(); },
          googleLabel: isLogin ? "Iniciar sesión con Google" : "Registrarse con Google", appleLabel: isLogin ? "Iniciar sesión con Apple" : "Registrarse con Apple",
          google: () => isLogin ? this.auEnter("Sesión iniciada con Google.") : this.auGo("onb", {err:{}, onb: OB0()}),
          apple: () => isLogin ? this.auEnter("Sesión iniciada con Apple.") : this.auGo("onb", {err:{}, onb: OB0()}),
          isCard: v === "l2fa" || v === "lok", is2fa: v === "l2fa", isOk: v === "lok",
          openAuthApp: () => this.showToast("Abriendo tu aplicación de autenticación."),
          code, typeCode: e => set({code: e.target.value.replace(/\D/g, "").slice(0, 6), codeErr:null}),
          codeInvalid: a.codeErr ? "true" : "false", hasCodeErr: !!a.codeErr, codeErr: a.codeErr || "",
          boxes: [0, 1, 2, 3, 4, 5].map(k => ({d: code[k] || "", bd: a.codeErr ? red : "var(--color-border)", cls: k === Math.min(code.length, 5) ? "tp-otp-cur" : ""})),
          paste: () => set({code:"123456", codeErr:null}), verify: () => this.auVerify(),
          isOnb: v === "onb"
        };
      })(),
      onb: (() => {
        const o = s.au.onb || OB0(), st = o.step, ph = o.phase, set = p => this.obSet(p);
        const n = st === "intro" ? 1 : st === "url" ? 2 : 3;
        return {
          bars: [1, 2, 3].map(k => ({bg: k <= n ? "var(--color-primary)" : "var(--color-secondary)"})),
          barsNow: String(n), eyebrow: "Paso " + n + " de 3",
          title: st === "intro" ? "BeValk te ayuda a no caer en estafas"
            : st === "url" ? (ph === "result" ? "Así se comprueba un mensaje" : "Pruébalo con un mensaje real")
            : "¿Sobre qué quieres que te avisemos?",
          isIntro: st === "intro",
          isUrlInput: st === "url" && ph === "input", isScanning: st === "url" && ph === "scan", isResult: st === "url" && ph === "result",
          isTemas: st === "temas",
          temas: OB_TEMAS.map(x => { const on = !!o.temas[x.id];
            return {label:x.label, checked: on ? "true" : "false", icon:"check", iconFg: on ? "var(--color-on-fill)" : "var(--color-card)",
              bd: on ? "var(--color-foreground)" : "var(--color-border)", bg: on ? "var(--color-accent)" : "var(--color-card)",
              boxBd: on ? "var(--color-primary)" : "var(--color-ring)", boxBg: on ? "var(--color-primary)" : "var(--color-card)",
              toggle: () => set({temas: Object.assign({}, o.temas, {[x.id]: !on})})}; }),
          hasCta: ph !== "scan",
          cta: st === "intro" ? "Empezar" : st === "url" ? (ph === "result" ? "Siguiente" : "Comprobar este enlace") : "Terminar",
          next: () => this.obNext(),
          hasLater: st === "intro", later: () => this.obFinish()
        };
      })(),
      isNotis: s.screen === "notificaciones",
      isPaywall: s.screen === "paywall",
      isHuella: s.screen === "huella",
      isMaria: s.screen === "maria",
      isAnalizador: s.screen === "analizador",
      quotaNote: prem
        ? "Con tu plan los análisis son ilimitados. Guardamos los de los últimos 90 días en el teléfono."
        : "Con el plan gratuito tienes 3 análisis al mes. Con Premium son ilimitados.",
      an: (() => {
        const a = s.an;
        const cfg = ANALYZERS[a.type] || ANALYZERS.enlace;
        const v = VERDICTS[a.verdict] || VERDICTS.danger;
        const left = Math.max(0, 3 - a.used);
        const recents = (AN_RECENTS[a.type] || []).map(r => ({value:r.value,
          badge: VERDICTS[r.v].label, badgeBg: VERDICTS[r.v].badgeBg, badgeFg: VERDICTS[r.v].badgeFg,
          open: () => this.anSet({view:"result", value:r.value, verdict:r.v})}));
        const risks = a.verdict === "danger" ? cfg.dangerRisks : a.verdict === "suspicious" ? cfg.suspiciousRisks
          : a.verdict === "safe" ? cfg.safeRisks : cfg.unknownRisks;
        const riskIcon = a.verdict === "safe" ? "circle-check" : a.verdict === "unknown" ? "circle-help" : "triangle-alert";
        const riskColor = a.verdict === "safe" ? "var(--color-positive)" : a.verdict === "unknown" ? "var(--color-foreground)" : v.color;
        const spent = !prem && left <= 0;
        const off = this.off();
        const canAnalyze = (a.value || "").trim().length > 0 && !spent;
        // PAUSA
        const pt = PZ_TYPE[a.type] || PZ_TYPE.enlace;
        const br = this.pzBrand(a.value);
        const pzs = a.pz || {plan:null, done:{}};
        const shortVal = String(a.value || "").replace(/^https?:\/\//, "").replace(/^www\./, "");
        const risky = a.verdict !== "safe";
        const isText = !!cfg.text;
        const masked = this.maskText(a.value);
        const sigs = isText ? this.msgSignals(a.value) : [];
        const hasLink = !isText || !!this.linkIn(a.value);
        const plan = pzs.plan ? PZ_PLANS[pzs.plan] : null;
        const doneN = plan ? plan.steps.filter((x, i) => pzs.done[i]).length : 0;
        const pzSet = patch => this.anSet({pz: Object.assign({}, pzs, patch)});
        const tone = a.verdict === "danger" ? {bg:"var(--red-50)", bd:"var(--red-200)", fg:"var(--red-700)"}
          : a.verdict === "suspicious" ? {bg:"var(--yellow-50)", bd:"var(--yellow-600)", fg:AMBER_TEXT}
          : {bg:"var(--color-accent)", bd:"var(--color-border)", fg:"var(--color-foreground)"};
        const pz = {
          title: a.verdict === "danger" ? pt.stop : a.verdict === "suspicious" ? "Mejor compruébalo antes" : "No sabemos si es de fiar",
          whyIcon: br ? br.icon : a.verdict === "unknown" ? "circle-help" : "triangle-alert",
          whyTitle: br ? "Se hace pasar por " + br.brand : a.verdict === "unknown" ? "Sin información fiable" : "Señales de estafa",
          whyBody: br ? "Imita " + br.what + " para que pagues o des tus datos. No es la web de " + br.brand + "."
            : isText && sigs.length ? "Hemos visto " + sigs.length + (sigs.length === 1 ? " señal típica" : " señales típicas") + " de estafa. Te las explicamos abajo."
            : (risks[0] || "Vemos señales poco habituales."),
          whyVal: isText ? "«" + (masked.length > 160 ? masked.slice(0, 157) + "…" : masked) + "»" : shortVal,
          signals: sigs, hasSignals: sigs.length > 0,
          maskNote: "Antes de analizarlo ocultamos tu teléfono, tu correo, tu DNI y los números de tarjeta.",
          hasOpen: hasLink, whyBg: tone.bg, whyBd: tone.bd, whyFg: tone.fg,
          cta: br ? br.cta : "Comprobarlo sin usar " + pt.noun,
          ctaNote: br ? "Te llevamos a la web oficial, sin usar " + pt.noun + "." : "Te explicamos cómo, paso a paso.",
          check: () => this.anSet({view: br ? "oficial" : "generico"}),
          fallen: () => this.anSet({view:"quepaso"}),
          openLink: pt.openLink,
          // Comprobar por el canal oficial
          ofHeading: br ? br.heading : "Comprobar el mensaje",
          ofTitle: br ? "Compruébalo en " + br.brand + ", no en el mensaje" : "",
          ofBody: "Si de verdad tienes algo pendiente, también aparecerá en su web o en su app oficial.",
          ofSteps: br ? [{n:"1", t:"Abre la web o la app de " + br.brand + " con los botones de abajo."}, {n:"2", t:br.step2}, {n:"3", t:br.step3}] : [],
          ofSite: br ? "www." + br.host.replace(/^www\./, "") : "",
          ofOpenWeb: br ? "Abrir la web de " + br.brand : "", ofOpenApp: br ? br.app : "",
          openWeb: () => this.showToast("Abriendo " + (br ? "www." + br.host : "la web oficial") + " en el navegador."),
          openApp: () => this.showToast("Abriendo la app oficial."),
          notBrand: br ? "¿No es " + br.brand + "? Compruébalo de otra forma" : "",
          toGeneric: () => this.anSet({view:"generico"}),
          // Genérico
          genTitle: "Compruébalo sin usar " + pt.noun,
          genSteps: [{n:"1", t:"Fíjate en quién dice escribirte: una tienda, tu banco, una empresa de envíos…"},
            {n:"2", t:"Abre tú su app oficial o busca su web. No uses el enlace ni el teléfono del mensaje."},
            {n:"3", t:"Si allí no aparece nada pendiente, no pagues ni des tus datos."}],
          toResult: () => this.anSet({view:"result"}),
          // Qué ha pasado
          what: PZ_WHAT.map(x => ({label:x.label, sub:x.sub, hasSub: !!x.sub, icon:x.icon, open: () => this.openPlan(x.id, a.from)})),
          // Plan
          planHeading: plan ? (PZ_WHAT.find(x => x.id === pzs.plan) || {}).label : "",
          planTitle: plan ? plan.title : "", planIntro: plan ? plan.intro : "",
          progressLabel: plan ? doneN + " de " + plan.steps.length + " hechos" : "",
          progressNow: String(doneN), progressMax: plan ? String(plan.steps.length) : "4",
          pct: plan ? (doneN / plan.steps.length * 100) + "%" : "0%",
          allDone: !!plan && doneN === plan.steps.length,
          steps: plan ? plan.steps.map((x, i) => { const on = !!pzs.done[i];
            return {n: String(i + 1), title: (i + 1) + ". " + x[0], body: x[1], checked: on ? "true" : "false",
              bg: on ? "var(--color-accent)" : "var(--color-card)", bd: on ? "var(--color-ring)" : "var(--color-border)",
              boxBd: on ? "var(--color-primary)" : "var(--color-ring)", boxBg: on ? "var(--color-primary)" : "var(--color-card)",
              boxFg: on ? "var(--color-on-fill)" : "var(--color-card)",
              toggle: () => { const nd = Object.assign({}, pzs.done, {[i]: !on}); pzSet({done: nd}); this.caseUpsert({id:"pz-" + pzs.plan, kind:"plan", plan:pzs.plan, done: nd}); if (!on) this.say("Paso " + (i + 1) + " hecho."); }}; }) : [],
          call017: () => this.showToast("Llamando al 017, la línea gratuita de INCIBE."),
          toSos: () => this.sosOpen()
        };
        return {
          pz,
          isResultSafe: a.view === "result" && !risky, isResultRisk: a.view === "result" && risky,
          isText, isLine: !isText, hasShot: !!a.shot, showAccess: hasLink,
          attachShot: () => { this.anSet({shot:true, value: cfg.shotValue || cfg.pasteValue}); this.say("Captura adjunta. Hemos leído el texto."); },
          removeShot: () => this.anSet({shot:false, value:""}),
          maskNote: "Antes de analizarlo ocultamos tu teléfono, tu correo, tu DNI y los números de tarjeta.",
          isOficial: a.view === "oficial", isGenerico: a.view === "generico", isQuePaso: a.view === "quepaso", isPlan: a.view === "plan" && !!plan,
          heading: a.view === "details" ? "Detalles del análisis" : a.view === "oficial" ? pz.ofHeading : a.view === "generico" ? "Comprobar el mensaje"
            : a.view === "quepaso" || a.view === "plan" ? "Qué hacer ahora" : cfg.heading, icon: cfg.icon, placeholder: cfg.placeholder,
          isWelcome: a.view === "welcome", isCamera: a.view === "camera", isMain: a.view === "main",
          isScanning: a.view === "scanning", isResult: a.view === "result", isDetails: a.view === "details",
          isLimite: a.view === "limite",
          isPermiso: a.view === "permiso", isDenegado: a.view === "denegado", isError: a.view === "error",
          allowCam: () => { this.setState({camPerm:"Concedido"}); this.anSet({view:"camera"}); },
          denyCam: () => { this.anSet({view:"main", type:"enlace", value:""}); this.showToast("Sin cámara. Puedes pegar el enlace a mano cuando quieras."); },
          camSteps: [{n:"1", text:"Abre los ajustes del móvil."}, {n:"2", text:"Busca BeValk en la lista de aplicaciones."}, {n:"3", text:"Activa Cámara."}],
          openSettings: () => this.showToast("Abriendo los ajustes del móvil."),
          toManual: () => this.anSet({type:"enlace", view:"main", value:""}),
          errIcon: a.errKind === "red" ? "cloud-off" : "server-crash",
          errTitle: a.errKind === "red" ? "No hemos podido analizarlo" : "El análisis se ha quedado a medias",
          errBody: a.errKind === "red"
            ? "No hay conexión, así que no hemos podido comprobarlo con nuestras bases de datos."
            : "Ha fallado por nuestra parte, no por lo que nos has dado. Suele arreglarse al segundo intento.",
          retry: () => this.anAnalyze(a.value),
          welcomeTitle: cfg.welcomeTitle, welcomeBody: cfg.welcomeBody, welcomeHow: cfg.welcomeHow,
          welcomeImg: a.type === "qr" ? "/assets/0b8ad741075020992d2f17c46ba7634b.png" : "/assets/572d2351021ad282bedc79db1a936915.png",
          checkIcon: a.dontShow[a.type] ? "check" : "minus",
          checkBg: a.dontShow[a.type] ? "var(--color-primary)" : "var(--color-card)",
          checkBd: a.dontShow[a.type] ? "var(--color-primary)" : "var(--color-ring)",
          toggleDontShow: () => this.anSet({dontShow: Object.assign({}, a.dontShow, {[a.type]: !a.dontShow[a.type]})}),
          start: () => {
            const seen = Object.assign({}, a.seen, {[a.type]: true});
            if (!cfg.camera) return this.anSet({view:"main", seen});
            const perm = this.camPerm();
            return this.anSet({view: perm === "Concedido" ? "camera" : perm === "Denegado" ? "denegado" : "permiso", seen});
          },
          shoot: () => this.anAnalyze(cfg.pasteValue),
          fromGallery: () => this.anAnalyze((AN_RECENTS[a.type][0] || {}).value),
          value: a.value,
          type: e => this.anSet({value: e.target.value}),
          paste: () => this.anSet({value: cfg.pasteValue}),
          recentTitle: cfg.recentTitle, emptyText: cfg.emptyText,
          hasRecents: recents.length > 0, noRecents: recents.length === 0, recents,
          quotaIcon: prem ? "infinity" : spent ? "alarm-clock" : "info",
          quotaText: prem ? "Análisis ilimitados con tu plan Premium."
            : spent ? "Este mes ya has usado tus 3 análisis. Vuelves a tener tres el día 1 y MarIA sigue disponible."
            : "Te " + (left === 1 ? "queda 1 análisis" : "quedan " + left + " análisis") + " de 3 este mes. Con Premium son ilimitados.",
          analyzeLabel: off ? "Sin conexión no podemos analizar" : spent ? "Ver qué puedes hacer" : "Analizar",
          analyze: () => off ? this.showToast("Necesitas conexión para analizar. Lo reintentamos en cuanto vuelva.") : spent ? this.anSet({view:"limite"}) : this.anAnalyze(),
          analyzeBg: off ? "var(--color-muted)" : spent ? "var(--color-card)" : canAnalyze ? "var(--color-primary)" : "var(--color-muted)",
          analyzeFg: off ? "var(--color-muted-foreground)" : spent ? "var(--color-foreground)" : canAnalyze ? "var(--color-on-fill)" : "var(--color-muted-foreground)",
          analyzeBd: spent && !off ? "var(--color-ring)" : "transparent",
          analyzeIcon: off ? "cloud-off" : spent ? "lock" : "search",
          analyzeHint: !canAnalyze && !spent && !off,
          analyzeCursor: off ? "not-allowed" : canAnalyze || spent ? "pointer" : "not-allowed",
          checksTitle: cfg.checksTitle, checks: cfg.checks.map(c => ({label:c})),
          vColor: v.color, vTint: v.tint, vIcon: v.icon,
          vScore: v.risk, vBadgeBg: v.badgeBg, vBadgeFg: v.badgeFg,
          vImg: a.verdict === "safe" ? "/assets/bbec748a31b8a1830b92a9c32e5693be.png"
            : a.verdict === "suspicious" ? "/assets/724972a8611b9b42c1b32beaeccf2090.png"
            : a.verdict === "danger" ? "/assets/61f12d8e69f2be60a1decf4862848ed1.png" : "/assets/bbec748a31b8a1830b92a9c32e5693be.png",
          vSection: a.verdict === "safe" ? "" : a.verdict === "suspicious" ? "Contenido sospechoso"
            : a.verdict === "danger" ? "Contenido peligroso" : "Sin datos suficientes",
          vBodyStrong: a.verdict === "safe" ? "" : a.verdict === "danger" ? "Te recomendamos no " + cfg.accessVerb + "." : "",
          showQuota: !prem,
          vTitle: a.verdict === "safe" ? "No vemos señales de estafa"
            : a.verdict === "suspicious" ? "Mejor ve con cuidado"
            : a.verdict === "danger" ? "Atención: no es seguro" : "No tenemos datos suficientes",
          vBody: a.verdict === "safe" ? "Eso no garantiza que sea seguro. " + ({
              mensaje:"Si alguien conocido te escribe desde un número nuevo o te pide dinero, llama a su número de siempre antes de hacer nada.",
              telefono:"Si te piden claves, códigos o dinero, cuelga y llama tú al número oficial.",
              correo:"Si te pide datos o dinero, entra tú en la web o la app oficial de esa empresa."
            }[a.type] || "Si te pide pagar, claves o códigos, entra tú en la web oficial en lugar de usar este enlace.")
            : a.verdict === "suspicious" ? "Vemos cosas poco habituales. Si sabes de dónde viene, decide tú. Si no lo sabes, mejor no sigas."
            : a.verdict === "danger" ? "Vemos señales de alto riesgo."
            : "No hemos encontrado información fiable. No podemos decirte si es de fiar ni si no lo es.",
          accessLabel: cfg.accessLabel, accessIcon: cfg.accessIcon,
          safeMode: a.verdict === "safe", riskyMode: a.verdict !== "safe",
          safeLabel: "No " + cfg.accessVerb,
          riskyLabel: cfg.accessLabel + " de todas formas",
          safeBack: () => { this.anSet({view: cfg.camera ? "camera" : "main", value:""}); this.showToast("Hecho. No hemos abierto nada."); },
          access: () => a.verdict === "safe"
            ? this.showToast("Abriendo. Cualquier cosa, vuelve y pregúntale a MarIA.")
            : this.setState({sheet:{kind:"access"}}),
          againLabel: cfg.againLabel,
          again: () => this.anSet({view: cfg.camera ? "camera" : "main", value:""}),
          goDetails: () => this.anSet({view:"details"}),
          cardBg: a.view === "details" ? "transparent" : "var(--color-card)", cardBd: a.view === "details" ? "0" : "1px solid var(--color-border)",
          cardShadow: a.view === "details" ? "none" : "var(--shadow-xs)", cardPad: a.view === "details" ? "0 0 8px" : "16px",
          copyValue: () => { try { navigator.clipboard && navigator.clipboard.writeText(a.value || ""); } catch (e) {} this.showToast("Copiado."); },
          detailValueLabel: cfg.detailValueLabel,
          hasChain: !!cfg.chain && a.verdict !== "safe",
          chainTitle: cfg.chainTitle || "",
          chain: (cfg.chain || []).map(c => ({text:c.text, icon: c.bad ? "flag" : "arrow-right",
            color: c.bad ? "var(--color-destructive)" : "var(--color-foreground)"})),
          risksTitle: a.verdict === "safe" ? "Lo que hemos comprobado" : a.verdict === "unknown" ? "Lo que no hemos podido comprobar" : cfg.risksTitle,
          risks: risks.map(t => ({text:t, icon: riskIcon, color: riskColor})),
          tips: cfg.tips.map(t => ({text:t})),
          askMaria: () => this.go("maria"),
          freeTips: [
            {text:"Te meten prisa: si te dicen que tienes que actuar hoy mismo, desconfía."},
            {text:"La dirección no cuadra con la empresa: mira lo que va justo antes de la primera barra."},
            {text:"Te piden una clave, un código o el número de tarjeta por mensaje. Nadie serio hace eso."}],
          plans: [
            {name:"Protección anual", price:"49,99 € al año", note:"4,17 € al mes · ahorras un 30%", key:"anual", badge:true, badgeText:"LA MÁS ELEGIDA"},
            {name:"Protección mensual", price:"5,99 € al mes", note:"Sin compromiso, cancelas cuando quieras", key:"mensual", badge:false, badgeText:""}
          ].map(p => ({name:p.name, price:p.price, note:p.note, badge:p.badge, badgeText:p.badgeText,
            bd: a.plan === p.key ? "var(--color-ring)" : "var(--color-border)",
            dotBd: a.plan === p.key ? "var(--color-primary)" : "var(--color-ring)",
            dotBg: a.plan === p.key ? "var(--color-primary)" : "var(--color-card)",
            select: () => this.anSet({plan: p.key})})),
          buy: () => { this.anSet({view:"main", resume:true}); this.go("paywall"); },
          back: () => this.anBack(),
          legendOpen: a.legend, openLegend: () => this.anSet({legend:true}), closeLegend: () => this.anSet({legend:false}),
          legend: AN_LEGEND.map(l => ({label:l.label, range:l.range, text:l.text, color: VERDICTS[l.key].color})),
          reportOpen: a.report, openReport: () => this.anSet({report:true, reportText:"", reportKind:"", reportErr:false}),
          closeReport: () => this.anSet({report:false, reportErr:false}),
          reportKinds: [
            {key:"fraude", label:"Confirmo que es un fraude", hint:"Me ha llegado y he visto que lo es"},
            {key:"falso", label:"Creo que os equivocáis", hint:"Lo conozco y es de fiar"}
          ].map(k => ({label:k.label, hint:k.hint,
            bd: a.reportKind === k.key ? "var(--color-ring)" : "var(--color-ring)",
            dotBd: a.reportKind === k.key ? "var(--color-primary)" : "var(--color-ring)",
            dotBg: a.reportKind === k.key ? "var(--color-primary)" : "var(--color-card)",
            pick: () => this.anSet({reportKind:k.key, reportErr:false})})),
          reportErr: !!a.reportErr,
          isReviewed: !!a.reviewed,
          reviewedIcon: a.reviewed === "falso" ? "message-square-warning" : "flag",
          reviewedText: a.reviewed === "falso"
            ? "Nos has dicho que crees que este resultado está mal. Lo revisa una persona en menos de 24 horas. Mientras tanto no cambiamos el veredicto: trátalo con precaución."
            : "Gracias. Con lo que nos has contado, esto entra en la lista de fraudes conocidos y protege también al resto.",
          reportLabel: cfg.reportLabel, reportText: a.reportText,
          typeReport: e => this.anSet({reportText: e.target.value.slice(0, 500), reportErr:false}),
          reportCount: (a.reportText || "").length + "/500 caracteres",
          reportFg: a.reportErr ? "var(--color-destructive)" : "var(--color-foreground)", reportBd: a.reportErr ? "var(--color-destructive)" : "var(--color-ring)",
          reportInvalid: a.reportErr ? "true" : "false",
          sendReport: () => {
            if (!(a.reportText || "").trim()) return this.anSet({reportErr:true});
            this.anSet({report:false, reportText:"", reviewed:"fraude", reportErr:false, reportKind:"fraude"});
            this.say("Gracias, lo hemos registrado.");
            this.showToast("Gracias. Lo revisamos en menos de 24 horas.");
          },
          share: () => this.showToast("Hemos copiado el resultado para que puedas enviarlo."),
          accessVerb: cfg.accessVerb
        };
      })(),
      showTabs: ["subida","paywall","bienvenida","bloqueo","auth","leccion"].indexOf(s.screen) < 0 && !(s.screen === "perfil" && (s.pr.view === "deleting" || s.pr.view === "deleted")),

      score, shown: s.shown, ringColor, scoreTextColor,
      ringOffset: (603.2 * (1 - s.shown / 100)).toFixed(1),
      title, subtitle,
      planLabel: prem ? "PLAN PREMIUM" : "PLAN GRATUITO",
      planLine: prem ? "Plan Premium · miramos tus datos cada día" : "Plan gratuito · " + Math.max(0, w.alertsLeft) + " avisos este mes",
      greeting: (this.props.nombre ?? "Elena") ? "Hola, " + (this.props.nombre ?? "Elena") : "Buenos días",
      name: this.props.nombre ?? "Elena",
      initials: String(this.props.nombre ?? "Elena").slice(0, 2).toUpperCase(),
      earnedLine: "Tienes " + p.earned + " de los " + p.avail + " puntos que puedes conseguir con tu plan.",
      footerNote: level === "red"
        ? "Empieza por esto. Lo demás puede esperar."
        : "Esta cifra mide lo que está en tu mano. " + w.checked + ".",

      showComparison: cmpVisible, comparison,
      chips: chips.slice(0, 4).map(c => Object.assign({label:c.label}, chipStyle(c))),
      streak,

      challenge: nextUp ? {visible:true,
        kicker: level === "red" ? "EMPIEZA POR AQUÍ" : "TU RETO DE HOY",
        bg: level === "red" ? "var(--color-destructive)" : "var(--color-primary)",
        title: nextUp.def.title, duration: nextUp.def.time || "2 min", points: nextUp.pts,
        cta: nextUp.kind === "act" ? "Abrirlo ahora" : "Ver los pasos",
        ctaIcon: nextUp.kind === "act" ? "arrow-right" : "list-checks",
        open: challengeOpen} : {visible:false, kicker:"", bg:"var(--color-primary)", title:"", duration:"", points:0, cta:"", ctaIcon:"arrow-right", open:() => {}},

      showExpiring: !!expDef && level !== "red",
      expiring: expDef ? {title: expDef.a.expTitle.replace("{d}", expDef.d), body: expDef.a.expBody} : {title:"", body:""},

      showList: level !== "red" && homeActions.length > 0,
      showTodo: !!nextUp || (level !== "red" && homeActions.length > 0),
      listTitle: prem ? "Lo que tienes pendiente" : "Qué puedes hacer ahora",
      homeActions,

      upsell: {visible: upsellVisible,
        title: pending.length === 0 ? "Has llegado a tu tope" : "Amplía tu protección",
        body: pending.length === 0
          ? "Has hecho todo lo que puedes por tu cuenta. Con Premium miramos tus datos cada día y te avisamos en cuanto aparezcan donde no deben."
          : "Con Premium miramos tus datos cada día y te avisamos en cuanto aparezcan donde no deben.",
        slots: lockedSlots},

      blocks,
      catalog,
      act: actView,
      askConfirm: () => this.openSheet("confirm"),
      openAyuda: () => this.openSheet("ayuda"),
      sheet,

      liveMsg: s.live || "",
      offline: this.off(),
      offlineNote: s.screen === "home" && /^Revisado /.test(w.checked || "")
        ? "Te enseñamos lo último que comprobamos, el " + w.checked.replace("Revisado ", "") + ". No podemos mirar nada nuevo hasta que vuelvas a tener red."
        : s.screen === "home" ? "Te enseñamos lo último que comprobamos. No podemos mirar nada nuevo hasta que vuelvas a tener red."
        : "No podemos comprobar nada nuevo hasta que vuelvas a tener red.",
      offlineRetry: () => { this.setState({offline:false}); this.showToast("Ya hay conexión. Volvemos a mirar tus datos."); },
      touchStart: e => { const t = e.touches[0]; this.tsx = t.clientX; this.tsy = t.clientY; },
      touchEnd: e => {
        const t = e.changedTouches[0];
        if (this.tsx === undefined) return;
        const dx = t.clientX - this.tsx, dy = Math.abs(t.clientY - this.tsy);
        this.tsx = undefined;
        if (dx > 70 && dy < 60) this.globalBack();
      },
      dialogRef: el => { if (el && this.dlg !== el) { this.dlg = el; el.focus(); } },
      trapKey: e => this.trapKey(e),
      fromPush: !!s.push,
      notiBlocked: this.notiPerm() === "Denegado",
      openNotiSettings: () => this.showToast("Abriendo los ajustes de avisos del móvil."),
      isBloqueo: s.screen === "bloqueo",
      bioUnlock: () => { this.setState({bioOk:true}); this.later(() => this.go("huella"), 260); this.say("Desbloqueado."); },
      bioCode: () => { this.setState({bioOk:true}); this.later(() => this.go("huella"), 260); },
      isBienvenida: s.screen === "bienvenida",
      ob: (() => {
        const o = s.ob, sc = this.scoreOf(w);
        const labels = ["Comprobando tu correo", "Buscándolo en filtraciones conocidas", "Mirando cómo tienes configurada la cuenta", "Calculando tu protección"];
        return {
          dots: [1,2,3].map(n => ({bg: n <= o.step ? "var(--color-primary)" : "var(--color-secondary)"})),
          isQue: o.step === 1, isPermisos: o.step === 2, isCalculo: o.step === 3,
          title: o.step === 1 ? "Antes de darte un número" : o.step === 2 ? "Dos permisos, y para qué son" : o.done ? "Esta es tu protección" : "Calculando tu protección",
          body: o.step === 1
            ? "Tu protección es una nota del 0 al 100. Sale de cosas concretas, no de una opinión nuestra. Esto es lo que miramos."
            : o.step === 2
            ? "Te los pediremos cuando hagan falta, no ahora. Puedes decir que no y seguir usando la app."
            : o.done
            ? "Sube cuando resuelves algo y baja si dejas de hacerlo. Te decimos siempre qué hacer para subirla."
            : "Estamos mirando lo que nos has dejado comprobar. Tarda unos segundos.",
          si: [
            {icon:"mail-check", text:"Si tu correo aparece en filtraciones conocidas."},
            {icon:"link", text:"Los enlaces, QR y mensajes que nos traigas."},
            {icon:"settings-2", text:"Cómo tienes configurada tu cuenta de BeValk."}],
          no: [
            {text:"No leemos tus mensajes ni tu correo."},
            {text:"No vendemos ni compartimos tus datos."},
            {text:"No hacemos nada con tu DNI si no nos lo das tú."}],
          permisos: [
            {icon:"bell", label:"Avisos", why:"Para decirte el mismo día si tus datos aparecen en una filtración.", when:"Te lo pedimos la primera vez que actives un aviso."},
            {icon:"camera", label:"Cámara", why:"Solo para leer un QR que tengas delante. No guardamos la imagen.", when:"Te lo pedimos la primera vez que escanees."}],
          checks: labels.map((l, i) => ({label:l,
            icon: o.tick > i ? "check" : "loader",
            color: o.tick > i ? "var(--color-positive)" : "var(--color-text-body)",
            text: o.tick > i ? "var(--color-accent-foreground)" : "var(--color-text-body)",
            anim: o.tick > i ? "none" : "odSpin 1.1s linear infinite"})),
          done: o.done, score: sc,
          scoreNote: sc >= 85 ? "Estás bien. Con poco la mantienes ahí." : sc >= 60 ? "Vas por buen camino. Quedan cosas fáciles por hacer." : "Hay cosas por resolver. Empezamos por la que más suma.",
          cta: o.step === 3 ? (o.done ? "Ver mi protección" : "Calculando…") : "Continuar",
          ctaBg: o.step === 3 && !o.done ? "var(--color-muted)" : "var(--color-primary)",
          ctaFg: o.step === 3 && !o.done ? "var(--color-muted-foreground)" : "var(--color-on-fill)",
          ctaCursor: o.step === 3 && !o.done ? "not-allowed" : "pointer",
          next: () => this.wbNext(),
          hasSkip: o.step < 3,
          skip: () => { this.setState({obDone:true, screen:"home"}); this.animateTo(this.scoreOf(this.world())); }
        };
      })(),
      scoreAria: "Tu protección: " + score + " de 100. " + title + ".",
      delta: s.delta,
      subidaTitle: subLesson ? "Lo has aprendido" : s.delta >= 8 ? "Buen salto" : s.delta >= 4 ? "Un paso menos" : "Sumado",
      subidaText: subLesson
        ? subLesson.skill + ". Tu protección sube a " + score + " y esto ya no caduca."
        : nextPending
        ? "Tu protección sube a " + score + ". Lo siguiente que más suma es " + nextPending.def.title.charAt(0).toLowerCase() + nextPending.def.title.slice(1) + "."
        : "No queda nada pendiente. Estás en " + score + " de 100, el máximo con tu plan.",
      subidaMilestone: (streak.visible && s.delta > 0) || !!s.weekFresh,
      subidaWeekLine: s.weekFresh ? "Semana completa: 3 de 3" : "Esta semana ya cuenta",
      hasNext: !!subLesson || !!nextPending,
      nextLabel: subLesson ? subLesson.bridge.label : nextPending ? "Siguiente: " + nextPending.pts + " puntos" : "",
      openNext: () => { if (subLesson) return this.bridgeOpen(subLesson.bridge)();
        if (!nextPending) { this.go("home"); return; }
        if (nextPending.kind === "act") this.go(nextPending.def.screen);
        else if (nextPending.kind === "learn") this.openLesson(nextPending.def.id);
        else this.setState({screen:"pasos", actId:nextPending.def.id, from:"home", sheet:null}); },
      undo: () => this.undo(),

      weeks: weeksGrid, milestones,

      alerts,
      alertRule: prem
        ? "Con Premium recibes todos los avisos, sin límite."
        : "Las filtraciones de tus datos, tus reportes y las novedades te llegan siempre, aunque hayas gastado el límite. Lo que se limita son los consejos.",
      hasAlertRule: !prem, alertRuleIcon: prem ? "shield-check" : "shield-alert", alertPoints: !alertaFresh && (prem || w.alertsLeft > 0),
      alertQuota: prem ? "Todos tus avisos, sin límite." : "Te quedan " + Math.max(0, w.alertsLeft) + " de 4 consejos este mes.",
      quotaSpent: !prem && w.alertsLeft <= 0,

      scanPoints: !scanFresh2,
      scanPointsText: "Comprobar un enlace o un QR suma " + (prem ? 3 : 6) + " puntos a tu protección.",
      scanTypes: [
        {name:"Un enlace o una web", desc:"La dirección que te han enviado o que vas a visitar", icon:"link", open:() => this.anOpen("enlace")},
        {name:"Un código QR", desc:"De un cartel, un ticket o una factura", icon:"qr-code", open:() => this.anOpen("qr")},
        {name:"Quién te escribe", desc:"La dirección de un correo que no esperabas", icon:"mail", open:() => this.anOpen("correo")},
        {name:"Un número de teléfono", desc:"Llamadas o SMS de números raros", icon:"phone", open:() => this.anOpen("telefono")},
      ],
      doScan: () => this.anOpen("qr"),
      doLink: () => this.anOpen("mensaje"),
      autoOn: !!s.autoOn,
      autoTitle: "Avisos automáticos de SMS y llamadas",
      autoSub: s.autoOn ? "Activado. Te avisamos si llega algo sospechoso." : "Sin copiar nada. Actívalo en 1 minuto.",
      autoIconBg: s.autoOn ? "var(--green-50)" : "var(--color-accent)", autoIconFg: s.autoOn ? "var(--color-positive)" : "var(--color-foreground)",
      autoIcon: s.autoOn ? "shield-check" : "shield",
      openAuto: () => this.setState({sheet:{kind:"auto"}}),
      askMariaFromCheck: () => this.go("maria", {from:"escaner"}),
      openPaidCheck: () => this.openPaid("escaner"),
      isAyuda: s.screen === "ayuda",
      helpBack: () => this.go(this.backRoot()),
      help: {
        paid: () => this.openPaid("ayuda"),
        sos: () => { this.setState({from:"ayuda"}); this.sosOpen(); },
        maria: () => this.go("maria", {from:"ayuda"}),
        call017: () => this.showToast("Llamando al 017, la línea gratuita de INCIBE."),
        guia: () => this.go("guia", {from:"ayuda"}),
        soporte: () => this.setState(st => ({screen:"soporte", from:"ayuda", sheet:null, sop: Object.assign({}, st.sop, {err:{}})}))
      },
      hasCases: (s.cases || []).length > 0,
      cases: (s.cases || []).map((c, i) => {
        if (c.kind === "team") return {line: i ? "1px solid var(--color-border)" : "0", icon:"headset", title:"Revisión del equipo de BeValk",
          who:"Personas del equipo", sub:"Enviado " + c.when + " · te escribiremos a tu correo", stText:"En revisión", stFg:"var(--color-foreground)", stBg:"var(--color-accent)",
          open: () => this.showToast("Nuestro equipo está revisando tu caso. Te escribiremos a " + (c.email || "tu correo") + ".")};
        const pl = PZ_PLANS[c.plan] || {steps:[]}; const n = pl.steps.filter((x, k) => (c.done || {})[k]).length; const all = n === pl.steps.length && n > 0;
        return {line: i ? "1px solid var(--color-border)" : "0", icon: (PZ_WHAT.find(x => x.id === c.plan) || {}).icon || "list-checks",
          title: pl.title || "Plan guiado", who:"Plan guiado", sub: n + " de " + pl.steps.length + " pasos hechos",
          stText: all ? "Completado" : "Pendiente", stFg: all ? "var(--color-positive)" : AMBER_TEXT, stBg: all ? "var(--green-50)" : "var(--yellow-50)",
          open: () => this.openPlan(c.plan, "ayuda")};
      }),
      isBorrar: s.screen === "borrar",
      br: (() => {
        const b = s.br || BR0(false);
        const set = patch => this.setState(st => ({br: Object.assign({}, st.br, patch)}));
        const on = prem && b.auth;
        const cnt = k => b.sites.filter(x => x.st === k).length;
        const ST = {
          found: ["search", "Aparece aquí", "var(--color-foreground)", "var(--color-accent)"],
          sent: ["clock", "Pedido el {w} · tienen hasta un mes para responder", "var(--color-foreground)", "var(--color-accent)"],
          done: ["circle-check", "Borrado el {w}", "var(--color-positive)", "var(--green-50)"],
          back: ["rotate-ccw", "Ha vuelto a aparecer · lo pedimos otra vez", AMBER_TEXT, "var(--yellow-50)"],
          rejected: ["circle-alert", "Lo han rechazado", "var(--red-700)", "var(--red-50)"]};
        const summary = [[cnt("done"), "borrados"], [cnt("sent") + cnt("back"), "en curso"], [cnt("rejected"), "rechazado"]]
          .filter(x => x[0] > 0).map(x => ({label: x[0] + "\u00a0" + (x[0] === 1 && x[1] === "borrados" ? "borrado" : x[1])}));
        return {
          isFree: !prem, needAuth: prem && !b.auth, authorized: on, hasSummary: on && summary.length > 0, summary,
          headline: "Tus datos aparecen en " + b.sites.length + " sitios",
          rows: b.sites.map((x, i) => { const k = on ? x.st : "found", t = ST[k];
            return {site:x.site, kind:x.kind, data:x.data, line: i ? "1px solid var(--color-border)" : "0",
              icon:t[0], stText: t[1].replace("el {w}", x.when === "hoy" ? "hoy" : "el " + x.when), stFg:t[2], stBg:t[3],
              canClaim: on && x.st === "rejected",
              claim: () => this.showToast("Te ayudamos a preparar la reclamación ante la AEPD, la Agencia Española de Protección de Datos.")}; }),
          consent: b.consent ? "true" : "false", consentBg: b.consent ? "var(--color-primary)" : "var(--color-card)",
          consentBd: b.err && !b.consent ? "var(--color-destructive)" : b.consent ? "var(--color-primary)" : "var(--color-ring)",
          consentFg: b.consent ? "var(--color-on-fill)" : "var(--color-card)", consentErr: b.err && !b.consent,
          toggleConsent: () => set({consent: !b.consent, err:false}),
          authorize: () => { if (!b.consent) { set({err:true}); this.say("Marca la casilla para darnos permiso."); return; }
            if (this.off()) return this.labNet("borrar", "Sin conexión. No hemos enviado ninguna solicitud. Tu autorización sigue marcada.");
            set({auth:true, err:false, sites: b.sites.map(x => Object.assign({}, x, {st:"sent", when:"hoy"}))});
            this.showToast("Solicitudes enviadas a " + b.sites.length + " sitios. Te avisaremos de cada respuesta."); },
          goPremium: () => this.go("paywall"),
          note: on ? "Volvemos a buscar cada 3 meses y lo pedimos otra vez si reaparecen. Si un sitio se niega, te ayudamos a reclamar." : "Con Premium volvemos a buscar cada 3 meses y lo pedimos otra vez si reaparecen.",
          entrySub: on ? (summary.map(x => x.label).join(" · ") || "Todo pedido") : "Tus datos aparecen en " + b.sites.length + " sitios",
          open: () => this.go("borrar", {from:"huella"}),
          back: () => this.go("huella", {from:"huella"})
        };
      })(),
      isAviso: s.screen === "aviso",
      aviso: (() => {
        const cur = ALERTS.find(x => x.id === s.alSel) || ALERTS[0];
        const inf = ALERT_INFO[cur.id] || {steps:[]};
        const tp = ALERT_TYPES[cur.type] || ALERT_TYPES.tip;
        const done = !!(s.alDone || {})[cur.id];
        const steps = inf.steps || [];
        const go = to => () => {
          if (to === "huella") return this.go("huella", {from:"huella"});
          if (to === "mensaje") return this.anOpen("mensaje");
          if (to === "familia") return this.famOpen("home");
          if (to.indexOf("pasos:") === 0) return this.setState({screen:"pasos", actId: to.slice(6), from:"aviso", sheet:null});
          if (to.indexOf("lesson:") === 0) return this.openLesson(to.slice(7));
        };
        const tone = /alto/.test(inf.risk || "") ? ["var(--red-50)", "var(--red-700)"] : /medio/.test(inf.risk || "") ? ["var(--yellow-50)", AMBER_TEXT] : ["var(--green-50)", "var(--color-positive)"];
        return {
          meta: tp.label + " · " + cur.date, kind: tp.label, when: cur.date, icon: tp.icon, title: cur.title,
          iconBg: cur.grave ? "var(--red-50)" : "var(--color-accent)", iconFg: cur.grave ? "var(--color-destructive)" : "var(--color-foreground)",
          hasRisk: !!inf.risk, risk: inf.risk || "", riskBg: tone[0], riskFg: tone[1],
          what: inf.what || cur.body, hasWhy: !!inf.why, why: inf.why || "",
          hasSteps: steps.length > 0, steps: steps.map((t, i) => ({n: String(i + 1), t})),
          hasCta: !!inf.cta, ctaLabel: inf.cta ? inf.cta.label : "", cta: inf.cta ? go(inf.cta.to) : (() => {}),
          canFamily: !!inf.family && this.famRole() === "admin",
          family: () => this.famSheet({kind:"avisar", to:"all", obj:null, msg:null}),
          done, canDone: steps.length > 0 && !done,
          markDone: () => { this.setState(st => ({alDone: Object.assign({}, st.alDone, {[cur.id]: true})})); this.showToast("Marcado como hecho. Si vuelve a pasar, te avisaremos."); },
          undoDone: () => this.setState(st => ({alDone: Object.assign({}, st.alDone, {[cur.id]: false})})),
          back: () => this.go("alertas")
        };
      })(),
      openAlertsLib: () => this.setState(st => ({screen:"alinfo", from:"aprende", sheet:null, al: Object.assign({}, st.al, {view:"list"})})),

      isPfFlow: s.screen === "pfflow",
      pf: this.pfVals(prem),
      referral: "QW29TBQQ",
      copyReferral: () => this.showToast("Código copiado. Compártelo y ganáis los dos un mes."),
      perfilAvatar: s.pf.avatar || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      hasPerfilAvatar: !!s.pf.avatar,
      perfilName: (s.pf.nombre || "Elena") + " " + (s.pf.apellido || "Navarro"),
      pfQuery: s.pfQ || "",
      pfIdle: !(s.pfQ || "").trim(),
      setPfQuery: e => this.setState({pfQ: e.target.value}),
      clearPfQuery: () => this.setState({pfQ: ""}),
      hasPfQuery: !!(s.pfQ || "").trim(),
      perfilGroups: this.pfFilter([
        {label:"Tu cuenta", rows: [
          {label:"Editar perfil", sub:"Nombre, teléfono, fecha y avatar", icon:"user-pen", open:() => this.pfGo("editar")},
          {label:"Gestiona tu plan", sub: prem ? "Protección anual · renueva el 6 may 2027" : "Protección básica · gratuita", icon:"credit-card", open:() => this.pfGo("plan", {plan: prem ? "anual" : "basica"})},
          {label:"Seguridad", sub: w.base.twofa ? "Dos pasos activada" : "Falta la verificación en dos pasos", icon:"shield-check", open:() => this.pfGo("seguridad")}
        ].concat(prem ? [] : [{label:"Ver Premium", sub:"Lo que se abre y lo que no cambia", icon:"lock", open:() => this.go("paywall")}])},
        {label:"Avisos", rows: [
          {label:"Notificaciones", sub:"Elige de qué te avisamos", icon:"bell", open:() => this.pfGo("notiscat")},
          {label:"Cuándo te avisamos", sub:"Qué te enviamos y cada cuánto", icon:"bell-ring", open:() => this.go("notificaciones")},
          {label:"Tus avisos", sub: prem ? "Todos, sin límite" : Math.max(0, w.alertsLeft) + " de 4 este mes", icon:"inbox", open:() => this.go("alertas")}
        ]},
        {label:"Tu protección", rows: [
          {label:"De dónde sale tu protección", sub:"Los bloques, los puntos y tu constancia", icon:"chart-pie", open:() => this.go("desglose")}
        ]},
        {label:"Ayuda y opinión", rows: [
          {label:"Ver la bienvenida otra vez", sub:"Qué miramos y de dónde sale tu nota", icon:"sparkles", open:() => this.setState({screen:"bienvenida", ob:{step:1, tick:0, done:false}})},
          {label:"Mis consultas", sub:"Descarga lo que has pedido", icon:"file-text", open:() => this.pfGo("consultas")},
          {label:"Tu opinión importa", sub:"Cuéntanos qué mejorarías", icon:"message-square", open:() => this.pfGo("feedback")}
        ]}
      ]),
      perfilNoHit: this._pfHit === 0,
      perfilFoot: [
        {label:"Cerrar sesión", icon:"log-out", color:"var(--color-foreground)", open:() => this.setState({sheet:{kind:"pf-logout"}})},
        {label:"Eliminar cuenta", icon:"trash-2", color:"var(--color-destructive)", open:() => this.pfGo("borrar", {delStep:"aviso", delReason:"", delOther:"", delConfirm:""})}
      ],

      notiRows: NOTIS.map(n => {
        const on = n.locked || !s.notiOff[n.id];
        return {label:n.label, freq:n.freq, example:n.example, checked: on ? "true" : "false",
          trackBg: on ? "var(--color-primary)" : "var(--color-muted)",
          justify: on ? "flex-end" : "flex-start",
          cursor: n.locked ? "not-allowed" : "pointer",
          toggle: n.locked ? (() => {}) : (() => this.setState(st => ({notiOff: Object.assign({}, st.notiOff, {[n.id]: !st.notiOff[n.id]})})))};
      }),

      paywallRows: VIG.map(v => ({label: v.title + (v.soon ? " · próximamente" : ""), pts:"+" + v.pts,
        icon: v.soon ? "clock" : "eye",
        color: v.soon ? "var(--color-muted-foreground)" : "var(--color-foreground)",
        text: v.soon ? "var(--color-muted-foreground)" : "var(--color-accent-foreground)"}))
        .concat([{label:"Los pasos para cerrar cada filtración", pts:"+20", icon:"key-round", color:"var(--color-foreground)", text:"var(--color-accent-foreground)"},
                 {label:"Todos tus avisos, sin límite mensual", pts:"+3", icon:"bell", color:"var(--color-foreground)", text:"var(--color-accent-foreground)"}]),
      activarPremium: () => this.activatePremium(s.payPeriod || "mensual"),
      payOptions: [["mensual", "Protección mensual", "5,99 €/mes", "Sin permanencia"], ["anual", "Protección anual", "49,99 €/año", "Sale a 4,17 € al mes"]].map(o => {
        const on = (s.payPeriod || "mensual") === o[0];
        return {name:o[1], price:o[2], note:o[3], checked: on ? "true" : "false",
          bg: on ? "var(--color-accent)" : "var(--color-card)", bd: on ? "var(--color-primary)" : "var(--color-border)",
          dotBd: on ? "var(--color-primary)" : "var(--color-ring)", dot: on ? "var(--color-primary)" : "transparent",
          pick: () => this.setState({payPeriod:o[0]})}; }),
      payLabel: (s.payPeriod || "mensual") === "anual" ? "Pagar 49,99 € al año" : "Pagar 5,99 € al mes",
      closePaywall: () => this.go("home"),
      goPaywall: () => this.go("paywall"),

      scenarioChips: Object.keys(SCEN).map(k => ({label: SCEN[k].label,
        bg: k === this.scenKey() ? "var(--color-secondary)" : "var(--color-card)",
        fg: k === this.scenKey() ? "var(--color-secondary-foreground)" : "var(--color-foreground)",
        select: () => this.setScen(k)})),

      tabs: tabDef.map(t => ({label:t.label, icon:t.icon,
        bg: t.id === activeTab ? "var(--color-accent)" : "transparent",
        fg: t.id === activeTab ? "var(--purple-700)" : "var(--neutral-600)",
        current: t.id === activeTab ? "page" : "false",
        font: (t.id === activeTab ? "700" : "500") + " min(0.8125rem, 14px)/1rem var(--font-sans)",
        hasBadge: t.id === "familia" && famBadge,
        aria: t.label + (t.id === "familia" && famBadge ? ", tienes algo nuevo" : ""),
        go: () => t.id === "comprobar" ? this.go("escaner", {from:"escaner"}) : t.id === "familia" ? this.famOpen("tab")
          : t.id === "ayuda" ? this.go("ayuda", {from:"ayuda"}) : this.go(t.id, {from:t.id})})),
      goPerfilHub: () => this.prGo("hub"),

      hasUnread: alerts.some(a => a.unread),
      unreadCount: String(alerts.filter(a => a.unread).length),
      bellLabel: alerts.some(a => a.unread) ? "Tus avisos, " + alerts.filter(a => a.unread).length + " sin leer" : "Tus avisos",
      goAlertas: () => this.go("alertas"),

      isHuFlow: s.screen === "huflow",
      hu: this.huVals(prem),
      huBanner: this.huBanner(prem),
      huAddLabel: prem ? "Añadir otro dato a vigilar" : "Añadir un dato a vigilar",
      huAdd: () => this.setState({sheet:{kind:"hu-pick"}}),
      huPremiumSheet: () => this.setState({sheet:{kind:"hu-premium"}}),
      huWatchLabel: s.hu.items.length === 1 ? "Vigilamos 1 dato" : "Vigilamos " + s.hu.items.length + " datos",
      huNoRows: s.hu.items.length === 0,
      huHasRows: s.hu.items.length > 0,
      huRows: s.hu.items.map((it, i) => {
        const c = HU_KINDS[it.kind] || HU_KINDS.email;
        const ls = this.huItemLeaks(it);
        const un = ls.filter(l => !this.huLeakState(l).resolved).length;
        return {label: this.huMask(it).replace("@", "@\u200b"), kind: c.label, icon: c.icon,
          line: i === 0 ? "0" : "1px solid var(--color-border)",
          state: ls.length === 0 ? "Sin filtraciones"
            : !prem ? ls.length + (ls.length === 1 ? " filtración encontrada" : " filtraciones encontradas")
            : ls.length + (ls.length === 1 ? " filtración" : " filtraciones") + (un > 0 ? " · " + un + " sin resolver" : " · resueltas"),
          color: ls.length === 0 ? "var(--color-positive)" : un > 0 ? "var(--color-destructive)" : "var(--color-positive)",
          open: () => this.huGo("dato", {sel:i, fresh:false, kind:it.kind})};
      }),
      huLimitNote: prem ? "Con Premium vigilamos hasta 5 correos y tu nombre. Teléfono y DNI llegan pronto."
        : "Con Premium vigilamos hasta 5 correos y tu nombre. Teléfono y DNI llegan pronto.",

      huellaPremium: prem, huellaFree: !prem,
      huellaSub: prem ? "Lo que miramos por ti y lo que has encontrado." : "Aquí verás qué datos tuyos circulan por ahí.",
      watched: VIG.map(v => {
        const on = prem && !!w.vig[v.id];
        const label = v.title.replace("Que vigilemos ", "").replace("Añade un ", "Un ");
        return {label: label.charAt(0).toUpperCase() + label.slice(1),
          state: v.soon ? "Próximamente · no cuenta en tu protección" : on ? "Lo miramos cada día" : prem ? "Sin activar · " + v.pts + " puntos" : "Con Premium · " + v.pts + " puntos",
          icon: v.soon ? "clock" : on ? "eye" : "lock",
          tint: on ? "var(--green-50)" : "var(--color-accent)",
          color: on ? "var(--color-positive)" : v.soon ? "var(--color-muted-foreground)" : "var(--color-foreground)",
          titleColor: v.soon ? "var(--color-muted-foreground)" : "var(--color-accent-foreground)",
          action: prem && !on && !v.soon, actionLabel:"Activar",
          open: () => v.id === "vphone" ? this.huOpen("phone")
            : v.id === "vdni" ? this.huOpen("dni")
            : v.id === "vemail" || v.id === "vemail2" ? this.huOpen("email")
            : this.setState({screen:"pasos", actId:v.id, from:"huella", sheet:null})};
      }),
      findingsRows: FINDINGS.map(f => {
        const total = f.steps.length;
        const doneN = f.steps.filter(st => w.done.indexOf(st.id) >= 0).length;
        const left = total - doneN;
        const first = f.steps.find(st => w.done.indexOf(st.id) < 0);
        return {label: f.label,
          state: left === 0 ? "Resuelta" : "Te " + (left === 1 ? "falta 1 paso" : "faltan " + left + " pasos") + " · " + (left * 4) + " puntos",
          icon: left === 0 ? "check" : "lock-open",
          tint: left === 0 ? "var(--green-50)" : "var(--red-50)",
          color: left === 0 ? "var(--color-positive)" : "var(--color-destructive)",
          border: left === 0 ? "var(--color-border)" : "var(--color-destructive)",
          open: first ? (() => this.setState({screen:"pasos", actId:first.id, from:"huella", sheet:null})) : (() => {})};
      }),

      toast: s.toast ? {visible:true, text:s.toast.text} : {visible:false, text:""},

      maria: {
        isIntro: s.maria.view === "intro", isList: s.maria.view === "list", isChat: s.maria.view === "chat",
        heading: s.maria.view === "list" ? "Tus conversaciones" : "Chat MarIA",
        canBack: true,
        back: () => s.maria.view === "intro" ? this.go(this.backRoot()) : this.mariaBack(),
        greetA: "¡Buenas, " + (this.props.nombre ?? "Elena") + "!",
        greetB: "¿En qué te puedo ayudar?",
        hasDate: s.maria.msgs.length > 0,
        dateLabel: s.maria.date || "Hoy",
        goList: () => this.mariaSet({view:"list"}),
        newChat: () => this.mariaSet({view:"chat", msgs:[], node:null, topic:null, rate:null, date:null}),
        start: () => this.mariaSet({view:"chat", msgs:[], node:null, rate:null, date:null}),
        features: MARIA_FEATURES,
        greeting: "Hola, " + (this.props.nombre ?? "Elena") + ". ¿En qué te puedo ayudar?",
        showGreeting: s.maria.msgs.length === 0,
        showTopics: true,
        topics: MARIA_TOPICS.map((t, i) => ({label:t.label,
          bg: s.maria.topic === t.label ? "var(--color-secondary)" : "var(--color-card)",
          fg: s.maria.topic === t.label ? "var(--color-secondary-foreground)" : "var(--color-foreground)",
          select: () => this.mariaTopic(i)})),
        msgs: s.maria.msgs.map((m, i, arr) => ({text:m.text, isMaria: m.who === "m", isUser: m.who !== "m", isImg: !!m.img,
          canCopy: m.who !== "m" && arr.slice(i + 1).every(x => x.who === "m"),
          copy: () => this.showToast("Mensaje copiado."),
          justify: m.who === "m" ? "flex-start" : "flex-end",
          bg: m.who === "m" ? "var(--color-card)" : "var(--color-secondary)",
          bd: m.who === "m" ? "var(--color-border)" : "var(--color-ring)",
          radius: m.who === "m" ? "14px 14px 14px 4px" : "14px 14px 4px 14px"})),
        hasOptions: !!(s.maria.node && s.maria.node.options && s.maria.node.options.length),
        options: ((s.maria.node && s.maria.node.options) || []).map(o => ({label:o, select: () => this.mariaOption(o)})),
        showFeedback: s.maria.msgs.length > 0 && !(s.maria.node && s.maria.node.options && s.maria.node.options.length),
        rateUp: () => this.mariaSet({rate:"up"}), rateDown: () => this.mariaSet({rate:"down"}),
        upPressed: s.maria.rate === "up" ? "true" : "false", downPressed: s.maria.rate === "down" ? "true" : "false",
        upBg: s.maria.rate === "up" ? "var(--color-secondary)" : "transparent",
        upBd: s.maria.rate === "up" ? "var(--color-ring)" : "var(--color-ring)",
        downBg: s.maria.rate === "down" ? "var(--color-secondary)" : "transparent",
        downBd: s.maria.rate === "down" ? "var(--color-ring)" : "var(--color-ring)",
        chats: MARIA_CHATS.map(c => ({date:c.date, replies:c.replies, title:c.title, preview:c.preview,
          open: () => { this.mariaSet({view:"chat", topic:null, msgs: MARIA_TRANSCRIPT.slice(), node:null, rate:null, date:c.date}); this.mariaAward(); }})),
        attach: () => prem ? this.mariaSet({img:true}) : this.setState({sheet:{kind:"premium-img"}}),
        hasImg: !!s.maria.img, removeImg: () => this.mariaSet({img:false}),
        draft: s.maria.draft || "",
        type: e => this.mariaSet({draft: e.target.value}),
        keyDown: e => { if (e.key === "Enter") { e.preventDefault(); this.mariaSend(); } },
        send: () => this.mariaSend()
      },

      goHome: () => this.go("home"),
      goPerfil: () => this.go("perfil"),
      goAcciones: () => this.go("acciones"),
      goHitos: () => this.go("hitos"),
      backFromPasos: () => this.go(s.from || "home")
    };
  }
}
