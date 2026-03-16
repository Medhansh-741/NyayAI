"""
engine_rules.py — Fallback strategy engine
Used ONLY when Gemini is unavailable (no key, rate limit, network down).
Deterministic, zero dependencies, covers all 9 NyayAI dispute types.

Do NOT add new features here — improve engine_gemini.py instead.
"""

from case_state import CaseState, ActionPlan, ActionStep

# ── Forum routing ─────────────────────────────────────────────────────────────

FORUM_MAP = {
    "tenant_landlord_deposit":   ("Lok Adalat / Civil Court",                 "Lok Adalat is free and resolves deposit disputes in 1–2 hearings under Transfer of Property Act 1882"),
    "tenant_landlord_eviction":  ("Civil Court",                              "Eviction requires Civil Court under state Rent Control Act"),
    "consumer_fraud":            ("District Consumer Forum",                  "Consumer Protection Act 2019 s.34 — claims under ₹50L go to District Forum"),
    "consumer_deficiency":       ("District Consumer Forum",                  "Service deficiency under Consumer Protection Act 2019 s.35"),
    "wrongful_termination":      ("Labour Court",                             "Industrial Disputes Act 1947 s.2A — wrongful termination requires Labour Court"),
    "wage_theft":                ("Labour Commissioner",                      "Payment of Wages Act 1936 — file with Labour Commissioner first"),
    "criminal_assault":          ("Police Station (FIR under BNS 2023)",      "Cognizable offence — FIR mandatory, police cannot refuse under BNSS 2023"),
    "criminal_fraud":            ("Police Station + Civil Court",             "FIR under BNS 2023 s.318 + civil recovery suit"),
    "cyber_crime":               ("Cyber Crime Cell (cybercrime.gov.in)",     "IT Act 2000 — report online for fast response, also local Cyber Cell"),
    "property_dispute":          ("Civil Court",                              "Property disputes require Civil Court — try mediation first"),
    "family_domestic_violence":  ("Magistrate Court",                         "Domestic Violence Act 2005 — Protection Order from Magistrate"),
    "family_maintenance":        ("Family Court",                             "Hindu Marriage Act / BNSS 2023 s.144 — maintenance via Family Court"),
    "rti_refusal":               ("Central / State Information Commission",   "RTI Act 2005 s.19 — First Appeal to senior PIO, then CIC/SIC"),
    "corruption_complaint":      ("CVC / Lokayukta",                         "Prevention of Corruption Act 1988 — CVC for central, Lokayukta for state"),
    "default":                   ("Civil Court",                              "General civil dispute — Civil Court jurisdiction"),
}

IMMEDIATE_STEPS = {
    "tenant_landlord_deposit": [
        ActionStep(step="Document all evidence", description="Photograph rent agreement, bank transfer receipt, and all WhatsApp/email messages with landlord. Do this today before anything else.", deadline="Today", priority="high"),
        ActionStep(step="Send written demand notice", description="Send formal notice via WhatsApp AND registered post demanding deposit return within 15 days. Cite Transfer of Property Act s.106 and state Rent Control Act.", deadline="Within 48 hours", priority="high"),
        ActionStep(step="File with Rent Authority if ignored", description="If landlord does not respond in 15 days, file application at District Rent Control Court.", deadline="Day 15 after notice", priority="medium"),
    ],
    "consumer_fraud": [
        ActionStep(step="Collect all transaction proof", description="Gather order confirmation, payment receipts, screenshots, delivery photos — everything timestamped.", deadline="Today", priority="high"),
        ActionStep(step="File on consumerhelpline.gov.in", description="Register complaint on National Consumer Helpline 1800-11-4000. Get complaint number — this is your paper trail.", deadline="Within 24 hours", priority="high"),
        ActionStep(step="Send legal notice to company", description="Email and registered post to company's registered address citing Consumer Protection Act 2019 s.35.", deadline="Within 48 hours", priority="high"),
    ],
    "wrongful_termination": [
        ActionStep(step="Secure all employment documents", description="Get appointment letter, last 6 months salary slips, offer letter, any termination notice — do this immediately before access is revoked.", deadline="Today", priority="high"),
        ActionStep(step="Demand written termination reason", description="Email HR formally asking for written reason and full & final settlement details.", deadline="Within 24 hours", priority="high"),
        ActionStep(step="File complaint with Labour Commissioner", description="Lodge complaint at district Labour Commissioner's office under Industrial Disputes Act 1947.", deadline="Within 3 days", priority="high"),
    ],
    "criminal_assault": [
        ActionStep(step="Get Medico-Legal Certificate (MLC)", description="Immediate medical examination — MLC is critical evidence. Go to government hospital for free MLC.", deadline="Immediately", priority="high"),
        ActionStep(step="File FIR at police station", description="Police cannot legally refuse FIR for cognizable offence under BNS 2023. If refused, approach SP/DSP directly.", deadline="Within 24 hours", priority="high"),
        ActionStep(step="Photograph all injuries", description="Document all visible injuries with timestamps before they heal.", deadline="Today", priority="high"),
    ],
    "rti_refusal": [
        ActionStep(step="File First Appeal", description="PIO did not respond within 30 days — file First Appeal to officer senior to PIO at same department under RTI Act 2005 s.19(1).", deadline="Within 30 days of PIO deadline", priority="high"),
        ActionStep(step="Document your RTI trail", description="Keep copies of original application, postal receipt, PIO response or non-response proof.", deadline="Today", priority="high"),
    ],
    "cyber_crime": [
        ActionStep(step="Report on cybercrime.gov.in immediately", description="For financial fraud, golden hour matters — faster report = better chance of fund freeze.", deadline="Immediately", priority="high"),
        ActionStep(step="Call bank fraud helpline", description="If money stolen, call your bank's 24hr fraud helpline to freeze transactions right now.", deadline="Within 1 hour", priority="high"),
        ActionStep(step="Preserve all digital evidence", description="Screenshot everything — phishing messages, transaction IDs, fraudulent pages. Do not delete anything.", deadline="Today", priority="high"),
    ],
    "default": [
        ActionStep(step="Secure all evidence", description="Gather and photograph all documents, messages, contracts, receipts related to your dispute.", deadline="Today", priority="high"),
        ActionStep(step="Send written notice to other party", description="Formal written notice via registered post describing dispute and your demand.", deadline="Within 48 hours", priority="medium"),
    ],
}

