const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const result = dotenv.config();
if (result.error) {
  throw result.error;
}

// Create environment.ts file
const environmentFilePath = path.resolve(__dirname, 'environment.ts');
const prodEnvironmentFilePath = path.resolve(__dirname, 'environment.prod.ts');

const environmentFileContent = `
export const environment = {
  production: false,
  apiUrl: '${process.env.API_URL || 'http://localhost:3000'}'
};
`;

const prodEnvironmentFileContent = `
export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL || 'http://localhost:3000'}'
};
`;

fs.writeFileSync(environmentFilePath, environmentFileContent);
fs.writeFileSync(prodEnvironmentFilePath, prodEnvironmentFileContent);

console.log('Environment files generated successfully with API_URL:', process.env.API_URL);
