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


    /* UPDATE */

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

    /* INSERT */

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


    closeOrderModal();


    showToast(
      editingId
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


      /* SEARCH */

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


      /* STATUS */

      const matchesStatus =

        !selectedStatus ||

        order.status ===
        selectedStatus;


      /* PAYMENT */

      const matchesPayment =

        !selectedPayment ||

        order.pembayaran ===
        selectedPayment;


      /* DEADLINE */

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

        return (
          totalAmount +
          Number(
            order.harga || 0
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
   24. OPEN ADD ORDER MODAL
   ========================================================= */

function openNewOrder() {

  editingId = null;

  orderForm.reset();

  orderId.value = "";

  modalTitle.textContent =
    "Tambah Order";


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
   37. NAVIGATION
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
   38. START APPLICATION
   ========================================================= */

checkSession();