function formatHousingSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Housing');
  if (!sheet) return;

  var lastRow = sheet.getLastRow();

  // ── Column widths ──────────────────────────────────────────
  sheet.setColumnWidth(1, 220);  // A
  sheet.setColumnWidth(2, 310);  // B
  sheet.setColumnWidth(3, 320);  // C

  // ── Default: all rows ─ wrap text, font, size ───────────────
  var allRange = sheet.getRange(1, 1, lastRow, 3);
  allRange.setFontFamily('Roboto');
  allRange.setFontSize(10);
  allRange.setWrap(true);
  allRange.setVerticalAlignment('middle');

  // ── Borders on data area ────────────────────────────────────
  allRange.setBorder(true, true, true, true, true, true,
    '#d0d0d0', SpreadsheetApp.BorderStyle.SOLID);

  // ── Color palette ───────────────────────────────────────────
  var DARK_RED    = '#8B1A1A';  // main title bg
  var MED_RED     = '#B03A2E';  // section header bg
  var LIGHT_RED   = '#FADBD8';  // sub-header / column header bg
  var CREAM       = '#FEF9F0';  // alternating light row
  var WHITE       = '#FFFFFF';
  var TOTAL_BG    = '#F5CBA7';  // totals row highlight
  var WHITE_TEXT  = '#FFFFFF';
  var DARK_TEXT   = '#1a1a1a';

  // Helper: style a section header row (spans A:C)
  function sectionHeader(row, bg, fgColor, fontSize) {
    var r = sheet.getRange(row, 1, 1, 3);
    r.merge();
    r.setBackground(bg);
    r.setFontColor(fgColor || WHITE_TEXT);
    r.setFontSize(fontSize || 11);
    r.setFontWeight('bold');
    r.setHorizontalAlignment('left');
    r.setBorder(true, true, true, true, false, false,
      '#8B1A1A', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }

  // Helper: style a column-header row
  function colHeader(row) {
    var r = sheet.getRange(row, 1, 1, 3);
    r.setBackground(LIGHT_RED);
    r.setFontColor(DARK_TEXT);
    r.setFontWeight('bold');
    r.setFontSize(10);
    r.setHorizontalAlignment('center');
  }

  // Helper: alternate row shading for a range of data rows
  function alternateRows(startRow, endRow) {
    for (var i = startRow; i <= endRow; i++) {
      var bg = (i % 2 === 0) ? CREAM : WHITE;
      sheet.getRange(i, 1, 1, 3).setBackground(bg);
    }
  }

  // Helper: bold col A for label rows
  function boldColA(startRow, endRow) {
    sheet.getRange(startRow, 1, endRow - startRow + 1, 1).setFontWeight('bold');
  }

  // ── ROW 1: Main Title ────────────────────────────────────────
  sectionHeader(1, DARK_RED, WHITE_TEXT, 14);
  sheet.setRowHeight(1, 40);
  sheet.getRange(1,1).setHorizontalAlignment('center');
  sheet.getRange(1,1).setVerticalAlignment('middle');

  // ── ROW 2: Airbnb link ───────────────────────────────────────
  sheet.getRange(2, 1, 1, 3).setBackground('#FDF2E9');
  sheet.getRange(2, 1).setFontWeight('bold');

  // ── ROW 3: Rating ────────────────────────────────────────────
  sheet.getRange(3, 1, 1, 3).setBackground('#FDF2E9');
  sheet.getRange(3, 1).setFontWeight('bold');

  // ── ROW 4: blank spacer ──────────────────────────────────────
  sheet.getRange(4, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(4, 8);

  // ── ROW 5: LOCATION & OVERVIEW header ───────────────────────
  sectionHeader(5, MED_RED);
  sheet.setRowHeight(5, 28);

  // Rows 6–16: location data
  alternateRows(6, 16);
  boldColA(6, 16);

  // ── ROW 17: blank spacer ─────────────────────────────────────
  sheet.getRange(17, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(17, 8);

  // ── ROW 18: STRUCTURES header ────────────────────────────────
  sectionHeader(18, MED_RED);
  sheet.setRowHeight(18, 28);

  // Row 19: column headers
  colHeader(19);

  // Rows 20–25: structure data
  alternateRows(20, 24);
  boldColA(20, 24);

  // Row 25: TOTAL row
  sheet.getRange(25, 1, 1, 3).setBackground(TOTAL_BG);
  sheet.getRange(25, 1).setFontWeight('bold');
  sheet.getRange(25, 2).setFontWeight('bold');

  // ── ROW 26: blank spacer ─────────────────────────────────────
  sheet.getRange(26, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(26, 8);

  // ── ROW 27: MAIN LODGE header ────────────────────────────────
  sectionHeader(27, MED_RED);
  sheet.setRowHeight(27, 28);

  // Row 28: column headers
  colHeader(28);

  // Rows 29–32: lodge room data
  alternateRows(29, 32);
  boldColA(29, 32);

  // ── ROW 33: blank spacer ─────────────────────────────────────
  sheet.getRange(33, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(33, 8);

  // ── ROW 34: LIBERTY HOUSE header ─────────────────────────────
  sectionHeader(34, MED_RED);
  sheet.setRowHeight(34, 28);

  // Row 35: column headers
  colHeader(35);

  // Rows 36–40: liberty house data
  alternateRows(36, 40);
  boldColA(36, 40);

  // ── ROW 41: blank spacer ─────────────────────────────────────
  sheet.getRange(41, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(41, 8);

  // ── ROW 42: RECREATIONAL AMENITIES header ────────────────────
  sectionHeader(42, MED_RED);
  sheet.setRowHeight(42, 28);

  // Row 43: column headers
  colHeader(43);

  // Rows 44–57: amenities data
  alternateRows(44, 57);
  boldColA(44, 57);

  // ── ROW 58: blank spacer ─────────────────────────────────────
  sheet.getRange(58, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(58, 8);

  // ── ROW 59: KEY AMENITIES header ─────────────────────────────
  sectionHeader(59, MED_RED);
  sheet.setRowHeight(59, 28);

  // Row 60: column headers
  colHeader(60);

  // Rows 61–69: key amenities data
  alternateRows(61, 69);
  boldColA(61, 69);

  // ── ROW 70: blank spacer ─────────────────────────────────────
  sheet.getRange(70, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(70, 8);

  // ── ROW 71: HOUSE RULES header ───────────────────────────────
  sectionHeader(71, MED_RED);
  sheet.setRowHeight(71, 28);

  // Row 72: column headers
  colHeader(72);

  // Rows 73–77: house rules data
  alternateRows(73, 77);
  boldColA(73, 77);

  // ── ROW 78: blank spacer ─────────────────────────────────────
  sheet.getRange(78, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(78, 8);

  // ── ROW 79: SAFETY NOTES header ──────────────────────────────
  sectionHeader(79, '#C0392B');
  sheet.setRowHeight(79, 28);

  // Rows 80–82: safety notes
  for (var sr = 80; sr <= 82; sr++) {
    sheet.getRange(sr, 1, 1, 3).setBackground('#FDEDEC');
    sheet.getRange(sr, 1).setFontWeight('bold');
  }

  // ── ROW 83: blank spacer ─────────────────────────────────────
  sheet.getRange(83, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(83, 8);

  // ── ROW 84: GUEST REVIEWS header ─────────────────────────────
  sectionHeader(84, MED_RED);
  sheet.setRowHeight(84, 28);

  // Row 85: column headers
  colHeader(85);

  // Rows 86–92: reviews data
  alternateRows(86, 92);
  boldColA(86, 92);

  // ── ROW 93: blank spacer ─────────────────────────────────────
  sheet.getRange(93, 1, 1, 3).setBackground(WHITE);
  sheet.setRowHeight(93, 8);

  // ── ROW 94: LOCATION header ───────────────────────────────────
  sectionHeader(94, MED_RED);
  sheet.setRowHeight(94, 28);

  // Rows 95–98: location data
  alternateRows(95, 98);
  boldColA(95, 98);

  // ── Freeze row 1 ─────────────────────────────────────────────
  sheet.setFrozenRows(1);

  // ── Auto-resize col A (slight adjustment) ────────────────────
  // Already set widths above, just flush
  SpreadsheetApp.flush();
  Logger.log('Housing sheet formatted successfully!');
}