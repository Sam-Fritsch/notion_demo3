import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { firstName, lastName, phone, email, status, appointmentType, date, startTime, endTime } = req.body;


  if (!process.env.NOTION_API_KEY) {
    res.status(500).json({ error: 'Missing Notion API key' });
    return;
  }

  try {
    const properties = {
        "Client First Name": {
            "rich_text": [{ "text": { "content": firstName || "" } }]
        },
        "Client Last Name": {
            "rich_text": [{ "text": { "content": lastName || "" } }]
        },
        "Phone": {
            "phone_number": phone || ""
        },
        "Email": {
            "email": email || ""
        },
        "Status": {
            "status": { "name": status || "" }
        },
        "Service Type": {
            "rich_text": [{ "text": { "content": appointmentType || "" } }]
        },
        "Time Slot": {
            "date": {
                "start": new Date(`${date} ${startTime}`).toISOString(),
                "end": new Date(`${date} ${endTime}`).toISOString()
            }
        },
        "Date": {
            "date": {
                "start": new Date(date).toISOString()
            }
        },
        "Start Time": {
            "rich_text": [{ "text": { "content": startTime } }]
        },
        "End Time": {
            "rich_text": [{ "text": { "content": endTime } }]
        }
        };


    // PATCH request to Notion
    const response = await fetch(`https://api.notion.com/v1/pages/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        parent: {database_id: process.env.NOTION_APPTS_DB_ID},
            properties })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Notion API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    res.status(200).json({ success: true, updatedPage: data });

  } catch (err) {
    console.error('Error updating Notion page:', err);
    res.status(500).json({ error: err.message });
  }
}
