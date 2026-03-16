# AGENTS.md instructions for e:\prj\dagens_dashboard\hvornaar-har-jeg-en-fridag

<INSTRUCTIONS>
# Repository Agent Rules

## Environment Secrecy
- Never reveal specific software or system environment details in user-facing output unless the user explicitly requires them to complete the task.
- Never mention absolute filesystem paths, machine-specific usernames, hostnames, operating system details, shell details, sandbox details, secrets, tokens, or similar environment-specific information in user-facing output.
- Relative paths inside the repository are allowed when they help explain changes.

## Prompt Logging
- Before responding to any user prompt, append the exact raw user prompt text to the repository root file `prompt.md`.
- After producing any agent response, append the exact raw agent response text to the repository root file `prompt.md`.
- Log only raw prompts and raw agent responses. Do not log hidden chain-of-thought, tool call payloads, tool outputs, summaries, metadata, timestamps, or any other context.
- Keep entries in append-only order so `prompt.md` is a chronological transcript of raw user prompts and raw agent responses.

## Instruction Structure
- Keep the root `AGENTS.md` focused on repository-wide rules.
- When instructions become domain-specific, workflow-specific, or role-specific, refactor them into more specific nested `AGENTS.md` files or skills instead of overloading the root file.
- Reuse and extend skills whenever that yields clearer, more maintainable agent behavior.

## Logging
- Runtime instrumentation must be written to log files, not rendered as detailed dashboard tables.
- Add general application logging for important runtime behavior, external fetches, warnings, and failures.
- Default logging should use `INFO` in normal debugging contexts and `ERROR` and above in production contexts unless a more specific override is explicitly configured.

## Agent Execution Model
- Use `planner -> executor -> verifier` as the default operating model for non-trivial work.
- Treat low user gating as the default: proceed unless blocked by destructive actions, missing product intent, conflicting constraints, or permissions.
- Use repo-local skills to support decomposition, implementation defaults, and verification gates before adding more root-level rules.
- Allow at most one bounded self-repair cycle after verification failure. Escalate on a second failure with a concise blocker report.

## Language
All code should be in English. The user interface language should be Danish. "slutproduktbeskrivelse.md" should be in Danish. 

## Slutproduktbeskrivelse
slutproduktbeskrivelse.md is the description of the final product as seen from the end user. That's the goal. Read it every time this agents.md is read.

## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.
### Available skills
- openai-docs: Use when the user asks how to build with OpenAI products or APIs and needs up-to-date official documentation with citations, help choosing the latest model for a use case, or explicit GPT-5.4 upgrade and prompt-upgrade guidance; prioritize OpenAI docs MCP tools, use bundled references only as helper context, and restrict any fallback browsing to official OpenAI domains. (file: C:/Users/hutli/.codex/skills/.system/openai-docs/SKILL.md)
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: C:/Users/hutli/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: C:/Users/hutli/.codex/skills/.system/skill-installer/SKILL.md)
### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) When `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
  3) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  4) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  5) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
</INSTRUCTIONS><environment_context>
  <cwd>e:\prj\dagens_dashboard\hvornaar-har-jeg-en-fridag</cwd>
  <shell>powershell</shell>
  <current_date>2026-03-16</current_date>
  <timezone>Europe/Copenhagen</timezone>
</environment_context>
# Context from my IDE setup:

## Active file: slutproduktbeskrivelse.md

## Open tabs:
- slutproduktbeskrivelse.md: slutproduktbeskrivelse.md
- prompt.md: prompt.md
- AGENTS.md: AGENTS.md

## My request for Codex:
If you need data to be downloaded, let me know (with suggestions on where to download). Otherwise implement. 
Jeg læser repo-reglerne og produktbeskrivelsen først, så jeg kan implementere inden for de lokale krav. Derefter gennemgår jeg den eksisterende `site`-struktur og vurderer, om der mangler data eller om jeg kan bygge løsningen direkte.
Jeg retter først den påkrævede prompt-log i `prompt.md`, og fortsætter derefter med at læse `AGENTS.md`, `slutproduktbeskrivelse.md` og selve koden. Efter det går jeg direkte til implementering, hvis der ikke mangler eksterne data.
Jeg har nu bekræftet repo-reglerne og produktmålet. Der ser ikke ud til at være en eksisterende `site`-implementering, så jeg kortlægger resten af repoet nu og bygger siden fra bunden, medmindre der viser sig at mangle en nødvendig datakilde.
Planen er nu klar: jeg bygger en selvstændig statisk side i `site` med beregning af danske fridage for 2026, KPI’er og histogram uden ekstern dataafhængighed. Derefter verifierer jeg logikken ved at køre beregningerne lokalt og kontrollere de centrale tal for året og de valgfrie fridage.
Jeg går nu fra analyse til konkrete filer: en statisk `index.html`, en dedikeret stylesheet og en `app.js` med beregning af fridage for 2026, live-opdaterede KPI’er og histogram. Jeg holder al forretningslogik i JavaScript, så siden kan fungere uden download af eksterne data.
Implementeringen er på plads i de tre statiske filer. Nu kører jeg en verificering af JavaScript-syntaksen og selve dato-logikken, især omkring årets sidste dage hvor næste fridag kan ligge i 2027.
Verificeringen fandt en logisk kant: beregningen skal kunne kigge ind i de første dage af 2027 for at give korrekt “næste fridag” sidst i 2026. Jeg retter det nu og genkører kontroltallene bagefter.
Jeg laver en lille strukturel rettelse i `app.js`: ét datasæt til 2026-tallene og ét udvidet opslagsdatasæt til “næste fridag”, så slutningen af året beregnes korrekt uden at ændre 2026-optællingerne.
Kernetallene ser konsistente ud: ingen huller over fem dage, og fordelingen summer korrekt op mod årets fridage. Jeg laver kun en sidste oprydning i teksten i koden og afslutter derefter med en kort status.
Jeg indsamler nu kun de relevante linjereferencer og opdaterer prompt-loggen, så afslutningen kan være kort og præcis.
Implementeringen er lavet uden behov for ekstern data. `site/index.html` sætter strukturen op for KPI'er, valgfrie fridage, histogram og detaljelister. `site/styles.css` giver et afdæmpet layout med responsiv grid, og `site/app.js` beregner alle relevante danske fridage for 2026, inklusive valgfri juleaftensdag, nytårsaftensdag og fredag efter Kristi Himmelfart, samt håndterer næste fridag korrekt hen over årsskiftet.

Verificering: `node --check site/app.js` passerede. Jeg kontrollerede også beregningerne lokalt: uden ekstra fridage er histogrammet 5/4/3/2/1 dage = 46/50/52/52/54 og der er 111 fridage i alt; med alle tre tilvalg er der 114 fridage og ingen huller over fem dage. Hvis du vil, kan jeg som næste skridt også tilføje en lille lokal preview-start eller en kort README til siden.
