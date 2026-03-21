export const DOMAIN_LABELS: Record<string, string> = {
  consumer: 'Consumer Disputes',
  tenant: 'Tenant / Rent',
  labour: 'Labour & Employment',
  criminal: 'Criminal Law',
  cyber: 'Cyber Crime',
  property: 'Property Law',
  family: 'Family Law',
  rti: 'RTI',
  corruption: 'Anti-Corruption',
  civil: 'Civil Law',
  other: 'General Practice',
  tax: 'Tax Law',
  corporate: 'Corporate / Business',
  intellectual_property: 'Intellectual Property',
  constitutional: 'Constitutional / PIL',
  banking_finance: 'Banking & Finance',
  insurance: 'Insurance',
  matrimonial: 'Matrimonial',
  immigration: 'Immigration',
  environmental: 'Environmental Law',
  medical_negligence: 'Medical Negligence',
  motor_accident: 'Motor Accident Claims',
  cheque_bounce: 'Cheque Bounce (NI Act)',
  debt_recovery: 'Debt Recovery',
  arbitration: 'Arbitration & ADR',
  service_matters: 'Service Matters',
  land_acquisition: 'Land Acquisition',
  wills_succession: 'Wills & Succession',
  domestic_violence: 'Domestic Violence',
  pocso: 'POCSO',
  sc_st_atrocities: 'SC/ST Atrocities Act',
  divorce: 'Divorce',
}

const DOMAIN_ALIASES: Record<string, string> = {
  banking: 'banking_finance',
  finance: 'banking_finance',
  banking_and_finance: 'banking_finance',
  labor: 'labour',
  labor_employment: 'labour',
  labour_employment: 'labour',
  ip: 'intellectual_property',
  intellectualproperty: 'intellectual_property',
  chequebounce: 'cheque_bounce',
  motoraccident: 'motor_accident',
  service: 'service_matters',
  wills: 'wills_succession',
  succession: 'wills_succession',
  scst_atrocities: 'sc_st_atrocities',
}

const KNOWN_DOMAINS = new Set(Object.keys(DOMAIN_LABELS))

export function normalizeDomainValue(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
}

export function canonicalizeDomain(value: string | null | undefined): string {
  const normalized = normalizeDomainValue(value)
  if (!normalized) return ''
  if (KNOWN_DOMAINS.has(normalized)) return normalized

  const aliasHit = DOMAIN_ALIASES[normalized]
  if (aliasHit) return aliasHit

  for (const [key, label] of Object.entries(DOMAIN_LABELS)) {
    if (normalizeDomainValue(label) === normalized) return key
  }

  return normalized
}

export function isKnownDomain(value: string | null | undefined): boolean {
  return KNOWN_DOMAINS.has(canonicalizeDomain(value))
}

export function toDomainLabel(value: string | null | undefined): string {
  const canonical = canonicalizeDomain(value)
  if (!canonical) return ''
  return DOMAIN_LABELS[canonical] ?? canonical.replace(/_/g, ' ')
}

export function domainsMatch(left: string | null | undefined, right: string | null | undefined): boolean {
  const l = canonicalizeDomain(left)
  const r = canonicalizeDomain(right)
  return !!l && !!r && l === r
}

export function listHasDomain(domains: Array<string | null | undefined>, needle: string | null | undefined): boolean {
  const target = canonicalizeDomain(needle)
  if (!target) return false
  return domains.some((domain) => domainsMatch(domain, target))
}
