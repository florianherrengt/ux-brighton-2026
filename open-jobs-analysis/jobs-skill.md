# Skills in demand, by role

What companies ask for in job postings, measured over real openings. Method: for each role a
generic mid-level probe JD was written, embedded, and used to pull the 12 nearest job clusters
(~2.8k–3.9k postings per role) from a ~2M-posting crawl on 2026-09-09. After removing templated
duplicates, percentages are computed on the role-titled subset (title matches the role, full-stack
excluded from frontend/backend). All markets, all seniorities (restricting UX to US/UK or to the
last 90 days changed nothing material). Percentages = share of postings whose description mentions
the skill (keyword matching over full text — floors, not upper bounds; snapshot of currently-open
postings, not a historical archive).

## Cross-role snapshot

| Role | Postings | Most-demanded skill | AI mentioned | Degree asked | Junior-titled |
|---|---|---|---|---|---|
| UX Designer | 1,500 | Cross-functional collaboration (80%) | 32% | 16% | ~2% |
| Designer (product/visual/UI) | 1,366 | Cross-functional collaboration (82%) | 34% | 17% | 2% |
| Product Manager | 1,109 | Roadmap ownership (76%) | **42%** | 16% | 2% |
| Frontend Engineer | 512 | React / Next.js (74%) | 16% | 21% | 3% |
| Backend Engineer | 456 | System design / scalability (70%) | 21% | 14% | 1% |
| QA Engineer | 1,093 | Test plans / cases / strategy (72%) | **9%** | **32%** | 4% |
| Platform / DevOps Engineer | 774 | Observability / monitoring (77%) | 19% | 23% | 2% |

Cross-role notes:
- **AI demand peaks at Product Manager (42%)** — companies want PMs who can ship AI features —
  and is strong in design (32–34%). Engineering sits at 16–21%; **QA is the laggard (9%)**.
- Every role has one unmistakable anchor: Figma + design systems (design), roadmap ownership
  (PM), React + TypeScript (frontend), system design + cloud (backend), test automation (QA),
  Kubernetes + Terraform + observability (platform).
- **Degrees are weakest in backend (14%)** and strongest in QA (32%, plus ISTQB 18%).
- Junior pipelines are thin everywhere: 1–4% of postings across all seven roles.
- **How demand shifts with experience (consistent in every role):** specific tools are the
  junior screen (Figma, Adobe, HTML/CSS, SQL) while systems thinking and people skills are the
  senior screen (design systems, mentoring, stakeholders, roadmap/commercial ownership). And
  degrees are asked more of juniors than seniors — the credential matters least where experience
  substitutes for it.

---

## UX Designer (n = 1,500)

### High-level clusters
Share of postings that ask for **at least one** skill in the cluster.

| Cluster | In demand |
|---|---|
| Collaboration & communication | **90%** |
| Design craft & methods | **85%** |
| Named design tools | **63%** |
| Credentials (portfolio, degree) | **60%** |
| User research & validation | **46%** |
| AI fluency | **32%** |
| Coding adjacency | **14%** |

