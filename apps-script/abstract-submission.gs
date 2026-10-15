/**
 * CSFAI 2026 — Abstract submission endpoint
 * =========================================
 * Receives submissions from abstract-submission.html and writes them to the
 * first sheet of the bound spreadsheet.
 *
 * Upserts on Registration ID: if a row with the same Registration ID already
 * exists it is overwritten in place, so the sheet holds at most one row per
 * registrant and people can resubmit to correct their entry. Matching is
 * trimmed and case-insensitive.
 *
 * SETUP
 *   1. Open the Google Sheet for abstract submissions.
 *   2. Extensions > Apps Script. Replace the contents with this file. Save.
 *   3. Deploy > New deployment > Web app.
 *        Execute as:     Me
 *        Who has access: Anyone
 *   4. Copy the web app URL into ABSTRACT_ENDPOINT in abstract-submission.html.
 *
 * UPDATING
 *   After editing this script you must Deploy > Manage deployments >
 *   (edit) > Version: New version > Deploy. Saving alone does NOT update the
 *   live web app.
 */

var HEADERS = [
  "Submitted At",
  "Type",
  "Registration ID",
  "Name",
  "Email",
  "Affiliation",
  "Title",
  "Abstract",
  "Co-authors",
  "Status",
  "Year",
  "Traveling From"
];

var REG_ID_COLUMN = 3; // "Registration ID" position in HEADERS

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = JSON.parse(e.postData.contents);

  ensureHeaders(sheet);

  var row = [
    d.submittedAt || new Date().toISOString(),
    d.type || "",
    d.registrationId || "",
    d.name || "",
    d.email || "",
    d.affiliation || "",
    d.title || "",
    d.abstract || "",
    d.coauthors || "",
    d.status || "",
    d.statusYear || "",
    d.travelOrigin || ""
  ];

  var updated = false;
  var regId = String(d.registrationId || "").trim().toLowerCase();

  if (regId) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var ids = sheet.getRange(2, REG_ID_COLUMN, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim().toLowerCase() === regId) {
          sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
          updated = true;
          break;
        }
      }
    }
  }

  if (!updated) {
    sheet.appendRow(row);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, updated: updated }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run-once helper: brings the header row up to date immediately, without
 * waiting for the next submission.
 *
 * In the Apps Script editor, pick "updateHeadersNow" from the function
 * dropdown and press Run. (Authorize when prompted the first time.)
 * Data rows are not touched — only row 1 is rewritten.
 */
function updateHeadersNow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  ensureHeaders(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast("Header row updated.", "Done", 5);
}

/**
 * Writes the header row if the sheet is empty, and widens it if columns were
 * added after submissions already existed (e.g. the travel-award fields).
 * Existing data rows are left untouched; older rows simply have blanks in the
 * new columns.
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }

  var width = sheet.getLastColumn();
  var current = sheet.getRange(1, 1, 1, width).getValues()[0];

  if (current.length < HEADERS.length || current[HEADERS.length - 1] !== HEADERS[HEADERS.length - 1]) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}
