(() => {
  "use strict";

  const interests = {
    honeymoons: { title: "Honeymoons", description: "A shared trip deserves room for both of you. Start with the atmosphere you want, the moments that matter and how you want the journey to feel.", questions: ["Which moments do you want the trip to make space for?", "Would you prefer one special place or a journey with a few chapters?", "What would make the planning feel easy for you both?"], cta: "Begin a honeymoon brief", briefValue: "honeymoons" },
    europe: { title: "Europe", description: "A European trip can be one favourite city, a few connected places, or a slower return to somewhere you love. Begin with the places, season and rhythm that appeal.", questions: ["Which places feel essential, and where could you linger?", "What time of year would suit the pace you want?", "How much movement between places feels enjoyable to you?"], cta: "Begin a Europe brief", briefValue: "europe" },
    cruises: { title: "Cruises", description: "A cruise can offer a simple way to see more while keeping a comfortable base. The useful starting point is the kind of days, places and onboard experience you want.", questions: ["What would you like your time ashore to feel like?", "What matters most in your ship style and pace?", "Who is travelling, and what would help everyone feel at ease?"], cta: "Begin a cruise brief", briefValue: "cruises" },
    africa: { title: "Africa", description: "An African journey can combine memorable wildlife, landscapes and stays at a pace that is right for you. Start with the experiences that draw you in.", questions: ["What experiences are you most hoping to have?", "How would you like to balance activity, comfort and downtime?", "Which connections or practical details would you like help thinking through?"], cta: "Begin an Africa brief", briefValue: "africa" },
    break: { title: "A well-earned break", description: "For a full calendar and limited planning time, the first question is simple: what would help you properly switch off? Start there, then let the details follow.", questions: ["What kind of reset are you hoping for?", "How many days could you comfortably make available?", "Which planning details would you most like to take off your plate?"], cta: "Begin a break brief", briefValue: "break" }
  };

  const journeyStages = {
    idea: { title: "You don’t need a finished plan.", copy: "A place you’ve always imagined. A celebration. Or simply time away. Start with the feeling you want to bring home; the details can come later.", image: "travel-notebook.webp", alt: "Illustrative travel notebook and keepsakes", details: ["Who you’re travelling with", "The moments you want to make room for", "Your timing, even if it’s still flexible"], next: "conversation", nextLabel: "Next: a conversation" },
    conversation: { title: "There’s room for every question.", copy: "The pace you love. The things you’re unsure about. The details you’d rather not work out alone. A patient conversation is where the possibilities start to feel like yours.", image: "journey-coast.webp", alt: "Illustrative Mediterranean coast as a conversation starting point", details: ["Talk through what matters most", "Weigh the possibilities against your time and budget", "Agree how much help feels right"], next: "journey", nextLabel: "Next: your next chapter" },
    journey: { title: "A clearer way forward.", copy: "Bring the flights, stays and experiences into the same conversation. With an agreed brief, you and Susie can discuss the practical next steps and any fees before proceeding.", image: "journey-cruise.webp", alt: "Illustrative cruise and coastal travel inspiration", details: ["Consider how the pieces connect", "Discuss the arrangements and service scope", "Confirm the next steps together"], next: "idea", nextLabel: "Back to your idea" }
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sceneAssets = {"honeymoons":["journey-coast.webp","Mediterranean-inspired honeymoon concept"],"europe":["journey-coast.webp","Mediterranean-inspired European coast"],"cruises":["journey-cruise.webp","Illustrative cruise ship and open sea"],"africa":["journey-africa.webp","Illustrative African savannah and elephants"],"break":["travel-notebook.webp","Illustrative travel notebook and keepsakes"]};
  let interestAnimation;
  const byId = (id) => document.getElementById(id);
  const interestButtons = Array.from(document.querySelectorAll("button[data-interest]"));
  const journeyButtons = Array.from(document.querySelectorAll("[data-journey]"));
  const experienceButtons = Array.from(document.querySelectorAll("[data-experience]"));
  const experienceRadios = Array.from(document.querySelectorAll('input[name="experience"]'));
  const experienceHint = byId("experience-hint");
  const interestPanel = document.querySelector(".interest-panel");
  const offerFilterButtons = Array.from(document.querySelectorAll("[data-offer-filter]"));
  const interestTitle = byId("interest-title");
  const interestDescription = byId("interest-description");
  const interestQuestions = byId("interest-questions");
  const interestCta = byId("interest-cta");
  const journeyTitle = byId("journey-panel-title");
  const journeyCopy = byId("journey-panel-copy");
  const journeyPanel = byId("journey-panel");
  const journeyNext = byId("journey-next");
  let journeyAnimation;
  let currentJourney = "idea";
  const journeyType = byId("journey-type");
  const priority = byId("priority");
  const priorityCount = byId("priority-count");
  const form = byId("brief-form");
  const submitButton = byId("submit-enquiry");
  const formStatus = byId("form-status");
  const offersList = byId("offers-list");
  const offersStatus = byId("offers-status");
  let currentOffers = [];
  let offerFilter = "launch";
  let submitting = false;

  const imageMotionButton = byId("interest-motion");
  const ambientImage = interestPanel?.querySelector(".interest-image img");
  let ambientAnimation;
  let ambientVisible = false;
  let ambientWanted = !reducedMotion.matches && !navigator.connection?.saveData;
  const syncImageMotion = () => {
    if (ambientAnimation) { ambientAnimation.cancel(); ambientAnimation = null; }
    const playing = ambientWanted && ambientVisible && !document.hidden && !reducedMotion.matches;
    if (playing && ambientImage?.animate) ambientAnimation = ambientImage.animate([
      { transform: "scale(1) translateX(0)" }, { transform: "scale(1.045) translateX(-.6%)" }
    ], { duration: 16000, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
    if (imageMotionButton) {
      imageMotionButton.textContent = reducedMotion.matches ? "Motion reduced" : ambientWanted ? "Pause image motion" : "Play image motion";
      imageMotionButton.disabled = reducedMotion.matches;
      imageMotionButton.setAttribute("aria-pressed", String(ambientWanted && !reducedMotion.matches));
    }
  };
  if (typeof IntersectionObserver === "function" && ambientImage) {
    new IntersectionObserver((entries) => { ambientVisible = entries[0].isIntersecting; syncImageMotion(); }, { threshold: .05 }).observe(ambientImage);
  }
  if (imageMotionButton) imageMotionButton.addEventListener("click", () => { ambientWanted = !ambientWanted; syncImageMotion(); });
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) ambientWanted = false; syncImageMotion(); });
  document.addEventListener("visibilitychange", syncImageMotion);
  window.addEventListener("pagehide", () => { if (ambientAnimation) ambientAnimation.cancel(); });
  syncImageMotion();

  const updateInterest = (key) => {
    const interest = interests[key];
    if (!interest || !interestTitle || !interestDescription || !interestQuestions || !interestCta) return;
    interestButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.interest === key)));
    interestTitle.textContent = interest.title;
    if (interestPanel) interestPanel.dataset.interest = key;
    interestDescription.textContent = interest.description;
    const image = interestPanel?.querySelector('.interest-image img');
    const scene = sceneAssets[key];
    if (image && scene) { image.src = 'assets/' + scene[0]; image.alt = scene[1]; syncImageMotion(); }
    const content = interestPanel?.querySelector('.interest-content');
    if (interestAnimation) interestAnimation.cancel();
    if (!reducedMotion.matches && content?.animate) interestAnimation = content.animate([{opacity:.5,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});
    interestQuestions.replaceChildren();
    interest.questions.forEach((question) => {
      const item = document.createElement("li");
      item.textContent = question;
      interestQuestions.append(item);
    });
    interestCta.textContent = interest.cta;
    if (journeyType instanceof HTMLSelectElement) journeyType.value = interest.briefValue;
    clearFormStatus();
  };

  const updateJourney = (key) => {
    const stage = journeyStages[key];
    if (!stage || !journeyTitle || !journeyCopy) return;
    currentJourney = key;
    journeyButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.journey === key)));
    journeyTitle.textContent = stage.title;
    journeyCopy.textContent = stage.copy;
    const image = byId("journey-image");
    if (image) { image.src = "assets/" + stage.image; image.alt = stage.alt; }
    const count = byId("journey-count");
    if (count) count.textContent = String(Object.keys(journeyStages).indexOf(key) + 1).padStart(2, "0") + " / 03";
    const details = byId("journey-details");
    if (details) details.replaceChildren(...stage.details.map((text) => { const li = document.createElement("li"); li.textContent = text; return li; }));
    if (journeyNext) journeyNext.textContent = stage.nextLabel + " →";
    if (journeyAnimation) journeyAnimation.cancel();
    if (!reducedMotion.matches && journeyPanel?.animate) journeyAnimation = journeyPanel.animate([{ opacity: .65, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 280, easing: "cubic-bezier(.16,1,.3,1)" });
  };

  const updateExperience = (value) => {
    if (!["first-trip", "experienced", "unsure"].includes(value)) return;
    experienceButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.experience === value)));
    experienceRadios.forEach((radio) => { radio.checked = radio.value === value; });
    if (experienceHint) experienceHint.textContent = value === "experienced"
      ? "Bring the places you love, your preferences and the details you would like a hand connecting."
      : value === "unsure"
        ? "You can decide how much guidance feels right as the conversation takes shape."
        : "Start with the basics, ask every question, and find a pace that feels comfortable.";
    clearFormStatus();
  };

  function clearFormStatus() {
    if (!formStatus || formStatus.dataset.kind === "pending") return;
    formStatus.textContent = "";
    delete formStatus.dataset.kind;
  }

  const stateLabels = { invalid: "Needs review", draft: "Draft · pending approval", scheduled: "Scheduled · not yet active", active: "Active demo offer", expired: "Expired" };
  const knownOffer = (value) => value && typeof value === "object" &&
    typeof value.id === "string" && typeof value.kind === "string" &&
    typeof value.title === "string" && typeof value.description === "string" &&
    typeof value.state === "string";

  const renderOffers = () => {
    if (!offersList || !offersStatus) return;
    offersList.replaceChildren();
    const visible = currentOffers.filter((offer) => offer.kind === offerFilter);
    if (visible.length === 0) {
      offersStatus.textContent = currentOffers.length ? "There are no offers in this section yet." : "No offer drafts are available in this browser demo.";
      return;
    }
    visible.forEach((offer) => {
      const card = document.createElement("article");
      card.className = "offer-card";
      card.dataset.state = offer.state;
      const state = document.createElement("span");
      state.className = "offer-state";
      state.textContent = stateLabels[offer.state] || "State unavailable";
      const title = document.createElement("h3");
      title.textContent = offer.title;
      const description = document.createElement("p");
      description.textContent = offer.description;
      card.append(state, title, description);
      const hasWindow = [offer.startDate, offer.endDate].every((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date));
      const dateWindow = hasWindow
        ? `Demo window: ${offer.startDate} to ${offer.endDate} (Sydney calendar)`
        : "Demo date window not set";
      const details = [dateWindow, offer.priceLabel, offer.terms].filter((part) => typeof part === "string" && part.trim());
      if (details.length) {
        const meta = document.createElement("p");
        meta.className = "offer-meta";
        meta.textContent = details.join(" · ");
        card.append(meta);
      }
      offersList.append(card);
    });
    offersStatus.textContent = "These are demo drafts saved only in this browser. Dates, terms and approval status shown here do not confirm travel inventory.";
  };

  const loadOffers = async () => {
    if (!offersList || !offersStatus) return;
    try {
      const response = await window.UltimateDemo.request("/api/offers", { headers: { Accept: "application/json" } });
      const result = await response.json();
      if (!response.ok || !result || result.ok !== true || !Array.isArray(result.offers)) throw new Error("offers unavailable");
      currentOffers = result.offers.filter(knownOffer);
      offerFilterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.offerFilter === offerFilter)));
      renderOffers();
    } catch {
      offersList.replaceChildren();
      offersStatus.textContent = window.location.protocol === "file:"
        ? "Start the local demo server to load offer drafts. Open this page through the server address shown in its run guide."
        : "Demo drafts could not be loaded. Allow browser storage or reset the demo data from the dashboard, then reload.";
    } finally {
      offersList.setAttribute("aria-busy", "false");
    }
  };

  const setFormStatus = (message, kind) => {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.dataset.kind = kind;
  };

  const submitEnquiry = async (event) => {
    event.preventDefault();
    if (!(form instanceof HTMLFormElement) || submitting) return;
    clearFormStatus();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      experience: String(data.get("experience") || ""),
      journey: String(data.get("journey") || ""),
      timing: String(data.get("timing") || ""),
      budget: String(data.get("budget") || ""),
      message: String(data.get("message") || "").trim(),
      acknowledgedDemo: data.get("acknowledgedDemo") === "on"
    };
    submitting = true;
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
    if (formStatus) formStatus.dataset.kind = "pending";
    setFormStatus("Saving your fictional enquiry in this browser…", "pending");
    try {
      const response = await window.UltimateDemo.request("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      let result;
      try { result = await response.json(); } catch { result = null; }
      if (response.status !== 201 || !result || result.ok !== true || typeof result.id !== "string") {
        setFormStatus(response.status === 409
          ? "This browser demo has reached its record limit. Reset the demo data from the dashboard to start again."
          : "This browser could not save the enquiry. Your fields are still here. Check browser storage, or reset demo data from the dashboard and retry.", "error");
        return;
      }
      setFormStatus(`Saved in this browser as demo enquiry ${result.id}. Open the demo dashboard in the same browser to review it. Nothing was sent to Susie.`, "success");
    } catch {
      setFormStatus("Browser storage is unavailable. Your fields are still here. Allow site storage and try again.", "error");
    } finally {
      submitting = false;
      if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
    }
  };

  interestButtons.forEach((button) => button.addEventListener("click", () => {
    updateInterest(button.dataset.interest || "");
    if (window.matchMedia("(max-width:850px)").matches && interestPanel && interestTitle) {
      interestPanel.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      interestTitle.focus({ preventScroll: true });
    }
  }));
  journeyButtons.forEach((button) => button.addEventListener("click", () => updateJourney(button.dataset.journey || "")));
  if (journeyNext) journeyNext.addEventListener("click", () => updateJourney(journeyStages[currentJourney].next));
  experienceButtons.forEach((button) => button.addEventListener("click", () => updateExperience(button.dataset.experience || "")));
  experienceRadios.forEach((radio) => radio.addEventListener("change", () => { if (radio.checked) updateExperience(radio.value); }));
  if (journeyType instanceof HTMLSelectElement) journeyType.addEventListener("change", () => {
    if (Object.hasOwn(interests, journeyType.value)) updateInterest(journeyType.value);
  });
  offerFilterButtons.forEach((button) => button.addEventListener("click", () => {
    const nextFilter = button.dataset.offerFilter;
    if (nextFilter !== "launch" && nextFilter !== "monthly") return;
    offerFilter = nextFilter;
    offerFilterButtons.forEach((filterButton) => filterButton.setAttribute("aria-pressed", String(filterButton === button)));
    renderOffers();
  }));
  if (priority instanceof HTMLTextAreaElement && priorityCount) priority.addEventListener("input", () => { priorityCount.textContent = String(priority.value.length); });
  if (form instanceof HTMLFormElement) {
    form.addEventListener("submit", submitEnquiry);
    form.addEventListener("input", clearFormStatus);
    form.addEventListener("change", clearFormStatus);
    // Keep the no-JS fallback safe until JSON submission is available.
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
  }
  reducedMotion.addEventListener('change', () => { if(reducedMotion.matches) { if (interestAnimation) interestAnimation.cancel(); if (journeyAnimation) journeyAnimation.cancel(); const selected = journeyButtons.find(button=>button.getAttribute('aria-pressed')==='true'); if(selected)updateJourney(selected.dataset.journey); } });
  updateJourney("idea");
  document.addEventListener("visibilitychange", () => { if(document.hidden && interestAnimation) interestAnimation.cancel(); });
  loadOffers();
})();
