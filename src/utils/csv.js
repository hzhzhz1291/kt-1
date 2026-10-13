import { Transform } from 'stream';

export class CSVParserTransform extends Transform {
  constructor(options = {}) {
    super({ ...options, readableObjectMode: true, writableObjectMode: false });
    this.lexemBuffer = '';
    this.headers = null;
  }

  _transform(chunk, encoding, callback) {
    this.lexemBuffer += chunk.toString();
    const lines = this.lexemBuffer.split(/\r?\n/);
    this.lexemBuffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      const values = line.split(',');

      if (!this.headers) {
        this.headers = values.map(h => h.trim());
        this.push({ isHeader: true, raw: line, data: null });
      } else {
        const rowObject = {};
        this.headers.forEach((header, index) => {
          rowObject[header] = values[index] ? values[index].trim() : '';
        });
        this.push({ isHeader: false, raw: line, data: rowObject });
      }
    }
    callback();
  }

  _flush(callback) {
    if (this.lexemBuffer.trim()) {
      const values = this.lexemBuffer.split(',');
      if (!this.headers) {
        this.push({ isHeader: true, raw: this.lexemBuffer, data: null });
      } else {
        const rowObject = {};
        this.headers.forEach((header, index) => {
          rowObject[header] = values[index] ? values[index].trim() : '';
        });
        this.push({ isHeader: false, raw: this.lexemBuffer, data: rowObject });
      }
    }
    callback();
  }
}
