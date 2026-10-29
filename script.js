
const $ = (id) => document.getElementById(id);

const ADMIN_EMAIL = "admin@sweetcreation.local";
const ADMIN_PASSWORD = "Admin123!";

const defaultProducts = [
  { id: 1, name: "Birthday Cake", price: 650, image: "cake1.jpg", description: "A sweet centerpiece for your special day." },
  { id: 2, name: "Chocolate Cake", price: 550, image: "cake2.jpg", description: "A delicious choice for chocolate lovers." },
  { id: 3, name: "Strawberry Cake", price: 600, image: "cake3.jpg", description: "A lovely cake for sweet moments." },
  { id: 4, name: "Custom Cake", price: 800, image: "cake4.jpg", description: "A personalized cake for your celebration." },
  { id: 5, name: "Special Occasion Cake", price: 750, image: "cake5.jpg", description: "Make your memorable moments sweeter." }
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProducts() {
  return readStorage("scj_products", defaultProducts);
}

function getUsers() {
  return readStorage("scj_users", []);
}

function getOrders() {
  return readStorage("scj_orders", []);
}

function getCart() {
  return readStorage("scj_cart", []);
}

function currentUser() {
  return readStorage("scj_session", null);
}

function money(amount) {
  return Number(amount).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function isAdmin() {
  return currentUser()?.role === "admin";
}

function isCustomer() {
  return currentUser()?.role === "customer";
}

// Navigation and protected sections
function showPage() {
  const page = location.hash.replace("#", "") || "home";
  const protectedPages = ["dashboard", "cart"];

  if (protectedPages.includes(page) && !currentUser()) {
    location.hash = "login";
    notify("Please log in first.");
    return;
  }

  if (page === "dashboard" && isAdmin() === false &&
      currentUser()?.role !== "customer") {
    location.hash = "login";
    return;
  }

  if (page === "cart" && !isCustomer()) {
    location.hash = isAdmin() ? "dashboard" : "login";
    notify("Please log in as a customer to use the cart.");
    return;
  }

  document.querySelectorAll("main > section").forEach((section) => {
    section.hidden = section.id !== page;
  });

  // Keep public sections visible when visiting the homepage.
  if (page === "home") {
    ["home", "about", "products", "contact"].forEach((id) => {
      $(id).hidden = false;
    });
  }

  // Public sections remain available when navigating to their anchors.
  if (["about", "products", "contact"].includes(page)) {
    ["home", "about", "products", "contact"].forEach((id) => {
      $(id).hidden = false;
    });
  }

  $("loginNav").hidden = !!currentUser();
  $("registerNav").hidden = !!currentUser();
  $("dashboardNav").hidden = !currentUser();
  $("cartNav").hidden = !isCustomer();
  $("logoutBtn").hidden = !currentUser();

  $("navbar").classList.remove("open");

  if (page === "dashboard") renderDashboard();
  if (page === "cart") renderCart();
  renderProducts();
  updateCartCount();
}

$("menuToggle").addEventListener("click", () => {
  $("navbar").classList.toggle("open");
});

$("navbar").querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => $("navbar").classList.remove("open"));
});

// Product browsing and searching
function renderProducts() {
  const search = ($("productSearch").value || "").toLowerCase().trim();
  const products = getProducts().filter((product) =>
    (product.name + " " + product.description).toLowerCase().includes(search)
  );

  $("productGrid").innerHTML = products.length
    ? products.map((product) => `
      <article class="cake-card">
        <img src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
          onerror="this.style.visibility='hidden'">
        <div class="cake-info">
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.description)}</p>
          <p class="price">${money(product.price)}</p>
          ${isCustomer()
            ? `<button class="order-btn" data-add="${product.id}">Add to Cart</button>`
            : `<a class="order-btn" href="#login">Login to Purchase</a>`}
        </div>
      </article>
    `).join("")
    : "<p>No products found.</p>";

  $("productGrid").querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.add)));
  });
}

$("productSearch").addEventListener("input", renderProducts);

function updateCartCount() {
  $("cartCount").textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function addToCart(productId) {
  if (!isCustomer()) {
    location.hash = "login";
    return;
  }

  const products = getProducts();
  if (!products.some((product) => product.id === productId)) return;

  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  saveStorage("scj_cart", cart);
  updateCartCount();
  notify("Cake added to your cart!");
}

// Customer registration
$("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;

  if (email === ADMIN_EMAIL) {
    notify("That email is reserved for the Admin.");
    return;
  }

  const users = getUsers();
  if (users.some((user) => user.email === email)) {
    notify("That email is already registered.");
    return;
  }

  users.push({
    id: Date.now(),
    name,
    email,
    password,
    role: "customer"
  });

  saveStorage("scj_users", users);
  $("registerForm").reset();
  notify("Registration successful. Please log in.");
  location.hash = "login";
});

