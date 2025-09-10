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


const books_response = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_SLOTS_DB_ID}/query`,
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
    if (!books_response.ok) {
      const bookings_text = await books_response.text();
      console.log(bookings_text);
      throw new Error(`Notion API error: ${books_response.status} ${bookings_text}`);
    }

    const booking_data = await books_response.json();

    const booking_results = booking_data["results"];
  
    const booking_cleaned = booking_results
      .filter(book => {
        const status = book.properties.Status?.status?.name;
        return status === 'Booked';
      })
      .map(book => ({
        date: book.properties.Date.date?.start || null,
        startTime: book.properties['Time']?.rich_text[0]?.text?.content || null,
        firstName: book.properties['First Name']?.title[0]?.text?.content || null,
        lastName: book.properties['Last Name']?.rich_text[0]?.text?.content || null,
        service: book.properties['Service']?.rich_text[0]?.text?.content || null,
        reservationCode: book.properties['Reservation Code']?.rich_text[0]?.text?.content || null,
        pageId: book.id
      }));




// Generate the API response
    res.status(200).json(booking_cleaned);

  } catch (error) {
    console.error('Error fetching Notion:', error);
    res.status(500).json({ error: error.message });
  }
}