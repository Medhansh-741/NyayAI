# BNS ↔ IPC cross reference (minimal hackathon version)

BNS_TO_IPC = {
    "316": "420",   # cheating
    "351": "378",   # theft
    "303": "302",   # murder
    "304": "304",   # culpable homicide
    "356": "392",   # robbery
}


def get_ipc_equivalent(bns_section):
    return BNS_TO_IPC.get(str(bns_section))