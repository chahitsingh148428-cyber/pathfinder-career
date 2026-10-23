const STREAMS = window.PATHFINDER_STREAMS || [];
const SECTORS = window.PATHFINDER_SECTORS || [];
const ALL_CAREERS = window.PATHFINDER_CAREERS || [];
let selectedStream = null;
let selectedSubject = null;
let selectedSector = "all";
let currentCareers = [];

const subjectPanel = document.getElementById("subjectPanel");
const subjectOptions = document.getElementById("subjectOptions");
const subjectTitle = document.getElementById("subjectTitle");
const continueBtn = document.getElementById("continueBtn");
const careerGrid = document.getElementById("careerGrid");
const selectionTitle = document.getElementById("selectionTitle");
const selectionSubtitle = document.getElementById("selectionSubtitle");
const searchInput = document.getElementById("searchInput");

const sectorNames = Object.fromEntries(SECTORS.map(s => [s.id, s.name]));
const streamNames = Object.fromEntries(STREAMS.map(s => [s.id, s.name]));

document.querySelectorAll(".stream-card").forEach(card => {
  card.addEventListener("click", () => chooseStream(card.dataset.stream));
});

function chooseStream(streamId) {
  selectedStream = STREAMS.find(s => s.id === streamId);
  selectedSubject = null;
  document.querySelectorAll(".stream-card").forEach(c => c.classList.toggle("selected", c.dataset.stream === streamId));
  subjectTitle.textContent = `${selectedStream.name}: choose your subjects`;
  subjectOptions.innerHTML = selectedStream.subjects.map((sub, i) => `
    <label class="subject-option">
      <input type="radio" name="subject" value="${sub.id}" ${i === 0 ? "" : ""}>
      <span><b>${sub.name}</b><small>${sub.detail}</small></span>
    </label>`).join("");
  subjectOptions.querySelectorAll('input[name="subject"]').forEach(input => {
    input.addEventListener("change", () => {
      selectedSubject = input.value;
      continueBtn.disabled = false;
    });
  });
  continueBtn.disabled = true;
  subjectPanel.classList.remove("hidden");
  subjectPanel.scrollIntoView({behavior:"smooth", block:"nearest"});
  selectionTitle.textContent = `${selectedStream.name} selected`;
  selectionSubtitle.textContent = "Now choose your subject combination to see relevant careers.";
  careerGrid.innerHTML = emptyState("📚", "Choose your subjects", "Select a subject combination above, then click “Show career opportunities”.");
}
document.getElementById("changeStream").addEventListener("click", () => {
  subjectPanel.classList.add("hidden");
  document.getElementById("choose").scrollIntoView({behavior:"smooth"});
});
continueBtn.addEventListener("click", () => {
  if (!selectedStream || !selectedSubject) return;
  selectedSector = "all";
  document.querySelectorAll(".filter-pill").forEach(b => b.classList.toggle("active", b.dataset.sector === "all"));
  document.querySelectorAll(".sector-chip").forEach(b => b.classList.remove("selected"));
  searchInput.value = "";
  loadCareers();
  document.getElementById("explore").scrollIntoView({behavior:"smooth"});
});
document.querySelectorAll("[data-sector]").forEach(button => {
  button.addEventListener("click", () => {
    if (!selectedStream || !selectedSubject) {
      document.getElementById("choose").scrollIntoView({behavior:"smooth"});
      selectionTitle.textContent = "Choose your stream first";
      selectionSubtitle.textContent = "Then choose subjects to filter careers by sector.";
      return;
    }
    selectedSector = button.dataset.sector;
    document.querySelectorAll(".filter-pill").forEach(b => b.classList.toggle("active", b.dataset.sector === selectedSector));
    document.querySelectorAll(".sector-chip").forEach(b => b.classList.toggle("selected", b.dataset.sector === selectedSector));
    loadCareers();
    document.getElementById("explore").scrollIntoView({behavior:"smooth"});
  });
});
searchInput.addEventListener("input", renderCareers);

