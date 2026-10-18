// Fernwick Home Cleaning — interacciones de la landing.
// Nota para Tailwind: las clases que se agregan/quitan aquí se escriben completas
// ("hidden", "is-visible") para que el escáner de la CLI las encuentre.

// ===== Menú móvil =====
const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");

function setMenu(open) {
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
  menuToggle.querySelector('[data-icon="open"]').classList.toggle("hidden", open);
  menuToggle.querySelector('[data-icon="close"]').classList.toggle("hidden", !open);
  mobileMenu.classList.toggle("hidden", !open);
}

menuToggle.addEventListener("click", () => {
  setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

// Cerrar al elegir un enlace
mobileMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

// Cerrar con Escape y devolver el foco al botón
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuToggle.focus();
  }
});

// Cerrar si la pantalla pasa a tamaño desktop (breakpoint md de Tailwind = 48rem)
window.matchMedia("(min-width: 48rem)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

// ===== Animación de entrada al hacer scroll =====
// El CSS solo oculta [data-reveal] si el usuario no pidió reducir movimiento.
const revealItems = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// ===== Formulario de cotización =====
const form = document.getElementById("quote-form");
const success = document.getElementById("quote-success");
const successText = document.getElementById("quote-success-text");
const resetButton = document.getElementById("quote-reset");
const submitButton = form.querySelector('button[type="submit"]');
const dateInput = document.getElementById("date");
const serviceSelect = document.getElementById("service");

// Fecha local de hoy en formato YYYY-MM-DD (toISOString usaría UTC y podría dar el día equivocado)
function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

dateInput.min = todayISO();

// Reglas de validación: cada función devuelve un mensaje de error o "" si el valor es válido
const validators = {
  name: (value) => {
    if (!value) return "Please enter your name.";
    if (value.length < 2) return "Your name should have at least 2 characters.";
    return "";
  },
  email: (value) => {
    if (!value) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return "Enter a valid email, like name@example.com.";
    return "";
  },
  phone: (value) => {
    if (!value) return "Please enter your phone number.";
    if (value.replace(/\D/g, "").length < 10) return "Enter a phone number with at least 10 digits.";
    return "";
  },
  service: (value) => (value ? "" : "Please choose a service."),
  size: (value) => (value ? "" : "Please choose your home size."),
  date: (value) => {
    if (!value) return "Please choose a preferred date.";
    if (value < todayISO()) return "Choose today or a future date.";
    return "";
  },
};

function validateField(field) {
  const message = validators[field.name](field.value.trim());
  const error = document.getElementById(`${field.id}-error`);

  error.textContent = message;
  error.classList.toggle("hidden", !message);
  if (message) {
    field.setAttribute("aria-invalid", "true");
  } else {
    field.removeAttribute("aria-invalid");
  }
  return !message;
}

const fields = Object.keys(validators).map((name) => form.elements[name]);
let submitted = false;

// Tras el primer intento de envío, revalida cada campo al salir de él o al corregirlo
fields.forEach((field) => {
  field.addEventListener("blur", () => submitted && validateField(field));
  field.addEventListener("input", () => {
    if (field.getAttribute("aria-invalid") === "true") validateField(field);
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitted = true;

  const invalid = fields.filter((field) => !validateField(field));
  if (invalid.length) {
    invalid[0].focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending…";

  // Envío SIMULADO: este es un proyecto de portafolio y los datos no van a ningún lado.
  // En un sitio real, aquí se enviaría el formulario a un servicio como Formspree:
  //
  //   const response = await fetch("https://formspree.io/f/TU_ID", {
  //     method: "POST",
  //     body: new FormData(form),
  //     headers: { Accept: "application/json" },
  //   });
  //   if (!response.ok) { /* mostrar un mensaje de error y no limpiar el formulario */ }
  await new Promise((resolve) => setTimeout(resolve, 800));

  const firstName = form.elements.name.value.trim().split(/\s+/)[0];
  successText.textContent = `Thanks, ${firstName}! We'll send your quote to ${form.elements.email.value.trim()} within 24 hours.`;

  form.classList.add("hidden");
  success.classList.remove("hidden");
  success.focus();
});

resetButton.addEventListener("click", () => {
  form.reset();
  submitted = false;
  submitButton.disabled = false;
  submitButton.textContent = "Get my free quote";
  success.classList.add("hidden");
  form.classList.remove("hidden");
  form.elements.name.focus();
});

// Los botones de Pricing preseleccionan el servicio en el formulario
document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    serviceSelect.value = link.dataset.service;
    if (serviceSelect.getAttribute("aria-invalid") === "true") validateField(serviceSelect);
  });
});

// ===== Año del footer =====
document.getElementById("year").textContent = new Date().getFullYear();
