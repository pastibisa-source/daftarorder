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

      dp:
        Number(
          dp.value || 0
        ),

      pembayaran:
        pembayaran.value,

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
              <div
                class="muted"
                style="margin-top:4px"
              >
                ${
                  escapeHtml(
                    order.keterangan
                  ).slice(
                    0,
                    55
                  )
                }${
                  order.keterangan.length > 55
                    ? "…"
                    : ""
                }
              </div>
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

  status.value =
    "Belum Selesai";

  orderModal.classList.remove(
    "hidden"
  );

  namaTugas.focus();

}


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
   NAVIGATION
   ========================================================= */

document
  .querySelectorAll(
    ".nav button[data-page]"
  )
  .forEach(
    function (button) {

      button.addEventListener(
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


          button.classList.add(
            "active"
          );


          const page =
            button.dataset.page;


          /* Tampilkan kembali dashboard/order */

          const content =
            document.querySelector(
              ".content"
            );


          if (content) {

            Array.from(
              content.children
            ).forEach(
              function (element) {

                element.classList.remove(
                  "hidden"
                );

              }
            );

          }


          /* Sembunyikan halaman laporan */

          if (reportPage) {

            reportPage.classList.add(
              "hidden"
            );

          }


          if (
            page ===
            "dashboard"
          ) {

            document.getElementById(
              "pageTitle"
            ).textContent =
              "Dashboard";


            document.getElementById(
              "sectionTitle"
            ).textContent =
              "Daftar Order";


            document.getElementById(
              "sectionDescription"
            ).textContent =
              "Semua pesanan yang tersimpan di sistem.";

          }


          else {

            document.getElementById(
              "pageTitle"
            ).textContent =
              "Semua Order";


            document.getElementById(
              "sectionTitle"
            ).textContent =
              "Semua Order";


            document.getElementById(
              "sectionDescription"
            ).textContent =
              "Kelola seluruh pesanan Anda.";

          }


          sidebar.classList.remove(
            "open"
          );

        }
      );

    }
  );


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


      const content =
        document.querySelector(
          ".content"
        );


      if (content) {

        Array.from(
          content.children
        ).forEach(
          function (element) {

            element.classList.add(
              "hidden"
            );

          }
        );

      }


      if (reportPage) {

        reportPage.classList.remove(
          "hidden"
        );

      }


      document.getElementById(
        "pageTitle"
      ).textContent =
        "Laporan";


      sidebar.classList.remove(
        "open"
      );


      renderReport();

    }
  );

}


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