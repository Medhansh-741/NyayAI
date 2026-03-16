

⚖
NyayaAI
Intelligent Legal Assistance for Every Indian Citizen



Hackathon Build — Production-Grade Agentic Pipeline + Full Dual-Side Marketplace
1. Executive Summary
NyayaAI is a production-grade, multi-agent legal assistance platform built for Indian citizens. It delivers instant legal analysis, document generation, and — in v4.0 — a fully operational dual-sided marketplace connecting citizens to verified lawyers and giving lawyers a purpose-built professional portal.
Version 4.0 completes the marketplace loop. v3.0 gave citizens the ability to discover and contact lawyers. v4.0 builds the lawyer-facing side: a professional dashboard where advocates manage their practice, receive pre-qualified leads with AI-prepared briefs, track case pipelines, and use the same AI-powered legal research tool to strengthen their own work.

What Is New in v4.0
Lawyer Dashboard: A full professional portal for advocates — case pipeline, profile management, earnings overview
Available Cases Feed: Lawyers browse open citizen cases filtered by specialisation, location, and budget
Case Pipeline Management: Pending, Offered, Accepted, and Completed case stages managed in one place
Lawyer Profile Builder: Advocates build and maintain their verified profile — cases, credentials, fees, languages
Speciality Case Feed: Curated feed of cases matching the lawyer's declared specialisations
Unassigned Cases Queue: High-visibility feed of cases with no lawyer response — preventing cases from going stale
Lawyer Legal Explorer: Same AI chatbot as citizens but scoped for professional legal research by law category
2. Problem Statement
2.1 Citizen Side
Legal information is fragmented across hundreds of acts, amendments, and state-level variations
India's criminal law was overhauled in 2023 — IPC replaced by BNS, CrPC by BNSS — most resources are outdated
Professional advice costs ₹2,000–₹10,000+ per consultation — unaffordable for most citizens
When a case needs a lawyer, citizens have no transparent way to compare fees, specialisations, or track records
Lawyer discovery is entirely word-of-mouth — biased, opaque, and geographically limited

2.2 Lawyer Side
Advocates in district and lower courts have no digital channel to reach clients outside their personal network
New lawyers and those outside major metros struggle with unpredictable client acquisition
Lawyers receive cases cold — no prior context, forcing a lengthy first consultation just to understand the facts
No tool exists for lawyers to efficiently research BNS/BNSS alongside IPC/CrPC legacy law during case preparation
Unrepresented cases go to court without proper guidance, increasing burden on the judiciary

2.3 System Gap

3. Goals & Non-Goals
Goals — v4.0
Deliver instant verified legal guidance to citizens grounded in BNS/BNSS/IPC/CPC/CrPC
Generate court-ready legal documents with full export in Word and PDF
Connect citizens to matched lawyers with AI-prepared briefs via the Citizen Marketplace
Provide lawyers a full-featured professional portal — case pipeline, profile, research tool
Surface unassigned cases to prevent case abandonment and improve access to representation
Enable lawyers to research Indian law using the same AI system as citizens
Maintain full audit trail — every legal output linked to a verified statute and confidence score

Non-Goals — v4.0
No court e-filing automation
No native mobile app (web + PWA only)
No regional languages beyond Hindi, English, Hinglish
No Aadhaar-based KYC (phone OTP for citizens, email + Bar Council ID for lawyers)
No payment processing or escrow — platform facilitates discovery only
No AI automation of lawyer responses or briefs on the lawyer's behalf
4. User Types & Roles

5. Citizen-Side Features (Recap — v3)
The citizen-side product is carried forward from v3.0 without changes. This section provides a summary reference. Full specification is in PRD v3.0.


6. Lawyer Portal — New in v4.0
The Lawyer Portal is a purpose-built professional interface separate from the citizen app. Lawyers access it via a dedicated login and see a completely different navigation structure — built around case management, lead acquisition, profile building, and legal research.
The portal is designed to feel like a professional practice management tool, not a generic dashboard. Every screen is oriented around the lawyer's workflow: find cases, review briefs, manage pipeline, build profile, research law.

