/**
 * CHRONOS: Interactive Age & Life Metrics Controller
 * Optimized for performance: DOM element caching, unified rAF batch animation,
 * drift-free live timers, and minimal allocations.
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- Cached DOM Elements ---
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

    // --- 1. Live System Time Clock (Pre-instantiated Formatter) ---
    if (dom.liveTime) {
        const timeFormatter = new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            month: "short",
            day: "numeric"
        });

        const updateClock = () => {
            dom.liveTime.textContent = timeFormatter.format(new Date());
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    // --- 2. Unified Batch Number Animation Controller ---
    let activeAnimationId = null;

    /**
     * Animate multiple numeric counters in a single batched requestAnimationFrame loop.
     * Prevents DOM thrashing and cancels any previous active animation.
     */
    function animateCountersBatch(tasks) {
        if (activeAnimationId !== null) {
            cancelAnimationFrame(activeAnimationId);
            activeAnimationId = null;
        }

        const startTime = performance.now();
        // Determine the maximum duration across all tasks
        let maxDuration = 0;
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].duration > maxDuration) {
                maxDuration = tasks[i].duration;
            }
        }

        function frame(currentTime) {
            const elapsed = currentTime - startTime;
            let allDone = true;

            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                if (!task.el) continue;

                const progress = Math.min(elapsed / task.duration, 1);
                // Ease-out quint for smooth deceleration
                const ease = 1 - Math.pow(1 - progress, 5);
                const currentVal = Math.floor(task.start + (task.end - task.start) * ease);

                const formatted = task.isFormatted ? currentVal.toLocaleString() : String(currentVal);
                if (task.lastVal !== formatted) {
                    task.el.textContent = formatted;
                    task.lastVal = formatted;
                }

                if (progress < 1) {
                    allDone = false;
                } else if (task.lastVal !== (task.isFormatted ? task.end.toLocaleString() : String(task.end))) {
                    task.el.textContent = task.isFormatted ? task.end.toLocaleString() : String(task.end);
                }
            }

            if (!allDone) {
                activeAnimationId = requestAnimationFrame(frame);
            } else {
                activeAnimationId = null;
            }
        }

        activeAnimationId = requestAnimationFrame(frame);
    }

    // --- 3. Drift-Free Live Ticker ---
    let liveTickerInterval = null;

    function startLiveTicker(initialSeconds) {
        if (liveTickerInterval !== null) {
            clearInterval(liveTickerInterval);
            liveTickerInterval = null;
        }

        const startEpoch = Date.now();
        const baseSeconds = initialSeconds;

        if (dom.tickerSeconds) {
            dom.tickerSeconds.textContent = baseSeconds.toLocaleString();
        }

        liveTickerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startEpoch) / 1000);
            if (dom.tickerSeconds) {
                dom.tickerSeconds.textContent = (baseSeconds + elapsed).toLocaleString();
            }
        }, 1000);
    }

    // --- 4. Birthday Celebration Confetti ---
    function triggerBirthdayConfetti() {
        if (typeof confetti !== "function") return;
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 } });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }

    // --- 5. Populate Results & Trigger Animation ---
    function renderResults(data) {
        const { age, totals, milestones, surprises, day_name_born, is_birthday_today } = data;

        // Birthday Banner
        if (dom.birthdayAlert) {
            if (is_birthday_today) {
                dom.birthdayAlert.classList.remove("d-none");
                triggerBirthdayConfetti();
            } else {
                dom.birthdayAlert.classList.add("d-none");
            }
        }

        // Sub-info static texts
        if (dom.weekday) dom.weekday.textContent = day_name_born;
        if (dom.nextBday) {
            dom.nextBday.textContent = is_birthday_today ? "Today! 🎂" : `${milestones.days_to_next_bday} day(s) away`;
        }
        if (dom.totalWeeks) {
            dom.totalWeeks.textContent = `${totals.weeks.toLocaleString()} weeks, ${totals.remaining_days_in_week} days`;
        }
        if (dom.solarYears) {
            dom.solarYears.textContent = `${totals.years_solar} orbits`;
        }
        if (dom.sleepDays) {
            dom.sleepDays.textContent = `~${surprises.sleep_days.toLocaleString()} days`;
        }
        if (dom.westernZodiac) {
            dom.westernZodiac.textContent = surprises.western_zodiac.name;
        }
        if (dom.westernTraits) {
            dom.westernTraits.textContent = surprises.western_zodiac.traits;
        }

        // Batch counter animations together
        const tasks = [
            { el: dom.years, start: 0, end: age.years, duration: 2200, isFormatted: false },
            { el: dom.months, start: 0, end: age.months, duration: 2200, isFormatted: false },
            { el: dom.days, start: 0, end: age.days, duration: 2200, isFormatted: false },
            { el: dom.totalDays, start: 0, end: totals.days, duration: 2400, isFormatted: true },
            { el: dom.totalMonths, start: 0, end: totals.months, duration: 2400, isFormatted: true },
            { el: dom.totalHours, start: 0, end: totals.hours, duration: 2600, isFormatted: true },
            { el: dom.totalMinutes, start: 0, end: totals.minutes, duration: 2800, isFormatted: true },
            { el: dom.spaceKm, start: 0, end: surprises.km_through_space, duration: 3000, isFormatted: true },
            { el: dom.heartbeats, start: 0, end: surprises.approx_heartbeats, duration: 2800, isFormatted: true },
            { el: dom.breaths, start: 0, end: surprises.approx_breaths, duration: 2600, isFormatted: true },
        ];
        animateCountersBatch(tasks);

        // Populate Social Card Elements
        populateSocialCard(data);

        // Start Live Drift-Free Ticker
        startLiveTicker(totals.seconds);
    }

    function populateSocialCard(data) {
        const { birth_date, age, totals, surprises, day_name_born } = data;
        if (dom.scBornDate) dom.scBornDate.textContent = `Born: ${birth_date}`;
        if (dom.scExactAge) dom.scExactAge.textContent = `${age.years} Yrs, ${age.months} Mos, ${age.days} Days`;
        if (dom.scWeekdayBadge) dom.scWeekdayBadge.textContent = `Born on a ${day_name_born}`;
        if (dom.scTotalDays) dom.scTotalDays.textContent = `${totals.days.toLocaleString()} Days`;

        if (dom.scSpaceVoyage) {
            const spaceMln = (surprises.km_through_space / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 });
            dom.scSpaceVoyage.textContent = `${spaceMln}M km`;
        }

        if (dom.scHeartbeats) {
            const heartbeatsMln = (surprises.approx_heartbeats / 1_000_000).toFixed(1);
            dom.scHeartbeats.textContent = `${heartbeatsMln}M Beats`;
        }

        if (dom.scZodiac) dom.scZodiac.textContent = surprises.western_zodiac.name;
    }

    // --- 6. Form Submission & API Fetching ---
    let isCalculating = false;

    function setLoading(isLoading) {
        isCalculating = isLoading;
        if (dom.calculateBtn) dom.calculateBtn.disabled = isLoading;
        if (dom.btnText) dom.btnText.classList.toggle("d-none", isLoading);
        if (dom.btnLoader) dom.btnLoader.classList.toggle("d-none", !isLoading);
    }

    function showError(msg) {
        if (dom.errorAlert) {
            dom.errorAlert.textContent = msg;
            dom.errorAlert.classList.remove("d-none");
        }
    }

    function hideError() {
        if (dom.errorAlert) {
            dom.errorAlert.classList.add("d-none");
            dom.errorAlert.textContent = "";
        }
    }

    async function triggerCalculation(dateVal, shouldScroll = true) {
        if (isCalculating) return; // Prevent concurrent requests
        hideError();
        setLoading(true);

        try {
            const response = await fetch("/api/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ birth_date: dateVal })
            });

            const data = await response.json();

            if (!response.ok || data.status !== "success") {
                showError(data.message || "An error occurred while calculating.");
                setLoading(false);
                return;
            }

            // Persist to browser localStorage
            try {
                localStorage.setItem("chronos_last_birth_date", dateVal);
            } catch (e) {
                // Silently handle storage quota or private mode restrictions
            }

            // Render Results
            renderResults(data);

            if (dom.resultsWrapper) {
                dom.resultsWrapper.classList.remove("d-none");
                dom.resultsWrapper.classList.add("fade-in");
                if (shouldScroll) {
                    dom.resultsWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }

        } catch (err) {
            showError("Network error or server unreachable. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (dom.form) {
        dom.form.addEventListener("submit", (e) => {
            e.preventDefault();
            const dateVal = dom.birthDateInput ? dom.birthDateInput.value : "";
            if (!dateVal) {
                showError("Please pick your date of birth first.");
                return;
            }
            triggerCalculation(dateVal, true);
        });
    }

    // Restore last checked date from localStorage on load
    try {
        const savedDate = localStorage.getItem("chronos_last_birth_date");
        if (savedDate && dom.birthDateInput) {
            dom.birthDateInput.value = savedDate;
            triggerCalculation(savedDate, false);
        }
    } catch (e) {
        // Handled silently
    }

    // --- 7. Social Card Export & Sharing ---
    if (dom.nativeShareBtn && typeof navigator.canShare === "function") {
        dom.nativeShareBtn.classList.remove("d-none");
    }

    async function generateCardCanvas() {
        if (typeof html2canvas !== "function") {
            throw new Error("html2canvas library is not loaded.");
        }
        return await html2canvas(dom.socialCard, {
            scale: 2, // Crisp retina output
            useCORS: true,
            backgroundColor: "#0c0e1a",
            logging: false
        });
    }

    if (dom.downloadCardBtn) {
        dom.downloadCardBtn.addEventListener("click", async () => {
            try {
                dom.downloadCardBtn.disabled = true;
                if (dom.dlBtnText) dom.dlBtnText.classList.add("d-none");
                if (dom.dlBtnLoader) dom.dlBtnLoader.classList.remove("d-none");

                const canvas = await generateCardCanvas();
                const dataUrl = canvas.toDataURL("image/png");

                const link = document.createElement("a");
                link.download = `chronos-life-card-${Date.now()}.png`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (err) {
                console.error("Export error:", err);
                alert("Could not export image. Please try again.");
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
                const canvas = await generateCardCanvas();

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        dom.nativeShareBtn.disabled = false;
                        return;
                    }
                    const file = new File([blob], "my-life-in-time.png", { type: "image/png" });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: "My Life in Time | CHRONOS",
                            text: "Check out my exact age and cosmic journey through time!",
                            files: [file]
                        });
                    } else if (dom.downloadCardBtn) {
                        dom.downloadCardBtn.click();
                    }
                    dom.nativeShareBtn.disabled = false;
                }, "image/png");

            } catch (err) {
                console.error("Sharing error:", err);
                dom.nativeShareBtn.disabled = false;
            }
        });
    }
});
