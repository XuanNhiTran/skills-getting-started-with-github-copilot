// Frontend script for activities UI
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function escapeHtml(str = "") {
    return String(str).replace(/[&<>\"']/g, (m) =>
      ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[m])
    );
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants list (no bullets) with delete button for each participant
        const participantsHtml = details.participants && details.participants.length
          ? `<div class="participants">
               <strong>Participants</strong>
               <ul class="participants-list">
                 ${details.participants.map(p => `<li class="participant-item"><span class="participant-email">${escapeHtml(p)}</span><button class="delete-btn" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" aria-label="Remove ${escapeHtml(p)}">×</button></li>`).join("")}
               </ul>
             </div>`
          : `<div class="participants participants-empty">No participants yet</div>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach delete event listeners (delegation would also work)
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const act = btn.getAttribute('data-activity');
          const email = btn.getAttribute('data-email');
          if (!act || !email) return;

          btn.disabled = true;
          try {
            const res = await fetch(`/activities/${encodeURIComponent(act)}/participants?email=${encodeURIComponent(email)}`, {
              method: 'DELETE',
            });
            const json = await res.json();
            if (res.ok) {
              showMessage(json.message, 'success');
              fetchActivities();
            } else {
              showMessage(json.detail || 'Failed to remove participant', 'error');
            }
          } catch (err) {
            console.error('Error removing participant', err);
            showMessage('Failed to remove participant', 'error');
          } finally {
            btn.disabled = false;
          }
        });
      });

    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
  }

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const activity = document.getElementById('activity').value;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );
      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, 'success');
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(result.detail || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      showMessage('Failed to sign up. Please try again.', 'error');
    }
  });

  // Initial load
  fetchActivities();
});
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // escape HTML to avoid injection when rendering participant emails
  function escapeHtml(str = "") {
    return String(str).replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset select options (keep the placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = details.participants && details.participants.length
          ? `<div class="participants">
               <strong>Participants</strong>
               <ul class="participants-list">
                 ${details.participants.map(p => `<li>${escapeHtml(p)}</li>`).join("")}
               </ul>
             </div>`
          : `<div class="participants participants-empty">No participants yet</div>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
