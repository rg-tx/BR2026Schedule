/**
 * Bonds Ranch 2026 — Schedule webhook.
 *
 * Source of truth lives in this repo at gas/Schedule.gs and is pushed to the
 * bound Apps Script project via `clasp push`. The bound sheet is:
 *   https://docs.google.com/spreadsheets/d/1KBPmsddghMRosRAf0L31yuiZrcX6XMFboQEelxFayPU/edit
 *
 * Deploy:  Apps Script editor → Deploy → New deployment → Web App
 *            Execute as       = Me
 *            Who has access   = Anyone
 *
 * NOTE: the React app's "push" UI has been removed — nothing in this repo
 * currently calls doPost. The handler is kept so the deployed webhook still
 * works for any out-of-band caller (curl, Zapier, a future re-introduced UI).
 * Remove if you want to fully decommission write-back.
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Schedule');
    if (!sheet) sheet = ss.insertSheet('Schedule');
    const headers = ['Day','Start','End','Cat','Title','Sub','Lead','Owner'];
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (payload.rows && payload.rows.length > 0) {
      const rows = payload.rows.map(function (r) {
        return [r.day, r.start, r.end, r.cat, r.title, r.sub, r.lead || '', r.owner || ''];
      });
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, written: (payload.rows || []).length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Schedule webhook active');
}
