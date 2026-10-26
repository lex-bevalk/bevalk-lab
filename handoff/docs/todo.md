# BeValk Product Experience Lab — plan

Objective: evolve `Tu protección` (Main.dc.html) into a 3-column Flow Explorer / Product Intelligence / Live Preview lab without breaking the phone prototype.

## Architecture decisions
- Single artboard, `expand: fill`, board 1680x916. Phone markup untouched except wrapper + scale transform.
- State dimensions: flow (state.flow) · plan (world().plan, preference state.labPlan) · runtime env (offline/bio/camPerm/notiPerm/labFail) · case (state.lab.case) · family role (state.fam.role).
- Plan composition: world() = planWorld(scenWorld(SCEN[k]), simPlan). No flow duplication. Pinned flows (free: 1-5,8; premium: 17,19-21,23-27,29,30) explain the constraint.
- Family plan includes Premium (evidence: app copy "deja de tener Premium del grupo", "pasa a Basic"): famBuy/famJoin -> premium, salir -> free.
- Case engine: prep after flow reset (timer), edge-triggered step predicates tracked in componentDidUpdate; never mark a step without observed transition.

## Small app fixes required by extreme cases
- [x] anAnalyze uses lab fail toggle (once/always) besides prop
- [x] Limit -> Premium resumes analyzer with link
- [x] Offline guards: login, signup, onboarding test, borrar authorize, SOS send, MarIA send, family reply/ayuda/aviso
- [x] Onboarding with zero topics: respect choice + explain
- [x] Offline home note copy bug when checked="Hace 2 meses…"
- [x] Duplicate family requests answered once; urgent motive prioritises messages
- [x] Auto alerts activated with phone notifications off -> explain

## Acceptance / verification
- [x] 30 flows x 2 plans load without console errors
- [x] Every executable case: prep + scripted trigger reaches expected step
- [x] Screenshots 1920/1680/1440/1280/1024/768/375
- [x] Original controls (offline, Face ID, push, más estados) still work

## Results (26 oct 2026, local Chromium harness with the type's dc-runtime as support.js)
- QA battery: 62/62 executable cases resolve end to end; baseline 62/62 (no step marked at prep).
- Flow sweep: 30 flows x 2 plans, 0 console/page errors.
- Invariants: 17/17 (plan persistence, pins, role independence, case isolation, reset, doc nav, in-app purchase sync, SCEN untouched).
- axe-core on lab chrome: 0 violations (welcome, flow + active case).
- Not verified: real Design canvas runtime/editor, real fonts from Google Fonts (blocked in sandbox), missing product images (placeholders locally).
