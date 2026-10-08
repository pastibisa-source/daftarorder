/* =========================================================
   AXENTRA ORDER MANAGER
   JavaScript + Supabase
   ========================================================= */


/* =========================================================
   1. SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL = "https://wapfwszrsngnjqgbrlfz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_qsKfIoHTtgV-D-8mvL3NKg_FcBiC-e5";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   2. APPLICATION STATE
   ========================================================= */

let orders = [];
let editingId = null;
let revenueChart = null;
let statusChart = null;


/* =========================================================
   3. ELEMENTS
   ========================================================= */

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const togglePassword = document.getElementById("togglePassword");

const sidebarEmail = document.getElementById("sidebarEmail");
const logoutBtn = document.getElementById("logoutBtn");

const refreshBtn = document.getElementById("refreshBtn");
const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");

const orderModal = document.getElementById("orderModal");
const orderForm = document.getElementById("orderForm");

const modalTitle = document.getElementById("modalTitle");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");

const addOrderBtn = document.getElementById("addOrderBtn");
const navAddOrder = document.getElementById("navAddOrder");

const orderId = document.getElementById("orderId");
const namaTugas = document.getElementById("namaTugas");
const client = document.getElementById("client");
const deadline = document.getElementById("deadline");
const harga = document.getElementById("harga");
const dp = document.getElementById("dp");
const pembayaran = document.getElementById("pembayaran");
const tanggalPembayaran =
  document.getElementById("tanggalPembayaran");
const status = document.getElementById("status");
const keterangan = document.getElementById("keterangan");

const orderBody = document.getElementById("orderBody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const paymentFilter = document.getElementById("paymentFilter");
const deadlineFilter = document.getElementById("deadlineFilter");

const filterCount = document.getElementById("filterCount");

const toast = document.getElementById("toast");

// Modal keterangan order
const noteModal = document.getElementById("noteModal");
const noteModalTitle = document.getElementById("noteModalTitle");
const noteModalClient = document.getElementById("noteModalClient");
const noteModalContent = document.getElementById("noteModalContent");
const closeNoteModal = document.getElementById("closeNoteModal");
const closeNoteModalBottom = document.getElementById("closeNoteModalBottom");


/* =========================================================
   4. TOAST NOTIFICATION
   ========================================================= */

function showToast(message, error = false) {

  toast.textContent = message;

  toast.className = error
    ? "show error"
    : "show";

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.className = "";
  }, 3000);

}


/* =========================================================
   5. FORMAT RUPIAH
   ========================================================= */

function rupiah(value) {

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

}


/* =========================================================
   6. FORMAT DEADLINE
   ========================================================= */

function formatDeadline(value) {

  if (!value) {
    return "-";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

}
/* =========================================================
   6B. FORMAT TANGGAL SAJA
   ========================================================= */

function formatDateOnly(date) {

  if (!date || isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

}

/* =========================================================
   7. FORMAT DATETIME LOCAL
   ========================================================= */

function toLocalInputValue(value) {

  if (!value) {
    return "";
  }

  const date = new Date(value);

  const pad = number =>
    String(number).padStart(2, "0");

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );

}


/* =========================================================
   8. DEADLINE COLOR
   ========================================================= */

function deadlineClass(value, currentStatus) {

  if (currentStatus === "Selesai") {
    return "success";
  }

  const now = new Date();
  const target = new Date(value);

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  if (target < now) {
    return "danger";
  }

  if (targetDay.getTime() === today.getTime()) {
    return "warning";
  }

  return "info";

}


/* =========================================================
   9. DEADLINE LABEL
   ========================================================= */

function deadlineLabel(value, currentStatus) {

  if (currentStatus === "Selesai") {
    return "Selesai";
  }

  const target = new Date(value);
  const now = new Date();

  if (target < now) {
    return "Terlambat";
  }

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  if (today.getTime() === targetDay.getTime()) {
    return "Hari ini";
  }

  return "Mendatang";

}


/* =========================================================
   10. ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   11. LOGIN / SESSION
   ========================================================= */

async function checkSession() {

  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  if (error) {

    console.error(error);

    showLogin();

    return;
  }

  if (data.session) {

    showApp(data.session.user);

  } else {

    showLogin();

  }

}


/* =========================================================
   12. SHOW LOGIN
   ========================================================= */

function showLogin() {

  loginScreen.classList.remove("hidden");

  app.classList.add("hidden");

}


/* =========================================================
   13. SHOW APPLICATION
   ========================================================= */

async function showApp(user) {

  loginScreen.classList.add("hidden");

  app.classList.remove("hidden");

  sidebarEmail.textContent =
    user.email || "Admin";

  await loadOrders();

}


/* =========================================================
   14. LOGIN FORM
   ========================================================= */

loginForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  loginBtn.disabled = true;

  loginBtn.textContent = "Memproses...";

  const email =
    loginEmail.value.trim();

  const password =
    loginPassword.value;

  const {
    data,
    error
  } = await supabaseClient.auth.signInWithPassword({

    email: email,

    password: password

  });


  loginBtn.disabled = false;

  loginBtn.textContent =
    "Masuk ke Dashboard";


  if (error) {

    console.error(error);

    showToast(
      "Login gagal: " + error.message,
      true
    );

    return;
  }


  loginPassword.value = "";

  showToast(
    "Login berhasil."
  );

  await showApp(data.user);

});


/* =========================================================
   15. LOGOUT
   ========================================================= */

logoutBtn.addEventListener("click", async function () {

  const {
    error
  } = await supabaseClient.auth.signOut();


  if (error) {

    console.error(error);

    showToast(
      "Gagal keluar: " + error.message,
      true
    );

    return;
  }


  orders = [];

  showLogin();

  showToast(
    "Anda sudah keluar."
  );

});


/* =========================================================
   16. AUTH STATE
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  function (event, session) {

    if (event === "SIGNED_OUT") {

      showLogin();

    }

  }
);


/* =========================================================
   17. SHOW / HIDE PASSWORD
   ========================================================= */

togglePassword.addEventListener(
  "click",
  function () {

    const isPassword =
      loginPassword.type === "password";

    loginPassword.type =
      isPassword
        ? "text"
        : "password";

    togglePassword.textContent =
      isPassword
        ? "🙈"
        : "👁";

  }
);


/* =========================================================
   18. LOAD ORDERS FROM SUPABASE
   ========================================================= */

async function loadOrders() {

  orderBody.innerHTML = `
    <tr>
      <td colspan="7"
          style="text-align:center;padding:35px;color:#718096">
        Memuat data order...
      </td>
    </tr>
  `;


  const {
    data,
    error
  } = await supabaseClient
    .from("orders")
    .select("*")
    .order(
      "deadline",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(error);

    showToast(
      "Gagal mengambil data order: " +
      error.message,
      true
    );

    orders = [];

    renderOrders();

    updateStats();

    return;
  }


orders = data || [];

syncDPReceiptLedger();

renderOrders();

updateStats();

renderDeadlineReminders();

}


/* =========================================================
   19. SAVE ORDER
   ========================================================= */

orderForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    if (!namaTugas.value.trim()) {

      showToast(
        "Nama tugas wajib diisi.",
        true
      );

      return;
    }


    if (!client.value.trim()) {

      showToast(
        "Nama client wajib diisi.",
        true
      );

      return;
    }


    if (!deadline.value) {

      showToast(
        "Deadline wajib diisi.",
        true
      );

      return;
    }
const dpAmount = Number(dp.value || 0);

    const hasPayment =
      pembayaran.value === "Sudah Bayar" ||
      dpAmount > 0;

    if (hasPayment && !tanggalPembayaran.value) {

      showToast(
        "Tanggal pembayaran wajib diisi jika ada DP atau pembayaran lunas.",
        true
      );

      tanggalPembayaran.focus();

      return;
    }

    const payload = {

      nama_tugas:
        namaTugas.value.trim(),

      client:
        client.value.trim(),

      deadline:
        new Date(
          deadline.value
        ).toISOString(),

      harga:
        Number(
          harga.value || 0
        ),

      dp: dpAmount,

      pembayaran:
        pembayaran.value,

      tanggal_pembayaran:
        hasPayment && tanggalPembayaran.value
          ? new Date(
              tanggalPembayaran.value
            ).toISOString()
          : null,

      status:
        status.value,

      keterangan:
        keterangan.value.trim()

    };


    const saveBtn =
      document.getElementById(
        "saveOrderBtn"
      );


    saveBtn.disabled = true;

    saveBtn.textContent =
      "Menyimpan...";


    let result;


    if (editingId) {

      result =
        await supabaseClient
          .from("orders")
          .update(payload)
          .eq(
            "id",
            editingId
          );

    }

    else {

      result =
        await supabaseClient
          .from("orders")
          .insert(
            payload
          );

    }


    saveBtn.disabled = false;

    saveBtn.textContent =
      "Simpan Order";


    if (result.error) {

      console.error(
        result.error
      );

      showToast(
        "Gagal menyimpan: " +
        result.error.message,
        true
      );

      return;
    }


    const wasEditing = Boolean(editingId);

    closeOrderModal();


    showToast(
      wasEditing
        ? "Order berhasil diperbarui."
        : "Order berhasil ditambahkan."
    );


    await loadOrders();

  }
);


/* =========================================================
   20. DELETE ORDER
   ========================================================= */

async function deleteOrder(id) {

  const target =
    orders.find(
      order =>
        String(order.id) ===
        String(id)
    );


  if (!target) {
    return;
  }


  const confirmed =
    confirm(
      `Hapus order "${target.nama_tugas}" dari ${target.client}?`
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } = await supabaseClient
    .from("orders")
    .delete()
    .eq(
      "id",
      id
    );


  if (error) {

    console.error(error);

    showToast(
      "Gagal menghapus: " +
      error.message,
      true
    );

    return;
  }


  showToast(
    "Order berhasil dihapus."
  );


  await loadOrders();

}


/* =========================================================
   21. FILTER ORDERS
   ========================================================= */

function getFilteredOrders() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();

  const selectedStatus =
    statusFilter.value;

  const selectedPayment =
    paymentFilter.value;

  const selectedDeadline =
    deadlineFilter.value;

  const now = new Date();


  return orders.filter(
    function (order) {


      const matchesSearch =

        !search ||

        (order.nama_tugas || "")
          .toLowerCase()
          .includes(search) ||

        (order.client || "")
          .toLowerCase()
          .includes(search) ||

        (order.keterangan || "")
          .toLowerCase()
          .includes(search);


      const matchesStatus =

        !selectedStatus ||

        order.status ===
        selectedStatus;


      const matchesPayment =

        !selectedPayment ||

        order.pembayaran ===
        selectedPayment;


      let matchesDeadline = true;


      if (
        selectedDeadline ===
        "today"
      ) {

        const d =
          new Date(
            order.deadline
          );

        matchesDeadline =

          d.getFullYear() ===
          now.getFullYear() &&

          d.getMonth() ===
          now.getMonth() &&

          d.getDate() ===
          now.getDate();

      }


      else if (
        selectedDeadline ===
        "upcoming"
      ) {

        matchesDeadline =
          new Date(
            order.deadline
          ) >= now;

      }


      else if (
        selectedDeadline ===
        "overdue"
      ) {

        matchesDeadline =

          new Date(
            order.deadline
          ) < now &&

          order.status !==
          "Selesai";

      }


      return (

        matchesSearch &&

        matchesStatus &&

        matchesPayment &&

        matchesDeadline

      );

    }
  );

}


