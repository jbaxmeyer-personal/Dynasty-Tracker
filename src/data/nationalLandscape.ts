// Fixed slots for the National Landscape form - matches the source sheet's
// "Season Review" tab, which only tracks the Power conferences and the
// major/New Year's Six-style bowls, not every conference or bowl game.
export const MAJOR_CONFERENCES = ["ACC", "Big Ten", "Big 12", "Pac-12", "SEC"] as const;

export const MAJOR_BOWLS = [
  "Rose Bowl",
  "Fiesta Bowl",
  "Sugar Bowl",
  "Orange Bowl",
  "Cotton Bowl",
  "Peach Bowl",
  "Citrus Bowl",
  "Gator Bowl",
  "Alamo Bowl",
  "Holiday Bowl",
] as const;
