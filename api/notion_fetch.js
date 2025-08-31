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

  // Early check for environment variables
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_SLOTS_DB_ID || !process.env.NOTION_APPTS_DB_ID) {
    res.status(500).json({ error: 'Missing Notion environment variables' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_SLOTS_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    // Check for Notion errors
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Notion API error: ${response.status} ${text}`);
    }

    const data = await response.json();

    const results = data["results"];

    const length_slots = results.length;
    const slots_cleaned = [];


// Go through the json and extract the properties
// Properties get stored in a new area called slots_cleaned

    for (let i = 0; i < results.length; i++) {
      const props = results[i].properties;
      const pageId = results[i].id;

      const status = props.Status.status?.name || null;
      const date = props.Date.date?.start || null;
      const time = props.Time.rich_text[0]?.plain_text || null;
      const service = props.Service.rich_text[0]?.plain_text || null;
      const firstName = props["First Name"].rich_text[0]?.plain_text || null;
      const lastName = props["Last Name"].rich_text[0]?.plain_text || null;
      const email = props.Email?.email || null;
      const phone = props.Phone?.phone_number || null;

      slots_cleaned.push({pageId, status, date, time, service, firstName, lastName, email, phone});
    }

// Only return open time slots
      const filtered_slots = slots_cleaned
        .filter(slot => slot.status === 'Open')
        .map(slot => ({
          pageid: slot.pageId,
          date: slot.date,
          time: slot.time
        }));


      
// Get existing appointment times to cross compare with open slots //
const appts_response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_APPTS_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    // Check for Notion errors
    if (!appts_response.ok) {
      const appts_text = await appts_response.text();
      throw new Error(`Notion API error: ${appts_response.status} ${appts_text}`);
    }

    const appts_data = await appts_response.json();

    const appts_results = appts_data["results"];
    
    const final_times = filtered_slots.filter(slot => slot.date > appts_results.date);

    console.log(final_times);



    


    // const final_results = function(filtered_slots, appts_results) {
    //   let final_slots = filtered_slots.map(function(slot){
    //     appts_results(function(acc))
    //   });

    //   return final_slots;
    // }



// Generate the API response
    res.status(200).json(filtered_slots);

  } catch (error) {
    console.error('Error fetching Notion:', error);
    res.status(500).json({ error: error.message });
  }
}

