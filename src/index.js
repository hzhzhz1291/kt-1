import fs from 'fs';
import path from 'path';
import { Transform, pipeline } from 'stream';
import { promisify } from 'util';
import { config } from './config/index.js';
import { CSVParserTransform } from './utils/csv.js';

const streamPipeline = promisify(pipeline);

async function main() {
  const inputPath = path.resolve(config.inputFile);
  const outputPath = path.resolve(config.outputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`Ошибка: Входной файл не найден по пути "${config.inputFile}"`);
    process.exit(1);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalRows = 0;
  let passedRows = 0;

  const filterTransform = new Transform({
    writableObjectMode: true,
    readableObjectMode: false,
    transform(chunk, encoding, callback) {
      if (chunk.isHeader) {
        this.push(chunk.raw + '\n');
        callback();
        return;
      }

      totalRows++;
      const { age, city } = chunk.data;
      const parsedAge = parseInt(age, 10) || 0;

      const matchesAge = parsedAge >= config.minAge;
      const matchesCity = !config.cityFilter || city.toLowerCase() === config.cityFilter.toLowerCase();

      if (matchesAge && matchesCity) {
        passedRows++;
        this.push(chunk.raw + '\n');
      }
      callback();
    }
  });

  try {
    const readableStream = fs.createReadStream(inputPath, { encoding: 'utf-8' });
    const writableStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });

    await streamPipeline(
      readableStream,
      new CSVParserTransform(),
      filterTransform,
      writableStream
    );

    console.log('=== Статистика обработки ===');
    console.log(`Всего строк обработано: ${totalRows}`);
    console.log(`Прошло фильтрацию:      ${passedRows}`);
    console.log(`Результат сохранен в:   ${config.outputFile}`);

  } catch (error) {
    console.error('Критическая ошибка при обработке потока:', error.message);
    process.exit(1);
  }
}

main();
