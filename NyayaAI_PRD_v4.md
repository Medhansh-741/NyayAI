**NyayaAI**  Product Requirements Document  v4.0	**CONFIDENTIAL**


⚖

**NyayaAI**

*Intelligent Legal Assistance for Every Indian Citizen*

|**Document Type**|Product Requirements Document (PRD)|
| :- | :- |
|**Version**|v4.0 — Full Dual-Side Marketplace (Citizen + Lawyer)|
|**Previous Version**|v3.0 — Lawyer Marketplace (Citizen-Side Only)|
|**Platform**|Web Application + Mobile PWA|
|**Language Support**|Hindi, English & Hinglish|
|**Target**|Indian Legal System — BNS / BNSS / IPC / CPC / CrPC|
|**Status**|Final — Ready for Development|


*Hackathon Build — Production-Grade Agentic Pipeline + Full Dual-Side Marketplace*


# **1. Executive Summary**
NyayaAI is a production-grade, multi-agent legal assistance platform built for Indian citizens. It delivers instant legal analysis, document generation, and — in v4.0 — a fully operational dual-sided marketplace connecting citizens to verified lawyers and giving lawyers a purpose-built professional portal.

Version 4.0 completes the marketplace loop. v3.0 gave citizens the ability to discover and contact lawyers. v4.0 builds the lawyer-facing side: a professional dashboard where advocates manage their practice, receive pre-qualified leads with AI-prepared briefs, track case pipelines, and use the same AI-powered legal research tool to strengthen their own work.

### **What Is New in v4.0**
- **Lawyer Dashboard:** A full professional portal for advocates — case pipeline, profile management, earnings overview
- **Available Cases Feed:** Lawyers browse open citizen cases filtered by specialisation, location, and budget
- **Case Pipeline Management:** Pending, Offered, Accepted, and Completed case stages managed in one place
- **Lawyer Profile Builder:** Advocates build and maintain their verified profile — cases, credentials, fees, languages
- **Speciality Case Feed:** Curated feed of cases matching the lawyer's declared specialisations
- **Unassigned Cases Queue:** High-visibility feed of cases with no lawyer response — preventing cases from going stale
- **Lawyer Legal Explorer:** Same AI chatbot as citizens but scoped for professional legal research by law category


# **2. Problem Statement**
## **2.1 Citizen Side**
- Legal information is fragmented across hundreds of acts, amendments, and state-level variations
- India's criminal law was overhauled in 2023 — IPC replaced by BNS, CrPC by BNSS — most resources are outdated
- Professional advice costs ₹2,000–₹10,000+ per consultation — unaffordable for most citizens
- When a case needs a lawyer, citizens have no transparent way to compare fees, specialisations, or track records
- Lawyer discovery is entirely word-of-mouth — biased, opaque, and geographically limited

## **2.2 Lawyer Side**
- Advocates in district and lower courts have no digital channel to reach clients outside their personal network
- New lawyers and those outside major metros struggle with unpredictable client acquisition
- Lawyers receive cases cold — no prior context, forcing a lengthy first consultation just to understand the facts
- No tool exists for lawyers to efficiently research BNS/BNSS alongside IPC/CrPC legacy law during case preparation
- Unrepresented cases go to court without proper guidance, increasing burden on the judiciary

## **2.3 System Gap**

|**Gap**|**Impact**|**NyayaAI v4 Solution**|
| :- | :- | :- |
|Lawyers invisible to citizens outside personal networks|Citizens take worse outcomes or no action|Verified marketplace with AI matching|
|Citizens arrive at lawyers without context|Long intake consultation wastes time and money|AI brief sent before first contact|
|No transparent fee benchmarking|Citizens overpay or distrust lawyers|Fee ranges + negotiation on platform|
|Lawyers have no BNS/BNSS research tool|Research done manually across fragmented sources|Lawyer Legal Explorer with full corpus|
|District court lawyers have no lead pipeline|Revenue is inconsistent and geographically capped|Available cases feed filtered by speciality|


# **3. Goals & Non-Goals**
### **Goals — v4.0**
- Deliver instant verified legal guidance to citizens grounded in BNS/BNSS/IPC/CPC/CrPC
- Generate court-ready legal documents with full export in Word and PDF
- Connect citizens to matched lawyers with AI-prepared briefs via the Citizen Marketplace
- Provide lawyers a full-featured professional portal — case pipeline, profile, research tool
- Surface unassigned cases to prevent case abandonment and improve access to representation
- Enable lawyers to research Indian law using the same AI system as citizens
- Maintain full audit trail — every legal output linked to a verified statute and confidence score

### **Non-Goals — v4.0**
- No court e-filing automation
- No native mobile app (web + PWA only)
- No regional languages beyond Hindi, English, Hinglish
- No Aadhaar-based KYC (phone OTP for citizens, email + Bar Council ID for lawyers)
- No payment processing or escrow — platform facilitates discovery only
- No AI automation of lawyer responses or briefs on the lawyer's behalf


# **4. User Types & Roles**

