const serverURL = "https://script.google.com/macros/s/AKfycbydsIiYanv4P-h5AxMDNqisPW2lJ_wr1ysMHb0uTthHioX_Q5TaxdofhlbWWQjOptRIeA/exec";
let currentUser = null;
let balanceInterval = null;

// --- Notification
function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// --- Load User Info (Στραγάλια)
async function loadUserInfo() {
  if (!currentUser) return;
  try {
    const res = await fetch(`${serverURL}?action=getBalanceAndTitle&username=${encodeURIComponent(currentUser.username)}&password=${encodeURIComponent(currentUser.password)}`);
    const data = await res.json();
    document.getElementById("userInfo").innerText = `Στραγάλια: ${parseInt(data.balance) || 0}`;
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
}

// --- Load Messages
function loadMessages() {
  if (!currentUser) return;
  fetch(`${serverURL}?username=${currentUser.username}&password=${currentUser.password}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("messages");
      container.innerHTML = "";
      if (!Array.isArray(data)) {
        container.innerHTML = `<p style="text-align:center; color:gray;">Please login to send and view messages.</p>`;
        return;
      }
      data.forEach(row => {
        let time = new Date(row[0]).toLocaleString(); // ημερομηνία + ώρα
        container.innerHTML += `<div class="message"><b>${row[1]}</b>: ${row[2]} <small>${time}</small> <span class="delete-circle" onclick="deleteMessage('${row[3]}')">🔴</span></div>`;
      });
      container.scrollTop = container.scrollHeight;
    });
}

// --- Send Message
function sendMessage() {
  if (!currentUser) return;
  const message = document.getElementById("message").value;
  if (!message) {
    showNotification("Παρακαλώ εισάγετε μήνυμα");
    return;
  }

  fetch(serverURL, {
    method: "POST",
    body: JSON.stringify({
      username: currentUser.username,
      password: currentUser.password,
      message
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      document.getElementById("message").value = "";
      loadMessages();
      loadUserInfo(); // ενημέρωση Στραγαλιών μετά το μήνυμα
    } else {
      showNotification("Λάθος στοιχεία!");
    }
  });
}

// --- Delete Message
function deleteMessage(id) {
  if (!currentUser) return;
  fetch(serverURL, {
    method: "POST",
    body: JSON.stringify({
      action:"deleteMessage",
      username: currentUser.username,
      password: currentUser.password,
      id
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      showNotification("Μήνυμα διαγράφηκε");
      loadMessages();
    } else {
      showNotification("Δεν μπορεί να διαγραφεί.");
    }
  });
}

// --- Login
function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  fetch(serverURL, {
    method: "POST",
    body: JSON.stringify({action:"login", username, password})
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      currentUser = {username, password};
      document.getElementById("login").style.display = "none";
      document.getElementById("chat").style.display = "flex";
      loadMessages();
      loadUserInfo(); // φορτώνει τα Στραγάλια μόλις κάνει login

      if(balanceInterval) clearInterval(balanceInterval);
      balanceInterval = setInterval(loadUserInfo, 5000); // refresh κάθε 5 δευτερόλεπτα
    } else {
      showNotification("Λάθος στοιχεία!");
    }
  });
}

// --- Register
function register() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  fetch(serverURL, {
    method: "POST",
    body: JSON.stringify({action:"register", username, password})
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      showNotification("Εγγραφήκατε επιτυχώς, κάντε login!");
    } else {
      showNotification(data.message || "Σφάλμα στην εγγραφή.");
    }
  });
}

// --- Emergency Delete Popup
document.querySelector(".delete-btn").addEventListener("click", () => {
  document.getElementById("deletePopup").style.display = "flex";
});

function closeDeletePopup() {
  document.getElementById("deletePopup").style.display = "none";
}

function confirmDelete() {
  const pass = document.getElementById("deletePassword").value;
  fetch(serverURL, {
    method: "POST",
    body: JSON.stringify({action: "emergencyDelete", password: pass})
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      alert("Η συνομιλία διαγράφηκε, ο κωδικός άλλαξε και η συνομιλία κλειδώθηκε.");
      location.reload();
    } else {
      showNotification("Λάθος κωδικός!");
    }
    closeDeletePopup();
  });
}

// --- Auto-refresh μηνυμάτων
setInterval(loadMessages, 3000);
