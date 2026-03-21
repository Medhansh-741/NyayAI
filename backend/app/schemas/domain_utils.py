from __future__ import annotations

from typing import Any

CANONICAL_DOMAINS: tuple[str, ...] = (
    'criminal',
    'family',
    'divorce',
    'property',
    'consumer',
    'cyber',
    'labour',
    'tax',
    'corporate',
    'intellectual_property',
    'constitutional',
    'civil',
    'tenant',
    'rti',
    'corruption',
    'other',
    'banking_finance',
    'insurance',
    'matrimonial',
    'immigration',
    'environmental',
    'medical_negligence',
    'motor_accident',
    'cheque_bounce',
    'debt_recovery',
    'arbitration',
    'service_matters',
    'land_acquisition',
    'wills_succession',
    'domestic_violence',
    'pocso',
    'sc_st_atrocities',
)

_DOMAIN_SET = set(CANONICAL_DOMAINS)

DOMAIN_ALIASES: dict[str, str] = {
    'banking': 'banking_finance',
    'finance': 'banking_finance',
    'banking_and_finance': 'banking_finance',
    'labor': 'labour',
    'labour_employment': 'labour',
    'labor_employment': 'labour',
    'ip': 'intellectual_property',
    'intellectualproperty': 'intellectual_property',
    'motoraccident': 'motor_accident',
    'chequebounce': 'cheque_bounce',
    'service': 'service_matters',
    'wills': 'wills_succession',
    'succession': 'wills_succession',
    'scst_atrocities': 'sc_st_atrocities',
}

DOMAIN_LABELS: dict[str, str] = {
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


def normalize_domain_value(value: str | None) -> str:
    if not value:
        return ''
    return (
        value.strip().lower().replace(' ', '_').replace('-', '_').replace('__', '_')
    )


def canonicalize_domain(value: Any) -> str:
    normalized = normalize_domain_value(str(value) if value is not None else None)
    if not normalized:
        return ''
    if normalized in _DOMAIN_SET:
        return normalized

    alias_hit = DOMAIN_ALIASES.get(normalized)
    if alias_hit:
        return alias_hit

    for key, label in DOMAIN_LABELS.items():
        if normalize_domain_value(label) == normalized:
            return key

    return normalized


def ensure_known_domain(value: Any) -> str:
    domain = canonicalize_domain(value)
    if domain not in _DOMAIN_SET:
        raise ValueError(f'Unsupported legal domain: {value}')
    return domain