6.1 Lawyer Portal Navigation Structure


6.2 Available Cases Feed
The Available Cases feed is the lawyer's primary lead acquisition channel. It shows all open citizen cases where citizens are seeking legal representation, displayed as cards with enough context for a lawyer to decide whether to engage.

Case Card — What the Lawyer Sees


Filters — Available Cases
Domain: Consumer / Tenant / Labour / Criminal / Cyber / Property / Family / RTI / Corruption
State: Filter by state of jurisdiction
District Court: Further filter by specific court
Budget: Minimum offered fee range slider
Match Score: Show only cases above a set match threshold
Posted Within: Last 24 hours / 3 days / 7 days / All
Documents Available: Filter to only cases with supporting documents attached

Full Case Brief View
When a lawyer taps 'View Full Brief', they see the complete AI-generated case brief — the same document that would be sent if a citizen initiated contact. This includes:
Confirmed incident facts — extracted and verified by the Intake Agent
Applicable laws — BNS/BNSS sections, state-specific variations, and confidence scores
Evidence inventory — list of uploaded documents with OCR summaries
Recommended strategy — the action plan the AI has already generated
AI disclaimer — prominent notice that this is AI-generated content
The brief gives the lawyer everything needed to assess the case before committing. Only after reviewing the brief can the lawyer make an offer.

6.3 My Cases — Case Pipeline
The My Cases tab is the lawyer's operational hub. All cases the lawyer has engaged with are managed here across four stages. This mirrors how a real practice pipeline works.

Pipeline Stages


Case Pipeline Card — Pending Stage
Citizen Initials Avatar: Anonymised citizen identifier — no personal data shown until acceptance
Case Title + Domain Badge: Domain and brief title as shown in the Available Cases feed
Offer Sent Timestamp: When the offer was made — 'Offer sent 4 hours ago'
Offer Amount: The fee the lawyer quoted in the offer
Awaiting Response Label: Visual indicator that the ball is in the citizen's court
Message Thread: In-platform messaging available immediately after offer — for questions before acceptance
Withdraw Offer: Lawyer can retract if circumstances change

Case Pipeline Card — Active Stage
Status Badge: Active — shown in green
Next Milestone: The next action item from the AI-generated timeline, editable by the lawyer
Citizen Message Thread: Full messaging history with the citizen
Documents: All citizen-uploaded and lawyer-uploaded documents for the case
Update Status: Lawyer marks milestones — 'Legal notice sent', 'Filed at tribunal', 'Hearing scheduled'
Mark Complete: Close the case and trigger review flow

Case Pipeline Card — Completed Stage
Outcome: Won / Settled / Withdrawn / Referred — recorded by lawyer
Case Duration: Start to close date
Review Received: Citizen's rating and written review if submitted
Add to Profile: Option to add this case to the public case history on the lawyer's profile (anonymised)

6.4 My Speciality — Curated Case Feed
The My Speciality tab provides a pre-filtered feed showing only cases that match the lawyer's declared specialisations. This is the highest-signal feed — a junior labour lawyer, for example, would see only labour and employment cases without any noise.

How It Works
Lawyer sets specialisations on their profile — up to 5 domains in priority order
System continuously filters the Available Cases feed against those domains
Cases appear here sorted by match score, then by recency
A case count badge on the tab label shows how many new cases arrived since last visit
Lawyer can adjust specialisations from this screen without navigating away

Smart Alerts
Lawyers receive in-app notifications (and optional email/push) in the following situations:
A new case in their specialisation is posted
A case matching their specialisation has no offers after 24 hours — escalated visibility
A citizen has viewed their profile and not yet contacted them
An offer they made is pending for more than 48 hours — reminder to follow up

6.5 Unassigned Cases Queue
The Unassigned Queue is a dedicated, high-visibility feed of cases that have received no lawyer offers after a defined time threshold. This serves two purposes: it prevents cases from being abandoned, and it surfaces potential clients who may have been overlooked.

Entry Criteria