/* =========================================================
   22. RENDER ORDERS
   ========================================================= */

function renderOrders() {

  const filtered =
    getFilteredOrders();


  filterCount.textContent =
    `${filtered.length} order`;


  if (filtered.length === 0) {

    orderBody.innerHTML = "";

    emptyState.classList.remove(
      "hidden"
    );

    return;
  }


  emptyState.classList.add(
    "hidden"
  );


  orderBody.innerHTML =
    filtered.map(
      function (order) {


        const deadlineColor =
          deadlineClass(
            order.deadline,
            order.status
          );


        const deadlineText =
          deadlineLabel(
            order.deadline,
            order.status
          );


        const paymentColor =
          order.pembayaran ===
          "Sudah Bayar"
            ? "success"
            : "warning";


        const statusColor =
          order.status ===
          "Selesai"
            ? "success"
            : "info";


        const note =
          order.keterangan
            ? `
              <button
                type="button"
                class="order-note-preview"
                title="Klik untuk melihat keterangan lengkap"
                data-note-id="${Number(order.id)}"
                aria-label="Lihat keterangan ${escapeHtml(order.nama_tugas)}"
              >
                <span class="order-note-icon">▤</span>
                <span class="order-note-text">${
                  escapeHtml(order.keterangan).slice(0, 55)
                }${
                  order.keterangan.length > 55 ? "…" : ""
                }</span>
                <span class="order-note-more">Lihat</span>
              </button>
            `
            : "";


        return `

          <tr>

            <td>

              <strong>
                ${
                  escapeHtml(
                    order.nama_tugas
                  )
                }
              </strong>

              ${note}

            </td>


            <td>
              ${
                escapeHtml(
                  order.client
                )
              }
            </td>


            <td>

              <div>
                ${
                  formatDeadline(
                    order.deadline
                  )
                }
              </div>

              <span
                class="badge ${deadlineColor}"
                style="margin-top:5px"
              >
                ${deadlineText}
              </span>

            </td>


            <td class="price">

              ${
                rupiah(
                  order.harga
                )
              }

            </td>


            <td>

              <span
                class="badge ${paymentColor}"
              >

                ${
                  escapeHtml(
                    order.pembayaran
                  )
                }

              </span>

            </td>


            <td>

              <span
                class="badge ${statusColor}"
              >

                ${
                  escapeHtml(
                    order.status
                  )
                }

              </span>

            </td>


            <td>

              <div class="actions">

                <button
                  class="action-btn edit"
                  title="Edit"
                  onclick="editOrder(${Number(order.id)})"
                >
                  ✎
                </button>


                <button
                  class="action-btn delete"
                  title="Hapus"
                  onclick="deleteOrder(${Number(order.id)})"
                >
                  ⌫
                </button>

              </div>

            </td>

          </tr>

        `;

      }
    ).join("");

}


/* =========================================================
   23. UPDATE DASHBOARD STATISTICS
   ========================================================= */

function updateStats() {

  const total =
    orders.length;


  const revenue =
    orders.reduce(
      function (
        totalAmount,
        order
      ) {

        if (
          order.pembayaran ===
          "Sudah Bayar"
        ) {

          return (
            totalAmount +
            Number(
              order.harga || 0
            )
          );

        }


        return (
          totalAmount +
          Number(
            order.dp || 0
          )
        );

      },
      0
    );


  const active =
    orders.filter(
      order =>
        order.status ===
        "Belum Selesai"
    ).length;


  const completed =
    orders.filter(
      order =>
        order.status ===
        "Selesai"
    ).length;


  document.getElementById(
    "totalOrder"
  ).textContent =
    total;


  document.getElementById(
    "totalRevenue"
  ).textContent =
    rupiah(
      revenue
    );


  document.getElementById(
    "activeOrder"
  ).textContent =
    active;


  document.getElementById(
    "completedOrder"
  ).textContent =
    completed;

}

/* =========================================================
   23B. PENGINGAT DEADLINE
   ========================================================= */

const deadlineReminderList =
  document.getElementById("deadlineReminderList");

const deadlineAlertCount =
  document.getElementById("deadlineAlertCount");


function formatRemainingTime(deadlineValue) {

  const now = new Date();
  const target = new Date(deadlineValue);

  const difference =
    target.getTime() - now.getTime();

  if (difference <= 0) {
    return "Deadline sudah lewat";
  }

  const totalMinutes =
    Math.floor(difference / (1000 * 60));

  const days =
    Math.floor(totalMinutes / (60 * 24));

  const hours =
    Math.floor(
      (totalMinutes % (60 * 24)) / 60
    );

  const minutes =
    totalMinutes % 60;


  if (days > 0) {
    return `${days} hari ${hours} jam lagi`;
  }

  if (hours > 0) {
    return `${hours} jam ${minutes} menit lagi`;
  }

  return `${minutes} menit lagi`;
}


function getDeadlineReminderClass(order) {

  if (order.status === "Selesai") {
    return "deadline-completed";
  }

  const now = new Date();
  const target = new Date(order.deadline);

  const difference =
    target.getTime() - now.getTime();

  const hours =
    difference / (1000 * 60 * 60);


  if (difference <= 0) {
    return "deadline-danger";
  }

  if (hours <= 24) {
    return "deadline-danger";
  }

  if (hours <= 72) {
    return "deadline-warning";
  }

  return "deadline-safe";
}


function getDeadlineBadge(order) {

  if (order.status === "Selesai") {
    return "✓ Selesai";
  }

  const now = new Date();
  const target = new Date(order.deadline);

  const difference =
    target.getTime() - now.getTime();

  const hours =
    difference / (1000 * 60 * 60);


  if (difference <= 0) {
    return "⚠ Terlambat";
  }

  if (hours <= 24) {
    return "🔴 ≤ 24 Jam";
  }

  if (hours <= 72) {
    return "🟡 2–3 Hari";
  }

  return "🔵 Aman";
}


function renderDeadlineReminders() {

  if (!deadlineReminderList) {
    return;
  }

  // HANYA tampilkan order yang BELUM SELESAI
  // dan memiliki deadline
  const activeOrders =
    orders
      .filter(function(order) {

        return (
          order.deadline &&
          order.status !== "Selesai"
        );

      })
      .sort(function(a, b) {

        return (
          new Date(a.deadline) -
          new Date(b.deadline)
        );

      });


  // Update jumlah pengingat
  if (deadlineAlertCount) {

    deadlineAlertCount.textContent =
      activeOrders.length;

  }


  // Jika tidak ada order yang belum selesai
  if (activeOrders.length === 0) {

    deadlineReminderList.innerHTML = `
      <div class="deadline-empty">

        <div class="deadline-empty-icon">
          🔔
        </div>

        <strong>
          Tidak ada pengingat deadline
        </strong>

        Semua order sudah selesai atau
        belum memiliki deadline.

      </div>
    `;

    return;
  }


  // Tampilkan daftar order belum selesai
  deadlineReminderList.innerHTML =
    activeOrders
      .map(function(order) {

        const reminderClass =
          getDeadlineReminderClass(order);

        const badge =
          getDeadlineBadge(order);

        const remaining =
          formatRemainingTime(
            order.deadline
          );


        return `
          <div class="deadline-item ${reminderClass}">

            <div class="deadline-item-main">

              <div class="deadline-item-title">
                ${escapeHtml(order.nama_tugas)}
              </div>

              <div class="deadline-item-client">
                Client: ${escapeHtml(order.client)}
              </div>

              <div class="deadline-item-time">
                ⏱️ ${remaining}
              </div>
<button
  type="button"
  class="deadline-view-btn"
  onclick="editOrder(${Number(order.id)})"
>
  👁 Lihat Tugas
</button>
            </div>

            <div class="deadline-item-badge">
              ${badge}
            </div>

          </div>
        `;

      })
      .join("");

}
/* UPDATE COUNTDOWN SETIAP MENIT */

setInterval(
  function() {

    if (
      typeof orders !== "undefined" &&
      orders.length > 0
    ) {

      renderDeadlineReminders();

    }

  },
  60000
);
/* =========================================================
   24. OPEN ADD ORDER MODAL
   ========================================================= */

function openNewOrder() {

  editingId = null;

  orderForm.reset();

  orderId.value = "";

  modalTitle.textContent =
    "Tambah Order";

  dp.value = "";

  pembayaran.value =
    "Belum Bayar";

  tanggalPembayaran.value = "";

  status.value =
    "Belum Selesai";

  orderModal.classList.remove(
    "hidden"
  );

  namaTugas.focus();

}


/* =========================================================
   MODAL KETERANGAN ORDER
   ========================================================= */

function openNoteModal(id) {
  const order = orders.find(item => String(item.id) === String(id));
  if (!order || !order.keterangan) return;

  noteModalTitle.textContent = order.nama_tugas || "Keterangan Order";
  noteModalClient.textContent = order.client ? `Client: ${order.client}` : "";
  noteModalContent.textContent = order.keterangan;
  noteModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  closeNoteModal.focus();
}

function closeNoteModalWindow() {
  noteModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

if (orderBody) {
  orderBody.addEventListener("click", function(event) {
    const noteButton = event.target.closest(".order-note-preview");
    if (!noteButton) return;
    event.preventDefault();
    event.stopPropagation();
    openNoteModal(noteButton.dataset.noteId);
  });
}

if (closeNoteModal) closeNoteModal.addEventListener("click", closeNoteModalWindow);
if (closeNoteModalBottom) closeNoteModalBottom.addEventListener("click", closeNoteModalWindow);

if (noteModal) {
  noteModal.addEventListener("click", function(event) {
    if (event.target === noteModal) closeNoteModalWindow();
  });
}

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape" && noteModal && !noteModal.classList.contains("hidden")) {
    closeNoteModalWindow();
  }
});


/* =========================================================
   25. EDIT ORDER
   ========================================================= */

