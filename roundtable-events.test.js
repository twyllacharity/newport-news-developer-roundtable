const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('./events.json');
const {nextEvent, renderCard, localStamp} = require('./roundtable-events.js');
const at = value => nextEvent(config, new Date(value));

test('November signup shows the December visit and host arrival address', () => {
  const e = at('2026-11-15T19:00:00Z');
  assert.equal(e.date, '2026-12-02');
  assert.equal(e.address, '5827 Burton Station Road, Virginia Beach, VA');
  assert.equal(e.endTimeConfirmed, false);
  const html = renderCard(e, config);
  assert.match(html, /Email Twylla to RSVP/);
  assert.match(html, /final end time is being confirmed/);
  assert.match(html, /dates=20261202T170000%2F20261202T183000/);
  assert.match(html, /ctz=America%2FNew_York/);
});

test('keeps this meeting through its final second and rolls at the end', () => {
  assert.equal(at('2026-12-02T23:29:59Z').date, '2026-12-02');
  const e = at('2026-12-02T23:30:00Z');
  assert.equal(e.date, '2027-01-06');
  assert.equal(e.venue, 'Location to be announced');
  const html = renderCard(e, config);
  assert.doesNotMatch(html, /Tranquility|Burton|October 7|Email Twylla to RSVP/);
  assert.match(html, /January 6, 2027/);
});

test('Eastern cutoff follows daylight saving time independently of browser timezone', () => {
  assert.equal(localStamp(new Date('2027-06-02T21:59:59Z')), '2027-06-02T17:59:59');
  assert.equal(at('2027-06-02T21:59:59Z').date, '2027-06-02');
  assert.equal(at('2027-06-02T22:00:00Z').date, '2027-07-07');
  assert.equal(at('2027-02-03T22:59:59Z').date, '2027-02-03');
  assert.equal(at('2027-02-03T23:00:00Z').date, '2027-03-03');
});

test('cancellation skips one session and moved dates keep their override', () => {
  const c = structuredClone(config);
  c.overrides['2026-12-02'].cancelled = true;
  assert.equal(nextEvent(c, new Date('2026-11-15T19:00:00Z')).date, '2027-01-06');
  c.overrides['2026-12-02'].cancelled = false;
  c.overrides['2026-12-02'].date = '2027-01-08';
  const e = nextEvent(c, new Date('2027-01-07T19:00:00Z'));
  assert.equal(e.date, '2027-01-08');
  assert.equal(e.venue, 'Tranquility at the Lakes II');
});

test('works beyond the configured year without a monthly edit', () => {
  assert.equal(at('2028-12-31T23:00:00Z').date, '2029-01-03');
  assert.equal(at('2029-01-04T23:00:00Z').date, '2029-02-07');
});

test('renders supplied copy as text and restricts source links to HTTPS', () => {
  const e = {...at('2026-11-15T19:00:00Z'), title:'<img src=x onerror=alert(1)>', projectUrl:'javascript:alert(1)'};
  const html = renderCard(e, config);
  assert.doesNotMatch(html, /<img|href="javascript:/);
  assert.match(html, /&lt;img/);
});
