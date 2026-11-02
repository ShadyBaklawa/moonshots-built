/* Bundled fraud red-flag rules used by the client-side scanner.
   Each rule is a category of phrasing, not a single keyword, so near-matches
   (different wording, same tactic) are still caught. */
window.WGC_RULES = [
  {
    id: "urgency",
    label: "Urgency — pushes you to act before you can check",
    weight: 20,
    phrases: [
      "urgent",
      "urgently",
      "right away",
      "immediately",
      "before end of day",
      "as soon as possible",
      "don't delay",
      "do not delay",
      "time-sensitive",
      "time sensitive",
      "within the hour",
      "process it today",
      "needs to go out today",
      "has to go out today"
    ]
  },
  {
    id: "secrecy",
    label: "Secrecy — asks you to keep it quiet",
    weight: 20,
    phrases: [
      "don't tell anyone",
      "do not tell anyone",
      "keep this between us",
      "confidential",
      "don't mention this",
      "do not mention this",
      "keep this quiet",
      "do not discuss this",
      "between you and me",
      "no one else needs to know",
      "not to loop in",
      "handle this quietly"
    ]
  },
  {
    id: "changed_bank",
    label: "Changed bank details — new account to pay into",
    weight: 25,
    phrases: [
      "new account number",
      "updated bank",
      "new routing number",
      "change of bank",
      "new beneficiary",
      "new wiring instructions",
      "updated payment details",
      "switched banks",
      "new banking details",
      "new correspondent account"
    ]
  },
  {
    id: "new_channel",
    label: "New channel — contact isn't through the usual route",
    weight: 20,
    phrases: [
      "personal email",
      "new number",
      "texting you from",
      "can't talk on the phone",
      "cannot talk on the phone",
      "whatsapp",
      "different email than usual",
      "reach me at this number instead",
      "can't take calls right now",
      "send it by whatsapp"
    ]
  },
  {
    id: "authority",
    label: "Authority pressure — leans on a senior title",
    weight: 15,
    phrases: [
      "i'm the ceo",
      "i am the ceo",
      "on behalf of the ceo",
      "per our cfo",
      "this is the cfo",
      "acting on behalf of",
      "authorized by the board",
      "board authorized him directly",
      "as your manager",
      "the owner asked me",
      "head office"
    ]
  }
];
