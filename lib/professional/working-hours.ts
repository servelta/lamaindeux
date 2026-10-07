type Slot = { weekday: number; start_time: string; end_time: string };
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/** Group consecutive weekdays only when their actual shifts are identical. */
export function workingHoursRows(slots: Slot[]) {
  const days = [1, 2, 3, 4, 5, 6, 0].map(day => ({
    day,
    times: slots.filter(slot => slot.weekday === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(slot => `${slot.start_time.slice(0, 5).replace(":", "h")} – ${slot.end_time.slice(0, 5).replace(":", "h")}`)
      .join(" / "),
  }));
  const groups: { start: number; end: number; times: string }[] = [];
  for (const { day, times } of days) {
    const previous = groups[groups.length - 1];
    if (previous && day >= 2 && day <= 5 && previous.end === day - 1 && previous.times === times) previous.end = day;
    else groups.push({ start: day, end: day, times });
  }
  return groups.map(group => ({
    label: group.start === group.end ? DAYS[group.start] : `${DAYS[group.start]} – ${DAYS[group.end]}`,
    times: group.times || "Fermé",
    closed: !group.times,
  }));
}