|**Role**|**Profile**|**Primary Needs**|
| :- | :- | :- |
|Citizen|No legal knowledge, Hinglish-first, any income|Understand rights, get documents, find affordable lawyer|
|Educated Citizen|English-fluent, urban professional|Fast analysis, self-represent or smart lawyer selection|
|Lawyer — Junior|0–5 years, building practice, lower court focus|Client leads, AI research, profile visibility|
|Lawyer — Senior|5+ years, established practice, HC / SC experience|Qualified high-value leads, brief pre-qualification|
|Law Student / Paralegal|Legal training background|Case research, statute lookup, outcome data|
|Platform Admin|Internal team|Lawyer verification, dispute resolution, quality control|


# **5. Citizen-Side Features (Recap — v3)**
The citizen-side product is carried forward from v3.0 without changes. This section provides a summary reference. Full specification is in PRD v3.0.

|**Feature**|**Description**|
| :- | :- |
|Conversational Intake|Guided conversation with OCR document processing and evidence auto-tagging|
|Fact Confirmation|Plain-language fact summary for citizen confirmation before pipeline proceeds|
|Legal Research|BNS/BNSS-primary semantic retrieval with state-specific variation detection|
|Strategy & Action Plan|Prioritised steps, forum routing, timeline, cost estimate, lawyer flag|
|Document Generation|Legal notice, FIR draft, consumer complaint, RTI, affidavit — Word + PDF export|
|Explainability Layer|Per-section confidence scores, retrieval source display, reasoning chain export|
|Citizen Marketplace|AI-matched lawyer cards, profile pages, fee negotiation, brief dispatch|
|Case Status Tracker|Chronological timeline, upcoming deadlines, hearing reminders|
|Legal Rights Explorer|Browse by domain or section number in Hindi / English / Hinglish|


# **6. Lawyer Portal — New in v4.0**
The Lawyer Portal is a purpose-built professional interface separate from the citizen app. Lawyers access it via a dedicated login and see a completely different navigation structure — built around case management, lead acquisition, profile building, and legal research.

The portal is designed to feel like a professional practice management tool, not a generic dashboard. Every screen is oriented around the lawyer's workflow: find cases, review briefs, manage pipeline, build profile, research law.

## **6.1 Lawyer Portal Navigation Structure**

|**Tab**|**Icon Label**|**Primary Purpose**|
| :- | :- | :- |
|Available Cases|Briefcase|Browse open citizen cases by domain, location, and budget|
|My Cases|Folder|Full case pipeline — Pending, Offered, Active, Completed|
|My Speciality|Target|Curated feed of cases matching declared specialisations|
|Unassigned Queue|Alert|Cases with no lawyer response — time-sensitive, high need|
|My Profile|Person|Build and manage verified professional profile|
|Legal Explorer|Search|AI research chatbot scoped by law category|

## **6.2 Available Cases Feed**
The Available Cases feed is the lawyer's primary lead acquisition channel. It shows all open citizen cases where citizens are seeking legal representation, displayed as cards with enough context for a lawyer to decide whether to engage.

### **Case Card — What the Lawyer Sees**

|**Field**|**Description**|**Example**|
| :- | :- | :- |
|Domain Badge|Case type — colour-coded pill|Tenant / Property|
|Case Title|Brief description generated from citizen's intake|Unlawful eviction — 7-day notice issued|
|Case Summary|2–3 sentence AI-generated synopsis of the dispute|Tenant of 3 years served invalid notice under TPA §106...|
|Jurisdiction|State and district|Delhi — Saket District Court|
|Budget Offered|Citizen's indicated budget range|₹8,000 – ₹12,000|
|Posted Time|How long ago the case was submitted|Posted 2 hours ago|
|Match Score|How well the case matches this lawyer's specialisations|91% match|
|Documents Attached|Count of supporting documents available to review|3 documents attached|
|View Brief CTA|Opens the full AI-generated case brief|View Full Brief|
|Make Offer CTA|Initiate engagement with the citizen|Make Offer|

### **Filters — Available Cases**
- Domain: Consumer / Tenant / Labour / Criminal / Cyber / Property / Family / RTI / Corruption
- State: Filter by state of jurisdiction
- District Court: Further filter by specific court
- Budget: Minimum offered fee range slider
- Match Score: Show only cases above a set match threshold
- Posted Within: Last 24 hours / 3 days / 7 days / All
- Documents Available: Filter to only cases with supporting documents attached

### **Full Case Brief View**
When a lawyer taps 'View Full Brief', they see the complete AI-generated case brief — the same document that would be sent if a citizen initiated contact. This includes:

- Confirmed incident facts — extracted and verified by the Intake Agent
- Applicable laws — BNS/BNSS sections, state-specific variations, and confidence scores
- Evidence inventory — list of uploaded documents with OCR summaries
- Recommended strategy — the action plan the AI has already generated
- AI disclaimer — prominent notice that this is AI-generated content

The brief gives the lawyer everything needed to assess the case before committing. Only after reviewing the brief can the lawyer make an offer.

## **6.3 My Cases — Case Pipeline**
The My Cases tab is the lawyer's operational hub. All cases the lawyer has engaged with are managed here across four stages. This mirrors how a real practice pipeline works.

