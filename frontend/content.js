// The content of every stage. EDIT THIS FILE with what you find in the 100 transcripts:
//   say  = what prospects tend to say at this stage (use their real phrasing)
//   taps = what happened at this stage (short, tappable)
// The first draft below comes from the "structure of a cold call" reading.
window.STAGES = [
  {
    name: "Opening",
    purpose: "Reach the right person and say who you are. They decide in ten seconds if this is worth a minute.",
    say: [
      "“What is this regarding?” (an assistant or switchboard)",
      "“I am driving / in a meeting / at lunch.”",
      "“He left the company last year.”",
    ],
    taps: ["Reached the right person", "Assistant asked the reason", "Bad time, they are busy", "Wrong person or number"],
  },
  {
    name: "Purpose",
    purpose: "Say why you called in one or two sentences they could repeat to a colleague.",
    say: [
      "“What does your company do?” (often asked twice)",
      "“Where did you get my number?”",
      "“Is this a sales call?”",
    ],
    taps: ["Asked what we do", "Asked where we got the number", "Called it a sales call", "Let me go on"],
  },
  {
    name: "Permission",
    purpose: "Find out if they will talk now. A clear yes, a clear no, or a callback time are all good. Talking on without one is not.",
    say: [
      "“Call me after two.” / “Call tomorrow.”",
      "“Send it on WhatsApp first.”",
      "A short “yes”, then silence",
    ],
    taps: ["Clear yes", "Clear no", "Gave a callback time", "Asked for WhatsApp first"],
  },
  {
    name: "Their business",
    purpose: "Ask about their company and work before saying anything about yours.",
    say: [
      "A one-line answer, then they wait for the pitch",
      "“We do not make that. We are not that size.”",
      "“First tell me about yourself.”",
    ],
    taps: ["Described their business", "One-line answer only", "Corrected our assumption", "Asked about us first"],
  },
  {
    name: "Their need",
    purpose: "Hear what they are trying to do or struggling with. Write down exactly what they say.",
    say: [
      "A goal: a new market, a new product line, a plant below capacity",
      "“Everything is fine. We need nothing.”",
      "“What can you do for a company like ours?”",
    ],
    taps: ["Named a goal", "Named a problem", "Said they need nothing", "Asked what we can do"],
  },
  {
    name: "Objection",
    purpose: "Hear the reason for the no and understand it. A reason you talked over cannot be answered.",
    say: [
      "“We already have an agency / consultant / in-house team.”",
      "“Not the right person. Talk to marketing / the owner.”",
      "“Send something in writing and we will see.”",
    ],
    taps: ["Already has a provider", "Wrong person", "Send it in writing", "No reason given"],
  },
  {
    name: "Next step",
    purpose: "Agree ONE concrete thing with a time or a channel: a document, a call, a meeting.",
    say: [
      "“Yes, send the document.” (may be politeness)",
      "A time they name themselves",
      "A referral to a colleague, with or without a number",
    ],
    taps: ["Document on WhatsApp or email", "They named a time", "Meeting agreed", "Referred to a colleague"],
  },
  {
    name: "Close",
    purpose: "End clearly. Record the outcome, the next step and their words from the need stage.",
    say: [
      "The line drops or they hang up mid-sentence",
      "A warm goodbye after a no (still a no)",
    ],
    taps: ["Clean goodbye", "They hung up", "Line dropped", "Warm but no"],
  },
];

window.OUTCOMES = [
  ["next_step_agreed", "Next step agreed"],
  ["callback_time", "Callback time given"],
  ["referred", "Referred to a colleague"],
  ["not_interested", "Not interested"],
  ["wrong_person", "Wrong person or number"],
  ["dropped", "Call dropped"],
];
