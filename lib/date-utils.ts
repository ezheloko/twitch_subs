// Date.setMonth() overflows into the next month when the current day doesn't
// exist in the target month (e.g. Mar 31 - 1 month rolls into Mar 3 instead
// of Feb 28). This clamps the day to the target month's last valid day.
export function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const day = result.getDate()

  result.setDate(1)
  result.setMonth(result.getMonth() - months)

  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate()
  result.setDate(Math.min(day, lastDayOfTargetMonth))

  return result
}

export function oneMonthAgo(from: Date = new Date()): Date {
  return subtractMonths(from, 1)
}
