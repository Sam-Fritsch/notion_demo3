const form = document.getElementById("reservationForm");
const detailsDiv = document.querySelector(".appointment-details");

// --- Fetch appointment from backend ---
async function notion_find_appointment(reservation_code) {
  const body = { reservation_code };

  try {
    const response = await fetch(
      "https://notion-demo3.vercel.app/api/notion_find_appointment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server error: ${text}`);
    }

    return await response.json(); // returns array of appointments
  } catch (err) {
    console.error("Error fetching from Notion:", err);
    throw err;
  }
}

// --- Toggle display of appointment ---
async function toggle_appointment(event) {
  const button = event.target;

  if (button.textContent === "FIND APPOINTMENT") {
    // Show loading state
    detailsDiv.innerHTML = `<div class="loading">Searching for your appointment...</div>`;
    button.textContent = "X";

    try {
      const formData = new FormData(form);
      const reservationCode = formData.get("reservationCode");
      const result = await notion_find_appointment(reservationCode);

      if (result && result.length > 0) {
        const appointment = result[0];
        const { date, startTime, firstName, lastName, service, reservationCode: foundReservationCode } = appointment;

        detailsDiv.innerHTML = `
          <div class="appointment-card">
            <p><strong>We found your appointment!</strong><p>
            <br>
            <p><strong>Reservation Code:</strong> ${foundReservationCode}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>First Name:</strong> ${firstName}</p>
            <p><strong>Last Name:</strong> ${lastName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${startTime}</p>
          </div>
        `;
      } else {
        detailsDiv.innerHTML = `<p>No appointment found for code: ${reservationCode}</p>`;
      }
    } catch (err) {
      detailsDiv.innerHTML = `<p class="error">Error finding appointment. Please try again.</p>`;
    }

  } else {
    // Toggle back: hide details and reset button
    detailsDiv.innerHTML = "";
    button.textContent = "FIND APPOINTMENT";
  }
}

// Attach the toggle function to your submit button
form.querySelector('button[type="submit"]').addEventListener("click", toggle_appointment);

// Prevent default form submission
form.addEventListener("submit", (e) => e.preventDefault());