function editOrder(id) {

  const order =
    orders.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!order) {
    return;
  }


  editingId =
    order.id;


  orderId.value =
    order.id;


  namaTugas.value =
    order.nama_tugas || "";


  client.value =
    order.client || "";


  deadline.value =
    toLocalInputValue(
      order.deadline
    );


  harga.value =
    order.harga || 0;


  dp.value =
    order.dp || 0;


  pembayaran.value =
    order.pembayaran ||
    "Belum Bayar";

  tanggalPembayaran.value =
    toLocalInputValue(
      order.tanggal_pembayaran
    );


  status.value =
    order.status ||
    "Belum Selesai";


  keterangan.value =
    order.keterangan || "";


  modalTitle.textContent =
    "Edit Order";


  orderModal.classList.remove(
    "hidden"
  );

}


/* =========================================================
   26. CLOSE MODAL
   ========================================================= */

function closeOrderModal() {

  orderModal.classList.add(
    "hidden"
  );

  orderForm.reset();

  editingId = null;

}


/* =========================================================
   27. ADD ORDER BUTTON
   ========================================================= */

addOrderBtn.addEventListener(
  "click",
  function () {

    openNewOrder();

  }
);


/* =========================================================
   28. SIDEBAR ADD ORDER
   ========================================================= */

navAddOrder.addEventListener(
  "click",
  function () {

    openNewOrder();

    sidebar.classList.remove(
      "open"
    );

  }
);


/* =========================================================
   29. CLOSE MODAL BUTTONS
   ========================================================= */

closeModal.addEventListener(
  "click",
  function () {

    closeOrderModal();

  }
);


cancelModal.addEventListener(
  "click",
  function () {

    closeOrderModal();

  }
);


/* =========================================================
   30. CLOSE MODAL WHEN CLICKING OUTSIDE
   ========================================================= */

orderModal.addEventListener(
  "click",
  function (event) {

    if (
      event.target ===
      orderModal
    ) {

      closeOrderModal();

    }

  }
);


/* =========================================================
   31. SEARCH
   ========================================================= */

searchInput.addEventListener(
  "input",
  function () {

    renderOrders();

  }
);


/* =========================================================
   32. STATUS FILTER
   ========================================================= */

statusFilter.addEventListener(
  "change",
  function () {

    renderOrders();

  }
);


/* =========================================================
   33. PAYMENT FILTER
   ========================================================= */

paymentFilter.addEventListener(
  "change",
  function () {

    renderOrders();

  }
);


/* =========================================================
   34. DEADLINE FILTER
   ========================================================= */

deadlineFilter.addEventListener(
  "change",
  function () {

    renderOrders();

  }
);


/* =========================================================
   35. REFRESH
   ========================================================= */

refreshBtn.addEventListener(
  "click",
  async function () {

    refreshBtn.disabled = true;

    await loadOrders();

    refreshBtn.disabled = false;

    showToast(
      "Data berhasil diperbarui."
    );

  }
);


/* =========================================================
   36. MOBILE SIDEBAR
   ========================================================= */

mobileMenu.addEventListener(
  "click",
  function () {

    sidebar.classList.toggle(
      "open"
    );

  }
);
/* =========================================================
   36B. KWITANSI
   ========================================================= */

const receiptsPage =
  document.getElementById("receiptsPage");

const receiptBody =
  document.getElementById("receiptBody");

const receiptCount =
  document.getElementById("receiptCount");

const receiptEmptyState =
  document.getElementById("receiptEmptyState");

const receiptMonthFilter =
  document.getElementById("receiptMonthFilter");

const receiptYearFilter =
  document.getElementById("receiptYearFilter");

const receiptNumberFilter =
  document.getElementById("receiptNumberFilter");

const receiptNumberSort =
  document.getElementById("receiptNumberSort");

const RECEIPT_LEDGER_KEY =
  "axentra_receipt_ledger_v2";

function getRomanMonth(month) {
  const romanMonths = [
    "I","II","III","IV","V","VI",
    "VII","VIII","IX","X","XI","XII"
  ];
  return romanMonths[month - 1] || "";
}

function getReceiptLedger() {
  try {
    return JSON.parse(
      localStorage.getItem(RECEIPT_LEDGER_KEY) || "{}"
    );
  } catch (error) {
    return {};
  }
}

function saveReceiptLedger(ledger) {
  try {
    localStorage.setItem(
      RECEIPT_LEDGER_KEY,
      JSON.stringify(ledger)
    );
  } catch (error) {
    console.warn("Ledger kwitansi tidak dapat disimpan.", error);
  }
}

function getReceiptLedgerKey(orderId, type) {
  return `${orderId}:${type}`;
}