function loadCareers() {
  if (!selectedStream || !selectedSubject) return;
  selectionTitle.textContent = `${streamNames[selectedStream.id]} · ${selectedStream.subjects.find(s => s.id === selectedSubject)?.name || ""}`;
  selectionSubtitle.textContent = selectedSector === "all" ? "Showing career options across all sectors." : `Showing options in ${sectorNames[selectedSector]}.`;
  currentCareers = ALL_CAREERS.filter(c => c.streams.includes(selectedStream.id) && c.subjects.includes(selectedSubject) && (selectedSector === "all" || c.sector === selectedSector));
  renderCareers();
}
function renderCareers() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = currentCareers.filter(c => !q || `${c.name} ${c.summary} ${sectorNames[c.sector] || c.sector}`.toLowerCase().includes(q));
  if (!filtered.length) {
    careerGrid.innerHTML = emptyState("🔎", "No matching careers in this filter", "Try All sectors or use a shorter search term. Some jobs require specific subjects or further qualifications.");
    return;
  }
  careerGrid.innerHTML = filtered.map(c => `
    <article class="career-card">
      <div class="career-top"><span class="career-icon">${c.icon}</span><span class="sector-label">${sectorNames[c.sector] || c.sector}</span></div>
      <h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.summary)}</p>
      <button data-detail="${c.id}">View career pathway&nbsp; →</button>
    </article>`).join("");
  careerGrid.querySelectorAll("[data-detail]").forEach(btn => btn.addEventListener("click", () => showDetails(btn.dataset.detail)));
}
function showDetails(id) {
  const c = ALL_CAREERS.find(career => career.id === id);
  if (!c) { alert("Career not found."); return; }
  document.getElementById("modalContent").innerHTML = `
    <span class="modal-kicker">${sectorNames[c.sector] || c.sector}</span>
    <h2 id="modalTitle">${c.icon} ${escapeHtml(c.name)}</h2>
    <p class="modal-summary">${escapeHtml(c.summary)}</p>
    <div class="detail-grid">
      <section class="detail-block"><h3>🎓 Education / qualifications</h3><p>${escapeHtml(c.study)}</p></section>
      <section class="detail-block"><h3>📝 Exams / admission</h3><p>${escapeHtml(c.exams)}</p></section>
      <section class="detail-block"><h3>💡 Useful skills</h3><p>${escapeHtml(c.skills)}</p></section>
      <section class="detail-block"><h3>🧭 Possible next steps</h3><p>${escapeHtml(c.path)}</p></section>
      <section class="detail-block"><h3>⏳ Typical study / training time</h3><p>${escapeHtml(c.duration || "Varies by course and institution.")}</p></section>
      <section class="detail-block"><h3>💰 Pay / income outlook</h3><p>${escapeHtml(c.salary || "Varies by role and employer; check current information.")}</p></section>
      <section class="detail-block"><h3>🏢 Where can you work?</h3><p>${escapeHtml(c.workplaces || "Depends on qualification and specialisation.")}</p></section>
      <section class="detail-block"><h3>📚 What to do in Class 11</h3><p>${escapeHtml(c.class11 || "Check subject requirements and explore the field through reliable sources.")}</p></section>
      <section class="detail-block"><h3>✅ Before you decide</h3><p>${escapeHtml(c.checklist || "Verify current eligibility and official requirements.")}</p></section>
    </div>
    <div class="modal-warning"><b>Important:</b> Salary and duration are broad guidance, not promises. Actual outcomes depend on qualifications, institution, employer, location and current rules. This is a school-project guide, not official counselling. Always verify the latest official exam, college, regulator or recruitment notification.</div>`;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("closeModal").focus();
}
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
function closeModal(){document.getElementById("modal").classList.add("hidden");}
function emptyState(icon, title, text) {
  return `<div class="empty-state"><div>${icon}</div><h3>${title}</h3><p>${text}</p></div>`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
