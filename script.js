// Tastes of Africa — script.js
document.addEventListener("DOMContentLoaded", () => {
  initRecipeFilter();
  initFavorites();
  initContactForm();
  initNewsletter();
  hideBrokenImages();
});

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

    // textContent keeps user input from being interpreted as HTML
    document.getElementById("confirm-text").textContent =
      `Thank you, ${name}! We've received your message.`;
    confirmation.classList.remove("hidden");
    confirmation.focus();
  });

  message.addEventListener("input", () => {
    if (message.value.trim().length > 20) error.textContent = "";
  });
}

/* Optional: newsletter signup ------------------------------------------- */
function initNewsletter() {
  document.querySelectorAll(".newsletter").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const msg = form.parentElement.querySelector(".newsletter-msg");
      if (msg) msg.textContent = "Thanks for subscribing! 🌶️";
      form.reset();
    });
  });
}

/* Graceful fallback if an image file is missing ------------------------- */
function hideBrokenImages() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      img.style.visibility = "hidden";
    });
  });
}