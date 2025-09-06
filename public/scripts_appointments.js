const form = document.getElementById("reservationForm");

form.addEventListener("submit", function(e) {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);    
    const reservationCode = data["reservationCode"]
})