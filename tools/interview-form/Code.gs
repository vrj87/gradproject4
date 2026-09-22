/**
 * Creates the Phase 3 Google Form (screener + moderator notes).
 * A form may screen. It is not the interview.
 */
function createInstrument() {
  const form = FormApp.create(
    "Google Photos — vague-memory retrieval (Phase 3 screener + interview notes)"
  );

  form.setDescription(
    "Fellowship study on finding a photo you remember but cannot precisely describe.\n\n" +
      "THIS FORM IS NOT THE INTERVIEW. Part 3 is a 30–40 minute conversation. " +
      "Respondents: complete section A so we can book you. " +
      "Moderators: complete section B during or right after the live call.\n\n" +
      "Do not write real names. Use r01, r02… No Google / Photos employees."
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  form.setProgressBar(true);
  form.setShowLinkToRespondAgain(true);
  form.setLimitOneResponsePerUser(false);
  form.setConfirmationMessage(
    "If you are a respondent: we will only contact you to book a 30–40 min interview. " +
      "Submitting this form is not participation in the study. " +
      "If you are the moderator: copy this response into docs/research/interview-notes/rXX.md."
  );

  form
    .addSectionHeaderItem()
    .setTitle("How to use this form")
    .setHelpText(
      "North-star: successful retrieval of a photo the person remembers but cannot precisely describe. " +
        "Not generic search quality. Stay on one failed find. Do not prompt “better search.”"
    );

  const who = form.addMultipleChoiceItem().setRequired(true);
  const screenerPage = form.addPageBreakItem().setTitle("A · Recruitment screener");
  addScreener(form);
  const afterScreener = form.addPageBreakItem().setTitle("Screener received");
  afterScreener.setHelpText("Thank you. We will book a live interview if you qualify. Stop here.");
  afterScreener.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  const interviewPage = form.addPageBreakItem().setTitle("B · Live interview notes (moderator)");
  addInterview(form);

  who
    .setTitle("Who is filling this form?")
    .setHelpText("Respondents only see the screener. Moderators skip to interview notes.")
    .setChoices([
      who.createChoice("Respondent — I am applying for a 30–40 min interview", FormApp.PageNavigationType.CONTINUE),
      who.createChoice("Moderator — notes from a live interview", interviewPage)
    ]);

  const published = form.getPublishedUrl();
  const edit = form.getEditUrl();
  PropertiesService.getScriptProperties().setProperty("PUBLISHED_URL", published);
  PropertiesService.getScriptProperties().setProperty("EDIT_URL", edit);
  Logger.log(published);
  Logger.log(edit);
  return { publishedUrl: published, editUrl: edit, formId: form.getId() };
}

function addScreener(form) {
  form
    .addSectionHeaderItem()
    .setTitle("Eligibility")
    .setHelpText(
      "We need people who use Google Photos as their main library and once failed to find a photo they still remember. " +
        "If you always find photos by scrolling a small camera roll, this study is not a fit."
    );

  form
    .addMultipleChoiceItem()
    .setTitle("I understand this form only screens me. The study is a 30–40 minute conversation, not this questionnaire.")
    .setChoiceValues(["Yes — I want to be considered for a live interview"])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("I am not a Google or Google Photos employee, and I am not close family of someone on that team.")
    .setChoiceValues(["True", "False — I should not take part"])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("How long has Google Photos been your primary photo library?")
    .setChoiceValues(["Less than 12 months", "12–24 months", "2–5 years", "More than 5 years"])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("Roughly how many items (photos, videos, screenshots) are in that library?")
    .setChoiceValues(["Under 500 — I can usually scroll to what I want", "500–2,000", "2,000–10,000", "More than 10,000"])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("When you need an old photo, what do you usually do first?")
    .setChoiceValues([
      "Type in Search",
      "Scroll the Photos timeline",
      "Open an album",
      "Open Memories",
      "Ask someone else or check another phone",
      "Look in another app (WhatsApp, Files, Apple Photos, gallery)"
    ])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle(
      "Can you think of at least one photo you knew was in Google Photos but could not find the first time you looked?"
    )
    .setChoiceValues(["Yes — I can talk about that photo on a call", "No — I always find what I look for"])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("Which best describes that photo? (pick the closest)")
    .setChoiceValues([
      "S2 — a trip, holiday, wedding, concert, or “that place”",
      "S3 — an object, medicine, receipt, screenshot, or document",
      "S4 — a person whose face I remember",
      "S5 — family / kids / a photo that also lives on someone else’s phone",
      "S1 — it is buried in years of mixed photos"
    ])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("When you started looking, did you already remember the exact date, album name, or filename?")
    .setHelpText("If yes, that is a known-item find — useful as a control, not the core study.")
    .setChoiceValues([
      "No — I remembered a vibe, object, person, or episode, not those details",
      "Yes — I knew the date, album, or filename"
    ])
    .setRequired(true);

  form
    .addParagraphTextItem()
    .setTitle("In one or two sentences, what photo was it? Do not worry if you forgot the date.")
    .setRequired(true);

  form
    .addTextItem()
    .setTitle("Email so we can book the interview (not published; not used as a quote)")
    .setRequired(true);

  form
    .addParagraphTextItem()
    .setTitle("When are you free for a 30–40 min video call this week or next?")
    .setRequired(false);
}

function addInterview(form) {
  form
    .addSectionHeaderItem()
    .setTitle("Moderator setup")
    .setHelpText(
      "No real names (R-19). Reconstruct one failed find and stay on it (A-R05). " +
        "Probe why retrieval failed despite partial memory. Challenge the AI themes (A-R07)."
    );

  form.addTextItem().setTitle("Respondent code (r01, r02…) — no real name").setRequired(true);
  form.addDateItem().setTitle("Interview date").setRequired(true);
  form
    .addMultipleChoiceItem()
    .setTitle("Recording consent")
    .setChoiceValues(["Notes only — no recording", "Recorded with consent", "Consent denied — notes without verbatim quotes"])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("Segment after the story (retag if the screener was wrong)")
    .setChoiceValues(["S1 heavy library", "S2 trip / event", "S3 object / document", "S4 people", "S5 family / shared", "Out of segment — do not count"])
    .setRequired(true);

  form
    .addMultipleChoiceItem()
    .setTitle("Does this session count toward in-segment n ≥ 5?")
    .setChoiceValues(["Yes — in nominated / working segment and vague-memory", "No — known-item, wrong segment, or disqualified"])
    .setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("1 · The retrieval task")
    .setHelpText("Stay on this photo until the memory is specific. Brief café / medicine lines are examples, not the lock.");

  form
    .addParagraphTextItem()
    .setTitle("Q1 — What photo were they trying to find? What kind of old visual was it (memory, screenshot, document, video)?")
    .setRequired(true);
  form
    .addParagraphTextItem()
    .setTitle("Roughly when in their life was this — the episode, not the calendar date if they do not have one?")
    .setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("2–3 · Remembered vs forgotten")
    .setHelpText("Missing this reconstruction fails A-R05 / R-20.");

  form
    .addCheckboxItem()
    .setTitle("Q2 — What did they remember? (tick all that were actually used)")
    .setChoiceValues(["Place vibe (small café, that beach hotel…)", "Object (medicine, receipt, ticket…)", "Person / face", "Episode (trip, sick, wedding…)", "Emotion", "Fuzzy time (last year, winter…)", "Exact date / album / filename"])
    .setRequired(true);
  form.addParagraphTextItem().setTitle("Remembered — verbatim").setRequired(true);

  form
    .addCheckboxItem()
    .setTitle("Q3 — What had they forgotten?")
    .setChoiceValues(["Date", "Album name", "Exact place / town / venue", "Person’s searchable name", "Keywords that search wanted", "Filename", "They had not forgotten much — known-item"])
    .setRequired(true);
  form.addParagraphTextItem().setTitle("Forgotten — verbatim").setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("4 · Formulate")
    .setHelpText("The query they typed, or why they never opened Search.");

  form
    .addParagraphTextItem()
    .setTitle("Q4 — What did they type? Paste the query. If they did not search, why not?")
    .setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("5 · What Photos did")
    .setHelpText("Search, Memories, and albums are different surfaces. Name which one they used.");

  form
    .addCheckboxItem()
    .setTitle("Q5 — Where did they look?")
    .setChoiceValues(["Search", "Memories", "Albums", "Timeline only", "Partner’s phone / shared library"])
    .setRequired(true);
  form
    .addMultipleChoiceItem()
    .setTitle("What came back?")
    .setChoiceValues([
      "Nothing useful",
      "The wrong trip or year",
      "Too many near-misses to evaluate",
      "Something close — they still could not tell if it was the one",
      "The intended photo was there and they missed it",
      "They never searched"
    ])
    .setRequired(true);
  form
    .addParagraphTextItem()
    .setTitle("Q8 — Could they evaluate the result set? What would have made the photo recognizable?")
    .setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("6 · Workaround");

  form
    .addCheckboxItem()
    .setTitle("Q6 — What did they do instead?")
    .setChoiceValues([
      "Scrolled the timeline",
      "Opened albums until they found it",
      "Asked a person",
      "Checked another phone",
      "Used WhatsApp / Files / Apple Photos / another app",
      "Gave up",
      "Found it later some other way"
    ])
    .setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("7–8 · Recognize and refine");

  form
    .addParagraphTextItem()
    .setTitle("Q9 — After the first miss, what did they try next? Did the second try teach them anything?")
    .setRequired(true);
  form
    .addParagraphTextItem()
    .setTitle("If Photos could accept one thing they already remember, what should it take? (Do not write “better search.”)")
    .setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("Q7 · Q10 · Compare the task");

  form
    .addMultipleChoiceItem()
    .setTitle("Q7 — This task was closest to…")
    .setChoiceValues(["People", "Place-vibe", "Object", "Event / episode", "Screenshot / document"])
    .setRequired(true);
  form
    .addMultipleChoiceItem()
    .setTitle("First-break metric node (exactly one)")
    .setChoiceValues(["Formulate — they could not start a clue", "Understand — Photos misread the clue", "Retrieve — the photo was not in the set", "Recognize — it may have been there; they could not pick it", "Refine — the next try did not learn"])
    .setRequired(true);

  form
    .addSectionHeaderItem()
    .setTitle("Challenge the discovery themes")
    .setHelpText("Mark each: confirmed / challenged / not supported / new. Do not only confirm.");

  const hypotheses = [
    "Place-vibe is a used cue that Search rejects",
    "Object + episode is a used cue that Search rejects",
    "Forgotten date / album is the token Search demanded",
    "Results came back but were not evaluable",
    "Refine was a dead end",
    "The real complaint was generic search quality (slow / ranking) — kill MVP if this wins",
    "This was known-item success mistaken for vague-memory"
  ];
  hypotheses.forEach(function (title) {
    form
      .addMultipleChoiceItem()
      .setTitle(title)
      .setChoiceValues(["Confirmed", "Challenged", "Not supported", "New — see notes"])
      .setRequired(true);
  });

  form.addParagraphTextItem().setTitle("What challenged the AI themes? Write it even if it ruins the working hypothesis.").setRequired(true);
  form.addParagraphTextItem().setTitle("2–3 verbatim quotes (only if consent allows)").setRequired(true);
  form.addTextItem().setTitle("Phase 6 task title (another person could attempt this without this spec)").setRequired(true);
  form.addParagraphTextItem().setTitle("Anything else").setRequired(false);
}
