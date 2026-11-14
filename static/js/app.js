/**
 * CHRONOS: Interactive Age & Life Metrics Controller
 * Ultra-lightweight & optimized for mobile 60-120 FPS
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Cached DOM Elements
    const dom = {
        liveTime: document.getElementById("live-system-time"),
        form: document.getElementById("age-form"),
        birthDateInput: document.getElementById("birth_date"),
        calculateBtn: document.getElementById("calculate-btn"),
        btnText: document.querySelector("#calculate-btn .btn-text"),
        btnLoader: document.querySelector("#calculate-btn .btn-loader"),
        errorAlert: document.getElementById("form-error"),
        resultsWrapper: document.getElementById("results-wrapper"),
        birthdayAlert: document.getElementById("birthday-alert"),

        // Exact Age
        years: document.getElementById("res-years"),
        months: document.getElementById("res-months"),
        days: document.getElementById("res-days"),
        weekday: document.getElementById("res-weekday"),
        nextBday: document.getElementById("res-next-bday"),

        // Cumulative Totals
        totalDays: document.getElementById("res-total-days"),
        totalWeeks: document.getElementById("res-total-weeks"),
        totalMonths: document.getElementById("res-total-months"),
        solarYears: document.getElementById("res-solar-years"),
        totalHours: document.getElementById("res-total-hours"),
        totalMinutes: document.getElementById("res-total-minutes"),

        // Surprises & Zodiac
        spaceKm: document.getElementById("res-space-km"),
        heartbeats: document.getElementById("res-heartbeats"),
        breaths: document.getElementById("res-breaths"),
        sleepDays: document.getElementById("res-sleep-days"),
        westernZodiac: document.getElementById("res-western-zodiac"),
        westernTraits: document.getElementById("res-western-traits"),

        // Ticker
        tickerSeconds: document.getElementById("live-ticker-seconds"),

        // Social Card Elements
        socialCard: document.getElementById("social-card-render"),
        scBornDate: document.getElementById("sc-born-date"),
        scExactAge: document.getElementById("sc-exact-age"),
        scWeekdayBadge: document.getElementById("sc-weekday-badge"),
        scTotalDays: document.getElementById("sc-total-days"),
        scSpaceVoyage: document.getElementById("sc-space-voyage"),
        scHeartbeats: document.getElementById("sc-heartbeats"),
        scZodiac: document.getElementById("sc-zodiac"),

        // Action Buttons
        downloadCardBtn: document.getElementById("download-card-btn"),
        dlBtnText: document.querySelector("#download-card-btn .btn-text"),
        dlBtnLoader: document.querySelector("#download-card-btn .btn-loader"),
        nativeShareBtn: document.getElementById("native-share-btn"),
    };

    const numFmt = new Intl.NumberFormat("en-US");

    // 2. Header Clock
    if (dom.liveTime) {
        const timeFmt = new Intl.DateTimeFormat("en-US", {
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: true, month: "short", day: "numeric"
        });
        const tick = () => { dom.liveTime.textContent = timeFmt.format(new Date()); };
        tick();
        setInterval(tick, 1000);
    }

    // 3. Fast, Snappy Number Counter (600ms, single rAF pass)
    let activeRaf = null;
    function animateCounters(tasks) {
        if (activeRaf !== null) cancelAnimationFrame(activeRaf);
        const startTime = performance.now();
        const DURATION = 600;

        function step(now) {
            const p = Math.min((now - startTime) / DURATION, 1);
            const ease = 1 - Math.pow(1 - p, 3); // Clean ease-out cubic

            for (let i = 0; i < tasks.length; i++) {
                const t = tasks[i];
                if (!t.el) continue;
                const val = p >= 1 ? t.end : Math.floor(t.end * ease);
                t.el.textContent = t.fmt ? numFmt.format(val) : val;
            }

            if (p < 1) {
                activeRaf = requestAnimationFrame(step);
            } else {
                activeRaf = null;
            }
        }
        activeRaf = requestAnimationFrame(step);
    }

    // 4. Drift-Free Live Ticker
    let tickerTimer = null;
    function startTicker(initialSeconds) {
        if (tickerTimer !== null) clearInterval(tickerTimer);
        const start = Date.now();
        if (dom.tickerSeconds) dom.tickerSeconds.textContent = numFmt.format(initialSeconds);
        tickerTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - start) / 1000);
            if (dom.tickerSeconds) dom.tickerSeconds.textContent = numFmt.format(initialSeconds + elapsed);
        }, 1000);
    }

    // 5. Birthday Confetti
    function shootConfetti() {
        if (typeof confetti !== "function") return;
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    }

    // 6. Populate and Display Results
    function render(data) {
        const { age, totals, milestones, surprises, day_name_born, is_birthday_today } = data;

        if (dom.birthdayAlert) {
            dom.birthdayAlert.classList.toggle("d-none", !is_birthday_today);
            if (is_birthday_today) shootConfetti();
        }

        if (dom.weekday) dom.weekday.textContent = day_name_born;
        if (dom.nextBday) dom.nextBday.textContent = is_birthday_today ? "Today! 🎂" : `${milestones.days_to_next_bday} day(s) away`;
        if (dom.totalWeeks) dom.totalWeeks.textContent = `${numFmt.format(totals.weeks)} weeks, ${totals.remaining_days_in_week} days`;
        if (dom.solarYears) dom.solarYears.textContent = `${totals.years_solar} orbits`;
        if (dom.sleepDays) dom.sleepDays.textContent = `~${numFmt.format(surprises.sleep_days)} days`;
        if (dom.westernZodiac) dom.westernZodiac.textContent = surprises.western_zodiac.name;
        if (dom.westernTraits) dom.westernTraits.textContent = surprises.western_zodiac.traits;

        animateCounters([
            { el: dom.years, end: age.years, fmt: false },
            { el: dom.months, end: age.months, fmt: false },
            { el: dom.days, end: age.days, fmt: false },
            { el: dom.totalDays, end: totals.days, fmt: true },
            { el: dom.totalMonths, end: totals.months, fmt: true },
            { el: dom.totalHours, end: totals.hours, fmt: true },
            { el: dom.totalMinutes, end: totals.minutes, fmt: true },
            { el: dom.spaceKm, end: surprises.km_through_space, fmt: true },
            { el: dom.heartbeats, end: surprises.approx_heartbeats, fmt: true },
            { el: dom.breaths, end: surprises.approx_breaths, fmt: true },
        ]);

        // Populate Social Card
        if (dom.scBornDate) dom.scBornDate.textContent = `Born: ${data.birth_date}`;
        if (dom.scExactAge) dom.scExactAge.textContent = `${age.years} Yrs, ${age.months} Mos, ${age.days} Days`;
        if (dom.scWeekdayBadge) dom.scWeekdayBadge.textContent = `Born on a ${day_name_born}`;
        if (dom.scTotalDays) dom.scTotalDays.textContent = `${numFmt.format(totals.days)} Days`;
        if (dom.scSpaceVoyage) dom.scSpaceVoyage.textContent = `${(surprises.km_through_space / 1e6).toFixed(1)}M km`;
        if (dom.scHeartbeats) dom.scHeartbeats.textContent = `${(surprises.approx_heartbeats / 1e6).toFixed(1)}M Beats`;
        if (dom.scZodiac) dom.scZodiac.textContent = surprises.western_zodiac.name;

        startTicker(totals.seconds);
    }

    // 7. API Call & State
    let busy = false;
    async function calculate(dateVal, scroll) {
        if (busy) return;
        busy = true;
        if (dom.errorAlert) dom.errorAlert.classList.add("d-none");
        if (dom.calculateBtn) dom.calculateBtn.disabled = true;
        if (dom.btnText) dom.btnText.classList.add("d-none");
        if (dom.btnLoader) dom.btnLoader.classList.remove("d-none");

        try {
            const res = await fetch("/api/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ birth_date: dateVal })
            });
            const data = await res.json();

            if (!res.ok || data.status !== "success") {
                if (dom.errorAlert) {
                    dom.errorAlert.textContent = data.message || "Calculation failed.";
                    dom.errorAlert.classList.remove("d-none");
                }
                return;
            }

            try { localStorage.setItem("chronos_last_birth_date", dateVal); } catch (e) {}

            render(data);

            if (dom.resultsWrapper) {
                dom.resultsWrapper.classList.remove("d-none");
                dom.resultsWrapper.classList.add("fade-in");
                if (scroll) dom.resultsWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } catch (e) {
            if (dom.errorAlert) {
                dom.errorAlert.textContent = "Network error. Please try again.";
                dom.errorAlert.classList.remove("d-none");
            }
        } finally {
            busy = false;
            if (dom.calculateBtn) dom.calculateBtn.disabled = false;
            if (dom.btnText) dom.btnText.classList.remove("d-none");
            if (dom.btnLoader) dom.btnLoader.classList.add("d-none");
        }
    }

    if (dom.form) {
        dom.form.addEventListener("submit", (e) => {
            e.preventDefault();
            const val = dom.birthDateInput ? dom.birthDateInput.value : "";
            if (val) calculate(val, true);
        });
    }

    // Restore saved date
    try {
        const saved = localStorage.getItem("chronos_last_birth_date");
        if (saved && dom.birthDateInput) {
            dom.birthDateInput.value = saved;
            calculate(saved, false);
        }
    } catch (e) {}

    // 8. Social Export
    if (dom.nativeShareBtn && typeof navigator.canShare === "function") {
        dom.nativeShareBtn.classList.remove("d-none");
    }

    async function getCardCanvas() {
        return html2canvas(dom.socialCard, { scale: 2, useCORS: true, backgroundColor: "#0c0e1a", logging: false });
    }

    if (dom.downloadCardBtn) {
        dom.downloadCardBtn.addEventListener("click", async () => {
            try {
                dom.downloadCardBtn.disabled = true;
                if (dom.dlBtnText) dom.dlBtnText.classList.add("d-none");
                if (dom.dlBtnLoader) dom.dlBtnLoader.classList.remove("d-none");

                const canvas = await getCardCanvas();
                const a = document.createElement("a");
                a.download = `chronos-life-card-${Date.now()}.png`;
                a.href = canvas.toDataURL("image/png");
                a.click();
            } catch (e) {
                alert("Could not export image.");
            } finally {
                dom.downloadCardBtn.disabled = false;
                if (dom.dlBtnText) dom.dlBtnText.classList.remove("d-none");
                if (dom.dlBtnLoader) dom.dlBtnLoader.classList.add("d-none");
            }
        });
    }

    if (dom.nativeShareBtn) {
        dom.nativeShareBtn.addEventListener("click", async () => {
            try {
                dom.nativeShareBtn.disabled = true;
                const canvas = await getCardCanvas();
                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const file = new File([blob], "my-life-card.png", { type: "image/png" });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({ title: "My Life in Time", files: [file] });
                    } else if (dom.downloadCardBtn) {
                        dom.downloadCardBtn.click();
                    }
                    dom.nativeShareBtn.disabled = false;
                }, "image/png");
            } catch (e) {
                dom.nativeShareBtn.disabled = false;
            }
        });
    }
});
