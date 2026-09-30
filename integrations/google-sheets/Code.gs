/**
 * תנא משקאות – סנכרון הזמנות ופניות מהאתר ל-Google Sheets.
 *
 * האתר מחזיר CSV שבו מספרי הזמנה, טלפונים ותאריכים מתחילים בתו LRM (U+200E),
 * כך ש-Sheets משאיר אותם כטקסט: לא מוחק אפסים מובילים, לא הופך לתאריך ולא הופך כיוון.
 * סכומים נשארים מספרים, כך ש-SUM עובד.
 *
 * התקנה: integrations/google-sheets/README.md
 */

var CONFIG = {
  // הגיליונות שייווצרו/יתעדכנו, וסוג הייצוא באתר עבור כל אחד
  targets: [
    { sheet: 'הזמנות', type: 'orders' },
    { sheet: 'פניות לאירועים', type: 'inquiries' },
  ],
  // כמה ימים אחורה לייבא
  days: 120,
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('תנא משקאות')
    .addItem('סנכרון עכשיו', 'syncAll')
    .addSeparator()
    .addItem('הגדרה ראשונית (כתובת אתר וטוקן)', 'setup')
    .addItem('הפעלת סנכרון אוטומטי כל 10 דקות', 'installTrigger')
    .addItem('עצירת הסנכרון האוטומטי', 'removeTriggers')
    .addToUi();
}

/** שומר את כתובת האתר והטוקן ב-Script Properties (לא בקוד, ולא בגיליון). */
function setup() {
  var ui = SpreadsheetApp.getUi();
  var site = ui.prompt('כתובת האתר', 'לדוגמה: https://tene-mashkaot.vercel.app', ui.ButtonSet.OK_CANCEL);
  if (site.getSelectedButton() !== ui.Button.OK) return;
  var token = ui.prompt('טוקן ייצוא', 'הערך של SHEETS_EXPORT_TOKEN מ-Vercel', ui.ButtonSet.OK_CANCEL);
  if (token.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperties({
    SITE_URL: site.getResponseText().trim().replace(/\/+$/, ''),
    EXPORT_TOKEN: token.getResponseText().trim(),
  });
  ui.alert('נשמר. עכשיו: תנא משקאות ← סנכרון עכשיו');
}

function getSettings_() {
  var props = PropertiesService.getScriptProperties();
  var siteUrl = (props.getProperty('SITE_URL') || '').replace(/\/+$/, '');
  var token = props.getProperty('EXPORT_TOKEN');
  if (!siteUrl || !token) throw new Error('חסרה הגדרה: הריצו "תנא משקאות ← הגדרה ראשונית"');
  return { siteUrl: siteUrl, token: token };
}

function syncAll() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) return; // סנכרון אחר כבר רץ
  try {
    var settings = getSettings_();
    CONFIG.targets.forEach(function (target) {
      syncOne_(settings, target);
    });
  } finally {
    lock.releaseLock();
  }
}

function syncOne_(settings, target) {
  // מנפץ מטמון: פרמטר t משתנה בכל קריאה, כדי ש-Google או פרוקסי לא יחזירו תשובה ישנה.
  var url = settings.siteUrl + '/api/export/' + target.type + '?days=' + CONFIG.days + '&t=' + Date.now();
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + settings.token, 'Cache-Control': 'no-cache' },
    muteHttpExceptions: true,
    followRedirects: true,
  });
  var code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('הייצוא "' + target.type + '" נכשל (HTTP ' + code + '): ' + response.getContentText().slice(0, 200));
  }

  var text = response.getContentText('UTF-8').replace(/^\uFEFF/, '');
  var rows = Utilities.parseCsv(text);
  if (!rows.length) return;
  var width = rows[0].length;
  var values = rows.map(function (row, index) {
    // שורת הכותרת נשארת טקסט; בשאר השורות, מספרים "נקיים" (סכומים) נכתבים כמספרים.
    return row.map(function (value) {
      return index > 0 && /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
    });
  });

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(target.sheet) || spreadsheet.insertSheet(target.sheet);
  sheet.setRightToLeft(true);
  sheet.clearContents();
  sheet.getRange(1, 1, values.length, width).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#5a1a22').setFontColor('#f1ddb2');
  sheet
    .getRange(1, 1)
    .setNote('עודכן לאחרונה: ' + Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'dd.MM.yyyy HH:mm'));
}

function installTrigger() {
  removeTriggers();
  ScriptApp.newTrigger('syncAll').timeBased().everyMinutes(10).create();
  syncAll();
  SpreadsheetApp.getUi().alert('הסנכרון האוטומטי פעיל – כל 10 דקות.');
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncAll') ScriptApp.deleteTrigger(trigger);
  });
}
