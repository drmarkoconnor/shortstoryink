# shortstory.ink — V1 Product Brief

## Status
Working product brief for initial build.

## Owner
Mark O’Connor

## Purpose of this document
This document defines the strategic intent, product scope, design philosophy, and implementation priorities for **shortstory.ink**.

It is intended to guide design and development decisions and should be treated as the **governing source of truth** for the first build.

The project should remain disciplined, elegant, and focused on the core learning and teaching loop rather than trying to become a full writing platform all at once.

---

# 1. Product Summary

## Product name
**shortstory.ink**

## One-line description
A calm, elegant, editor-led digital writing studio for adult writers, built around reading, writing, inline feedback, revision, and community continuity.

## Core promise
> Write, receive precise feedback in place, reflect, revise, and grow within a lasting literary community.

## Strategic aim for year one
The primary aim is to support an existing **physical creative writing group** while also allowing online learners to join a structured writing environment.

The initial shape is:

- a site for Mark’s physical group
- plus support for online learners
- plus the ability for a single learner to begin privately
- and later join a cohort-based or community experience

This is **not** initially a mass-market writing app or institutional teaching platform.

---

# 2. Product Vision

shortstory.ink should become a **digital extension of Mark’s teaching mind** — and, more broadly, of his:

- editorial taste
- generosity
- standards
- personality
- grace
- pedagogy

The platform should feel like a **private members’ literary workshop** rather than a generic course website or social platform.

It should help writers feel:

- seen
- encouraged
- challenged
- guided
- less alone

It should support both the practical craft of writing and the emotional psychology of continuing to write.

---

# 3. Target Audience

## Primary audience (v1)
Adult beginner-to-intermediate writers, especially:

- current local writing group members
- aspiring writers who need structure
- people who want feedback and encouragement
- writers who find writing lonely and want connection
- serious beginners who want to improve craft

## Secondary audience (later)
- online-only writers
- international users
- more advanced writers
- alumni returning for continued engagement

## Market
Initially UK-based, but should not exclude international users.

---

# 4. Brand Positioning

## Brand qualities
The site should feel:

- **Elegant** (most important)
- **Premium and polished**
- Quietly literary
- Spacious
- Intelligent
- Editor-led

## It should not feel:
- generic
- corporate
- noisy
- overly cheerful
- “edtech”
- childish
- gamified
- cluttered
- like a standard LMS

## Emotional feel
The emotional atmosphere should be somewhere between:

- a literary journal
- a private members’ club
- a writer’s notebook / writing desk
- an editor’s reading room

---

# 5. Product Philosophy

The product should be built around a clear pedagogic loop:

> **Read → Notice → Save → Write → Submit → Receive feedback → Reflect → Revise → Re-enter community**

This loop is more important than broad feature coverage.

The site should not be built as a collection of disconnected features. It should be built as a **coherent writer development environment**.

---

# 6. Strategic Product Principles

## 6.1 Teacher efficiency first
In v1, the product should optimise **Mark’s teaching efficiency** more than broad peer-to-peer interaction.

## 6.2 Inline feedback is core
Comments must stay **where the text is**.

This is one of the most important strategic decisions in the product.

Feedback should not primarily happen in detached discussion threads or general comments below a piece.

## 6.3 The reading experience matters
The site should treat reading as a first-class activity, not just as a means to reach assignments.

## 6.4 Snippets are strategically important
The **snippet/commonplace system** is one of the most distinctive product ideas and must not be treated as a side feature.

## 6.5 Community must be structured
Community should be present but controlled, teacher-led, and moderated.

## 6.6 Keep costs low
The build should remain lean, static-first, and low-cost in infrastructure and complexity.

---

# 7. What is Missing in Existing Platforms

Current creative writing and course platforms often fail in one or more of these ways:

- comments are separated from the text they refer to
- course content is fragmented across tools
- reading is treated badly
- there is no meaningful writer’s commonplace or snippet system
- peer interaction is often noisy or low quality
- communities often decay into either silence or unhelpful chatter
- design often feels generic or “SaaS”

shortstory.ink should deliberately improve on this.

## Key opportunity areas
The platform should do these things unusually well:

- **inline editorial feedback**
- **beautiful reading and annotation**
- **writer’s snippet/commonplace collection**
- **structured, humane cohort continuity**
- **teacher-led literary taste and curation**

