document.addEventListener("submitcode", function(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    console.log(data);
    console.log("hello");
})