### Granular
| Skill | Category | Postings asking |
|---|---|---|
| Cross-functional collaboration | Process & soft skills | **80%** |
| Portfolio required | Credentials | **54%** |
| Figma | Tools — design | **53%** |
| Design systems | Craft — core design | **52%** |
| Prototyping | Craft — core design | **51%** |
| Presenting / storytelling | Process & soft skills | 39% |
| Adobe (XD / Illustrator / Photoshop) | Tools — design | 30% |
| Visual / UI design | Craft — core design | 30% |
| AI tools (GenAI / LLM mentions) | AI fluency | 32% |
| User research | Research & validation | 25% |
| Accessibility (WCAG / ADA) | Craft — core design | 26% |
| Wireframing | Craft — core design | 24% |
| Motion design / microinteractions | Craft — core design | 20% |
| Analytics / metrics / KPIs | Research & validation | 18% |
| Interaction design | Craft — core design | 18% |
| Mentoring | Process & soft skills | 17% |
| Degree (bachelor / master) | Credentials | 16% |
| Usability testing | Research & validation | 15% |
| User flows | Craft — core design | 15% |
| Responsive / mobile | Craft — core design | 15% |
| Journey mapping | Research & validation | 12% |
| HTML / CSS | Engineering adjacency | 11% |
| Workshop facilitation | Process & soft skills | 11% |
| Design handoff | Process & soft skills | 10% |
| Agile / scrum / sprints | Process & soft skills | 10% |
| Information architecture | Craft — core design | 9% |
| Sketch | Tools — design | 8% |
| A/B testing / experimentation | Research & validation | 6% |
| JavaScript | Engineering adjacency | 6% |
| Design thinking | Craft — core design | 5% |
| Content design / UX writing | Craft — core design | 5% |
| React | Engineering adjacency | 5% |
| User / customer interviews | Research & validation | 4% |
| Personas | Research & validation | 4% |
| Webflow | Tools — design | 3% |
| Framer | Tools — design | 3% |
| Surveys | Research & validation | 3% |
| Miro / FigJam / Mural | Tools — design | 2% |
| InVision | Tools — design | 2% |
| Google Analytics / GA4 | Tools — research & analytics | 2% |
| Notion | Tools — project & docs | 2% |
| Service design | Craft — core design | 2% |
| Maze / Hotjar / UserTesting / Dovetail | Tools — research & analytics | ≤1% each |
| Jira / Confluence / Asana / Trello | Tools — project & docs | ≤1% each |
| Heuristic evaluation / UX audit | Research & validation | 1% |

UX reading notes: Figma is the only tool that matters on the page (named research tools <2% —
research craft is wanted, tooling assumed). Soft skills outrank craft in raw frequency; the
portfolio (54%) has replaced the degree (16%). AI appears in 32% overall and 38% of postings from
the last 90 days. Only ~2% of postings are junior-titled.

### What changes with seniority
junior 47 · mid 777 · senior+ 676 (title-based; junior columns are thin — indicative only)

| Rises with seniority | Junior | Mid | Senior+ | Δ (S−J) |
|---|---|---|---|---|
| Design systems | 43% | 44% | 62% | +19 |
| Mentoring | 13% | 6% | 29% | +16 |
| Analytics / metrics / KPIs | 9% | 16% | 21% | +12 |
| Stakeholder management | 30% | 30% | 38% | +8 |
| Interaction design | 15% | 15% | 22% | +7 |

**Junior screen (asked most at entry):** Figma 79% → 50% · Portfolio 70% → 51% · Adobe 43% → 18% ·
Wireframing 34% → 22% · Usability testing 26% → 15% · Degree 23% → 13%

**Takeaway:** juniors are hired on tool execution and proof-of-craft (Figma, wireframes, portfolio);
seniors on systems thinking (design systems), mentoring, and outcome metrics. Figma is listed
*less* for seniors — it's assumed.

---

## Product Manager (n = 1,109 · 92% senior+-titled)

### High-level clusters
| Cluster | In demand |
|---|---|
| Craft & discovery (roadmap, discovery, PRDs, prioritization, technical fluency) | **94%** |
| Leadership (stakeholders, cross-functional, mentoring, presenting) | **81%** |
| Strategy (GTM/launch, business acumen, B2B) | **79%** |
| Data & experimentation (metrics, analytics, SQL, A/B) | **59%** |
| AI (GenAI / LLM) | **42%** |
| Delivery (agile/scrum) | **25%** |
| Credentials | **16%** |
| Tools (Jira/Confluence) | **7%** |