// Login
$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    saveStorage("scj_session", {
      name: "Administrator",
      email: ADMIN_EMAIL,
      role: "admin"
    });

    $("loginForm").reset();
    notify("Welcome, Admin!");
    location.hash = "dashboard";
    return;
  }

  const user = getUsers().find((item) =>
    item.email === email && item.password === password
  );

  if (!user) {
    notify("Incorrect email or password.");
    return;
  }

  saveStorage("scj_session", {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "customer"
  });

  $("loginForm").reset();
  notify("Welcome, " + user.name + "!");
  location.hash = "dashboard";
});

// Logout
$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("scj_session");
  localStorage.removeItem("scj_cart");
  notify("You have logged out.");
  location.hash = "home";
});

// Shopping cart
function renderCart() {
  const cart = getCart();
  const products = getProducts();
  let total = 0;

  const lines = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return "";

    const subtotal = Number(product.price) * item.quantity;
    total += subtotal;

    return `
      <div class="data-row">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <p>${money(product.price)} each · Quantity: ${item.quantity}</p>
          <p>Subtotal: ${money(subtotal)}</p>
        </div>
        <div class="data-actions">
          <button class="secondary-btn" data-minus="${product.id}">−</button>
          <button class="secondary-btn" data-plus="${product.id}">+</button>
          <button class="danger-btn" data-remove="${product.id}">Remove</button>
        </div>
      </div>`;
  }).filter(Boolean);

  $("cartItems").innerHTML = lines.length
    ? `<div class="data-list">${lines.join("")}</div>`
    : "<p>Your cart is empty. Browse our products to add cakes.</p>";

  $("cartTotal").textContent = money(total);
  $("checkoutBtn").disabled = cart.length === 0;

  $("cartItems").querySelectorAll("[data-minus]").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(Number(button.dataset.minus), -1));
  });

  $("cartItems").querySelectorAll("[data-plus]").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(Number(button.dataset.plus), 1));
  });

  $("cartItems").querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      saveStorage("scj_cart", getCart().filter(
        (item) => item.productId !== Number(button.dataset.remove)
      ));
      renderCart();
      updateCartCount();
    });
  });
}

function changeQuantity(productId, amount) {
  const cart = getCart();
  const item = cart.find((entry) => entry.productId === productId);
  if (!item) return;

  item.quantity += amount;
  saveStorage("scj_cart", cart.filter((entry) => entry.quantity > 0));
  renderCart();
  updateCartCount();
}

// Place an order (demo only; no payment processing)
$("checkoutBtn").addEventListener("click", () => {
  const user = currentUser();
  if (!user || user.role !== "customer") {
    notify("Please log in as a customer.");
    location.hash = "login";
    return;
  }

  const cart = getCart();
  const products = getProducts();

  if (!cart.length) {
    notify("Your cart is empty.");
    return;
  }

  const items = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;
    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: item.quantity
    };
  }).filter(Boolean);

  if (!items.length) {
    notify("The products in your cart are no longer available.");
    saveStorage("scj_cart", []);
    renderCart();
    updateCartCount();
    return;
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orders = getOrders();

  orders.push({
    id: Date.now(),
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    items,
    total,
    status: "Pending",
    date: new Date().toLocaleString()
  });

  saveStorage("scj_orders", orders);
  saveStorage("scj_cart", []);
  updateCartCount();
  notify("Order placed! Your order status is Pending.");
  location.hash = "dashboard";
});

// Dashboard
function renderDashboard() {
  const user = currentUser();
  if (!user) return;

  $("dashboardTitle").textContent =
    user.role === "admin" ? "Admin Dashboard" : "User Dashboard";
  $("welcomeText").textContent = "Welcome, " + user.name + "!";

  $("adminDashboard").hidden = user.role !== "admin";
  $("userDashboard").hidden = user.role !== "customer";

  if (user.role === "admin") renderAdminDashboard();
  else renderUserDashboard(user);
}

function renderUserDashboard(user) {
  const orders = getOrders().filter((order) => order.customerId === user.id);
  $("userOrderCount").textContent = orders.length;
  $("userCartCount").textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);

  $("userOrders").innerHTML = orders.length
    ? `<div class="data-list">${orders.slice().reverse().map((order) => `
      <div class="data-row">
        <div>
          <strong>Order #${order.id}</strong>
          <p>${escapeHTML(order.date)}</p>
          <p>${order.items.map((item) =>
            `${escapeHTML(item.name)} × ${item.quantity}`
          ).join(", ")}</p>
          <p><strong>Total: ${money(order.total)}</strong></p>
        </div>
        <span class="status">${escapeHTML(order.status)}</span>
      </div>
    `).join("")}</div>`
    : "<p>You have not placed any orders yet.</p>";
}

