const airtableToken = "patZ3j588Sj2vd4xd.27acf31621f89399b2bcacf564b3d81f7a036ab9331221b18ff3e5a2b885ae5b"; // 👈 вставь свой токен
const baseId = "appwnWtPWAfhsQpDs";           // 👈 вставь ID базы

function showPopupMessage(text, isSuccess) {
  const popup = document.createElement("div");
  popup.className = `popup-message ${isSuccess ? "success" : "error"}`;
  popup.textContent = text;
  document.body.appendChild(popup);
  setTimeout(() => {
    popup.classList.add("hide");
    setTimeout(() => popup.remove(), 500);
  }, 3000);
}

async function fetchUserIdByQrLink(qrLink) {
  const tableName = "Пользователи";
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(`{Ссылка для QR} = "${qrLink}"`)}&maxRecords=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${airtableToken}` }
  });
  const data = await res.json();
  if (!data.records || data.records.length === 0) return null;
  return data.records[0].fields["ID"];
}

async function fetchPurchasesByUserId(userId) {
  const tableName = "Покупки";
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(`{ID покупателя} = "${userId}"`)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${airtableToken}` }
  });
  const data = await res.json();
  if (!data.records || data.records.length === 0) return [];
  return data.records.map(r => r.fields["ID товара"]);
}

function onScanSuccess(decodedText) {
  processQr(decodedText);
}

async function processQr(qrLink) {
  try {
    // 1. Найти пользователя по ссылке
    const userId = await fetchUserIdByQrLink(qrLink);
    if (!userId) {
      showPopupMessage("Пользователь не найден", false);
      return;
    }
    // 2. Найти покупки по ID пользователя
    const purchases = await fetchPurchasesByUserId(userId);
    if (purchases.length === 0) {
      showPopupMessage("Покупки не найдены", false);
      return;
    }
    // 3. Вывести товары
    const messageElem = document.getElementById("message");
    if (messageElem) {
      messageElem.textContent = `ID товара: ${purchases.join(", ")}`;
    }
    showPopupMessage(`ID товара: ${purchases.join(", ")}`, true);
  } catch (err) {
    console.error(err);
    showPopupMessage("Ошибка соединения", false);
  }
}

const qrScanner = new Html5Qrcode("reader");
qrScanner.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  onScanSuccess
);