### Granular
| Skill | Category | Postings asking |
|---|---|---|
| Roadmap ownership | Craft & discovery | **76%** |
| Prioritization frameworks | Craft & discovery | **69%** |
| Stakeholder management | Leadership | 55% |
| Go-to-market / launch | Strategy | 53% |
| OKRs / KPIs / metrics | Data & experimentation | 50% |
| Cross-functional leadership | Leadership | 47% |
| B2B / enterprise | Strategy | 44% |
| AI (GenAI / LLM) | AI | **42%** |
| User research / discovery | Craft & discovery | 41% |
| PRD / requirements writing | Craft & discovery | 37% |
| Business / commercial acumen | Strategy | 36% |
| Technical fluency (APIs) | Craft & discovery | 29% |
| Agile / scrum | Delivery | 25% |
| Mentoring / hiring | Leadership | 22% |
| Data-driven decisions | Data & experimentation | 17% |
| Degree / MBA | Credentials | 16% |
| Presentation / storytelling | Leadership | 13% |
| SQL / data querying | Data & experimentation | 7% |
| Jira / Confluence | Tools | 7% |
| A/B testing & experimentation | Data & experimentation | 5% |
| Product analytics tools | Data & experimentation | 4% |

### What changes with seniority
junior 10 · mid 479 · senior+ 620 (junior bucket very small — indicative only)

| Rises with seniority | Junior | Mid | Senior+ | Δ (S−J) |
|---|---|---|---|---|
| Roadmap ownership | 40% | 74% | 78% | +38 |
| B2B / enterprise | 10% | 43% | 46% | +36 |
| User research / discovery | 30% | 38% | 44% | +14 |
| Go-to-market / launch | 40% | 52% | 53% | +13 |
| Business / commercial acumen | 30% | 29% | 40% | +10 |

**Junior screen (asked most at entry):** SQL 40% → 6% · Agile/scrum 40% → 19% · Technical fluency
(APIs) 50% → 30% · PRD writing 50% → 33% · A/B testing 30% → 4%

**Takeaway:** junior PM postings screen for hands-on execution artifacts (PRDs, SQL, agile
ceremony); senior postings screen for ownership — roadmap, commercial acumen, enterprise scope.
Note the title-based split undercounts PM seniority: 'Product Manager' alone is already a
mid/senior role, so the true junior population is close to zero.

---

## Designer — product/visual/UI (n = 1,366)

### High-level clusters
| Cluster | In demand |
|---|---|
| Craft (visual identity, systems, prototyping, motion, illustration) | **95%** |
| Soft skills (collaboration, stakeholders, presenting, mentoring) | **91%** |
| Tools — design | **63%** |
| Credentials (portfolio, degree) | **61%** |
| AI tools | **34%** |
| Research | **33%** |

### Granular
| Skill | Category | Postings asking |
|---|---|---|
| Cross-functional collaboration | Soft skills | **82%** |
| Brand / visual identity | Craft | **63%** |
| Portfolio required | Credentials | **55%** |
| Figma | Tools — design | **53%** |
| Design systems | Craft | **52%** |
| Prototyping | Craft | 48% |
| Presenting / storytelling | Soft skills | 42% |
| AI tools (GenAI / LLM) | AI | **34%** |
| Stakeholder management | Soft skills | 32% |
| Adobe (XD / Illustrator / Photoshop) | Tools — design | 31% |
| Visual / UI design | Craft | 30% |
| Illustration / 3D | Craft | 27% |
| User research | Research | 24% |
| Accessibility (WCAG) | Craft | 23% |
| Motion design | Craft | 21% |
| Wireframing | Craft | 20% |
| Journey mapping / flows | Research | 19% |
| Interaction design | Craft | 17% |
| Mentoring | Soft skills | 17% |
| Degree | Credentials | 17% |
| Information architecture | Craft | 9% |
| Sketch | Tools — design | 6% |
| Content design / UX writing | Craft | 4% |
| Webflow | Tools — design | 3% |
| Framer | Tools — design | 3% |

Compared to the UX-only slice, the broader designer market leans more on **brand/visual identity
(63%)** and **illustration/3D (27%)** — agency and marketing-adjacent design shows up here.

### What changes with seniority
junior 28 · mid 736 · senior+ 602 (junior columns thin — indicative only)

