const { config } = require('dotenv');
const { resolve } = require('path');

config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

module.exports = nextConfig;
