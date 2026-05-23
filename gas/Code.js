/**
 * Apps Script Web App entry point.
 *
 * Reads the "Schedule" tab from the canonical Bonds Ranch 2026 spreadsheet
 * (same sheet the React/Vite app reads from via CSV) and renders Index.html
 * with the rows injected as `dynamicSchedule`.
 *
 * Sheet of record: https://docs.google.com/spreadsheets/d/1KBPmsddghMRosRAf0L31yuiZrcX6XMFboQEelxFayPU/edit
 */

var SHEET_ID = '1KBPmsddghMRosRAf0L31yuiZrcX6XMFboQEelxFayPU';

function doGet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Schedule');
  const data = sheet.getDataRange().getValues();
  const scheduleArray = [];

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    if (!row[0] && row[0] !== 0) continue;

    scheduleArray.push({
      day:       Number(row[0]),
      start:     String(row[1]),
      end:       String(row[2]),
      cat:       String(row[3]),
      title:     String(row[4]),
      sub:       String(row[5]),
      lead:      row[6] ? String(row[6]) : null,
      owner:     row[7] ? String(row[7]) : null
    });
  }

  const template = HtmlService.createTemplateFromFile('Index');
  template.dynamicSchedule = JSON.stringify(scheduleArray);

  return template.evaluate()
    .setTitle('BR High Adventure · Daily Schedule')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