| Rises with seniority | Junior | Mid | Senior+ | Δ (S−J) |
|---|---|---|---|---|
| Mentoring | 0% | 7% | 29% | +29 |
| Stakeholder management | 11% | 29% | 38% | +27 |
| Design systems | 36% | 46% | 61% | +25 |
| Prototyping | 43% | 41% | 57% | +14 |
| Visual / UI design | 21% | 31% | 29% | +8 |

**Junior screen (asked most at entry):** Figma 86% → 49% · Brand/visual identity 82% → 54% ·
Adobe 54% → 19% · Motion design 46% → 21% · Illustration/3D 43% → 18% · Portfolio 71% → 52%

**Takeaway:** the sharpest gradient of all roles: juniors are screened almost entirely on
craft execution (tools, visual/brand work); seniors on people (mentoring, stakeholders) and
systems (design systems).

---

## Frontend Engineer (n = 512 · fullstack excluded)

### High-level clusters
| Cluster | In demand |
|---|---|
| Languages (JS, TS, Node) | **89%** |
| Frameworks (React, state, design systems, mobile) | **88%** |
| Core web (HTML/CSS, responsive, REST, GraphQL, SEO) | **79%** |
| Testing & quality (unit/E2E, a11y, performance) | **59%** |
| Collaboration (code review, mentoring, agile) | **51%** |
| Tooling & infra (git, CI/CD) | **37%** |
| Credentials | **21%** |
| AI (Copilot / GenAI) | **16%** |

### Granular
| Skill | Category | Postings asking |
|---|---|---|
| React / Next.js | Frameworks | **74%** |
| JavaScript | Languages | **72%** |
| TypeScript | Languages | **60%** |
| Responsive / cross-browser | Core web | 47% |
| HTML / CSS | Core web | 45% |
| Code review / mentoring | Collaboration | 41% |
| Accessibility (WCAG / ARIA) | Testing & quality | 38% |
| State management (Redux etc.) | Frameworks | 30% |
| REST APIs | Core web | 30% |
| Tailwind / Sass | Core web | 27% |
| Design systems / Storybook | Frameworks | 27% |
| Web performance (Core Web Vitals) | Testing & quality | 25% |
| Git | Tooling & infra | 24% |
| Agile / scrum | Collaboration | 23% |
| Degree | Credentials | 21% |
| Angular | Frameworks | 20% |
| Unit / component testing | Testing & quality | 20% |
| CI/CD | Tooling & infra | 19% |
| Vue | Frameworks | 17% |
| GraphQL | Core web | 17% |
| AI tools (Copilot / GenAI) | AI | 16% |
| E2E testing | Testing & quality | 15% |
| Real-time (WebSocket) | Core web | 14% |
| Node.js | Languages | 13% |
| Mobile (React Native / Flutter) | Frameworks | 12% |
| SEO | Core web | 6% |
| Svelte | Frameworks | <3% |

### What changes with seniority
junior 14 · mid 248 · senior+ 250 (junior columns thin — indicative only)

| Rises with seniority | Junior | Mid | Senior+ | Δ (S−J) |
|---|---|---|---|---|
| Design systems / Storybook | 7% | 21% | 34% | +27 |
| Web performance | 7% | 21% | 30% | +23 |
| CI/CD | 0% | 17% | 22% | +22 |
| Code review / mentoring | 29% | 33% | 50% | +21 |
| TypeScript | 50% | 54% | 66% | +16 |
| React / Next.js | 64% | 71% | 77% | +13 |
| Accessibility (WCAG / ARIA) | 29% | 36% | 41% | +12 |

**Junior screen (asked most at entry):** HTML/CSS 71% → 39% · Git 43% → 20% · Degree 43% → 20% ·
JavaScript 79% → 68%

**Takeaway:** juniors are hired on the raw web platform (HTML/CSS/JS); seniors on the
architecture around it — performance, design systems, delivery pipeline, and mentoring.

---

## Backend Engineer (n = 456 · fullstack excluded)

