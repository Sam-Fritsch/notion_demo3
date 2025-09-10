import fetch from 'node-fetch';
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

const {reservation_code} = req.body;


if (!process.env.NOTION_API_KEY || !process.env.NOTION_SLOTS_DB_ID || !process.env.NOTION_APPTS_DB_ID) {
    res.status(500).json({ error: 'Missing Notion environment variables' });
    return;
  }

  try {


const appts_response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_APPTS_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filter: {
                property: "Reservation Code",
                rich_text: {
                    equals: reservation_code.trim()
                }
            }
        })
      }
    );

    // Check for Notion errors
    if (!appts_response.ok) {
      const appts_text = await appts_response.text();
      throw new Error(`Notion API error: ${appts_response.status} ${appts_text}`);
    }

    const appts_data = await appts_response.json();

    const appts_results = appts_data["results"];
  
    const appts_cleaned = appts_results
      .filter(appt => {
        const status = appt.properties.Status?.status?.name;
        return status === 'Scheduled' || status === 'In Progress';
      })
      .map(appt => ({
        date: appt.properties.Date.date?.start || null,
        startTime: appt.properties['Start Time']?.rich_text?.[0]?.text?.content || null,
        firstName: appt.properties['Client First Name']?.title?.[0]?.text?.content || null,
        lastName: appt.properties['Client Last Name']?.rich_text?.[0]?.text?.content || null,
        service: appt.properties['Service Type']?.rich_text?.[0]?.text?.content || null,
        reservationCode: appt.properties['Reservation Code']?.rich_text?.[0]?.text?.content || null,
        pageId: appt.id
      }));




// Generate the API response
    res.status(200).json(appts_cleaned);

  } catch (error) {
    console.error('Error fetching Notion:', error);
    res.status(500).json({ error: error.message });
  }
}