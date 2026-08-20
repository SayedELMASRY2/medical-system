from datetime import datetime, timedelta
from typing import Optional
from langchain_core.tools import tool
from dateutil.relativedelta import relativedelta
import pytz
import holidays


@tool
def get_pregnancy_dates(
    lmp_date: str,
    country: str = "EG",
    timezone: str = "Africa/Cairo",
) -> dict:
    """Calculate all critical pregnancy dates from the Last Menstrual Period (LMP). Args: lmp_date: LMP date in YYYY-MM-DD format. country: ISO country code. timezone: Timezone string."""
    tz = pytz.timezone(timezone)
    lmp = datetime.strptime(lmp_date, "%Y-%m-%d").replace(tzinfo=tz)
    now = datetime.now(tz)

    edd = lmp + timedelta(days=280)

    days_pregnant = (now - lmp).days
    weeks = days_pregnant // 7
    remaining_days = days_pregnant % 7

    if weeks <= 12:
        trimester = 1
        trimester_name = "First Trimester"
    elif weeks <= 27:
        trimester = 2
        trimester_name = "Second Trimester"
    else:
        trimester = 3
        trimester_name = "Third Trimester"

    milestones = _calculate_milestones(lmp, tz)

    days_remaining = (edd - now).days

    return {
        "lmp_date": lmp_date,
        "edd": edd.strftime("%Y-%m-%d"),
        "current_date": now.strftime("%Y-%m-%d"),
        "gestational_age": {
            "weeks": weeks,
            "days": remaining_days,
            "total_days": days_pregnant,
            "display": f"{weeks}w {remaining_days}d",
        },
        "trimester": trimester,
        "trimester_name": trimester_name,
        "days_remaining": max(0, days_remaining),
        "progress_percentage": round(min(100, (days_pregnant / 280) * 100), 1),
        "milestones": milestones,
        "country": country,
        "timezone": timezone,
    }


@tool
def get_nearest_appointment(
    current_week: int,
    country: str = "EG",
    timezone: str = "Africa/Cairo",
    edd: Optional[str] = None,
) -> dict:
    """Determine the nearest recommended prenatal appointment based on gestational age and country-specific scheduling. Args: current_week: Current gestational week. country: ISO country code. timezone: Patient timezone. edd: Estimated due date (YYYY-MM-DD)."""
    tz = pytz.timezone(timezone)
    now = datetime.now(tz)

    schedule = _get_appointment_schedule(current_week)

    next_appointment_week = None
    for week in schedule:
        if week > current_week:
            next_appointment_week = week
            break

    if next_appointment_week is None:
        next_appointment_week = current_week + 1

    weeks_until = next_appointment_week - current_week
    target_date = now + timedelta(weeks=weeks_until)

    try:
        country_holidays = holidays.country_holidays(country, years=target_date.year)
        while target_date.date() in country_holidays or target_date.weekday() >= 5:
            target_date += timedelta(days=1)
    except Exception:
        while target_date.weekday() >= 5:
            target_date += timedelta(days=1)

    appointment_type = _get_appointment_type(next_appointment_week)

    return {
        "next_appointment": {
            "recommended_week": next_appointment_week,
            "suggested_date": target_date.strftime("%Y-%m-%d"),
            "day_of_week": target_date.strftime("%A"),
            "type": appointment_type["type"],
            "description": appointment_type["description"],
            "tests_expected": appointment_type["tests"],
        },
        "current_week": current_week,
        "weeks_until_appointment": weeks_until,
        "country": country,
        "holiday_adjusted": True,
    }


@tool
def summarize_checkin_trends(checkins: list[dict]) -> dict:
    """Summarize longitudinal trends from daily patient check-in records over time. Args: checkins: List of daily check-in records."""
    if not checkins:
        return {"summary": "No check-in data available yet.", "trends": []}

    days_count = len(checkins)
    underhydrated_days = sum(1 for c in checkins if int(c.get("water_intake_cups", 0) or 0) < 4)
    headache_days = sum(1 for c in checkins if c.get("headache", "None") != "None")
    high_sodium_days = sum(1 for c in checkins if "high sodium" in str(c.get("diet_quality", "")).lower())
    edema_days = sum(1 for c in checkins if c.get("swelling_edema", "None") != "None")

    trends = []
    if underhydrated_days >= 3:
        trends.append(f"Patient has been under-hydrated (< 4 cups/day) for {underhydrated_days}/{days_count} days, which may trigger mild headaches.")
    if headache_days >= 3:
        trends.append(f"Persistent headaches reported across {headache_days}/{days_count} days.")
    if high_sodium_days >= 2:
        trends.append(f"High sodium dietary intake reported on {high_sodium_days} days, monitoring fluid retention.")
    if edema_days >= 2:
        trends.append(f"Peripheral/Facial edema observed across {edema_days} days.")

    return {
        "days_analyzed": days_count,
        "underhydrated_days": underhydrated_days,
        "headache_days": headache_days,
        "high_sodium_days": high_sodium_days,
        "edema_days": edema_days,
        "trends": trends,
        "summary": " • ".join(trends) if trends else "Daily vital parameters and lifestyle indicators remain within normal baseline."
    }


