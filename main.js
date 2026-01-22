<<<<<<< HEAD
(function () {
  const modal = document.getElementById("authModal");
  const closeBtn = document.getElementById("authCloseBtn");

  // Change this selector to match your button
  // Example: <button id="writeOrderBtn">Write my order</button>
  const writeOrderBtn = document.getElementById("writeOrderBtn");

  function openModal() {
    modal.classList.add("modalOpen");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.remove("modalOpen");
    modal.setAttribute("aria-hidden", "true");
  }

  if (writeOrderBtn) {
    writeOrderBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  }

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  const tabButtons = Array.from(document.querySelectorAll(".tabBtn"));
  const panels = Array.from(document.querySelectorAll(".tabPanel"));

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("tabActive"));
      btn.classList.add("tabActive");

      const targetId = btn.getAttribute("data-tab");
      panels.forEach(p => p.classList.remove("tabVisible"));
      const target = document.getElementById(targetId);
      if (target) target.classList.add("tabVisible");
    });
  });

  // Placeholder form handling, replace with your backend endpoint later
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Login submitted. Connect this to your backend.");
      closeModal();
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Signup submitted. Connect this to your backend.");
      closeModal();
    });
  }
})();
=======
(function () {
  const modal = document.getElementById("authModal");
  const closeBtn = document.getElementById("authCloseBtn");

  // Change this selector to match your button
  // Example: <button id="writeOrderBtn">Write my order</button>
  const writeOrderBtn = document.getElementById("writeOrderBtn");

  function openModal() {
    modal.classList.add("modalOpen");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.remove("modalOpen");
    modal.setAttribute("aria-hidden", "true");
  }

  if (writeOrderBtn) {
    writeOrderBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  }

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  const tabButtons = Array.from(document.querySelectorAll(".tabBtn"));
  const panels = Array.from(document.querySelectorAll(".tabPanel"));

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("tabActive"));
      btn.classList.add("tabActive");

      const targetId = btn.getAttribute("data-tab");
      panels.forEach(p => p.classList.remove("tabVisible"));
      const target = document.getElementById(targetId);
      if (target) target.classList.add("tabVisible");
    });
  });

  // Placeholder form handling, replace with your backend endpoint later
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Login submitted. Connect this to your backend.");
      closeModal();
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Signup submitted. Connect this to your backend.");
      closeModal();
    });
  }
})();
>>>>>>> add-all-files
