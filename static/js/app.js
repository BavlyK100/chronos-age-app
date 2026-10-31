/**
 * CHRONOS: Interactive Age & Life Metrics Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Live System Time Clock in Header
    const liveTimeEl = document.getElementById("live-system-time");
    function updateClock() {
        if (!liveTimeEl) return;
        const now = new Date();
        const options = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true,
            month: 'short',
            day: 'numeric'
        };
        liveTimeEl.textContent = now.toLocaleString('en-US', options);
    }
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Form & Calculation Handling
    const form = document.getElementById("age-form");
    const birthDateInput = document.getElementById("birth_date");
    const calculateBtn = document.getElementById("calculate-btn");
    const btnText = calculateBtn.querySelector(".btn-text");
    const btnLoader = calculateBtn.querySelector(".btn-loader");
    const errorAlert = document.getElementById("form-error");
    const resultsWrapper = document.getElementById("results-wrapper");
    const birthdayAlert = document.getElementById("birthday-alert");

    // Dynamic ticker state
    let liveTickerInterval = null;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();

        const dateVal = birthDateInput.value;
        if (!dateVal) {
            showError("Please pick your date of birth first.");
            return;
        }

        // Set Loading State
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

            // Render Results
            renderResults(data);

            // Reveal results wrapper with smooth animation
            resultsWrapper.classList.remove("d-none");
            resultsWrapper.classList.add("fade-in");

            // Scroll smoothly into view
            resultsWrapper.scrollIntoView({ behavior: "smooth", block: "start" });

        } catch (err) {
            showError("Network error or server unreachable. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            calculateBtn.disabled = true;
            btnText.classList.add("d-none");
            btnLoader.classList.remove("d-none");
        } else {
            calculateBtn.disabled = false;
            btnText.classList.remove("d-none");
            btnLoader.classList.add("d-none");
        }
    }

    function showError(msg) {
        errorAlert.textContent = msg;
        errorAlert.classList.remove("d-none");
    }

    function hideError() {
        errorAlert.classList.add("d-none");
        errorAlert.textContent = "";
    }

    // Number Count-Up Animation (Enhanced with slower, smoother easing)
    function animateValue(element, start, end, duration = 2400, isFormatted = true) {
        if (!element) return;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Smooth ease-out quint for dramatic, satisfying deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 5);
            const current = Math.floor(start + (end - start) * easeProgress);

            element.textContent = isFormatted ? current.toLocaleString() : current;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = isFormatted ? end.toLocaleString() : end;
            }
        }

        requestAnimationFrame(update);
    }

    // Render Data into DOM
    function renderResults(data) {
        const { age, totals, milestones, surprises, day_name_born, is_birthday_today } = data;

        // Birthday Celebration & Confetti
        if (is_birthday_today) {
            birthdayAlert.classList.remove("d-none");
            triggerBirthdayConfetti();
        } else {
            birthdayAlert.classList.add("d-none");
        }

        // Exact Age (Animated with leisurely, cinematic pace)
        animateValue(document.getElementById("res-years"), 0, age.years, 2200, false);
        animateValue(document.getElementById("res-months"), 0, age.months, 2200, false);
        animateValue(document.getElementById("res-days"), 0, age.days, 2200, false);

        // Sub-info
        document.getElementById("res-weekday").textContent = day_name_born;

        const nextBdayEl = document.getElementById("res-next-bday");
        if (is_birthday_today) {
            nextBdayEl.textContent = "Today! 🎂";
        } else {
            nextBdayEl.textContent = `${milestones.days_to_next_bday} day(s) away`;
        }

        // Cumulative Totals (Smooth 2.5s count-up transition)
        animateValue(document.getElementById("res-total-days"), 0, totals.days, 2400);
        document.getElementById("res-total-weeks").textContent = `${totals.weeks.toLocaleString()} weeks, ${totals.remaining_days_in_week} days`;
        animateValue(document.getElementById("res-total-months"), 0, totals.months, 2400);
        document.getElementById("res-solar-years").textContent = `${totals.years_solar} orbits`;
        animateValue(document.getElementById("res-total-hours"), 0, totals.hours, 2600);
        animateValue(document.getElementById("res-total-minutes"), 0, totals.minutes, 2800);

        // Surprises
        animateValue(document.getElementById("res-space-km"), 0, surprises.km_through_space, 3000);
        animateValue(document.getElementById("res-heartbeats"), 0, surprises.approx_heartbeats, 2800);
        animateValue(document.getElementById("res-breaths"), 0, surprises.approx_breaths, 2600);
        document.getElementById("res-sleep-days").textContent = `~${surprises.sleep_days.toLocaleString()} days`;

        // Western Zodiac
        document.getElementById("res-western-zodiac").textContent = surprises.western_zodiac.name;
        document.getElementById("res-western-traits").textContent = surprises.western_zodiac.traits;

        // Populate Hidden Social Card for High-Res Export
        populateSocialCard(data);

        // Live Ticking Life Clock
        startLiveTicker(totals.seconds);
    }

    // Populate Social Card Details
    function populateSocialCard(data) {
        const { birth_date, age, totals, surprises, day_name_born } = data;
        document.getElementById("sc-born-date").textContent = `Born: ${birth_date}`;
        document.getElementById("sc-exact-age").textContent = `${age.years} Yrs, ${age.months} Mos, ${age.days} Days`;
        document.getElementById("sc-weekday-badge").textContent = `Born on a ${day_name_born}`;
        document.getElementById("sc-total-days").textContent = `${totals.days.toLocaleString()} Days`;
        
        const spaceMln = (surprises.km_through_space / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 });
        document.getElementById("sc-space-voyage").textContent = `${spaceMln}M km`;
        
        const heartbeatsBln = (surprises.approx_heartbeats / 1_000_000).toFixed(1);
        document.getElementById("sc-heartbeats").textContent = `${heartbeatsBln}M Beats`;
        document.getElementById("sc-zodiac").textContent = surprises.western_zodiac.name;
    }

    // Social Card Export & Sharing
    const downloadCardBtn = document.getElementById("download-card-btn");
    const nativeShareBtn = document.getElementById("native-share-btn");
    const dlBtnText = downloadCardBtn.querySelector(".btn-text");
    const dlBtnLoader = downloadCardBtn.querySelector(".btn-loader");

    // Check if browser supports native file sharing
    if (navigator.canShare) {
        nativeShareBtn.classList.remove("d-none");
    }

    async function generateCardCanvas() {
        const cardEl = document.getElementById("social-card-render");
        if (typeof html2canvas !== "function") {
            throw new Error("html2canvas library is not loaded.");
        }
        return await html2canvas(cardEl, {
            scale: 2, // High resolution (retina crisp)
            useCORS: true,
            backgroundColor: "#0c0e1a",
            logging: false
        });
    }

    downloadCardBtn.addEventListener("click", async () => {
        try {
            downloadCardBtn.disabled = true;
            dlBtnText.classList.add("d-none");
            dlBtnLoader.classList.remove("d-none");

            const canvas = await generateCardCanvas();
            const dataUrl = canvas.toDataURL("image/png");

            // Create download link
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
            downloadCardBtn.disabled = false;
            dlBtnText.classList.remove("d-none");
            dlBtnLoader.classList.add("d-none");
        }
    });

    if (nativeShareBtn) {
        nativeShareBtn.addEventListener("click", async () => {
            try {
                nativeShareBtn.disabled = true;
                const canvas = await generateCardCanvas();
                
                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const file = new File([blob], "my-life-in-time.png", { type: "image/png" });
                    
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: "My Life in Time | CHRONOS",
                            text: "Check out my exact age and cosmic journey through time!",
                            files: [file]
                        });
                    } else {
                        // Fallback to direct download
                        downloadCardBtn.click();
                    }
                    nativeShareBtn.disabled = false;
                }, "image/png");

            } catch (err) {
                console.error("Sharing error:", err);
                nativeShareBtn.disabled = false;
            }
        });
    }

    function startLiveTicker(initialSeconds) {
        if (liveTickerInterval) clearInterval(liveTickerInterval);
        let currentSeconds = initialSeconds;
        const tickerEl = document.getElementById("live-ticker-seconds");
        tickerEl.textContent = currentSeconds.toLocaleString();

        liveTickerInterval = setInterval(() => {
            currentSeconds += 1;
            tickerEl.textContent = currentSeconds.toLocaleString();
        }, 1000);
    }

    function triggerBirthdayConfetti() {
        if (typeof confetti !== "function") return;
        const duration = 3.5 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
});
