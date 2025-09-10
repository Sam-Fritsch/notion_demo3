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

async function notion_find_booking(reservation_code) {
  const body = { reservation_code };

  try {
    const response = await fetch(
      "https://notion-demo3.vercel.app/api/notion_find_booking",
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
      const booking_result = await notion_find_booking(reservationCode);
      

      if (result && result.length > 0) {
        const appointment = result[0];
        const { pageId, date, startTime, firstName, lastName, service, reservationCode: foundReservationCode } = appointment;
        const booking = booking_result[0]
        const bookingPageId = booking["pageId"]
        
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

            <p>Are you sure you want to cancel your appointment? Once cancelled, your time slot will become available for others. If you change your mind, you can always book a new appointment.</p>
            <div class="cancel-area"><button class="final-cancel-button" type="submit">Yes, Cancel</button></div>
          </div>
        `;


        const cancelButtons = document.querySelectorAll('.final-cancel-button');

        cancelButtons.forEach(button => {
          button.addEventListener("click", async () => {
            await cancel_appointment_appts_db(pageId);
            await cancel_appointment_timeslots_db(bookingPageId);
            display_cancel_message();
          });
        });
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

form.querySelector('button[type="submit"]').addEventListener("click", toggle_appointment);


// Cancel appointment in the appointments database //
function cancel_appointment_appts_db(pageId) {
    const body = {
        pageId,
        status: "Cancelled",
    };

    fetch("https://notion-demo3.vercel.app/api/notion_cancel_appointment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`Server error: ${text}`); });
        }
        return response.json();
    })
    .then(result => {
        console.log("Notion update result:", result);
   
    })
    .catch(err => {
        console.error("Error sending to Notion:", err);
        alert("Error cancelling appointment. Please try again.");
    });
  }



// Cancel appointment in the time slots database //
function cancel_appointment_timeslots_db(pageId) {
    const body = {
        pageId,
        status: "Open",
    };

    fetch("https://notion-demo3.vercel.app/api/notion_cancel_time_slot", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`Server error: ${text}`); });
        }
        return response.json();
    })
    .then(result => {
        console.log("Notion update result:", result);
   
    })
    .catch(err => {
        console.error("Error sending to Notion:", err);
        alert("Error cancelling appointment. Please try again.");
    });
  }

function cancellation_in_progress_message() {
  const formArea = document.querySelector('.cancel-area');
  formArea.innerHTML = '<p>Cancelling...</p>';
}


function display_cancel_message() {
  const formArea = document.querySelector('.cancel-area');
  formArea.innerHTML = '<p><strong>We have successfully cancelled your appointment!</strong></p>';
}