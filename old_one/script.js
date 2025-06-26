const airtableToken = "patZ3j588Sj2vd4xd.27acf31621f89399b2bcacf564b3d81f7a036ab9331221b18ff3e5a2b885ae5b"; // 👈 вставь свой токен
const baseId = "appwnWtPWAfhsQpDs";           // 👈 вставь ID базы
const tableName = "Регистрации";

function showPopupMessage(text, isSuccess) {
  const popup = document.createElement("div");
  popup.className = `popup-message ${isSuccess ? "success" : "error"}`;
  popup.textContent = text;

  document.body.appendChild(popup);

  // Плавно исчезает через 3 секунды
  setTimeout(() => {
    popup.classList.add("hide");
    setTimeout(() => popup.remove(), 500); // Удаление после анимации
  }, 3000);
}

function parseRegIdFromUrl(url) {
  const match = url.match(/[?&]reg_id=([A-Za-z0-9\-]+)/);
  return match ? match[1] : null;
}

async function updateRecordWithRegId(regId) {
  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(`{ID} = "${regId}"`)}&maxRecords=1`;

    const searchRes = await fetch(url, {
      headers: { Authorization: `Bearer ${airtableToken}` }
    });

    const data = await searchRes.json();

    if (!data.records || data.records.length === 0) {
      showPopupMessage("Запись не найдена", false);
      return;
    }

    const recordId = data.records[0].id;

    const updateUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${airtableToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: { "Отсканирован QR": true }
      })
    });

    if (updateRes.ok) {
      showPopupMessage("✅ Успешно отмечено", true);
    } else {
      showPopupMessage("Ошибка обновления", false);
      console.error(await updateRes.text());
    }
  } catch (err) {
    console.error(err);
    showPopupMessage("Ошибка соединения", false);
  }
}

function onScanSuccess(decodedText) {
  const regId = parseRegIdFromUrl(decodedText);
  if (!regId) {
    showPopupMessage("QR не содержит reg_id", false);
    return;
  }

  updateRecordWithRegId(regId);
}

const qrScanner = new Html5Qrcode("reader");
qrScanner.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  onScanSuccess
);
