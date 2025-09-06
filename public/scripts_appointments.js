// scripts_appointments.js

const form = document.getElementById("reservationForm");
const detailsDiv = document.querySelector(".appointment-details");


async function notion_find_appointment(reservation_code) {
  const body = { reservation_code };

  try {
    const response = await fetch(
      "https://notion-demo3.vercel.app/api/notion_find_appointment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${text}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching from Notion:", err);
    throw err;
  }
}


form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  const reservationCode = formData.get("reservationCode");

  detailsDiv.innerHTML = `<div class="loading">Searching for your appointment...</div>`;

  try {
    const result = await notion_find_appointment(reservationCode);

    console.log(result);
    if (result && result.appointment) {
      const { date, time, service } = result.appointment;

      detailsDiv.innerHTML = `
        <div class="appointment-card">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Service:</strong> ${service}</p>
        </div>
      `;
    } else {
      detailsDiv.innerHTML = `<p>No appointment found for code: ${reservationCode}</p>`;
    }
  } catch (err) {
    detailsDiv.innerHTML = `<p class="error">Error finding appointment. Please try again.</p>`;
  }
});
