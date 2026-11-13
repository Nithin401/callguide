// The content of every stage. Grounded in the 100 cold-call transcripts:
//   say  = what prospects tend to say at this stage (real verbatim phrasing)
//   taps = what happened at this stage (fast, single-tap categorization)

window.STAGES = [
  {
    name: "Opening",
    purpose: "Reach the right person and confirm who you are speaking with. They decide in ten seconds whether this call is worth their time.",
    say: [
      "“Speaking, what is this regarding?”",
      "“He is in a meeting right now, please call back later.”",
      "“Who is calling and from which company?”",
      "“This is a personal number, who gave it to you?”",
    ],
    taps: [
      "Reached decision maker",
      "Gatekeeper / Assistant blocked",
      "Busy / driving / in meeting",
      "Wrong person or number",
    ],
  },
  {
    name: "Purpose",
    purpose: "State why you called in one concise, repeatable sentence tailored to their operational context.",
    say: [
      "“What is this regarding? Tell me in one sentence.”",
      "“Where did you get my direct number?”",
      "“Is this a sales or promotional call?”",
      "“Drop an email to info@ with your company deck.”",
      "“We don't take uninvited vendor pitches.”",
    ],
    taps: [
      "Asked what this is regarding",
      "Skeptical: Where did you get my number",
      "Called it a sales pitch",
      "Told to send email to info@",
      "Understood and let me proceed",
    ],
  },
  {
    name: "Permission",
    purpose: "Establish consent to talk right now. A clear 2-minute green light, a WhatsApp request, or an exact callback time are all valid progressions.",
    say: [
      "“Ping me on WhatsApp first, I'll see if we need it.”",
      "“I only have two minutes, tell me quickly.”",
      "“Not a good time, call me back post 6 PM.”",
      "“Send brochure on WhatsApp, then we will see.”",
      "“Not interested right now, don't call back.”",
    ],
    taps: [
      "Clear yes (has 2 minutes)",
      "Asked for WhatsApp first",
      "Specific callback time given",
      "Flat refusal / Not interested",
    ],
  },
  {
    name: "Their business",
    purpose: "Understand their current operating model and volume before presenting any solution.",
    say: [
      "“We already have an in-house team handling operations.”",
      "“We are a 40-person plant, we aren't large enough for that.”",
      "“We do contract manufacturing, not B2C sales.”",
      "“You should check our website first before cold calling.”",
    ],
    taps: [
      "Described workflow & setup",
      "Corrected scale / business model",
      "One-line defensive answer",
      "Asked how we handle their specific niche",
    ],
  },
  {
    name: "Their need",
    purpose: "Uncover a concrete operational bottleneck or growth target. Capture their exact words.",
    say: [
      "“Our main problem is high lead turnaround time and missed follow-ups.”",
      "“Everything is running smoothly, we aren't looking for any changes.”",
      "“We want to expand to Tier-2 cities but acquisition cost is too high.”",
      "“Our current tool is clunky and sales reps hate updating it.”",
    ],
    taps: [
      "Named specific operational bottleneck",
      "Stated a concrete growth target",
      "Claimed everything is fine / no need",
      "Expressed frustration with current tool",
    ],
  },
  {
    name: "Objection",
    purpose: "Uncover the real hesitation (vendor lock-in, budget freeze, lack of authority) rather than superficial brush-offs.",
    say: [
      "“We are locked into an annual contract with our vendor till next year.”",
      "“Budget is completely frozen for Q3/Q4.”",
      "“I am not the decision maker. The Owner / MD handles purchases.”",
      "“Just send your profile on email, we will get back if interested.”",
      "“We tried a similar solution last year and lost money.”",
    ],
    taps: [
      "Locked with existing vendor",
      "Budget freeze / cost constraint",
      "Not decision maker (Owner/MD)",
      "Polite brush-off (Send email profile)",
      "Burned by past vendor",
    ],
  },
  {
    name: "Next step",
    purpose: "Lock in ONE actionable commitment with an exact time or channel (WhatsApp deck, calendar invite, follow-up call).",
    say: [
      "“Send the one-pager on WhatsApp and call me Thursday at 4 PM.”",
      "“Share a Google Meet invite for Friday 11 AM with my tech lead.”",
      "“Connect with my procurement manager on this WhatsApp number.”",
      "“Send the PDF, if I find it relevant I will reply.”",
    ],
    taps: [
      "Confirmed meeting / demo with calendar time",
      "Specific callback time agreed",
      "One-pager on WhatsApp requested",
      "Referred to colleague with contact info",
    ],
  },
  {
    name: "Close",
    purpose: "End professionally. Confirm the agreed next step and record the prospect's verbatim feedback.",
    say: [
      "“Okay, talk to you Thursday at 4 PM. Goodbye.”",
      "“Send the WhatsApp details, let's see. Bye.”",
      "Abrupt disconnection / Prospect hung up mid-sentence",
      "Polite warm goodbye despite no commitment",
    ],
    taps: [
      "Clean mutual agreement & goodbye",
      "Conditional callback agreed",
      "Abrupt hangup / Call dropped",
      "Polite dismissal (warm no)",
    ],
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
