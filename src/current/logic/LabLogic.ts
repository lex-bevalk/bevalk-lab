// @ts-nocheck
// Copied from design/current/current.html lines 6917-10593; paint() and waitLucide() are no-ops because G3 renders icons in React.
import { DCLogic } from './DCLogic';
import { LAB_APP_GROUPS, SRC_LIST, LAB_APP_FLOWS, LAB_GROUPS, LAB_FLOWS, LAB_ALL_GROUPS, LAB_ALL_FLOWS, LAB_SEC_OF, LAB_SOON_OF, BASE, VIG, FINDINGS, ACT, SCEN, ALERTS, NOTIS, MARIA_FEATURES, MARIA_L3, MARIA_L2, MARIA_TOPICS, MARIA_CHATS, MARIA_TRANSCRIPT, AMBER, AMBER_LINE, AMBER_BG, AMBER_TEXT, ANALYZERS, AN_RECENTS, VERDICTS, AN_LEGEND, HU_BULLETS, HU_KINDS, HU_LEAKS, PF_CATS, PF_FEATS, PF_PLANS, PF_TOPICS, PF_REASONS, PF_CONSULTAS, PF_MONTHS, GUIDE, AL_ITEMS, PR_ZONAS, PR_EDADES, PR_TEMAS, AU0, OB0, OB_ZONAS, OB_EDADES, OB_TEMAS, OB_INTRO, OB_QS, OB_FINAL, PR_FB, PR_LIMITS, PR_SEC, PR_MESES, PR_FA_APPS, PR_FA_KEY, PR_PW_RULES, PR_DEL, PR_FEATS, PR_BONUS, SOS_HELP, SOP_ASUNTOS, richSegs, FAM_ROLES, FAM_MSGS, FAM_MOTIVES, FAM_CATS, FAM_CATS_MINE, FAM_PRICES, FAM_WHY, FAM_MEMBERS0, FAM_ADMIN_M, FAM_REQS0, FAM_SENT0, FAM_FAVS, FAM_MY_ITEMS, FAM_PETS0, FAM0, FAM_MEMBERS_CALM, FAM_LOSE_MEMBER, FAM_LOSE_ADMIN, AP_TEMAS, PZ_PLANES, AL_DETAIL, BR_SITES, BR_SEGUIMIENTO, BR_ST, CASES0 } from '../data';