Why This Matters
A case with no offers within 72 hours is at risk of the citizen giving up on formal legal representation. The Unassigned Queue creates a structured channel for lawyers to find these cases and a visible responsibility signal within the platform ecosystem.

Unassigned Queue Card — Extra Fields
Time Since Posted: Shown prominently — 'Posted 62 hours ago, no offers yet'
Unassigned Reason (if known): Domain, budget below typical market rate, complex case type — shown as a callout
Suggested Fee Range: AI-generated suggestion for what a fair fee might be for this case type based on historical data

6.6 Lawyer Profile — Builder & Public View
The Lawyer Profile has two modes: the Builder (seen only by the lawyer, for editing) and the Public View (seen by citizens in the marketplace). Lawyers can toggle between modes from the same screen.

Profile Builder Sections


Case History — Adding Cases
Lawyers build their case history two ways:
Manual Entry: Add cases from before joining NyayaAI — domain, court, outcome, year, brief description (no client names)
Platform Import: Completed cases on NyayaAI can be imported with one click — outcome is verified by the citizen's review
Case history is always anonymised on the public profile — no client names, case numbers, or court details that would identify the opposing party or the client.

Verification Badge
The verification badge appears on the lawyer's card and profile when:
Bar Council ID is submitted and matches a valid enrollment record (manual check initially, API in roadmap)
Identity documents are uploaded and reviewed by the platform team
At least one completed case is on record on the platform

Profile Completeness Score
A completeness meter (0–100%) is shown only to the lawyer in the Builder. It encourages filling all sections. Lawyers below 60% completeness are ranked lower in citizen search results. The meter breaks down:


6.7 Legal Explorer — Lawyer AI Research Tool
The Legal Explorer gives lawyers direct access to the same AI-powered legal research engine that drives citizen analysis — but in a mode designed for professional use. Instead of being asked 'describe your situation', lawyers interact with the system as a research assistant.

How It Differs from the Citizen Chatbot


Entry Modes — Lawyer Explorer
Browse by Law Category: Select a domain tile (Consumer / Criminal / Tenant / Labour / Cyber / Property / Family / RTI / Corruption) and explore acts and sections within it
Section Lookup: Type a section number (e.g. 'BNS 103', 'CPC Order 39', 'TPA 106') and get the full text, plain-language explanation, amendment history, and cross-references
Query Mode: Ask a research question in English — 'What constitutes a valid notice period under TPA for a monthly tenancy?' — and receive a researched answer with citations
Case Law Search: Search for Supreme Court and High Court judgments on a legal point — powered by IndianKanoon corpus

Lawyer Explorer Output Format
Full section text from the BNS/BNSS/IPC/CrPC/CPC corpus
Plain-language explanation alongside the technical text
Amendment history — what changed, when, and what it replaced
Cross-references — related sections within the same act and in other acts
Landmark judgments — top 3–5 Supreme Court or High Court cases on point
State-specific variations — where state law modifies the national rule
Confidence score — how certain the retrieval system is about the relevance
Export option — download the research output as a formatted PDF for case files

Saved Research
Lawyers can save any research output to a case in their pipeline. If they are currently working on an Active case, a 'Save to Case' button appears on every Explorer output. Saved research is stored in the case record in PostgreSQL and accessible from the My Cases view.
7. End-to-End Pipeline — Full Dual-Side Flow
This section maps the complete journey from a citizen's first interaction to a resolved legal matter, showing exactly how citizen actions, AI agents, and lawyer actions interconnect.

7.1 Phase 1 — Citizen Intake & Analysis


7.2 Phase 2 — Citizen Initiates Lawyer Search


7.3 Phase 3 — Lawyer Reviews & Responds


7.4 Phase 4 — Active Case Management


7.5 Phase 5 — Case Completion


7.6 Parallel Flow — Unassigned Case Escalation

8. System Architecture — v4
v4.0 adds a Lawyer Portal Service and extends the Marketplace Service alongside the five-agent pipeline.

8.1 Architecture Layers


8.2 Lawyer Matching Algorithm — Five Factors


