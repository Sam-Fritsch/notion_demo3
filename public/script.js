
// async function get_next_7_days(){
//     const today = new Date(); 
//     const next7Days = [];
//     const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

//     for (let i = 0; i < 7; i++) {
//     const nextDay = new Date(today);
//     nextDay.setDate(today.getDate() + i);
//     const dayOfWeekNumber = nextDay.getDay();
//     const dayOfWeekName = dayNames[dayOfWeekNumber];
//     const formattedDate = `${dayOfWeekName}, ${nextDay.toLocaleDateString('en-US')}`;
//     next7Days.push(formattedDate);
//     }
//     return next7Days;
// }

const timezone_label = "Time Zone: Central Time (GMT-05:00)";
// const sheet_url = 'https://api.sheety.co/503cd683d77f4feeb101a928a19c01b6/appointmentTracker/bookings';
const sheet_url = 'https://notion-demo3.vercel.app/api/notion_fetch'

let cachedTimes = null;

async function notion_get_open_time_slots() {
    const response = await fetch('https://notion-demo3.vercel.app/api/notion_fetch');
    const data = await response.json();
    // results = data["results"];
    console.log(data);
}


async function fetchTimes() {
    if (cachedTimes) return cachedTimes;

    try {
        // await notion_get_open_time_slots();
        const response = await fetch(sheet_url);
        const data = await response.json();
    

        // const data = json.bookings
        //     .filter(row => row.status === "Open")
        //     .map(row => ({
        //         date: row.date,
        //         time: row.time
        //     }));

        let weekGroups = Object.groupBy(data, item => {
            const date = new Date(item.date + " 00:00:00");

            
            const dayOfWeek = date.getDay();
            
            const daysToSunday = dayOfWeek;
            
            const sunday = new Date(date);
            sunday.setDate(date.getDate() - daysToSunday);
            
            return sunday.toISOString().split('T')[0];
        });
        

        let sortedWeekGroups = Object.fromEntries(
            Object.entries(weekGroups).sort(([a], [b]) => new Date(a) - new Date(b))
            );

        cachedTimes = sortedWeekGroups;
        return sortedWeekGroups;
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
        timezoneDiv.innerHTML = `<div class="loading">Loading available appointments...</div>`;

        let currentWeekIndex = 0;
        
        try {
            const times = await fetchTimes();
            const weekEntries = Object.entries(times);

            
            if (weekEntries.length === 0) {
                timezoneDiv.innerHTML = `<div>No appointments available.</div>`;
                return;
            }
            
            function renderWeek(weekIndex) {
                if (weekIndex < 0 || weekIndex >= weekEntries.length) return;
                
                const [weekdate, slots] = weekEntries[weekIndex];
                const weekdateObj = new Date(weekdate + " 00:00:00");
                const weekEnd = new Date(weekdateObj);
                weekEnd.setDate(weekdateObj.getDate() + 6);

                const weekStartStr = weekdateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const weekEndStr = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                
                let timesList = '';
                
                const slotsByDate = {};

                let sortedSlots = slots.sort((a, b) => {
                    const dateDiff = new Date(a.date) - new Date(b.date);
                    if (dateDiff !== 0) return dateDiff;
                    const timeA = new Date(`${a.date} ${a.time}`);
                    const timeB = new Date(`${b.date} ${b.time}`);
                    return timeA - timeB;
                    });                



                sortedSlots.forEach(slot => {
                    if (!slotsByDate[slot.date]) {
                        slotsByDate[slot.date] = [];
                    }
                    slotsByDate[slot.date].push(slot);
                });
                
                for (const [date, dateSlots] of Object.entries(slotsByDate)) {
                    const dateObj = new Date(date + " 00:00:00");
                    const shortDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric"});
                    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
                    
                    timesList += `<li><strong>${dayName}</strong>
                        <br/>${shortDate}<ul class='specific-times'>`;
                    
                    dateSlots.forEach(slot => {
                        timesList += `<li><button class="time-slot-button"
                            data-pageid="${slot.pageid}"
                            data-time="${slot.time}"
                            data-date="${date}"
                            >${slot.time}</button></li>`;
                    });
                    
                    timesList += `</ul></li>`;
                }
                
                timezoneDiv.innerHTML = `
                    <div class="calendar-container">
                        <div>${timezone_label}</div>
                        
                    

                        <div class="week-navigation">
                            <button class="nav-button prev-week" ${weekIndex === 0 ? 'disabled' : ''}>
                                ← 
                            </button>
                      
                            <button class="nav-button next-week" ${weekIndex === weekEntries.length - 1 ? 'disabled' : ''}>
                                →
                            </button>
                        </div>
                        
                        <ul class="time-slots">${timesList}</ul>
                    </div>
                `;
                
                const prevButton = timezoneDiv.querySelector('.prev-week');
                const nextButton = timezoneDiv.querySelector('.next-week');
                
                if (prevButton) {
                    prevButton.addEventListener('click', () => {
                        currentWeekIndex--;
                        renderWeek(currentWeekIndex);
                    });
                }
                
                if (nextButton) {
                    nextButton.addEventListener('click', () => {
                        currentWeekIndex++;
                        renderWeek(currentWeekIndex);
                    });
                }
            }
            
            renderWeek(currentWeekIndex);
            
        } catch (error) {
            console.error('Error loading calendar:', error);
            timezoneDiv.innerHTML = `<div>Error loading appointments. Please try again.</div>`;
        }

        button.textContent = "X";
    } else {
        timezoneDiv.innerHTML = "";
        button.textContent = "BOOK HERE";
    }
}

