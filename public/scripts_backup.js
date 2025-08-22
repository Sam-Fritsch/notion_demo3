const today = new Date(); 
const next30Days = [];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

for (let i = 0; i < 31; i++) {
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + i);
  const dayOfWeekNumber = nextDay.getDay();
  const dayOfWeekName = dayNames[dayOfWeekNumber];
  const formattedDate = `${dayOfWeekName}, ${nextDay.toLocaleDateString('en-US')}`;
  next30Days.push(formattedDate);
}

console.log(next30Days);




const timezone_label = "Time Zone: Central Time (GMT-05:00)";
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMb_z5gOb3KmTt92GbD7icQ7XDwhIMQt0KYaFYK_HB8inXEPLzSBohi4Bl8-KSistWLkusjP5dzfL1/pub?output=csv';

let cachedTimes = null;

async function fetchTimes() {
    if (cachedTimes) return cachedTimes;

    try {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        const rows = csvText.trim().split('\n');

        const headers = rows[0].split(',');
        const statusIndex = headers.indexOf('Status');

        const data = rows
            .slice(1) 
            .map(row => row.split(','))
            .filter(columns => {
                const status = columns[statusIndex].trim().replace(/^"|"$/g, '');
                return status === 'Open'; 
            })
            .map(columns => ({
                date: columns[0].trim().replace(/^"|"$/g, ''),
                time: columns[1].trim().replace(/^"|"$/g, '')
            }));
        const dateTimePairs = data.reduce((acc, row) => {
            if (!acc[row.date]) {
                acc[row.date] = [];
            }
            acc[row.date].push(row);
            return acc;
        }, {});

        cachedTimes = dateTimePairs;
        return dateTimePairs;
    } catch (err) {
        console.error('Error fetching CSV:', err);
        return [];
    }
}

async function toggle_calendar(event) {
    const button = event.target;
    const box = button.closest('.box_css');
    const timezoneDiv = box.querySelector('.time-zone-label');

    if (button.textContent === "BOOK HERE") {
        const times = await fetchTimes();
        let timesList = '';
            for (const [date, slots] of Object.entries(times)) {
                const dateObj = new Date(date);
                const shortDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric"});
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
                timesList += `<li><strong>${dayName}</strong>
                    <br/>${shortDate}<ul class='specific-times'>`;
                slots.forEach(slot => {
                    timesList += `<li><button class="time-slot-button"
                        data-time = "${slot.time}"
                        data-date = "${date}"
                        >${slot.time}
        
                        </button></li>`;
                });
                timesList += `</ul></li>`;
            }


        timezoneDiv.innerHTML = `
            <div class="calendar-container">
                <div>${timezone_label}</div>
                <ul class="time-slots">${timesList}</ul>
            </div>
        `;

        button.textContent = "X";
    } else {
        timezoneDiv.innerHTML = "";
        button.textContent = "BOOK HERE";
    }
}

document.querySelectorAll('.book-button').forEach(button => {
    button.addEventListener("click", toggle_calendar);
});


function display_form(event, date, time, appointmentType) {
    const button = event.target;
    const box = button.closest('.box_css');
    const formArea = box.querySelector('.time-zone-label');
    const selectedTime = time;
    const selectedDate = date;
    formArea.innerHTML = `
        <h2>Book Your Appointment</h2>
        <h5>${appointmentType}</h5>
        <h5>${selectedDate} at ${selectedTime}</h4>
        <p id="form-p">Please fill out the form below</p>
        <p id="required">* Required</p>
        <br />
            <form class="booking-form"
                data-selectedDate="${selectedDate}"
                data-selectedTime="${selectedTime}"
                data-appointmentType="${appointmentType}"
            >
                <label>
                    <span class="required-icon">*</span>
                    First Name:
                    <input type="text" name="firstName" required>
                </label><br/>
                <label>
                    <span class="required-icon">*</span>
                    Last Name:
                    <input type="text" name="lastName" required>
                </label><br/>
                <label>
                    <span class="required-icon">*</span>
                    Phone:
                    <input type="tel" name="phone" required>
                </label><br/>
                <label>
                    Email:
                    <input type="email" name="email">
                </label><br/>
                <button type="submit">Book Appointment</button>
            </form>
        `;
}

document.addEventListener("click", function(e) {
    if (e.target.classList.contains("time-slot-button")) {
        const box = e.target.closest('.box_css');
        const time = e.target.dataset.time;
        const date = e.target.dataset.date;
        const appointmentType = box.querySelector('.appointment-type-name').textContent;
        display_form(e, date, time, appointmentType);
    }
});

document.addEventListener("submit", function(e) {
    e.preventDefault(); 
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const appointmentType = form.dataset.appointmenttype;
    const selectedTime = form.dataset.selectedtime;
    const selectedDate = form.dataset.selecteddate;
    const firstName = data["firstName"];
    const lastName = data["lastName"];
    const phone = data["phone"];
    const email = data["email"];
    // send_to_gs(appointmentType, selectedDate, selectedTime, firstName, lastName, phone, email)
    display_thank_you(firstName, lastName, selectedDate, selectedTime);
});



function display_thank_you(firstName, lastName, selectedDate, selectedTime){
    const button = event.target;
    const box = button.closest('.box_css');
    const formArea = box.querySelector('.time-zone-label');

    formArea.innerHTML = `
        <h4>Thank you for booking with Aether By S!</h4>
        <p>You're appoiontment is set for ${selectedDate} at ${selectedTime}</p>
        <p>We have received your booking and are excited to see you soon!</p>
        `;
}

function send_to_gs(appointmentType, selectedDate, selectedTime, firstName, lastName, phone, email){
    let url = 'https://api.sheety.co/503cd683d77f4feeb101a928a19c01b6/appointmentTracker/bookings/2';
    let body = {
        booking: {
            "service": appointmentType,
            "date": selectedDate,
            "time": selectedTime,
            "firstName": firstName,
            "lastName": lastName,
            "phone": phone,
            "email": email,
            "status": "Booked"
        }
    }
    console.log(body);
    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then((response) => response.json())
    .then(json => {
        console.log(json.booking);
    });
}