MEDIUM_TERM_STEPS = {
    "tenant_landlord_deposit": [
        ActionStep(step="Approach Lok Adalat", description="Lok Adalat is free, binding, and resolves deposit disputes in 1–2 hearings. Contact District Legal Services Authority.", deadline="Within 1 month", priority="medium"),
        ActionStep(step="File Civil Court suit if needed", description="If Lok Adalat fails, file recovery suit for deposit + 18% interest + damages.", deadline="Within 3 months", priority="low"),
    ],
    "consumer_fraud": [
        ActionStep(step="File at District Consumer Forum", description="File written complaint with ₹100–500 fee. No lawyer required for claims under ₹50L. Attach all evidence copies.", deadline="Within 2 months", priority="medium"),
    ],
    "wrongful_termination": [
        ActionStep(step="Attend conciliation proceedings", description="Labour Commissioner will schedule conciliation meeting — attend with all documents.", deadline="As per notice", priority="high"),
        ActionStep(step="File Industrial Dispute if conciliation fails", description="File with Labour Court under IDA 1947 s.2A. Limitation: 3 years from termination.", deadline="Within 3 months of termination", priority="medium"),
    ],
    "rti_refusal": [
        ActionStep(step="File Second Appeal with CIC/SIC", description="If First Appeal fails, file Second Appeal with Central/State Information Commission under RTI 2005 s.19(3) within 90 days.", deadline="Within 90 days of First Appeal deadline", priority="medium"),
    ],
    "default": [
        ActionStep(step="Explore Lok Adalat mediation", description="Free, faster than court, binding. Contact District Legal Services Authority.", deadline="Within 1 month", priority="medium"),
    ],
}

EVIDENCE = {
    "tenant_landlord_deposit":  ["Rent agreement / lease deed (signed copy)", "Bank transfer receipt or UPI screenshot for deposit", "WhatsApp/email messages demanding return", "Rent payment receipts", "Photos of property at move-out", "Prior written communication about deposit"],
    "consumer_fraud":           ["Order confirmation / purchase receipt", "Payment proof (bank statement, UPI screenshot)", "Screenshots of product listing", "All communication with seller", "Photos of defective/missing product", "Delivery failure proof"],
    "wrongful_termination":     ["Appointment / offer letter", "Last 6 months salary slips", "Termination letter (if any)", "Performance review records", "All HR email communication", "PF and gratuity records"],
    "criminal_assault":         ["Medico-Legal Certificate (MLC)", "Photos of injuries (timestamped)", "Witness names and contact details", "CCTV footage (request immediately)", "Medical bills and treatment records"],
    "cyber_crime":              ["Screenshots of fraud messages/website", "Transaction IDs and bank statement", "Email headers of phishing emails", "Cybercrime portal complaint acknowledgment"],
    "rti_refusal":              ["Original RTI application copy", "Postal/email proof of submission", "PIO response or non-response proof", "First Appeal filing receipt"],
    "default":                  ["All contracts or agreements", "All payment records", "All written communication", "Witness contact details", "Photographs or video if available"],
}