---

# 8. Product Scope for V1

V1 should be intentionally disciplined.

The goal is **not** to build a complete ecosystem immediately.

The goal is to build a **beautiful, useful, working core loop**.

## V1 must achieve:
- a public-facing site
- a protected member area
- work submission
- inline feedback
- snippet capture
- structured reading/resources
- simple cohorts
- simple membership logic
- admin visibility for Mark

## V1 must not try to achieve:
- full social networking
- advanced algorithmic matching
- complex billing systems
- AI writing generation
- teacher marketplaces
- enterprise scale architecture

---

# 9. Information Architecture

The site should be organised into the following major sections:

## Public-facing
- Home
- About
- How It Works
- Courses / Membership / Join
- Newsletter
- Sign In / Sign Up

## Logged-in areas
- Studio
- Workshop
- Library
- Reading Room
- Snippets
- Cohorts
- Account

## Teacher/admin areas
- Admin Dashboard
- Submissions Queue
- Cohort Overview
- User / Trust Management
- Membership / Payment Overview

---

# 10. Core Product Areas

---

# 10.1 Studio

## Purpose
The logged-in home/dashboard for a user.

## What it should show
- active cohort
- recent submissions
- recent feedback
- recent snippets
- current prompt or writing task
- next recommended action
- possibly upcoming class or event

## Tone
This should feel calm, intelligent, and useful — not like a busy corporate dashboard.

---

# 10.2 Workshop

## Purpose
The core writing, submission, feedback, and revision environment.

This is the **heart of the product**.

## Core actions
- submit work
- receive feedback
- revise work
- resubmit
- track progress through drafts

## Submission formats
V1 should support:

- pasted rich text (**primary / preferred**)
- Word docs
- PDFs

## Important product decision
The system should treat **browser-readable text as the canonical experience**.

Why:
- it supports inline feedback better
- it avoids clumsy download/comment/reupload loops
- it creates a cleaner long-term product

## Feedback requirements
Feedback must support:

- comments attached to exact words, lines, or passages
- summary feedback
- preserved comment history across drafts
- version-aware resubmission
- privacy by default

## Comment types (conceptually)
Could later include:
- suggestion
- question
- praise
- structural note
- line-level note
- developmental note

---

# 10.3 Snippets

## Purpose
A writer’s **commonplace system**.

This is one of the most distinctive parts of the product.

## Core idea
Users should be able to save any short passage (up to a sensible paragraph limit) from:

- reading material
- tutor notes
- their own writing
- peer comments
- handouts
- lesson content

## Why this matters
This creates a writer’s store of:

- images
- openings
- turns of phrase
- structures
- observations
- cadences
- dialogue moves
- insights
- reminders

This is **not plagiarism support**. It is a “stand on the shoulders of giants” tool — a structured commonplace book for creative craft.

## Snippet properties
Each snippet should ideally include:
- text
- source or origin
- tags
- privacy setting
- date saved

## Privacy model
Snippets should be:
- private by default or by user choice
- optionally shareable with cohort
- optionally publishable to a communal “Commonplace Wall”

## Behaviour
Snippets should be:
- searchable
- filterable
- re-readable
- resurfaced periodically (Readwise-style)

## Strategic importance
This is not a minor feature. It is a signature differentiator.

---

# 10.4 Reading Room

## Purpose
A refined reading environment for:

- handouts
- model texts
- extracts
- lessons
- annotations
- saved highlights

## Reading design principles
The Reading Room should feel:

- calm
- focused
- spacious
- elegant
- highly legible

## Features / behaviours
- clean single-column reading layout
- restrained line length
- high readability
- save snippet from selected text
- future-friendly annotation/highlight architecture
- optional discussion layer later

## Reader controls
Eventually support:
- font size adjustment
- reading mode toggle
- dark/light mode
- focus mode

This should feel more like **Kindle meets editor’s room** than a normal web page.

---

# 10.5 Library

## Purpose
A structured repository of teaching material and creative resources.

## Content types
- HTML handouts
- downloadable PDFs
- prompts
- exercises
- craft notes
- readings
- revision guides
- teaching notes

## Initial emphasis
The first structured learning emphasis should be **short story writing**.

## Future expansion
The architecture should support:
- poetry
- novels
- shared craft teaching across forms

## Organising principle
The site should support both:
- a fixed structured path
- a growing library