### **Pipeline Stages**

|**Stage**|**Definition**|**Lawyer Actions Available**|
| :- | :- | :- |
|Available|Open cases — visible in the Available Cases feed|View brief, Make offer|
|Pending|Lawyer has made an offer — awaiting citizen's decision|View brief, Withdraw offer, Message citizen|
|Active|Citizen accepted — case is live|Message citizen, Update status, Upload documents, Mark complete|
|Completed|Case concluded — resolved, withdrawn, or referred|Leave review, Archive, View case record|

### **Case Pipeline Card — Pending Stage**
- **Citizen Initials Avatar:** Anonymised citizen identifier — no personal data shown until acceptance
- **Case Title + Domain Badge:** Domain and brief title as shown in the Available Cases feed
- **Offer Sent Timestamp:** When the offer was made — 'Offer sent 4 hours ago'
- **Offer Amount:** The fee the lawyer quoted in the offer
- **Awaiting Response Label:** Visual indicator that the ball is in the citizen's court
- **Message Thread:** In-platform messaging available immediately after offer — for questions before acceptance
- **Withdraw Offer:** Lawyer can retract if circumstances change

### **Case Pipeline Card — Active Stage**
- **Status Badge:** Active — shown in green
- **Next Milestone:** The next action item from the AI-generated timeline, editable by the lawyer
- **Citizen Message Thread:** Full messaging history with the citizen
- **Documents:** All citizen-uploaded and lawyer-uploaded documents for the case
- **Update Status:** Lawyer marks milestones — 'Legal notice sent', 'Filed at tribunal', 'Hearing scheduled'
- **Mark Complete:** Close the case and trigger review flow

### **Case Pipeline Card — Completed Stage**
- **Outcome:** Won / Settled / Withdrawn / Referred — recorded by lawyer
- **Case Duration:** Start to close date
- **Review Received:** Citizen's rating and written review if submitted
- **Add to Profile:** Option to add this case to the public case history on the lawyer's profile (anonymised)

## **6.4 My Speciality — Curated Case Feed**
The My Speciality tab provides a pre-filtered feed showing only cases that match the lawyer's declared specialisations. This is the highest-signal feed — a junior labour lawyer, for example, would see only labour and employment cases without any noise.

### **How It Works**
1. Lawyer sets specialisations on their profile — up to 5 domains in priority order
1. System continuously filters the Available Cases feed against those domains
1. Cases appear here sorted by match score, then by recency
1. A case count badge on the tab label shows how many new cases arrived since last visit
1. Lawyer can adjust specialisations from this screen without navigating away

### **Smart Alerts**
Lawyers receive in-app notifications (and optional email/push) in the following situations:

- A new case in their specialisation is posted
- A case matching their specialisation has no offers after 24 hours — escalated visibility
- A citizen has viewed their profile and not yet contacted them
- An offer they made is pending for more than 48 hours — reminder to follow up

## **6.5 Unassigned Cases Queue**
The Unassigned Queue is a dedicated, high-visibility feed of cases that have received no lawyer offers after a defined time threshold. This serves two purposes: it prevents cases from being abandoned, and it surfaces potential clients who may have been overlooked.

### **Entry Criteria**

|**Condition**|**Threshold**|**Display Treatment**|
| :- | :- | :- |
|No offers received|24 hours after posting|Standard unassigned badge|
|No offers received|48 hours after posting|Elevated — shown with 'Urgent' indicator|
|No offers received|72 hours after posting|Critical — pinned to top of queue, citizen notified|

### **Why This Matters**
A case with no offers within 72 hours is at risk of the citizen giving up on formal legal representation. The Unassigned Queue creates a structured channel for lawyers to find these cases and a visible responsibility signal within the platform ecosystem.

### **Unassigned Queue Card — Extra Fields**
- **Time Since Posted:** Shown prominently — 'Posted 62 hours ago, no offers yet'
- **Unassigned Reason (if known):** Domain, budget below typical market rate, complex case type — shown as a callout
- **Suggested Fee Range:** AI-generated suggestion for what a fair fee might be for this case type based on historical data

## **6.6 Lawyer Profile — Builder & Public View**
The Lawyer Profile has two modes: the Builder (seen only by the lawyer, for editing) and the Public View (seen by citizens in the marketplace). Lawyers can toggle between modes from the same screen.

### **Profile Builder Sections**

|**Section**|**Fields Available**|**Notes**|
| :- | :- | :- |
|Identity|Name, photo, Bar Council ID, years of experience|Bar Council ID required for verification badge|
|Bio|Self-written introduction — up to 400 words|Markdown supported for formatting|
|Specialisations|Up to 5 domains in priority order|Drives the My Speciality feed and the citizen matching algorithm|
|Practice Courts|Supreme Court / High Court / District Court — multi-select by state|Drives jurisdiction filter in Available Cases|
|Languages|Communication languages — multi-select|Shown on public profile and used in citizen search filters|
|Fee Structure|Min and max fee per case type, negotiable toggle|Per-domain fee ranges, not a single rate|
|Availability|Accepting new cases toggle, expected capacity|'Not accepting' hides lawyer from new citizen searches|
|Case History|Add anonymised cases — domain, court, outcome, year|Manually added or imported from completed cases on platform|
|Credentials|Additional qualifications, publications, awards|Optional — strengthens profile trust score|