AVOID = {
    "tenant_landlord_deposit":  ["Do not vacate without resolving deposit in writing", "Do not make verbal agreements about deposit", "Do not sign anything from landlord without reading fully", "Do not damage property — gives landlord grounds to withhold"],
    "consumer_fraud":           ["Do not dispose of the defective product", "Do not accept partial refund without written full-settlement confirmation", "Do not delete any screenshots or reviews — they are evidence"],
    "wrongful_termination":     ["Do not sign settlement documents under pressure", "Do not return company property without written acknowledgment", "Do not resign — if they want you out, make them terminate you formally"],
    "criminal_assault":         ["Do not delay filing FIR — evidence degrades fast", "Do not confront the accused alone", "Do not post about it on social media before legal proceedings begin"],
    "default":                  ["Do not destroy any documents or messages", "Do not make verbal agreements — get everything in writing", "Do not sign anything without reading fully"],
}

TIMELINES = {
    "tenant_landlord_deposit":  "Lok Adalat: 1–2 months | Civil Court: 6–18 months",
    "consumer_fraud":           "District Forum: 3–9 months | State Commission: 6–18 months",
    "wrongful_termination":     "Conciliation: 1–3 months | Labour Court: 1–3 years",
    "rti_refusal":              "First Appeal: 30–45 days | CIC/SIC: 3–9 months",
    "cyber_crime":              "Police investigation: 3–12 months",
    "criminal_assault":         "FIR to chargesheet: 2–6 months | Trial: 1–5 years",
    "default":                  "Mediation: 1–3 months | Civil Court: 1–5 years",
}

COSTS = {
    "tenant_landlord_deposit":  "Lok Adalat: Free | Civil Court filing: ₹200–₹1,000",
    "consumer_fraud":           "District Forum: ₹100–₹500 | No lawyer needed for claims under ₹50L",
    "wrongful_termination":     "Labour Commissioner: Free | Labour Court: ₹500–₹2,000",
    "rti_refusal":              "First Appeal: Free | CIC/SIC: Free",
    "cyber_crime":              "Cybercrime portal: Free | Police complaint: Free",
    "criminal_assault":         "FIR filing: Free | Legal aid if income under ₹1L/year",
    "default":                  "Lok Adalat: Free | District Court: ₹500–₹5,000",
}

LAWYER_NEEDED = {
    "wrongful_termination":     (True, "Labour disputes are procedurally complex — correct IDA 1947 filings need a lawyer"),
    "criminal_assault":         (True, "Criminal matters benefit from representation, especially if accused is influential"),
    "property_dispute":         (True, "Title verification and civil procedure require a lawyer"),
    "family_domestic_violence": (True, "Protection orders need sensitive legal handling — lawyer strongly recommended"),
    "criminal_fraud":           (True, "Parallel civil and criminal proceedings need a lawyer to coordinate strategy"),
}

MEDIATION = {
    "tenant_landlord_deposit": (True,  "Lok Adalat is ideal — free, fast, binding, no court fee"),
    "property_dispute":        (True,  "Pre-litigation mediation can save years of court time"),
    "family_maintenance":      (True,  "Family Court mandates mediation attempt before hearing"),
}

DOCUMENT_TYPES = {
    "tenant_landlord_deposit":   ["legal_notice"],
    "consumer_fraud":            ["legal_notice", "consumer_complaint"],
    "consumer_deficiency":       ["legal_notice", "consumer_complaint"],
    "wrongful_termination":      ["legal_notice", "lawyer_brief"],
    "wage_theft":                ["legal_notice"],
    "criminal_assault":          ["fir_draft"],
    "criminal_fraud":            ["fir_draft", "legal_notice"],
    "cyber_crime":               ["fir_draft"],
    "rti_refusal":               ["rti_application"],
    "corruption_complaint":      ["corruption_complaint"],
    "property_dispute":          ["legal_notice", "lawyer_brief"],
    "family_domestic_violence":  ["legal_notice", "lawyer_brief"],
    "default":                   ["legal_notice"],
}

