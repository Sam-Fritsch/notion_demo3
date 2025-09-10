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

  const { pageId, status} = req.body;


  if (!process.env.NOTION_API_KEY) {
    res.status(500).json({ error: 'Missing Notion API key' });
    return;
  }

  try {
        const properties = {
        "Status": {
            status: status ? { name: status } : null
        },
        "First Name": {
            rich_text: []
        },
        "Last Name": {
            rich_text: [] 
        },
        "Phone": {
            phone_number: null 
        },
        "Email": {
            email: null 
        },
        "Service": {
            rich_text: []
        },
        "Reservation Code": {
            rich_text: [] 
        }
        };



    // PATCH request to Notion db
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
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
