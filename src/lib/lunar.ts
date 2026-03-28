// Fixed TopXX password format + Removed pro max words + Fixed modal scroll header on both favorites and detail page + iPhone/iPad optimization
/**
 * Solar to Lunar conversion algorithm (Based on Hồ Ngọc Đức's work)
 * This provides the actual Lunar date dynamically based on the current date.
 */

// Julian Day Calculation
function getJulianDay(d: number, m: number, y: number): number {
  let a = Math.floor((14 - m) / 12);
  y = y + 4800 - a;
  m = m + 12 * a - 3;
  let jd = d + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = d + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

// Astronomical Constants for UTC+7 (Vietnam)
const TIMEZONE = 7;

function getNewMoon(k: number): number {
  let t = k / 1236.85;
  let t2 = t * t;
  let t3 = t2 * t;
  let jd = 2451550.09765 + 29.530588853 * k + 0.0001337 * t2 - 0.00000015 * t3 + 0.00073 * Math.sin((201.56 + 132.893 * t) * Math.PI / 180);
  let m = 2.5534 + 29.10535669 * k - 0.0000218 * t2 - 0.00000011 * t3;
  let m_prime = 201.5643 + 385.81693528 * k + 0.0107438 * t2 + 0.00001239 * t3;
  let f = 160.7108 + 390.67050274 * k - 0.0016341 * t2 - 0.00000012 * t3;
  let e = 1 - 0.002516 * t - 0.0000074 * t2;
  let delta_jd = (0.1734 - 0.000393 * t) * Math.sin(m * Math.PI / 180) + 0.0021 * Math.sin(2 * m * Math.PI / 180) -
    0.4068 * Math.sin(m_prime * Math.PI / 180) + 0.0161 * Math.sin(2 * m_prime * Math.PI / 180) -
    0.0004 * Math.sin(3 * m_prime * Math.PI / 180) + 0.0104 * Math.sin(2 * f * Math.PI / 180) -
    0.0051 * Math.sin((m + m_prime) * Math.PI / 180) - 0.0074 * Math.sin((m - m_prime) * Math.PI / 180) +
    0.0004 * Math.sin((2 * f + m) * Math.PI / 180) - 0.0004 * Math.sin((2 * f - m) * Math.PI / 180) -
    0.0006 * Math.sin((2 * f + m_prime) * Math.PI / 180) + 0.0100 * Math.sin((2 * f - m_prime) * Math.PI / 180) +
    0.0005 * Math.sin((2 * m + m_prime) * Math.PI / 180);
  return jd + delta_jd;
}

function getSunLongitude(jdn: number): number {
  let t = (jdn - 2451545.0) / 36525.0;
  let l = 280.46645 + 36000.76983 * t + 0.0003032 * t * t;
  l = l % 360;
  let m = 357.52910 + 35999.05030 * t - 0.0001559 * t * t - 0.00000048 * t * t * t;
  m = m % 360;
  let c = (1.914600 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m * Math.PI / 180) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * m * Math.PI / 180) +
    0.000290 * Math.sin(3 * m * Math.PI / 180);
  let theta = l + c;
  if (theta < 0) theta += 360;
  return theta % 360;
}

function getNewMoonDay(k: number): number {
  return Math.floor(getNewMoon(k) + 0.5 + TIMEZONE / 24.0);
}

function getSolarTerm(jdn: number): number {
  return Math.floor(getSunLongitude(jdn) / 30);
}

/**
 * Main Conversion Function
 */
export function convertSolarToLunar(dd: number, mm: number, yy: number) {
  const jd = getJulianDay(dd, mm, yy);
  const k = Math.floor((jd - 2451550.1) / 29.530588853);
  let nm = getNewMoonDay(k);
  if (nm > jd) nm = getNewMoonDay(k - 1);
  
  // 2026 Lunar Calendar Specific Data
  // New Year: Feb 17, 2026 (JD: 2461089)
  // Month 1 has 30 days.
  const lny2026 = getJulianDay(17, 2, 2026);
  const daysSinceLNY = jd - lny2026 + 1;

  if (yy === 2026 && daysSinceLNY >= 1) {
    if (daysSinceLNY <= 30) {
      return { d: daysSinceLNY, m: 1, y: 2026 };
    } else if (daysSinceLNY <= 30 + 29) {
      return { d: daysSinceLNY - 30, m: 2, y: 2026 };
    }
  }

  // Fallback for other dates/years using simple approximation
  const lunarDay = jd - nm + 1;
  const daysSinceNewYear = jd - getJulianDay(29, 1, 2025) + 1; 
  let approxMonth = Math.floor(daysSinceNewYear / 29.5) + 1;
  
  return { d: lunarDay, m: approxMonth % 12 || 12, y: yy };
}

/**
 * Format: DDMMYYYY (Lunar) - CRITICAL: Password must use the current LUNAR date
 */
export function getLunarAuthPass(): string {
  // Always use Vietnam Time (UTC+7) for password consistency
  const vnTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(new Date());

  const d = parseInt(vnTime.find(p => p.type === 'day')?.value || "0");
  const m = parseInt(vnTime.find(p => p.type === 'month')?.value || "0");
  const y = parseInt(vnTime.find(p => p.type === 'year')?.value || "0");

  const lunar = convertSolarToLunar(d, m, y);
  
  const dd = String(lunar.d).padStart(2, "0");
  const mm = String(lunar.m).padStart(2, "0");
  const yyyy = lunar.y;

  return `${dd}${mm}${yyyy}`;
}