### **Case History — Adding Cases**
Lawyers build their case history two ways:

- **Manual Entry:** Add cases from before joining NyayaAI — domain, court, outcome, year, brief description (no client names)
- **Platform Import:** Completed cases on NyayaAI can be imported with one click — outcome is verified by the citizen's review

Case history is always anonymised on the public profile — no client names, case numbers, or court details that would identify the opposing party or the client.

### **Verification Badge**
The verification badge appears on the lawyer's card and profile when:

- Bar Council ID is submitted and matches a valid enrollment record (manual check initially, API in roadmap)
- Identity documents are uploaded and reviewed by the platform team
- At least one completed case is on record on the platform

### **Profile Completeness Score**
A completeness meter (0–100%) is shown only to the lawyer in the Builder. It encourages filling all sections. Lawyers below 60% completeness are ranked lower in citizen search results. The meter breaks down:

|**Section**|**Weight**|
| :- | :- |
|Photo and bio|15%|
|Specialisations set|15%|
|Practice courts set|10%|
|Fee structure complete|15%|
|At least 3 cases in history|20%|
|Languages set|5%|
|Verification badge earned|20%|

## **6.7 Legal Explorer — Lawyer AI Research Tool**
The Legal Explorer gives lawyers direct access to the same AI-powered legal research engine that drives citizen analysis — but in a mode designed for professional use. Instead of being asked 'describe your situation', lawyers interact with the system as a research assistant.

### **How It Differs from the Citizen Chatbot**

|**Dimension**|**Citizen Mode**|**Lawyer Mode**|
| :- | :- | :- |
|Entry point|'Describe your legal situation'|'Research a law, section, or case type'|
|Language|Hindi / English / Hinglish, plain language|English primary, legal terminology supported|
|Output framing|'Here is what you should do'|'Here is how this law works and what the courts have said'|
|Depth|Plain-language summary for non-lawyers|Full section text, amendment history, HC/SC judgments|
|Scope|Focused on citizen's specific dispute|Any section, act, or domain — open research|
|Citations|Shown with confidence scores|Full citation with IndianKanoon case links|

### **Entry Modes — Lawyer Explorer**
- **Browse by Law Category:** Select a domain tile (Consumer / Criminal / Tenant / Labour / Cyber / Property / Family / RTI / Corruption) and explore acts and sections within it
- **Section Lookup:** Type a section number (e.g. 'BNS 103', 'CPC Order 39', 'TPA 106') and get the full text, plain-language explanation, amendment history, and cross-references
- **Query Mode:** Ask a research question in English — 'What constitutes a valid notice period under TPA for a monthly tenancy?' — and receive a researched answer with citations
- **Case Law Search:** Search for Supreme Court and High Court judgments on a legal point — powered by IndianKanoon corpus

### **Lawyer Explorer Output Format**
- Full section text from the BNS/BNSS/IPC/CrPC/CPC corpus
- Plain-language explanation alongside the technical text
- Amendment history — what changed, when, and what it replaced
- Cross-references — related sections within the same act and in other acts
- Landmark judgments — top 3–5 Supreme Court or High Court cases on point
- State-specific variations — where state law modifies the national rule
- Confidence score — how certain the retrieval system is about the relevance
- Export option — download the research output as a formatted PDF for case files

### **Saved Research**
Lawyers can save any research output to a case in their pipeline. If they are currently working on an Active case, a 'Save to Case' button appears on every Explorer output. Saved research is stored in the case record in PostgreSQL and accessible from the My Cases view.


# **7. End-to-End Pipeline — Full Dual-Side Flow**
This section maps the complete journey from a citizen's first interaction to a resolved legal matter, showing exactly how citizen actions, AI agents, and lawyer actions interconnect.

## **7.1 Phase 1 — Citizen Intake & Analysis**

|**Step**|**Actor**|**Action**|**System Response**|
| :- | :- | :- | :- |
|1|Citizen|Opens NyayaAI, describes legal situation|Intake Agent begins guided conversation|
|2|Intake Agent|Asks targeted follow-up questions, processes OCR uploads|Structured incident JSON built|
|3|System|Presents plain-language fact summary for confirmation|Citizen confirms or corrects|
|4|Research Agent|Semantic search on Qdrant — BNS/BNSS + state law|Verified legal citations returned|
|5|Strategy Agent|Builds action plan, sets lawyer\_recommended flag if needed|Action plan + lawyer flag stored in CaseState|
|6|Drafting Agent|Generates documents — legal notice, FIR draft, etc.|Documents stored in Supabase Storage|
|7|Explainability Agent|Produces confidence scores, reasoning trace|Full audit trail stored in PostgreSQL|
|8|System|Case analysis complete — citizen sees results across Chat, Analytics, Timeline, Documents tabs|CaseState fully populated|