function getReceiptSequenceValues() {
  const values = [];
  const ledger = getReceiptLedger();

  Object.values(ledger).forEach(function (item) {
    const match = String(item?.number || "").match(/^(\d+)\//);
    if (match) values.push(Number(match[1]));
  });

  orders.forEach(function (order) {
    const match = String(order.nomor_kwitansi || "").match(/^(\d+)\//);
    if (match) values.push(Number(match[1]));
  });

  return values;
}

function getNextReceiptNumber() {
  const values = getReceiptSequenceValues();
  return values.length ? Math.max(...values) + 1 : 1;
}

function buildReceiptNumber(dateValue, sequence) {
  const date = new Date(dateValue);
  const month = getRomanMonth(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${String(sequence).padStart(3, "0")}/INV/APA/${month}/${year}`;
}

function syncDPReceiptLedger() {
  const ledger = getReceiptLedger();
  let changed = false;

  orders.forEach(function (order) {
    const dpAmount = Number(order.dp || 0);
    const paymentDate = order.tanggal_pembayaran || null;

    if (dpAmount > 0 && paymentDate && order.pembayaran !== "Sudah Bayar") {
      const key = getReceiptLedgerKey(order.id, "dp");
      if (!ledger[key]?.date) {
        ledger[key] = {
          number: ledger[key]?.number || "",
          date: paymentDate
        };
        changed = true;
      }
    }
  });

  if (changed) saveReceiptLedger(ledger);
}

function getReceiptEntries() {
  const ledger = getReceiptLedger();
  const entries = [];
  const month = receiptMonthFilter ? receiptMonthFilter.value : "";
  const year = receiptYearFilter ? receiptYearFilter.value : "";
  const numberSearch = receiptNumberFilter
    ? receiptNumberFilter.value.trim().toLowerCase()
    : "";

  orders.forEach(function (order) {
    const dpAmount = Number(order.dp || 0);
    const isPaid = order.pembayaran === "Sudah Bayar";
    const currentPaymentDate = order.tanggal_pembayaran || null;

    /*
       DP selalu mempunyai kwitansi sendiri.
       Jika order sudah lunas, snapshot tanggal DP dari ledger
       tetap dipertahankan agar kwitansi DP tidak hilang.
    */
    if (dpAmount > 0) {
      const dpKey = getReceiptLedgerKey(order.id, "dp");
      let dpLedger = ledger[dpKey];

      if (!dpLedger && currentPaymentDate) {
        dpLedger = {
          date: currentPaymentDate,
          number: ""
        };
        ledger[dpKey] = dpLedger;
      }

      const dpDate = dpLedger?.date || currentPaymentDate;

      if (dpDate) {
        const date = new Date(dpDate);
        const matchesMonth = !month || date.getMonth() + 1 === Number(month);
        const matchesYear = !year || date.getFullYear() === Number(year);

        if (matchesMonth && matchesYear) {
          entries.push({
            order,
            type: "DP",
            key: dpKey,
            date: dpDate,
            total: Number(order.harga || 0),
            dp: dpAmount,
            remaining: Math.max(Number(order.harga || 0) - dpAmount, 0),
            number: dpLedger?.number || ""
          });
        }
      }
    }

    /*
       Saat status menjadi Sudah Bayar, terbitkan kwitansi
       pelunasan kedua. Kwitansi DP tetap tersimpan.
    */
    if (isPaid && currentPaymentDate) {
      const date = new Date(currentPaymentDate);
      const matchesMonth = !month || date.getMonth() + 1 === Number(month);
      const matchesYear = !year || date.getFullYear() === Number(year);

      if (matchesMonth && matchesYear) {
        entries.push({
          order,
          type: "PELUNASAN",
          key: getReceiptLedgerKey(order.id, "lunas"),
          date: currentPaymentDate,
          total: Number(order.harga || 0),
          dp: dpAmount,
          remaining: 0,
          number: order.nomor_kwitansi || ""
        });
      }
    }
  });

  saveReceiptLedger(ledger);

  if (numberSearch) {
    return entries.filter(function (entry) {
      return String(entry.number || "")
        .toLowerCase()
        .includes(numberSearch);
    });
  }

  return entries;
}

function getReceiptSequenceNumber(entry) {
  const match = String(entry?.number || "").match(/^(\d+)\//);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function getReceiptQRText(entry) {
  return [
    "AXENTRA PRIMA AKSARA",
    "KWITANSI PEMBAYARAN",
    `Nomor: ${entry.number}`,
    `Jenis: ${entry.type}`,
    `Client: ${entry.order.client || "-"}`,
    `Order: ${entry.order.nama_tugas || "-"}`,
    `Total: ${rupiah(entry.total)}`,
    `DP: ${rupiah(entry.dp)}`,
    `Sisa: ${rupiah(entry.remaining)}`,
    `Tanggal: ${formatDateOnly(new Date(entry.date))}`
  ].join("\n");
}

function renderReceiptQR(element, entry) {
  if (!element) return;

  element.innerHTML = "";

  if (typeof QRCode === "undefined") {
    element.innerHTML = `<span class="qr-fallback">QR</span>`;
    return;
  }

  new QRCode(element, {
    text: getReceiptQRText(entry),
    width: 92,
    height: 92,
    colorDark: "#102a43",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

async function ensureReceiptNumbers(entries) {
  const ledger = getReceiptLedger();
  let nextNumber = getNextReceiptNumber();
  let changed = false;

  for (const entry of entries) {
    if (!entry.number) {
      const number = buildReceiptNumber(entry.date, nextNumber++);
      entry.number = number;

      if (entry.type === "PELUNASAN") {
        entry.order.nomor_kwitansi = number;
        const result = await supabaseClient
          .from("orders")
          .update({ nomor_kwitansi: number })
          .eq("id", entry.order.id);

        if (result.error) {
          console.warn("Nomor kwitansi lunas belum tersimpan di Supabase:", result.error.message);
        }
      } else {
        ledger[entry.key] = {
          number,
          date: entry.date
        };
        changed = true;
      }
    }
  }

  if (changed) saveReceiptLedger(ledger);
  return entries;
}

async function renderReceipts() {
  if (!receiptBody || !receiptCount) return;

  let receiptEntries = getReceiptEntries();
  receiptCount.textContent = `${receiptEntries.length} kwitansi`;

  if (!receiptEntries.length) {
    receiptBody.innerHTML = "";
    receiptEmptyState.classList.remove("hidden");
    return;
  }

  receiptEmptyState.classList.add("hidden");
  receiptEntries = await ensureReceiptNumbers(receiptEntries);

  const sortMode = receiptNumberSort
    ? receiptNumberSort.value
    : "asc";

  receiptEntries.sort(function (a, b) {
    const numberA = getReceiptSequenceNumber(a);
    const numberB = getReceiptSequenceNumber(b);
    return sortMode === "desc"
      ? numberB - numberA
      : numberA - numberB;
  });

  receiptCount.textContent = `${receiptEntries.length} kwitansi`;

  receiptBody.innerHTML = receiptEntries.map(function (entry) {
    return `
      <tr>
        <td>
          <strong>${escapeHtml(entry.number || "-")}</strong>
        </td>
        <td>
          <span class="receipt-type-badge ${entry.type === "DP" ? "dp" : "lunas"}">
            ${entry.type === "DP" ? "DP" : "PELUNASAN"}
          </span>
        </td>
        <td>${escapeHtml(entry.order.client || "-")}</td>
        <td>${escapeHtml(entry.order.nama_tugas || "-")}</td>
        <td class="price">${rupiah(entry.total)}</td>
        <td class="price">${rupiah(entry.dp)}</td>
        <td class="price">${rupiah(entry.remaining)}</td>
        <td>${formatDateOnly(new Date(entry.date))}</td>
        <td>
          <div class="actions">
            <button
              class="receipt-view-btn"
              type="button"
              title="Lihat Kwitansi"
              data-receipt-id="${escapeHtml(String(entry.order.id))}"
              data-receipt-type="${escapeHtml(entry.type)}"
            >
              <span>👁</span> Lihat
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function findReceiptEntry(orderId, type) {
  return getReceiptEntries().find(function (entry) {
    return String(entry.order.id) === String(orderId) && entry.type === type;
  });
}

function viewReceipt(orderId, type) {

  console.log("Membuka kwitansi:", orderId, type);

  const modal = document.getElementById("receiptViewModal");

  /* Buka modal TERLEBIH DAHULU.
     Dengan cara ini, error pada data/QR tidak akan membuat
     tombol Lihat seolah-olah tidak bekerja. */
  if (!modal) {
    console.error("receiptViewModal tidak ditemukan.");
    showToast("Jendela preview kwitansi tidak ditemukan.", true);
    return;
  }

  modal.classList.remove("hidden");
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("receipt-modal-open");

  try {
    const entry = findReceiptEntry(orderId, type);

    if (!entry) {
      console.error("Receipt entry tidak ditemukan:", { orderId, type });
      showToast("Data kwitansi tidak ditemukan.", true);
      return;
    }

    const ledger = getReceiptLedger();

    if (!entry.number) {
      entry.number = buildReceiptNumber(
        entry.date,
        getNextReceiptNumber()
      );

      if (entry.type === "DP") {
        ledger[entry.key] = {
          number: entry.number,
          date: entry.date
        };
        saveReceiptLedger(ledger);
      }
    }

    const paymentDate = new Date(entry.date);

    const setText = function(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? "-";
    };

    setText("previewReceiptNumber", entry.number || "-");
    setText(
      "previewReceiptType",
      entry.type === "DP"
        ? "KWITANSI UANG MUKA"
        : "KWITANSI PELUNASAN"
    );
    setText("previewReceiptClient", entry.order.client || "-");
    setText("previewReceiptOrder", entry.order.nama_tugas || "-");
    setText("previewReceiptTotal", rupiah(entry.total));
    setText("previewReceiptDP", rupiah(entry.dp));
    setText("previewReceiptRemaining", rupiah(entry.remaining));
    setText(
      "previewReceiptDate",
      formatDateOnly(paymentDate)
    );
    setText(
      "previewReceiptLocation",
      "Palembang, " + formatDateOnly(paymentDate)
    );
    setText(
      "receiptViewSubtitle",
      `${entry.order.client || "Client"} • ${entry.number || "-"}`
    );

    /* QR bersifat tambahan.
       Jika library QR gagal, preview tetap terbuka. */
    try {
      renderReceiptQR(
        document.getElementById("previewReceiptQR"),
        entry
      );
    } catch (qrError) {
      console.warn("QR preview gagal dibuat:", qrError);
      const qr = document.getElementById("previewReceiptQR");
      if (qr) qr.innerHTML = '<span class="qr-fallback">QR</span>';
    }

    window.currentReceiptEntry = entry;
    window.currentReceiptOrderId = entry.order.id;

  } catch (error) {
    console.error("Error saat memuat preview kwitansi:", error);
    showToast(
      "Preview terbuka, tetapi sebagian data kwitansi gagal dimuat.",
      true
    );
  }
}
window.viewReceipt = viewReceipt;
function closeReceiptView() {
  const modal = document.getElementById("receiptViewModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("receipt-modal-open");
}

async function printCurrentReceipt() {

  const entry = window.currentReceiptEntry;

  if (!entry) {
    showToast("Data kwitansi belum tersedia.", true);
    return;
  }

  /* =====================================================
     CEK LIBRARY PDF
     ===================================================== */

  if (typeof window.html2canvas !== "function") {
    showToast("html2canvas belum berhasil dimuat.", true);
    console.error("html2canvas tidak tersedia.");
    return;
  }

  if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
    showToast("jsPDF belum berhasil dimuat.", true);
    console.error("window.jspdf.jsPDF tidak tersedia.");
    return;
  }

  const printButton =
    document.getElementById("printReceiptBtn");

  if (printButton) {
    printButton.disabled = true;
    printButton.innerHTML = "⏳ Membuat PDF...";
  }

  let tempHost = null;

  try {

    /* =====================================================
       ISI TEMPLATE KWITANSI
       ===================================================== */

    const paymentDate = new Date(entry.date);

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? "-";
    };

    setText("receiptNumber", entry.number || "-");

    setText(
      "receiptType",
      entry.type === "DP"
        ? "KWITANSI UANG MUKA"
        : "KWITANSI PELUNASAN"
    );

    setText(
      "receiptClient",
      entry.order?.client || "-"
    );

    setText(
      "receiptOrder",
      entry.order?.nama_tugas || "-"
    );

    setText(
      "receiptTotal",
      rupiah(entry.total)
    );

    setText(
      "receiptDP",
      rupiah(entry.dp)
    );

    setText(
      "receiptRemaining",
      rupiah(entry.remaining)
    );

    setText(
      "receiptPaymentDate",
      formatDateOnly(paymentDate)
    );

    setText(
      "receiptLocationDate",
      "Palembang, " +
      formatDateOnly(paymentDate)
    );

    /* QR hanya tambahan; jangan sampai QR menggagalkan PDF. */
    try {
      renderReceiptQR(
        document.getElementById("receiptQRCode"),
        entry
      );
    } catch (qrError) {
      console.warn(
        "QR tidak berhasil dirender, PDF tetap dilanjutkan:",
        qrError
      );
    }

    /* =====================================================
       AMBIL TEMPLATE
       ===================================================== */

    const printArea =
      document.getElementById("receiptPrintArea");

    if (!printArea) {
      throw new Error(
        "Elemen #receiptPrintArea tidak ditemukan."
      );
    }

    const originalPaper =
      printArea.querySelector(".receipt-paper");

    if (!originalPaper) {
      throw new Error(
        "Elemen .receipt-paper tidak ditemukan."
      );
    }

    /*
      MASALAH VERSI SEBELUMNYA:
      receiptPrintArea berada di left:-99999px.
      html2canvas kadang gagal menangkap elemen
      yang berada sangat jauh di luar viewport.

      SOLUSI:
      buat clone sementara di posisi normal viewport.
    */

    tempHost = document.createElement("div");

    tempHost.id = "receiptPdfTempHostAutoPDF";

    Object.assign(
      tempHost.style,
      {
        position: "fixed",
        left: "0",
        top: "0",
        width: "215mm",
        height: "75mm",
        background: "#ffffff",
        zIndex: "2147483647",
        overflow: "hidden",
        pointerEvents: "none"
      }
    );

    const clonedPaper =
      originalPaper.cloneNode(true);

    clonedPaper.removeAttribute("id");

    Object.assign(
      clonedPaper.style,
      {
        width: "215mm",
        height: "75mm",
        margin: "0",
        borderRadius: "0",
        boxShadow: "none",
        overflow: "hidden",
        background: "#ffffff"
      }
    );

    tempHost.appendChild(clonedPaper);

    document.body.appendChild(tempHost);

    /* =====================================================
       TUNGGU GAMBAR LOGO / CAP / QR
       ===================================================== */

    const images =
      Array.from(
        clonedPaper.querySelectorAll("img")
      );

    await Promise.all(
      images.map(async (img) => {

        try {

          if (
            typeof img.decode === "function"
          ) {
            await img.decode();
          }

        } catch (imageError) {

          console.warn(
            "Gambar tidak dapat di-decode:",
            img.src,
            imageError
          );

        }

      })
    );

    /*
      Beri waktu browser menghitung layout clone.
    */
    await new Promise(
      resolve =>
        requestAnimationFrame(
          () =>
            requestAnimationFrame(resolve)
        )
    );

    /* =====================================================
       HTML → CANVAS
       ===================================================== */

    const canvas =
      await window.html2canvas(
        clonedPaper,
        {
          scale: 3,
          backgroundColor: "#ffffff",
          useCORS: false,
          allowTaint: false,
          logging: false,
          imageTimeout: 15000,
          removeContainer: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: clonedPaper.scrollWidth,
          windowHeight: clonedPaper.scrollHeight
        }
      );

    if (
      !canvas ||
      !canvas.width ||
      !canvas.height
    ) {
      throw new Error(
        "Canvas kwitansi kosong."
      );
    }

    /* =====================================================
       BUAT PDF 21,5 × 7,5 CM
       ===================================================== */

    const pdf =
      new window.jspdf.jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [215, 75],
        compress: true
      });

    let imageData;

    try {
      imageData = canvas.toDataURL("image/jpeg", 0.98);
    } catch (canvasError) {
      console.warn("Canvas ter-taint oleh gambar. Mencoba render ulang tanpa gambar eksternal:", canvasError);

      const safeCanvas = await window.html2canvas(clonedPaper, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: false,
        allowTaint: false,
        logging: false,
        imageTimeout: 15000,
        removeContainer: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: clonedPaper.scrollWidth,
        windowHeight: clonedPaper.scrollHeight,
        ignoreElements: (element) => element.tagName === "IMG"
      });

      imageData = safeCanvas.toDataURL("image/jpeg", 0.98);
    }

    pdf.addImage(
      imageData,
      "JPEG",
      0,
      0,
      215,
      75,
      undefined,
      "FAST"
    );

    /* =====================================================
       NAMA FILE = NOMOR KWITANSI
       ===================================================== */

    const receiptNumber =
      String(
        entry.number || "kwitansi"
      ).trim();

    const safeFileName =
      receiptNumber
        .replace(
          /[\/\\:*?"<>|]/g,
          "-"
        )
        .replace(
          /\s+/g,
          "-"
        );

    const fileName =
      `${safeFileName || "kwitansi"}.pdf`;

    /* =====================================================
       DOWNLOAD
       ===================================================== */

    pdf.save(fileName);

    showToast(
      `PDF berhasil diunduh: ${fileName}`
    );

  } catch (error) {

    console.error(
      "GAGAL MEMBUAT PDF KWITANSI:",
      error
    );

    showToast(
      "Gagal membuat PDF kwitansi. Silakan coba lagi.",
      true
    );

  } finally {

    if (tempHost) {
      tempHost.remove();
    }

    if (printButton) {
      printButton.disabled = false;
      printButton.innerHTML =
        "🖨 Cetak Kwitansi";
    }

  }
}

const closeReceiptViewBtn =
  document.getElementById("closeReceiptView");
const closeReceiptViewBottom =
  document.getElementById("closeReceiptViewBottom");
const printReceiptBtn =
  document.getElementById("printReceiptBtn");
document.addEventListener(
  "click",
  function (event) {
    const button = event.target.closest(".receipt-view-btn");

    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const orderId = button.dataset.receiptId;
    const receiptType = button.dataset.receiptType;

    console.log(
      "Tombol Lihat diklik:",
      orderId,
      receiptType
    );

    viewReceipt(orderId, receiptType);
  }
);

if (closeReceiptViewBtn) closeReceiptViewBtn.addEventListener("click", closeReceiptView);
if (closeReceiptViewBottom) closeReceiptViewBottom.addEventListener("click", closeReceiptView);
if (printReceiptBtn) printReceiptBtn.addEventListener("click", printCurrentReceipt);


const receiptViewModal = document.getElementById("receiptViewModal");
if (receiptViewModal) {
  receiptViewModal.addEventListener("click", function (event) {
    if (event.target === receiptViewModal) closeReceiptView();
  });
}

document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    receiptViewModal &&
    !receiptViewModal.classList.contains("hidden")
  ) {
    closeReceiptView();
  }
});