document.querySelectorAll('.book-button').forEach(button => {
    button.addEventListener("click", toggle_calendar);
});


function display_form(event, date, time, appointmentType, duration) {
    const button = event.target;
    const box = button.closest('.box_css');
    const formArea = box.querySelector('.time-zone-label');
    const selectedTime = time;
    const selectedDate = date;
    const pageId = button.dataset.pageid;
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
                data-pageId="${pageId}"
                data-duration="${duration}"
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
        const appointmentTypeElem = box.querySelector('.appointment-type-name');
        const appointmentType = appointmentTypeElem.textContent;
        const duration = appointmentTypeElem.dataset.duration;
        const price = appointmentTypeElem.dataset.price;
        display_form(e, date, time, appointmentType, duration);
    }
});

function calculateEndTime(selectedTime, duration) {
    const minutesToAdd = parseInt(duration, 10);
    if (isNaN(minutesToAdd)) return selectedTime;

    const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!timeParts) return selectedTime;

    let hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const ampm = timeParts[3];

    if (ampm) {
        if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + minutesToAdd);

    const endHours = date.getHours() % 12 || 12;
    const endMinutes = date.getMinutes().toString().padStart(2, "0");
    const endAmPm = date.getHours() >= 12 ? "PM" : "AM";

    return `${endHours}:${endMinutes} ${endAmPm}`;
}



document.addEventListener("submit", function(e) {
    e.preventDefault(); 
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const appointmentType = form.dataset.appointmenttype;
    const selectedTime = form.dataset.selectedtime;
    const selectedDate = form.dataset.selecteddate;
    const duration = form.dataset.duration;
    const endTime = calculateEndTime(selectedTime, duration);
    const pageId = form.dataset.pageid;

    const firstName = data["firstName"];
    const lastName = data["lastName"];
    const phone = data["phone"];
    const email = data["email"];
    notion_add_appointment(firstName, lastName, phone, email, appointmentType, selectedDate, selectedTime, endTime);
    update_notion(pageId,appointmentType, selectedDate, selectedTime, firstName, lastName, phone, email)
    display_thank_you(firstName, lastName, selectedDate, selectedTime);
    cachedTimes = null;
});



function display_thank_you(firstName, lastName, selectedDate, selectedTime){
    const button = event.target;
    const box = button.closest('.box_css');
    const formArea = box.querySelector('.time-zone-label');

    formArea.innerHTML = `
        <h4>Thank you for booking with Aether By S!</h4>
        <p>You're appointment is set for ${selectedDate} at ${selectedTime}</p>
        <p>We have received your booking and are excited to see you soon!</p>
        `;
}





function notion_add_appointment(firstName, lastName, phone, email, appointmentType, date, startTime, endTime) {
    const body = {
        firstName, 
        lastName, 
        phone, 
        email, 
        status: "Scheduled", 
        appointmentType, 
        date, 
        startTime, 
        endTime
    };

    console.log("Adding net new booking to Notion:", body);

    fetch("https://notion-demo3.vercel.app/api/notion_push", {
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
        alert("Error booking appointment. Please try again.");
    });
}








function update_notion(pageId, appointmentType, selectedDate, selectedTime, firstName, lastName, phone, email) {
    const body = {
        pageId,
        firstName,
        lastName,
        phone,
        email,
        status: "Booked",
        appointmentType
    };

    fetch("https://notion-demo3.vercel.app/api/notion_update", {
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
        alert("Error booking appointment. Please try again.");
    });
}