## **7.2 Phase 2 — Citizen Initiates Lawyer Search**

|**Step**|**Actor**|**Action**|**System Response**|
| :- | :- | :- | :- |
|9|Citizen|Views AI recommendation to consult a lawyer|Marketplace surfaced with top 3–5 matched lawyers|
|10|Matching Engine|Scores all available lawyers against 5-factor model|Ranked list returned|
|11|Citizen|Browses lawyer cards, views full profile|Profile fetched from PostgreSQL|
|12|Citizen|Clicks 'Send Case Brief' on chosen lawyer|Brief dispatch modal shown|
|13|System|Dispatches AI-generated brief to lawyer's inbox|Brief record created in brief\_dispatches table, lawyer notified|

## **7.3 Phase 3 — Lawyer Reviews & Responds**

|**Step**|**Actor**|**Action**|**System Response**|
| :- | :- | :- | :- |
|14|Lawyer|Receives notification of new case brief|Brief appears in Available Cases feed and notification inbox|
|15|Lawyer|Opens and reviews full AI brief|Brief viewed — status updated to 'Viewed'|
|16|Lawyer|Makes an offer — fee quote + acceptance message|Offer stored, citizen notified, case moves to Pending in lawyer's pipeline|
|17|Citizen|Reviews offer, optionally negotiates fee|In-platform message thread available|
|18|Citizen|Accepts offer|Case moves to Active in lawyer's pipeline, citizen gets confirmation|

## **7.4 Phase 4 — Active Case Management**

|**Step**|**Actor**|**Action**|**System Response**|
| :- | :- | :- | :- |
|19|Lawyer|Downloads AI brief as Word/PDF, begins case work|Document retrieved from Supabase Storage|
|20|Lawyer|Uses Legal Explorer to research applicable sections|Qdrant + Neo4j queried, results saved to case|
|21|Lawyer|Updates case milestones — 'Legal notice sent'|Milestone logged to case\_timeline in PostgreSQL|
|22|System|Sends deadline reminders to both citizen and lawyer|Redis job fires scheduled notification|
|23|Lawyer|Uploads court documents to the case|Files stored in Supabase Storage under case record|
|24|Citizen|Tracks case status via Case Status Tracker tab|Reads from case\_timeline|

## **7.5 Phase 5 — Case Completion**

|**Step**|**Actor**|**Action**|**System Response**|
| :- | :- | :- | :- |
|25|Lawyer|Marks case complete, records outcome|Outcome stored, case moves to Completed|
|26|System|Prompts citizen to leave a review|Review request sent via in-app notification|
|27|Citizen|Submits star rating and written review|Review stored, linked to lawyer profile|
|28|Lawyer|Imports completed case to profile history|Anonymised case record added to lawyer's public profile|
|29|System|Updates lawyer's win rate and review average|Profile metrics recalculated in PostgreSQL|

## **7.6 Parallel Flow — Unassigned Case Escalation**

|**Step**|**Actor**|**Action**|**System Response**|
| :- | :- | :- | :- |
|A|Citizen|Submits case, no lawyer contacts within 24h|System flags case as unassigned|
|B|System|Case appears in Unassigned Queue with elapsed time badge|Lawyers in matching specialisations notified|
|C|System|After 48h: 'Urgent' indicator applied|Push notification sent to top 10 matched lawyers|
|D|System|After 72h: Case pinned to top of queue, citizen notified|Citizen offered option to broaden jurisdiction or adjust budget|
|E|Lawyer|Picks up case from Unassigned Queue|Normal offer flow proceeds|


# **8. System Architecture — v4**
v4.0 adds a Lawyer Portal Service and extends the Marketplace Service alongside the five-agent pipeline.

## **8.1 Architecture Layers**

|**Layer**|**Technology & Purpose**|
| :- | :- |
|Orchestration|LangGraph — stateful agent graph, routing, retries|
|LLM|Claude Sonnet (Anthropic API) — reasoning, generation|
|Vector DB (Qdrant)|Semantic search over Indian legal corpus — primary existence check, section-level chunks|
|Graph DB (Neo4j)|Act → Chapter → Section → Sub-section hierarchy — powers Legal Explorer|
|Relational DB (PostgreSQL / Supabase)|CaseState, case\_timeline, documents, feedback, lawyer profiles, brief dispatches, reviews|
|Marketplace Service|Lawyer matching algorithm, brief dispatch, offer management, pipeline state|
|Lawyer Portal Service|Case feed with filters, pipeline management, profile CRUD, alert engine|
|Notification Service|Redis pub/sub + Celery — in-app, push, and email alerts for both sides|
|Task Queue|Redis + Celery — async agent pipeline, brief dispatch, deadline reminders|
|Frontend|Next.js 14 + Tailwind CSS — separate citizen and lawyer portal routes|
|Auth|Supabase Auth — OTP for citizens, email + Bar Council ID for lawyers|
|File Storage|Supabase Storage — case documents, evidence, lawyer profile media|
|External APIs|IndianKanoon, eCourts, Government Gazette RSS|

## **8.2 Lawyer Matching Algorithm — Five Factors**

