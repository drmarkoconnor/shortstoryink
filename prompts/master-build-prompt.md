You are helping me build v1 of a website called shortstory.ink.

Treat the attached PDF product brief as the governing document. Follow it closely. Do not drift into generic SaaS patterns, unnecessary abstractions, enterprise assumptions, or feature sprawl. If a decision is unclear, choose the option that best supports a lean, elegant, static-first, editor-led writing platform for a small real-world writing group.

PROJECT CONTEXT

shortstory.ink is not a mass-market writing app. It is a calm, premium-feeling, literary platform that acts as a digital extension of a creative writing teacher’s mind, pedagogy, personality, generosity, and editorial standards.

The initial audience is adult beginner-to-intermediate writers, mainly UK-based, including people from an existing in-person creative writing group. The site must support physical cohorts now and allow an evolution toward online structured teaching.

The emotional tone should feel like a private members’ literary workshop with beautiful typography, space, and restraint. It should not feel like a noisy social platform or a standard modern learning management system.

PRIMARY PRODUCT GOAL

Build the core learning loop first:

read -> notice -> save -> write -> submit -> receive inline feedback -> reflect -> revise -> remain connected through cohort/community

This core loop matters more than broad feature coverage.

V1 STRATEGIC PRIORITIES

1. Inline feedback must stay where the text is.
2. A snippet/commonplace system must allow writers to save short passages and craft moves.
3. The reading experience must be elegant, readable, and psychologically calm.
4. Cohorts should exist, but community features should be tightly controlled.
5. Teacher efficiency matters more than broad peer-to-peer interactivity in v1.
6. Costs should stay low. Prefer static-first and simple hosting patterns.

TECHNICAL DIRECTION

Build with:
- Eleventy (11ty)
- Nunjucks
- GitHub
- Netlify

Prefer a static-first architecture with progressive enhancement.

Only introduce server-side or dynamic logic where truly needed, for example:
- authentication
- protected submissions
- feedback persistence
- snippet persistence
- lightweight admin actions

Assume Netlify Functions may be used later or where required, but do not prematurely over-engineer the backend.

DESIGN DIRECTION

The visual and UX direction should be:
- elegant
- spacious
- premium
- literary
- quiet
- typography-led

Avoid:
- clutter
- overuse of cards
- noisy dashboard patterns
- intrusive popups
- excessive color
- gamified or childish educational UI
- generic SaaS templates

Design references in spirit:
- literary journal
- private members’ club
- notebook / writing desk

Reading and writing screens should feel especially refined.

Dark mode should be the default, but the architecture should allow a paper-like light mode toggle later.

Use:
- strong hierarchy
- generous whitespace
- restrained line lengths
- accessible contrast
- calm navigation

PRODUCT STRUCTURE

The site architecture should roughly support these areas:

- Home / marketing pages
- Studio (logged-in dashboard)
- Workshop (submission, feedback, revision)
- Library (handouts, lessons, craft notes, prompts)
- Reading Room (beautiful reading interface)
- Snippets (commonplace system)
- Cohorts (group spaces)
- Account / membership / settings
- Admin surfaces for teacher use

V1 FUNCTIONAL REQUIREMENTS

V1 should support:

1. Public site
- landing page
- about / philosophy
- how it works
- pricing or membership placeholder
- newsletter capture placeholder
- sign in / sign up entry points

2. Authenticated user area
- personal dashboard / Studio
- active cohort visibility
- recent submissions
- recent feedback
- saved snippets
- current prompt or next action

3. Submission workflow
- users can submit work as pasted text
- support for file upload may exist, but browser-readable text is the canonical experience
- users can resubmit revised versions
- comment history should be preservable conceptually even if mocked in early frontend work

4. Feedback workflow
- comments must attach to exact parts of text
- summary feedback area
- comments private by default
- teacher-controlled visibility model

5. Snippet system
- users can save short selections of text
- each snippet has text, source context if relevant, and preset craft tags
- snippets can be private or shareable
- this feature is strategically important and should not be treated as an afterthought

6. Library / Reading Room
- support structured HTML handouts and downloadable PDFs
- present reading content beautifully
- allow future annotation/highlighting patterns
- support categories such as short story, poetry, novel, craft, prompts, revision, freewriting

7. Cohorts
- users can belong to a cohort
- cohort pages/spaces should exist
- avoid building a full social network
- default to simple, structured, moderated interactions

8. Teacher/admin support
- dashboard concepts for submissions awaiting review
- student activity overview
- cohort overview
- moderation / permissions concepts
- trusted reader role concept for future peer review permissions

CONTENT AND PEDAGOGIC MODEL

Support a shared craft taxonomy across forms. Preset tags and categories may include:
- voice
- image
- character
- point of view
- structure
- scene
- dialogue
- rhythm
- revision
- beginnings
- endings
- noticing
- notebook
- freewriting

The site should support both:
- a fixed structured course path
- a growing resource library

The first structured teaching emphasis is short story writing.

PEER FEEDBACK MODEL

Do not assume open commenting by all users.

The product should embody this logic:
- feedback is private by default
- teacher decides who may comment
- a “Trusted Reader” role may later allow controlled peer feedback
- permissions are revocable
- moderation matters

PAYMENTS

Do not build complex billing logic into the first implementation unless asked.

The intended commercial model is likely:
- free tier with meaningful but limited access
- very cheap monthly paid tier
- annual option later
- separate course fees later

For now, architect the site so payments can be integrated later without twisting the whole app around billing.

DATA ETHOS

The site should clearly support the principle that:
- users own their writing
- users own their submissions
- users can export/delete their data
- feedback does not transfer authorship

This should influence account/settings architecture and copy tone.

WORKING STYLE INSTRUCTIONS

When generating code or plans:

- prefer simple, clear folder structures
- prefer maintainable patterns over cleverness
- explain architectural decisions briefly and concretely
- do not invent backend services unless necessary
- do not assume React or a JS-heavy frontend unless explicitly requested
- keep JavaScript light
- lean on semantic HTML and clean CSS
- use progressive enhancement

When uncertain:
- preserve elegance
- preserve simplicity
- preserve the core loop
- postpone non-essential complexity

DELIVERY ORDER

Work in this order unless I instruct otherwise:

Phase 1:
- propose site architecture
- propose folder structure
- propose content model
- propose design tokens / typography / layout rules
- define page routes and user journeys

Phase 2:
- build public-facing pages and global layout in Eleventy
- implement design system foundations
- create placeholder Studio, Workshop, Library, Reading Room, Snippets, Cohorts pages

Phase 3:
- implement submission and inline feedback UX at prototype level
- implement snippet saving UX at prototype level
- create admin/teacher dashboard concepts

Phase 4:
- identify the lightest realistic persistence/auth layer for protected functionality

IMPORTANT CONSTRAINTS

- Do not try to solve everything at once.
- Do not overbuild for scale that does not yet exist.
- Do not default to enterprise-grade architecture.
- Do not produce a generic course website.
- Do not treat the snippet system as minor.
- Do not separate feedback from the text being discussed.

WHAT I WANT FROM YOU FIRST

Before writing code, give me:
1. a proposed Eleventy folder structure
2. a route map
3. a component list
4. a content model
5. a phased implementation plan
6. a brief note on the minimum dynamic pieces required versus what can stay static

Then pause for my review.