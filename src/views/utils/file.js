import xlsx from "xlsx";
import fs from "fs";

const excelFilePath = "./excel/bflottobit.xlsx"; // Change this to your Excel file path

// Define the output JavaScript file path
const fileName = "SkyWind";
const outputFilePath = `./slots/${fileName}.js`;

// Read the Excel file
const workbook = xlsx.readFile(excelFilePath);

// Select the first sheet (update sheet name if necessary)
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert the sheet to JSON format
const data = xlsx.utils.sheet_to_json(sheet);

// Filter out rows with empty 'Game Name' or required fields
const filteredData = data.filter((row) => row["Game Name"] && row["Game UID"]);

// Convert filtered data to the desired array format
const providerArray = filteredData.map((row) => ({
  name: row["Game Name"], // Match the column header for the game name
  id: row["Game UID"], // Match the column header for the game UID
  img: row.icon || "", // Match the column header for the icon
}));

// Generate the JavaScript file content
const fileContent = `export const ${fileName}Array = ${JSON.stringify(
  providerArray,
  null,
  2
)};`;

// Write the output to a JavaScript file
fs.writeFileSync(outputFilePath, fileContent);

console.log(`Array successfully exported to ${outputFilePath}`);