|**Factor**|**Weight**|**Method**|
| :- | :- | :- |
|Domain Match|30%|Cosine similarity between case type embedding and lawyer specialisation tags|
|Jurisdictional Match|25%|Hard state filter first, then district court proximity bonus|
|Outcome Similarity|25%|Win rate on cases tagged with the same domain and sub-type|
|Review Score|15%|Weighted average of verified platform reviews — recent reviews weighted higher|
|Availability & Response Rate|5%|Currently accepting cases flag + average brief response time score|

## **8.3 Database Responsibilities**

|**Database**|**Responsibility in v4**|
| :- | :- |
|Qdrant|Semantic search over legal corpus — existence check, section retrieval, case similarity for matching, Lawyer Explorer queries|
|Neo4j|Law hierarchy (Act→Section) — powers Legal Explorer browse-by-domain and section-number lookup|
|PostgreSQL|All relational data — CaseState, lawyer profiles, brief dispatches, pipeline stages, reviews, timeline events, feedback|
|Redis|Async task queue (Celery), WebSocket pub/sub for live pipeline status, unassigned case escalation jobs, deadline reminder scheduler|


# **9. Data Model — v4 Additions**
## **9.1 lawyer\_profiles**

|**Field**|**Type**|**Description**|
| :- | :- | :- |
|lawyer\_id|UUID PK|Unique identifier|
|name|VARCHAR(200)|Full legal name|
|bar\_council\_id|VARCHAR(100)|Verified enrollment number — unique constraint|
|verified|BOOLEAN|Verification status — drives badge display|
|photo\_url|TEXT|Supabase Storage URL|
|bio|TEXT|Self-written introduction|
|specialisations|TEXT[]|Domains in priority order — max 5|
|practice\_courts|TEXT[]|Courts where they practice|
|state|VARCHAR(50)|Primary state|
|total\_cases|INTEGER|Total cases declared|
|win\_rate|FLOAT|Win percentage — recalculated on each case completion|
|avg\_fee\_min|INTEGER|Minimum fee in INR|
|avg\_fee\_max|INTEGER|Maximum fee in INR|
|fee\_negotiable|BOOLEAN|Negotiation flag|
|review\_avg|FLOAT|Weighted average review score|
|review\_count|INTEGER|Total verified reviews|
|response\_time\_hrs|FLOAT|Median response time to briefs in hours|
|accepting\_cases|BOOLEAN|Current availability|
|profile\_completeness|FLOAT|0–100 score for internal use — affects ranking|
|languages|TEXT[]|Communication languages|

## **9.2 case\_pipeline**
Tracks the lawyer's side of every case engagement — separate from the citizen's CaseState.

|**Field**|**Type**|**Description**|
| :- | :- | :- |
|pipeline\_id|UUID PK|Unique pipeline record|
|case\_id|UUID FK|Reference to citizen's CaseState|
|lawyer\_id|UUID FK|Reference to lawyer profile|
|stage|ENUM|available / pending / active / completed|
|offer\_amount|INTEGER|Lawyer's quoted fee|
|offer\_message|TEXT|Lawyer's introductory message with offer|
|offered\_at|TIMESTAMP|When offer was made|
|accepted\_at|TIMESTAMP|When citizen accepted|
|completed\_at|TIMESTAMP|When case was marked complete|
|outcome|ENUM|won / settled / withdrawn / referred / null|
|lawyer\_notes|TEXT|Private notes — not shared with citizen|
|milestones|JSONB|Array of lawyer-recorded milestones with timestamps|

## **9.3 lawyer\_reviews**

|**Field**|**Type**|**Description**|
| :- | :- | :- |
|review\_id|UUID PK|Unique review|
|lawyer\_id|UUID FK|Reviewed lawyer|
|citizen\_id|UUID FK|Reviewer — must have completed case with this lawyer on platform|
|pipeline\_id|UUID FK|The specific case this review is for — prevents duplicate reviews|
|rating|SMALLINT|1–5 stars|
|written\_review|TEXT|Written feedback|
|case\_domain|VARCHAR(50)|Domain of the case — shown publicly alongside review|
|is\_verified|BOOLEAN|TRUE only if linked to a completed platform case|
|created\_at|TIMESTAMP|Review submission timestamp|

## **9.4 lawyer\_saved\_research**
Stores Explorer research outputs saved by lawyers to specific active cases.

|**Field**|**Type**|**Description**|
| :- | :- | :- |
|research\_id|UUID PK|Unique record|
|lawyer\_id|UUID FK|Lawyer who saved it|
|pipeline\_id|UUID FK|Active case it was saved to — nullable for general saves|
|query|TEXT|Original search query or section lookup|
|result\_snapshot|JSONB|Full Explorer output at time of saving|
|created\_at|TIMESTAMP|Save timestamp|

## **9.5 unassigned\_escalations**

