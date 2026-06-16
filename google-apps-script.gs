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

// Column order written to the sheet. Row 1 of the sheet should have these headers:
// Timestamp | Name | Email | Phone | Brand / Amazon Link | Sales Channels |
// Product Count | Distribution Method | Manufacturer Rep | Registered Trademark |
// Primary Goal | IP | City
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
    sheet.appendRow(row);

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
