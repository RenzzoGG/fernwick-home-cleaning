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
// Si la página se abre en localhost se usa la API local; si no, la de producción.
// No se acepta la URL por query string: permitiría armar un enlace que mande los datos a otro servidor.
const API_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:8000"
  : "https://fernwick-api.renzzogg.com";
const REQUEST_TIMEOUT_MS = 15000;
const MAX_DAYS_AHEAD = 365; // igual que la API

// Los name del HTML que la API llama distinto (el resto se llama igual)
const API_NAMES = { size: "home_size", date: "preferred_date" };
const HTML_NAMES = { home_size: "size", preferred_date: "date" };

const form = document.getElementById("quote-form");
const success = document.getElementById("quote-success");
const successText = document.getElementById("quote-success-text");
const resetButton = document.getElementById("quote-reset");
const submitButton = form.querySelector('button[type="submit"]');
const formError = document.getElementById("quote-error");
const formErrorText = document.getElementById("quote-error-text");
const dateInput = document.getElementById("date");
const serviceSelect = document.getElementById("service");

const SUBMIT_LABEL = submitButton.textContent.trim();

// Fecha local en formato YYYY-MM-DD, desplazada `days` días (toISOString usaría UTC y podría dar el día equivocado)
function localISO(days = 0) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

dateInput.min = localISO();
dateInput.max = localISO(MAX_DAYS_AHEAD);

// Reglas de validación: cada función devuelve un mensaje de error o "" si el valor es válido.
// Son las mismas reglas de la API, para avisar antes de enviar; la API sigue siendo la que decide.
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
    if (!/^[0-9+().\- ]+$/.test(value)) return "Use only digits, spaces and + ( ) - .";
    if (value.replace(/\D/g, "").length < 10) return "Enter a phone number with at least 10 digits.";
    return "";
  },
  service: (value) => (value ? "" : "Please choose a service."),
  size: (value) => (value ? "" : "Please choose your home size."),
  date: (value) => {
    if (!value) return "Please choose a preferred date.";
    if (value < localISO()) return "Choose today or a future date.";
    if (value > localISO(MAX_DAYS_AHEAD)) return "Choose a date within the next year.";
    return "";
  },
};

// Muestra (o borra, si message es "") el error de un campo
function showFieldError(field, message) {
  const error = document.getElementById(`${field.id}-error`);

  error.textContent = message;
  error.classList.toggle("hidden", !message);
  if (message) {
    field.setAttribute("aria-invalid", "true");
  } else {
    field.removeAttribute("aria-invalid");
  }
}

function validateField(field) {
  const message = validators[field.name](field.value.trim());
  showFieldError(field, message);
  return !message;
}

function showFormError(message) {
  formErrorText.textContent = message;
  formError.classList.toggle("hidden", !message);
}

const fields = Object.keys(validators).map((name) => form.elements[name]);
let submitted = false;
let sending = false; // cerrojo: evita un segundo envío mientras el primero sigue en curso

// Tras el primer intento de envío, revalida cada campo al salir de él o al corregirlo
fields.forEach((field) => {
  field.addEventListener("blur", () => submitted && validateField(field));
  field.addEventListener("input", () => {
    if (field.getAttribute("aria-invalid") === "true") validateField(field);
  });
});

// Arma el JSON con los nombres que espera la API (home_size y preferred_date, no size y date)
function buildPayload() {
  const payload = {};
  for (const name of ["name", "email", "phone", "service", "size", "date", "message", "website"]) {
    payload[API_NAMES[name] || name] = form.elements[name].value.trim();
  }
  return payload;
}

// 422: pone cada mensaje de la API junto a su campo. Devuelve el primer campo con error (o null)
function showServerErrors(detail) {
  let first = null;
  if (!Array.isArray(detail)) return first;

  for (const item of detail) {
    // loc = ["body", "home_size"]: el segundo elemento es el campo
    const name = HTML_NAMES[item.loc?.[1]] || item.loc?.[1];
    const field = validators[name] && form.elements[name];
    if (!field || field.getAttribute("aria-invalid") === "true") continue;

    // Pydantic antepone "Value error, " a los mensajes de los validadores propios
    const message = String(item.msg || "Please check this field.").replace(/^Value error, /, "");
    showFieldError(field, message.endsWith(".") ? message : `${message}.`);
    first = first || field;
  }
  return first;
}

// 429: Retry-After (segundos) solo se puede leer si la API lo expone por CORS; si no, mensaje genérico
function tooManyRequestsMessage(response) {
  const seconds = Number(response.headers.get("Retry-After"));
  const wait = seconds > 0
    ? `about ${Math.ceil(seconds / 60)} minute${seconds > 60 ? "s" : ""}`
    : "a few minutes";
  return `You've sent several requests in a short time. Please wait ${wait} and try again.`;
}

const NETWORK_ERROR = "We couldn't send your request right now. Please try again in a moment.";

function showSuccess() {
  const firstName = form.elements.name.value.trim().split(/\s+/)[0];
  successText.textContent = `Thanks, ${firstName}! We'll send your quote to ${form.elements.email.value.trim()} within 24 hours.`;

  form.classList.add("hidden");
  success.classList.remove("hidden");
  success.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sending) return;
  submitted = true;
  showFormError("");

  const invalid = fields.filter((field) => !validateField(field));
  if (invalid.length) {
    invalid[0].focus();
    return;
  }

  sending = true;
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";

  // Si la API no responde en REQUEST_TIMEOUT_MS, se cancela la petición
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/v1/public/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
      signal: controller.signal,
    });

    if (response.status === 201) {
      showSuccess();
      return;
    }

    if (response.status === 422) {
      const body = await response.json().catch(() => ({}));
      const field = showServerErrors(body.detail);
      if (field) {
        field.focus();
      } else {
        showFormError("Some details couldn't be accepted. Please review the form and try again.");
      }
    } else if (response.status === 429) {
      showFormError(tooManyRequestsMessage(response));
    } else if (response.status === 413) {
      showFormError("Your request is too long. Please shorten your message and try again.");
    } else {
      // 5xx u otro código inesperado
      showFormError(NETWORK_ERROR);
    }
  } catch {
    // Red caída, API apagada, CORS rechazado o tiempo agotado: el navegador no da más detalle
    showFormError(NETWORK_ERROR);
  } finally {
    clearTimeout(timer);
    sending = false;
    submitButton.disabled = false;
    submitButton.textContent = SUBMIT_LABEL;
  }
});

resetButton.addEventListener("click", () => {
  form.reset();
  submitted = false;
  showFormError("");
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
