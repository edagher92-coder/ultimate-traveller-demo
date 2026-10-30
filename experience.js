(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const motionPreference = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  let reduceMotion = Boolean(motionPreference && motionPreference.matches);
  const activeAnimations = new Set();

  const animate = (element, frames, options) => {
    if (!element || typeof element.animate !== "function" || reduceMotion || document.hidden) return;
    const animation = element.animate(frames, options);
    activeAnimations.add(animation);
    animation.finished.then(() => activeAnimations.delete(animation), () => activeAnimations.delete(animation));
  };
  const stopAnimations = () => {
    activeAnimations.forEach((animation) => animation.cancel());
    activeAnimations.clear();
  };

  const chapters = [
    { key: 'europe', title: 'Take the scenic way.', place: 'Europe & the Mediterranean', copy: 'Long lunches, sunlit villages and time to enjoy the view. Begin with a rhythm that feels like yours.', image: 'assets/video/europe-poster.webp', video: 'assets/video/europe.mp4', videoMobile: 'assets/video/europe-mobile.mp4', alt: 'Amalfi coastline from stock footage' },
    { key: 'honeymoons', title: 'A chapter for two.', place: 'Honeymoons & shared escapes', copy: 'Somewhere beautiful, time together and the details thoughtfully connected. Begin with the feeling you want to bring home.', image: 'assets/video/europe-poster.webp', video: 'assets/video/europe.mp4', videoMobile: 'assets/video/europe-mobile.mp4', alt: 'Coastal shared-escape stock inspiration' },
    { key: 'cruises', title: 'Let the horizon lead.', place: 'Cruises & coastal journeys', copy: 'Coastlines worth slowing down for. Talk through life on board, time ashore and the journey between.', image: 'assets/video/europe-poster.webp', video: 'assets/video/europe.mp4', videoMobile: 'assets/video/europe-mobile.mp4', alt: 'Coastal journey stock inspiration' },
    { key: 'africa', title: 'Make room for wonder.', place: 'Africa & wild landscapes', copy: 'Extraordinary landscapes and moments worth slowing down for. Start with the experiences that draw you in.', image: 'assets/video/africa-poster.webp', video: 'assets/video/africa.mp4', videoMobile: 'assets/video/africa-mobile.mp4', alt: 'Kenyan savannah from stock footage' }
  ];
  const hero = document.querySelector('.hero');
  const landscape = document.querySelector('.hero-landscape');
  const video = byId('hero-video');
  const chapterButtons = Array.from(document.querySelectorAll('button[data-chapter]'));
  const chapterPlay = byId('chapter-play');
  const chapterLive = byId('chapter-live');
  let chapterIndex = 0;
  let requestedChapter = 0;
  let chapterRequest = 0;
  let playbackWanted = false;
  let playbackTimeout = null;
  let activeVideoSource = '';
  const sourceFor = (chapter) => window.innerWidth <= 600 ? chapter.videoMobile : chapter.video;
  const saveData = Boolean(navigator.connection?.saveData);
  let heroVisible = !hero || (() => { const r = hero.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; })();
  const allowedToPlay = () => !reduceMotion && !document.hidden && heroVisible;
  const updatePlayControl = (pending = false) => {
    if (!chapterPlay) return;
    chapterPlay.textContent = reduceMotion ? 'Motion reduced' : playbackWanted ? (pending ? 'Pause loading video' : 'Pause travel video') : 'Play travel video';
    chapterPlay.disabled = reduceMotion;
    chapterPlay.setAttribute('aria-pressed', String(playbackWanted));
  };
  const stopAutoplay = () => {
    chapterRequest += 1;
    requestedChapter = chapterIndex;
    playbackWanted = false;
    window.clearTimeout(playbackTimeout);
    playbackTimeout = null;
    if (video instanceof HTMLVideoElement) { video.pause(); if (reduceMotion) video.hidden = true; }
    stopAnimations();
    updatePlayControl();
  };
  const renderChapter = (index) => {
    const chapter = chapters[index];
    [['chapter-title',chapter.title],['chapter-copy',chapter.copy],['chapter-place',chapter.place],['chapter-count',`${String(index+1).padStart(2,'0')} / 04`]].forEach(([id,value]) => { const e=byId(id); if(e)e.textContent=value; });
    chapterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.chapter === chapter.key)));
    if(hero)hero.dataset.chapter=chapter.key;
    if(landscape){if(landscape.getAttribute('src') !== chapter.image)landscape.src=chapter.image;landscape.alt=chapter.alt;}
  };
  const playbackFailed = () => {
    stopAutoplay();
    if(video)video.hidden=true;
    if(chapterLive)chapterLive.textContent='Video could not start. A still image is shown. Use Play travel video to try again.';
  };
  const startAutoplay = async (announce = false) => {
    if (!(video instanceof HTMLVideoElement) || !allowedToPlay()) { stopAutoplay(); return; }
    if (saveData && !announce && !playbackWanted) { updatePlayControl(); return; }
    const request = ++chapterRequest;
    window.clearTimeout(playbackTimeout);
    playbackTimeout = window.setTimeout(() => { if (request === chapterRequest) playbackFailed(); }, 8000);
    playbackWanted = true;
    updatePlayControl(true);
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    const source = sourceFor(chapters[chapterIndex]);
    activeVideoSource = source;
    if(video.getAttribute('src') !== source) { video.poster=chapters[chapterIndex].image; video.hidden=false; video.src=source; video.load(); }
    try {
      await video.play();
      if(request !== chapterRequest) { if(!playbackWanted)video.pause(); return; }
      if(!allowedToPlay() || !playbackWanted){stopAutoplay();return;}
      window.clearTimeout(playbackTimeout);
      playbackTimeout = null;
      video.hidden=false;
      updatePlayControl();
      if(announce && chapterLive)chapterLive.textContent='Travel video playing, without sound. You can pause at any time.';
    } catch { if(request === chapterRequest)playbackFailed(); }
  };
  async function changeChapter(index, manual = false) {
    if(!chapters[index])return;
    chapterRequest += 1;
    window.clearTimeout(playbackTimeout);
    playbackTimeout = null;
    if(video instanceof HTMLVideoElement && video.getAttribute('src') !== sourceFor(chapters[index])){video.pause();video.hidden=true;}
    chapterIndex=index;
    requestedChapter=index;
    renderChapter(index);
    if(manual && chapterLive)chapterLive.textContent=`${chapters[index].place}. ${chapters[index].title}`;
    if(playbackWanted && allowedToPlay())void startAutoplay(); else updatePlayControl();
  }
  chapterButtons.forEach(button => button.addEventListener('click',()=>{ const i=chapters.findIndex(c=>c.key===button.dataset.chapter);if(i>=0)void changeChapter(i,true); }));
  const chapterPrevious=byId('chapter-prev');
  const chapterNext=byId('chapter-next');
  if(chapterPrevious)chapterPrevious.addEventListener('click',()=>{void changeChapter((requestedChapter+chapters.length-1)%chapters.length,true);});
  if(chapterNext)chapterNext.addEventListener('click',()=>{void changeChapter((requestedChapter+1)%chapters.length,true);});
  if(chapterPlay)chapterPlay.addEventListener('click',()=>{if(playbackWanted){stopAutoplay();if(chapterLive)chapterLive.textContent='Travel video paused.';}else void startAutoplay(true);});
  // load() clears the current media error: ignore obsolete queued error events.
  if(video instanceof HTMLVideoElement)video.addEventListener('error',()=>{if(playbackWanted && video.error && video.getAttribute('src') === activeVideoSource)playbackFailed();});
  renderChapter(0);
  void startAutoplay();

  const finder = byId("trip-finder");
  const finderStage = byId("finder-stage");
  const finderHelp = byId("finder-help");
  const finderOptions = byId("finder-options");
  const finderProgress = byId("finder-progress");
  const finderBack = byId("finder-back");
  const finderReset = byId("finder-reset");
  const finderResult = byId("finder-result");
  const finderSummary = byId("finder-summary");
  const finderApply = byId("finder-apply");
  const questions = [
    { key: "occasion", title: "What is calling you away?", help: "A place, a celebration or simply a feeling. Choose the closest starting point.", options: [
      { value: "honeymoons", label: "A chapter for two", note: "Honeymoons & shared celebrations" },
      { value: "europe", label: "A European escape", note: "Cities, coastlines & discoveries" },
      { value: "cruises", label: "Life on the water", note: "Cruises & new horizons" },
      { value: "africa", label: "A little more wonder", note: "Africa & wild landscapes" },
      { value: "break", label: "Time to switch off", note: "A well-earned break" },
      { value: "other", label: "Still dreaming", note: "Another idea, or room to explore" }
    ] },
    { key: "pace", title: "How would you like your days to feel?", help: "There is no right answer. Think about the rhythm that would make this time yours.", options: [
      { value: "slow", label: "Slow & spacious", note: "Longer stays, fewer moving parts" },
      { value: "balanced", label: "A little of both", note: "Discovery with room to unwind" },
      { value: "explore", label: "Curious & exploring", note: "More places, more to discover" }
    ] },
    { key: "experience", title: "Where are you in your travel story?", help: "Susie can meet you where you are, with as much guidance as feels right.", options: [
      { value: "first-trip", label: "My first big adventure", note: "A little guidance would be lovely" },
      { value: "experienced", label: "I know my way around", note: "Help connecting the details" },
      { value: "unsure", label: "Somewhere in between", note: "We can work it out together" }
    ] }
  ];
  const answers = { occasion: "", pace: "", experience: "" };
  const journeyLabels = { honeymoons: "a honeymoon or shared celebration", europe: "a European escape", cruises: "a cruise", africa: "an African journey", break: "a well-earned break", other: "a travel idea still taking shape" };
  const paceLabels = { slow: "a slow, spacious pace", balanced: "a balance of discovery and downtime", explore: "a curious, exploring pace" };
  const experienceLabels = { "first-trip": "guidance for a first big trip", experienced: "help connecting the details as an experienced traveller", unsure: "a conversation about how much guidance feels right" };
  const occasionGuidance = {
    honeymoons: "For a shared celebration, consider which moments matter to each of you.",
    europe: "For Europe, consider which places deserve a longer stay and how you would like to connect them.",
    cruises: "For a cruise, consider the balance between time on board and time ashore.",
    africa: "For Africa, consider the experiences you most want to make time for and the travel between them.",
    break: "For a restorative break, consider what would help you truly switch off.",
    other: "Even without a destination, consider what you would most like this time away to feel like."
  };
  const paceGuidance = {
    slow: " A slower rhythm may mean choosing fewer stops to leave room to settle in.",
    balanced: " A balanced rhythm may mean choosing a few highlights and leaving space between them.",
    explore: " A busier rhythm may mean weighing more discoveries against time spent in transit."
  };
  const experienceGuidance = {
    "first-trip": " Bring every practical question; there is no need to know it all yet.",
    experienced: " Bring the details you already love and the pieces you would like help connecting.",
    unsure: " You can decide together how much guidance feels useful."
  };
  let finderStep = 0;
  let appliedFinderNote = "";
  let finderStatus = byId("finder-status");
  if (!finderStatus && finderResult) {
    finderStatus = document.createElement("p");
    finderStatus.id = "finder-status";
    finderStatus.className = "finder-feedback";
    finderStatus.setAttribute("role", "status");
    finderResult.append(finderStatus);
  }
  const focusStage = () => {
    if (!finderStage) return;
    finderStage.setAttribute("tabindex", "-1");
    finderStage.focus({ preventScroll: true });
    // Lower choices can leave the next question above the visitor's scroll position.
    const heading = finderStage.getBoundingClientRect();
    const context = (finderOptions.hidden ? finderResult : finderOptions).getBoundingClientRect();
    if (heading.top < 24 || heading.bottom > window.innerHeight - 24 || context.top > window.innerHeight - 72) {
      finderStage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  };
  const renderFinder = (moveFocus) => {
    if (!finder || !finderStage || !finderOptions || !finderResult) return;
    const finished = finderStep === questions.length;
    finder.dataset.step = String(finderStep + 1);
    document.querySelectorAll("button[data-finder-step]").forEach((button) => {
      const step = Number(button.dataset.finderStep);
      button.disabled = step > finderStep && !answers[questions[step]?.key];
      if (step === Math.min(finderStep, 2)) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    const photos = { honeymoons: "journey-coast.webp", europe: "journey-coast.webp", cruises: "journey-cruise.webp", africa: "journey-africa.webp", break: "travel-notebook.webp", other: "travel-notebook.webp" };
    const photo = byId("finder-photo");
    if (photo) {
      photo.src = "assets/" + (photos[answers.occasion] || "journey-coast.webp");
      photo.alt = answers.occasion ? "Illustrative inspiration for " + journeyLabels[answers.occasion] : "Illustrative coastal travel inspiration";
    }
    const caption = byId("finder-photo-caption");
    if (caption) caption.textContent = answers.occasion ? "Your idea: " + journeyLabels[answers.occasion] + "." : "A few thoughts. A more personal starting point.";
    finderOptions.replaceChildren();
    finderOptions.hidden = finished;
    finderResult.hidden = !finished;
    if (finderStatus) finderStatus.textContent = "";
    if (finderBack instanceof HTMLButtonElement) finderBack.disabled = finderStep === 0;
    if (finderReset instanceof HTMLButtonElement) finderReset.disabled = !Object.values(answers).some(Boolean);
    if (finished) {
      finderStage.textContent = "A starting point for Susie";
      if (finderHelp) finderHelp.textContent = "Three small choices. A little more shape to your next chapter.";
      if (finderProgress) finderProgress.textContent = "3 of 3 · Your starting point";
      if (finderSummary) finderSummary.textContent = `You are imagining ${journeyLabels[answers.occasion]}, with ${paceLabels[answers.pace]} and ${experienceLabels[answers.experience]}. These are conversation starters, not an itinerary or a quote.`;
      const guidance = byId("finder-guidance");
      if (guidance) guidance.textContent = occasionGuidance[answers.occasion] + paceGuidance[answers.pace] + experienceGuidance[answers.experience];
    } else {
      const question = questions[finderStep];
      finderStage.textContent = question.title;
      if (finderHelp) finderHelp.textContent = question.help;
      if (finderProgress) finderProgress.textContent = `${finderStep + 1} of 3 · ${["Your travel idea", "Your pace", "Your experience"][finderStep]}`;
      question.options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "finder-option";
        if (question.key === "occasion" && photos[option.value]) {
          const image = document.createElement("img"); image.src = "assets/" + photos[option.value]; image.alt = ""; image.width = 96; image.height = 112; image.loading = "lazy"; button.append(image);
        }
        const text = document.createElement("span"); text.className = "finder-option-copy";
        button.setAttribute("aria-pressed", String(answers[question.key] === option.value));
        const label = document.createElement("span");
        label.className = "finder-option-label";
        label.textContent = option.label;
        const note = document.createElement("span");
        note.className = "finder-option-note";
        note.textContent = option.note;
        text.append(label, note);
        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        arrow.setAttribute("viewBox", "0 0 24 24"); arrow.setAttribute("aria-hidden", "true");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", "M4 12h15m-6-6 6 6-6 6"); arrow.append(path);
        button.append(text, arrow);
        button.addEventListener("click", () => {
          answers[question.key] = option.value;
          finderStep += 1;
          renderFinder(true);
        });
        finderOptions.append(button);
      });
    }
    if (moveFocus) {
      focusStage();
      animate(finderOptions.hidden ? finderResult : finderOptions, [{ opacity: .65, transform: "translateY(7px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 240, easing: "ease-out" });
    }
  };
  document.querySelectorAll("button[data-finder-step]").forEach((button) => button.addEventListener("click", () => {
    const step = Number(button.dataset.finderStep);
    if (!Number.isInteger(step) || step < 0 || step >= questions.length || button.disabled) return;
    finderStep = step; renderFinder(true);
  }));
  document.querySelectorAll("button[data-finder-edit]").forEach((button) => button.addEventListener("click", () => {
    const step = Number(button.dataset.finderEdit);
    if (!Number.isInteger(step) || step < 0 || step >= questions.length) return;
    finderStep = step;
    renderFinder(true);
  }));
  if (finderBack instanceof HTMLButtonElement) finderBack.addEventListener("click", () => {
    finderStep = Math.max(0, finderStep - 1);
    renderFinder(true);
  });
  if (finderReset instanceof HTMLButtonElement) finderReset.addEventListener("click", () => {
    Object.keys(answers).forEach((key) => { answers[key] = ""; });
    const question = byId("finder-question");
    if (question instanceof HTMLTextAreaElement) question.value = "";
    finderStep = 0;
    renderFinder(true);
  });
  if (finderApply instanceof HTMLButtonElement) finderApply.addEventListener("click", () => {
    if (finderStep !== questions.length || !Object.values(answers).every(Boolean)) return;
    const journeyType = byId("journey-type");
    const priority = byId("priority");
    const experienceRadio = Array.from(document.querySelectorAll('input[name="experience"]')).find((radio) => radio.value === answers.experience);
    if (!(journeyType instanceof HTMLSelectElement) || !(priority instanceof HTMLTextAreaElement) || !(experienceRadio instanceof HTMLInputElement)) {
      if (finderStatus) finderStatus.textContent = "Your starting point is ready above. The enquiry form is not available on this page.";
      return;
    }
    journeyType.value = answers.occasion;
    journeyType.dispatchEvent(new Event("change", { bubbles: true }));
    experienceRadio.checked = true;
    experienceRadio.dispatchEvent(new Event("change", { bubbles: true }));
    const question = byId("finder-question");
    const questionText = question instanceof HTMLTextAreaElement ? question.value.trim() : "";
    const note = `Trip finder: ${journeyLabels[answers.occasion]}; ${paceLabels[answers.pace]}.${questionText ? `\nQuestion: ${questionText}` : ""}`;
    const existing = priority.value;
    const limit = priority.maxLength > 0 ? Math.min(priority.maxLength, 400) : 400;
    let nextNote = note;
    let canUpdate = true;
    if (existing.trim()) {
      if (appliedFinderNote) {
        const at = existing.indexOf(appliedFinderNote);
        const end = at + appliedFinderNote.length;
        const isWholeBlock = at >= 0 && at === existing.lastIndexOf(appliedFinderNote)
          && (at === 0 || existing[at - 1] === "\n")
          && (end === existing.length || existing[end] === "\n");
        if (isWholeBlock) nextNote = existing.slice(0, at) + note + existing.slice(end);
        else canUpdate = false; // A visitor edited the generated block; preserve their words.
      } else if (existing.includes(note)) canUpdate = false;
      else nextNote = existing + "\n" + note;
    }
    const noteRetained = !canUpdate || nextNote.length > limit;
    if (!noteRetained) {
      priority.value = nextNote;
      appliedFinderNote = note;
    }
    priority.dispatchEvent(new Event("input", { bubbles: true }));
    const feedback = noteRetained
      ? "Your note was kept unchanged. Review it against your latest choices; your finder question is still above. Your journey and experience selections were applied."
      : "Your starting point is in the brief. Add your details whenever you are ready.";
    if (finderStatus) finderStatus.textContent = feedback;
    const formStatus = byId("form-status");
    if (formStatus && formStatus.dataset.kind !== "pending") {
      formStatus.textContent = feedback;
      formStatus.dataset.kind = "success";
    }
    const brief = byId("brief");
    if (brief && typeof brief.scrollIntoView === "function") brief.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    const visitorName = byId("visitor-name");
    if (visitorName instanceof HTMLInputElement) visitorName.focus({ preventScroll: true });
  });
  renderFinder(false);

  const progress = byId("reading-progress");
  let scrollFrame = null;
  const updateProgress = () => {
    scrollFrame = null;
    if (progress) {
      const page = document.documentElement;
      const available = Math.max(0, page.scrollHeight - window.innerHeight);
      const fraction = available ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
      progress.style.transform = `scaleX(${fraction})`;
    }
    // Native geometry is used only on the fallback path, once per scheduled frame.
    if (typeof IntersectionObserver !== "function") {
      if (hero) {
        const bounds = hero.getBoundingClientRect();
        heroVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      }
      if (!heroVisible) stopAutoplay();
    }
  };
  const requestProgress = () => {
    if (scrollFrame === null && !document.hidden) scrollFrame = window.requestAnimationFrame(updateProgress);
  };
  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress, { passive: true });
  if (typeof IntersectionObserver === "function") {
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) {
          heroVisible = entry.isIntersecting;
          if (!heroVisible) stopAutoplay();
        }
      });
    });
    if (hero) visibility.observe(hero);
    const reveals = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const notebook = entry.target.classList.contains("notebook-spread");
        animate(entry.target, [
          { opacity: 0.7, transform: `translate(${notebook ? "-12px" : "12px"}, 8px)` },
          { opacity: 1, transform: "translate(0, 0)" }
        ], { duration: 650, easing: "cubic-bezier(.2,.65,.3,1)" });
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".notebook-spread, .letter").forEach((element) => reveals.observe(element));
  }
  animate(document.querySelector(".hero-copy-block"), [
    { opacity: 0.7, transform: "translateY(12px)" },
    { opacity: 1, transform: "translateY(0)" }
  ], { duration: 700, easing: "ease-out" });
  requestProgress();

  const onMotionChange = (event) => {
    reduceMotion = event.matches;
    stopAutoplay();
    if (reduceMotion) stopAnimations();
  };
  if (motionPreference) {
    if (typeof motionPreference.addEventListener === "function") motionPreference.addEventListener("change", onMotionChange);
    else if (typeof motionPreference.addListener === "function") motionPreference.addListener(onMotionChange);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
      stopAnimations();
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    } else requestProgress();
  });
  window.addEventListener("pagehide", () => {
    stopAutoplay();
    stopAnimations();
    if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
  });
})();