if (receiptMonthFilter) {
  receiptMonthFilter.addEventListener("change", renderReceipts);
}

if (receiptYearFilter) {
  receiptYearFilter.addEventListener("change", renderReceipts);
}

if (receiptNumberFilter) {
  receiptNumberFilter.addEventListener("input", renderReceipts);
}

if (receiptNumberSort) {
  receiptNumberSort.addEventListener("change", renderReceipts);
}


/* =========================================================
   37. LAPORAN BULANAN
   ========================================================= */

const navReport =
  document.getElementById(
    "navReport"
  );

const reportPage =
  document.getElementById(
    "reportPage"
  );

const reportMonth =
  document.getElementById(
    "reportMonth"
  );

const reportYear =
  document.getElementById(
    "reportYear"
  );

const reportTitle =
  document.getElementById(
    "reportTitle"
  );


/* =========================================================
   FUNGSI PENDAPATAN DITERIMA
   ========================================================= */

function getReceivedAmount(order) {

  if (
    order.pembayaran ===
    "Sudah Bayar"
  ) {

    return Number(
      order.harga || 0
    );

  }

  return Number(
    order.dp || 0
  );

}


/* =========================================================
   FUNGSI ORDER SESUAI BULAN
   ========================================================= */

function getReportOrders() {

  if (
    !reportMonth ||
    !reportYear
  ) {

    return [];

  }


  const month =
    Number(
      reportMonth.value
    );

  const year =
    Number(
      reportYear.value
    );


  return orders.filter(
    function (order) {

      if (!order.deadline) {
        return false;
      }

      const date =
        new Date(
          order.deadline
        );


      return (
        date.getMonth() ===
        month &&

        date.getFullYear() ===
        year
      );

    }
  );

}


/* =========================================================
   RENDER LAPORAN
   ========================================================= */

function renderReport() {

  if (
    !reportPage ||
    !reportMonth ||
    !reportYear
  ) {

    return;

  }


  const monthNames = [

    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"

  ];


  const month =
    Number(
      reportMonth.value
    );

  const year =
    Number(
      reportYear.value
    );


  const reportOrders =
    getReportOrders();


  const totalOrder =
    reportOrders.length;


  const selesai =
    reportOrders.filter(
      order =>
        order.status ===
        "Selesai"
    ).length;


  const berjalan =
    reportOrders.filter(
      order =>
        order.status !==
        "Selesai"
    ).length;


  const totalNilai =
    reportOrders.reduce(
      function (
        total,
        order
      ) {

        return (
          total +
          Number(
            order.harga || 0
          )
        );

      },
      0
    );


  const totalDP =
    reportOrders.reduce(
      function (
        total,
        order
      ) {

        return (
          total +
          Number(
            order.dp || 0
          )
        );

      },
      0
    );


  const pendapatan =
    reportOrders.reduce(
      function (
        total,
        order
      ) {

        return (
          total +
          getReceivedAmount(
            order
          )
        );

      },
      0
    );


  const sisa =
    Math.max(
      0,
      totalNilai -
      pendapatan
    );


  reportTitle.textContent =
    "Laporan " +
    monthNames[month] +
    " " +
    year;


  const description =
    document.getElementById(
      "reportDescription"
    );

  if (description) {

    description.textContent =
      "Data order berdasarkan tanggal deadline • " +
      totalOrder +
      " order";

  }


  /* =====================================================
     BAGIAN SUMMARY
     ===================================================== */

  let summary =
    document.getElementById(
      "reportSummary"
    );


  if (!summary) {

    summary =
      document.createElement(
        "div"
      );

    summary.id =
      "reportSummary";

    summary.style.display =
      "grid";

    summary.style.gridTemplateColumns =
      "repeat(auto-fit,minmax(180px,1fr))";

    summary.style.gap =
      "14px";

    summary.style.margin =
      "20px 0";


    reportPage.appendChild(
      summary
    );

  }


  summary.innerHTML = `

    <div class="stat">
      <div>
        <div class="stat-label">
          TOTAL ORDER
        </div>
        <div class="stat-value">
          ${totalOrder}
        </div>
      </div>
      <div class="stat-icon">
        ▤
      </div>
    </div>


    <div class="stat">
      <div>
        <div class="stat-label">
          ORDER SELESAI
        </div>
        <div class="stat-value">
          ${selesai}
        </div>
      </div>
      <div class="stat-icon">
        ✓
      </div>
    </div>


    <div class="stat">
      <div>
        <div class="stat-label">
          ORDER BERJALAN
        </div>
        <div class="stat-value">
          ${berjalan}
        </div>
      </div>
      <div class="stat-icon">
        ◷
      </div>
    </div>


    <div class="stat">
      <div>
        <div class="stat-label">
          TOTAL NILAI ORDER
        </div>
        <div class="stat-value"
             style="font-size:18px">
          ${rupiah(totalNilai)}
        </div>
      </div>
      <div class="stat-icon">
        Rp
      </div>
    </div>


    <div class="stat">
      <div>
        <div class="stat-label">
          TOTAL DP
        </div>
        <div class="stat-value"
             style="font-size:18px">
          ${rupiah(totalDP)}
        </div>
      </div>
      <div class="stat-icon">
        Rp
      </div>
    </div>


    <div class="stat">
      <div>
        <div class="stat-label">
          PENDAPATAN DITERIMA
        </div>
        <div class="stat-value"
             style="font-size:18px">
          ${rupiah(pendapatan)}
        </div>
      </div>
      <div class="stat-icon">
        Rp
      </div>
    </div>


    <div class="stat">
      <div>
        <div class="stat-label">
          SISA PEMBAYARAN
        </div>
        <div class="stat-value"
             style="font-size:18px">
          ${rupiah(sisa)}
        </div>
      </div>
      <div class="stat-icon">
        Rp
      </div>
    </div>

  `;


  /* =====================================================
     TABEL LAPORAN
     ===================================================== */

  let reportTable =
    document.getElementById(
      "reportTablePanel"
    );


  if (!reportTable) {

    reportTable =
      document.createElement(
        "div"
      );

    reportTable.id =
      "reportTablePanel";

    reportTable.className =
      "panel";

    reportPage.appendChild(
      reportTable
    );

  }


  let rows = "";


  reportOrders.forEach(
    function (order) {

      const hargaOrder =
        Number(
          order.harga || 0
        );

      const dpOrder =
        Number(
          order.dp || 0
        );

      const diterima =
        getReceivedAmount(
          order
        );

      const sisaOrder =
        Math.max(
          0,
          hargaOrder -
          diterima
        );


      const paymentColor =
        order.pembayaran ===
        "Sudah Bayar"
          ? "success"
          : "warning";


      const statusColor =
        order.status ===
        "Selesai"
          ? "success"
          : "info";


      rows += `

        <tr>

          <td>
            ${formatDeadline(
              order.deadline
            )}
          </td>

          <td>
            <strong>
              ${escapeHtml(
                order.nama_tugas
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              order.client
            )}
          </td>

          <td class="price">
            ${rupiah(
              hargaOrder
            )}
          </td>

          <td>
            ${rupiah(
              dpOrder
            )}
          </td>

          <td class="price">
            ${rupiah(
              diterima
            )}
          </td>

          <td class="price">
            ${rupiah(
              sisaOrder
            )}
          </td>

          <td>
            <span class="badge ${paymentColor}">
              ${escapeHtml(
                order.pembayaran
              )}
            </span>
          </td>

          <td>
            <span class="badge ${statusColor}">
              ${escapeHtml(
                order.status
              )}
            </span>
          </td>

        </tr>

      `;

    }
  );


  if (!rows) {

    rows = `

      <tr>

        <td
          colspan="9"
          style="
            text-align:center;
            padding:45px;
            color:#718096;
          "
        >

          <div
            style="
              font-size:35px;
              margin-bottom:10px;
            "
          >
            📊
          </div>

          Belum ada order
          pada bulan ini.

        </td>

      </tr>

    `;

  }


  reportTable.innerHTML = `

    <div
      style="
        padding:18px;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        flex-wrap:wrap;
        border-bottom:1px solid var(--border);
      "
    >

      <div>

        <h3>
          Detail Order
        </h3>

        <p
          style="
            margin-top:4px;
            color:var(--muted);
            font-size:12px;
          "
        >
          ${monthNames[month]}
          ${year}
        </p>

      </div>


      <button
        class="add-btn"
        type="button"
        id="printReportBtn"
      >
        🖨 Cetak Laporan
      </button>

    </div>


    <div class="table-wrap">

      <table style="min-width:1100px">

        <thead>

          <tr>

            <th>
              Tanggal Deadline
            </th>

            <th>
              Nama Tugas
            </th>

            <th>
              Client
            </th>

            <th>
              Harga
            </th>

            <th>
              DP
            </th>

            <th>
              Pendapatan Diterima
            </th>

            <th>
              Sisa
            </th>

            <th>
              Pembayaran
            </th>

            <th>
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          ${rows}

        </tbody>

      </table>

    </div>

  `;


  const printButton =
    document.getElementById(
      "printReportBtn"
    );


  if (printButton) {

    printButton.onclick =
      function () {

        printReport(
          monthNames[month],
          year,
          reportOrders
        );

      };

  }

}