function renderAdminDashboard() {
  const products = getProducts();
  const users = getUsers();
  const orders = getOrders();

  $("adminProductCount").textContent = products.length;
  $("adminUserCount").textContent = users.length;
  $("adminOrderCount").textContent = orders.length;

  $("adminProducts").innerHTML = products.length
    ? `<div class="data-list">${products.map((product) => `
      <div class="data-row">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <p>${money(product.price)}</p>
          <p>${escapeHTML(product.description)}</p>
          <p>Image: ${escapeHTML(product.image)}</p>
        </div>
        <div class="data-actions">
          <button class="secondary-btn" data-edit="${product.id}">Edit Price</button>
          <button class="danger-btn" data-delete="${product.id}">Delete</button>
        </div>
      </div>
    `).join("")}</div>`
    : "<p>No products available.</p>";

  $("adminProducts").querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!confirm("Delete this product?")) return;
      const id = Number(button.dataset.delete);
      saveStorage("scj_products", getProducts().filter((p) => p.id !== id));
      saveStorage("scj_cart", getCart().filter((item) => item.productId !== id));
      renderAdminDashboard();
      renderProducts();
      notify("Product deleted.");
    });
  });

  $("adminProducts").querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.edit);
      const product = getProducts().find((p) => p.id === id);
      if (!product) return;

      const answer = prompt("Enter the new price for " + product.name, product.price);
      if (answer === null) return;

      const price = Number(answer);
      if (!Number.isFinite(price) || price <= 0) {
        notify("Enter a valid price.");
        return;
      }

      const products = getProducts().map((p) =>
        p.id === id ? { ...p, price } : p
      );

      saveStorage("scj_products", products);
      renderAdminDashboard();
      renderProducts();
      notify("Product price updated.");
    });
  });

  $("adminOrders").innerHTML = orders.length
    ? `<div class="data-list">${orders.slice().reverse().map((order) => `
      <div class="data-row">
        <div>
          <strong>Order #${order.id}</strong>
          <p>Customer: ${escapeHTML(order.customerName)} (${escapeHTML(order.customerEmail)})</p>
          <p>${escapeHTML(order.date)}</p>
          <p>${order.items.map((item) =>
            `${escapeHTML(item.name)} × ${item.quantity}`
          ).join(", ")}</p>
          <p><strong>${money(order.total)}</strong></p>
          <span class="status">${escapeHTML(order.status)}</span>
        </div>
        <div class="data-actions">
          <select data-status="${order.id}" aria-label="Change order status">
            ${["Pending", "Approved", "Preparing", "Completed", "Cancelled"].map((status) =>
              `<option ${order.status === status ? "selected" : ""}>${status}</option>`
            ).join("")}
          </select>
          <button class="secondary-btn" data-save-status="${order.id}">Update</button>
        </div>
      </div>
    `).join("")}</div>`
    : "<p>No orders have been placed yet.</p>";

  $("adminOrders").querySelectorAll("[data-save-status]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.saveStatus);
      const select = $("adminOrders").querySelector(`[data-status="${id}"]`);
      const orders = getOrders().map((order) =>
        order.id === id ? { ...order, status: select.value } : order
      );
      saveStorage("scj_orders", orders);
      renderAdminDashboard();
      notify("Order status updated.");
    });
  });

  $("adminUsers").innerHTML = users.length
    ? `<div class="data-list">${users.map((user) => `
      <div class="data-row">
        <div>
          <strong>${escapeHTML(user.name)}</strong>
          <p>${escapeHTML(user.email)}</p>
          <p>Role: Customer</p>
        </div>
      </div>
    `).join("")}</div>`
    : "<p>No registered customers yet.</p>";
}

// Add product
$("productForm").addEventListener("submit", (event) => {
  event.preventDefault();

  if (!isAdmin()) {
    notify("Admin access required.");
    return;
  }

  const name = $("newProductName").value.trim();
  const price = Number($("newProductPrice").value);
  const image = $("newProductImage").value.trim();
  const description = $("newProductDescription").value.trim();

  if (!name || !image || !description || !Number.isFinite(price) || price <= 0) {
    notify("Please enter valid product details.");
    return;
  }

  const products = getProducts();
  products.push({
    id: Date.now(),
    name,
    price,
    image,
    description
  });

  saveStorage("scj_products", products);
  $("productForm").reset();
  renderAdminDashboard();
  renderProducts();
  notify("New cake product added.");
});

// Initial setup
if (!localStorage.getItem("scj_products")) {
  saveStorage("scj_products", defaultProducts);
}

window.addEventListener("hashchange", showPage);
showPage();
