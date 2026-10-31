import os
import calendar
from datetime import date, datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# --- Calculation Logic ---

def get_days_in_month(year: int, month: int) -> int:
    _, num_days = calendar.monthrange(year, month)
    return num_days

def get_zodiac_sign(month: int, day: int):
    zodiac_signs = [
        ((1, 20), (2, 18), "Aquarius ♒", "Visionary, curious, independent"),
        ((2, 19), (3, 20), "Pisces ♓", "Empathetic, artistic, intuitive"),
        ((3, 21), (4, 19), "Aries ♈", "Energetic, daring, dynamic"),
        ((4, 20), (5, 20), "Taurus ♉", "Reliable, patient, determined"),
        ((5, 21), (6, 20), "Gemini ♊", "Adaptable, witty, expressive"),
        ((6, 21), (7, 22), "Cancer ♋", "Protective, compassionate, loyal"),
        ((7, 23), (8, 22), "Leo ♌", "Charismatic, proud, generous"),
        ((8, 23), (9, 22), "Virgo ♍", "Analytical, precise, thoughtful"),
        ((9, 23), (10, 22), "Libra ♎", "Harmonious, diplomatic, aesthetic"),
        ((10, 23), (11, 21), "Scorpio ♏", "Intense, resourceful, passionate"),
        ((11, 22), (12, 21), "Sagittarius ♐", "Optimistic, philosophical, free"),
        ((12, 22), (1, 19), "Capricorn ♑", "Strategic, disciplined, tenacious")
    ]
    for (start_m, start_d), (end_m, end_d), sign, desc in zodiac_signs:
        if (month == start_m and day >= start_d) or (month == end_m and day <= end_d):
            return {"name": sign, "traits": desc}
    return {"name": "Capricorn ♑", "traits": "Strategic, disciplined, tenacious"}

def get_chinese_zodiac(year: int):
    animals = [
        ("Monkey 🐵", "Clever, energetic, witty"),
        ("Rooster 🐔", "Hardworking, observant, courageous"),
        ("Dog 🐶", "Loyal, honest, amiable"),
        ("Pig 🐷", "Compassionate, generous, diligent"),
        ("Rat 🐭", "Resourceful, charming, quick-witted"),
        ("Ox 🐂", "Steadfast, determined, patient"),
        ("Tiger 🐯", "Brave, competitive, confident"),
        ("Rabbit 🐰", "Gentle, elegant, kind"),
        ("Dragon 🐲", "Enthusiastic, strong, charismatic"),
        ("Snake 🐍", "Wise, intuitive, graceful"),
        ("Horse 🐴", "Active, animated, freedom-loving"),
        ("Goat 🐐", "Calm, gentle, sympathetic")
    ]
    idx = year % 12
    name, traits = animals[idx]
    return {"name": name, "traits": traits}

def calculate_full_metrics(birth_date: date, today: date):
    # 1. Total Days
    total_days = (today - birth_date).days
    total_weeks = total_days // 7
    remaining_days_in_week = total_days % 7
    total_hours = total_days * 24
    total_minutes = total_hours * 60
    total_seconds = total_minutes * 60

    # 2. Decomposed Age (Years, Months, Days)
    c_year, c_month, c_day = today.year, today.month, today.day
    b_year, b_month, b_day = birth_date.year, birth_date.month, birth_date.day

    if c_day < b_day:
        c_month -= 1
        if c_month < 1:
            c_month = 12
            c_year -= 1
        c_day += get_days_in_month(c_year, c_month)

    if c_month < b_month:
        c_year -= 1
        c_month += 12

    years = c_year - b_year
    months = c_month - b_month
    days = c_day - b_day
    total_full_months = (years * 12) + months
    solar_years = round(total_days / 365.2425, 2)

    # 3. Next Birthday Countdown
    def birthday_for_year(y: int) -> date:
        if birth_date.month == 2 and birth_date.day == 29 and not calendar.isleap(y):
            return date(y, 2, 28)
        return date(y, birth_date.month, birth_date.day)

    next_bday = birthday_for_year(today.year)
    is_birthday_today = (next_bday == today)
    if next_bday < today:
        next_bday = birthday_for_year(today.year + 1)
    days_to_next_bday = (next_bday - today).days

    # 4. Day of the week born on
    day_name_born = birth_date.strftime("%A")

    # 5. Cosmic & Biological Surprises
    # Earth orbital speed around sun: ~107,000 km/h
    km_through_space = total_hours * 107000
    # Average adult resting heart rate ~72-80 bpm
    approx_heartbeats = total_minutes * 75
    # Average adult resting breaths ~16 breaths/min
    approx_breaths = total_minutes * 16
    # Average sleep is approx 8 hours per day = 1/3 of life
    sleep_days = round(total_days / 3, 1)

    # Zodiac signs
    western_zodiac = get_zodiac_sign(birth_date.month, birth_date.day)

    return {
        "status": "success",
        "birth_date": birth_date.isoformat(),
        "today_date": today.isoformat(),
        "day_name_born": day_name_born,
        "is_birthday_today": is_birthday_today,
        "age": {
            "years": years,
            "months": months,
            "days": days
        },
        "totals": {
            "days": total_days,
            "weeks": total_weeks,
            "remaining_days_in_week": remaining_days_in_week,
            "months": total_full_months,
            "years_solar": solar_years,
            "hours": total_hours,
            "minutes": total_minutes,
            "seconds": total_seconds
        },
        "milestones": {
            "days_to_next_bday": days_to_next_bday,
            "next_bday_date": next_bday.isoformat()
        },
        "surprises": {
            "km_through_space": km_through_space,
            "approx_heartbeats": approx_heartbeats,
            "approx_breaths": approx_breaths,
            "sleep_days": sleep_days,
            "western_zodiac": western_zodiac
        }
    }

# --- Routes ---

@app.route("/")
def index():
    today = date.today().isoformat()
    return render_template("index.html", today=today)

@app.route("/api/calculate", methods=["POST"])
def calculate():
    try:
        data = request.get_json(force=True)
        date_str = data.get("birth_date", "").strip()

        if not date_str:
            return jsonify({"status": "error", "message": "Birth date is required."}), 400

        try:
            birth_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid date format. Use YYYY-MM-DD."}), 400

        today = date.today()

        if birth_date > today:
            return jsonify({"status": "error", "message": "Birth date cannot be in the future!"}), 400

        if birth_date.year < 1900:
            return jsonify({"status": "error", "message": "Please enter a year from 1900 onwards."}), 400

        result = calculate_full_metrics(birth_date, today)
        return jsonify(result)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
