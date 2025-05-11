const airtableToken = "patZ3j588Sj2vd4xd.27acf31621f89399b2bcacf564b3d81f7a036ab9331221b18ff3e5a2b885ae5b"; // 👈 вставь свой PAT
const baseId = "appwnWtPWAfhsQpDs";           // 👈 ID базы
const tableName = "Регистрации";

function showMessage(text, success) {
  const el = document.getElementById("message");
  el.textContent = text;
  el.className = success ? "success" : "error";
}

function parseRegIdFromUrl(url) {
  const match = url.match(/[?&]reg_id=([A-Za-z0-9\-]+)/);
  return match ? match[1] : null;
}

async function updateRecordWithRegId(regId) {
  try {
    // 1. Найдём запись по фильтру
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(`{ID} = "${regId}"`)}&maxRecords=1`;

    const searchRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${airtableToken}`
      }
    });

    const data = await searchRes.json();

    if (!data.records || data.records.length === 0) {
      showMessage("Запись не найдена", false);
      return;
    }

    const recordId = data.records[0].id;

    // 2. Обновим поле
    const updateUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${airtableToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          "Отсканирован QR": true
        }
      })
    });

    if (updateRes.ok) {
      showMessage("✅ Успешно отмечено", true);
    } else {
      showMessage("Ошибка обновления", false);
      console.error(await updateRes.text());
    }
  } catch (err) {
    console.error(err);
    showMessage("Ошибка соединения", false);
  }
}

function onScanSuccess(decodedText) {
  const regId = parseRegIdFromUrl(decodedText);
  if (!regId) {
    showMessage("QR не содержит reg_id", false);
    return;
  }

  updateRecordWithRegId(regId);
}

// Запуск сканера
const qrScanner = new Html5Qrcode("reader");
qrScanner.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  onScanSuccess
);