### High-level clusters
| Cluster | In demand |
|---|---|
| Languages (Python, Go, Java, Node…) | **91%** |
| APIs & architecture (system design, microservices, queues) | **91%** |
| Cloud & infra (AWS/GCP/Azure, Docker/K8s, CI/CD, IaC) | **85%** |
| Data stores (SQL, NoSQL/caching) | **59%** |
| Quality & security | **54%** |
| Collaboration | **48%** |
| AI / LLM integration | **21%** |
| Credentials | **14%** |

### Granular
| Skill | Category | Postings asking |
|---|---|---|
| System design / scalability | APIs & architecture | **70%** |
| AWS / GCP / Azure | Cloud & infra | 58% |
| Microservices / distributed systems | APIs & architecture | 55% |
| Security / OWASP | Quality & security | 48% |
| Agile / code review / mentoring | Collaboration | 48% |
| SQL / relational DBs | Data stores | 47% |
| Docker / Kubernetes | Cloud & infra | 46% |
| Observability | Cloud & infra | 44% |
| Python | Languages | **39%** |
| Go | Languages | 38% |
| REST / API design | APIs & architecture | 38% |
| Message queues / streaming | APIs & architecture | 34% |
| CI/CD | Cloud & infra | 34% |
| NoSQL / caching | Data stores | 33% |
| Java / Kotlin | Languages | 29% |
| Node.js | Languages | 22% |
| AI / LLM integration | AI | 21% |
| GraphQL / gRPC | APIs & architecture | 17% |
| Terraform / IaC | Cloud & infra | 15% |
| Degree | Credentials | 14% |
| Testing (unit / integration) | Quality & security | 11% |
| Ruby / PHP | Languages | 9% |
| C# / .NET | Languages | 7% |
| Rust | Languages | 7% |
| Linux | Cloud & infra | 6% |

### What changes with seniority
junior 6 · mid 155 · senior+ 295 (junior bucket n=6 — indicative only, near-zero junior postings)

| Rises with seniority | Junior | Mid | Senior+ | Δ (S−J) |
|---|---|---|---|---|
| Docker / Kubernetes | 17% | 46% | 46% | +29 |
| Message queues / streaming | 17% | 26% | 38% | +21 |
| Python | 17% | 39% | 39% | +22 |
| AI / LLM integration | 0% | 20% | 22% | +22 |
| Agile / code review / mentoring | 33% | 39% | 54% | +21 |
| Observability | 33% | 37% | 48% | +15 |

**Junior screen (asked most at entry):** Go 50% → 36% · Rust 17% → 5% · Linux 17% → 5% · Degree
33% → 17%

**Takeaway:** backend junior postings barely exist; language/DB fundamentals are the shared base,
and senior demand adds operational and infra depth — containers, queues, observability, AI
integration.

---

## QA Engineer (n = 1,093)

### High-level clusters
| Cluster | In demand |
|---|---|
| Process & tools (bug tracking, CI/CD, agile) | **82%** |
| Process & craft (test design, regression, exploratory) | **76%** |
| Automation (Selenium, Playwright/Cypress, frameworks) | **74%** |
| Coding & scripting | **64%** |
| API & non-functional (API, performance, security, a11y) | **59%** |
| Credentials (degree, ISTQB) | **43%** |
| AI in testing | **9%** |

### Granular
| Skill | Category | Postings asking |
|---|---|---|
| Test plans / cases / strategy | Process & craft | **72%** |
| Bug / defect tracking (Jira) | Process & tools | 67% |
| Test automation | Automation | **61%** |
| Programming / scripting | Coding & scripting | 52% |
| Agile / scrum | Process & tools | 47% |
| CI/CD | Process & tools | 42% |
| Selenium | Automation | 38% |
| Regression testing | Process & craft | 38% |
| API testing (Postman / REST) | API & non-functional | 33% |
| Degree | Credentials | **32%** |
| SQL | Coding & scripting | 29% |
| Manual / exploratory testing | Process & craft | 27% |
| Playwright / Cypress | Automation | 25% |
| Performance / load testing | API & non-functional | 24% |
| Cross-browser / cross-platform | API & non-functional | 19% |
| ISTQB / certification | Credentials | 18% |
| Unit / integration frameworks | Automation | 15% |
| BDD / TDD | Automation | 13% |
| Appium / mobile testing | Automation | 11% |
| AI in testing | AI | **9%** |
| Security testing | API & non-functional | 7% |
| Accessibility testing | API & non-functional | 5% |

