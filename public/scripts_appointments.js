const form = document.getElementById("reservationForm");

function notion_add_appointment(reservation_code) {
    const body = {
        reservation_code
    };

    fetch("https://notion-demo3.vercel.app/api/notion_find_appointment", {
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


form.addEventListener("submit", function(e) {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);    
    const reservationCode = data["reservationCode"]
    notion_add_appointment(reservationCode)
})