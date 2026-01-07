const TZ_SEOUL = "Asia/Seoul";
const TZ_IST = "Europe/Istanbul";
const TZ_PRG = "Europe/Prague";
const TZ_BERLIN = "Europe/Berlin";

// target
const TARGET_LOCAL = { y: 2026, m: 1, d: 8, h: 8, min: 40, s: 0 };

// flight legs
const LEG1_DEP = { y: 2026, m: 1, d: 8, h: 0, min: 10, s: 0 };
const LEG1_ARR = { y: 2026, m: 1, d: 8, h: 5, min: 55, s: 0 };
const LEG2_DEP = { y: 2026, m: 1, d: 8, h: 8, min: 0, s: 0 };
const LEG2_ARR = { y: 2026, m: 1, d: 8, h: 8, min: 40, s: 0 };

function partsInTZ(date, tz) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  return Object.fromEntries(
    f.formatToParts(date).map((p) => [p.type, p.value])
  );
}

function localToUTCms(l, tz) {
  const base = Date.UTC(l.y, l.m - 1, l.d, l.h, l.min, l.s);
  let g = base;

  for (let i = 0; i < 2; i++) {
    const p = partsInTZ(new Date(g), tz);
    const asUTC = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second
    );
    const offset = asUTC - g;
    g = base - offset;
  }

  return g;
}

const T0 = localToUTCms(LEG1_DEP, TZ_SEOUL);
const T1 = localToUTCms(LEG1_ARR, TZ_IST);
const T2 = localToUTCms(LEG2_DEP, TZ_IST);
const T3 = localToUTCms(LEG2_ARR, TZ_PRG);
const TARGET_UTC = localToUTCms(TARGET_LOCAL, TZ_PRG);

function pad(n) {
  return String(n).padStart(2, "0");
}

function setClock(now, tz, tId, dId) {
  const p = partsInTZ(now, tz);
  document.getElementById(
    tId
  ).textContent = `${p.hour}:${p.minute}:${p.second}`;
  document.getElementById(dId).textContent = `${p.year}-${p.month}-${p.day}`;
}

function tick() {
  const now = new Date();
  setClock(now, TZ_SEOUL, "t-seoul", "d-seoul");
  setClock(now, TZ_IST, "t-istanbul", "d-istanbul");
  setClock(now, TZ_PRG, "t-prague", "d-prague");

  const diff = TARGET_UTC - now.getTime();
  const cd = document.getElementById("countdown");

  if (diff <= 0) {
    cd.textContent = "00:00:00";
    return;
  }

  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const dayLabel = days === 1 ? "day" : "days";

  const time = `${pad(Math.floor((s % 86400) / 3600))}:${pad(
    Math.floor((s % 3600) / 60)
  )}:${pad(s % 60)}`;

  cd.textContent = days > 0 ? `${days} ${dayLabel} · ${time}` : time;

  updateJourney(now.getTime());
}

function updateJourney(now) {
  const plane = document.getElementById("plane");
  const status = document.getElementById("journeyStatus");
  const hint = document.getElementById("journeyHint");
  const track = document.getElementById("track").getBoundingClientRect();
  const x0 = 16,
    x1 = track.width * 0.5,
    x2 = track.width - 16;

  const lerp = (a, b, p) => a + (b - a) * Math.max(0, Math.min(1, p));

  if (now < T0) {
    plane.style.left = `${x0}px`;
    status.textContent = "Not started";
    hint.textContent = "Waiting at ICN";
    return;
  }
  if (now <= T1) {
    plane.style.left = `${lerp(x0, x1, (now - T0) / (T1 - T0))}px`;
    status.textContent = "In the air";
    hint.textContent = "ICN → IST";
    return;
  }
  if (now < T2) {
    plane.style.left = `${x1}px`;
    status.textContent = "Transit";
    hint.textContent = "Transfer at IST";
    return;
  }
  if (now <= T3) {
    plane.style.left = `${lerp(x1, x2, (now - T2) / (T3 - T2))}px`;
    status.textContent = "Final leg";
    hint.textContent = "IST → PRG";
    return;
  }

  plane.style.left = `${x2}px`;
  status.textContent = "Arrived";
  hint.textContent = "Welcome to Prague";
}

tick();
setInterval(tick, 1000);
