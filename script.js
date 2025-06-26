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
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(`AND({ID покупателя} = "${userId}", OR({Отсканирован QR} = '', {Отсканирован QR} = 0, NOT({Отсканирован QR})))`)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${airtableToken}` }
  });
  const data = await res.json();
  if (!data.records || data.records.length === 0) return [];
  return data.records.map(r => r.fields["ID товара"]);
}

async function fetchProductNamesByIds(productIds) {
  if (!productIds.length) return [];
  const tableName = "Мерч";
  // Формируем формулу поиска по нескольким ID
  const orConditions = productIds.map(id => `({ID} = "${id}")`).join(",");
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=OR(${orConditions})`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${airtableToken}` }
  });
  const data = await res.json();
  if (!data.records || data.records.length === 0) return [];
  // Возвращаем массив названий в том же порядке, что и productIds
  const idToName = {};
  data.records.forEach(r => {
    idToName[r.fields["ID"]] = r.fields["Название"] || r.fields["ID"];
  });
  return productIds.map(id => idToName[id] || id);
}

function onScanSuccess(decodedText) {
  processQr(decodedText);
}

async function processQr(qrLink) {
  try {
    const userId = await fetchUserIdByQrLink(qrLink);
    if (!userId) {
      showPopupMessage("не удалось отсканировать QR код", false);
      renderProducts([]);
      return;
    }
    const productIds = await fetchPurchasesByUserId(userId);
    if (productIds.length === 0) {
      showPopupMessage("не удалось отсканировать QR код", false);
      renderProducts([]);
      return;
    }
    const productNames = await fetchProductNamesByIds(productIds);
    renderProducts(productNames);
    showPopupMessage("QR отсканировано", true);
  } catch (err) {
    console.error(err);
    showPopupMessage("не удалось отсканировать QR код", false);
    renderProducts([]);
  }
}

function renderProducts(products) {
  const list = document.getElementById("products-list");
  if (!list) return;
  list.innerHTML = "";
  if (products.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Нет доступных товаров";
    li.style.color = "#888";
    list.appendChild(li);
    return;
  }
  products.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    li.classList.add("product-item");
    list.appendChild(li);
  });
}

const qrScanner = new Html5Qrcode("reader");
qrScanner.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  onScanSuccess
);

// --- Кнопки управления списком ---
document.addEventListener("DOMContentLoaded", () => {
  const clearBtn = document.getElementById("clear-list-btn");
  const checkAllBtn = document.getElementById("check-all-btn");
  const list = document.getElementById("products-list");

  if (clearBtn) {
    clearBtn.onclick = () => {
      if (list) list.innerHTML = "";
    };
  }

  if (checkAllBtn) {
    checkAllBtn.onclick = () => {
      if (!list) return;
      const items = list.querySelectorAll("li.product-item");
      items.forEach(li => {
        if (!li.classList.contains("checked")) {
          li.classList.add("checked");
          li.innerHTML = '✔️ ' + li.textContent;
        }
      });
    };
  }
});

// --- Стили для отмеченных товаров ---
const style = document.createElement('style');
style.innerHTML = `.product-item.checked { color: #4CAF50; font-weight: 500; }`;
document.head.appendChild(style);