|**Field**|**Type**|**Description**|
| :- | :- | :- |
|escalation\_id|UUID PK|Unique record|
|case\_id|UUID FK|The unassigned citizen case|
|hours\_open|FLOAT|Hours since case was posted — recalculated periodically by Celery job|
|escalation\_level|SMALLINT|1 = standard, 2 = urgent (48h), 3 = critical (72h)|
|notifications\_sent|INTEGER|Count of lawyer notifications triggered|
|resolved\_at|TIMESTAMP|When a lawyer made an offer — closes the escalation|


# **10. UI Screens — v4 Complete List**
## **10.1 Citizen Screens (14 — carried from v3)**

|**Screen**|**Description**|
| :- | :- |
|Landing Page|Value prop, how it works, CTA|
|Login / Signup|Phone OTP auth|
|Profile & Jurisdiction Setup|State, language preference|
|Dashboard / Home|Active cases, quick start|
|New Case — Conversational Intake|Guided conversation, voice, document upload with OCR|
|Fact Confirmation|Plain-language summary for confirmation|
|Case Processing View|Live agent pipeline status|
|Case Detail|Full timeline, legal analysis, confidence scores|
|Strategy & Action Plan|Plain language steps, deadlines, lawyer flag|
|Documents|Generated documents, AI disclaimer, download|
|Citizen Marketplace|AI-matched lawyer cards, filters, brief dispatch|
|Lawyer Profile (Citizen View)|Full public profile as seen by citizens|
|Case Status Tracker|Timeline, upcoming deadlines, hearing reminders|
|Legal Rights Explorer|Browse by domain or section|
|Case History|All past cases, search and filter|
|Settings & Profile|Language, notifications, account|

## **10.2 Lawyer Portal Screens (9 — New in v4)**

|**Screen**|**Description**|
| :- | :- |
|Lawyer Login / Onboarding|Email + Bar Council ID auth, initial profile setup wizard|
|Available Cases Feed|Full case card feed with filters — domain, state, budget, match score|
|Full Case Brief View|Complete AI brief for a specific case — viewed before making offer|
|My Cases — Pipeline|Four-stage Kanban-style pipeline: Pending / Active / Completed with case cards|
|My Speciality Feed|Pre-filtered feed matching lawyer's declared domains — with new case badge count|
|Unassigned Queue|Cases with no lawyer engagement — time badges, urgency indicators|
|Lawyer Profile Builder|Full profile editor with completeness meter and public preview toggle|
|Legal Explorer (Lawyer Mode)|AI research chatbot — browse by category, section lookup, query mode, case law search|
|Notification Centre|All alerts — new matching cases, offer responses, deadline reminders, review requests|


# **11. The Five-Agent Pipeline**
The five-agent pipeline is unchanged from v3.0 in its citizen-facing operation. v4.0 adds a new consumption layer: the Lawyer Legal Explorer uses the Research and Explainability agents in a separate mode, treating lawyers as the consumer of its output.

|**Agent**|**Primary Role**|**v4 Addition**|
| :- | :- | :- |
|Agent 1 — Intake|Converts citizen narrative to structured incident JSON via guided conversation, OCR, evidence tagging|No change|
|Agent 2 — Research|Retrieves verified BNS/BNSS/IPC laws and state-specific variations from Qdrant + Neo4j|Also used by Legal Explorer in lawyer mode — depth and citation format adjusted|
|Agent 3 — Strategy|Builds prioritised action plan, sets lawyer\_recommended flag when needed|Sets fee estimate range for citizen-posted case based on domain benchmarks|
|Agent 4 — Drafting|Generates legal documents in court-ready format — Word + PDF export|Generates lawyer case summary card from CaseState for pipeline display|
|Agent 5 — Explainability|Produces confidence scores, retrieval sources, reasoning chain export|In lawyer mode: outputs full citation text and HC/SC judgment references rather than plain-language summaries|


# **12. Tech Stack**

|**Component**|**Technology**|
| :- | :- |
|Agent Orchestration|LangGraph (Python)|
|LLM|Claude Sonnet via Anthropic API|
|Vector Database|Qdrant (self-hosted or Qdrant Cloud free tier)|
|Graph Database|Neo4j Aura Free|
|Relational Database|PostgreSQL via Supabase|
|Embeddings|text-embedding-3-large (OpenAI)|
|OCR|Tesseract + Claude Vision API for complex documents|
|Backend Framework|FastAPI (Python, async) — citizen API + lawyer portal API as separate routers|
|Marketplace Service|FastAPI microservice — matching algorithm, brief dispatch, offer management|
|Lawyer Portal Service|FastAPI microservice — case feed, pipeline management, profile CRUD, alert engine|
|Task Queue|Redis + Celery — agent pipeline, brief dispatch, deadline reminders, escalation jobs|
|Notification Service|Redis pub/sub — real-time in-app alerts; Celery scheduled — email/push|
|Frontend|Next.js 14 + Tailwind CSS — /citizen/\* and /lawyer/\* portal routes|
|PWA|next-pwa — manifest + service worker for both portals|
|Auth|Supabase Auth — OTP for citizens, email + Bar Council ID for lawyers|
|File Storage|Supabase Storage — documents, evidence, profile media|
|Document Generation|docx (npm) for Word, ReportLab for PDF|
|Deployment|Railway (backend) + Vercel (frontend)|
|External APIs|IndianKanoon, eCourts, Government Gazette RSS|


