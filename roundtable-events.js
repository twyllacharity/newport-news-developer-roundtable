(function (root) {
  'use strict';
  const ZONE = 'America/New_York';
  function easternParts(value) {
    return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(value).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  }
  function localStamp(value) {
    const p = easternParts(value);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  }
  function firstWeekday(year, month, weekday) {
    const first = new Date(Date.UTC(year, month, 1));
    first.setUTCDate(1 + (weekday - first.getUTCDay() + 7) % 7);
    return first.toISOString().slice(0, 10);
  }
  function eventFor(config, date) {
    return Object.assign({date, title: 'Community Developer Roundtable', confirmed: false,
      endTimeConfirmed: true}, config.recurrence, config.overrides[date] || {});
  }
  function nextEvent(config, now = new Date()) {
    const p = easternParts(now), dates = new Set(Object.keys(config.overrides));
    // Include every override so a moved meeting can cross a month boundary.
    for (let i = 0; i < 15; i++) {
      dates.add(firstWeekday(Number(p.year), Number(p.month) - 1 + i, config.recurrence.weekday));
    }
    return [...dates].map(d => eventFor(config, d))
      .filter(e => !e.cancelled && `${e.date}T${e.endTime}:00` > localStamp(now))
      .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))[0];
  }
  function dateLabel(date) {
    return new Intl.DateTimeFormat('en-US', {timeZone: 'UTC', weekday: 'long',
      month: 'long', day: 'numeric', year: 'numeric'}).format(new Date(`${date}T12:00:00Z`));
  }
  function timeLabel(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  }
  function safeUrl(value) {
    try {const url = new URL(value); return url.protocol === 'https:' ? escapeHtml(url.href) : '#';}
    catch (_) {return '#';}
  }
  function renderCard(e, config) {
    const h = escapeHtml;
    const when = `${dateLabel(e.date)} | ${timeLabel(e.startTime)}${e.endTimeConfirmed ? ' to ' + timeLabel(e.endTime) : ''} Eastern`;
    const subject = `Roundtable RSVP: ${e.date} — ${e.venue}`;
    const email = `mailto:${encodeURIComponent(config.contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Hi Twylla,\n\nI plan to attend the roundtable on ' + dateLabel(e.date) + '.\n\nName:\nNumber attending:\n\nThank you!')}`;
    const calendar = new URL('https://calendar.google.com/calendar/render');
    calendar.search = new URLSearchParams({action:'TEMPLATE', text:e.title,
      dates:`${e.date.replaceAll('-','')}T${e.startTime.replace(':','')}00/${e.date.replaceAll('-','')}T${e.endTime.replace(':','')}00`,
      ctz:ZONE, location:e.address ? `${e.venue}, ${e.address}` : e.venue,
      details:`${e.description}\n${e.timeNote || ''}\n${e.parking || ''}\nCheck current details: https://twyllacharity.github.io/newport-news-developer-roundtable/`}).toString();
    return `<p class="event-kicker">${e.confirmed ? 'Next gathering · In person' : 'Next scheduled roundtable'}</p>
      <h2 id="next-roundtable">${h(e.title)}</h2>
      <p class="event-date"><strong>${h(when)}</strong></p>
      <p><strong>${h(e.venue)}</strong>${e.address ? '<br>' + h(e.address) : ''}</p>
      ${e.timeNote ? `<p class="event-note">${h(e.timeNote)}</p>` : ''}
      ${e.parking ? `<p><strong>Arrival and parking:</strong> ${h(e.parking)}</p>` : ''}
      <p>${h(e.description)}</p>
      ${e.confirmed ? `<div class="event-actions"><a class="event-button" href="${h(email)}">Email Twylla to RSVP</a><a href="${h(calendar.href)}" target="_blank" rel="noopener">${e.endTimeConfirmed ? 'Add to calendar' : 'Save a tentative calendar hold'}</a></div>
      <p class="event-note">The RSVP button opens an email for you to send. Already in the network? Just RSVP. New here? You can also complete the participant intake below.</p>` : '<p class="event-note">The monthly date follows our regular schedule. Please check back for confirmed location and session details before making travel plans. You can join the network below at any time.</p>'}
      ${e.why ? `<details><summary>Why we are visiting this development</summary><p>${h(e.why)}</p><ul>${e.highlights.map(x => '<li>' + h(x) + '</li>').join('')}</ul><p>${h(e.pricingNote)}</p><p><a href="${safeUrl(e.projectUrl)}" target="_blank" rel="noopener">Read the project background</a> · <a href="${safeUrl(e.pricingUrl)}" target="_blank" rel="noopener">View the housing listing and pricing</a></p></details>` : ''}`;
  }
  const api = {nextEvent, firstWeekday, eventFor, dateLabel, renderCard, localStamp};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  root.RoundtableEvents = api;
  let config, signature;
  function refresh() {
    if (!config) return;
    const event = nextEvent(config);
    const html = renderCard(event, config);
    if (html !== signature) {
      document.getElementById('event-details').innerHTML = html;
      signature = html;
    }
  }
  async function loadEvents() {
    try {
      const response = await fetch('events.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Schedule unavailable');
      const nextConfig = await response.json();
      if (nextConfig.timezone !== ZONE || !nextConfig.recurrence || !nextConfig.overrides) throw new Error('Invalid schedule');
      config = nextConfig;
      refresh();
    } catch (_) {
      // Evergreen HTML remains visible if the data cannot load. Never fall back to an old date.
      refresh();
    }
  }
  loadEvents();
  setInterval(refresh, 1000); // Roll over at the ending time, even in an open tab.
  setInterval(loadEvents, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {if (!document.hidden) loadEvents();});
})(typeof window !== 'undefined' ? window : globalThis);