HINDI_FORUMS = {
    "Lok Adalat / Civil Court":                  "लोक अदालत / दीवानी न्यायालय",
    "District Consumer Forum":                   "जिला उपभोक्ता फोरम",
    "Labour Court":                              "श्रम न्यायालय",
    "Labour Commissioner":                       "श्रम आयुक्त",
    "Civil Court":                               "दीवानी न्यायालय",
    "Family Court":                              "पारिवारिक न्यायालय",
    "Magistrate Court":                          "मजिस्ट्रेट न्यायालय",
    "Police Station (FIR under BNS 2023)":       "पुलिस स्टेशन — BNS 2023 के तहत FIR",
    "Central / State Information Commission":    "केंद्रीय/राज्य सूचना आयोग",
    "CVC / Lokayukta":                           "केंद्रीय सतर्कता आयोग / लोकायुक्त",
    "Cyber Crime Cell (cybercrime.gov.in)":      "साइबर क्राइम सेल",
}

HINGLISH_FORUMS = {
    "Lok Adalat / Civil Court":                  "Lok Adalat ya Civil Court",
    "District Consumer Forum":                   "District Consumer Forum (Jila Upbhokta Forum)",
    "Labour Court":                              "Labour Court (Shram Nyayalay)",
    "Police Station (FIR under BNS 2023)":       "Police Station mein FIR (BNS 2023 ke under)",
    "Central / State Information Commission":    "Central ya State Information Commission",
    "CVC / Lokayukta":                           "CVC ya Lokayukta",
}


def run_rules_engine(state: CaseState) -> ActionPlan:
    dt      = (state.structured_facts.incident_type or "default").lower() if state.structured_facts else "default"
    matched = next((k for k in FORUM_MAP if k in dt or dt in k), "default")
    lang    = state.language_preference

    forum, forum_reason = FORUM_MAP[matched]
    if lang == "hindi":
        forum = HINDI_FORUMS.get(forum, forum)
    elif lang == "hinglish":
        forum = HINGLISH_FORUMS.get(forum, forum)

    immediate   = IMMEDIATE_STEPS.get(matched, IMMEDIATE_STEPS["default"])
    medium_term = MEDIUM_TERM_STEPS.get(matched, MEDIUM_TERM_STEPS["default"])

    lawyer_flag, lawyer_reason = LAWYER_NEEDED.get(matched, (False, None))
    if state.legal_mapping and state.legal_mapping.legal_standing_score == "weak":
        lawyer_flag  = True
        lawyer_reason = (lawyer_reason or "") + " Case standing is weak — professional help strongly recommended."

    med_rec, med_reason = MEDIATION.get(matched, (False, None))

    escalation_bases = {
        "tenant_landlord_deposit": "Written demand → Lok Adalat → Civil Court → High Court",
        "consumer_fraud":          "Helpline complaint → Legal notice → District Forum → State Commission → NCDRC",
        "wrongful_termination":    "HR grievance → Labour Commissioner (conciliation) → Labour Court → High Court",
        "rti_refusal":             "PIO → First Appellate Authority → CIC/SIC → High Court (writ)",
        "cyber_crime":             "Cybercrime portal → Local Cyber Cell → SP Cyber → CBI",
        "criminal_assault":        "FIR → Chargesheet → Sessions Court → High Court",
    }
    escalation = escalation_bases.get(matched, "Written notice → Mediation → District Court → High Court")
    if state.legal_mapping and state.legal_mapping.legal_standing_score == "weak":
        escalation += " | Build stronger evidence before escalating"

    doc_types = DOCUMENT_TYPES.get(matched, DOCUMENT_TYPES["default"])
    if lawyer_flag and "lawyer_brief" not in doc_types:
        doc_types = doc_types + ["lawyer_brief"]

    # Extract demand amount from facts if possible
    demand_amount = "As per actual loss and damages"
    if state.structured_facts:
        for fact in state.structured_facts.key_facts:
            if "₹" in fact:
                import re
                amounts = re.findall(r'₹[\d,]+', fact)
                if amounts:
                    demand_amount = f"{amounts[0]} principal + 18% interest per annum + compensation for harassment"
                    break

    return ActionPlan(
        immediate=immediate,
        medium_term=medium_term,
        forum_selection=forum,
        forum_selection_reason=forum_reason,
        escalation_path=escalation,
        timeline_estimate=TIMELINES.get(matched, TIMELINES["default"]),
        cost_estimate=COSTS.get(matched, COSTS["default"]),
        lawyer_recommended=lawyer_flag,
        lawyer_recommended_reason=lawyer_reason,
        evidence_checklist=EVIDENCE.get(matched, EVIDENCE["default"]),
        avoid_list=AVOID.get(matched, AVOID["default"]),
        mediation_recommended=med_rec,
        mediation_reason=med_reason,
        document_types_required=doc_types,
        demand_amount=demand_amount,
        relief_sought=f"Resolution of {matched.replace('_', ' ')} dispute as per applicable Indian law",
    )
