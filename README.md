# Community Developer Roundtable signup

Live page: https://twyllacharity.github.io/newport-news-developer-roundtable/

The participant intake remains open with no cap. Its existing fields and Google Apps Script endpoint are unchanged. An intake is a network profile, not proof of attendance. The next-event card offers an email RSVP for confirmed visits, preserving the existing headcount-by-email process. No email is sent automatically.

## Automatic monthly dates

`events.json` is the schedule source. `roundtable-events.js` selects the first Wednesday of each month, 5–6 p.m. in `America/New_York`, accounting for daylight saving time. An event stays visible until its end time, then the card advances to the next session. The page checks every second while open, reloads schedule data every five minutes, and reloads when the tab becomes visible. New page loads fetch the current configuration without using the browser cache. No monthly edit, deployment, or scheduled job is needed for ordinary date rollover.

Future sessions default to **Location to be announced**. Dates follow the standing schedule; locations and session-specific details are not invented or copied from an expired visit. If scripts or schedule data fail to load, the HTML contains evergreen contact instructions, not a stale date. Correct selection assumes a reasonably accurate visitor device clock.

## Special visits, cancellations, and rescheduling

Add an entry to `overrides` keyed by the original monthly date (`YYYY-MM-DD`). Include confirmed title, venue, arrival address, start/end times and visitor-facing details. A `date` value can move that session to a different day. Set `cancelled: true` to skip it. Retain old overrides as history; expired events are automatically excluded. Update only this file, and the event card, email RSVP subject, and calendar link stay aligned.

Keep default venue unspecified unless a standing location is actually confirmed. Do not reuse December's Virginia Beach address for January. Special destinations still require verified information; code cannot infer a new venue from an email.

December 2, 2026: Angela's November 5/6 host correspondence confirms the 5 p.m. start, arrival at 5827 Burton Station Road, parking between the buildings, both-building tour, meeting space and refreshments. Twylla's November 11 sent recap gives 5–6:30 p.m., but the host thread originally planned 5–6 p.m. The current page explicitly labels the end time as pending and the calendar hold as tentative. It uses 6:30 p.m. as the conservative display-expiration cutoff. Once the host confirms, update `endTime` and set `endTimeConfirmed: true`.

Project background: https://vibrantcommunities.us/news/tranquility2

Advertised pricing checked November 15, 2026: https://www.apartments.com/tranquility-at-the-lakes-ii-senior-living-virginia-beach-va/94sgwv6/

## Verification

Run `node --test roundtable-events.test.js`. Tests cover cutoff boundaries, year rollover, daylight saving time, future years, cancellations, rescheduling, safe rendering, the December arrival address and calendar output.

The separate `survey/` page and survey backend reference are unchanged. A no-CORS intake POST does not provide a readable server receipt; do not claim that a browser-only submission check verifies storage in Google Sheets. This update does not change the backend or generate test registrations.