---

# 10.6 Cohorts

## Purpose
To help writers feel part of a living group rather than isolated users.

## V1 cohort definition
A cohort should initially be simple:

- a group of around 5–8 writers
- starting together
- linked to a run or term
- likely centred initially on short story work

## Persistence
Old cohorts should remain accessible indefinitely as alumni spaces.

## Why this matters
The platform should help preserve:
- continuity
- belonging
- accountability
- shared growth

## Future matching signals (later, not v1 complexity)
Potential future matching signals include:
- genre preference
- level
- preferred feedback style
- writing frequency
- temperament
- age/stage
- ambition
- sex / gender preference
- all-male / all-female or other preference-based group options

These are good future ideas, but v1 should keep matching simple.

---

# 10.7 Freewriting Tool

## Purpose
To support fluency, confidence, and momentum in drafting.

This fits the teaching philosophy of reducing inhibition and encouraging movement on the page.

## Ideal behaviours
- timed writing sessions (Pomodoro-style)
- visible countdown
- optional prompts
- strong “keep the pen moving” framing
- optional encouraging prompts or spoken encouragement

## Strategic value
This is not just decorative. It directly supports writing psychology.

---

# 11. Roles and Permissions

## User roles (conceptual)
- Student
- Trusted Reader
- Teacher

## Teacher
Full control.

Initially, Mark is the sole teacher/admin.

## Trusted Reader
A special peer role that allows controlled commenting / feedback.

## Why this matters
Peer feedback should **not** be fully open from the beginning.

## Rules for peer feedback
- feedback should be private by default
- teacher decides who can comment
- Trusted Reader status may be granted manually
- it may later be earned
- it must be revocable

This protects quality and reduces bad or overbearing peer dynamics.

---

# 12. Content Taxonomy

The platform should support a shared craft taxonomy across forms.

## Foundational craft categories
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

## Why this matters
Poetry, short stories, and novels share many underlying craft concerns. The taxonomy should reflect that.

---

# 13. Live Teaching and Class Delivery

## V1 delivery modes
The platform should support a mixture of:

- Zoom-linked or embedded live sessions
- prerecorded video where useful
- text-first lesson delivery
- handouts and readings

## Important note
The site does **not** need heavy course module logic in v1.

A clean, well-organised resource system is sufficient initially.

## Assignments
Assignments may be attached to lessons later, but this is not mandatory for v1.

---

# 14. Monetisation Strategy

## Core commercial psychology
The product should feel easy and companionable to join, not sales-heavy.

## Recommended initial model
### Free tier
A free tier with meaningful access, but some constraint such as:
- limited number of submissions
- limited cohort participation
- limited advanced features

### Paid tier
A very low-friction membership, such as:
- **£1/month**
- annual option later at a discounted effective rate

### Later additions
- separate paid cohort/course enrolment
- premium experiences
- teacher-led programmes

## Important strategic rule
Payments should remain **secondary** to building the core learning loop well.

Do not distort the product architecture around billing too early.

---

# 15. Newsletter and Audience Growth

A newsletter should exist as part of the public site strategy.

## Why
Because the platform should not depend entirely on immediate paid conversion.

It should also support:
- literary presence
- thought leadership
- gentle audience building
- alumni retention
- future course launches

This can be lightweight in v1.

---

# 16. Admin and Operations

The admin side should reduce friction for Mark and support editorial judgment.

## Useful admin areas
- submissions awaiting review
- recent student activity
- cohort health / participation
- snippet usage
- membership / payment visibility
- moderation / permissions
- trusted reader assignment / removal

## Important principle
Admin should not become a data dump.

It should support:
- decisions
- triage
- editorial oversight
- calm management

---

# 17. Data Ownership and Ethics

This should be an explicit product and marketing strength.

## Product principle
Users own their writing.

## This should be clearly stated
- users own their submissions
- users retain authorship
- users can export their work
- users can delete their data
- feedback does not transfer ownership

## Why this matters
This is ethically correct and strategically useful in a world where creators are increasingly wary of platforms.

---

# 18. Privacy and Compliance

Because the initial audience is mainly UK-based, the product should be designed with GDPR-aware thinking from the start.

## This includes
- clear privacy language
- consent handling where needed
- cookie handling only if genuinely required
- account data export / deletion
- user control over visibility and sharing