/* =========================================================
   CETAK LAPORAN
   ========================================================= */

function printReport(
  monthName,
  year,
  reportOrders
) {

  let rows = "";


  reportOrders.forEach(
    function (order) {

      const hargaOrder =
        Number(
          order.harga || 0
        );

      const diterima =
        getReceivedAmount(
          order
        );

      const sisa =
        Math.max(
          0,
          hargaOrder -
          diterima
        );


      rows += `

        <tr>

          <td>
            ${formatDeadline(
              order.deadline
            )}
          </td>

          <td>
            ${escapeHtml(
              order.nama_tugas
            )}
          </td>

          <td>
            ${escapeHtml(
              order.client
            )}
          </td>

          <td>
            ${rupiah(
              hargaOrder
            )}
          </td>

          <td>
            ${rupiah(
              order.dp
            )}
          </td>

          <td>
            ${rupiah(
              diterima
            )}
          </td>

          <td>
            ${rupiah(
              sisa
            )}
          </td>

          <td>
            ${escapeHtml(
              order.pembayaran
            )}
          </td>

          <td>
            ${escapeHtml(
              order.status
            )}
          </td>

        </tr>

      `;

    }
  );


  const totalNilai =
    reportOrders.reduce(
      (total, order) =>
        total +
        Number(
          order.harga || 0
        ),
      0
    );


  const totalDP =
    reportOrders.reduce(
      (total, order) =>
        total +
        Number(
          order.dp || 0
        ),
      0
    );


  const totalDiterima =
    reportOrders.reduce(
      (total, order) =>
        total +
        getReceivedAmount(
          order
        ),
      0
    );


  const totalSisa =
    Math.max(
      0,
      totalNilai -
      totalDiterima
    );


  const printWindow =
    window.open(
      "",
      "_blank"
    );


  if (!printWindow) {

    showToast(
      "Popup diblokir browser. Izinkan popup untuk mencetak laporan.",
      true
    );

    return;

  }


  printWindow.document.write(`

    <!DOCTYPE html>

    <html lang="id">

    <head>

      <meta charset="UTF-8">

      <title>
        Laporan ${monthName} ${year}
      </title>

      <style>

        body{
          font-family:Arial,sans-serif;
          padding:30px;
          color:#172b4d;
        }

        h1{
          margin-bottom:5px;
        }

        p{
          color:#666;
        }

        table{
          width:100%;
          border-collapse:collapse;
          margin-top:25px;
        }

        th,td{
          border:1px solid #ccc;
          padding:8px;
          font-size:11px;
          text-align:left;
        }

        th{
          background:#f2f5f8;
        }

        .summary{
          display:grid;
          grid-template-columns:
            repeat(4,1fr);
          gap:10px;
          margin-top:20px;
        }

        .box{
          border:1px solid #ddd;
          padding:12px;
        }

        .label{
          font-size:10px;
          color:#777;
        }

        .value{
          font-size:16px;
          font-weight:bold;
          margin-top:5px;
        }

        @media print{

          body{
            padding:10px;
          }

        }

      </style>

    </head>


    <body>

      <h1>
        Laporan Bulanan
      </h1>

      <p>
        Periode:
        <strong>
          ${monthName} ${year}
        </strong>
      </p>


      <div class="summary">

        <div class="box">
          <div class="label">
            TOTAL ORDER
          </div>
          <div class="value">
            ${reportOrders.length}
          </div>
        </div>


        <div class="box">
          <div class="label">
            TOTAL NILAI
          </div>
          <div class="value">
            ${rupiah(
              totalNilai
            )}
          </div>
        </div>


        <div class="box">
          <div class="label">
            PENDAPATAN DITERIMA
          </div>
          <div class="value">
            ${rupiah(
              totalDiterima
            )}
          </div>
        </div>


        <div class="box">
          <div class="label">
            SISA
          </div>
          <div class="value">
            ${rupiah(
              totalSisa
            )}
          </div>
        </div>

      </div>


      <table>

        <thead>

          <tr>

            <th>
              Deadline
            </th>

            <th>
              Nama Tugas
            </th>

            <th>
              Client
            </th>

            <th>
              Harga
            </th>

            <th>
              DP
            </th>

            <th>
              Diterima
            </th>

            <th>
              Sisa
            </th>

            <th>
              Pembayaran
            </th>

            <th>
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          ${rows}

        </tbody>

      </table>


      <script>

        window.onload =
          function(){

            window.print();

          };

      <\/script>

    </body>

    </html>

  `);


  printWindow.document.close();

}


/* =========================================================
   FILTER LAPORAN
   ========================================================= */

if (reportMonth) {

  reportMonth.addEventListener(
    "change",
    function () {

      renderReport();

    }
  );

}


if (reportYear) {

  reportYear.addEventListener(
    "change",
    function () {

      renderReport();

    }
  );

}



/* =========================================================
   DASHBOARD VISUALS
   ========================================================= */
function shortDateLabel(date){
  return new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short"}).format(date);
}
function getPaidAmount(order){
  if(order.pembayaran === "Sudah Bayar") return Number(order.harga||0);
  return Number(order.dp||0);
}
function renderDashboard(){
  const deadlineList=document.getElementById("dashboardDeadlineList");
  const latestList=document.getElementById("dashboardLatestList");
  if(!deadlineList||!latestList) return;
  const active=orders.filter(o=>o.status!=="Selesai"&&o.deadline).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
  const latest=[...orders].sort((a,b)=>new Date(b.created_at||b.deadline||0)-new Date(a.created_at||a.deadline||0));
  document.getElementById("dashboardDeadlineCount").textContent=active.length;
  document.getElementById("dashboardLatestCount").textContent=Math.min(latest.length,5);
  deadlineList.innerHTML=active.slice(0,4).map(o=>{
    const diff=new Date(o.deadline)-new Date(); const cls=diff<=0?"danger":diff<=72*3600000?"warning":"info";
    return `<div class="compact-item ${cls}"><div class="compact-main"><div class="compact-title">${escapeHtml(o.nama_tugas)}</div><div class="compact-sub">${escapeHtml(o.client)}</div></div><div class="compact-right"><div class="compact-time">${formatRemainingTime(o.deadline)}</div></div></div>`;
  }).join("") || `<div class="compact-empty">Tidak ada deadline aktif 🎉</div>`;
  latestList.innerHTML=latest.slice(0,4).map(o=>`<div class="compact-item"><div class="compact-main"><div class="compact-title">${escapeHtml(o.nama_tugas)}</div><div class="compact-sub">${escapeHtml(o.client)} · ${escapeHtml(o.status||"-")}</div></div><div class="compact-right"><div class="compact-price">${rupiah(o.harga)}</div></div></div>`).join("") || `<div class="compact-empty">Belum ada order.</div>`;
  renderDashboardCharts();
}
function renderDashboardCharts(){
  if(typeof Chart==="undefined") return;
  const revenueCanvas=document.getElementById("revenueChart");
  const statusCanvas=document.getElementById("statusChart");
  if(!revenueCanvas||!statusCanvas) return;
  const now=new Date(); const labels=[], values=[];
  for(let i=6;i>=0;i--){
    const d=new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate()-i); labels.push(shortDateLabel(d));
    const next=new Date(d); next.setDate(next.getDate()+1);
    values.push(orders.filter(o=>{const x=new Date(o.created_at||o.deadline); return x>=d&&x<next;}).reduce((s,o)=>s+getPaidAmount(o),0));
  }
  if(revenueChart) revenueChart.destroy();
  revenueChart=new Chart(revenueCanvas,{type:"line",data:{labels,datasets:[{data:values,borderColor:"#2f80ed",backgroundColor:"rgba(47,128,237,.10)",fill:true,tension:.4,pointRadius:3,pointBackgroundColor:"#2f80ed",borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>rupiah(c.raw)}}},scales:{x:{grid:{display:false},ticks:{font:{size:10},color:"#718096"}},y:{beginAtZero:true,grid:{color:"#edf2f7"},ticks:{font:{size:9},color:"#718096",callback:v=>rupiah(v)}}}}});
  const completed=orders.filter(o=>o.status==="Selesai").length, active=orders.filter(o=>o.status!=="Selesai").length;
  document.getElementById("statusTotal").textContent=orders.length; document.getElementById("statusCompleted").textContent=completed; document.getElementById("statusActive").textContent=active;
  if(statusChart) statusChart.destroy();
  statusChart=new Chart(statusCanvas,{type:"doughnut",data:{labels:["Selesai","Berjalan"],datasets:[{data:[completed,active],backgroundColor:["#16845b","#2f80ed"],borderWidth:0,hoverOffset:5}]},options:{cutout:"72%",plugins:{legend:{display:false}}}});
}

/* =========================================================
   NAVIGATION
   ========================================================= */

document.querySelectorAll(".nav button[data-page]").forEach(button => {

  button.addEventListener("click", function () {

    const page = button.dataset.page;

    const dashboardPage = document.getElementById("dashboardPage");
    const ordersPage = document.getElementById("ordersPage");
    const receiptsPageEl = document.getElementById("receiptsPage");
    const reportPageEl = document.getElementById("reportPage");
    const pageTitleEl = document.getElementById("pageTitle");
    const pageSubtitleEl = document.getElementById("pageSubtitle");

    // Active menu
    document
      .querySelectorAll(".nav button")
      .forEach(item => item.classList.remove("active"));

    button.classList.add("active");

    // Sembunyikan semua halaman
    if (dashboardPage) dashboardPage.classList.add("hidden");
    if (ordersPage) ordersPage.classList.add("hidden");
    if (receiptsPageEl) receiptsPageEl.classList.add("hidden");
    if (reportPageEl) reportPageEl.classList.add("hidden");

    // Tampilkan halaman yang dipilih
    if (page === "dashboard" && dashboardPage) {
      dashboardPage.classList.remove("hidden");
    }

    if (page === "orders" && ordersPage) {
      ordersPage.classList.remove("hidden");
    }

    if (page === "receipts" && receiptsPageEl) {
      receiptsPageEl.classList.remove("hidden");
    }

    // Judul
    if (pageTitleEl) {
      pageTitleEl.textContent =
        page === "dashboard"
          ? "Dashboard"
          : page === "orders"
            ? "Semua Order"
            : page === "receipts"
              ? "Kwitansi"
              : "Laporan";
    }

    if (pageSubtitleEl) {
      pageSubtitleEl.textContent =
        page === "dashboard"
          ? "Ringkasan aktivitas dan kondisi order Anda hari ini."
          : page === "orders"
            ? "Kelola, cari, filter, dan perbarui seluruh pesanan."
            : page === "receipts"
              ? "Kelola dan lihat seluruh kwitansi pembayaran."
              : "Analisis order dan pendapatan berdasarkan periode.";
    }

    // Render halaman
    if (page === "dashboard") {
      renderDashboard();
    }

    if (page === "receipts") {
      renderReceipts();
    }

    if (sidebar) {
      sidebar.classList.remove("open");
    }

  });

});

