STATE_LAW_VARIATIONS = {

    "Maharashtra": {
        "consumer_forum": "Maharashtra State Consumer Disputes Redressal Commission",
        "rent_act": "Maharashtra Rent Control Act"
    },

    "Delhi": {
        "consumer_forum": "Delhi State Consumer Disputes Redressal Commission",
        "rent_act": "Delhi Rent Control Act"
    },

    "Karnataka": {
        "consumer_forum": "Karnataka State Consumer Disputes Redressal Commission"
    },

    "Uttar Pradesh": {
        "consumer_forum": "UP State Consumer Disputes Redressal Commission"
    }
}


def get_state_law(state):

    if state in STATE_LAW_VARIATIONS:
        # Convert the dictionary values into a list of strings
        # e.g. ["Maharashtra State Consumer Disputes Redressal Commission", "Maharashtra Rent Control Act"]
        return list(STATE_LAW_VARIATIONS[state].values())

    return ["No special state variation found"]