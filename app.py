import calendar
from datetime import date
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Precomputed zodiac sign bounds to avoid repeated allocations on every request
ZODIAC_SIGNS = (
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
    ((12, 22), (1, 19), "Capricorn ♑", "Strategic, disciplined, tenacious"),
)

# Days per month lookup (non-leap year)
DAYS_IN_MONTH = (0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)

def get_days_in_month(year: int, month: int) -> int:
    if month == 2 and calendar.isleap(year):
        return 29
    return DAYS_IN_MONTH[month]

def get_zodiac_sign(month: int, day: int):
    for (start_m, start_d), (end_m, end_d), sign, desc in ZODIAC_SIGNS:
        if (month == start_m and day >= start_d) or (month == end_m and day <= end_d):
            return {"name": sign, "traits": desc}
    return {"name": "Capricorn ♑", "traits": "Strategic, disciplined, tenacious"}

def calculate_full_metrics(birth_date: date, today: date):
    # 1. Total Days & Time units
    total_days = (today - birth_date).days
    total_weeks, remaining_days_in_week = divmod(total_days, 7)
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
    # Handle Feb 29 for non-leap years
    b_month_fix = birth_date.month
    b_day_fix = birth_date.day
    is_leap_birth = (b_month_fix == 2 and b_day_fix == 29)

    target_year = today.year
    if is_leap_birth and not calendar.isleap(target_year):
        next_bday = date(target_year, 2, 28)
    else:
        next_bday = date(target_year, b_month_fix, b_day_fix)

    is_birthday_today = (next_bday == today)
    if next_bday < today:
        target_year += 1
        if is_leap_birth and not calendar.isleap(target_year):
            next_bday = date(target_year, 2, 28)
        else:
            next_bday = date(target_year, b_month_fix, b_day_fix)

    days_to_next_bday = (next_bday - today).days

    # 4. Day of the week born on
    day_name_born = birth_date.strftime("%A")

    # 5. Cosmic & Biological Surprises
    # Earth orbital speed around sun: ~107,000 km/h
    km_through_space = total_hours * 107000
    # Average adult resting heart rate ~75 bpm
    approx_heartbeats = total_minutes * 75
    # Average adult resting breaths ~16 breaths/min
    approx_breaths = total_minutes * 16
    # Average sleep is approx 1/3 of life
    sleep_days = round(total_days / 3, 1)

    # Zodiac sign lookup
    western_zodiac = get_zodiac_sign(b_month_fix, b_day_fix)

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
    return render_template("index.html", today=date.today().isoformat())

@app.route("/api/calculate", methods=["POST"])
def calculate():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"status": "error", "message": "Invalid JSON payload."}), 400

        date_str = data.get("birth_date", "").strip()
        if not date_str:
            return jsonify({"status": "error", "message": "Birth date is required."}), 400

        try:
            # Fast ISO-8601 parsing implemented in C
            birth_date = date.fromisoformat(date_str)
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid date format. Use YYYY-MM-DD."}), 400

        today = date.today()

        if birth_date > today:
            return jsonify({"status": "error", "message": "Birth date cannot be in the future!"}), 400

        if birth_date.year < 1900:
            return jsonify({"status": "error", "message": "Please enter a year from 1900 onwards."}), 400

        return jsonify(calculate_full_metrics(birth_date, today))

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
