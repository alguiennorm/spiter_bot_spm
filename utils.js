// utils.js

import fs from 'fs'
import yaml from 'js-yaml'

let config = {}

try {
  const file = fs.readFileSync('./bot.yml', 'utf8')
  config = yaml.load(file)
} catch (e) {
  console.error('⚠️ Failed to load bot.yml:', e)
}

export default config
