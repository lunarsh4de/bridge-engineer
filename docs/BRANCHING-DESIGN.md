# Branching scenario design (v1)

Source of truth: `site/js/core/levels.js` (`NODES`, `LEVELS`, `BADGES`).
Coverage: `tests/campaign.test.cjs` plays every story path with the reference
designs through the real solver.

## Structure: branch and bottleneck

```
prologue (comic) -> tabletop -> willow -> [route choice]
                                             |- clinic (gain cable) -.
                                             '- mill   (gain steel) -+-> [share choice]
                                                                       |- share: reserve -> 0, gain other material, help both
                                                                       '- keep : keep reserve, one material only
                                          -> echo -> [support choice] -> finale -> report
                                                       |- pier   (needs mill helped)
                                                       |- towers (needs clinic helped)
                                                       '- none   (+300 credits, full 12 m span)
```

Bottlenecks (tabletop, willow, echo, finale, report) keep the campaign at five
build levels on every path. Branches change what the player carries forward.

## What a choice changes

| Choice | Material | Credits | Later effect |
|---|---|---|---|
| route: clinic | + cable | - | towers unlockable; echo can use cable stays |
| route: mill | + steel | - | pier unlockable; echo can use a steel truss |
| share | + the other material | reserve set to 0 | both pier and towers unlockable |
| keep | - | reserve kept | only one support option besides "none" |
| support: pier / towers / none | - | none: +300 | finale anchors and reference design differ |

Unused budget becomes reserve credits that carry into later levels, so saving
money is a real resource decision, not just a score. Locked options show the
reason ("Needs the trust of ...") instead of disappearing.

## Learning goal per level

| Level | Concept the player must use to pass |
|---|---|
| tabletop | road alone sags; a triangle turns bending into push/pull |
| willow | long struts buckle; short members in a truss share load |
| clinic | cable only works in tension; hang the road from above |
| mill | put the costly strong material only where force is highest |
| echo | more than one valid structure; compare drop, peak force, cost |
| finale | supports shorten the span and change member forces |

Each level ends with one check question; first-try correctness is stored in the
save and shown in the report. Hints come one at a time; after the last hint the
player may load a reference design, which is recorded as `example:<level>`.

## Scoring loop (Goal / Rules / Rewards / Challenge)

- **Goal**: get the vehicle across. Pass = road continuous, no member broken,
  maximum road drop < 12 cm, cost within budget.
- **Stars**: relative to par = cheapest reference design. 3 stars at cost <= par,
  2 stars at <= 1.3 x par, 1 star for any pass. These thresholds are game-design
  choices, not course grading weights.
- **Badges**: 2-3 optional challenges per level (`BADGES`), for example
  member count, peak load ratio, road drop, credit cap. Tests prove each badge
  is reachable on every path.
- **Feedback**: first break plays in slow motion with the cause in words;
  Inspect replays peak force per member.

## Report

The report states three consequences of the player's choices (who was helped,
what support Riverbend got, credits shared or kept), a per-level table, and a
reflection box that autosaves.

## Assumptions and limits

The story, communities and numbers are original game fiction. Reference
designs prove a level is solvable; they are not proof of optimal design.
Passing levels is not evidence of learning; no learner study has been run.
