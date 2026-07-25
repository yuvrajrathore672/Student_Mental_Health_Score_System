const API_URL = "https://mental-health-score-qk3v.onrender.com";

const form = document.getElementById("predictForm");
const submitBtn = document.getElementById("submitBtn");

const idleState = document.getElementById("idleState");
const loadingState = document.getElementById("loadingState");
const resultState = document.getElementById("resultState");
const errorBox = document.getElementById("errorBox");

const scoreValue = document.getElementById("scoreValue");
const gaugeArc = document.getElementById("gaugeArc");
const gaugeDot = document.getElementById("gaugeDot");

const stressGroup = document.getElementById("stress_level_group");
const stressInput = document.getElementById("stress_level");

// Stress pill selector
stressGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".pill");
  if (!btn) return;
  stressGroup.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  stressInput.value = btn.dataset.value;
});

function showState(state) {
  idleState.classList.add("hidden");
  loadingState.classList.add("hidden");
  resultState.classList.add("hidden");
  state.classList.remove("hidden");
}

// Arc geometry: semicircle path length ≈ 251.2 (πr, r=80)
const ARC_LENGTH = Math.PI * 80;

function setGauge(score) {
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const offset = ARC_LENGTH * (1 - pct);
  gaugeArc.style.strokeDasharray = ARC_LENGTH;
  gaugeArc.style.strokeDashoffset = offset;

  // Move dot along the arc: angle from 180deg (left) to 0deg (right)
  const angle = Math.PI * (1 - pct);
  const cx = 100 + 80 * Math.cos(angle);
  const cy = 100 - 80 * Math.sin(angle);
  gaugeDot.setAttribute("cx", cx);
  gaugeDot.setAttribute("cy", cy);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.add("hidden");
  showState(loadingState);
  submitBtn.disabled = true;

  const payload = {
    age: Number(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    country: document.getElementById("country").value.trim(),
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: Number(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: Number(document.getElementById("daily_unlocks").value),
    study_hours: Number(document.getElementById("study_hours").value),
    physical_activity_hours: Number(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: Number(document.getElementById("sleep_hours_per_night").value),
    stress_level: stressInput.value,
  };

  // Small delay so the "reading the signal" state is visible even on fast responses
  const minDelay = new Promise(res => setTimeout(res, 500));

  try {
    const [response] = await Promise.all([
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      minDelay,
    ]);

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const msg = errData?.detail
        ? JSON.stringify(errData.detail)
        : `Request failed with status ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const score = Math.max(0, Math.min(10, data.predicted_score));

    scoreValue.textContent = score.toFixed(2);
    setGauge(score);
    showState(resultState);
  } catch (err) {
    showState(idleState);
    errorBox.textContent = "Something went wrong: " + err.message;
    errorBox.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
  }
});