/**
 * Mi wishlist: guarda qué regalos ya apartaron.
 * No guarda nombres: solo el id del regalo y un código secreto
 * del celular que lo apartó (para que esa persona pueda cancelarlo).
 */
const PROPS = PropertiesService.getScriptProperties();

function readClaims_() {
  return JSON.parse(PROPS.getProperty('claims') || '{}');
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = p.a || 'list';
  const id = String(p.id || '');
  const token = String(p.t || '');
  let result = { ok: true };

  if (action === 'claim' || action === 'release') {
    if (!/^[\w-]{1,40}$/.test(id) || !/^[\w-]{8,64}$/.test(token)) {
      result = { ok: false, error: 'bad_request' };
    } else {
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        const claims = readClaims_();
        if (action === 'claim') {
          if (claims[id]) {
            result = { ok: false, taken: true };
          } else {
            claims[id] = { t: token, at: Date.now() };
            PROPS.setProperty('claims', JSON.stringify(claims));
          }
        } else {
          if (claims[id] && claims[id].t === token) {
            delete claims[id];
            PROPS.setProperty('claims', JSON.stringify(claims));
          } else {
            result = { ok: false };
          }
        }
      } finally {
        lock.releaseLock();
      }
    }
  }

  result.claimed = Object.keys(readClaims_());
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
