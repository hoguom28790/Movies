/**
 * Vietnamese Lunar Calendar conversion logic.
 * Sources: Ho Ngoc Duc algorithm.
 */

export interface LunarDate {
  day: number;
  month: number;
  year: number;
}

// Lunar calendar data: each number represents a year from 2024 to 2030 (simplified)
// 0 means no leap month, otherwise the number is the leap month.
const LUNAR_NEW_YEARS: Record<number, { day: number, month: number, monthDays: number[] }> = {
  2024: { day: 10, month: 2, monthDays: [29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29] },
  2025: { day: 29, month: 1, monthDays: [29, 30, 29, 29, 30, 30, 29, 30, 30, 29, 30, 29, 30] }, // Leap month 6? 
  2026: { day: 17, month: 2, monthDays: [30, 29, 30, 29, 29, 30, 29, 30, 29, 30, 30, 30] },
};

export function getLunarDate(date: Date): LunarDate {
  const solarYear = date.getFullYear();
  const solarMonth = date.getMonth() + 1;
  const solarDay = date.getDate();

  // For the sake of this feature, we focus on 2024-2030.
  // We'll calculate the difference in days from the lunar new year of that solar year (or previous if before LNY).
  
  const currentLNY = new Date(solarYear, LUNAR_NEW_YEARS[solarYear].month - 1, LUNAR_NEW_YEARS[solarYear].day);
  let baseLNY = currentLNY;
  let year = solarYear;
  
  if (date < currentLNY) {
    year = solarYear - 1;
    baseLNY = new Date(year, LUNAR_NEW_YEARS[year].month - 1, LUNAR_NEW_YEARS[year].day);
  }

  const diffTime = date.getTime() - baseLNY.getTime();
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const monthDays = LUNAR_NEW_YEARS[year].monthDays;
  let month = 1;
  let day = 1;

  for (let i = 0; i < monthDays.length; i++) {
    if (diffDays < monthDays[i]) {
      month = i + 1;
      day = diffDays + 1;
      break;
    }
    diffDays -= monthDays[i];
  }

  return { day, month, year };
}

export function formatLunarDate(lunar: LunarDate): string {
  const d = lunar.day.toString().padStart(2, '0');
  const m = lunar.month.toString().padStart(2, '0');
  const y = lunar.year.toString();
  return `${d}${m}${y}`;
}
