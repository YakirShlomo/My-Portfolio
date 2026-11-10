---
title: Project artwork follows the portfolio palette
author: Yakir
date: 2026-11-10
branch: main
id: l-8a325300
scope: repo
status: active
src: agent
touches:
  - src/data/projects.js
  - src/sections/Projects/Projects.css
  - src/sections/Projects/Projects.jsx
---

## Decided
Project cover images should match the portfolio's charcoal and cyan palette, as explicitly requested by the user after reviewing the first warm beige set. Preserve the distinct subjects while matching background, materials and lighting to the site so cards feel cohesive.

In the code: src/styles/tokens.css defines backgrounds #07070a and #131319 and accent #6fc7d6. Apply these to public/images/projects/*.webp and the image prompts in docs/project-image-prompts.md. Avoid warm beige backgrounds for this portfolio.