### What changes with seniority
junior 40 · mid 691 · senior+ 362 (the largest junior bucket of all roles — the only role with a
real junior pipeline)

| Rises with seniority | Junior | Mid | Senior+ | Δ (S−J) |
|---|---|---|---|---|
| API testing | 8% | 31% | 41% | +33 |
| Selenium | 32% | 37% | 41% | +9 |
| BDD / TDD | 10% | 11% | 18% | +8 |
| Performance / load testing | 22% | 22% | 29% | +7 |
| SQL | 25% | 29% | 30% | +5 |

**Junior screen (asked most at entry):** Test plans/cases 82% → 75% · Regression 50% → 39% ·
Programming/scripting 58% → 50% · Degree 50% → 32%

**Takeaway:** juniors write test plans and run regressions; seniors own API automation and
non-functional quality (performance). QA has the flattest gradient of all roles — junior and
senior asks are closer here than anywhere else.

---

## Platform / DevOps Engineer (n = 774)

### High-level clusters
| Cluster | In demand |
|---|---|
| Observability & reliability (monitoring, SRE, incidents, networking) | **95%** |
| Cloud & containers (AWS/Azure/GCP, K8s, Docker) | **90%** |
| IaC & automation (Terraform, Linux, Python/Bash/Go) | **90%** |
| Security & compliance | **77%** |
| Collaboration | **74%** |
| CI/CD (incl. GitOps) | **73%** |
| Platform & DevEx (internal platform, self-serve) | **24%** |
| Credentials | **23%** |
| AI (AIOps / LLM ops) | **19%** |

### Granular
| Skill | Category | Postings asking |
|---|---|---|
| Observability / monitoring | Observability & reliability | **77%** |
| Security / compliance | Security | 75% |
| SRE practices (SLO / error budgets) | Observability & reliability | 74% |
| CI/CD | CI/CD | **71%** |
| Kubernetes | Cloud & containers | **70%** |
| Terraform / IaC | IaC & automation | **70%** |
| Agile / cross-functional | Collaboration | 70% |
| Python / Bash / Go | IaC & automation | 66% |
| AWS | Cloud & containers | 61% |
| Networking | Observability & reliability | 58% |
| Docker / containers | Cloud & containers | 56% |
| Incident management / on-call | Observability & reliability | 55% |
| Azure / GCP | Cloud & containers | 48% |
| Linux | IaC & automation | 38% |
| Developer experience / internal platform | Platform & DevEx | 24% |
| Mentoring | Collaboration | 23% |
| Degree | Credentials | 23% |
| AI (AIOps / LLM ops) | AI | 19% |
| GitOps | CI/CD | 17% |
| Cost optimization (FinOps) | Security | 11% |

### What changes with seniority
junior 14 · mid 326 · senior+ 434 (junior columns thin — indicative only)

| Rises with seniority | Junior | Mid | Senior+ | Δ (S−J) |
|---|---|---|---|---|
| Azure / GCP (multi-cloud) | 43% | 45% | 49% | +6 |
| AWS | 57% | 61% | 60% | +3 |
| Python / Bash / Go | 64% | 68% | 64% | +0 |
| SRE practices | 79% | 67% | 78% | −1 |
| Kubernetes | 79% | 69% | 71% | −8 |

**Junior screen (asked most at entry):** Docker 71% → 51% · Incident/on-call 71% → 56% · Linux
43% → 33% · GitOps 29% → 19% · AI (AIOps) 43% → 19%

**Takeaway:** platform is senior-ized end to end — even entry postings demand the full
production stack (Kubernetes ~80%, CI/CD ~80%, security ~80% at junior level). It has the
flattest skill gradient of all roles: there is effectively no separate junior skill ladder, just
narrower scope.