export class LabLogic extends DCLogic {
  state = {lab:{cur:null, q:"", rol:"Todos", caso:"", run:0, sec:"app", plan:"free"}, shr:null, dd:null, prontoWhat:"", prontoFrom:"home", fam: FAM0(), ap:{view:"list", tema:null, step:0, pick:null, done:{}}, pz:{view:"pick", plan:null, done:{}, from:"sos"}, cases:[], alSel:null, alDone:{}, autoOn:false, autoDev:"iphone", autoFrom:"escaner", br:{view:"intro", auth:false, err:false, st:{}, howOpen:false}, screen:"home", scen:null, world:null, shown:0, delta:0, actId:null, from:"home",
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
    ob:{step:1, tick:0, done:false}, live:"", offline:null, offHidden:false, camPerm:null, notiPerm:null,
    bio:null, bioOk:false, push:false, obDone:false,
    pf:{view:"editar", nombre:"Elena", apellido:"Navarro", tel:"", fecha:"", avatar:"",
      err:null, errField:"", cal:false, calM:9, calY:1990, saved:false,
      cats:{compras:1, banca:1, redes:1}, plan:"basica",
      faView:"intro", faCode:"", faErr:null, faAttempts:0,
      mailMode:"pick", mailSel:"micorreo@empresa.com", mailNew:"", mailErr:null,
      pA:"", pB:"", pC:"", passErr:null,
      topic:"otros", msg:"", msgErr:null,
      delStep:"aviso", delReason:"", delOther:"", delConfirm:""}};
  timers = [];

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
        || ps.an.view !== cs.an.view || ps.maria.view !== cs.maria.view || (ps.sos && cs.sos && ps.sos.view !== cs.sos.view) || (ps.al && cs.al && ps.al.view !== cs.al.view) || (ps.pr && cs.pr && ps.pr.view !== cs.pr.view) || (ps.fam && cs.fam && (ps.fam.view !== cs.fam.view || ps.fam.mid !== cs.fam.mid)) || ps.pf !== cs.pf && ps.pf.view !== cs.pf.view))
    { document.querySelectorAll(".tp-scroll").forEach(el => { el.scrollTop = 0; });
      this.later(() => document.querySelectorAll(".tp-scroll").forEach(el => { el.scrollTop = 0; }), 0); }
    if (prev && prev.miFamilia !== this.props.miFamilia) this.setState({fam: FAM0(), screen:"home", sheet:null});
    if (prev && prev.sinConexion !== this.props.sinConexion) this.setState({offHidden:false});
    if (prev && prev.primeraVez !== this.props.primeraVez && this.props.primeraVez)
      this.setState({screen:"bienvenida", ob:{step:1, tick:0, done:false}, obDone:false});
    if (prev && prev.desdeAviso !== this.props.desdeAviso && this.props.desdeAviso)
      this.setState({screen:"alertas", push:true, from:"home"});
  }

  componentWillUnmount(){ this.clearT(); window.removeEventListener("keydown", this.onKey); }

  clearT(){ this.timers.forEach(clearTimeout); this.timers = []; }
  later(fn, ms){ this.timers.push(setTimeout(fn, ms)); }

  waitLucide(n){}

  paint(){}

  off(){ const v = this.state.offline; return v === null || v === undefined ? !!this.props.sinConexion : v; }
  camPerm(){ return this.state.camPerm || this.props.permisoCamara || "Sin preguntar"; }
  notiPerm(){ return this.state.notiPerm || this.props.permisoAvisos || "Sin preguntar"; }
  bioOn(){ const v = this.state.bio; return v === null || v === undefined ? !!this.props.bloqueoBiometrico : v; }

  closeOverlays(){
    const s = this.state;
    if (s.lab && s.lab.soonOpen) return this.labSoon("close");
    if (s.shr) return this.shrClose();
    if (s.dd) return this.ddClose();
    if (s.fam && s.fam.sheet) return this.famClose();
    if (s.sheet) return this.setState({sheet:null});
    if (s.an.legend || s.an.report) return this.anSet({legend:false, report:false});
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
    if (s.sheet || s.an.legend || s.an.report) return this.closeOverlays();
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
    const s = SCEN[this.scenKey()] || SCEN["prem-amitad"];
    return {plan:s.plan, base:Object.assign({}, s.base), vig:Object.assign({}, s.vig || {}),
      done:(s.done || []).slice(), act:Object.assign({}, s.act || {}),
      alertsLeft: s.alertsLeft === undefined ? 99 : s.alertsLeft,
      weeks:s.weeks, freezes:s.freezes, lost:s.lost || 0, checked:s.checked, delta:s.delta,
      nuevo:!!s.nuevo, active:s.weeks > 0, huClean:!!s.huClean};
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
    return {baseE, baseA:30, vigE, vigA, recE, recA, actE, actA,
      earned: baseE + vigE + recE + actE, avail: 30 + vigA + recA + actA};
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
    this.setState(Object.assign({screen, sheet:null, push: screen === "alertas" ? this.state.push : false}, extra || {}));
    if (screen === "huella") {
      const w = this.world();
      const d = w.act.huella;
      if (w.plan === "premium" && !(w.nuevo || (d !== undefined && d !== null && d <= 60))) {
        this.later(() => this.awardSilent("huella", "Repasar tus datos vigilados cuenta en tu día a día."), 500);
      }
    }
  }

  showToast(text, act){
    this.setState({toast:{text, act: act || null}});
    this.later(() => this.setState(s => (s.toast && s.toast.text === text ? {toast:null} : {})), act ? 6000 : 3200);
  }

  awardSilent(id, why){
    const it = this.findAction(id);
    if (!it) return;
    const w = JSON.parse(JSON.stringify(this.world()));
    const before = this.scoreOf(w);
    if (it.kind === "act") w.act[id] = 0;
    else if (it.kind === "base") w.base[id] = 1;
    else if (it.kind === "vig") w.vig[id] = 1;
    w.nuevo = false;
    if (!w.active) { w.active = true; w.weeks = Math.max(1, w.weeks); w.lost = 0; }
    const after = this.scoreOf(w);
    if (after === before) return;
    this.setState({world:w, prev:this.world(), sessionDelta:this.state.sessionDelta + (after - before)});
    this.animateTo(after);
    this.showToast("+" + (after - before) + " puntos. " + why);
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

  anOpen(type){
    const a = this.state.an;
    const from = this.state.screen === "analizador" ? (a.from || "escaner") : this.state.screen;
    this.setState({screen:"analizador", sheet:null,
      an: Object.assign({}, a, {type, from, value:"", legend:false, report:false, reportText:"",
        view: a.dontShow[type] ? (ANALYZERS[type].camera ? "camera" : "main") : "welcome"})});
  }

  anBack(){
    const a = this.state.an;
    const cam = ANALYZERS[a.type].camera;
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
    const verdict = known ? known.v : cycle[a.used % 4];
    this.anSet({view:"scanning", value:val, reviewed:null, reportKind:""});
    if (this.props.falloAnalisis) { this.later(() => this.anSet({view:"error", errKind:"servicio"}), 1700); return; }
    this.later(() => {
      this.anSet({view:"result", verdict, used: this.state.an.used + 1});
      this.say("Análisis terminado. " + (VERDICTS[verdict] || {}).risk + ": " + ((VERDICTS[verdict] || {}).label || "") + ".");
      const w = this.world();
      const d = w.act.scan;
      if (!(w.nuevo || (d !== undefined && d !== null && d <= 30))) {
        this.awardSilent("scan", "Analizar algo cuenta en tu día a día.");
      }
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
    const score = PR_PW_RULES.filter(x => x[1](w.b || "")).length;
    if (!w.a) err.a = "Introduce tu contraseña actual.";
    if ((w.b || "").length < 12) err.b = "La contraseña debe tener al menos 12 caracteres.";
    else if (score < 5) err.b = "La contraseña debe cumplir todos los requisitos.";
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
    this.auGo("l2fa", {err:{}, code:"", codeErr:null});
  }
  auSignup(){
    const a = this.state.au, pv = a.pass || "", score = PR_PW_RULES.filter(x => x[1](pv)).length;
    const err = {email: this.auEmailErr(a.email),
      pass: pv.length < 12 ? "La contraseña necesita al menos 12 caracteres." : score < 5 ? "La contraseña debe cumplir todos los requisitos." : null,
      terms: !a.terms};
    if (err.email || err.pass || err.terms) { this.say("Revisa los campos marcados."); return this.auSet({err, tried:true}); }
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
    const order = ["intro", "url", "maria", "qr", "zona", "edad", "temas", "alerta"], i = order.indexOf(st);
    if (i <= 0) return this.auGo("signup", {err:{}, tried:false});
    this.obSet({step: order[i - 1], phase:"input", err:null});
  }
  obNext(){
    const o = this.state.au.onb, st = o.step;
    if (st === "intro") return this.obSet({step:"url", phase:"input", urlErr:null});
    if (st === "url" && o.phase === "input") {
      const u = (o.url || "").trim();
      if (!u) return this.obSet({urlErr:"No has introducido ningún enlace."});
      if (!/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(u)) return this.obSet({urlErr:"Formato no válido. Ej. https://www.random-url.net"});
      const verdict = /delivery|correos|pay|login|verif|premio|\.xyz|\d+\.\d+\.\d+\.\d+/i.test(u) ? "danger" : "safe";
      this.obSet({phase:"scan", urlErr:null, verdict});
      return this.later(() => { const n = this.state.au.onb; if (n.step === "url" && n.phase === "scan") this.obSet({phase:"result"}); }, 1600);
    }
    if (st === "url") return this.obSet({step:"maria", phase:"input"});
    if (st === "maria") return this.obSet({step:"qr", phase:"input"});
    if (st === "qr" && o.phase === "input") {
      this.obSet({phase:"scan", verdict:"danger"});
      return this.later(() => { const n = this.state.au.onb; if (n.step === "qr" && n.phase === "scan") this.obSet({phase:"result"}); }, 1600);
    }
    if (st === "qr") return this.obSet({step:"zona", phase:"input", err:null});
    if (st === "zona") return o.zona ? this.obSet({step:"edad", err:null}) : this.obSet({err:"Elige una zona para continuar."});
    if (st === "edad") return this.obSet({step:"temas"});
    if (st === "temas") return this.obSet({step:"alerta"});
    const all = o.zona === OB_ZONAS[4];
    const zonas = all ? PR_ZONAS.reduce((m, z) => (m[z] = 1, m), {}) : {[o.zona]: 1};
    const picked = OB_TEMAS.filter(x => o.temas[x.id]);
    const temas = picked.length ? picked.reduce((m, x) => { x.map.forEach(k => m[k] = 1); return m; }, {}) : null;
    this.setState(st2 => ({pr: Object.assign({}, st2.pr, {zonas, zonasSaved: Object.assign({}, zonas)}, o.edad ? {edad: o.edad, edadSaved: o.edad} : {}, temas ? {temas, temasSaved: Object.assign({}, temas)} : {})}));
    this.auEnter("Todo listo. Tu protección ya está configurada.");
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
    this.setState(s => ({screen:"home", sos: Object.assign({}, s.sos, {view:"aviso", help:"", service:"", desc:"", consent:false, files:0, err:{}})}));
    this.showToast("Caso enviado. Te escribiremos a " + o.email.trim() + ".");
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
    if (k === "name") {
      const clean = val.replace(/\s+/g, " ");
      if (!/^[A-Za-zÀ-ÿ'’ -]+$/.test(clean) || clean.split(" ").filter(x => x.replace(/[-'’]/g, "").length >= 2).length < 2)
        return this.huSet({err:"Escribe tu nombre y al menos un apellido, solo con letras."});
      if (!h.consent) return this.huSet({err:"Marca la casilla para que podamos vigilar tu nombre."});
      return this.huScan(clean);
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
      if (w.plan === "premium") {
        const d = w.act.huella;
        if (!(w.nuevo || (d !== undefined && d !== null && d <= 60))) this.awardSilent("huella", "Revisar tus datos vigilados cuenta en tu día a día.");
      }
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

      pickRows: ["email", "name", "phone", "dni"].map(k => {
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
    const nw = JSON.parse(JSON.stringify(this.world()));
    nw.plan = "premium"; nw.vig = {vemail:1, vname:1, vemail2:1}; nw.alertsLeft = 99;
    this.setState({world:nw, screen:"perfil", shown:0});
    this.animateTo(this.scoreOf(nw));
    this.showToast(id === "anual" ? "Protección anual activada. Gracias." : "Protección mensual activada. Gracias.");
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
    let n = 0;
    if (v.length >= 12) n += 2; else if (v.length >= 8) n += 1;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) n += 1;
    if (/\d/.test(v)) n += 1;
    if (/[^A-Za-z0-9]/.test(v)) n += 1;
    return Math.min(4, n);
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
      telBd: p.errField === "tel" ? "var(--color-destructive)" : "var(--color-input)",
      telLabelFg: p.errField === "tel" ? "var(--color-destructive)" : "var(--color-foreground)",
      hasErr: !!p.err, err: p.err || "",
      avatarBd: p.errField === "avatar" ? "var(--color-destructive)" : "var(--color-border)",
      hasAvatar: !!p.avatar, avatar: p.avatar || "/assets/current/d89746888da2d9510b64a9f031eaecd5.gif",
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
      msgBd: p.msgErr ? "var(--color-destructive)" : "var(--color-input)",
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
      delConfirmBd: p.errField === "confirm" ? "var(--color-destructive)" : "var(--color-input)",
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
    const w = this.world();
    const d = w.act.maria;
    if (!(w.nuevo || (d !== undefined && d !== null && d <= 60))) {
      this.awardSilent("maria", "Preguntar a MarIA cuenta en tu día a día.");
    }
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
    return null;
  }

  complete(id){
    const w = JSON.parse(JSON.stringify(this.world()));
    const before = this.scoreOf(w);
    const it = this.findAction(id);
    if (!it) return;
    if (it.kind === "base") w.base[id] = 1;
    else if (it.kind === "vig") w.vig[id] = 1;
    else if (it.kind === "step" && w.done.indexOf(id) < 0) w.done.push(id);
    else if (it.kind === "act") {
      w.act[id] = 0;
      if (id === "alerta" && w.plan === "free" && w.alertsLeft > 0) w.alertsLeft -= 1;
    }
    w.nuevo = false;
    w.active = true;
    if (!this.world().active) { w.weeks = 1; w.lost = 0; }
    const after = this.scoreOf(w);
    this.setState(s => ({world:w, prev:this.world(), screen:"subida", delta: after - before,
      sessionDelta: s.sessionDelta + (after - before), actId:id, sheet:null, shown: before}));
    this.animateTo(after);
  }

  undoAction(id){
    const w = JSON.parse(JSON.stringify(this.world()));
    const it = this.findAction(id);
    if (!it) return;
    const before = this.scoreOf(w);
    if (it.kind === "base") w.base[id] = 0;
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

  setScen(k){
    const s = SCEN[k];
    this.clearT();
    this.setState({scen:k, world:null, prev:null, screen:"home", sessionDelta:0, sheet:null, read:[],
      hu: Object.assign({}, this.state.hu, {view:"picker", kind:"email", value:"", consent:false, declara:false,
        err:null, otp:"", attempts:0, sel:0, leak:null, paso:null, fresh:false, taken:false,
        items: s.huItems ? s.huItems.slice() : [{kind:"email", value:"micorreo@empresa.com", added:"6 may 2026"}],
        exitSeen:{}, done:{ad1:1, ad2:1, ad3:1, li3:1}})});
    const w = {plan:s.plan, base:Object.assign({}, s.base), vig:Object.assign({}, s.vig || {}),
      done:(s.done || []).slice(), act:Object.assign({}, s.act || {}),
      alertsLeft: s.alertsLeft === undefined ? 99 : s.alertsLeft, weeks:s.weeks, freezes:s.freezes,
      lost:s.lost || 0, checked:s.checked, delta:s.delta, nuevo:!!s.nuevo, active:s.weeks > 0, huClean:!!s.huClean};
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
    if (f === "perfil") this.setState(s => ({screen:"perfil", sheet:null, fam: Object.assign({}, s.fam, {sheet:null}), pr: Object.assign({}, s.pr, {view:"hub"})}));
    else this.setState(s => ({screen:"home", sheet:null, fam: Object.assign({}, s.fam, {sheet:null})}));
  }
  famBack(){
    const f = this.state.fam;
    if (f.sheet) return this.famClose();
    if (f.view === "baja") return f.ret === "plan" ? this.setState(s => ({screen:"perfil", pr: Object.assign({}, s.pr, {view:"plan"})})) : this.famGo("ajustes");
    if (["ficha", "avisos", "ajustes", "salir"].indexOf(f.view) >= 0) return this.famGo("hub");
    return this.famLeaveTo();
  }
  famSheet(sheet){ this.famSet({sheet}); }
  famClose(){ this.famSet({sheet:null}); }
  famSheetSet(patch){ this.setState(s => ({fam: Object.assign({}, s.fam, {sheet: Object.assign({}, s.fam.sheet, patch)})})); }
  famMember(id){ return id === "admin" ? FAM_ADMIN_M : (this.state.fam.members.find(m => m.id === id) || null); }
  famMsgGroups(ctx){
    // ctx: {all, obj:{kind, v}, motive}
    if (ctx.all) return [["Para todo el grupo", [10, 11, 12, 9]]];
    if (ctx.obj && ctx.obj.kind === "link") return ctx.obj.v === "safe"
      ? [["Sobre este enlace", [3, 4]], ["General", [9]]]
      : [["Sobre este enlace", [1, 2, 4]], ["General", [9]]];
    if (ctx.obj && ctx.obj.kind === "leak") return [["Sobre esta filtración", [8, 4]], ["General", [9]]];
    if (ctx.obj && ctx.obj.kind === "other") return [["Sobre un pago, un dato o una llamada", [6, 5, 7]], ["Sobre un mensaje", [2, 4]], ["General", [9]]];
    return [["Sobre un enlace o mensaje", [1, 2, 4]], ["Sobre un pago, un dato o una llamada", [6, 5, 7]], ["Si han salido sus datos", [8]], ["General", [9]]];
  }
  famSendAviso(){
    const f = this.state.fam, sh = f.sheet;
    if (!sh || !sh.msg) return this.famSheetSet({err:true});
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
    const reqs = f.reqs.map(r => r.id === sh.req ? Object.assign({}, r, {reply: sh.msg}) : r);
    const r = f.reqs.find(x => x.id === sh.req), m = this.famMember(r.from);
    this.famSet({sheet:null, reqs});
    this.showToast("Respuesta enviada a " + m.nick + ".");
  }
  famBuy(){
    this.famSheetSet({phase:"activating"});
    this.later(() => { this.setState(s => ({fam: Object.assign({}, s.fam, {sheet:null, view:"crear", role:"admin", created:false})})); this.famTop(); }, 1600);
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
    this.famTop();
  }
  famSendAyuda(){
    const sh = this.state.fam.sheet;
    if (!sh.motive) return this.famSheetSet({err:true});
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
  famApplyFlow(id, caso){
    const base = FAM0();
    let st = {screen:"home", sheet:null, scen:"prem-amitad", world:null, prev:null, toast:null};
    let f = base;
    const an = (value, verdict) => Object.assign({}, this.state.an, {type:"enlace", view:"result", value, verdict, from:"home", legend:false, report:false, reviewed:null, used:1});
    const admin = p => Object.assign(f, {role:"admin"}, p || {});
    const member = p => Object.assign(f, {role:"member"}, p || {});
    switch (id) {
      case "INICIO": f.role = "admin"; break;
      case "F01": f.role = "none"; f.discover = true; st.scen = "free-recien"; break;
      case "F02": f.role = "none"; st.scen = "free-aldia"; st.screen = "analizador"; st.an = an("https://www.bvva.xyz/cobro-urgente", "danger"); break;
      case "F03": f.role = "none"; st.scen = "free-aldia"; st.screen = "familia"; f.view = "oferta"; break;
      case "F04": admin({view:"crear", created:false, members:[], reqs:[], sent:[]}); st.screen = "familia"; break;
      case "F05": admin({reqs:[], members: caso === "nadie"
        ? [{id:"mama", nick:"Mamá", ini:"M", pending:true, expires:"4 de noviembre"}, {id:"ana", nick:"Ana", ini:"A", pending:true, expires:"5 de noviembre"}]
        : FAM_MEMBERS_CALM.map(m => Object.assign({}, m)), sent: FAM_SENT0.slice(1)}); break;
      case "F06": admin(); if (caso === "bajo") { f.reqs = [{id:"r1", from:"mama", kind:"link", obj:"correos.es", v:"safe", motive:"No sé si es seguro", when:"hace 10 min", reply:null}];
        st.screen = "familia"; f.sheet = {kind:"reply", req:"r1", msg:null}; } break;
      case "F07": admin({view:"ficha", mid:"mama"}); st.screen = "familia"; break;
      case "F08": admin({sheet:{kind:"avisar", to:"all", obj:null, msg:null}}); st.screen = "familia"; break;
      case "F09": admin({view:"ficha", mid:"pep"}); st.screen = "familia"; break;
      case "F10": admin({sheet: caso === "pendiente" ? {kind:"inviteView", id:"ana"} : {kind:"invite", step:"nick", nick:""}}); st.screen = "familia"; break;
      case "F11": admin({view:"ajustes"}); st.screen = "familia"; break;
      case "F12": admin({view:"ficha", mid:"marcos", sheet:{kind:"retirar", mid:"marcos"}}); st.screen = "familia"; break;
      case "F13": admin({ending: caso === "cancelado"}); st.screen = "perfil"; st.pr = Object.assign({}, this.state.pr, {view:"plan"}); break;
      case "F14": admin({view:"baja", ret:"ajustes"}); st.screen = "familia"; break;
      case "F15": admin({ending:true}); if (caso === "panel") { st.screen = "familia"; } break;
      case "F16": f.role = "invited"; break;
      case "F17": member(); if (caso === "llamame") f.mem = Object.assign({}, f.mem, {avisoMsg:9}); break;
      case "F18": member({sheet:{kind:"ayuda", step:"pick", obj:null, motive:null}}); st.screen = "familia"; break;
      case "F19": member(); st.screen = "analizador"; st.an = an("https://bit.ly/3xQ-tienda", "suspicious"); break;
      case "F20": member({mem: Object.assign({}, f.mem, {aviso:false})}); st.screen = "familia"; break;
      case "F21": member({view:"ficha", mid:"admin"}); st.screen = "familia"; break;
      case "F22": member({mem: Object.assign({}, f.mem, {ending: caso === "termina"})}); st.screen = "perfil"; st.pr = Object.assign({}, this.state.pr, {view:"plan"}); break;
      case "F23": member({view:"salir"}); st.screen = "familia"; break;
      case "F24": member({mem: Object.assign({}, f.mem, {ending:true, aviso:false})}); if (caso === "panel") st.screen = "familia"; break;
      case "F25": f.role = "none"; f.left = true; st.scen = "free-aldia"; break;
      case "F26": if (caso === "basic") { f.role = "none"; f.discover = true; st.scen = "free-recien"; }
        else if (caso === "miembro") member();
        else if (caso === "sinred") { admin({reqs:[], members: FAM_MEMBERS_CALM.map(m => Object.assign({}, m))}); st.offline = true; }
        else admin(); break;
      default: return;
    }
    st.fam = f;
    if (st.offline === undefined) st.offline = null;
    st.offHidden = false;
    this.clearT();
    this.setState(st);
    this.famTop();
    this.later(() => document.querySelectorAll(".tp-scroll").forEach(el => { el.scrollTop = 0; }), 30);
  }
  famHomeClose(items, where){
    const before = Object.assign({}, this.state.fam.hidden);
    this.setState(s => ({fam: Object.assign({}, s.fam, {hidden: Object.assign({}, s.fam.hidden, items.reduce((o, i) => (o[i] = true, o), {}))})}));
    this.showToast("Aviso cerrado. " + where, {label:"Deshacer", fn: () => this.setState(s => ({fam: Object.assign({}, s.fam, {hidden: before})}))});
  }
  famCancelConfirm(){
    this.setState(s => ({screen:"familia", fam: Object.assign({}, s.fam, {view:"hub", ending:true, sheet:null})}));
    this.famTop();
    this.showToast("Cancelado en la tienda. Tu plan sigue activo hasta el 14 de noviembre.");
  }
  famReactivate(){
    this.famSet({ending:false});
    this.showToast("Tu plan sigue activo. Hemos avisado a tu familia.");
  }
  famLeaveGroup(toPremium){
    this.setState(s => Object.assign({sheet:null, scen:"free-aldia", world:null,
      fam: Object.assign({}, s.fam, {role:"none", left:true, view:"oferta", sheet:null, mem: Object.assign({}, s.fam.mem, {ending:false})})},
      toPremium ? {screen:"perfil", pr: Object.assign({}, s.pr, {view:"plan", sel:"anual"})} : {screen:"home"}));
    this.showToast(toPremium ? "Has salido del grupo. Elige tu plan Premium." : "Has salido de Familia Navarro. Tu cuenta es Basic.");
    this.later(() => document.querySelectorAll(".tp-scroll").forEach(el => { el.scrollTop = 0; }), 30);
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
      ending: !!f.ending, reactivate: () => this.famReactivate(),
      endingSub: "Quedan 18 días. Hemos avisado a " + (people.map(m => m.nick).join(", ") || "tu grupo") + ".",
      groupName: f.groupName, seats: (people.length + pend.length + 1) + " de 6 plazas",
      hasReq: !!req0, reqTitle: reqFrom ? reqFrom.nick + " te pide ayuda" : "",
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
      hasAviso: !!mm.aviso, avisoMsg: "«" + FAM_MSGS[mm.avisoMsg || 6] + "»", avisoAbout: "Responde a tu petición: un mensaje o una llamada · «Me piden dinero»",
      avisoMoney: (mm.avisoMsg || 6) === 6,
      ending: !!mm.ending, toPlans: () => this.setState(s => ({screen:"perfil", sheet:null, pr: Object.assign({}, s.pr, {view:"plan", sel:"anual"})})),
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
      leave: () => this.famGo("salir")
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
      cancel: () => this.famGo("baja", {ret:"ajustes"})
    };

    /* ---- oferta ---- */
    const o = f.offer;
    const fmt = c => Math.floor(c / 100) + "," + String(c % 100).padStart(2, "0") + " €";
    const total = o.n ? (o.period === "anual" ? Math.round(FAM_PRICES[o.n] * 10 / 100) * 100 - 1 : FAM_PRICES[o.n]) : 0;
    const offer = {
      pills: [2, 3, 4, 5, 6].map(n => ({label:String(n), aria: n + " personas", checked: o.n === n ? "true" : "false",
        bg: o.n === n ? "var(--color-primary)" : "var(--color-card)", fg: o.n === n ? "var(--color-on-fill)" : "var(--color-foreground)",
        bd: o.n === n ? "var(--color-primary)" : "var(--color-input)", pick: () => this.famSet({offer: Object.assign({}, o, {n})})})),
      isYear: o.period === "anual" ? "true" : "false", isMonth: o.period === "mensual" ? "true" : "false",
      yBg: o.period === "anual" ? "var(--color-card)" : "transparent", mBg: o.period === "mensual" ? "var(--color-card)" : "transparent",
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
      ageBd: j.err && !j.age ? "var(--color-destructive)" : j.age ? "var(--color-primary)" : "var(--color-input)",
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
        groups: msgOpts(this.famMsgGroups({obj:{kind:r.kind, v:r.v}}), sh.msg, id => this.famSheetSet({msg:id, err:false})),
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
        confirm: () => { this.setState(st => ({screen:"home", fam: Object.assign({}, st.fam, {sheet:null, role:"none", view:"oferta"})})); this.showToast("Has salido del grupo. Tu cuenta es Basic."); }});
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
    const heading = {hub:"Mi Familia", oferta:"Plan familiar", crear:"Crea tu grupo", ficha: ficha.name, avisos:"Avisos y peticiones", ajustes:"Ajustes de Mi Familia", unirse:"Invitación", baja:"Cancelar el plan familiar", salir:"Salir del grupo"}[f.view] || "Mi Familia";
    return {
      role, isAdmin, isMember, heading, back: () => this.famBack(),
      isHub: f.view === "hub", isAdminHub: f.view === "hub" && isAdmin, isMemberHub: f.view === "hub" && isMember,
      isOffer: f.view === "oferta", isCrear: f.view === "crear", isFicha: f.view === "ficha" && !!fm, isAvisos: f.view === "avisos",
      isAjustes: f.view === "ajustes", isUnirse: f.view === "unirse", isBaja: f.view === "baja", isSalir: f.view === "salir",
      baja: {
        people: people.map(m => ({ini:m.ini, name:m.nick, st:"Pasa a Basic"})).concat([{ini:"E", name:"Tú", st:"Pasas a Basic"}]),
        hasPending: pend.length > 0, pendingText: pend.map(m => m.nick).join(", ") + (pend.length === 1 ? ": su invitación se anula." : ": sus invitaciones se anulan."),
        lose: FAM_LOSE_ADMIN.map((x, k) => ({icon:x[0], t:x[1], s:x[2], line: k ? "1px solid var(--color-border)" : "0"})),
        notify: "Avisaremos a " + (people.map(m => m.nick).join(", ") || "tu grupo") + " hoy y 3 días antes.",
        keep: () => { this.famBack(); this.showToast("Tu plan sigue igual."); },
        go: () => this.famCancelConfirm()
      },
      salir: {
        lose: FAM_LOSE_MEMBER.map((x, k) => ({icon:x[0], t:x[1], s:x[2], line: k ? "1px solid var(--color-border)" : "0"})),
        stay: () => { this.famGo("hub"); this.showToast("Sigues en Familia Navarro."); },
        premium: () => this.famLeaveGroup(true), basic: () => this.famLeaveGroup(false)
      },
      showSettings: f.view === "hub" && isAdmin, openSettings: () => this.famGo("ajustes"),
      hub, member, ficha, avisos, ajustes, offer, crear, unirse, sh: sv
    };
  }

  famHomeVals(){
    // Dismissal is tracked per item the card mentions (a request, a member's risk, the plan ending...).
    // The card comes back only when it has something the person has not closed yet.
    // Calm states (nothing to do) never come back once the person has closed any notice.
    const v = this.famHomeRaw(), f = this.state.fam, h = f.hidden || {};
    const calm = v.items.length === 1 && ["adm-calm", "adm-pending", "mem-idle", "promo"].indexOf(v.items[0]) >= 0;
    const hidden = v.items.every(i => h[i]) || (calm && Object.keys(h).length > 0);
    return Object.assign(v, {show: !hidden, isCompact: v.isCompact && !hidden, isDiscover: v.isDiscover && !hidden,
      closeAria: "Cerrar aviso: " + v.title,
      close: () => this.famHomeClose(v.items, v.where),
      discoverLater: () => this.famHomeClose(v.items, v.where)});
  }

  famHomeRaw(){
    const role = this.famRole(), f = this.state.fam;
    const people = f.members.filter(m => !m.pending), open = f.reqs.filter(r => !r.reply);
    const ini = people.slice(0, 3).map((m, k) => ({ini:m.ini, z: String(3 - k), ml: k ? "-4px" : "0"}));
    const red = "var(--color-destructive)", warn = "var(--yellow-700)";
    const base = {isDiscover:false, isCompact:true, hasAvatars:true, hasIcon:false, icon:"", badgeBg:red, open: () => this.famOpen("home")};
    if (role === "admin") {
      const req = open[0], rm = req ? this.famMember(req.from) : null;
      const risky = people.filter(m => m.level !== "safe" && (!rm || m.id !== rm.id));
      if (f.ending) return Object.assign(base, {items:["adm-ending"], where:"Puedes reactivar el plan desde Perfil, en Mi Familia.", title:"Mi Familia", hasBadge:true, badge:"Termina el 14 nov", badgeBg:warn,
        body:"Tu plan familiar termina el 14 de noviembre. Puedes reactivarlo hasta ese día.", avatars: ini.length ? ini : [{ini:"+", z:"1", ml:"0"}], aria:"Mi Familia, el plan termina el 14 de noviembre"});
      const riskItem = m => "risk:" + m.id + "-" + m.level;
      return Object.assign(base, {items: rm ? open.map(r => "req:" + r.id).concat(rm.level && rm.level !== "safe" ? [riskItem(rm)] : [], risky[0] ? [riskItem(risky[0])] : []) : people.length ? (risky.length ? [riskItem(risky[0])] : ["adm-calm"]) : ["adm-pending"],
        where: rm ? "La petición de " + rm.nick + " sigue en Perfil, en Mi Familia." : "Volverá si hay novedades. Mi Familia sigue en Perfil.",
        title:"Mi Familia", hasBadge: open.length > 0, badge: open.length === 1 ? "1 petición" : open.length + " peticiones",
        body: rm ? rm.nick + " te pide ayuda con un enlace." + (risky[0] ? " " + risky[0].nick + ": " + risky[0].status.toLowerCase() + "." : "")
          : people.length ? (risky.length ? risky[0].nick + ": " + risky[0].status.toLowerCase() + "." : "Todo en orden en " + f.groupName + ". Nadie ha pedido ayuda.")
          : "Tus invitaciones están pendientes. Te avisaremos cuando alguien acepte.",
        avatars: ini.length ? ini : f.members.slice(0, 3).map((m, k) => ({ini:m.ini, z: String(3 - k), ml: k ? "-4px" : "0"})),
        aria: "Mi Familia" + (open.length ? ", " + open.length + " petición de ayuda pendiente" : "")});
    }
    if (role === "member") {
      if (f.mem.ending) return Object.assign(base, {items:["mem-ending"], where:"Lo tienes en Perfil, en Mi Familia.", title:"Familia Navarro", hasBadge:true, badge:"Termina el 14 nov", badgeBg:warn,
        body:"El plan familiar termina el 14 de noviembre. Después tu cuenta será Basic.", avatars:[{ini:"L", z:"1", ml:"0"}], aria:"Familia Navarro, el plan termina el 14 de noviembre"});
      return Object.assign(base, {items: [f.mem.aviso ? "mem-aviso" : "mem-idle"], where: f.mem.aviso ? "La respuesta de Lucía sigue en Perfil, en Mi Familia." : "Volverá si hay novedades. Mi Familia sigue en Perfil.", title:"Familia Navarro", hasBadge: !!f.mem.aviso, badge:"1 aviso nuevo",
        body: f.mem.aviso ? "Lucía ha respondido a tu petición de ayuda." : "¿Dudas con un mensaje o una llamada? Pide ayuda a Lucía.",
        avatars:[{ini:"L", z:"1", ml:"0"}], aria:"Mi Familia" + (f.mem.aviso ? ", 1 aviso nuevo" : "")});
    }
    if (role === "invited") return Object.assign(base, {items:["invited"], where:"La invitación sigue en Perfil, en Mi Familia.", title:"Te han invitado", hasBadge:true, badge:"Invitación",
      body:"Lucía Navarro te invita a Familia Navarro. Revisa qué compartirías antes de unirte.", avatars:[{ini:"L", z:"1", ml:"0"}], aria:"Invitación de Lucía Navarro a Familia Navarro"});
    if (f.left) return Object.assign(base, {items:["left"], where:"Los planes Premium están en Perfil.", title:"Ya no estás en Familia Navarro", hasBadge:false, badge:"", hasAvatars:false, hasIcon:true, icon:"user-round-x",
      body:"Tu cuenta es Basic desde hoy y Lucía ya no ve lo que compartías. Puedes contratar tu propio Premium cuando quieras.",
      open: () => this.setState(s => ({screen:"perfil", sheet:null, pr: Object.assign({}, s.pr, {view:"plan", sel:"anual"})})), aria:"Ya no estás en Familia Navarro. Ver planes Premium"});
    return Object.assign(base, {items:["promo"], where:"Mi Familia sigue en Perfil cuando quieras.", isDiscover: !!f.discover, isCompact: !f.discover, title:"Mi Familia", hasBadge:true, badge:"NUEVO", badgeBg:"var(--color-primary)",
      body:"Cuida de las personas adultas de tu familia. Cada una decide qué comparte contigo.",
      avatars:[], hasAvatars:false, hasIcon:true, icon:"users-round", aria:"Mi Familia, nuevo",
      discoverGo: () => { this.famSet({discover:false}); this.famOpen("home"); }});
  }

  famPlanVals(){
    const s = this.state, f = s.fam, role = this.famRole();
    const show = s.screen === "perfil" && s.pr.view === "plan" && (role === "admin" || role === "member");
    const people = f.members.filter(m => !m.pending);
    return {show, isAdmin: role === "admin", isMember: role === "member",
      ending: role === "admin" ? !!f.ending : !!f.mem.ending,
      seats: (people.length + 1) + " personas lo usan" + ((f.members.length - people.length) ? " y " + (f.members.length - people.length) + (f.members.length - people.length === 1 ? " invitación pendiente" : " invitaciones pendientes") : "") + " · " + (f.members.length + 1) + " de 6 plazas",
      feats: PR_FEATS.filter(x => !x[1]).map(x => ({t:x[0]})),
      toFamily: () => this.famOpen("perfil"),
      store: () => this.showToast("Te llevamos a la gestión de suscripciones de la tienda."),
      cancel: () => this.famGo("baja", {ret:"plan", from:"perfil"}),
      notEnding: !(role === "admin" ? f.ending : f.mem.ending),
      reactivate: () => this.famReactivate()};
  }

  // ===== Nuevas funciones: Aprende, plan paso a paso, avisos automáticos, detalle de aviso, borrado, casos =====
  apSet(p){ this.setState(s => ({ap: Object.assign({}, s.ap, p)})); }
  apOpen(tema){
    if (!tema) return this.setState(s => ({screen:"aprende", sheet:null, ap: Object.assign({}, s.ap, {view:"list", tema:null, step:0, pick:null})}));
    this.setState(s => ({screen:"aprende", sheet:null, ap: Object.assign({}, s.ap, {view:"lesson", tema, step:0, pick:null})}));
  }
  apPractice(to){
    if (to === "maria") return this.go("maria");
    if (to === "twofa") return this.prGo("fa", {fa:{step:"intro", code:"", err:null, n:0}});
    this.anOpen(to);
  }

  pzOpen(plan, from){
    this.setState(s => ({screen:"plan", sheet:null, pz: {view: plan ? "plan" : "pick", plan: plan || null, done: (s.pz && s.pz.plan === plan && s.pz.done) || {}, from: from || s.screen}}));
    if (plan) this.caseTouch("plan:" + plan, {kind:"plan", plan});
  }
  pzToggle(i){
    const pz = this.state.pz, done = Object.assign({}, pz.done, {[i]: !pz.done[i]});
    this.setState({pz: Object.assign({}, pz, {done})});
    this.caseTouch("plan:" + pz.plan, {kind:"plan", plan:pz.plan, done});
    const p = PZ_PLANES[pz.plan], n = p.steps.filter((x, k) => done[k]).length;
    this.say(n + " de " + p.steps.length + " pasos hechos.");
  }
  pzBack(){
    const pz = this.state.pz;
    if (pz.view === "plan" && pz.from === "plan") return this.setState({pz: Object.assign({}, pz, {view:"pick", from: pz.origin || "sos"})});
    if (pz.from === "casos") return this.setState(s => ({screen:"sos", sheet:null, sos: Object.assign({}, s.sos, {view:"casos"})}));
    if (pz.from === "analizador") return this.setState({screen:"analizador", sheet:null});
    if (pz.from === "aviso") return this.setState({screen:"aviso", sheet:null});
    return this.sosOpen();
  }
  caseTouch(id, c){
    this.setState(s => {
      const list = (s.cases || []).slice(), i = list.findIndex(x => x.id === id);
      const item = Object.assign({id, when:"Hoy"}, i >= 0 ? list[i] : {}, c);
      if (i >= 0) list[i] = item; else list.unshift(item);
      return {cases: list};
    });
  }

  avisoOpen(id, award){
    this.setState(s => ({screen:"aviso", sheet:null, alSel:id, read: s.read.indexOf(id) >= 0 ? s.read : s.read.concat([id])}));
    if (award) this.later(() => this.awardSilent("alerta", "Leer un aviso cuenta en tu día a día."), 400);
  }
  avisoGo(to){
    if (to === "huella") return this.go("huella");
    if (to === "mensaje") return this.anOpen("mensaje");
    if (to === "linkedin") return this.showToast("Abriendo LinkedIn. Cambia la contraseña desde su app.");
    if (to === "plan-bizum") return this.pzOpen("bizum", "aviso");
  }

  brSet(p){ this.setState(s => ({br: Object.assign({}, s.br, p)})); }
  brSend(){
    const b = this.state.br;
    if (!b.auth) { this.brSet({err:true}); this.say("Marca la casilla de autorización para enviar las solicitudes."); return; }
    this.brSet({view:"seguimiento", st: BR_SITES.reduce((o, x) => (o[x.id] = "pedido", o), {}), sentOn:"hoy", err:false, howOpen:false});
    this.caseTouch("borrado", {kind:"borrado"});
    this.showToast("Hemos enviado 6 solicitudes en tu nombre. Te avisamos con cada respuesta.");
  }

  ftAn0(){ return {type:"enlace", view:"welcome", value:"", verdict:"danger", used:0, seen:{}, dontShow:{},
    legend:false, report:false, reportText:"", reportKind:"", reportErr:false, reviewed:null, plan:"anual", from:"home"}; }

  // ===== Presets del Lab para los flujos de la app (A01–A36) =====
  appApplyFlow(id, caso, plan){
    const prem = plan === "premium";
    const both = (fr, pr) => prem ? pr : fr;
    let st = {screen:"home", sheet:null, scen:"free-aldia", world:null, prev:null, toast:null, from:"home", push:false, read:[],
      offline:null, offHidden:false, camPerm:null, notiPerm:null, bio:null, bioOk:false, obDone:true,
      fam: Object.assign(FAM0(), {role:"none"}), an: this.ftAn0(),
      au: AU0(), ob:{step:1, tick:0, done:false}, ap:{view:"list", tema:null, step:0, pick:null, done:{}},
      pz:{view:"pick", plan:null, done:{}, from:"sos"}, cases:[], alSel:null, autoOn:false, autoDev:"iphone",
      br:{view:"intro", auth:false, err:false, st:{}, howOpen:false},
      maria:{view:"intro", topic:null, msgs:[], node:null, rate:null},
      sos: Object.assign({}, this.state.sos, {view:"aviso", dontShow:false, help:"", desc:"", consent:false, files:0, err:{}}),
      shr:null, dd:null, al: Object.assign({}, this.state.al, {view:"list", q:"", applied:"", tab:"todos", sel:null}),
      pr: Object.assign({}, this.state.pr, this.prSecReset(), {view:"hub", fa:{step:"intro", code:"", err:null, n:0}})};
    const an = p => Object.assign(this.ftAn0(), {seen:{enlace:1, qr:1, mensaje:1, correo:1, telefono:1}}, p);
    const hu = p => Object.assign({}, this.state.hu, {view:"picker", kind:"email", value:"", err:null, otp:"", attempts:0, sel:0, leak:null, paso:null, fresh:false, taken:false}, p);
    const S = this.state;
    switch (id) {
      case "A01": st.screen = "auth"; st.scen = "free-recien"; st.obDone = false;
        if (caso === "login") st.au = Object.assign(AU0(), {view:"login", email:"elena@ejemplo.es"});
        if (caso === "2fa") st.au = Object.assign(AU0(), {view:"l2fa", email:"elena@ejemplo.es"});
        break;
      case "A02": st.screen = "auth"; st.scen = "free-recien"; st.obDone = false;
        st.au = Object.assign(AU0(), {view:"signup"}, caso === "debil" ? {email:"elena@ejemplo.es", pass:"elena1965", tried:true} : {}); break;
      case "A03": st.screen = "auth"; st.scen = "free-recien"; st.obDone = false;
        st.au = Object.assign(AU0(), {view:"onb", onb: Object.assign(OB0(),
          caso === "enlace" ? {step:"url", phase:"result", url:"http://delivery-es.com/correos/pay", verdict:"danger"}
          : caso === "alerta" ? {step:"alerta"} : {})}); break;
      case "A04": st.screen = "bienvenida"; st.scen = "free-recien"; st.obDone = false;
        if (caso === "calculo") st.ob = {step:3, tick:4, done:true}; break;
      case "A05": st.scen = "free-recien"; break;
      case "A06": st.scen = "free-recien"; st.screen = "aprende";
        if (caso === "fallo") st.ap = Object.assign(st.ap, {view:"lesson", tema:"sms", step:3, pick:0});
        else if (caso === "hecho") st.ap = Object.assign(st.ap, {done:{sms:true}});
        break;
      case "A07": st.screen = "hitos"; st.scen = "free-aldia"; break;
      case "A08": st.screen = "hitos"; st.scen = "free-dormido"; break;
      case "A09": st.scen = "free-aldia";
        if (caso === "avisos") { st.screen = "alertas"; st.scen = "free-tope"; }
        else if (caso === "huella") { st.screen = "huflow"; st.hu = hu({view:"result", sel:0, fresh:true}); }
        else { st.screen = "analizador"; st.an = an({type:"enlace", view:"limite", used:3}); }
        break;
      case "A10": st.scen = both("free-aldia", "prem-aldia"); st.screen = "escaner";
        if (caso === "qr-permiso") { st.screen = "analizador"; st.an = an({type:"qr", view:"permiso"}); }
        if (caso === "qr-denegado") { st.screen = "analizador"; st.camPerm = "Denegado"; st.an = an({type:"qr", view:"denegado"}); }
        break;
      case "A11": st.scen = both("free-aldia", "prem-aldia"); st.screen = "analizador";
        st.an = an({type:"enlace", view:"result", value:"https://www.bvva.xyz/cobro-urgente", verdict:"danger", used:1});
        if (caso === "abrir") st.sheet = {kind:"access"};
        if (caso === "sinred") { st.offline = true; st.an = an({type:"enlace", view:"error", errKind:"red", value:"https://www.bvva.xyz/cobro-urgente"}); }
        if (caso === "fallo") st.an = an({type:"enlace", view:"error", errKind:"servicio", value:"https://www.bvva.xyz/cobro-urgente"});
        if (caso === "noverif") st.an = an({type:"enlace", view:"result", value:"https://ofertas-flash.ejemplo.com/cupon", verdict:"unknown", used:1});
        break;
      case "A12": st.scen = both("free-aldia", "prem-aldia"); st.screen = "plan";
        st.pz = {view:"plan", plan: caso === "bizum" ? "bizum" : caso === "datos" ? "datos" : "tarjeta", done:{}, from:"analizador"};
        st.cases = [{id:"plan:" + st.pz.plan, kind:"plan", plan:st.pz.plan, done:{}, when:"Hoy"}];
        break;
      case "A13": st.scen = both("free-aldia", "prem-aldia"); st.screen = "sos"; st.sos.view = "hub";
        if (caso === "equipo") st.sos = Object.assign(st.sos, {view:"form", help:"Hackeo de cuentas"});
        if (caso === "soporte") { st.screen = "soporte"; st.sop = Object.assign({}, S.sop, {asunto:"", desc:"", err:{}}); }
        break;
      case "A14": st.scen = both("free-aldia", "prem-aldia"); st.screen = "analizador";
        st.an = an({type:"mensaje", view:"main"});
        if (caso === "resultado") st.an = an({type:"mensaje", view:"result", value:ANALYZERS.mensaje.pasteValue, verdict:"danger", used:1});
        break;
      case "A15": st.scen = both("free-aldia", "prem-aldia"); st.screen = "auto"; if (caso === "android") st.autoDev = "android"; break;
      case "A16": st.scen = both("free-aldia", "prem-amitad"); st.screen = "aviso"; st.alSel = "a1"; st.push = true; st.read = ["a1"];
        if (caso === "familia") { st.scen = "prem-amitad"; st.fam = Object.assign(FAM0(), {role:"admin"}); st.alSel = "a2"; st.read = ["a2"]; st.push = false; }
        if (caso === "limite") { st.scen = "free-tope"; st.screen = "alertas"; st.read = []; st.push = false; }
        break;
      case "A17": st.scen = caso === "free" ? "free-aldia" : "prem-aldia"; st.screen = "borrar"; break;
      case "A18": st.scen = "prem-aldia"; st.screen = "borrar";
        st.br = {view:"seguimiento", auth:true, err:false, st: Object.assign({}, BR_SEGUIMIENTO), sentOn:"6 oct", howOpen: caso === "reclamar"};
        st.cases = [{id:"borrado", kind:"borrado", when:"6 oct"}];
        break;
      case "A19": st.scen = both("free-aldia", "prem-aldia"); st.screen = "sos"; st.sos = Object.assign(st.sos, {view:"casos"});
        st.cases = caso === "vacio" ? [] : [
          {id:"sos-1", kind:"team", help:"Suplantación de identidad", email:"micorreo@empresa.com", when:"Ayer"},
          {id:"plan:bizum", kind:"plan", plan:"bizum", done:{0:true}, when:"Ayer"}];
        break;
      case "A20": if (caso === "sinresolver") { st.scen = "prem-sinresolver"; st.screen = "huella"; } else { st.scen = "free-aldia"; st.screen = "paywall"; } break;
      case "A21": st.scen = "prem-amitad"; st.screen = "huflow"; st.hu = hu({view:"paso", kind:"email", sel:0, leak:"li", paso:"li1"}); break;
      case "A22": st.scen = "prem-aldia";
        st.fam = Object.assign(FAM0(), {role:"admin", reqs:[], members: FAM_MEMBERS_CALM.map(m => Object.assign({}, m))}); break;
      case "A23": st.scen = both("free-aldia", "prem-aldia"); st.screen = "maria";
        if (caso !== "intro") st.maria = {view:"chat", topic:"Phishing", msgs:[{who:"m", text:MARIA_TOPICS[0].reply}], node:MARIA_TOPICS[0], rate:null};
        break;
      case "A24": st.screen = "maria"; st.maria = {view:"chat", topic:null, msgs:[], node:null, rate:null};
        if (caso === "premium") { st.scen = "prem-aldia"; st.maria.img = true; } else { st.scen = "free-aldia"; st.sheet = {kind:"premium-img"}; }
        break;
      case "A25": st.scen = both("free-aldia", "prem-aldia"); st.screen = "maria"; st.maria = {view:"list", topic:null, msgs:[], node:null, rate:null}; break;
      case "A26": st.scen = both("free-aldia", "prem-aldia"); st.screen = "huflow"; st.hu = hu({view:"picker"});
        if (caso === "telefono") { st.scen = "prem-aldia"; st.hu = hu({view:"otp", kind:"phone", value:"612 345 678", consent:true}); }
        if (caso === "bloqueo") { st.scen = "prem-aldia"; st.hu = hu({view:"bloqueo", kind:"phone", value:"612 345 678", attempts:3}); }
        if (caso === "nombre") { st.scen = "prem-aldia"; st.hu = hu({view:"input", kind:"name", value:"Elena García Ruiz", consent:false}); }
        break;
      case "A27": st.scen = caso === "free" ? "free-aldia" : "prem-sinresolver"; st.screen = "huflow"; st.hu = hu({view:"result", sel:0, fresh:true}); break;
      case "A28": st.scen = "prem-aldia"; st.screen = "bloqueo"; st.bio = true; st.bioOk = false; break;
      case "A29": st.scen = "prem-aldia"; st.screen = "perfil"; st.pr = Object.assign(st.pr, {view:"plan", plan:"anual", sel:"anual"});
        if (caso === "cancelar") st.sheet = {kind:"pr-cancel"}; break;
      case "A30": st.scen = both("free-aldia", "prem-aldia"); st.screen = "perfil"; st.pr = Object.assign(st.pr, {view:"fa", fa:{step: caso === "codigo" ? "code" : "intro", code:"", err:null, n:0}}); break;
      case "A31": st.scen = both("free-aldia", "prem-aldia"); st.screen = "perfil"; st.pr = Object.assign(st.pr, {view:"seguridad", sec:"pass"}); break;
      case "A32": st.scen = both("free-aldia", "prem-aldia"); st.screen = "perfil";
        st.pr = Object.assign(st.pr, {view:"seguridad", sec:"borrar", del:{reason: caso === "confirmar" ? "Ya no lo necesito" : "", other:"", err:{}}, confirm: caso === "confirmar"}); break;
      case "A33": st.scen = both("free-aldia", "prem-aldia");
        if (caso === "denegado") { st.screen = "notificaciones"; st.notiPerm = "Denegado"; }
        else { st.screen = "perfil"; st.pr = Object.assign(st.pr, {view:"alertas"}); }
        break;
      case "A34": st.scen = both("free-aldia", "prem-aldia"); st.screen = "perfil"; st.pr = Object.assign(st.pr, {view:"opinion", fb:{topic:"", text:"", err:{}}}); break;
      case "A35": st.scen = both("free-aldia", "prem-amitad"); st.screen = "desglose"; break;
      case "A36": st.scen = "free-critico"; st.screen = "pasos"; st.actId = "twofa"; break;
      case "A37": st.scen = both("free-aldia", "prem-aldia"); st.screen = "sos";
        if (caso === "form") st.sos = Object.assign(st.sos, {view:"form"});
        if (caso === "errores") st.sos = Object.assign(st.sos, {view:"form", err:{help:true, desc:true, name:true, email:false, consent:true}});
        break;
      case "A38": st.scen = both("free-aldia", "prem-aldia"); st.screen = "alinfo";
        st.al = Object.assign(st.al, {view:"detail", sel:"hirudo"});
        if (caso === "compartir") st.shr = {title: (AL_ITEMS.find(x => x.id === "hirudo") || {}).title || ""};
        if (caso === "favoritos") st.al = Object.assign(st.al, {view:"list", tab:"favoritos", fav:{hirudo:true}, sel:null});
        break;
      default: return;
    }
    this.clearT();
    this.setState(st);
    if (id === "A36" && caso === "subida") this.later(() => this.complete("twofa"), 0);
    this.later(() => this.setState(s => ({shown: this.scoreOf(this.world())})), 0);
    this.later(() => document.querySelectorAll(".tp-scroll").forEach(el => { el.scrollTop = 0; }), 30);
    const reveal = ["A18:reclamar", "A16:familia", "A17:free"].indexOf(id + ":" + caso) >= 0 ? ".tp-phone [data-reveal]" : null;
    if (reveal) this.later(() => { const el = document.querySelector(reveal); if (el) el.scrollIntoView({block:"center"}); }, 120);
  }

  ftVals(){
    const s = this.state, prem = this.world().plan === "premium";
    const ap = s.ap || {view:"list", done:{}}, pz = s.pz || {view:"pick", done:{}}, br = s.br || {view:"intro", st:{}}, cases = s.cases || [];
    const check = on => ({bd: on ? "var(--color-primary)" : "var(--color-input)", bg: on ? "var(--color-primary)" : "var(--color-card)", icon: on ? "check" : ""});

    // --- Aprende ---
    const tema = AP_TEMAS.find(t => t.id === ap.tema) || AP_TEMAS[0];
    const step = ap.step || 0, picked = ap.pick === null || ap.pick === undefined ? null : tema.q.opts[ap.pick];
    const apVals = {
      isList: ap.view === "list", isCard: ap.view === "lesson" && step < 3, isQuiz: ap.view === "lesson" && step === 3, isDone: ap.view === "lesson" && step === 4,
      heading: ap.view === "list" ? "Aprende" : tema.t,
      back: () => ap.view === "list" ? this.go("home") : this.apSet({view:"list", step:0, pick:null}),
      temas: AP_TEMAS.map(t => { const done = !!(ap.done || {})[t.id];
        return {t:t.t, sub:t.sub, icon:t.icon, pill: done ? "Aprendido" : t.min + " min", pillIcon: done ? "check" : "clock",
          pillBg: done ? "var(--green-100)" : "var(--color-accent)", pillFg: done ? "var(--green-800)" : "var(--color-foreground)",
          open: () => this.apOpen(t.id)}; }),
      stepN: String(step + 1), progressLabel: step < 3 ? "Tarjeta " + (step + 1) + " de 3" : "Pregunta final",
      dots: [0, 1, 2, 3].map(k => ({bg: k <= step ? "var(--color-primary)" : "var(--color-accent)"})),
      card: tema.cards[Math.min(step, 2)],
      nextLabel: step < 2 ? "Siguiente" : "Ir a la pregunta",
      next: () => this.apSet({step: step + 1, pick:null}),
      q: {prompt: tema.q.prompt, msg: tema.q.msg, hasMsg: !!tema.q.msg, answered: !!picked,
        opts: tema.q.opts.map((o, k) => { const on = ap.pick === k, show = on && picked;
          return {t:o.t, checked: on ? "true" : "false",
            bd: show ? (o.ok ? "var(--green-700)" : "var(--color-destructive)") : "var(--color-border)",
            bg: show ? (o.ok ? "var(--green-50)" : "var(--red-50)") : "var(--color-card)",
            dotBd: show ? (o.ok ? "var(--green-700)" : "var(--color-destructive)") : "var(--color-input)",
            dotBg: show ? (o.ok ? "var(--green-700)" : "var(--color-destructive)") : "var(--color-card)",
            icon: show ? (o.ok ? "check" : "x") : "",
            pick: () => { if (picked && picked.ok) return; this.apSet({pick:k}); this.say(o.ok ? "Correcto." : "No es la mejor opción. " + o.why); }}; }),
        fbTitle: picked && picked.ok ? "¡Correcto!" : "No es la mejor opción",
        fbIcon: picked && picked.ok ? "circle-check" : "circle-alert",
        fbFg: picked && picked.ok ? "var(--green-800)" : "var(--red-800)",
        fbBg: picked && picked.ok ? "var(--green-50)" : "var(--red-50)",
        why: picked ? picked.why : "",
        ctaLabel: picked && picked.ok ? "Terminar el tema" : "Probar otra vez",
        cta: () => picked && picked.ok
          ? (this.apSet({step:4, done: Object.assign({}, ap.done, {[tema.id]: true})}), this.showToast("Tema aprendido: " + tema.t + "."))
          : this.apSet({pick:null})},
      doneBody: "Ya sabes reconocer " + tema.t.toLowerCase().replace(/[«»]/g, "") + ". Lo mejor para que se quede es practicarlo una vez con un caso real.",
      practiceLabel: tema.practice.label, practice: () => this.apPractice(tema.practice.to),
      toList: () => this.apSet({view:"list", step:0, pick:null})
    };

    // --- Plan paso a paso ---
    const plan = PZ_PLANES[pz.plan] || PZ_PLANES.tarjeta;
    const doneN = plan.steps.filter((x, k) => (pz.done || {})[k]).length;
    const pzVals = {
      isPick: pz.view === "pick", isPlan: pz.view === "plan",
      heading: pz.view === "pick" ? "Qué hacer ahora" : plan.t,
      back: () => this.pzBack(),
      picks: Object.keys(PZ_PLANES).map(k => ({t: PZ_PLANES[k].t, icon: PZ_PLANES[k].icon,
        sub: k === "tarjeta" ? "Bloquear la tarjeta y reclamar el cargo" : k === "bizum" ? "Qué hacer si el dinero ya ha salido" : "Cerrar la puerta antes de que la usen",
        open: () => { this.setState({pz: {view:"plan", plan:k, done: (cases.find(c => c.id === "plan:" + k) || {}).done || {}, from:"plan", origin: pz.from}}); this.caseTouch("plan:" + k, {kind:"plan", plan:k}); }})),
      intro: plan.intro, total: String(plan.steps.length), doneN: String(doneN),
      progress: doneN + " de " + plan.steps.length + " hechos", pct: Math.round(100 * doneN / plan.steps.length) + "%",
      steps: plan.steps.map((x, k) => { const on = !!(pz.done || {})[k], c = check(on);
        return {n:String(k + 1), t:x.t, d:x.d, urgent: !!x.urgent && !on, checked: on ? "true" : "false", aria:"Hecho: " + x.t,
          boxBd:c.bd, boxBg:c.bg, boxIcon:c.icon, deco: on ? "line-through" : "none", bd: x.urgent && !on ? "var(--color-ring)" : "var(--color-border)",
          toggle: () => this.pzToggle(k), hasAct: !!x.act && !on, actLabel: x.act || "",
          act: () => x.act === "Ir a mis contraseñas" ? this.prGo("seguridad", Object.assign({}, this.prSecReset(), {sec:"pass"})) : this.showToast("Abriendo el teléfono para llamar a tu banco.")}; }),
      toTeam: () => this.setState(st => ({screen:"sos", sheet:null, sos: Object.assign({}, st.sos, {view: st.sos.dontShow ? "form" : "aviso", err:{}})}))
    };

    // --- SOS: hub y Mis casos ---
    const so = s.sos || {};
    const sosHub = {show: s.screen === "sos" && so.view === "hub", hasCases: false, // Mis casos: próximamente
      casesLabel: "Mis casos · " + cases.length, toCases: () => this.sosSet({view:"casos"}),
      opts: [
        {t:"He pagado o he dado mis datos", sub:"Plan paso a paso, gratis. Lo más urgente primero.", icon:"credit-card", urgent:true, open: () => this.pzOpen(null, "sos")},
        {t:"Me han robado una cuenta o se hacen pasar por mí", sub:"Lo revisa nuestro equipo SOS contigo (4,99 €).", icon:"user-x", open: () => this.sosSet({view: so.dontShow ? "form" : "aviso", err:{}})},
        {t:"Tengo una duda sobre un mensaje o una llamada", sub:"Pregúntale a MarIA, a cualquier hora.", icon:"message-circle-more", open: () => this.go("maria")},
        {t:"Algo de la app no funciona", sub:"Soporte técnico: lo revisamos contigo.", icon:"wrench", open: () => this.setState(st => ({screen:"soporte", sheet:null, sop: Object.assign({}, st.sop, {err:{}})}))}
      ].map(o => Object.assign(o, {bg: o.urgent ? "var(--color-accent)" : "var(--color-card)", bd: o.urgent ? "var(--color-ring)" : "var(--color-border)", iconBg: o.urgent ? "var(--color-card)" : "var(--color-accent)"}))};
    const casos = {show: s.screen === "sos" && so.view === "casos", empty: cases.length === 0, toHub: () => this.sosSet({view:"hub"}),
      items: cases.map(c => {
        if (c.kind === "team") return {t: c.help || "Caso enviado al equipo SOS", sub:"Te escribiremos a " + (c.email || "tu correo") + ".", icon:"users",
          pill:"En revisión", pillBg:"var(--color-accent)", pillFg:"var(--color-foreground)", who:"Lo revisan personas", when:c.when,
          open: () => this.showToast("Nuestro equipo lo está revisando. Te escribirá en menos de 24 horas.")};
        if (c.kind === "borrado") return {t:"Borrado de tus datos", sub:"6 solicitudes enviadas en tu nombre.", icon:"eraser",
          pill:"En curso", pillBg:"var(--color-accent)", pillFg:"var(--color-foreground)", who:"Lo seguimos por ti", when:c.when, open: () => this.go("borrar")};
        const p = PZ_PLANES[c.plan] || PZ_PLANES.tarjeta, n = p.steps.filter((x, k) => (c.done || {})[k]).length, all = n === p.steps.length;
        return {t:p.t, sub:"Plan paso a paso · " + n + " de " + p.steps.length + " hechos", icon:p.icon,
          pill: all ? "Completado" : "En curso", pillBg: all ? "var(--green-100)" : "var(--color-accent)", pillFg: all ? "var(--green-800)" : "var(--color-foreground)",
          who:"Lo haces tú con una guía", when:c.when,
          open: () => this.setState({screen:"plan", sheet:null, pz:{view:"plan", plan:c.plan, done: c.done || {}, from:"casos"}})};
      })};

    // --- Avisos automáticos ---
    const dev = s.autoDev || "iphone";
    const auto = {on: !!s.autoOn,
      back: () => this.setState({screen: s.autoFrom || "escaner", sheet:null}),
      devs: [["iphone", "iPhone"], ["android", "Android"]].map(d => ({t:d[1], on: dev === d[0] ? "true" : "false",
        bg: dev === d[0] ? "var(--color-card)" : "transparent", shadow: dev === d[0] ? "var(--shadow-xs)" : "none", pick: () => this.setState({autoDev:d[0]})})),
      steps: (dev === "iphone"
        ? ["Abre Ajustes.", "Entra en Mensajes. En las versiones recientes está dentro de Apps.", "Activa «Filtrar remitentes desconocidos».", "Los SMS de números que no tienes guardados irán a una lista aparte. No se borran."]
        : ["Abre la app Teléfono y toca los tres puntos de arriba.", "Entra en Ajustes y luego en «Identificador de llamadas y spam».", "Activa el filtro de llamadas de spam.", "En la app Mensajes, comprueba que la protección contra spam está activada."]
      ).map((t, k) => ({n:String(k + 1), t})),
      settings: () => this.showToast("Abriendo los ajustes del móvil."),
      toggleLabel: s.autoOn ? "Ya no los tengo activados" : "Ya lo he activado",
      toggle: () => { this.setState({autoOn: !s.autoOn}); this.showToast(s.autoOn ? "Anotado: avisos automáticos desactivados." : "Perfecto. Tu móvil apartará los SMS y llamadas sospechosas."); }
    };

    // --- Detalle de aviso ---
    const al = ALERTS.find(a => a.id === s.alSel) || ALERTS[0], ad = AL_DETAIL[al.id] || AL_DETAIL.a1;
    const role = this.famRole(), avDone = !!(s.alDone || {})[al.id];
    const av = {title:al.title, date:al.date, risk:ad.risk, what:ad.what, why:ad.why, cta:ad.cta, push: !!s.push,
      riskBg: ad.lvl === "danger" ? "var(--red-100)" : ad.lvl === "suspicious" ? "var(--yellow-100)" : "var(--green-100)",
      riskFg: ad.lvl === "danger" ? "var(--red-800)" : ad.lvl === "suspicious" ? "var(--yellow-800)" : "var(--green-800)",
      riskIcon: ad.lvl === "danger" ? "triangle-alert" : ad.lvl === "suspicious" ? "circle-alert" : "info",
      steps: ad.steps.map((t, k) => ({n:String(k + 1), t})),
      go: () => this.avisoGo(ad.to),
      back: () => this.setState({screen:"alertas", sheet:null}),
      doneOn: avDone ? "true" : "false", doneIcon: avDone ? "circle-check" : "circle", doneLabel: avDone ? "Hecho" : "Marcar como hecho",
      toggleDone: () => { this.setState({alDone: Object.assign({}, s.alDone, {[al.id]: !avDone})}); if (!avDone) this.showToast("Hecho. Lo quitamos de tus pendientes."); },
      hasFam: role === "admin" || role === "member",
      famLabel: role === "admin" ? "Avisar a mi familia" : "Pedir ayuda a Lucía",
      fam: () => role === "admin"
        ? this.setState(st => ({screen:"familia", sheet:null, fam: Object.assign({}, st.fam, {view:"hub", from:"home", sheet:{kind:"avisar", to:"all", obj:null, msg:null}})}))
        : this.setState(st => ({screen:"familia", sheet:null, fam: Object.assign({}, st.fam, {view:"hub", from:"home", sheet:{kind:"ayuda", step:"pick", obj:null, motive:null}})}))
    };

    // --- Borrar mis datos ---
    const stOf = id => (br.st || {})[id] || "pedido";
    const cnt = k => BR_SITES.filter(x => stOf(x.id) === k).length;
    const brVals = {isIntro: br.view !== "seguimiento", isSeg: br.view === "seguimiento", locked: !prem, canSend: prem,
      back: () => this.go("huella"), toPremium: () => this.go("paywall"),
      sites: BR_SITES.map((x, k) => ({name:x.name, what:x.what, line: k ? "1px solid var(--color-border)" : "0"})),
      authChecked: br.auth ? "true" : "false", authBd: br.err ? "var(--color-destructive)" : check(br.auth).bd, authBg: check(br.auth).bg, authIcon: check(br.auth).icon,
      err: !!br.err, toggleAuth: () => this.brSet({auth: !br.auth, err:false}), send: () => this.brSend(),
      segIntro: "Pedido el " + (br.sentOn === "hoy" ? "28 de octubre" : (br.sentOn || "6 oct").replace("oct", "de octubre")) + " en 6 sitios. Te avisamos con cada respuesta.",
      counts: ["borrado", "pedido", "vuelto", "rechazado"].filter(k => cnt(k) > 0).map(k => ({t: cnt(k) + " " + BR_ST[k].label.toLowerCase(), bg:BR_ST[k].bg, fg:BR_ST[k].fg})),
      rows: BR_SITES.map(x => { const k = stOf(x.id), d = BR_ST[k];
        return {name:x.name, label:d.label, bg:d.bg, fg:d.fg,
          note: k === "pedido" && br.sentOn === "hoy" ? "Esperando respuesta. Tienen hasta el 28 de noviembre." : d.note,
          isVuelto: k === "vuelto", isRechazado: k === "rechazado",
          again: () => { this.brSet({st: Object.assign({}, br.st, {[x.id]:"pedido"})}); this.showToast("Lo hemos vuelto a pedir a " + x.name + "."); },
          howOpen: !!br.howOpen, howExpanded: br.howOpen ? "true" : "false", howIcon: br.howOpen ? "chevron-up" : "chevron-down",
          toggleHow: () => this.brSet({howOpen: !br.howOpen})}; })};

    return {
      isAprende: s.screen === "aprende", isPlan: s.screen === "plan", isAuto: s.screen === "auto", isAviso: s.screen === "aviso", isBorrar: s.screen === "borrar",
      ap: apVals, pz: pzVals, sosHub, casos, auto, av, br: brVals,
      call017: () => this.showToast("Llamando al 017. Es gratuito y confidencial."),
      autoCard: {label:"Aparta SMS y llamadas sospechosas", soon:true, open: () => this.prontoOpen("Los avisos automáticos de SMS y llamadas")},
      brCard: {open: () => this.prontoOpen("Pedir que borren tus datos"), tag:"Próximamente"},
      anPlan: () => this.pzOpen(null, "analizador")
    };
  }

  // ===== Desplegables (sustituyen al drawer de opciones) =====
  ddList(t){ return t === "sos" ? SOS_HELP : t === "sop" ? SOP_ASUNTOS : t === "prdel" ? PR_DEL : t === "prsec" ? PR_SEC.map(x => x[1]) : t === "prfb" ? PR_FB.map(x => x[0]) : []; }
  ddCur(t){ const s = this.state; return t === "sos" ? s.sos.help : t === "sop" ? s.sop.asunto : t === "prdel" ? s.pr.del.reason
    : t === "prsec" ? ((PR_SEC.find(x => x[0] === s.pr.sec) || [])[1] || "") : t === "prfb" ? ((s.pr.fb || {}).topic || "") : ""; }
  ddOpen(t, e, title){
    if (this.state.dd && this.state.dd.target === t) return this.ddClose();
    const btn = e && e.currentTarget, ph = btn && btn.closest && btn.closest(".tp-phone");
    if (!btn || !ph) return;
    const P = ph.getBoundingClientRect(), z = (P.width / ph.offsetWidth) || 1, r = btn.getBoundingClientRect();
    const below0 = (r.bottom - P.top) / z, above0 = (r.top - P.top) / z, left = (r.left - P.left) / z, width = r.width / z;
    const h = this.ddList(t).length * 46 + 8, room = ph.offsetHeight - 96 - below0 - 8, roomUp = above0 - 56;
    const up = room < Math.min(h, 240) && roomUp > room, maxH = Math.max(140, Math.min(h, up ? roomUp : room));
    this._ddTrigger = btn;
    this.setState({dd:{target:t, title: title || "", left: left + "px", width: width + "px", maxH: maxH + "px",
      top: (up ? above0 - 6 - Math.min(h, maxH) : below0 + 6) + "px"}});
    setTimeout(() => { const o = document.querySelector('[data-dd] [aria-selected="true"]') || document.querySelector('[data-dd] [role="option"]'); if (o) o.focus(); }, 30);
  }
  ddClose(){ this.setState({dd:null}); const tr = this._ddTrigger; if (tr) setTimeout(() => { try { tr.focus(); } catch (er) {} }, 0); }
  ddKey(e){
    const opts = [].slice.call(document.querySelectorAll('[data-dd] [role="option"]')), i = opts.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (opts[i + 1] || opts[0]).focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (opts[i - 1] || opts[opts.length - 1]).focus(); }
    else if (e.key === "Home") { e.preventDefault(); if (opts[0]) opts[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); if (opts.length) opts[opts.length - 1].focus(); }
    else if (e.key === "Tab") this.ddClose();
  }
  ddPick(t, label){
    const close = {dd:null};
    if (t === "prfb") this.setState(st => Object.assign(close, {pr: Object.assign({}, st.pr, {fb: Object.assign({}, st.pr.fb, {topic:label, err: Object.assign({}, (st.pr.fb || {}).err, {topic:false})})})}));
    else if (t === "prsec") { this.setState(close);
      if (label === PR_SEC[1][1]) this.prGo("fa", Object.assign(this.prSecReset(), {fa:{step:"intro", code:"", err:null, n:0}}));
      else this.setState(st => ({pr: Object.assign({}, st.pr, this.prSecReset(), {sec: label === PR_SEC[0][1] ? "pass" : "borrar"})})); }
    else if (t === "prdel") this.setState(st => Object.assign(close, {pr: Object.assign({}, st.pr, {del:{reason:label, other: st.pr.del.other || "", err:{}}})}));
    else if (t === "sos") this.setState(st => Object.assign(close, {sos: Object.assign({}, st.sos, {help:label, err: Object.assign({}, st.sos.err, {help:false})})}));
    else this.setState(st => Object.assign(close, {sop: Object.assign({}, st.sop, {asunto:label, err: Object.assign({}, st.sop.err, {asunto:false})})}));
    const tr = this._ddTrigger; if (tr) setTimeout(() => { try { tr.focus(); } catch (er) {} }, 0);
  }
  ddVals(){
    const d = this.state.dd, exp = {};
    ["sos", "sop", "prdel", "prsec", "prfb"].forEach(k => { exp[k] = d && d.target === k ? "true" : "false"; });
    if (!d) return {open:false, exp, opts:[], top:"0", left:"0", width:"0", maxH:"0", title:"", close: () => {}, key: () => {}};
    const cur = this.ddCur(d.target);
    return {open:true, exp, title:d.title, top:d.top, left:d.left, width:d.width, maxH:d.maxH, close: () => this.ddClose(), key: e => this.ddKey(e),
      opts: this.ddList(d.target).map(label => ({label, sel: label === cur ? "true" : "false", isSel: label === cur,
        bg: label === cur ? "var(--color-accent)" : "transparent", pick: () => this.ddPick(d.target, label)}))};
  }

  // ===== Funciones que aún no están en vigor =====
  prontoOpen(what){ this.setState(s => ({screen:"pronto", sheet:null, dd:null, prontoWhat: what, prontoFrom: s.screen})); }
  prontoVals(){ const s = this.state;
    return {show: s.screen === "pronto", title:"Próximamente", what: s.prontoWhat || "Esta función",
      back: () => this.setState({screen: s.prontoFrom || "home", sheet:null})}; }

  // ===== Compartir (hoja del sistema simulada) =====
  shrOpen(title){ this._shrTrigger = document.activeElement; this.setState({shr:{title}}); setTimeout(() => { const b = document.querySelector("[data-share] button"); if (b) b.focus(); }, 40); }
  shrClose(msg){ this.setState({shr:null}); if (msg) this.showToast(msg); const tr = this._shrTrigger; if (tr) setTimeout(() => { try { tr.focus(); } catch (er) {} }, 0); }
  shrVals(){
    const s = this.state.shr;
    if (!s) return {open:false, title:"", close: () => {}, contacts:[], apps:[], acts:[]};
    return {open:true, title:s.title, close: () => this.shrClose(),
      contacts: [["M", "Mamá"], ["L", "Lucía"], ["MR", "Marcos"], ["AP", "Abuelo Pep"]].map(c => ({ini:c[0], name:c[1], aria:"Enviar a " + c[1] + " por WhatsApp",
        pick: () => this.shrClose("Enviada a " + c[1] + " por WhatsApp.")})),
      apps: [["Mensajes", "message-square", "var(--green-600)"], ["Correo", "mail", "var(--blue-600)"], ["WhatsApp", "message-circle", "var(--green-700)"], ["Más", "ellipsis", "var(--neutral-200)"]]
        .map(a => ({t:a[0], icon:a[1], bg:a[2], fg: a[0] === "Más" ? "var(--neutral-800)" : "#FFFFFF",
          pick: () => a[0] === "Más" ? this.showToast("Más apps para compartir.") : this.shrClose("Abriendo " + a[0] + " con la alerta.")})),
      acts: [["Copiar enlace", "copy"], ["Añadir a notas", "notebook-pen"], ["Abrir en el navegador", "globe"]]
        .map(x => ({t:x[0], icon:x[1], pick: () => this.shrClose(x[0] === "Copiar enlace" ? "Enlace copiado." : x[0] === "Añadir a notas" ? "Añadida a notas." : "Abriendo en el navegador.")}))};
  }

  // ===== Lab: catálogo de flujos que mueve el prototipo en el mismo componente =====
  labSet(p){ this.setState(st => ({lab: Object.assign({}, st.lab, p)})); }
  labApply(id, caso, plan){
    if (id && /^A\d/.test(id)) return this.appApplyFlow(id, caso || "", plan || this.state.lab.plan);
    this.famApplyFlow(id || "INICIO", caso || "");
  }
  labGo(cur, caso){
    this.setState(st => ({lab: Object.assign({}, st.lab, {cur, caso: caso || "", run: st.lab.run + 1})}));
    this.labApply(cur, caso);
  }
  labPlan(x){
    // Cambia el plan del móvil al momento, sin moverlo de la pantalla en la que está
    this.labSet({plan:x});
    const k = this.scenKey(), want = x === "premium", isPrem = ((SCEN[k] || {}).plan === "premium");
    if (want === isPrem) return;
    const map = {"free-recien":"prem-sinresolver", "free-limpio":"prem-aldia", "free-aldia":"prem-aldia", "free-dormido":"prem-dormido", "free-tope":"prem-aldia", "free-critico":"prem-sinresolver",
      "prem-sinresolver":"free-aldia", "prem-amitad":"free-aldia", "prem-aldia":"free-aldia", "prem-dormido":"free-dormido"};
    this.setState({scen: map[k] || (want ? "prem-aldia" : "free-aldia"), world:null});
    this.showToast(want ? "Ahora ves la app como usuario Premium." : "Ahora ves la app como usuario del plan gratuito.");
  }
  labWhip(){
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const ctx = this._ac || (this._ac = new C()); if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime, len = 0.5, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // silbido del látigo
      const a = ctx.createBufferSource(); a.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(350, now); bp.frequency.exponentialRampToValueAtTime(3200, now + 0.26);
      const ga = ctx.createGain(); ga.gain.setValueAtTime(0.0001, now); ga.gain.exponentialRampToValueAtTime(0.4, now + 0.22); ga.gain.exponentialRampToValueAtTime(0.0001, now + 0.29);
      a.connect(bp); bp.connect(ga); ga.connect(ctx.destination); a.start(now); a.stop(now + len);
      // chasquido
      const b = ctx.createBufferSource(); b.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1600;
      const gb = ctx.createGain(), t = now + 0.28;
      gb.gain.setValueAtTime(0.0001, now); gb.gain.setValueAtTime(0.0001, t); gb.gain.linearRampToValueAtTime(1, t + 0.003); gb.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      b.connect(hp); hp.connect(gb); gb.connect(ctx.destination); b.start(now); b.stop(now + len);
    } catch (e) {}
  }
  labSoon(view){
    if (view === "whip") { this.labWhip(); this.setState(st => ({lab: Object.assign({}, st.lab, {soonOpen:true, soonView:"whipped", whips: (st.lab.whips || 0) + 1})})); }
    else this.labSet({soonOpen: view !== "close", soonView: view === "close" ? this.state.lab.soonView : view});
    setTimeout(() => { const b = document.querySelector("[data-lab-modal] button"); if (b && view !== "close") b.focus(); }, 40);
  }
  labOpen(id, caso){
    const f = LAB_ALL_FLOWS.find(x => x.id === id), soon = f && LAB_SOON_OF(f);
    if (f && !this.state.lab.q) this.labSet({sec: LAB_SEC_OF(f)});
    this.labSet({soonOpen: !!soon, soonView: soon === "whip" ? "ask" : "lex"});
    if (soon) setTimeout(() => { const b = document.querySelector("[data-lab-modal] button"); if (b) b.focus(); }, 60);
    this.labGo(id, caso);
    setTimeout(() => { const m = document.querySelector("main.lab-col"); if (m) m.scrollTop = 0; }, 0);
  }
  labVals(){
    const s = this.state.lab;
    const q = (s.q || "").trim().toLowerCase(), searching = q.length > 0;
    const GROUPS = LAB_ALL_GROUPS, FLOWS = LAB_ALL_FLOWS;
    const groupOf = id => GROUPS.find(g => g.id === id) || {t:""};
    const PLAN_TAG = {free:"Free", premium:"Premium"};
    const isApp = f => LAB_SEC_OF(f) === "app";
    const SEC_NAME = {app:"App", fam:"Mi Familia", soon:"Próximamente"};
    const match = f => (searching || LAB_SEC_OF(f) === s.sec) &&
      (LAB_SEC_OF(f) !== "fam" || searching || s.rol === "Todos" || f.rol === s.rol || f.rol === "Todos los roles") &&
      (!q || (f.id + " " + f.t + " " + f.d + " " + f.rol + " " + f.inicio + " " + groupOf(f.g).t).toLowerCase().indexOf(q) >= 0);
    const groups = GROUPS.filter(g => searching || g.sec === s.sec).map(g => { const items = FLOWS.filter(f => f.g === g.id && match(f));
      return {t: (searching ? SEC_NAME[g.sec] + " · " : "") + g.t, n:String(items.length),
        items: items.map(f => ({id:f.id, t:f.t, isNew: f.estado === "Nuevo" && !LAB_SOON_OF(f), isSoon: !!LAB_SOON_OF(f), cur: s.cur === f.id ? "true" : "false", open: () => this.labOpen(f.id),
          hasPlan: !!PLAN_TAG[f.plan] && !LAB_SOON_OF(f), planTag: PLAN_TAG[f.plan] || "", nCasos: String(f.casos.length)}))}; })
      .filter(g => g.items.length);
    const LIVE = FLOWS.filter(f => !LAB_SOON_OF(f));
    const runnable = LIVE.reduce((n, f) => n + f.casos.filter(c => c.caso).length, 0);
    const obs = LIVE.reduce((n, f) => n + f.casos.filter(c => !c.caso).length, 0);
    const f = s.cur ? FLOWS.find(x => x.id === s.cur) : null;
    const idx = f ? FLOWS.indexOf(f) : -1;
    const cls = e => e === "Nuevo" ? "lab-chip-new" : e === "Rediseñado" ? "lab-chip-re" : e === "Próximamente" ? "lab-chip-soon" : "lab-chip-ex";
    const fSoon = f ? LAB_SOON_OF(f) : null;
    const sameSec = f ? FLOWS.filter(x => LAB_SEC_OF(x) === LAB_SEC_OF(f)) : [];
    const sIdx = f ? sameSec.indexOf(f) : -1;
    const roles = ["Todos", "Basic", "Quien gestiona", "Invitada", "Miembro"];
    const nApp = FLOWS.filter(isApp).length, nSoon = FLOWS.filter(x => LAB_SEC_OF(x) === "soon").length, nFam = FLOWS.length - nApp - nSoon;
    const worldPlan = this.world().plan === "premium" ? "premium" : "free";
    const fixed = f && isApp(f) && f.plan !== "both" && f.plan !== "none";
    const planNow = fSoon ? "Próximamente" : f && isApp(f) ? (f.plan === "none" ? "Sin cuenta" : worldPlan === "premium" ? "Premium" : "Freemium") : (f ? f.rol : "Quien gestiona");
    const whips = s.whips || 0;
    const REACT = ["¡Chas! Lex ha escrito tres líneas de código del susto.", "¡Chas! Lex ha pedido un café doble y un abogado laboral.",
      "¡Chas! Recursos Humanos ha abierto un expediente. A ti, no a Lex.", "¡Chas! Lex ya teclea a 140 pulsaciones por minuto. Dale un respiro.",
      "¡Chas! Lex ha movido la tarea a «Terminado». No te lo creas todavía."];
    const sv = s.soonView || "ask";
    const MODAL = {
      ask: {pill:"Novedad · próximamente", img:"/assets/current/acd48590e991cc6c7e6049cbd50a6efe.png", title:"¿Quieres darle latigazos a Lex para que vaya más rápido?",
        body:"Esta novedad todavía no está en vigor. Lex jura que «está casi». Tú decides cómo motivarle.",
        primaryLabel:"Sí", primary: () => this.labSoon("whip"), hasSecondary:true, secondaryLabel:"No", secondary: () => this.labSoon("no")},
      whipped: {pill:"Latigazos de hoy: " + whips, img:"/assets/current/acd48590e991cc6c7e6049cbd50a6efe.png", title: REACT[Math.min(whips, REACT.length) - 1] || REACT[0],
        body:"Lex agradece la motivación. Su espalda, bastante menos.",
        primaryLabel:"Otro latigazo", primary: () => this.labSoon("whip"), hasSecondary:true, secondaryLabel:"Vale, ya paro", secondary: () => this.labSoon("close")},
      no: {pill:"Novedad · próximamente", img:"/assets/current/05b1958df85a5fa95c4d617a6c7ea180.png", title:"Qué compasivo.",
        body:"Lex te dedicará el próximo commit. Mientras, el resto del prototipo funciona.",
        primaryLabel:"Cerrar", primary: () => this.labSoon("close"), hasSecondary:false, secondaryLabel:"", secondary: () => {}},
      lex: {pill:"Próximamente", img:"/assets/current/05b1958df85a5fa95c4d617a6c7ea180.png", title:"Lex está trabajando en esto; no seas impaciente…",
        body:"Está entre el segundo café y el tercer «esto lo dejo listo hoy». Mientras tanto, el resto del prototipo funciona.",
        primaryLabel:"Vale, esperaré", primary: () => this.labSoon("close"), hasSecondary:true, secondaryLabel:"Meterle prisa", secondary: () => this.labSoon("ask")}
    }[sv] || {};
    const chip = on => ({bg: on ? "#4900AC" : "#FFFFFF", fg: on ? "#FFFFFF" : "#16121F", bd: on ? "#4900AC" : "#E3DFEC"});
    const row = fl => { const e = LAB_SOON_OF(fl) ? "Próximamente" : fl.estado;
      return {id:fl.id, t:fl.t, rol:fl.rol, inicio:fl.inicio, casos:String(fl.casos.length), estado:e, cls: cls(e), open: () => this.labOpen(fl.id)}; };
    return {
      nav: {count: FLOWS.length + " flujos · " + GROUPS.length + " grupos", q: s.q, setQ: e => this.labSet({q: e.target.value}),
        secs: [["app", "App", nApp], ["fam", "Mi Familia", nFam], ["soon", "Próximamente", nSoon]].map(x => { const on = s.sec === x[0] && !searching;
          return {t:x[1], n:String(x[2]), on: on ? "true" : "false", bg: on ? "#FFFFFF" : "transparent", shadow: on ? "0 1px 2px rgba(22,18,31,.12)" : "none",
            fg: on ? "#4900AC" : "#4B4658", pick: () => this.labSet({sec:x[0], q:""})}; }),
        isApp: s.sec === "app" && !searching, isFam: s.sec === "fam" && !searching,
        plans: [["free", "Freemium", "shield"], ["premium", "Premium", "crown"]].map(x => { const on = worldPlan === x[0];
          return {t:x[1], icon:x[2], on: on ? "true" : "false", bg: on ? "#FFFFFF" : "transparent", bd: on ? "#BEADFF" : "transparent", fg: on ? "#4900AC" : "#4B4658",
            pick: () => this.labPlan(x[0])}; }),
        planNote: fixed ? "Este flujo está pensado para " + (f.plan === "premium" ? "Premium" : "el plan gratuito") + ". Si lo cambias, verás lo que ve el otro plan."
          : "Cambia el plan del móvil al momento, en la pantalla en la que estés.",
        roles: roles.map(r => Object.assign({t:r, on: s.rol === r ? "true" : "false", pick: () => this.labSet({rol:r})}, chip(s.rol === r))),
        groups, empty: groups.length === 0},
      goHome: () => this.labGo(null, ""),
      isHome: !f, hasFlow: !!f,
      crumb: f ? SEC_NAME[LAB_SEC_OF(f)] + " · " + groupOf(f.g).t + " · " + f.id : "Portada",
      prev: () => this.labOpen(sameSec[(sIdx - 1 + sameSec.length) % sameSec.length].id),
      next: () => this.labOpen(sameSec[(sIdx + 1) % sameSec.length].id),
      soon: {on: !!fSoon, blur: fSoon ? "blur(6px)" : "none", pe: fSoon ? "none" : "auto", hidden: fSoon ? "true" : "false",
        modal: !!fSoon && !!s.soonOpen, reopen: () => this.labSoon(fSoon === "whip" ? "ask" : "lex"), close: () => this.labSoon("close"),
        bannerLabel: fSoon === "whip" ? "Novedad próximamente · Lex está en ello" : "Próximamente · Lex está en ello",
        anim: sv === "whipped" ? (whips % 2 ? "lab-shake-a" : "lab-shake-b") : "",
        pill: MODAL.pill, img: MODAL.img, title: MODAL.title, body: MODAL.body, primaryLabel: MODAL.primaryLabel, primary: MODAL.primary,
        hasSecondary: !!MODAL.hasSecondary, secondaryLabel: MODAL.secondaryLabel, secondary: MODAL.secondary},
      restart: () => this.labGo(s.cur, ""),
      home: {
        stats: [[LIVE.length, "flujos disponibles"], [nSoon, "próximamente"], [runnable, "casos ejecutables"], [obs, "casos de observación"]].map((x, k) => ({n:String(x[0]), t:x[1], line: k ? "1px solid #E3DFEC" : "0"})),
        how: [["1", "Elige un flujo", "El móvil arranca en ese punto, con su plan, su rol y sus datos."], ["2", "Lee el trabajo por hacer", "Cuándo pasa, qué quiere la persona y para qué."],
              ["3", "Sigue el recorrido", "Los pasos numerados dicen qué tocar en el móvil."], ["4", "Prueba un caso extremo", "Los casos ejecutables preparan el móvil en ese estado."]].map(h => ({n:h[0], t:h[1], d:h[2]})),
        starts: [["A11", "El resultado dice qué hacer, no solo «peligro»."], ["A38", "Compartir una alerta con quien la necesita, en dos toques."], ["F06", "Mi Familia: responder a Mamá sin decir «es seguro» ante un peligro."]]
          .map(x => { const fl = FLOWS.find(y => y.id === x[0]); return {id:fl.id, g: SEC_NAME[LAB_SEC_OF(fl)] + " · " + groupOf(fl.g).t, t:fl.t, why:x[1], open: () => this.labOpen(fl.id)}; }),
        covSecs: ["app", "fam", "soon"].map(k => { const list = FLOWS.filter(x => LAB_SEC_OF(x) === k); return {t: SEC_NAME[k] + " · " + list.length + " flujos", rows: list.map(row)}; })
      },
      fl: f ? {id:f.id, group: groupOf(f.g).t, estado: fSoon ? "Próximamente" : f.estado, cls: cls(fSoon ? "Próximamente" : f.estado), t:f.t, d:f.d, rol:f.rol, rolLabel: LAB_SEC_OF(f) === "fam" ? "Rol" : "Plan", inicio:f.inicio, nCasos: String(f.casos.length),
        j0: f.jtbd[0].replace(/^cuando\s+/i, ""), j1: f.jtbd[1].replace(/^quiero\s+/i, ""), j2: f.jtbd[2].replace(/^para\s+/i, ""), esc: f.esc.map(x => ({k:x[0], v:x[1]})), mirar:f.mirar, valor:f.valor, ids: f.ids.map(t => ({t})),
        pasos: f.pasos.map((t, k) => ({n:String(k + 1), t})),
        hasCasos: f.casos.length > 0, noCasos: f.casos.length === 0,
        casosSum: f.casos.filter(c => c.caso).length + " ejecutable" + (f.casos.filter(c => c.caso).length === 1 ? "" : "s") + " · " + f.casos.filter(c => !c.caso).length + " de observación",
        casos: f.casos.map(c => { const active = !!c.caso && s.caso === c.caso;
          return {code:c.c, t:c.t, d:c.d, tipo:c.tipo, run: !!c.caso, active: active ? "true" : "false",
            bd: active ? "#4900AC" : "#E3DFEC", bg: active ? "#F2EFFF" : "#FFFFFF",
            tagBg: c.caso ? "#E9F7EE" : "#F4F2F8", tagFg: c.caso ? "#15803D" : "#4B4658",
            btn: active ? "Volver al flujo normal" : "Probar en el móvil", icon: active ? "rotate-ccw" : "play",
            go: () => this.labGo(s.cur, active ? "" : c.caso)}; })} : {},
      pv: {rol: planNow,
        status: f ? (s.caso ? "Caso " + (f.casos.find(c => c.caso === s.caso) || {}).c + " · " + f.id : "Inicio del flujo " + f.id) : "Estado inicial del prototipo"}
    };
  }

  renderVals(){
    const s = this.state;
    const w = this.world();
    const prem = w.plan === "premium";
    const p = this.parts(w);
    const score = this.scoreOf(w);
    const level = this.levelOf(score);
    const ringColor = level === "green" ? "var(--color-positive)" : level === "amber" ? AMBER : "var(--color-destructive)";
    const pending = this.pending(w);
    const nOpen = pending.filter(x => x.kind === "step" || x.kind === "base" || x.kind === "vig").length;

    let title, subtitle;
    if (level === "green") {
      title = pending.length === 0 ? "Todo al día" : "Todo en orden";
      subtitle = w.checked + (w.delta ? " · " + w.delta : "");
    } else if (level === "amber") {
      title = w.active === false ? "Tu protección ha bajado" : nOpen > 0 ? ("Tienes " + nOpen + (nOpen === 1 ? " cosa pendiente" : " cosas pendientes")) : "Te faltan " + pending.length + " cosas";
      subtitle = w.checked;
    } else {
      title = "Hay algo que necesita tu atención";
      subtitle = w.checked;
    }

    const nextUp = pending[0];
    const openAction = id => () => this.setState({screen:"pasos", actId:id, from:s.screen === "pasos" ? s.from : s.screen, sheet:null});

    const challengeOpen = nextUp
      ? (nextUp.kind === "act" ? this.goActivity(nextUp.def) : openAction(nextUp.def.id))
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
        open: isAct ? this.goActivity(it.def) : openAction(it.def.id)};
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

    const bcolor = (e, a) => e >= a ? "var(--color-positive)" : e / a >= 0.5 ? AMBER : "var(--color-destructive)";
    const blocks = [
      {label:"Tu cuenta", earned:p.baseE, avail:30,
       description:"Correo verificado, configuración terminada y verificación en dos pasos. No caduca nunca."},
      {label:"Lo que vigilamos por ti", earned:p.vigE, avail:p.vigA,
       description: prem ? "Miramos tu correo, tu nombre y tu segundo correo cada día." : "Con el plan gratuito esto no cuenta en tu protección. Los slots siguen visibles con su valor.",
       note:"Teléfono y DNI llegan pronto: hasta entonces no cuentan ni te restan.", hasNote:true},
      {label: p.recE >= p.recA && prem ? "Lo que has resuelto" : "Lo que tienes pendiente", earned:p.recE, avail:p.recA,
       description: prem ? "Cada paso que cierras vale 4 puntos, hasta 5 pasos. Lo hecho no se deshace." : "Los pasos para cerrar una filtración llegan con Premium."},
      {label:"Tu día a día", earned:p.actE, avail:p.actA,
       description:"Avisos, escáner y MarIA. Es lo único que caduca, y como mucho son " + p.actA + " puntos."}
    ].filter(b => b.avail > 0).map(b => ({label:b.label, ratio: b.earned + " de " + b.avail,
      frac: (b.earned / b.avail).toFixed(3), color: bcolor(b.earned, b.avail),
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
      const unread = readIds.indexOf(a.id) < 0 && i < 2;
      const blocked = !prem && w.alertsLeft <= 0 && unread && !a.grave;
      return {title: blocked ? "Consejo bloqueado en el plan gratuito" : a.title,
        body: blocked ? "Es un consejo, no una filtración tuya. Con Premium lo lees entero." : a.body,
        date:a.date, unread: unread && !blocked,
        titleFont: (unread ? "700" : "500") + " 0.9375rem/1.25rem var(--font-sans)",
        icon: blocked ? "lock" : a.grave ? "triangle-alert" : "bell",
        tint: blocked ? "var(--color-accent)" : a.grave ? "var(--red-50)" : "var(--color-accent)",
        color: blocked ? "var(--color-foreground)" : a.grave ? "var(--color-destructive)" : "var(--color-foreground)",
        border: unread && !blocked ? "var(--color-ring)" : "var(--color-border)",
        open: blocked ? (() => this.go("paywall"))
          : (() => {
              if (!unread) return;
              const fresh = w.nuevo || (w.act.alerta !== undefined && w.act.alerta <= 30);
              this.setState(st => ({read: st.read.concat([a.id])}));
              if (!fresh) this.complete("alerta");
            })};
    });

    const alertaFresh = w.nuevo || (w.act.alerta !== undefined && w.act.alerta <= 30);
    const scanFresh2 = w.nuevo || (w.act.scan !== undefined && w.act.scan <= 30);

    const tabDef = [
      {id:"home", label:"Inicio", icon:"house", screens:["home","desglose","acciones","pasos","hitos","alertas","escaner","analizador","guia","soporte","alinfo","aprende","auto","aviso","pronto"]},
      {id:"sos", label:"SOS", icon:"shield-alert", screens:["sos","plan"]},
      {id:"huella", label:"Mi huella", icon:"fingerprint", screens:["huella","huflow","borrar"]},
      {id:"maria", label:"MarIA", icon:"message-circle-more", screens:["maria"]},
      {id:"perfil", label:"Perfil", icon:"circle-user", screens:["perfil","notificaciones","pfflow"]}
    ];
    const activeTab = s.screen === "pronto" ? (s.prontoFrom === "huella" ? "huella" : "home") : s.screen === "familia" ? (s.fam.from === "perfil" ? "perfil" : "home") : (tabDef.find(t => t.screens.indexOf(s.screen) >= 0) || tabDef[0]).id;

    const sheetKind = s.sheet ? s.sheet.kind : null;
    const optTarget = s.sheet && s.sheet.kind === "opts" ? s.sheet.target : null;
    const optList = optTarget === "sos" ? SOS_HELP : optTarget === "sop" ? SOP_ASUNTOS : optTarget === "prdel" ? PR_DEL : optTarget === "prsec" ? PR_SEC.map(x => x[1]) : optTarget === "prfb" ? PR_FB.map(x => x[0]) : [];
    const optCur = optTarget === "sos" ? s.sos.help : optTarget === "sop" ? s.sop.asunto : optTarget === "prdel" ? s.pr.del.reason : optTarget === "prsec" ? ((PR_SEC.find(x => x[0] === s.pr.sec) || [])[1] || "") : optTarget === "prfb" ? ((s.pr.fb || {}).topic || "") : "";
    const sheetBase = sheetKind === "opts"
      ? {visible:true, title: s.sheet.title || "", body:"", hasList:false, list:[], hasPrimary:false, primaryLabel:"", primary:() => {},
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
           {icon:"check", text:"Hasta 5 correos, tu nombre, 2 teléfonos y tu DNI"},
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
    const sheet = Object.assign({hasPick:false, pick:[], hasOpts:false, opts:[], titleAlign:"center", centered:false}, sheetBase,
      {hasBody: !!sheetBase.body, hasClose: !!sheetBase.closeLabel});
    Object.assign(sheet, {hasHandle: !sheet.centered, justify: sheet.centered ? "center" : "flex-end", outerPad: sheet.centered ? "16px" : "0",
      radius: sheet.centered ? "16px" : "24px 24px 44px 44px"});

    const so = s.sos, soErr = so.err || {};
    const sosBd = bad => bad ? "var(--color-destructive)" : "var(--color-input)";
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
          back: () => a.view === "detail" ? set({view:"list"}) : this.go("home"),
          q: a.q, type: e => set({q: e.target.value, applied: e.target.value === "" ? "" : a.applied}),
          submit: e => { if (e && e.preventDefault) e.preventDefault(); set({applied: a.q}); },
          tabs: [["todos","Todos"],["favoritos","Favoritos"]].map(([k, l]) => ({label:l, selected: a.tab === k ? "true" : "false",
            bg: a.tab === k ? "var(--color-primary)" : "var(--color-card)", fg: a.tab === k ? "var(--color-on-fill)" : "var(--color-foreground)",
            bd: a.tab === k ? "var(--color-primary)" : "var(--color-input)", pick: () => set({tab:k})})),
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
          share: () => this.shrOpen(cur.title),
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
        const bd = bad => bad ? "var(--color-destructive)" : "var(--color-input)";
        const set = patch => this.setState(st => ({sop: Object.assign({}, st.sop, patch)}));
        return {
          asuntoLabel: o.asunto || "Selecciona un asunto", asuntoFg: o.asunto ? "var(--color-accent-foreground)" : "#737373",
          asuntoBd: bd(e.asunto), errAsunto: !!e.asunto,
          pickAsunto: e => this.ddOpen("sop", e, "¿Qué asunto quieres consultar?"),
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
          icon:"arrow-right", tone:"var(--color-foreground)", bd:"var(--color-border)", checked:"false", track:"", justify:""}, extra || {});
        const soon = (title, desc) => ({title, desc, isNav:false, isSoon:true, isSwitch:false, open:() => {}, icon:"", tone:"", bd:"", checked:"false", track:"", justify:""});
        const bio = this.bioOn();
        const cards = v === "hub" ? [
            nav("Editar perfil", "Modifica nombre, apellido, teléfono o avatar de forma rápida y segura.", () => { const fm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(pf.fecha || "");
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
          hasErr: !!pw.err[k], err: pw.err[k] || "", bd: pw.err[k] ? "var(--color-destructive)" : "var(--color-input)",
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
        const pwv = pw.b || "", score = PR_PW_RULES.filter(x => x[1](pwv)).length;
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
              bd: fe.topic ? "var(--color-destructive)" : "var(--color-input)", topicErr: !!fe.topic,
              pick: e => this.ddOpen("prfb", e, "¿Sobre qué nos quieres contar?"),
              has: !!d, title: d ? d[1] : "", desc: d ? d[2] : "",
              text: f.text || "", count: (f.text || "").length + "/500 caracteres",
              setText: e => set({fb: Object.assign({}, f, {text: e.target.value.slice(0, 500), err: Object.assign({}, fe, {text:false})})}),
              textErr: !!fe.text, textInvalid: fe.text ? "true" : "false",
              textFg: fe.text ? "var(--color-destructive)" : "var(--color-foreground)", textBd: fe.text ? "var(--color-destructive)" : "var(--color-input)"}; })(),
          limits: PR_LIMITS.map((l, k) => ({label:l[0], value:l[1], bd: k === PR_LIMITS.length - 1 ? "transparent" : "var(--color-border)"})), isFull: full, hasHeader: !full,
          fullImg: v === "deleted" ? "/assets/current/0620a0a5779cbdc9c44e9ed896f3f1e7.png" : "/assets/current/05b1958df85a5fa95c4d617a6c7ea180.png",
          fullTitle: v === "deleted" ? "¡Tu cuenta fue eliminada!" : "Danos unos instantes… estamos procesando tu petición.",
          hasFullBody: v === "deleted", fullBody: "Te llevamos a la pantalla de inicio.",
          isEditar: v === "editar", isSeg: v === "seguridad", isResult: v === "passok" || v === "opinionok" || (v === "fa" && fa.step === "success"),
          resImg: v === "opinionok" ? "/assets/current/619721be4cc5fb947792551dcdea155e.png" : "/assets/current/b5605bd4c41953496ccb94d247e88b9c.png", isZona: v === "zona",
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
          sec: {label: (PR_SEC.find(x => x[0] === r.sec) || [0, "Selecciona una opción"])[1], fg: r.sec ? "var(--color-foreground)" : "#737373", bd:"var(--color-input)",
            isPass: r.sec === "pass", isBorrar: r.sec === "borrar",
            pick: e => this.ddOpen("prsec", e, "¿Qué quieres gestionar?")},
          confirmOpen: v === "seguridad" && !!r.confirm, confirmClose: () => set({confirm:false}), confirmDelete: () => this.prDelete(),
          hasSingle: !!single && !full, singleLabel: single ? single.label : "", singleHasIcon: !!(single && single.icon), single: single ? single.run : () => {},
          singleBg: single && single.outline ? "var(--color-card)" : "var(--color-primary)", singleFg: single && single.outline ? "var(--color-foreground)" : "var(--color-on-fill)",
          singleBd: single && single.outline ? "var(--color-input)" : "var(--color-primary)",
          cal: {open: !!cal.open, expanded: cal.open ? "true" : "false", toggle: () => { set({cal: Object.assign({}, cal, {open: !cal.open})}); if (!cal.open) this.later(() => { const el = document.querySelector('[aria-label="Elegir fecha de nacimiento"]'); if (el) el.scrollIntoView({block:"nearest", behavior:"smooth"}); }, 60); },
            fieldLabel: ed2.fecha || "Selecciona tu fecha", fieldFg: ed2.fecha ? "var(--color-accent-foreground)" : "#737373",
            fieldBd: cal.open ? "var(--color-ring)" : "var(--color-input)",
            m: String(cal.m), y: String(cal.y),
            months: PR_MESES.map((l, k) => ({v: String(k), label: l.slice(0, 3)})),
            years: Array.from({length: 107}, (_, k) => ({v: String(maxY - k)})),
            setM: e => set({cal: Object.assign({}, cal, {m: +e.target.value})}), setY: e => set({cal: Object.assign({}, cal, {y: +e.target.value})}),
            prev: () => set({cal: Object.assign({}, cal, cal.m === 0 ? {m:11, y: cal.y - 1} : {m: cal.m - 1})}),
            next: () => { if (nextOff) return; set({cal: Object.assign({}, cal, cal.m === 11 ? {m:0, y: cal.y + 1} : {m: cal.m + 1})}); },
            nextOff: nextOff ? "true" : "false", nextOp: nextOff ? "0.35" : "1",
            dow: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map(l => ({l})), days: calDays},
          isEdad: v === "edad", isTemas: v === "temas", isConsultas: v === "consultas", isPlan: v === "plan" && (["admin", "member"].indexOf(this.famRole()) < 0 || (this.famRole() === "member" && !!this.state.fam.mem.ending)),
          cards,
          name: ((pf.nombre || "") + " " + (pf.apellido || "")).trim() || "Tu nombre",
          email: "micorreo@empresa.com", isPrem: prem,
          hasAvatar: !!(v === "editar" ? ed.avatar : pf.avatar), noAvatar: !(v === "editar" ? ed.avatar : pf.avatar),
          avatar: (v === "editar" ? ed.avatar : pf.avatar) || "/assets/current/d89746888da2d9510b64a9f031eaecd5.gif",
          initials: (String((v === "editar" ? ed.nombre : pf.nombre) || "E").charAt(0) + String((v === "editar" ? ed.apellido : pf.apellido) || "N").charAt(0)).toUpperCase(),
          ed: {nombre: ed.nombre || "", apellido: ed.apellido || "", tel: ed.tel || "", fecha: ed.fecha || "",
            setNombre: e => setEd({nombre: e.target.value}), setApellido: e => setEd({apellido: e.target.value}),
            setTel: e => set({ed: Object.assign({}, ed, {tel: e.target.value}), telErr:false}),
            telErr: !!r.telErr, telInvalid: r.telErr ? "true" : "false", telBd: r.telErr ? "var(--color-destructive)" : "var(--color-input)", telFg: r.telErr ? "var(--color-destructive)" : "var(--color-foreground)",
            avErr: !!r.avErr, avInvalid: r.avErr ? "true" : "false", avBd: r.avErr ? "var(--color-destructive)" : "var(--color-input)", avFg: r.avErr ? "var(--color-destructive)" : "var(--color-foreground)",
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
            bd: dErr.reason ? "var(--color-destructive)" : "var(--color-input)", hasErr: !!dErr.reason,
            isOtros: del.reason === "Otros", other: del.other || "", count: (del.other || "").length + "/500 caracteres",
            setOther: e => set({del: Object.assign({}, del, {other: e.target.value.slice(0, 500), err: Object.assign({}, dErr, {other:false})})}),
            otherErr: !!dErr.other, otherInvalid: dErr.other ? "true" : "false",
            otherFg: dErr.other ? "var(--color-destructive)" : "var(--color-foreground)", otherBd: dErr.other ? "var(--color-destructive)" : "var(--color-input)",
            pick: e => this.ddOpen("prdel", e, "¿Por qué quieres eliminar tu cuenta?")},
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
          ].map(pl => { const cur = r.plan === pl.id, sel = r.sel === pl.id, basic = pl.id === "basica";
            const head = cur ? "SUSCRIPCIÓN ACTUAL" : pl.best ? "MEJOR VALORADO · OPCIÓN MÁS ELEGIDA" : "";
            return {name:pl.name, price:pl.price || "", per:pl.per || "", monthly:pl.monthly || "", save:pl.save || "", hasSave: !!pl.save,
              isBasic: basic, isPaid: !basic, hasHead: !!head, head,
              headBg: cur ? "var(--color-secondary)" : "var(--color-primary)", headFg: cur ? "var(--color-foreground)" : "var(--color-on-fill)",
              bd: sel ? "var(--color-primary)" : "var(--color-border)",
              checked: sel ? "true" : "false", dot: sel ? "var(--color-primary)" : "transparent", dotBd: sel ? "var(--color-primary)" : "var(--color-ring)",
              open: sel, hasBonus: pl.id === "anual",
              canPay: sel && !basic && !cur, canCancel: sel && cur && !basic, canDowngrade: sel && basic && !cur,
              select: () => set({sel: pl.id}),
              pay: () => { set({plan: pl.id, sel: pl.id}); this.showToast(pl.id === "anual" ? "Pago completado. Ya tienes la protección anual." : "Pago completado. Ya tienes la protección mensual."); }}; }),
          feats: PR_FEATS.map(f => ({label:f[0], soon:f[1]})),
          bonus: PR_BONUS.map(b => ({icon:b[0], label:b[1]})),
          upgradeLabel: r.plan === "anual" ? "Pasarme a pago mensual" : "Pasarme a pago anual",
          toAnnual: () => set({sel: r.plan === "anual" ? "mensual" : "anual"}),
          cancelSub: () => this.setState({sheet:{kind:"pr-cancel"}}),
          hasFooter: !!footer,
          secondaryLabel: footer ? footer.secondaryLabel : "", secondary: footer ? footer.secondary : () => {},
          primaryLabel: footer ? footer.primaryLabel : "", primary: footer ? footer.primary : () => {},
          primaryBg: footer && footer.danger ? "#EF4444" : "var(--color-primary)",
          primaryOpacity: off ? "0.55" : "1", primaryCursor: off ? "not-allowed" : "pointer", primaryDisabled: off ? "true" : "false"
        };
      })(),
      isSos: s.screen === "sos",
      sos: {
        isAviso: so.view === "aviso", isForm: so.view === "form",
        back: () => so.view === "form" && !so.dontShow ? this.sosSet({view:"aviso", err:{}}) : this.go("home"),
        dontShowChecked: so.dontShow ? "true" : "false",
        dontShowIcon: so.dontShow ? "check" : "", dontShowBg: so.dontShow ? "var(--color-primary)" : "var(--color-card)",
        dontShowBd: so.dontShow ? "var(--color-primary)" : "var(--color-ring)",
        toggleDontShow: () => this.sosSet({dontShow: !so.dontShow}),
        continue: () => this.sosSet({view:"form"}),
        help: so.help, helpLabel: so.help || "Selecciona una opción",
        pickHelp: e => this.ddOpen("sos", e, "¿Con qué necesitas ayuda?"),
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
        send: () => this.sosSend()
      },
      isHome: s.screen === "home",
      isFamilia: s.screen === "familia", fam: this.famVals(), famHome: this.famHomeVals(), famPlan: this.famPlanVals(), lab: this.labVals(), ft: this.ftVals(), dd: this.ddVals(), pronto: this.prontoVals(), shr: this.shrVals(),
      
      famAn: (() => { const show = this.famRole() === "member" && s.screen === "analizador" && s.an.view === "result";
        let host = String(s.an.value || ""); try { host = new URL(/^https?:/.test(host) ? host : "https://" + host).hostname.replace(/^www\./, ""); } catch (e) {}
        const nudge = this.famRole() === "none" && s.screen === "analizador" && s.an.view === "result" && (s.an.verdict === "danger" || s.an.verdict === "suspicious");
        return {show, label:"Pedir ayuda a Lucía con esto", nudge, nudgeOpen: () => this.famOpen("home"),
          open: () => this.famSheet({kind:"ayuda", step:"form", obj:{kind:"link", t: host, v: s.an.verdict}, motive:null})}; })(),
      homeTitle: prem ? "BeValk Premium" : "BeValk",
      homeGroups: [{title:"Seguridad digital", hasTitle:true, titleMargin:"12px 0 0", cards:[
        {title:"Analizador de enlaces", body:"Webs, emails o mensajes analizados para decidir mejor", img:"/assets/current/884b6c89689c7abf963c0226d11273f9.png", isNew:false, open:() => this.anOpen("enlace")},
        {title:"Mi huella", body:"Te avisamos si tu email o tu nombre aparecen en filtraciones", img:"/assets/current/b1cef0bc1fa518596962685b084e28c5.png", isNew:true, open:() => this.go("huella")},
        {title:"Chat con MarIA", body:"Preguntas, dudas o sospechas aclaradas con criterio experto", img:"/assets/current/a1e93b2da05e5d16c7750a07e3daf956.png", isNew:false, open:() => this.go("maria")},
        {title:"Escáner de QRs", body:"Detectamos trampas ocultas tras cualquier código escaneado", img:"/assets/current/0c8ee5bd41fe0619ee1aa08b05ca324c.png", isNew:false, open:() => this.anOpen("qr")},
        {title:"Alertas", body:"Avisos en tiempo real ante fraudes activos recientes en tu entorno", img:"/assets/current/199ed66c1694aa3b0b85113292605ae3.png", isNew:false, open:() => this.setState(st => ({screen:"alinfo", sheet:null, al: Object.assign({}, st.al, {view:"list"})}))}]},
        {title:"Comunidad y recursos", hasTitle:true, titleMargin:"12px 0 0", cards:[
        {title:"¿Cómo se usa?", body:"Aprende a usar BeValk de la mejor manera posible", img:"/assets/current/5e27af880bafc3844b2a92b0e936936e.png", isNew:false, open:() => this.go("guia")}]},
        {title:"Asistencia y protección", hasTitle:true, titleMargin:"12px 0 0", cards:[
        {title:"Soporte técnico", body:"Si algo falla o no lo ves claro, lo revisamos contigo y te damos una solución", img:"/assets/current/0beb1826d93ed4cd84248c2e12b6e47e.png", isNew:false, open:() => this.setState(st => ({screen:"soporte", sheet:null, sop: Object.assign({}, st.sop, {err:{}})}))}]}
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
        const pv = a.pass || "", score = PR_PW_RULES.filter(x => x[1](pv)).length;
        const lv = [["Muy débil", "var(--color-destructive)"], ["Muy débil", "var(--color-destructive)"], ["Débil", "#B45309"], ["Media", "var(--color-foreground)"], ["Fuerte", "var(--color-positive)"], ["Muy fuerte", "var(--color-positive)"]][score];
        const code = (a.code || "").replace(/\D/g, "");
        const red = "var(--color-destructive)";
        return {
          isIntro: v === "intro", hasHeader: v !== "intro",
          heading: {login:"Iniciar sesión", signup:"Crear cuenta", l2fa:"2FA", lok:"2FA", onb:"Introducción"}[v] || "",
          back: () => this.auBack(),
          toLogin: () => this.auGo("login", {err:{}, tried:false}), toSignup: () => this.auGo("signup", {err:{}, tried:false}),
          hasTabs: isLogin || isSignup,
          tabs: [["login", "Iniciar sesión"], ["signup", "Crear cuenta"]].map(x => ({label:x[1], selected: v === x[0] ? "true" : "false",
            bg: v === x[0] ? "var(--color-card)" : "transparent", shadow: v === x[0] ? "var(--shadow-sm)" : "none",
            pick: () => this.auGo(x[0], {err:{}, tried:false, pass:""})})),
          isForm: isLogin || isSignup, isLogin, isSignup,
          email: a.email || "", setEmail: e => set({email: e.target.value, err: Object.assign({}, err, {email:null})}),
          hasEmailErr: !!err.email, emailErr: err.email || "", emailInvalid: err.email ? "true" : "false",
          emailFg: err.email ? red : "var(--color-foreground)", emailBd: err.email ? red : "var(--color-input)",
          pass: pv, setPass: e => set({pass: e.target.value, err: Object.assign({}, err, {pass:null})}),
          passType: a.show ? "text" : "password", passAc: isSignup ? "new-password" : "current-password",
          toggleShow: () => set({show: !a.show}), eye: a.show ? "eye-off" : "eye", eyeLabel: a.show ? "Ocultar contraseña" : "Mostrar contraseña", shown: a.show ? "true" : "false",
          hasPassErr: !!err.pass, passErr: err.pass || "", passInvalid: err.pass ? "true" : "false",
          passFg: err.pass ? red : "var(--color-foreground)", passBd: err.pass ? red : "var(--color-input)",
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
        const bars = st === "url" ? 1 : st === "maria" ? 2 : st === "qr" ? 3 : 0;
        const danger = o.verdict !== "safe", isQr = st === "qr";
        const prefs = ["zona", "edad", "temas"].indexOf(st) >= 0;
        const eyebrow = st === "url" ? (ph === "input" ? "PASO 1 DE 3" : "HERRAMIENTA 1 DE 3")
          : st === "maria" ? (o.asked !== null ? "HERRAMIENTA 2 DE 3" : "PASO 2 DE 3")
          : isQr ? (ph === "input" ? "PASO 3 DE 3" : "HERRAMIENTA 3 DE 3")
          : prefs ? "ÚLTIMO PASO · PERSONALIZA TUS ALERTAS" : st === "alerta" ? "VISTA PREVIA" : "";
        const radio = (list, cur, key) => list.map((l, k) => { const on = cur === l;
          return {label:l, checked: on ? "true" : "false", span: k === list.length - 1 ? "1 / -1" : "auto",
            bd: on ? "var(--color-foreground)" : "var(--color-border)", bg: on ? "var(--color-accent)" : "var(--color-card)",
            dotBd: on ? "var(--color-foreground)" : "var(--color-ring)", dot: on ? "var(--color-foreground)" : "transparent",
            pick: () => set({[key]: l, err:null})}; });
        const chat = OB_INTRO.map(x => ({isM:true, isU:false, text:x, segs: richSegs(x)}));
        if (o.asked !== null) { const q = OB_QS[o.asked];
          chat.push({isM:false, isU:true, text:q.q, segs:[]}, {isM:true, isU:false, text:q.a, segs: richSegs(q.a)}, {isM:true, isU:false, text:OB_FINAL, segs: richSegs(OB_FINAL)}); }
        return {
          hasBars: bars > 0, barsNow: String(bars), bars: [1, 2, 3].map(k => ({bg: k <= bars ? "var(--color-primary)" : "var(--color-secondary)"})),
          title: {intro:"Vamos a configurar tu protección", url:"Aprende a verificar enlaces sospechosos", maria:"Pregúntale a MarIA, se encargará de ayudarte",
            qr:"Verifica códigos QR antes de escanearlos", zona:"Configura tus alertas de seguridad", edad:"Configura tus alertas de seguridad",
            temas:"Configura tus alertas de seguridad", alerta:"Tu primera alerta de seguridad"}[st],
          hasEyebrow: !!eyebrow, eyebrow,
          isIntro: st === "intro",
          tools: [["/assets/current/884b6c89689c7abf963c0226d11273f9.png", "Analizador de enlaces"], ["/assets/current/a1e93b2da05e5d16c7750a07e3daf956.png", "Chat MarIA"],
            ["/assets/current/0c8ee5bd41fe0619ee1aa08b05ca324c.png", "Escáner de códigos QR"], ["/assets/current/199ed66c1694aa3b0b85113292605ae3.png", "Servicio de alertas"]].map(x => ({img:x[0], label:x[1]})),
          isUrlInput: st === "url" && ph === "input", url: o.url || "",
          setUrl: e => set({url: e.target.value, urlErr:null}), useExample: () => set({url:"http://delivery-es.com/correos/pay", urlErr:null}),
          hasUrlErr: !!o.urlErr, urlErr: o.urlErr || "", urlInvalid: o.urlErr ? "true" : "false",
          urlBd: o.urlErr ? "var(--color-destructive)" : "var(--color-input)",
          isScanning: (st === "url" || isQr) && ph === "scan", isResult: (st === "url" || isQr) && ph === "result",
          resImg: danger ? "/assets/current/328e596c0ba7108d333a750addd2fb72.png" : "/assets/current/71a545701346f1fefb0863719a2d6188.png",
          resTitle: danger ? "¡Atención! El enlace no es seguro" : "El enlace parece seguro",
          resColor: danger ? "var(--color-destructive)" : "var(--color-positive)", resScore: danger ? "85/100 [Peligro]" : "6/100 [Seguro]",
          resSection: danger ? "Riesgo detectado" : "Sin señales de riesgo",
          resBody: danger ? "Este enlace muestra señales de alto riesgo. Por tu seguridad," : "No hemos encontrado señales de fraude. Aun así,",
          resStrong: danger ? "te recomendamos no visitarlo." : "revisa siempre a quién das tus datos.",
          resWin: isQr ? "¡Perfecto! Ya sabes verificar códigos QR antes de escanearlos. Hazlo siempre en restaurantes, parkings o carteles."
            : "¡Bien hecho! Verificar antes de hacer clic te ha protegido. Ya sabes usar el verificador de enlaces.",
          isMaria: st === "maria", showAsk: o.asked === null, chat, hasQs: o.asked === null,
          qs: OB_QS.map((q, k) => ({label:q.q, ask: () => { set({asked:k}); this.obScrollEnd(); }})),
          isQrIntro: isQr && ph === "input",
          isZona: st === "zona", zonas: radio(OB_ZONAS, o.zona, "zona"), hasErr: !!o.err, err: o.err || "",
          isEdad: st === "edad", edades: radio(OB_EDADES, o.edad, "edad"),
          isTemas: st === "temas",
          temas: OB_TEMAS.map(x => { const on = !!o.temas[x.id];
            return {label:x.label, checked: on ? "true" : "false", icon: on ? "check" : "",
              bd: on ? "var(--color-foreground)" : "var(--color-border)", bg: on ? "var(--color-accent)" : "var(--color-card)",
              boxBd: on ? "var(--color-primary)" : "var(--color-ring)", boxBg: on ? "var(--color-primary)" : "var(--color-card)",
              toggle: () => set({temas: Object.assign({}, o.temas, {[x.id]: !on})})}; }),
          isAlerta: st === "alerta",
          hasCta: ph !== "scan",
          cta: st === "intro" ? "Empezar" : st === "url" ? (ph === "result" ? "Continuar" : "Verificar enlace") : st === "maria" ? "Continuar al escáner QR"
            : isQr ? (ph === "result" ? "Terminar y configurar alertas" : "Haz una prueba") : st === "alerta" ? "Configurar y terminar" : "Siguiente",
          next: () => this.obNext()
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
        return {
          heading: a.view === "details" ? "Detalles del análisis" : cfg.heading, icon: cfg.icon, placeholder: cfg.placeholder,
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
          welcomeImg: a.type === "qr" ? "/assets/current/0c8ee5bd41fe0619ee1aa08b05ca324c.png" : "/assets/current/6296a2ca187e3248513b812ceb8214a8.png",
          checkIcon: a.dontShow[a.type] ? "check" : "minus",
          checkBg: a.dontShow[a.type] ? "var(--color-primary)" : "var(--color-card)",
          checkBd: a.dontShow[a.type] ? "var(--color-primary)" : "var(--color-input)",
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
          isText: !!cfg.multiline, isLine: !cfg.multiline, showPlan: a.verdict === "danger" || a.verdict === "suspicious",
          attachShot: () => { this.anSet({value: cfg.shotValue || cfg.pasteValue}); this.showToast("Captura añadida. Hemos leído el texto de la imagen."); },
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
          analyzeBd: spent && !off ? "var(--color-input)" : "transparent",
          analyzeIcon: off ? "cloud-off" : spent ? "lock" : "search",
          analyzeHint: !canAnalyze && !spent && !off,
          analyzeCursor: off ? "not-allowed" : canAnalyze || spent ? "pointer" : "not-allowed",
          checksTitle: cfg.checksTitle, checks: cfg.checks.map(c => ({label:c})),
          vColor: v.color, vTint: v.tint, vIcon: v.icon,
          vScore: a.verdict === "unknown" ? "" : v.score + " [" + v.label + "]",
          vImg: a.verdict === "safe" ? "/assets/current/71a545701346f1fefb0863719a2d6188.png"
            : a.verdict === "suspicious" ? "/assets/current/7362d03758e44ef1bbc457825b131ba2.png"
            : a.verdict === "danger" ? "/assets/current/328e596c0ba7108d333a750addd2fb72.png" : "/assets/current/40923132ae353cc12dac77e8ccbf6973.png",
          vSection: a.verdict === "safe" ? "Contenido verificado" : a.verdict === "suspicious" ? "Contenido sospechoso"
            : a.verdict === "danger" ? "Contenido peligroso" : ({"enlace":"Enlace", "código":"Código", "correo":"Correo", "número":"Número", "IBAN":"IBAN", "mensaje":"Mensaje"}[cfg.noun] || "Contenido") + " no verificado",
          vBodyStrong: a.verdict === "safe" ? "No detectamos riesgos conocidos." : a.verdict === "danger" ? "Te recomendamos no " + cfg.accessVerb + "." : "",
          showQuota: !prem,
          vTitle: a.verdict === "safe" ? "El " + cfg.noun + " parece seguro"
            : a.verdict === "suspicious" ? "Mejor ve con cuidado"
            : a.verdict === "danger" ? "Atención: no es seguro" : "Procede con precaución",
          vBody: a.verdict === "safe" ? "El contenido analizado ha superado el análisis correctamente."
            : a.verdict === "suspicious" ? "Vemos cosas poco habituales. Si sabes de dónde viene, decide tú. Si no lo sabes, mejor no sigas."
            : a.verdict === "danger" ? "Vemos señales de alto riesgo."
            : "No hemos podido completar el análisis de este " + cfg.noun + ". Si conoces la fuente, puedes " + (a.type === "enlace" || a.type === "qr" ? "abrirlo" : cfg.accessVerb) + ". Si no, puedes reportarnos este " + cfg.noun + " y lo revisaremos personalmente.",
          accessLabel: cfg.accessLabel, accessIcon: cfg.accessIcon,
          safeMode: a.verdict === "safe" || a.verdict === "unknown", riskyMode: a.verdict === "danger" || a.verdict === "suspicious",
          safeLabel: "No " + cfg.accessVerb,
          riskyLabel: cfg.accessLabel + " de todas formas",
          safeBack: () => { this.anSet({view: cfg.camera ? "camera" : "main", value:""}); this.showToast("Hecho. No hemos abierto nada."); },
          access: () => (a.verdict === "safe" || a.verdict === "unknown")
            ? this.showToast("Abriendo. Cualquier cosa, vuelve y pregúntale a MarIA.")
            : this.setState({sheet:{kind:"access"}}),
          againLabel: cfg.againLabel,
          again: () => this.anSet({view: cfg.camera ? "camera" : "main", value:""}),
          goDetails: () => this.anSet({view:"details"}), hasDetails: a.verdict !== "unknown",
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
            dotBd: a.plan === p.key ? "var(--color-primary)" : "var(--color-input)",
            dotBg: a.plan === p.key ? "var(--color-primary)" : "var(--color-card)",
            select: () => this.anSet({plan: p.key})})),
          buy: () => { this.anSet({view:"main"}); this.go("paywall"); },
          back: () => this.anBack(),
          legendOpen: a.legend, openLegend: () => this.anSet({legend:true}), closeLegend: () => this.anSet({legend:false}),
          legend: AN_LEGEND.map(l => ({label:l.label, range:l.range, text:l.text, color: VERDICTS[l.key].color})),
          reportOpen: a.report, openReport: () => this.anSet({report:true, reportText:"", reportKind:"", reportErr:false}),
          closeReport: () => this.anSet({report:false, reportErr:false}),
          reportKinds: [
            {key:"fraude", label:"Confirmo que es un fraude", hint:"Me ha llegado y he visto que lo es"},
            {key:"falso", label:"Creo que os equivocáis", hint:"Lo conozco y es de fiar"}
          ].map(k => ({label:k.label, hint:k.hint,
            bd: a.reportKind === k.key ? "var(--color-ring)" : "var(--color-input)",
            dotBd: a.reportKind === k.key ? "var(--color-primary)" : "var(--color-input)",
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
          reportFg: a.reportErr ? "var(--color-destructive)" : "var(--color-foreground)", reportBd: a.reportErr ? "var(--color-destructive)" : "var(--color-input)",
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
      showTabs: ["subida","paywall","bienvenida","bloqueo","auth"].indexOf(s.screen) < 0 && !(s.screen === "perfil" && (s.pr.view === "deleting" || s.pr.view === "deleted")),

      score, shown: s.shown, ringColor,
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
      offline: this.off() && !(s.screen === "home" && s.offHidden),
      offlineCanClose: s.screen === "home",
      offlineClose: () => { this.setState({offHidden:true}); this.showToast("Aviso cerrado. Si algo necesita conexión, te lo diremos allí.", {label:"Deshacer", fn: () => this.setState({offHidden:false})}); },
      offlineNote: s.screen === "home"
        ? "Te enseñamos lo último que comprobamos, el " + w.checked.replace("Revisado ", "") + ". No podemos mirar nada nuevo hasta que vuelvas a tener red."
        : "No podemos comprobar nada nuevo hasta que vuelvas a tener red.",
      offlineRetry: () => { this.setState({offline:false, offHidden:false}); this.showToast("Ya hay conexión. Volvemos a mirar tus datos."); },
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
      subidaTitle: s.delta >= 8 ? "Buen salto" : s.delta >= 4 ? "Un paso menos" : "Sumado",
      subidaText: nextPending
        ? "Tu protección sube a " + score + ". Lo siguiente que más suma es " + nextPending.def.title.charAt(0).toLowerCase() + nextPending.def.title.slice(1) + "."
        : "No queda nada pendiente. Estás en " + score + " de 100, el máximo con tu plan.",
      subidaMilestone: streak.visible && s.delta > 0,
      hasNext: !!nextPending,
      nextLabel: nextPending ? "Siguiente: " + nextPending.pts + " puntos" : "",
      openNext: () => { if (!nextPending) { this.go("home"); return; }
        if (nextPending.kind === "act") this.go(nextPending.def.screen);
        else this.setState({screen:"pasos", actId:nextPending.def.id, from:"home", sheet:null}); },
      undo: () => this.undo(),

      weeks: weeksGrid, milestones,

      alerts,
      alertRule: prem
        ? "Con Premium recibes todos los avisos, sin límite."
        : "Los avisos de una filtración tuya te llegan siempre, aunque hayas gastado el límite. Lo que se limita son los consejos.",
      alertRuleIcon: prem ? "shield-check" : "shield-alert", alertPoints: !alertaFresh && (prem || w.alertsLeft > 0),
      alertQuota: prem ? "Todos tus avisos, sin límite." : "Te quedan " + Math.max(0, w.alertsLeft) + " de 4 avisos este mes.",
      quotaSpent: !prem && w.alertsLeft <= 0,

      scanPoints: !scanFresh2,
      scanPointsText: "Comprobar un enlace o un QR suma " + (prem ? 3 : 6) + " puntos a tu protección.",
      scanTypes: [
        {name:"Mensaje o captura", desc:"Pega un SMS, un WhatsApp o un correo entero", icon:"message-square-text", soon:true, open:() => this.prontoOpen("El análisis de mensajes completos")},
        {name:"Enlace", desc:"Webs, SMS y redes sociales", icon:"link", open:() => this.anOpen("enlace")},
        {name:"Correo", desc:"Remitentes y mensajes que no esperabas", icon:"mail", open:() => this.anOpen("correo")},
        {name:"Teléfono", desc:"Llamadas y SMS de números raros", icon:"phone", open:() => this.anOpen("telefono")},
        {name:"IBAN", desc:"Cuentas bancarias en facturas", icon:"landmark", open:() => this.anOpen("iban")}
      ].map(t => Object.assign({soon:false}, t)),
      doScan: () => this.anOpen("qr"),

      isPfFlow: s.screen === "pfflow",
      pf: this.pfVals(prem),
      referral: "QW29TBQQ",
      copyReferral: () => this.showToast("Código copiado. Compártelo y ganáis los dos un mes."),
      perfilAvatar: s.pf.avatar || "/assets/current/d89746888da2d9510b64a9f031eaecd5.gif",
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

      paywallRows: VIG.map(v => ({label: v.title, icon:"eye", color:"var(--color-foreground)", text:"var(--color-accent-foreground)"}))
        .concat([{label:"Los pasos para cerrar cada filtración", icon:"key-round", color:"var(--color-foreground)", text:"var(--color-accent-foreground)"},
                 {label:"Todos tus avisos, sin límite mensual", icon:"bell", color:"var(--color-foreground)", text:"var(--color-accent-foreground)"}]),
      activarPremium: () => {
        const nw = JSON.parse(JSON.stringify(this.world()));
        nw.plan = "premium"; nw.vig = {vemail:1, vname:1, vemail2:1}; nw.alertsLeft = 99;
        this.setState({world:nw, screen:"home", shown:0});
        this.animateTo(this.scoreOf(nw));
      },
      closePaywall: () => this.go("home"),
      goPaywall: () => this.go("paywall"),

      scenarioChips: Object.keys(SCEN).map(k => ({label: SCEN[k].label,
        bg: k === this.scenKey() ? "var(--color-secondary)" : "var(--color-card)",
        fg: k === this.scenKey() ? "var(--color-secondary-foreground)" : "var(--color-foreground)",
        select: () => this.setScen(k)})),

      tabs: tabDef.map(t => ({label:t.label, icon:t.icon,
        bg: t.id === activeTab ? "var(--color-accent)" : "transparent",
        fg: t.id === activeTab ? "var(--purple-700)" : "var(--purple-400)",
        current: t.id === activeTab ? "page" : "false",
        font: (t.id === activeTab ? "600" : "400") + " 0.8125rem/1rem var(--font-sans)",
        go: () => t.id === "sos" ? this.sosOpen() : t.id === "perfil" ? this.prGo("hub") : this.go(t.id)})),

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
      huWatchLabel: s.hu.items.length === 1 ? "Vigilando 1 dato:" : "Vigilando " + s.hu.items.length + " datos:",
      huNoRows: s.hu.items.length === 0,
      huHasRows: s.hu.items.length > 0,
      huRows: s.hu.items.map((it, i) => {
        const c = HU_KINDS[it.kind] || HU_KINDS.email;
        const ls = this.huItemLeaks(it);
        const un = ls.filter(l => !this.huLeakState(l).resolved).length;
        return {label: this.huMask(it), kind: c.label, icon: c.icon,
          line: i === 0 ? "0" : "1px solid var(--color-border)",
          state: ls.length === 0 ? "Sin filtraciones"
            : !prem ? ls.length + (ls.length === 1 ? " filtración encontrada" : " filtraciones encontradas")
            : ls.length + (ls.length === 1 ? " filtración" : " filtraciones") + (un > 0 ? " · " + un + " sin resolver" : " · resueltas"),
          color: ls.length === 0 ? "var(--color-positive)" : un > 0 ? "var(--color-destructive)" : "var(--color-positive)",
          open: () => this.huGo("dato", {sel:i, fresh:false, kind:it.kind})};
      }),
      huLimitNote: prem ? "Con BeValk Premium puedes vigilar hasta 5 correos, tu nombre, 2 teléfonos y tu DNI."
        : "Con Premium puedes vigilar hasta 5 correos, tu nombre, 2 teléfonos y tu DNI.",

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

      toast: s.toast ? {visible:true, text:s.toast.text, hasAct: !!s.toast.act, actLabel: s.toast.act ? s.toast.act.label : "",
        act: () => { const a = this.state.toast && this.state.toast.act; this.setState({toast:null}); if (a) { a.fn(); this.say("Aviso recuperado."); } }}
        : {visible:false, text:"", hasAct:false, actLabel:"", act: () => {}},

      maria: {
        isIntro: s.maria.view === "intro", isList: s.maria.view === "list", isChat: s.maria.view === "chat",
        heading: s.maria.view === "list" ? "Tus conversaciones" : "Chat MarIA",
        canBack: true,
        back: () => s.maria.view === "intro" ? this.go("home") : this.mariaBack(),
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
        upBd: s.maria.rate === "up" ? "var(--color-ring)" : "var(--color-input)",
        downBg: s.maria.rate === "down" ? "var(--color-secondary)" : "transparent",
        downBd: s.maria.rate === "down" ? "var(--color-ring)" : "var(--color-input)",
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
