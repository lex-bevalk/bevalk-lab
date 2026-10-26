#!/usr/bin/env python3
"""Build project/Main.dc.html from orig/Main.dc.html + src/*. Every patch must match exactly once."""
import json, re, sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ROOT, 'orig/Main.dc.html'), encoding='utf-8').read()
S = lambda n: open(os.path.join(ROOT, 'src', n), encoding='utf-8').read()

def rep(old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        sys.exit(f'PATCH FAIL ({n} matches, want {count}): {old[:140]!r}')
    src = src.replace(old, new)

# ---------- 1. Template shell ----------
start = src.index('<div style="min-height:100vh;box-sizing:border-box;display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:32px;padding:32px;')
phone = src.index('<div class="tp-phone"')
src = src[:start] + S('lab-shell-open.html') + src[phone:]
rep('<div class="tp-phone" onTouchStart="{{ touchStart }}" onTouchEnd="{{ touchEnd }}" style="flex:0 0 auto;width:393px;height:852px;position:relative;',
    '<div class="tp-phone" onTouchStart="{{ touchStart }}" onTouchEnd="{{ touchEnd }}" style="flex:0 0 auto;width:393px;height:852px;transform:scale({{ lab.scale }});transform-origin:0 0;position:relative;')
end_old = '''  </div>
  </sc-if>


</div>
</div>

</x-dc>'''
end_new = '''  </div>
  </sc-if>


</div>
  </div>
  </div>
</section>
<div class="lab-scrim" onClick="{{ lab.closePv }}" aria-hidden="true"></div>
</div>

</x-dc>'''
rep(end_old, end_new)

# ---------- 2. Helmet CSS ----------
css = S('lab.css')
rep('  @media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}\n</style>',
    css + '\n  @media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}\n</style>')
rep('body{margin:0;background:#F5F5F5}', 'body{margin:0;background:var(--neutral-100)}')

# ---------- 3. data-props preview ----------
rep('data-props="{&quot;$preview&quot;:{&quot;width&quot;:809,&quot;height&quot;:916}', 'data-props="{&quot;$preview&quot;:{&quot;width&quot;:1680,&quot;height&quot;:916}')

# ---------- 4. Data + logic ----------
rep('class Component extends DCLogic {', S('score-color.js') + '\n' + S('lab-data.js') + '\nconst LAB_QA = ' + open(os.path.join(ROOT, 'src/lab-qa.json'), encoding='utf-8').read().strip() + ';\n\nclass Component extends DCLogic {')
rep('''      delStep:"aviso", delReason:"", delOther:"", delConfirm:""}};
  timers = [];''', '''      delStep:"aviso", delReason:"", delOther:"", delConfirm:""},
    lab:{view:"welcome", case:null, reached:{}, armed:{}, prepping:false, snap:null, notice:null, q:"", tab:"info", pv:"closed", loose:null},
    labPlan:null, simPlan:null, labFail:null, netBlock:null, labScale:1};
  timers = [];
''' + S('lab-logic.js'))

# lifecycle
rep('''    if (prev && prev.miFamilia !== this.props.miFamilia) this.setState({fam: FAM0(), screen:"home", sheet:null});
  }''', '''    if (prev && prev.miFamilia !== this.props.miFamilia) this.setState({fam: FAM0(), screen:"home", sheet:null});
    this.labTrack();
  }''')
rep('componentWillUnmount(){ this.clearT(); window.removeEventListener("keydown", this.onKey); }',
    'componentWillUnmount(){ this.clearT(); window.removeEventListener("keydown", this.onKey); if (this._ro) this._ro.disconnect(); }')

# world composition
rep('''    if (this.state.world) return this.state.world;
    return this.scenWorld(SCEN[this.scenKey()] || SCEN["prem-amitad"]);''',
    '''    if (this.state.world) return this.state.world;
    return this.planWorld(this.scenWorld(SCEN[this.scenKey()] || SCEN["prem-amitad"]), this.state.simPlan);''')
rep('''  selectFlow(f){
    this.setScen(f.scen);''', '''  selectFlow(f, scenOverride, plan){
    this.setScen(scenOverride || f.scen, plan);''')
rep('''  setScen(k){
    const s = SCEN[k];
    this.clearT();
    this.setState({scen:k, world:null,''', '''  setScen(k, plan){
    const s = SCEN[k];
    this.clearT();
    if (plan !== undefined) this.setState({simPlan: plan});
    this.setState({scen:k, world:null,''')
rep('''    const w = this.scenWorld(s);
    this.setState({shown:0});''', '''    const w = this.planWorld(this.scenWorld(s), plan !== undefined ? plan : this.state.simPlan);
    this.setState({shown:0});''')

# activatePremium: sync the Lab plan and resume the analyzer when the purchase started at the limit screen
rep('''    this.setState(st => Object.assign({world:nw, shown:0, pr: Object.assign({}, st.pr, {plan:p, sel:p, selTouched:false})}, stay ? {} : {screen:"home", sheet:null}));
    this.animateTo(this.scoreOf(nw));
    this.showToast((p === "anual" ? "Protección anual activada." : "Protección mensual activada.") + " Ahora elige qué datos vigilamos: te pedimos permiso para cada uno.");''',
    '''    const resume = !stay && !!(this.state.an && this.state.an.resume && this.state.an.value);
    this.setState(st => Object.assign({world:nw, shown:0, labPlan:"premium", simPlan:"premium", pr: Object.assign({}, st.pr, {plan:p, sel:p, selTouched:false})}, stay ? {} : {screen:"home", sheet:null},
      resume ? {screen:"analizador", an: Object.assign({}, st.an, {view:"main", resume:false})} : {}));
    this.animateTo(this.scoreOf(nw));
    if (resume) return this.showToast((p === "anual" ? "Protección anual activada." : "Protección mensual activada.") + " Tu enlace sigue aquí: ya puedes analizarlo sin límite.");
    this.showToast((p === "anual" ? "Protección anual activada." : "Protección mensual activada.") + " Ahora elige qué datos vigilamos: te pedimos permiso para cada uno.");''')
rep('buy: () => { this.anSet({view:"main"}); this.go("paywall"); },', 'buy: () => { this.anSet({view:"main", resume:true}); this.go("paywall"); },')
rep('''      an: Object.assign({}, a, {type, from, value:"", shot:false, legend:false, report:false, reportText:"", view, pz:{plan:null, done:{}}})});''',
    '''      an: Object.assign({}, a, {type, from, value:"", shot:false, legend:false, report:false, reportText:"", view, resume:false, pz:{plan:null, done:{}}})});''')
rep('''    this.setState(Object.assign({screen, sheet:null, push: screen === "alertas" ? this.state.push : false}, extra || {}));''',
    '''    if (this.state.an && this.state.an.resume && screen !== "paywall") this.anSet({resume:false});
    this.setState(Object.assign({screen, sheet:null, push: screen === "alertas" ? this.state.push : false}, extra || {}));''')

# analysis failure toggle
rep('if (this.props.falloAnalisis) { this.later(() => this.anSet({view:"error", errKind:"servicio"}), 1700); return; }',
    'if (this.anFail()) { this.later(() => this.anSet({view:"error", errKind:"servicio"}), 1700); return; }')

# offline guards
rep('''    if (err.email || err.pass) { this.say("Revisa los campos marcados."); return this.auSet({err}); }''',
    '''    if (err.email || err.pass) { this.say("Revisa los campos marcados."); return this.auSet({err}); }
    if (this.off()) return this.labNet("login", "Sin conexión. Revisa la red e inténtalo otra vez: lo que has escrito sigue aquí.");''')
rep('''    if (err.email || err.pass || err.terms) { this.say("Revisa los campos marcados."); return this.auSet({err, tried:true}); }''',
    '''    if (err.email || err.pass || err.terms) { this.say("Revisa los campos marcados."); return this.auSet({err, tried:true}); }
    if (this.off()) return this.labNet("signup", "Sin conexión. No hemos podido crear tu cuenta: tus datos siguen escritos para cuando vuelva la red.");''')
rep('''    if (st === "url" && o.phase === "input") {
      this.obSet({phase:"scan", verdict:"danger"});''', '''    if (st === "url" && o.phase === "input" && this.off()) {
      this.obSet({step:"temas", phase:"input"});
      return this.labNet("onb", "Sin conexión: la prueba necesita red. Seguimos con la bienvenida y podrás hacerla luego en Comprobar.");
    }
    if (st === "url" && o.phase === "input") {
      this.obSet({phase:"scan", verdict:"danger"});''')
rep('''    const temas = picked.length ? picked.reduce((m, x) => { x.map.forEach(k => m[k] = 1); return m; }, {}) : null;''',
    '''    const noTemas = o.step === "temas" && picked.length === 0;
    const temas = picked.length ? picked.reduce((m, x) => { x.map.forEach(k => m[k] = 1); return m; }, {}) : noTemas ? {} : null;''')
rep('''    this.auEnter("Todo listo. Tu protección ya está configurada.");''',
    '''    this.auEnter(noTemas ? "Listo. No te enviaremos consejos por temas. Los avisos sobre tus propios datos te llegan siempre." : "Todo listo. Tu protección ya está configurada.");''')
rep('''    this.caseUpsert({id:"sos-" + Date.now(), kind:"team", when:"hoy", email:o.email.trim()});''',
    '''    if (this.off()) return this.labNet("sos", "Sin conexión: no hemos podido enviar tu caso. Sigue aquí escrito. Si es urgente, llama al 017.");
    this.caseUpsert({id:"sos-" + Date.now(), kind:"team", when:"hoy", email:o.email.trim()});''')
rep('''    const typed = (m.draft || "").trim();
    if (m.img) {''', '''    const typed = (m.draft || "").trim();
    if ((typed || m.img) && this.off()) return this.labNet("maria", "Sin conexión. Tu mensaje sigue escrito: envíalo cuando vuelva la red.");
    if (m.img) {''')
rep('''    if (!sh || !sh.msg) return this.famSheetSet({err:true});
    const reqs = f.reqs.map(r => r.id === sh.req ? Object.assign({}, r, {reply: sh.msg}) : r);
    const r = f.reqs.find(x => x.id === sh.req), m = this.famMember(r.from);''',
    '''    if (!sh || !sh.msg) return this.famSheetSet({err:true});
    if (this.off()) return this.labNet("famreply", "Sin conexión. Tu respuesta no se ha enviado: sigue elegida para cuando vuelva la red.");
    const r = f.reqs.find(x => x.id === sh.req), m = this.famMember(r.from);
    // Una misma petición repetida se responde una sola vez.
    const reqs = f.reqs.map(x => x.id === sh.req || (!x.reply && x.from === r.from && x.obj === r.obj) ? Object.assign({}, x, {reply: sh.msg}) : x);''')
rep('''    if (!sh.motive) return this.famSheetSet({err:true});
    const pet = {''', '''    if (!sh.motive) return this.famSheetSet({err:true});
    if (this.off()) return this.labNet("famayuda", "Sin conexión. Tu petición no se ha enviado. Si es urgente, llama al 017.");
    const pet = {''')
rep('''    if (!sh || !sh.msg) return this.famSheetSet({err:true});
    const all = sh.to === "all";''', '''    if (!sh || !sh.msg) return this.famSheetSet({err:true});
    if (this.off()) return this.labNet("famaviso", "Sin conexión. El aviso no se ha enviado: sigue preparado para cuando vuelva la red.");
    const all = sh.to === "all";''')
rep('''          authorize: () => { if (!b.consent) { set({err:true}); this.say("Marca la casilla para darnos permiso."); return; }''',
    '''          authorize: () => { if (!b.consent) { set({err:true}); this.say("Marca la casilla para darnos permiso."); return; }
            if (this.off()) return this.labNet("borrar", "Sin conexión. No hemos enviado ninguna solicitud. Tu autorización sigue marcada.");''')
rep('''primary:() => { this.setState({sheet:null, autoOn:true}); this.showToast("Listo. Te avisaremos si llega algo sospechoso."); },''',
    '''primary:() => { this.setState({sheet:null, autoOn:true}); this.showToast(this.notiPerm() === "Denegado" ? "Activados, pero los avisos del móvil están apagados: no te llegará nada hasta que los permitas en Ajustes." : "Listo. Te avisaremos si llega algo sospechoso."); },''')
rep('''      offlineNote: s.screen === "home"
        ? "Te enseñamos lo último que comprobamos, el " + w.checked.replace("Revisado ", "") + ". No podemos mirar nada nuevo hasta que vuelvas a tener red."''',
    '''      offlineNote: s.screen === "home" && /^Revisado /.test(w.checked || "")
        ? "Te enseñamos lo último que comprobamos, el " + w.checked.replace("Revisado ", "") + ". No podemos mirar nada nuevo hasta que vuelvas a tener red."
        : s.screen === "home" ? "Te enseñamos lo último que comprobamos. No podemos mirar nada nuevo hasta que vuelvas a tener red."''')

# family plan includes Premium (app copy: members "dejan de tener Premium del grupo", leaving "pasa a Basic")
rep('''    this.later(() => { this.setState(s => ({fam: Object.assign({}, s.fam, {sheet:null, view:"crear", role:"admin", created:false})})); this.famTop(); }, 1600);''',
    '''    this.later(() => { this.setState(s => ({fam: Object.assign({}, s.fam, {sheet:null, view:"crear", role:"admin", created:false})})); this.labSetSimPlan("premium"); this.famTop(); }, 1600);''')
rep('''      mem: Object.assign({}, s.fam.mem, {share: Object.assign({}, j.share), showName: j.showName, welcome:true, aviso:false, pets:[]})})}));
    this.famTop();''', '''      mem: Object.assign({}, s.fam.mem, {share: Object.assign({}, j.share), showName: j.showName, welcome:true, aviso:false, pets:[]})})}));
    this.labSetSimPlan("premium");
    this.famTop();''')
rep('''        confirm: () => { this.setState(st => ({screen:"home", fam: Object.assign({}, st.fam, {sheet:null, role:"none", view:"oferta"})})); this.showToast("Has salido del grupo. Tu cuenta es Basic."); }});''',
    '''        confirm: () => { this.setState(st => ({screen:"home", fam: Object.assign({}, st.fam, {sheet:null, role:"none", view:"oferta"})})); this.labSetSimPlan("free"); this.showToast("Has salido del grupo. Tu cuenta es Basic."); }});''')

# urgent motive + duplicates
rep('''    if (ctx.obj && ctx.obj.kind === "link") return ctx.obj.v === "safe"
      ? [["Sobre este enlace", [3, 4]], ["General", [9]]]
      : [["Sobre este enlace", [1, 2, 4]], ["General", [9]]];''',
    '''    const urgent = ctx.motive && /dinero|datos/i.test(ctx.motive) ? [["Lo más urgente", [6, 5]]] : [];
    if (ctx.obj && ctx.obj.kind === "link") return urgent.concat(ctx.obj.v === "safe"
      ? [["Sobre este enlace", [3, 4]], ["General", [9]]]
      : [["Sobre este enlace", [1, 2, 4]], ["General", [9]]]);''')
rep('groups: msgOpts(this.famMsgGroups({obj:{kind:r.kind, v:r.v}}), sh.msg,', 'groups: msgOpts(this.famMsgGroups({obj:{kind:r.kind, v:r.v}, motive:r.motive}), sh.msg,')
rep('''      hasReq: !!req0, reqTitle: reqFrom ? reqFrom.nick + " te pide ayuda" : "",''',
    '''      hasReq: !!req0, reqTitle: reqFrom ? reqFrom.nick + " te pide ayuda" + ((n => n > 1 ? " (" + n + " veces)" : "")(openReqs.filter(x => x.from === req0.from && x.obj === req0.obj).length)) : "",''')

rep('hasBadge: open.length > 0, badge: open.length === 1 ? "1 petición" : open.length + " peticiones",',
    'hasBadge: open.length > 0, badge: (n => n === 1 ? "1 petición" : n + " peticiones")(open.filter((r, i) => open.findIndex(x => x.from === r.from && x.obj === r.obj) === i).length),')
rep('''    if (s.an.legend || s.an.report) return this.anSet({legend:false, report:false});
  }''', '''    if (s.an.legend || s.an.report) return this.anSet({legend:false, report:false});
    if (s.lab && s.lab.pv === "open") return this.labLabSet({pv:"closed"});
  }''')

# score ring colour follows the number on screen (bands + OKLab transitions)
rep('    const ringColor = level === "green" ? "var(--color-positive)" : level === "amber" ? AMBER : "var(--color-destructive)";',
    '    const ringColor = scoreColor(s.shown, "ring"), scoreTextColor = scoreColor(score, "text");')
rep('stroke="{{ ringColor }}" stroke-width="7"', 'stroke="{{ ringColor }}" stroke-width="7"')
rep('<span style="font:700 3rem/3rem var(--font-sans);color:{{ ringColor }}">{{ score }}</span>', '<span style="font:700 3rem/3rem var(--font-sans);color:{{ scoreTextColor }}">{{ score }}</span>')
rep('      score, shown: s.shown, ringColor,', '      score, shown: s.shown, ringColor, scoreTextColor,')

# expose to template
rep('      week, camino, ap, le, side,', '      week, camino, ap, le, side, lab: this.labVals(),')

# ---------- design rule: horizontal rows centred on their tallest item ----------
sys.path.insert(0, os.path.join(ROOT, 'src'))
from align_rows import transform
cut = src.index('<script type="text/x-dc" data-dc-script')
tpl, nrows, nedits = transform(src[:cut])
src = tpl + src[cut:]
print('aligned rows', nrows, 'style edits', nedits)

open(os.path.join(ROOT, 'project/Main.dc.html'), 'w', encoding='utf-8').write(src)

# canvas.json
cj = json.load(open(os.path.join(ROOT, 'orig/canvas.json'), encoding='utf-8'))
b = cj['boards']['Main.dc.html']
b['w'], b['h'], b['expand'] = 1680, 916, 'fill'
b['title'] = 'BeValk · Product Experience Lab'
json.dump(cj, open(os.path.join(ROOT, 'project/canvas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('built', len(src), 'bytes')
