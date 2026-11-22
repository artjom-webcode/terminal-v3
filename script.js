const textFromPdf = document.querySelector(".save__textarea").value;
const ready = document.querySelector(".ready");

console.log(textFromPdf);
const cleanText = textFromPdf.replace(/\s+/g, " ").trim();
console.log(cleanText);
/* Вытаскиваем температуру */
const matches = [
  ...cleanText.matchAll(
    /\b(1[0-9]|2[0-4]|[1-9])\s+(95 EURO|98 EURO|DK SUV|Petrooleum|DK TAL KL1|DK TAL KL2|JET A-1|HVO|Gasoil 0\.1)\s+([+-]?\d+(?:\.\d+)?)/g,
  ),
];

const temperaturesFrom = matches.map((m) => Number(m[3]));

const textWithoutTemperatures = cleanText
  .replace(
    /\b(1[0-9]|2[0-4]|[1-9])\s+(95 EURO|98 EURO|DK SUV|Petrooleum|DK TAL KL1|DK TAL KL2|JET A-1|HVO|Gasoil 0\.1)\s+([+-]?\d+(?:\.\d+)?)/g,
    "",
  )
  .replace(/\s+/g, " ")
  .trim();

console.log(textWithoutTemperatures);
/* Создаем объект */
const positions = [...textWithoutTemperatures.matchAll(/\b\d{3,4}\/\d{3,4}\b/g)];
const blocks = positions.map((match, index) => {
  const start = match.index;
  const end = positions[index + 1]?.index ?? textWithoutTemperatures.length;
  return textWithoutTemperatures.slice(start, end).trim();
});
console.log(blocks);
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

const tanks = blocks.map((block, index) => ({
  tank: index + 1,
  data: block,
  fuels: fuels.find((fuel) => block.includes(fuel)) || "",
  fuelType: fuelsType.find((type) => new RegExp(`\\s${type}\\s`).test(block)) || "",
  temperatures: temperaturesFrom[index],
}));

console.log(tanks);

// // console.log(cleanText);
