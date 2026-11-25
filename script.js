const ready = document.querySelector(".ready");
const ulTanks = document.querySelector(".tanks");
const filterBtn = document.querySelector(".filter");
const allBtn = document.querySelector(".show-all");
const addDataBtn = document.querySelector(".add-data");
const closeModal = document.querySelector(".close-modal");

/* Глобальые переменные */
let isFiltered = localStorage.getItem("isFiltered") === "true";

/* Функции  */
/* Функция берет данные из текст эрея и делает готовый объект  */
function generateTextFromPdfToObj(textFromPdf) {
  const cleanText = textFromPdf.replace(/\s+/g, " ").trim();

  /* Вытаскиваем температуру */
  const temperatureRegex =
    /\b(1[0-9]|2[0-4]|[1-9])\s+(95 EURO|98 EURO|DK SUV|Petrooleum|DK TAL KL1|DK TAL KL2|JET A-1|HVO|Gasoil 0\.1)\s+([+-]?\d+(?:\.\d+)?)/g;

  const matches = [...cleanText.matchAll(temperatureRegex)];
  const temperaturesFrom = matches.map((m) => Number(m[3]));
  const textWithoutTemperatures = cleanText
    .replace(temperatureRegex, "")
    .replace(/\s+/g, " ")
    .trim();

  /* Находим блоки */
  const positions = [...textWithoutTemperatures.matchAll(/\b\d{3,4}\/\d{3,4}\b/g)];

  const blocks = positions.map((match, index) => {
    const start = match.index;
    const end = positions[index + 1]?.index ?? textWithoutTemperatures.length;

    return textWithoutTemperatures.slice(start, end).trim();
  });

  /* Типы топлива */
  const fuels = [
    "95 EURO",
    "98 EURO",
    "DK SUV",
    "Petrooleum",
    "DK TAL",
    "JET A-1",
    "HVO",
    "Gasoil 0.1",
  ];

  const fuelsType = ["KL1", "KL2", "B", "C", "D", "E", "F"];

  function extractCertificateAndDensity(block) {
    const match = block.match(/\bp15\s+(\d\.\d{4})\s+(\S+)\s+(\d{2}\.\d{2}\.\d{2})/i);

    return {
      density: match ? match[1] : null,
      certificate: match ? match[2] : "",
      date: match ? match[3] : "",
    };
  }
  /* Создаем массив объектов */
  const tanks = blocks.map((block, index) => {
    const { density, certificate, date } = extractCertificateAndDensity(block);

    return {
      tank: index + 1,
      data: block,
      fuels: fuels.find((fuel) => block.includes(fuel)) || "",
      fuelType: fuelsType.find((type) => new RegExp(`\\s${type}\\s`).test(block)) || "",
      temperatures: temperaturesFrom[index] ?? null,
      saleType: /\b(KOM|AKC)\b/i.exec(block)?.[1] || "",
      density,
      certificate,
      date,
      show: false,
      info: "",
    };
  });

  console.log(tanks);
  return tanks;
}
/* Функция для вытаскиваения объекта из локала */
function getTanks() {
  return JSON.parse(localStorage.getItem("tanks")) || [];
}

/* функция для сохрания объекта в локал */
function saveTanks(tanks) {
  localStorage.setItem("tanks", JSON.stringify(tanks));
}

/* функция для создании одной карточки с резервуаром. */
function tankTemplate(el) {
  return `
    <li class="tank">

      <input
        class="tank__show tank__show--hide"
        type="checkbox"
        data-tank="${el.tank}"
        ${el.show ? "checked" : ""}
      >
      <h3 class="tank__nr ${el.show ? "tank__nr--active" : ""}">
  ${el.tank}
</h3>
      <p class="tank__name">${el.fuels || "—"} <span class="tank__fuel-type">${el.fuelType || ""}</span></p>
      <p class="tank__saletype">${el.saleType ?? "—"}</p>
      <p class="tank__density">${el.density ?? "—"}</p>
      <p class="tank__sert">${el.certificate || "—"}</p>
      <p class="tank__date">${el.date || "—"}</p>
      <p class="temperature ${el.temperatures > 0 ? "temperature__red" : "temperature__blue"}">
        ${el.temperatures ?? "—"}
        <i class="ri-celsius-line"></i>
      </p>

      <textarea
        class="tank__info"
        data-tank="${el.tank}"
        placeholder="Заметка..."
      >${el.info ?? ""}</textarea>

    </li>
  `;
}

