// Tastes of Africa — script.js
const THEME_KEY = "tasteOfAfricaTheme";

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch (error) {
    console.warn("Unable to read the saved theme preference.", error);
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.dataset.theme = "dark";
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.textContent = isDark ? "Light mode" : "Dark mode";
    button.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    button.setAttribute("aria-pressed", String(isDark));
  });
}

// Apply the saved theme immediately so the page doesn't flash the wrong colours
applyTheme(getInitialTheme());

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initIngredientScaling();
  initRecipeFilter();
  initFavorites();
  initContactForm();
  initNewsletter();
  hideBrokenImages();
});

function initThemeToggle() {
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);

      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (error) {
        console.warn("Unable to save the theme preference.", error);
      }
    });
  });
}

function formatQuantity(value) {
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded);
  const fraction = rounded - whole;
  const fractions = [
    [0.25, "¼"],
    [1 / 3, "⅓"],
    [0.5, "½"],
    [2 / 3, "⅔"],
    [0.75, "¾"],
  ];
  const matchedFraction = fractions.find(
    ([amount]) => Math.abs(fraction - amount) < 0.025,
  );

  if (!fraction) return String(rounded);
  if (matchedFraction) {
    return `${whole ? `${whole} ` : ""}${matchedFraction[1]}`;
  }
  return String(rounded);
}

function initIngredientScaling() {
  document.querySelectorAll(".servings-control").forEach((control) => {
    const baseServings = Number(control.dataset.baseServings);
    const output = control.querySelector("output");
    const panel = control.closest(".panel");
    if (!Number.isFinite(baseServings) || baseServings <= 0 || !output || !panel) {
      console.error("Unable to initialize an invalid servings control.", control);
      return;
    }

    let servings = baseServings;
    const quantities = [...panel.querySelectorAll(".qty")].map((element) => ({
      element,
      base: Number(element.dataset.base),
      rounding: element.dataset.round,
    }));

    const update = () => {
      output.textContent = String(servings);
      quantities.forEach(({ element, base, rounding }) => {
        const scaled = (base * servings) / baseServings;
        const value =
          rounding === "whole" || rounding === "int"
            ? String(Math.round(scaled))
            : formatQuantity(scaled);
        element.textContent = value;
      });
    };

    control.querySelectorAll(".servings-btn").forEach((button) => {
      button.addEventListener("click", () => {
        servings = Math.max(1, servings + Number(button.dataset.step));
        update();
      });
    });

    const reset = control.querySelector(".servings-reset");
    if (reset) {
      reset.addEventListener("click", () => {
        servings = baseServings;
        update();
      });
    }
  });
}

/* 1. Interactive recipe filter ------------------------------------------ */
function initRecipeFilter() {
  const buttons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".recipe-card");
  if (!buttons.length || !cards.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const region = btn.dataset.region;

      buttons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      for (let i = 0; i < cards.length; i++) {
        const match = region === "all" || cards[i].dataset.region === region;
        cards[i].classList.toggle("hidden", !match);
      }

      const status = document.getElementById("filter-status");
      if (status) {
        const shown = document.querySelectorAll(".recipe-card:not(.hidden)").length;
        status.textContent = `Showing ${shown} recipe${shown === 1 ? "" : "s"}.`;
      }
    });
  });
}

/* 2. Favorites with localStorage ---------------------------------------- */
const FAV_KEY = "tasteOfAfricaFavorites";

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
  } catch (e) {
    /* storage unavailable (private mode) – fail silently */
  }
}

function paintFavButton(btn, isFav) {
  btn.classList.toggle("is-fav", isFav);
  btn.setAttribute("aria-pressed", String(isFav));
  btn.innerHTML = `<span class="heart" aria-hidden="true">❤️</span> ${isFav ? "Favorited" : "Favorite"}`;
}

function initFavorites() {
  const buttons = document.querySelectorAll(".fav-btn");
  if (!buttons.length) return;

  // Restore saved favorites on page load
  const saved = getFavorites();
  buttons.forEach((btn) => paintFavButton(btn, saved.includes(btn.dataset.id)));

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      let favs = getFavorites();
      if (favs.includes(id)) {
        favs = favs.filter((f) => f !== id);
      } else {
        favs.push(id);
      }
      saveFavorites(favs);
      // keep every button for this recipe in sync
      document
        .querySelectorAll(`.fav-btn[data-id="${id}"]`)
        .forEach((b) => paintFavButton(b, favs.includes(id)));
    });
  });
}

/* 3. Contact form validation -------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const message = document.getElementById("message");
  const error = document.getElementById("message-error");
  const confirmation = document.getElementById("confirmation");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const text = message.value.trim();

    if (text.length <= 20) {
      error.textContent = `Your message needs more than 20 characters (currently ${text.length}).`;
      message.setAttribute("aria-invalid", "true");
      message.focus();
      return;
    }

    error.textContent = "";
    message.removeAttribute("aria-invalid");
    form.classList.add("hidden");
    document.getElementById("confirm-text").textContent =
      `Thank you, ${name}! We've received your message.`;
    confirmation.classList.remove("hidden");
    confirmation.focus();
  });

  message.addEventListener("input", () => {
    if (message.value.trim().length > 20) error.textContent = "";
  });
}

function initNewsletter() {
  document.querySelectorAll(".newsletter").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = form.parentElement.querySelector(".newsletter-msg");
      if (message) message.textContent = "Thanks for subscribing! 🌶️";
      form.reset();
    });
  });
}

function hideBrokenImages() {
  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.style.visibility = "hidden";
    });
  });
}