@tool
def get_holidays_by_country(

    country: str = "EG",
    year: Optional[int] = None,
) -> dict:
    """Get public holidays for a specific country and year. Used to avoid scheduling appointments on holidays. Args: country: ISO country code. year: Year to get holidays for."""
    if year is None:
        year = datetime.now().year

    try:
        country_holidays = holidays.country_holidays(country, years=year)
        holiday_list = [
            {"date": date.strftime("%Y-%m-%d"), "name": name}
            for date, name in sorted(country_holidays.items())
        ]
        return {
            "country": country,
            "year": year,
            "holidays": holiday_list,
            "total_holidays": len(holiday_list),
        }
    except Exception as e:
        return {
            "country": country,
            "year": year,
            "holidays": [],
            "error": f"Could not retrieve holidays: {str(e)}",
        }


def _calculate_milestones(lmp: datetime, tz) -> list[dict]:
    now = datetime.now(tz)
    milestones = [
        {"week": 8, "name": "First Prenatal Visit", "description": "Initial checkup and blood work"},
        {"week": 12, "name": "First Trimester Screening", "description": "NT scan + blood tests"},
        {"week": 16, "name": "Quad Screen", "description": "Second trimester screening blood test"},
        {"week": 20, "name": "Anatomy Scan", "description": "Detailed ultrasound of baby's development"},
        {"week": 24, "name": "Glucose Test", "description": "Gestational diabetes screening"},
        {"week": 28, "name": "Third Trimester Begins", "description": "RhoGAM if Rh-negative, kick counts begin"},
        {"week": 32, "name": "Growth Scan", "description": "Check baby's growth and position"},
        {"week": 36, "name": "GBS Test", "description": "Group B Strep screening"},
        {"week": 37, "name": "Full Term", "description": "Weekly visits begin"},
        {"week": 40, "name": "Due Date", "description": "Estimated delivery date"},
    ]

    for milestone in milestones:
        milestone_date = lmp + timedelta(weeks=milestone["week"])
        milestone["date"] = milestone_date.strftime("%Y-%m-%d")
        milestone["status"] = "completed" if now >= milestone_date else "upcoming"

    return milestones


def _get_appointment_schedule(current_week: int) -> list[int]:
    schedule = list(range(8, 29, 4))
    schedule += list(range(30, 37, 2))
    schedule += list(range(37, 42))
    return schedule


def _get_appointment_type(week: int) -> dict:
    types = {
        8: {"type": "Initial Visit", "description": "First prenatal checkup", "tests": ["Blood work", "Urinalysis", "Blood pressure", "Weight"]},
        12: {"type": "First Trimester Screen", "description": "NT ultrasound + blood test", "tests": ["NT Scan", "PAPP-A", "hCG", "Blood pressure"]},
        16: {"type": "Routine Visit", "description": "Quad screen available", "tests": ["Quad screen (optional)", "Fundal height", "Fetal heartbeat"]},
        20: {"type": "Anatomy Scan", "description": "Detailed anatomy ultrasound", "tests": ["Level 2 Ultrasound", "Fundal height", "Blood pressure"]},
        24: {"type": "Glucose Screening", "description": "Gestational diabetes test", "tests": ["Glucose challenge test", "CBC", "Blood pressure"]},
        28: {"type": "Third Trimester Entry", "description": "RhoGAM shot if needed", "tests": ["RhoGAM (if Rh-)", "Kick counts education", "Blood pressure"]},
        32: {"type": "Growth Check", "description": "Baby growth assessment", "tests": ["Growth ultrasound", "Non-stress test (if indicated)", "Blood pressure"]},
        36: {"type": "GBS Screening", "description": "Group B Strep test", "tests": ["GBS culture", "Cervical check", "Blood pressure", "Fetal position"]},
    }

    if week in types:
        return types[week]

    return {
        "type": "Routine Prenatal Visit",
        "description": f"Standard checkup at week {week}",
        "tests": ["Blood pressure", "Weight", "Fundal height", "Fetal heartbeat"],
    }
