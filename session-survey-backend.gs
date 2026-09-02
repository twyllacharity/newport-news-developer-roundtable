// Community Developer Roundtable session survey routing helper.
// This file is a reference copy for the Google Apps Script web app that already powers the participant intake.
// Do NOT replace your existing doPost(e) with only this file. Instead:
// 1) Add this line at the TOP of your existing doPost(e):
//    if (e.parameter.formType === 'sessionSurvey') return handleSessionSurvey_(e);
// 2) Paste the handleSessionSurvey_ function below anywhere in the same Apps Script project.
// 3) Save and redeploy the web app as a new version, keeping the same web-app URL if your deployment method allows it.

function handleSessionSurvey_(e) {
  const SPREADSHEET_ID = '1ayf1lRWoHHcjyrJ2VXrWHyg_nh0eS_VwHzeuwWk_Uqw';
  const SHEET_NAME = 'Session Surveys';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Session Surveys sheet not found.');

  const p = e.parameter || {};
  sheet.appendRow([
    new Date(),
    p.sessionDate || '',
    p.submissionMethod || 'Digital',
    p.issueClarity || '',
    p.nextStepConfidence || '',
    p.mostImportantIssue || '',
    p.similarExperience || '',
    p.similarIssue || '',
    p.supportNeed || '',
    p.helpfulConnection || '',
    p.nextTopic || '',
    p.participateAgain || '',
    p.workOnIssue || '',
    p.issueToWorkOn || '',
    p.navigationAbility || '',
    p.notes || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ok:true,type:'sessionSurvey'}))
    .setMimeType(ContentService.MimeType.JSON);
}
