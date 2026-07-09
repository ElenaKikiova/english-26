function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  appendScore(sheet, e.parameter);

  const callback = e.parameter.callback;
  if (callback && /^[a-zA-Z0-9_]+$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '({"success":true})')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput('ok');
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  appendScore(sheet, e.parameter);
  return ContentService.createTextOutput('ok');
}

function appendScore(sheet, data) {
  ensureHeaders(sheet);

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.player || '',
    data.game || '',
    data.gameTitle || '',
    Number(data.score) || 0,
    Number(data.totalWords) || 0,
    Number(data.firstTry) || 0,
    Number(data.secondTry) || 0,
    Number(data.failed) || 0,
  ]);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow([
    'Timestamp',
    'Player',
    'Game ID',
    'Game Title',
    'Score',
    'Total Words',
    '1st Try',
    '2nd Try',
    'Failed',
  ]);
}

function testAppend() {
  appendScore(
    SpreadsheetApp.getActiveSpreadsheet().getSheets()[0],
    {
      player: 'Test',
      game: 'game-1',
      gameTitle: 'Test',
      score: 25,
      totalWords: 2,
      firstTry: 1,
      secondTry: 1,
      failed: 0,
    }
  );
}
