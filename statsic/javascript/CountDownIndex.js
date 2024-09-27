 // Set the target date
 const targetDate = new Date("2024-09-18T00:00:00").getTime();

 function updateCountdown() {
     const now = new Date().getTime();
     const distance = targetDate - now;

     if (distance >= 0) {
         // Calculate time units
         const days = Math.floor(distance / (1000 * 60 * 60 * 24));
         const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
         const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
         const seconds = Math.floor((distance % (1000 * 60)) / 1000);

         // Update countdown display
         document.getElementById("days").textContent = days.toString().padStart(2, '0');
         document.getElementById("hours").textContent = hours.toString().padStart(2, '0');
         document.getElementById("minutes").textContent = minutes.toString().padStart(2, '0');
         document.getElementById("seconds").textContent = seconds.toString().padStart(2, '0');

         // Show countdown and hide endContent
         document.getElementById("countdown").classList.remove("hidden");
         document.getElementById("endContent").classList.add("hidden");
     } else {
         // Countdown has ended
         document.getElementById("countdown").classList.add("hidden");
         document.getElementById("endContent").classList.remove("hidden");
     }
 }

 // Update countdown every second
 setInterval(updateCountdown, 1000);

 // Initial call to display countdown immediately
 updateCountdown();