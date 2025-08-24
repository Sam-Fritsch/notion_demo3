import fetch from 'node-fetch';


export default async function handler(req, res) {
  // --- CORS headers for all responses ---
  const ALLOWED_ORIGIN = 'http://127.0.0.1:3000'; // Change to your front-end origin in production
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // --- Handle preflight OPTIONS request ---
  if (req.method === 'OPTIONS') {
    res.status(204).end(); // 204 No Content
    return;
  }

  // --- Only allow POST ---
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // --- Destructure incoming data ---
  const { firstName, lastName, phone, email, status, appointmentType, date, startTime, endTime } = req.body;

  // --- Validate env variables ---
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_APPTS_DB_ID) {
    res.status(500).json({ error: 'Missing Notion API key or database ID' });
    return;
  }

  try {
    // --- Construct properties for Notion page ---
    const properties = {
      "Client First Name": {
        "title": [{ "text": { "content": firstName || "" } }]
      },
      "Client Last Name": {
        "rich_text": [{ "text": { "content": lastName || "" } }]
      },
      "Phone": { "phone_number": phone || "" },
      "Email": { "email": email || "" },
      "Status": { "status": { "name": status || "" } },
      "Service Type": {
        "rich_text": [{ "text": { "content": appointmentType || "" } }]
      },
      "Time Slot": {
        "date": {
          "start": new Date(`${date} ${startTime}`).toISOString(),
          "end": new Date(`${date} ${endTime}`).toISOString()
        }
      },
    "Date": 
      { "date": { "start": date } 
    },
      "Start Time": {
        "rich_text": [{ "text": { "content": startTime } }]
      },
      "End Time": {
        "rich_text": [{ "text": { "content": endTime } }]
      }
    };

    // --- Make request to Notion API ---
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_APPTS_DB_ID },
        properties
      })
    });

    // --- Check for Notion errors ---
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Notion API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    res.status(200).json({ success: true, updatedPage: data });

  } catch (err) {
    console.error('Error updating Notion page:', err);
    // Include CORS headers on error response
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.status(500).json({ error: err.message });
  }
}

