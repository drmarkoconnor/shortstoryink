# shortstory.ink — Prompt Library

## Purpose

This file contains the main operational prompts for building and maintaining **shortstory.ink**.

These prompts are not intended to replace the product brief.

They exist to help the coding model:

- stay focused on the current task
- avoid drift
- avoid overengineering
- preserve the design and product intent
- produce more reliable output

---

# 0. How to Use This Prompt Library

## Important principle

The product brief and foundational documents already define the product at a strategic level.

That means prompts should **not** be used to repeatedly re-describe the whole product.

Instead, prompts should be used to:

- focus the model on the current task
- reduce drift
- constrain implementation
- specify what output is wanted
- tell the model when to stop

## Use the product brief to define:
- vision
- design philosophy
- scope
- architecture bias
- non-goals

## Use prompts to define:
- today’s job
- current files
- success criteria
- constraints
- output shape

## Prompting rule of thumb

A good build prompt should answer these five things:

1. What is the task?
2. What does success look like?
3. What constraints apply?
4. What files or surfaces matter?
5. Should the model plan, code, review, or stop?

## Default instruction for all prompts

Unless explicitly told otherwise, the coding model should:

- preserve elegance
- preserve simplicity
- preserve the static-first Eleventy architecture
- avoid overengineering
- avoid unnecessary JavaScript
- avoid feature sprawl
- avoid generic SaaS patterns
- prefer the smallest worthwhile solution first

---

# 1. Everyday General Build Prompt

Use this for most normal development tasks.

```md
Task: Help me with one specific build task in shortstory.ink.

Context:
- Read /docs/product-brief.md and the prompt foundation files first
- This is an Eleventy-based, static-first, literary writing platform
- Preserve elegance, simplicity, readability, and the core learning loop

Today’s task:
[INSERT TODAY’S TASK]

Objective:
[INSERT WHAT SUCCESS LOOKS LIKE]

Relevant files:
[paste only what matters]

Constraints:
- Do not overengineer
- Do not refactor unrelated parts
- Do not introduce a framework
- Prefer the smallest viable solution first
- Preserve the existing design direction

What I want back:
1. Diagnosis or implementation plan
2. Exact files affected
3. Code if appropriate
4. Risks or tradeoffs
5. What I should test next

Pause if the task is ambiguous or if a bigger architectural decision is required.