8.3 Database Responsibilities

9. Data Model — v4 Additions
9.1 lawyer_profiles


9.2 case_pipeline
Tracks the lawyer's side of every case engagement — separate from the citizen's CaseState.


9.3 lawyer_reviews


9.4 lawyer_saved_research
Stores Explorer research outputs saved by lawyers to specific active cases.


9.5 unassigned_escalations

10. UI Screens — v4 Complete List
10.1 Citizen Screens (14 — carried from v3)


10.2 Lawyer Portal Screens (9 — New in v4)

11. The Five-Agent Pipeline
The five-agent pipeline is unchanged from v3.0 in its citizen-facing operation. v4.0 adds a new consumption layer: the Lawyer Legal Explorer uses the Research and Explainability agents in a separate mode, treating lawyers as the consumer of its output.


12. Tech Stack

13. Build Phases — v4
Pre-Hackathon — Critical Preparation
All v3 pre-work: UI screens, DB schema, agent skeletons, Qdrant corpus, Neo4j graph, demo cases
Lawyer portal UI: All 9 lawyer screens built in Next.js — seeded with 20–30 demo lawyer profiles
Case pipeline schema: case_pipeline, lawyer_reviews, lawyer_saved_research, unassigned_escalations tables created
Matching engine: Five-factor algorithm implemented and tested against seeded lawyers and demo cases
Legal Explorer (lawyer mode): Depth/citation output format implemented as separate system prompt on Agent 2 + 5
Escalation job: Celery periodic task for unassigned case detection and notification wired
Alert engine: Redis pub/sub notification service built — in-app, email templates ready

Phase 1 (Hours 0–12) — Core Pipeline Live
Wire all 5 agents to live knowledge layer
Citizen intake → fact confirmation → analysis pipeline end-to-end
Lawyer matching engine wired to Strategy Agent output
Available Cases feed populated from demo cases + seeded lawyers

Phase 2 (Hours 12–24) — Marketplace & Portal Live
Brief dispatch pipeline — citizen sends brief → lawyer notified → offer made → citizen accepts
Case pipeline UI — Pending / Active / Completed stages functional
Lawyer Profile Builder — all sections editable, completeness meter live
My Speciality feed — filtering by lawyer specialisations
Unassigned Queue — escalation logic + time badges
Legal Explorer in lawyer mode — section lookup and query mode

Phase 3 (Hours 24–36) — Polish & Demo
Full end-to-end demo: citizen case → analysis → lawyer match → offer → acceptance → active case → complete → review
Notification alerts live for both sides
Saved research to case record
Performance optimisation — target < 45s for analysis pipeline
Edge cases and error states handled
Pitch deck updated — dual-side marketplace as hero narrative
14. Success Metrics
Platform Quality


Marketplace — Citizen Side


Marketplace — Lawyer Side

15. Future Roadmap
Lawyer-side document drafting: AI drafts court documents for lawyers based on active case brief — lawyer reviews before filing
eCourts win record verification: Cross-reference declared win rate against eCourts case outcome data
Video consultation booking: Schedule and host video calls between citizens and lawyers in-platform
Payment and escrow: Secure in-platform fee payment with escrow release on case milestones
WhatsApp intake: Citizens describe their case via WhatsApp bot — Intake Agent processes as normal
Regional language expansion: Tamil, Telugu, Bengali, Marathi for both portals
Bar Council API integration: Automated verification against Bar Council of India registry
Lok Adalat / Mediation routing: Automatic suggestion of mediation for eligible cases before litigation
Predictive outcome simulation: Case outcome probability modelling based on historical similar cases
Community feed: Anonymised similar case feed — citizens see how others resolved like disputes
Mobile native app: React Native — shared codebase for citizen and lawyer portals
Real-time Gazette alerts: Notify lawyers and citizens when laws relevant to active cases are amended



NyayaAI — PRD v4.0
Hackathon Build  ·  Full Dual-Side Marketplace  ·  BNS / BNSS / IPC / CPC  ·  5-Agent Pipeline