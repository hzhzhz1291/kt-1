import 'dotenv/config';

export const config = {
  inputFile: process.env.INPUT_FILE || 'data/users.csv',
  outputFile: process.env.OUTPUT_FILE || 'data/result.csv',
  minAge: parseInt(process.env.MIN_AGE, 10) || 0,
  cityFilter: process.env.CITY_FILTER ? process.env.CITY_FILTER.trim() : '',
};
