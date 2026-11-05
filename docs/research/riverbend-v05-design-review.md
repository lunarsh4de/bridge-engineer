# Riverbend v0.5 design review

Date: 2026-11-05. This review distinguishes design rationale from measured outcomes. It does not claim classroom validation, rubric certification or a guaranteed grade.

## Critique of the v0.4 proposal

The v0.4 four-level campaign established a credible construction–test–revise loop, but stopped just as transfer should begin. Levels 1–4 introduced triangles, load paths, materials and a lower cable chord; they did not ask the player to apply those ideas to a genuinely new support condition, a substantially heavier load or an open investigation. The resulting arc risked teaching one authored truss pattern rather than flexible structural reasoning. There was no campaign-independent sandbox for deliberate practice.

The instructions were available as static Help text, but the game did not demonstrate the complete procedure through required controls. A learner could read “select Road, connect anchors, add Timber, test, edit” without ever performing that sequence before the first mission. The optional reference bridge was hidden in a details element, but “hidden” was not a pedagogical timing rule: it could be opened before the player formed and tested an idea, weakening inquiry and turning the example into an answer template.

The MDA relationship also needed tightening. Construction, inventory, a moving load and force colors were valid mechanics, and they produced experimentation as a dynamic. However, four similar crossings did not fully support the intended aesthetics of engineering discovery and responsibility. The community story named stakes, but success mostly changed a completion flag; failure did not clearly connect a delayed delivery to the next story beat. The Notebook supported evidence, yet the campaign did not culminate in a transfer task or a place to pursue a learner-authored question.

## v0.5 response

v0.5 adds an actual-control tutorial, a four-panel visual prologue, eight campaign constraints and a separate Free Build laboratory. Levels 5 and 8 introduce a real fixed centre support in the model; level 6 removes that support and requires a cable-and-steel load path; levels 7 and 8 introduce much heavier deliveries. These changes vary support geometry, span, load and material budget rather than only increasing numbers. Completion text connects the delivered resource to the next community, while retries remain unlimited.

Reference designs now unlock only after the player's own test. Post-test content explains the example's load path and explicitly states its limits. Every campaign reference and a distinct truss-height alternative was checked against inventory in the independent fixed-step solver; the audit records sag, force ratio, time, break count, material use and game cost. Multiple passing examples establish that no exact shape is required, but neither example is claimed to be mathematically optimal or safe for a real bridge.

The revised mechanic–learning relationship is more explicit: prediction gives inquiry a starting claim; construction exposes geometry and resource choices; fixed-step testing produces deformation, slack, force and failure evidence; Notebook comparison excludes mismatched conditions; new support/load constraints require transfer; sandbox load choices enable learner-authored comparisons. The desired dynamic is controlled iteration rather than trial-speed grinding, and the intended experience is growing engineering agency rather than merely unlocking scenes.

## Audience and facilitation

The proposed audience is ages 11–14, spanning upper primary and lower secondary, with adult facilitation and no prior bridge-design experience required. This range fits the concrete visual construction while acknowledging that axial force, model limitations and evidence-based comparison are too demanding for many younger children without substantial scaffolding. A teacher or adult should prompt a prediction, ask the learner to trace a load path to a fixed support, and require a claim–evidence–reasoning comparison from two matched Notebook records. The 45–75 minute campaign target remains a design estimate, not observed playtime.

## Remaining gaps

No learner study yet shows that the tutorial is sufficient, that the pacing fits a class period or that the learning goals are achieved. Accessibility has not received a formal screen-reader or physical-device audit. Branching is systemic rather than dialogue-based: design choices change failure, material evidence, completion and progression, but do not create alternate narrative conversations or endings. The solver is an idealized axial-member model and cannot teach beam bending, connection design or real bridge safety. Classroom use still needs teacher observation of explanations; completion, a saved reflection and Material saver are not mastery scores.

The course STEM mind map and game rubric informed the v0.5 mapping of ABCD, Bloom, 5E, inquiry, problem solving, practice/feedback, story consequences, purposeful media and facilitation. This is an auditable design alignment, not proof that every evaluator will award a particular score.