# **13. Build Phases — v4**
## **Pre-Hackathon — Critical Preparation**
- **All v3 pre-work:** UI screens, DB schema, agent skeletons, Qdrant corpus, Neo4j graph, demo cases
- **Lawyer portal UI:** All 9 lawyer screens built in Next.js — seeded with 20–30 demo lawyer profiles
- **Case pipeline schema:** case\_pipeline, lawyer\_reviews, lawyer\_saved\_research, unassigned\_escalations tables created
- **Matching engine:** Five-factor algorithm implemented and tested against seeded lawyers and demo cases
- **Legal Explorer (lawyer mode):** Depth/citation output format implemented as separate system prompt on Agent 2 + 5
- **Escalation job:** Celery periodic task for unassigned case detection and notification wired
- **Alert engine:** Redis pub/sub notification service built — in-app, email templates ready

## **Phase 1 (Hours 0–12) — Core Pipeline Live**
- Wire all 5 agents to live knowledge layer
- Citizen intake → fact confirmation → analysis pipeline end-to-end
- Lawyer matching engine wired to Strategy Agent output
- Available Cases feed populated from demo cases + seeded lawyers

## **Phase 2 (Hours 12–24) — Marketplace & Portal Live**
- Brief dispatch pipeline — citizen sends brief → lawyer notified → offer made → citizen accepts
- Case pipeline UI — Pending / Active / Completed stages functional
- Lawyer Profile Builder — all sections editable, completeness meter live
- My Speciality feed — filtering by lawyer specialisations
- Unassigned Queue — escalation logic + time badges
- Legal Explorer in lawyer mode — section lookup and query mode

## **Phase 3 (Hours 24–36) — Polish & Demo**
- Full end-to-end demo: citizen case → analysis → lawyer match → offer → acceptance → active case → complete → review
- Notification alerts live for both sides
- Saved research to case record
- Performance optimisation — target < 45s for analysis pipeline
- Edge cases and error states handled
- Pitch deck updated — dual-side marketplace as hero narrative


# **14. Success Metrics**
### **Platform Quality**

|**Metric**|**Definition**|**Target**|
| :- | :- | :- |
|BNS/BNSS Citation Accuracy|% of criminal sections correctly mapped to BNS/BNSS|> 98%|
|State Variation Accuracy|Correct state-specific law applied|> 92%|
|Intake Accuracy|Correct domain classification rate|> 90%|
|Pipeline Latency|End-to-end citizen analysis time|< 45 seconds|

### **Marketplace — Citizen Side**

|**Metric**|**Definition**|**Target**|
| :- | :- | :- |
|Marketplace Surfacing Rate|% of analysed cases where lawyer\_recommended flag is set|> 45%|
|Profile View Rate|% of marketplace viewers who open at least one full profile|> 55%|
|Brief Dispatch Rate|% of profile viewers who send at least one brief|> 30%|
|Offer Received Rate|% of dispatched briefs that receive a lawyer offer within 48h|> 65%|
|Acceptance Rate|% of received offers that are accepted by the citizen|> 50%|

### **Marketplace — Lawyer Side**

|**Metric**|**Definition**|**Target**|
| :- | :- | :- |
|Lawyer Response Rate|% of received briefs responded to within 24h|> 70%|
|Case Completion Rate|% of active cases marked complete on the platform|> 80%|
|Review Submission Rate|% of completed cases where citizen submits a review|> 40%|
|Unassigned Resolution Rate|% of unassigned cases receiving an offer within 72h|> 75%|
|Explorer Usage|Average Legal Explorer queries per lawyer per week|> 3|
|Profile Completeness|Median completeness score across all verified lawyers|> 80%|


# **15. Future Roadmap**
- **Lawyer-side document drafting:** AI drafts court documents for lawyers based on active case brief — lawyer reviews before filing
- **eCourts win record verification:** Cross-reference declared win rate against eCourts case outcome data
- **Video consultation booking:** Schedule and host video calls between citizens and lawyers in-platform
- **Payment and escrow:** Secure in-platform fee payment with escrow release on case milestones
- **WhatsApp intake:** Citizens describe their case via WhatsApp bot — Intake Agent processes as normal
- **Regional language expansion:** Tamil, Telugu, Bengali, Marathi for both portals
- **Bar Council API integration:** Automated verification against Bar Council of India registry
- **Lok Adalat / Mediation routing:** Automatic suggestion of mediation for eligible cases before litigation
- **Predictive outcome simulation:** Case outcome probability modelling based on historical similar cases
- **Community feed:** Anonymised similar case feed — citizens see how others resolved like disputes
- **Mobile native app:** React Native — shared codebase for citizen and lawyer portals
- **Real-time Gazette alerts:** Notify lawyers and citizens when laws relevant to active cases are amended



**NyayaAI — PRD v4.0**

Hackathon Build  ·  Full Dual-Side Marketplace  ·  BNS / BNSS / IPC / CPC  ·  5-Agent Pipeline
