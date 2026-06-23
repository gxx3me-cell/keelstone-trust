import { Cocobase } from 'cocobase'

// API key is set inline here (not via env) per project setup.
// Replace with your CocoBase project API key from https://app.cocobase.cc
const COCOBASE_API_KEY = 'YOUR_API_KEY'

export const db = new Cocobase({ apiKey: COCOBASE_API_KEY })

export default db