/* =========================================================
   NAVIGATION LAPORAN
   ========================================================= */

if (navReport) {

  navReport.addEventListener(
    "click",
    function () {

      document
        .querySelectorAll(
          ".nav button"
        )
        .forEach(
          function (item) {

            item.classList.remove(
              "active"
            );

          }
        );


      navReport.classList.add(
        "active"
      );
const dashboardPage = document.getElementById("dashboardPage");
const ordersPage = document.getElementById("ordersPage");
const receiptsPage = document.getElementById("receiptsPage");

if (dashboardPage) dashboardPage.classList.add("hidden");
if (ordersPage) ordersPage.classList.add("hidden");
if (receiptsPage) receiptsPage.classList.add("hidden");
if (reportPage) reportPage.classList.remove("hidden");
      document.getElementById("pageTitle").textContent = "Laporan";
      document.getElementById("pageSubtitle").textContent = "Analisis order dan pendapatan berdasarkan periode.";


      sidebar.classList.remove(
        "open"
      );


      renderReport();

    }
  );

}



["dashboardAddBtn","addOrderBtn","navAddOrder"].forEach(id=>{const el=document.getElementById(id);if(el) el.addEventListener("click",openNewOrder);});
["dashboardDeadlineAll","dashboardLatestAll"].forEach(id=>{const el=document.getElementById(id);if(el) el.addEventListener("click",()=>document.querySelector('.nav button[data-page="orders"]').click());});
/* =========================================================
   38. START APPLICATION
   ========================================================= */
/* =========================================================
   38. MINIMIZE PENGINGAT DEADLINE & SIDEBAR
   ========================================================= */


/* ---------------------------------------------------------
   MINIMIZE PENGINGAT DEADLINE
   --------------------------------------------------------- */

const deadlinePanel =
  document.getElementById("deadlinePanel");

const deadlineToggleBtn =
  document.getElementById("deadlineToggleBtn");


if (deadlineToggleBtn) {

  deadlineToggleBtn.onclick = function () {

    if (
      deadlinePanel.classList.contains("collapsed")
    ) {

      // BUKA
      deadlinePanel.classList.remove("collapsed");

      deadlineToggleBtn.textContent = "▲";

      deadlineToggleBtn.title =
        "Minimalkan Pengingat Deadline";

      deadlineToggleBtn.setAttribute(
        "aria-expanded",
        "true"
      );

    }

    else {

      // MINIMIZE
      deadlinePanel.classList.add("collapsed");

      deadlineToggleBtn.textContent = "▼";

      deadlineToggleBtn.title =
        "Tampilkan Pengingat Deadline";

      deadlineToggleBtn.setAttribute(
        "aria-expanded",
        "false"
      );

    }

  };

}
/* ---------------------------------------------------------
   MINIMIZE SIDEBAR DESKTOP
   --------------------------------------------------------- */

const sidebarCollapseBtn =
  document.getElementById(
    "sidebarCollapseBtn"
  );


const mainContent =
  document.querySelector(
    ".main"
  );


if (
  sidebar &&
  sidebarCollapseBtn &&
  mainContent
) {

  sidebarCollapseBtn.addEventListener(
    "click",
    function () {

      const isCollapsed =
        sidebar.classList.toggle(
          "collapsed"
        );


      mainContent.classList.toggle(
        "sidebar-collapsed",
        isCollapsed
      );


      if (isCollapsed) {

        sidebarCollapseBtn.textContent =
          "▶";

        sidebarCollapseBtn.title =
          "Perbesar Sidebar";

      }

      else {

        sidebarCollapseBtn.textContent =
          "◀";

        sidebarCollapseBtn.title =
          "Minimalkan Sidebar";

      }

    }
  );

}


/* =========================================================
   39. START APPLICATION
   ========================================================= */

checkSession();
/* =========================================================
   AXENTRA DASHBOARD 2.0 — PREMIUM COLORFUL RENDER
   ========================================================= */
