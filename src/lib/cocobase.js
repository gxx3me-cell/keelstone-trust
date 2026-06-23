import { Cocobase } from 'cocobase'

// API key is set inline here (not via env) per project setup.
// Replace with your CocoBase project API key from https://app.cocobase.cc
const COCOBASE_API_KEY = 'S1vFB6L2zdCphp9w_Obdhn31ScbF4g5g-_TMyrQd'

export const db = new Cocobase({ apiKey: COCOBASE_API_KEY,projectId:"ad5ea768-2c32-4f9d-a296-8050e0e96b61" })

export default db