/* Функция отрисовки карточек на странице. Теперь функция сама решает, какие карточки показывать. */
function render() {
  const tanks = getTanks();
  const visibleTanks = isFiltered ? tanks.filter((tank) => tank.show) : tanks;
  ulTanks.innerHTML = visibleTanks.map((el) => tankTemplate(el)).join("");
  console.log(tanks);
  filterBtn.classList.toggle("active", isFiltered);
  allBtn.classList.toggle("active", !isFiltered);
}

/* Кнопка сохранить. Создаем объект из pdf данных и сохраняем их в локал сторедж. */
ready.addEventListener("click", (e) => {
  e.preventDefault();
  const textFromPdf = document.querySelector(".save__textarea").value;
  const tanks = generateTextFromPdfToObj(textFromPdf);
  saveTanks(tanks);
  localStorage.setItem("tanksDate", new Date().toISOString());
  console.log(getTanks());
  render();
  document.querySelector(".modal").classList.remove("modal--open");
});

ulTanks.addEventListener("change", (e) => {
  if (!e.target.matches(".tank__show")) return;

  const tankNumber = Number(e.target.dataset.tank);
  const tanks = getTanks();
  const tank = tanks.find((el) => el.tank === tankNumber);

  if (tank) {
    tank.show = e.target.checked;
  }

  saveTanks(tanks);

  // Если фильтр уже включен, обновляем список
  if (isFiltered) {
    render();
  }
});

ulTanks.addEventListener("input", (e) => {
  if (!e.target.matches(".tank__info")) return;
  const tankNumber = Number(e.target.dataset.tank);
  const tanks = getTanks();
  const tank = tanks.find((el) => el.tank === tankNumber);

  if (tank) {
    tank.info = e.target.value;
    saveTanks(tanks);
  }
});

ulTanks.addEventListener("click", (e) => {
  const tankNumber = e.target.closest(".tank__nr");
  if (!tankNumber) return;
  const tank = tankNumber.closest(".tank");
  const checkbox = tank.querySelector(".tank__show");
  checkbox.checked = !checkbox.checked;
  tankNumber.classList.toggle("tank__nr--active", checkbox.checked);
  checkbox.dispatchEvent(new Event("change", { bubbles: true }));
});

filterBtn.addEventListener("click", () => {
  isFiltered = true;
  localStorage.setItem("isFiltered", "true");
  render();
});

allBtn.addEventListener("click", () => {
  isFiltered = false;
  localStorage.setItem("isFiltered", "false");
  render();
});

addDataBtn.addEventListener("click", () => {
  document.querySelector(".modal").classList.add("modal--open");
});

closeModal.addEventListener("click", (e) => {
  e.preventDefault();
  document.querySelector(".modal").classList.remove("modal--open");
});
render();

/* INFO  */

const textarea = document.getElementById("myText");

// Загружаем текст при запуске
textarea.value = localStorage.getItem("myText") || "";

// Автоматически сохраняем при вводе
textarea.addEventListener("input", function () {
  localStorage.setItem("myText", textarea.value);
});

// СОХРАНЕНИЕ JSON
async function saveJSON() {
  const data = {
    text: textarea.value,
  };

  const blob = JSON.stringify(data, null, 2);

  const fileHandle = await window.showSaveFilePicker({
    suggestedName: "myData.json",
    types: [
      {
        description: "JSON файл",
        accept: {
          "application/json": [".json"],
        },
      },
    ],
  });

  const writable = await fileHandle.createWritable();

  await writable.write(blob);

  await writable.close();

  alert("Файл сохранён!");
}

// ЧТЕНИЕ JSON
function readJSON() {
  const fileInput = document.getElementById("fileInput");

  fileInput.click();

  fileInput.onchange = async function () {
    const file = fileInput.files[0];

    if (!file) return;

    const text = await file.text();

    const data = JSON.parse(text);

    textarea.value = data.text;

    localStorage.setItem("myText", data.text);

    alert("Данные загружены!");

    fileInput.value = "";
  };
}

// const textarea = document.querySelector(".save__textarea");

textarea.addEventListener("input", () => {
  textarea.style.height = "38px";
  textarea.style.height = `${textarea.scrollHeight}px`;
});

const showInfo = document.querySelector(".show-info");
showInfo.addEventListener("click", () => {
  document.querySelector(".info").classList.toggle("info--open");
});

function controlTextArea() {
  const textarea = document.querySelector(".info__textarea");
  const info = document.querySelector(".info");

  if (textarea.value.trim()) {
    info.classList.add("info--open");
  } else {
    info.classList.remove("info--open");
  }
}

textarea.addEventListener("input", controlTextArea);

controlTextArea();