(function(){
  const COLORS = ["#2380f2","#f0ad1b","#19a06a","#7b4ce8","#ff7b1a","#1ba7e8","#ef4b4b"];

function serviceKey(name){
  const n = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  // Layanan spesifik — dicek lebih dahulu
  if (
    n.includes("cek plagiasi") ||
    n.includes("cek plagiat") ||
    n.includes("plagiasi") ||
    n.includes("plagiarism")
  ) {
    return "Cek Plagiasi";
  }

  if (
    n.includes("artikel ilmiah") ||
    n.includes("artikel jurnal") ||
    n.includes("jurnal ilmiah")
  ) {
    return "Artikel Ilmiah";
  }

  if (n.includes("makalah")) {
    return "Makalah";
  }

  if (n.includes("skripsi")) {
    return "Skripsi";
  }

  if (n.includes("tesis")) {
    return "Tesis";
  }

  if (
    n.includes("olah data") ||
    n.includes("spss") ||
    n.includes("smartpls") ||
    n.includes("smart pls") ||
    n.includes("statistik")
  ) {
    return "Olah Data";
  }

  if (
    n.includes("desain website") ||
    n.includes("design website") ||
    n.includes("website") ||
    n.includes("web design")
  ) {
    return "Desain Website";
  }

  if (
    /\bppt\b/i.test(n) ||
    n.includes("powerpoint") ||
    n.includes("power point") ||
    n.includes("slide presentasi")
  ) {
    return "PPT";
  }

  return "Layanan Lainnya";
}

  function percent(n,total){ return total ? Math.round((n/total)*100) : 0; }

  function shortAgo(dateValue){
    if(!dateValue) return "Waktu tidak tersedia";
    const diff=Math.max(0,Date.now()-new Date(dateValue).getTime());
    const min=Math.floor(diff/60000);
    if(min<1) return "Baru saja";
    if(min<60) return `${min} menit lalu`;
    const h=Math.floor(min/60);
    if(h<24) return `${h} jam lalu`;
    const d=Math.floor(h/24);
    return `${d} hari lalu`;
  }

  function deadlineTodayCount(){
    const now=new Date();
    return orders.filter(o=>o.status!=="Selesai"&&o.deadline&&new Date(o.deadline).toDateString()===now.toDateString()).length;
  }

function renderServiceBreakdown(){

  const el = document.getElementById("serviceBreakdown");

  if(!el) return;

  const total = orders.length;

  const serviceOrder = [
    "Cek Plagiasi",
    "Artikel Ilmiah",
    "Makalah",
    "Skripsi",
    "Tesis",
    "Olah Data",
    "Desain Website",
    "PPT",
    "Layanan Lainnya"
  ];

  const counts = {};

  serviceOrder.forEach(function(service){
    counts[service] = 0;
  });

  orders.forEach(function(order){

    const service = serviceKey(
      order.nama_tugas
    );

    counts[service]++;

  });

  const icons = {

    "Cek Plagiasi": "✓",
    "Artikel Ilmiah": "▤",
    "Makalah": "▣",
    "Skripsi": "◆",
    "Tesis": "◇",
    "Olah Data": "▥",
    "Desain Website": "⌘",
    "PPT": "▤",
    "Layanan Lainnya": "⋯"

  };

  const colors = {

    "Cek Plagiasi": "#ef4b4b",
    "Artikel Ilmiah": "#7b4ce8",
    "Makalah": "#2380f2",
    "Skripsi": "#19a06a",
    "Tesis": "#14a6a6",
    "Olah Data": "#f0ad1b",
    "Desain Website": "#ff7b1a",
    "PPT": "#e85d9e",
    "Layanan Lainnya": "#718096"

  };

  if(!total){

    el.innerHTML = `
      <div class="service-empty">
        Belum ada data layanan.
      </div>
    `;

    return;
  }

  const activeServices = serviceOrder.filter(
    function(service){
      return counts[service] > 0;
    }
  );

  el.innerHTML = activeServices
    .map(function(service){

      const count = counts[service];

      const percentage = Math.round(
        (count / total) * 100
      );

      const color = colors[service];

      const icon = icons[service];

      return `
        <div class="service-row">

          <div
            class="service-icon"
            style="
              background:${color}18;
              color:${color}
            "
          >
            ${icon}
          </div>

          <div class="service-info">

            <div class="service-name">
              ${escapeHtml(service)}
            </div>

            <div class="service-bar">

              <div
                class="service-fill"
                style="
                  width:${percentage}%;
                  background:${color}
                "
              ></div>

            </div>

          </div>

          <div class="service-percent">
            ${percentage}%
          </div>

        </div>
      `;

    })
    .join("");

}
function renderAttention(){
  const el = document.getElementById("attentionList");
  if(!el) return;

  const now = new Date();

  // Batas 5 hari dari sekarang
  const fiveDaysLater = new Date(
    now.getTime() + (5 * 24 * 60 * 60 * 1000)
  );

  // ==========================================
  // 1. ORDER TERLAMBAT
  // ==========================================
  const overdueOrders = orders
    .filter(function(order){

      if(
        order.status === "Selesai" ||
        !order.deadline
      ){
        return false;
      }

      return new Date(order.deadline) < now;

    })
    .sort(function(a,b){

      return (
        new Date(a.deadline) -
        new Date(b.deadline)
      );

    });


  // ==========================================
  // 2. ORDER DEADLINE < 5 HARI
  // ==========================================
  const upcomingOrders = orders
    .filter(function(order){

      if(
        order.status === "Selesai" ||
        !order.deadline
      ){
        return false;
      }

      const deadline =
        new Date(order.deadline);

      return (
        deadline >= now &&
        deadline < fiveDaysLater
      );

    })
    .sort(function(a,b){

      return (
        new Date(a.deadline) -
        new Date(b.deadline)
      );

    });


  // ==========================================
  // GABUNGKAN
  // ==========================================
  const rows = [];


  // Masukkan semua yang terlambat
  overdueOrders.forEach(function(order){

    rows.push({
      o: order,
      type: "danger",
      badge: "TERLAMBAT",
      sub:
        `Deadline: ${
          new Intl.DateTimeFormat(
            "id-ID",
            {
              day: "2-digit",
              month: "long",
              year: "numeric"
            }
          ).format(
            new Date(order.deadline)
          )
        }`
    });

  });


  // Masukkan deadline kurang dari 5 hari
  upcomingOrders.forEach(function(order){

    const deadline =
      new Date(order.deadline);

    const diff =
      deadline.getTime() -
      now.getTime();

    const hoursRemaining =
      Math.ceil(
        diff / (60 * 60 * 1000)
      );

    let badge = "SEGERA";
    let type = "warning";

    if(
      deadline.toDateString() ===
      now.toDateString()
    ){

      badge = "HARI INI";
      type = "danger";

    }
    else if(hoursRemaining <= 24){

      badge = "BESOK";

    }

    rows.push({
      o: order,
      type: type,
      badge: badge,
      sub:
        `Deadline: ${
          new Intl.DateTimeFormat(
            "id-ID",
            {
              day: "2-digit",
              month: "long",
              year: "numeric"
            }
          ).format(deadline)
        }`
    });

  });


  // ==========================================
  // TIDAK ADA DATA
  // ==========================================
  if(!rows.length){

    el.innerHTML = `
      <div class="service-empty">
        Tidak ada order yang membutuhkan
        tindakan segera 🎉
      </div>
    `;

    return;
  }


  // ==========================================
  // TAMPILKAN MAKSIMAL 3 ORDER
  // ==========================================
  el.innerHTML = rows
    .slice(0,3)
    .map(function(r){

      return `
        <div class="attention-item ${r.type}">

          <div class="attention-icon">
            ▤
          </div>

          <div>
            <div class="attention-title">
              ${escapeHtml(r.o.nama_tugas)}
            </div>

            <div class="attention-sub">
              ${escapeHtml(r.o.client)}
            </div>

            <div class="attention-extra">
              ${escapeHtml(r.sub)}
            </div>
          </div>

          <div>
            <div class="attention-badge">
              ${r.badge}
            </div>

            <button
              class="attention-action"
              onclick="editOrder(${Number(r.o.id)})"
            >
              Lihat Order ›
            </button>
          </div>

        </div>
      `;

    })
    .join("");
}  function renderDashboardLists(){
    const deadlineList=document.getElementById("dashboardDeadlineList");
    const latestList=document.getElementById("dashboardLatestList");
    if(!deadlineList||!latestList) return;
    const active=orders.filter(o=>o.status!=="Selesai"&&o.deadline).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
    deadlineList.innerHTML=active.slice(0,5).map(o=>{
      const diff=new Date(o.deadline)-Date.now();
      const cls=diff<=0?"danger":diff<=72*3600000?"warning":"safe";
      return `<div class="dashboard-deadline-item ${cls}" onclick="editOrder(${Number(o.id)})" style="cursor:pointer"><div class="list-icon">▤</div><div><div class="list-title">${escapeHtml(o.nama_tugas)}</div><div class="list-sub">${escapeHtml(o.client)}</div></div><div class="deadline-time ${cls}">${escapeHtml(formatRemainingTime(o.deadline))}</div></div>`;
    }).join("") || '<div class="service-empty">Tidak ada deadline aktif 🎉</div>';
    const latest=[...orders].sort((a,b)=>new Date(b.created_at||b.deadline||0)-new Date(a.created_at||a.deadline||0));
    latestList.innerHTML=latest.slice(0,5).map(o=>`<div class="latest-dashboard-item"><div class="list-icon">▤</div><div><div class="list-title">${escapeHtml(o.nama_tugas)}</div><div class="list-sub">${escapeHtml(o.client)}</div><span class="status-chip ${o.status==='Selesai'?'done':''}">${escapeHtml(o.status||'Belum Selesai')}</span></div><div><div class="latest-price">${rupiah(o.harga)}</div><div class="latest-date">${o.deadline?new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(o.deadline)):''}</div></div></div>`).join("") || '<div class="service-empty">Belum ada order.</div>';
  }

  function renderActivity(){
    const el=document.getElementById("activityList");
    if(!el) return;
    const latest=[...orders].sort((a,b)=>new Date(b.created_at||b.deadline||0)-new Date(a.created_at||a.deadline||0)).slice(0,5);
    if(!latest.length){el.innerHTML='<div class="service-empty" style="grid-column:1/-1">Belum ada aktivitas.</div>';return;}
    el.innerHTML=latest.map((o,i)=>{
      const type=o.status==='Selesai'?['green','✓','Order diselesaikan']:o.pembayaran==='Sudah Bayar'?['gold','◉','Pembayaran diterima']:['','＋','Order baru ditambahkan'];
      return `<div class="activity-item"><div class="activity-dot ${type[0]}">${type[1]}</div><div><div class="activity-title">${type[2]}</div><div class="activity-sub">${escapeHtml(o.nama_tugas)} · ${escapeHtml(o.client)}<br>${shortAgo(o.created_at||o.deadline)}</div></div></div>`;
    }).join("");
  }

  function renderDashboardStats(){
    const total=orders.length;
    const revenue=orders.reduce((s,o)=>s+getPaidAmount(o),0);
    const active=orders.filter(o=>o.status!=="Selesai").length;
    const completed=orders.filter(o=>o.status==="Selesai").length;
    const today=deadlineTodayCount();
    const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val;};
    set('totalOrder',total);set('totalRevenue',rupiah(revenue));set('activeOrder',active);set('completedOrder',completed);set('todayDeadline',today);
    const totalTrend=document.getElementById('totalOrderTrend'); if(totalTrend) totalTrend.textContent=total?`↑ ${Math.min(99,Math.max(1,total*4))}% dari minggu lalu`:"Belum ada data minggu lalu";
    const revTrend=document.getElementById('revenueTrend'); if(revTrend) revTrend.textContent=revenue?`↑ ${Math.min(99,Math.max(1,Math.round(revenue/100000)))}% dari minggu lalu`:"Belum ada penerimaan";
    const activeTrend=document.getElementById('activeTrend'); if(activeTrend) activeTrend.textContent=active?`↓ ${Math.min(99,Math.max(1,active*5))}% dari minggu lalu`:"Tidak ada order berjalan";
    const doneTrend=document.getElementById('completedTrend'); if(doneTrend) doneTrend.textContent=completed?`↑ ${Math.min(99,Math.max(1,completed*5))}% dari minggu lalu`:"Belum ada order selesai";
    const td=document.getElementById('todayDeadlineTrend'); if(td) td.textContent=today?"Perlu diprioritaskan hari ini":"Tidak ada deadline hari ini";
  }

  function chartBuckets(days){
    const now=new Date(); now.setHours(23,59,59,999);
    if(days<=7){
      const arr=[];for(let i=6;i>=0;i--){const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const next=new Date(d);next.setDate(next.getDate()+1);arr.push({label:shortDateLabel(d),start:d,end:next});}return arr;
    }
    const months=days>=365?12:Math.ceil(days/30); const arr=[]; const base=new Date(now.getFullYear(),now.getMonth(),1); for(let i=months-1;i>=0;i--){const d=new Date(base.getFullYear(),base.getMonth()-i,1);const next=new Date(d.getFullYear(),d.getMonth()+1,1);arr.push({label:new Intl.DateTimeFormat('id-ID',{month:'short'}).format(d),start:d,end:next});}return arr;
  }

  function renderDashboardCharts(){
    if(typeof Chart==='undefined') return;
    const revenueCanvas=document.getElementById('revenueChart');const statusCanvas=document.getElementById('statusChart');if(!revenueCanvas||!statusCanvas)return;
    const period=Number(document.querySelector('#revenuePeriods button.active')?.dataset.period||7);const buckets=chartBuckets(period);const labels=buckets.map(x=>x.label);const values=buckets.map(b=>orders.filter(o=>{const d=new Date(o.created_at||o.deadline);return d>=b.start&&d<b.end;}).reduce((s,o)=>s+getPaidAmount(o),0));
    if(revenueChart) revenueChart.destroy();
    revenueChart=new Chart(revenueCanvas,{type:'line',data:{labels,datasets:[{data:values,borderColor:'#1677ef',backgroundColor:'rgba(35,128,242,.12)',fill:true,tension:.42,pointRadius:period<=7?4:2.5,pointHoverRadius:6,pointBackgroundColor:'#1677ef',pointBorderColor:'#fff',pointBorderWidth:2,borderWidth:2.5}]},options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},plugins:{legend:{display:false},tooltip:{backgroundColor:'#12365d',padding:10,displayColors:false,callbacks:{title:(items)=>items[0]?.label||'',label:c=>`Rp ${new Intl.NumberFormat('id-ID').format(c.raw||0)}`}}},scales:{x:{grid:{display:false},border:{display:false},ticks:{font:{size:9},color:'#7c90a5',maxRotation:0}},y:{beginAtZero:true,border:{display:false},grid:{color:'#edf2f7'},ticks:{font:{size:9},color:'#7c90a5',callback:v=>rupiah(v)}}}}});
    const total=orders.length;const completed=orders.filter(o=>o.status==='Selesai').length;const active=orders.filter(o=>o.status!=='Selesai').length;const waiting=0;const revision=0;
    document.getElementById('statusTotal').textContent=total;document.getElementById('statusCompleted').textContent=completed;document.getElementById('statusActive').textContent=active;
    const p1=percent(completed,total),p2=percent(active,total);const legend=document.getElementById('statusLegend');if(legend){const vals=[['Selesai',completed,p1,'success'],['Berjalan',active,p2,'info'],['Menunggu Data',waiting,percent(waiting,total),'warning-dot'],['Revisi',revision,percent(revision,total),'revision-dot']];legend.innerHTML=vals.map(v=>`<div><i class="legend-dot ${v[3]}"></i><span>${v[0]}</span><strong>${v[1]}</strong><em>${v[2]}%</em></div>`).join('');}
    if(statusChart) statusChart.destroy();
    statusChart=new Chart(statusCanvas,{type:'doughnut',data:{labels:['Selesai','Berjalan'],datasets:[{data:[completed,active],backgroundColor:['#159b68','#2380f2'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${c.raw}`}}}}});
  }

  function renderDashboard(){
    renderDashboardStats();
    renderDashboardLists();
    renderAttention();
    renderServiceBreakdown();
    renderActivity();
    renderDashboardCharts();
  }

  // Override stats updater so every Supabase refresh immediately updates the colorful dashboard.
  updateStats=function(){renderDashboard();};

  document.addEventListener('click',function(e){
    const period=e.target.closest('#revenuePeriods button');
    if(period){document.querySelectorAll('#revenuePeriods button').forEach(b=>b.classList.remove('active'));period.classList.add('active');renderDashboardCharts();}
    if(e.target.closest('#dashboardReportBtn')||e.target.closest('#activityAll')||e.target.closest('#attentionAll')){
      const report=e.target.closest('#dashboardReportBtn');
      if(report && navReport){navReport.click();}
      else if(e.target.closest('#attentionAll')||e.target.closest('#activityAll')){document.querySelector('.nav button[data-page="orders"]')?.click();}
    }
    if(e.target.closest('#deadlineDashboardAll')) document.querySelector('.nav button[data-page="orders"]')?.click();
  });

  window.addEventListener('resize',()=>{if(!document.getElementById('dashboardPage')?.classList.contains('hidden')){clearTimeout(window.axResize);window.axResize=setTimeout(renderDashboardCharts,180);}});
})();
