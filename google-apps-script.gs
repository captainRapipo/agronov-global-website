/**
 * AGRONOV Global — Lead capture endpoint for the "Brand Leads" Google Sheet.
 *
 * HOW TO INSTALL
 * 1. Open your Google Sheet ("Brand Leads").
 * 2. Extensions ▸ Apps Script.
 * 3. Delete any existing code and paste THIS file in.
 * 4. (Optional) set SHEET_NAME below to the exact tab name (default: first tab).
 * 5. Deploy ▸ Manage deployments ▸ (your existing Web App) ▸ Edit ▸
 *    Version: "New version" ▸ Deploy.
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Keep the SAME /exec URL — it already lives in script.js (GOOGLE_SCRIPT_URL).
 *    (If this is a brand-new deployment, copy the /exec URL into script.js.)
 *
 * The website posts JSON (mode: 'no-cors'), so the response body is not read
 * by the browser; it is only useful when you test the URL directly.
 */

// Leave blank to use the first tab, or set to your tab's exact name.
var SHEET_NAME = '';

// The script writes (and self-heals) row 1 with these exact headers, so you do
// NOT need to set them by hand.
var HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone', 'Brand / Amazon Link', 'Sales Channels',
  'Product Count', 'Distribution Method', 'Manufacturer Rep', 'Registered Trademark',
  'Primary Goal', 'IP', 'City'
];

// Incoming JSON keys, in the same order as HEADERS (after Timestamp).
var COLUMNS = [
  'name',
  'email',
  'phone',
  'brand_link',
  'sales_channels',
  'product_count',
  'distribution_method',
  'manufacturer_rep',
  'registered_trademark',
  'primary_goal',
  'ip',
  'city'
];

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];

    // Keep the header row correct and consistent (fixes mismatched/duplicate headers).
    if (sheet.getRange(1, 1).getValue() !== HEADERS[0]) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter; // fallback for form-encoded posts
    }

    var row = [new Date()];
    for (var i = 0; i < COLUMNS.length; i++) {
      row.push(data[COLUMNS[i]] != null ? String(data[COLUMNS[i]]) : '');
    }

    var r = sheet.getLastRow() + 1;
    // Force plain-text on every column except the Timestamp so values like
    // "+1 (702) 727-6966" are stored literally and never parsed as a formula.
    sheet.getRange(r, 2, 1, row.length - 1).setNumberFormat('@');
    sheet.getRange(r, 1, 1, row.length).setValues([row]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Lets you sanity-check the deployment in a browser (should print "AGRONOV endpoint OK").
function doGet() {
  return ContentService.createTextOutput('AGRONOV endpoint OK');
}
