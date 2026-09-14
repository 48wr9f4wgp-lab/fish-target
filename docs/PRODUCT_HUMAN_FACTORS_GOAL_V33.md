# FISH TARGET Product / Human Factors Goal v33

Status: canonical product/UX decision for RC finalization
Decided: 2026-09-14
Scope: product definition, personas, human factors, result hierarchy, field-use acceptance gates
Supersedes: older UI hierarchy decisions where they conflict; does not replace fishing recommendation semantics, safety rules, data accuracy rules, or publication/legal gates.

## 1. Product decision

FISH TARGET is not a fishing information super-app.

The product is a **decision-compression tool** for anglers who already have an intent to target a fish.

Canonical promise:

> 魚を選べば、最初の1投と、今回持っていくセットと、現場で最初にやることがすぐ決まる。

Canonical flow:

`TARGET -> METHOD -> FIRST CAST -> MY SET -> FIELD 3 -> FIELD MODE`

The product must reduce uncertainty, not increase the amount of information the user has to interpret.

Maps, community, public catch feeds, large weather stacks, generic AI chat, catch journals and broad content feeds are not part of the primary product promise.

## 2. North Star usability goal

### Pre-trip
A user who knows the target fish should be able to reach a confident plan without studying the screen.

Internal usability targets:
- target selection -> METHOD + FIRST CAST understood within about 5 seconds
- registered MY TACKLE user -> the set to take understood within about 15 seconds total
- no mandatory interpretation of detailed compatibility rows before the primary answer
- no mandatory Catalog/network dependency for the owned-tackle decision

These are product usability targets, not scientific human-performance claims.

### At the water
FIELD MODE must answer, at a glance:
1. What do I throw now?
2. Where/how do I work it?
3. What setup am I holding?
4. What do I change if nothing happens?

Internal usability target:
- after opening FIELD MODE, the next action should be identifiable in about 3 seconds.

## 3. Persona model

Demographic personas are secondary. The product is designed around decision state and context.

### P1 — Primary: weekend execution angler
Characteristics:
- knows the target species
- owns multiple rods/reels or is starting to accumulate them
- understands common fishing words but does not want to compare every specification manually
- values confidence and speed more than exhaustive data

Job to be done:
> 今日この魚を狙うなら、何を投げて、手持ちのどのセットを持っていけばいい？

Main pain:
- too many plausible combinations
- fear of bringing the wrong setup
- forgetting one important component

Product win:
- one recommended plan and one coherent owned setup, with short reasons.

### P2 — Entry: beginner / returning angler
Characteristics:
- target fish may be known, fishing-method terminology may not be
- MY TACKLE may be empty
- long technical explanations increase abandonment risk

Job to be done:
> この魚を釣りたい。まず何をすればいい？

Product win:
- fish selection alone produces METHOD + FIRST CAST + required specs
- MY TACKLE registration is optional, never an onboarding blocker
- unfamiliar details are progressive disclosure.

### P3 — Trust: experienced angler
Characteristics:
- can judge tackle independently
- wants fast verification, alternatives and transparent reasons
- rejects false precision or unexplained recommendations

Job to be done:
> 結論だけ先に見たい。必要なら根拠と他候補も確認したい。

Product win:
- compact answer first
- deterministic recommendation
- one-tap disclosure of fit evidence and alternatives
- unknown, mismatch and safe fit remain distinct.

### S1 — Critical situational persona: angler at the water
This is a human state, not a demographic.

Conditions may include:
- one hand occupied
- wet/cold fingers or gloves
- glare and low contrast outdoors
- movement, wind, noise and divided attention
- intermittent or absent connectivity

Job to be done:
> 次に何を投げて、どう動かすかを一瞬で確認したい。

Product win:
- large type for critical information
- large forgiving touch targets
- no critical horizontal scrolling
- no tiny essential labels
- offline core decision path
- visual + textual status, not color only.

## 4. Human-factors rules

### 4.1 Visual attention
Use the hierarchy:

`ANSWER -> PRIMARY ACTION -> EXPLANATION`

Never require the user to read explanation before knowing the answer.

For the result page, first visual scan must resolve:
1. recommended method
2. FIRST CAST
3. the set to take / blocker
4. field action

Secondary evidence belongs behind disclosure.

### 4.2 Motor ergonomics
- frequent controls: practical target at least 44x44
- bottom/safe-area placement for frequent forward actions where appropriate
- adjacent controls need forgiving spacing
- no precision drag gesture required for core flow
- all custom controls need visible pressed/active feedback
- Home indicator / safe area must not overlap a primary action.

### 4.3 Legibility
For iPhone-first UI:
- critical field text should normally be 14–17px or larger
- primary answers use substantially larger type
- secondary explanatory text should normally not fall below 11–12px
- decorative/kicker text may be smaller only when it carries no required meaning
- field-critical meaning must never depend on 7–10px text
- high contrast is required for field-critical text.

### 4.4 Cognitive load
- one dominant forward action per decision stage
- at most one or two visually prominent actions in a view region
- recognition over recall
- avoid parallel status vocabularies
- do not make users reconcile IDEAL / MY SET / MISSING and a second compatibility scale at the same time
- do not ask users to trigger computation that can safely happen automatically.

