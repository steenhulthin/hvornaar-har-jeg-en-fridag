(function () {
  "use strict";

  const YEAR = 2026;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const HISTOGRAM_BUCKETS = [5, 4, 3, 2, 1];

  const optionalLabels = {
    ascensionFriday: "Fredag efter Kristi Himmelfartsdag",
    christmasEve: "Juleaftensdag",
    newYearsEve: "Nytårsaftensdag",
  };

  const elements = {
    contextNote: document.querySelector("#context-note"),
    daysUntilNext: document.querySelector("#days-until-next"),
    holidaysThisWeek: document.querySelector("#holidays-this-week"),
    histogram: document.querySelector("#histogram"),
    nextHolidayName: document.querySelector("#next-holiday-name"),
    officialHolidayList: document.querySelector("#official-holiday-list"),
    optionalHolidayList: document.querySelector("#optional-holiday-list"),
    optionsForm: document.querySelector("#options-form"),
    referenceDate: document.querySelector("#reference-date"),
    remainingHolidays: document.querySelector("#remaining-holidays"),
    workdayTotal: document.querySelector("#workday-total"),
  };

  const officialHolidayEntries = buildOfficialHolidayEntries(YEAR);
  const optionalHolidayEntries = buildOptionalHolidayEntries(officialHolidayEntries);
  const allDates = buildYearDates(YEAR);

  elements.optionsForm.addEventListener("change", render);
  render();

  function render() {
    const selectedOptionalKeys = getSelectedOptionalKeys();
    const holidayMap = buildHolidayMap({
      officialHolidayEntries,
      optionalHolidayEntries,
      selectedOptionalKeys,
    });
    const lookupHolidayMap = buildLookupHolidayMap(holidayMap);
    const holidayKeys = Array.from(lookupHolidayMap.keys()).sort();
    const metrics = calculateMetrics(allDates, holidayKeys);
    const referenceDate = getReferenceDate(YEAR);

    updateKpis(referenceDate, holidayMap, lookupHolidayMap, metrics);
    updateHistogram(metrics.histogram);
    updateHolidayLists(selectedOptionalKeys);
    updateSummary(referenceDate, holidayMap, metrics);
  }

  function updateKpis(referenceDate, holidayMap, lookupHolidayMap, metrics) {
    const referenceKey = toKey(referenceDate);
    const metric = metrics.perDate.get(referenceKey);
    const nextHolidayLabel =
      metric.daysUntilNext === 0
        ? "Reference-dagen er allerede en fridag"
        : formatHolidayName(lookupHolidayMap.get(metric.nextHolidayKey));

    elements.daysUntilNext.textContent = String(metric.daysUntilNext);
    elements.holidaysThisWeek.textContent = String(
      countHolidaysInWeek(referenceDate, holidayMap)
    );
    elements.remainingHolidays.textContent = String(
      countRemainingHolidays(referenceDate, holidayMap)
    );
    elements.nextHolidayName.textContent = nextHolidayLabel;
    elements.referenceDate.textContent = buildReferenceText(referenceDate);
  }

  function updateHistogram(histogram) {
    const maxValue = Math.max(...Object.values(histogram), 1);
    elements.histogram.replaceChildren(
      ...HISTOGRAM_BUCKETS.map((days) => {
        const row = document.createElement("article");
        row.className = "histogram-row";

        const label = document.createElement("div");
        label.className = "histogram-label";
        label.textContent = `${days} dag${days === 1 ? "" : "e"}`;

        const track = document.createElement("div");
        track.className = "histogram-track";

        const fill = document.createElement("div");
        fill.className = "histogram-fill";
        fill.style.width = `${(histogram[days] / maxValue) * 100}%`;
        track.append(fill);

        const count = document.createElement("div");
        count.className = "histogram-count";
        count.textContent = String(histogram[days]);

        row.append(label, track, count);
        return row;
      })
    );
  }

  function updateHolidayLists(selectedOptionalKeys) {
    elements.officialHolidayList.replaceChildren(
      ...officialHolidayEntries.map((entry) => createDateListItem(entry))
    );

    const selectedEntries = selectedOptionalKeys.map((key) => optionalHolidayEntries[key]);
    const optionalItems =
      selectedEntries.length > 0
        ? selectedEntries.map((entry) => createDateListItem(entry))
        : [createPlainListItem("Ingen ekstra fridage er valgt.")];

    elements.optionalHolidayList.replaceChildren(...optionalItems);
  }

  function updateSummary(referenceDate, holidayMap, metrics) {
    const totalHolidays = holidayMap.size;
    const workdays = allDates.length - totalHolidays;
    const referenceYearNotice = getReferenceYearNotice(referenceDate);

    elements.workdayTotal.textContent =
      `${workdays} arbejdsdage fordelt på ${totalHolidays} fridage`;
    elements.contextNote.textContent = referenceYearNotice
      ? `${referenceYearNotice} De valgte ekstra fridage opdaterer tallene med det samme.`
      : "De valgte ekstra fridage opdaterer tallene med det samme.";

    if (metrics.unexpectedGaps.length > 0) {
      elements.contextNote.textContent +=
        " Der blev fundet et uventet hul over 5 dage i beregningen.";
    }
  }

  function calculateMetrics(dates, holidayKeys) {
    const perDate = new Map();
    const histogram = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const unexpectedGaps = [];
    let holidayIndex = 0;

    for (const date of dates) {
      const key = toKey(date);

      while (holidayIndex < holidayKeys.length && holidayKeys[holidayIndex] < key) {
        holidayIndex += 1;
      }

      const nextHolidayKey = holidayKeys[holidayIndex];
      const daysUntilNext = dayDiff(key, nextHolidayKey);

      if (daysUntilNext >= 1 && daysUntilNext <= 5) {
        histogram[daysUntilNext] += 1;
      }

      if (daysUntilNext > 5) {
        unexpectedGaps.push({ key, nextHolidayKey, daysUntilNext });
      }

      perDate.set(key, {
        daysUntilNext,
        nextHolidayKey,
      });
    }

    return { histogram, perDate, unexpectedGaps };
  }

  function countHolidaysInWeek(referenceDate, holidayMap) {
    const weekday = referenceDate.getUTCDay() === 0 ? 7 : referenceDate.getUTCDay();
    const weekStart = addDays(referenceDate, 1 - weekday);
    let count = 0;

    for (let offset = 0; offset < 7; offset += 1) {
      const current = addDays(weekStart, offset);
      if (current.getUTCFullYear() !== YEAR) {
        continue;
      }

      if (holidayMap.has(toKey(current))) {
        count += 1;
      }
    }

    return count;
  }

  function countRemainingHolidays(referenceDate, holidayMap) {
    const referenceKey = toKey(referenceDate);
    return Array.from(holidayMap.keys()).filter((key) => key >= referenceKey).length;
  }

  function buildHolidayMap({
    officialHolidayEntries,
    optionalHolidayEntries,
    selectedOptionalKeys,
  }) {
    const holidayMap = new Map();

    for (const date of buildYearDates(YEAR)) {
      if (isWeekend(date)) {
        holidayMap.set(toKey(date), {
          key: toKey(date),
          label: isSaturday(date) ? "Lørdag" : "Søndag",
        });
      }
    }

    for (const entry of officialHolidayEntries) {
      holidayMap.set(entry.key, entry);
    }

    for (const optionalKey of selectedOptionalKeys) {
      const entry = optionalHolidayEntries[optionalKey];
      holidayMap.set(entry.key, entry);
    }

    return holidayMap;
  }

  function buildLookupHolidayMap(holidayMap) {
    const lookupHolidayMap = new Map(holidayMap);

    for (const entry of buildBridgeHolidayEntries(YEAR + 1)) {
      lookupHolidayMap.set(entry.key, entry);
    }

    return lookupHolidayMap;
  }

  function buildOfficialHolidayEntries(year) {
    const easterSunday = getEasterSunday(year);
    const entries = [
      createHolidayEntry(createUtcDate(year, 0, 1), "Nytårsdag"),
      createHolidayEntry(addDays(easterSunday, -3), "Skærtorsdag"),
      createHolidayEntry(addDays(easterSunday, -2), "Langfredag"),
      createHolidayEntry(easterSunday, "Påskedag"),
      createHolidayEntry(addDays(easterSunday, 1), "2. påskedag"),
      createHolidayEntry(addDays(easterSunday, 39), "Kristi Himmelfartsdag"),
      createHolidayEntry(addDays(easterSunday, 49), "Pinsedag"),
      createHolidayEntry(addDays(easterSunday, 50), "2. pinsedag"),
      createHolidayEntry(createUtcDate(year, 11, 25), "1. juledag"),
      createHolidayEntry(createUtcDate(year, 11, 26), "2. juledag"),
    ];

    return entries.sort(compareHolidayEntries);
  }

  function buildOptionalHolidayEntries(officialEntries) {
    const ascensionDay = officialEntries.find(
      (entry) => entry.label === "Kristi Himmelfartsdag"
    );

    return {
      ascensionFriday: createHolidayEntry(
        addDays(fromKey(ascensionDay.key), 1),
        optionalLabels.ascensionFriday
      ),
      christmasEve: createHolidayEntry(
        createUtcDate(YEAR, 11, 24),
        optionalLabels.christmasEve
      ),
      newYearsEve: createHolidayEntry(
        createUtcDate(YEAR, 11, 31),
        optionalLabels.newYearsEve
      ),
    };
  }

  function buildBridgeHolidayEntries(year) {
    const entries = [
      createHolidayEntry(createUtcDate(year, 0, 1), `Nytårsdag ${year}`),
    ];

    for (const date of buildDateRange(createUtcDate(year, 0, 1), 10)) {
      if (isWeekend(date)) {
        entries.push(
          createHolidayEntry(date, isSaturday(date) ? "Lørdag" : "Søndag")
        );
      }
    }

    return dedupeHolidayEntries(entries).sort(compareHolidayEntries);
  }

  function buildYearDates(year) {
    const dates = [];
    let current = createUtcDate(year, 0, 1);

    while (current.getUTCFullYear() === year) {
      dates.push(current);
      current = addDays(current, 1);
    }

    return dates;
  }

  function buildDateRange(startDate, numberOfDays) {
    const dates = [];

    for (let offset = 0; offset < numberOfDays; offset += 1) {
      dates.push(addDays(startDate, offset));
    }

    return dates;
  }

  function getReferenceDate(year) {
    const today = new Date();
    const todayUtc = createUtcDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (todayUtc.getUTCFullYear() < year) {
      return createUtcDate(year, 0, 1);
    }

    if (todayUtc.getUTCFullYear() > year) {
      return createUtcDate(year, 11, 31);
    }

    return todayUtc;
  }

  function getReferenceYearNotice(referenceDate) {
    const today = new Date();
    const currentYear = today.getFullYear();

    if (currentYear < YEAR) {
      return "Dagens dato ligger før 2026, så nøgletallene bruger 1. januar 2026 som reference.";
    }

    if (currentYear > YEAR) {
      return "Dagens dato ligger efter 2026, så nøgletallene bruger 31. december 2026 som reference.";
    }

    return "";
  }

  function buildReferenceText(referenceDate) {
    return `Reference: ${formatDate(referenceDate)}`;
  }

  function createHolidayEntry(date, label) {
    return {
      key: toKey(date),
      label,
    };
  }

  function createDateListItem(entry) {
    return createPlainListItem(`${entry.label} · ${formatDate(fromKey(entry.key))}`);
  }

  function createPlainListItem(text) {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }

  function formatHolidayName(entry) {
    if (!entry) {
      return "Ingen fridag fundet";
    }

    return `${entry.label} · ${formatDate(fromKey(entry.key))}`;
  }

  function getSelectedOptionalKeys() {
    const formData = new FormData(elements.optionsForm);
    return Object.keys(optionalLabels).filter((key) => formData.has(key));
  }

  function compareHolidayEntries(left, right) {
    return left.key.localeCompare(right.key);
  }

  function dedupeHolidayEntries(entries) {
    return Array.from(
      entries.reduce((map, entry) => map.set(entry.key, entry), new Map()).values()
    );
  }

  function isWeekend(date) {
    return isSaturday(date) || date.getUTCDay() === 0;
  }

  function isSaturday(date) {
    return date.getUTCDay() === 6;
  }

  function dayDiff(startKey, endKey) {
    return Math.round((fromKey(endKey) - fromKey(startKey)) / DAY_MS);
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * DAY_MS);
  }

  function toKey(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function fromKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return createUtcDate(year, month - 1, day);
  }

  function createUtcDate(year, monthIndex, day) {
    return new Date(Date.UTC(year, monthIndex, day));
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("da-DK", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(date);
  }

  function getEasterSunday(year) {
    const century = Math.floor(year / 100);
    const goldenNumber = year % 19;
    const skippedLeapYears = Math.floor((century - 17) / 25);
    const correction = (century - Math.floor(century / 4) - skippedLeapYears + 19 * goldenNumber + 15) % 30;
    const leapYearCorrection =
      correction -
      Math.floor(correction / 28) *
        (1 - Math.floor(correction / 28) * Math.floor(29 / (correction + 1)) * Math.floor((21 - goldenNumber) / 11));
    const weekdayCorrection =
      (year + Math.floor(year / 4) + leapYearCorrection + 2 - century + Math.floor(century / 4)) % 7;
    const offset = leapYearCorrection - weekdayCorrection;
    const month = 3 + Math.floor((offset + 40) / 44);
    const day = offset + 28 - 31 * Math.floor(month / 4);

    return createUtcDate(year, month - 1, day);
  }
})();