Privacy should feel respectful and serious, not bureaucratic.

---

# 19. Technical Direction

## Agreed technical posture
Lean, static-first, low-cost, maintainable.

## Preferred stack
- **Eleventy (11ty)**
- **Nunjucks**
- **GitHub**
- **Netlify**

## Architectural preference
Use a **static-first architecture with progressive enhancement**.

Use dynamic or server-side functionality only where truly needed.

## Likely dynamic areas later
- authentication
- protected submissions
- feedback persistence
- snippet persistence
- teacher/admin actions
- payments
- private messaging if added

## Important technical principle
Do **not** assume React or a heavy JavaScript frontend unless clearly justified later.

Prefer:
- semantic HTML
- clean CSS
- minimal JavaScript
- maintainable structure
- progressive enhancement

---

# 20. Design Direction

## Overall visual direction
The site should be:

- dark-mode-first
- spacious
- elegant
- literary
- premium
- calm
- typography-led

## Visual references (in spirit)
- literary journal
- private members’ club
- notebook / writing desk
- editor’s room

## Design values
- whitespace matters
- typography matters
- line length matters
- reading comfort matters
- interface restraint matters

## Avoid
- overuse of cards
- noisy dashboard patterns
- bright SaaS gradients
- educational gamification
- cluttered sidebars
- excessive visual chrome

---

# 21. Reading Experience Principles

Because reading is central, the site should be informed by good reading ergonomics.

## The reading interface should favour:
- single-column layout
- restrained line length
- high legibility
- calm spacing
- strong hierarchy
- minimal distraction

## It should eventually support:
- font size controls
- dark/light mode
- reading focus mode
- potentially reading progress or save-for-later behaviour

The reading interface should feel like a place people actually want to stay.

---

# 22. V1 Build Priorities

The build should happen in a disciplined order.

## Recommended implementation order

### Phase 1 — Architecture and system planning
- define folder structure
- define route map
- define component list
- define content model
- define what must be dynamic vs static

### Phase 2 — Public-facing and structural foundation
- landing page
- about page
- how it works
- membership / join placeholder
- newsletter placeholder
- global layout and design system
- typography and spacing foundations

### Phase 3 — Protected user experience
- Studio
- Workshop
- Library
- Reading Room
- Snippets
- Cohorts
- Account

### Phase 4 — Core interaction prototypes
- submission flow
- inline feedback UI
- snippet capture flow
- admin dashboard concepts

### Phase 5 — Dynamic layer decisions
Only then decide the lightest realistic approach for:
- auth
- persistence
- protected workflows
- later payments

---

# 23. Non-Goals for V1

The following should be considered out of scope or deliberately deprioritised for v1:

- full social network functionality
- open commenting for all users
- sophisticated cohort matching algorithms
- marketplace for multiple teachers
- AI writing generation or rewriting
- heavy analytics
- enterprise-scale architecture
- elaborate billing and subscription systems
- overbuilt gamification

These may be revisited later if useful, but should not distort the first build.

---

# 24. What Will Make shortstory.ink Distinctive

If the site gets only three things truly right, it will already be unusually strong:

## 1. Inline feedback that feels exact and humane
Comments should remain attached to the text they refer to.

## 2. A snippet/commonplace system that helps writers collect craft
Writers should feel they are building a personal reservoir of literary intelligence.

## 3. A calm, beautiful, psychologically intelligent reading environment
People should actually want to read, think, and stay.

These are the core differentiators.

---

# 25. Final Product Test

The first build should answer this question:

> **Can a writer arrive, read beautifully, submit work, receive comments where the text is, save what matters, and feel held by the system?**

If the answer is yes, the product is on the right track.

If the answer is no, the build is drifting.

---

# 26. Build Guardrail

Whenever a product or implementation decision is unclear, choose the option that best preserves:

- elegance
- readability
- calm UX
- teacher control
- inline feedback
- snippet capture
- the submission → feedback → revision loop
- low technical complexity
- literary seriousness

---

# 27. Closing Statement

shortstory.ink should not simply be a writing website.

It should become a **digital extension of Mark’s teaching mind, philanthropy, personality, and grace**.

That ambition is not excessive. It is the correct ambition.

The key is to build it in a disciplined way:

- humane first
- useful first
- elegant first
- small and real first

Everything else can grow around that.