from __future__ import annotations

import os
from typing import Any

from supabase import Client, create_client

CANONICAL_DOMAINS = {
    'criminal', 'family', 'divorce', 'property', 'consumer', 'cyber', 'labour',
    'tax', 'corporate', 'intellectual_property', 'constitutional', 'civil',
    'tenant', 'rti', 'corruption', 'other', 'banking_finance', 'insurance',
    'matrimonial', 'immigration', 'environmental', 'medical_negligence',
    'motor_accident', 'cheque_bounce', 'debt_recovery', 'arbitration',
    'service_matters', 'land_acquisition', 'wills_succession',
    'domestic_violence', 'pocso', 'sc_st_atrocities',
}

DOMAIN_ALIASES = {
    'banking': 'banking_finance',
    'finance': 'banking_finance',
    'banking_and_finance': 'banking_finance',
    'labor': 'labour',
    'labor_employment': 'labour',
    'labour_employment': 'labour',
    'ip': 'intellectual_property',
    'intellectualproperty': 'intellectual_property',
    'motoraccident': 'motor_accident',
    'chequebounce': 'cheque_bounce',
    'service': 'service_matters',
    'wills': 'wills_succession',
    'succession': 'wills_succession',
    'scst_atrocities': 'sc_st_atrocities',
}

DOMAIN_LABELS = {
    'consumer': 'consumer disputes',
    'tenant': 'tenant / rent',
    'labour': 'labour & employment',
    'criminal': 'criminal law',
    'cyber': 'cyber crime',
    'property': 'property law',
    'family': 'family law',
    'rti': 'rti',
    'corruption': 'anti-corruption',
    'civil': 'civil law',
    'other': 'general practice',
    'tax': 'tax law',
    'corporate': 'corporate / business',
    'intellectual_property': 'intellectual property',
    'constitutional': 'constitutional / pil',
    'banking_finance': 'banking & finance',
    'insurance': 'insurance',
    'matrimonial': 'matrimonial',
    'immigration': 'immigration',
    'environmental': 'environmental law',
    'medical_negligence': 'medical negligence',
    'motor_accident': 'motor accident claims',
    'cheque_bounce': 'cheque bounce (ni act)',
    'debt_recovery': 'debt recovery',
    'arbitration': 'arbitration & adr',
    'service_matters': 'service matters',
    'land_acquisition': 'land acquisition',
    'wills_succession': 'wills & succession',
    'domestic_violence': 'domestic violence',
    'pocso': 'pocso',
    'sc_st_atrocities': 'sc/st atrocities act',
    'divorce': 'divorce',
}


def normalize(value: str | None) -> str:
    if not value:
        return ''
    normalized = value.strip().lower().replace(' ', '_').replace('-', '_')
    while '__' in normalized:
        normalized = normalized.replace('__', '_')
    return normalized


def canonicalize(value: Any) -> str:
    normalized = normalize(str(value) if value is not None else None)
    if not normalized:
        return ''
    if normalized in CANONICAL_DOMAINS:
        return normalized
    alias = DOMAIN_ALIASES.get(normalized)
    if alias:
        return alias
    for key, label in DOMAIN_LABELS.items():
        if normalize(label) == normalized:
            return key
    return normalized


def extract_incident_type(confirmed_facts: Any) -> str:
    if not isinstance(confirmed_facts, dict):
        return ''
    incident = confirmed_facts.get('incident_type')
    return canonicalize(incident)


def get_client() -> Client:
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        raise RuntimeError('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.')
    return create_client(url, key)


def migrate_cases(client: Client) -> tuple[int, int]:
    response = client.table('cases').select('id,domain,confirmed_facts').execute()
    rows = response.data or []
    scanned = len(rows)
    updated = 0

    for row in rows:
        current = row.get('domain')
        canonical_current = canonicalize(current)
        recovered = extract_incident_type(row.get('confirmed_facts'))

        next_domain = canonical_current
        if (not next_domain or next_domain == 'other') and recovered in CANONICAL_DOMAINS and recovered != 'other':
            next_domain = recovered

        if next_domain and next_domain != current:
            client.table('cases').update({'domain': next_domain}).eq('id', row['id']).execute()
            updated += 1

    return scanned, updated


def migrate_lawyer_specialisations(client: Client) -> tuple[int, int]:
    response = client.table('lawyer_profiles').select('id,specialisations').execute()
    rows = response.data or []
    scanned = len(rows)
    updated = 0

    for row in rows:
        raw_specs = row.get('specialisations') or []
        if not isinstance(raw_specs, list):
            continue

        normalized: list[str] = []
        seen: set[str] = set()
        for spec in raw_specs:
            canonical = canonicalize(spec)
            if not canonical or canonical in seen:
                continue
            seen.add(canonical)
            normalized.append(canonical)

        if normalized != raw_specs:
            client.table('lawyer_profiles').update({'specialisations': normalized}).eq('id', row['id']).execute()
            updated += 1

    return scanned, updated


def main() -> None:
    client = get_client()

    case_scanned, case_updated = migrate_cases(client)
    profile_scanned, profile_updated = migrate_lawyer_specialisations(client)

    print('Domain normalization complete.')
    print(f'cases: scanned={case_scanned} updated={case_updated}')
    print(f'lawyer_profiles: scanned={profile_scanned} updated={profile_updated}')


if __name__ == '__main__':
    main()
