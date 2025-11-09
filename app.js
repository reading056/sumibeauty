// --- Navbar Mobile Toggle ---
const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');

menu?.addEventListener('click', () => {
  menu.classList.toggle('is-active');
  menuLinks.classList.toggle('active');
});

menuLinks?.addEventListener('click', () => {
  if (window.innerWidth <= 768 && menu.classList.contains('is-active')) {
    menu.classList.remove('is-active');
    menuLinks.classList.remove('active');
  }
});

// --- Helpers ---
const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];
const setUsers = (u) => localStorage.setItem('users', JSON.stringify(u));
const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser'));
const setCurrentUser = (u) => localStorage.setItem('currentUser', JSON.stringify(u));
const getAppointments = () => JSON.parse(localStorage.getItem('appointments')) || [];
const setAppointments = (a) => localStorage.setItem('appointments', JSON.stringify(a));
const safeRedirect = (path) => window.location.href = path;

// --- Auth Forms ---
const tabButtons = document.querySelectorAll('.auth__tab-btn');
const authForms = document.querySelectorAll('.auth__form');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const bookingForm = document.getElementById('bookingForm');

// Tab Switch
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    authForms.forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + "Form").classList.add('active');
  });
});

// --- Register ---
registerForm?.addEventListener('submit', e => {
  e.preventDefault();
  const fullName = registerForm.querySelector('input[placeholder="Full Name"]').value.trim();
  const email = registerForm.querySelector('input[placeholder="Email"]').value.trim();
  const password = registerForm.querySelector('input[placeholder="Password"]').value.trim();
  const phone = registerForm.querySelector('input[placeholder="Phone Number"]').value.trim();

  let users = getUsers();
  if (users.find(u => u.email === email)) return alert("Email already registered!");

  const newUser = { fullName, email, password, phone };
  users.push(newUser);
  setUsers(users);
  setCurrentUser(newUser);

  // Switch to booking form
  document.querySelector('.auth__forms').style.display = 'none';
  bookingForm.style.display = 'block';
});

// --- Login ---
loginForm?.addEventListener('submit', e => {
  e.preventDefault();
  const email = loginForm.querySelector('input[type="email"]').value.trim();
  const password = loginForm.querySelector('input[type="password"]').value.trim();

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return alert("Invalid email or password!");

  setCurrentUser(user);

  // Switch to booking form
  document.querySelector('.auth__forms').style.display = 'none';
  bookingForm.style.display = 'block';
});

// --- Booking Form Submission ---
bookingForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) return alert("Please log in first.");

  const service = document.getElementById('service').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const notes = document.getElementById('notes').value;

  // Save locally
  let appointments = getAppointments();
  const newAppt = { userEmail: currentUser.email, service, date, time, notes };
  appointments.push(newAppt);
  setAppointments(appointments);

  // Formspree Submission
  const formData = new FormData();
  formData.append('name', currentUser.fullName);
  formData.append('email', currentUser.email);
  formData.append('service', service);
  formData.append('date', date);
  formData.append('time', time);
  formData.append('notes', notes);
  formData.append('_replyto', currentUser.email);

  // Gold-and-black-themed HTML confirmation email
  formData.append('_autoresponse', `
  <html>
    <body style="font-family:Arial,sans-serif; background:#000; color:#FFD700; padding:20px;">
      <h2>Hi ${currentUser.fullName},</h2>
      <p>Thank you for booking your appointment with <strong>Sumi Hair Care</strong>!</p>
      <p><strong>Service:</strong> ${service}<br>
         <strong>Date:</strong> ${date}<br>
         <strong>Time:</strong> ${time}</p>
      <p>${notes ? `<strong>Notes:</strong> ${notes}<br>` : ''}</p>
      <p>We look forward to seeing you and helping your curls shine naturally!</p>
      <p style="margin-top:20px;">– The <strong>Sumi Hair Care</strong> Team</p>
    </body>
  </html>
  `);

  try {
    const response = await fetch('https://formspree.io/f/mjkjbabp', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      alert("Booking confirmed! Check your email for confirmation.");
      bookingForm.reset();
      safeRedirect("account.html");
    } else {
      alert("Booking saved locally, but email could not be sent. Check Formspree settings.");
    }
  } catch (err) {
    console.error("Formspree error:", err);
    alert("Booking saved locally, but email could not be sent. Check your internet connection.");
  }
});

// --- Show Booking Form if Logged In ---
window.addEventListener('load', () => {
  const currentUser = getCurrentUser();
  if (currentUser && bookingForm) {
    document.querySelector('.auth__forms').style.display = 'none';
    bookingForm.style.display = 'block';
  }
});

// --- Account Page Logic ---
if (document.getElementById('welcomeName')) {
  const currentUser = getCurrentUser();
  if (!currentUser) safeRedirect("index.html");

  const welcomeName = document.getElementById('welcomeName');
  welcomeName.textContent = `Hi, ${currentUser.fullName || 'User'}!`;

  let allAppointments = getAppointments();
  const appointmentsList = document.getElementById('appointmentsList');

  const renderAppointments = () => {
    appointmentsList.innerHTML = '';
    const userAppointments = allAppointments.filter(a => a.userEmail === currentUser.email);

    if (userAppointments.length === 0) {
      appointmentsList.innerHTML = "<p class='no-appt'>You have no appointments yet.</p>";
    } else {
      userAppointments.forEach((appt, index) => {
        const card = document.createElement('div');
        card.className = 'appointment__card';
        card.innerHTML = `
          <h4>${appt.service}</h4>
          <p><strong>Date:</strong> ${appt.date}</p>
          <p><strong>Time:</strong> ${appt.time}</p>
          <p><strong>Notes:</strong> ${appt.notes || 'None'}</p>
          <button class="cancelApptBtn" data-index="${index}">Cancel Appointment</button>
        `;
        appointmentsList.appendChild(card);
      });

      document.querySelectorAll('.cancelApptBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.index);
          const userAppts = allAppointments.filter(a => a.userEmail === currentUser.email);
          const apptToRemove = userAppts[idx];
          if (confirm(`Cancel the appointment for ${apptToRemove.service} on ${apptToRemove.date}?`)) {
            allAppointments = allAppointments.filter(a => a !== apptToRemove);
            setAppointments(allAppointments);
            renderAppointments();
          }
        });
      });
    }
  };

  renderAppointments();

  // --- Logout ---
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    safeRedirect("index.html");
  });

  // --- Delete Account ---
  const deleteBtn = document.getElementById('deleteAccountBtn');
  deleteBtn?.addEventListener('click', () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      let users = getUsers();
      users = users.filter(u => u.email !== currentUser.email);
      setUsers(users);

      let allAppointments = getAppointments();
      allAppointments = allAppointments.filter(a => a.userEmail !== currentUser.email);
      setAppointments(allAppointments);

      localStorage.removeItem('currentUser');
      alert("Your account has been deleted.");
      safeRedirect("index.html");
    }
  });
}