### 4.5 Error prevention and trust
Canonical user-facing readiness vocabulary:
- `このセットで行ける`
- `確認が必要`
- `足りない`

Rules:
- unknown information never becomes green/ready
- known mismatch never becomes ready
- technical uncertainty must be named, not hidden
- status must include text/icon, not color only
- no fake public 0–100 compatibility score
- no unsafe unit inference
- manufacturer specs never imply the line physically spooled by the user
- recommendation wording means app guidance, not manufacturer certification.

### 4.6 Environmental resilience
Core value must survive:
- network failure
- stale/corrupt local persisted data
- reload
- iPhone Safari/PWA safe areas
- reduced-motion preference
- outdoor glare and short attention windows.

## 5. Canonical information architecture

### Home
Primary question:
> 何を釣る？

Priority:
1. search / fast target discovery
2. target fish cards
3. continuity for returning users
4. filters and secondary tools

Do not force setup or account work before the first useful answer.

### Result
Canonical vertical order:
1. TARGET context
2. `STEP 1 釣り方`
3. `STEP 2 最初の1投`
4. `STEP 3 今回のセット`
5. `STEP 4 現場へ`
6. optional evidence / rig / product / deeper detail

The primary owned-tackle card must not look like an engineering dashboard.

Preferred STEP 3 structure:
- status sentence: `このセットで行ける / 確認が必要 / 足りない`
- ROD
- REEL + current line
- one short reason or blocker
- primary next action
- disclosure: `基準・他候補を見る`

Terms such as `IDEAL SET`, `MISSING`, `compatibility`, scoring and resolver concepts may exist internally but must not be required to understand the consumer UI.

### FIELD MODE
Visual order:
1. target + method context
2. FIRST CAST name in largest actionable type
3. size / range / color / action
4. `反応がなければ次はこれ`
5. selected setup
6. three field steps
7. conditions / explanation
8. return to plan

FIELD MODE is a glance surface, not a reading surface.

## 6. Gaze-path acceptance rules

### Home first glance
The eye should land on:
`何を釣る？ -> search / fish imagery -> fish name`

### Result first glance
The eye should travel:
`fish -> method -> FIRST CAST -> this set -> field CTA`

No equally prominent card may interrupt this sequence.

### Field first glance
The eye should travel:
`FIRST CAST -> range/action -> next alternative`

Setup and rationale are secondary confirmations.

## 7. Interaction acceptance gates

A build cannot be called product-quality RC if any of the following is true:
- primary flow contains a <44px practical frequent touch target without a justified equivalent
- critical field text is tiny enough to require close reading
- user must horizontally scroll to discover a primary action
- two or more competing primary CTAs create ambiguity
- user has to interpret multiple status systems to know whether their tackle works
- missing MY TACKLE blocks METHOD/FIRST CAST value
- a core decision requires online Catalog data
- FIELD MODE requires reading paragraphs to know the next action
- a saved/corrupt state can block fish -> result progression
- status is communicated by color alone.

## 8. Market position

Current large fishing products compete strongly on maps, logged catches, forecasts, community, waterbody intelligence and commerce.

FISH TARGET will not win by copying their breadth.

Differentiation:

> **Decision compression with the tackle the user already owns.**

The competitive product sentence is:

> **釣りたい魚を選べば、最初の1投と、今回持っていく手持ちセットまで決まる。現場では次の一手だけ見ればいい。**

## 9. Release success definition

### Functional
- Fish -> METHOD -> FIRST CAST -> MY SET -> FIELD MODE always completes
- no launch/input/progression blocker
- safe save/reload/corrupt-storage behavior

### Usability
- target-to-answer flow can be completed one-handed on iPhone
- primary controls >=44px practical target
- no primary horizontal hunt
- critical text readable outdoors at normal viewing distance
- one obvious forward action per stage

### Trust
- recommendation reasoning is available but not forced
- unknown/mismatch states remain explicit
- no false precision / unsafe unit conversion / unapproved technical source claims

### Retention
- latest useful plan/set can be resumed
- returning user can choose between reusing the previous setup and rebuilding for a new target/condition without reconstructing from memory

### Quality
- 375 / 390 / 430 widths pass
- iOS WebKit path passes
- reduced motion and non-color status pass
- offline/core local decision path passes
- privacy/data removal and legal/catalog publication boundaries remain intact.

## 10. Immediate implementation priorities

P0 Human Factors Pass:
1. Replace developer-facing STEP 3 wording with consumer decision language.
2. Make owned-set decision automatic where computation is local and deterministic; Catalog remains optional detail.
3. Raise critical AUTO BUILD and FIELD MODE typography to legible phone sizes.
4. Reduce STEP 3 to one status + one set + one next action; move Ideal/alternatives/evidence behind disclosure.
5. Strengthen FIELD MODE glance hierarchy and next-alternative language.
6. Add regression checks for touch targets, critical font-size floor, status wording and non-blocking no-MY-TACKLE flow.

P1 Validation:
1. iPhone 375/390/430 visual + behavioral QA.
2. One-handed path audit.
3. Glare/contrast review.
4. Fresh-user / no-tackle / multi-tackle / corrupt-storage persona scenarios.

P2 Release Gate:
1. accuracy/content review
2. privacy/legal/catalog rights review
3. offline real-device verification
4. final RC regression
5. explicit approval before main/public release.
