
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
const sheet_url = 'https://api.sheety.co/503cd683d77f4feeb101a928a19c01b6/appointmentTracker/bookings';

let cachedTimes = null;

async function notion_testing() {
    const response = await fetch('https://notion-demo3.vercel.app/api/notion_fetch');
    const data = await response.json();
    // results = data["results"];
    console.log(data);
}


async function fetchTimes() {
    if (cachedTimes) return cachedTimes;

    try {
        await notion_testing();
        const response = await fetch(sheet_url);
        const json = await response.json();
    

        const data = json.bookings
            .filter(row => row.status === "Open")
            .map(row => ({
                date: row.date,
                time: row.time
            }));
        // const dateTimePairs = data.reduce((acc, row) => {
        //     if (!acc[row.date]) acc[row.date] = [];
        //     acc[row.date].push(row);
        //     return acc;
        // }, {});


        let weekGroups = Object.groupBy(data, item => {
            const date = new Date(item.date);
            
            const dayOfWeek = date.getDay();
            
            const daysToSunday = dayOfWeek;
            
            const sunday = new Date(date);
            sunday.setDate(date.getDate() - daysToSunday);
            
            return sunday.toISOString().split('T')[0];
        });
        
        // console.log(weekGroups)
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

