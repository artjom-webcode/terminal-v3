const pdfFile = document.querySelector("#pdfFile");
const textFromPdf = document.querySelector(".text-from-pdf");
const ready = document.querySelector(".ready");

// Настройки PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Извлечение текста из PDF
pdfFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    let fullText = "";

    // Перебираем страницы PDF
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // Извлекаем текстовые элементы
      const pageText = content.items.map((item) => item.str).join(" ");

      fullText += pageText + "\n";
    }

    // Записываем текст в HTML
    textFromPdf.textContent = fullText;

    console.log("Текст PDF:", fullText);
  } catch (error) {
    console.error("Ошибка чтения PDF:", error);
  }
});

// Обработка текста PDF
function parsePdf(text) {
  const cleanText = text.replace(/\s+/g, " ").trim();

  // Извлекаем температуры
  const tempRegex =
    /\b(1[0-9]|2[0-4]|[1-9])\s+(95 EURO|98 EURO|DK SUV|Petrooleum|DK TAL KL1|DK TAL KL2|JET A-1|HVO|Gasoil 0\.1)\s+([+-]?\d+(?:\.\d+)?)/g;

  const matches = [...cleanText.matchAll(tempRegex)];

  const temperaturesFrom = matches.map((m) => Number(m[3]));

  // Удаляем температуры из текста
  const textWithoutTemperatures = cleanText.replace(tempRegex, "").replace(/\s+/g, " ").trim();

  // Находим номера резервуаров
  const positions = [...textWithoutTemperatures.matchAll(/\b\d{3,4}\/\d{3,4}\b/g)];

  // Разбиваем текст на блоки
  const blocks = [];

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;

    const end = positions[i + 1] ? positions[i + 1].index : textWithoutTemperatures.length;

    const block = textWithoutTemperatures.slice(start, end).trim();

    blocks.push(block);
  }

  // Справочники
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

  // Создаём объекты резервуаров
  const tanks = blocks.map((block, index) => {
    // Ищем сертификат
    const certificate = block.match(
      /(?:p15\s+)?([\d.]+)\s+([A-Z0-9_-]+(?:\s*\/\s*[A-Z0-9_-]+)?)\s+([A-Z])\s+(\d{6})/i,
    );

    return {
      tank: index + 1,

      data: block,

      fuels: fuels.find((fuel) => block.includes(fuel)) || "",

      fuelType: fuelsType.find((type) => new RegExp(`\\s${type}\\s`).test(block)) || "",

      certificate: certificate ? certificate.slice(1).join(" ") : "",

      temperatures: temperaturesFrom[index],
    };
  });

  return tanks;
}
parsePdf(textFromPdf.textContent);
