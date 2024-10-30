document.addEventListener('DOMContentLoaded', function() {
  const projectSelect = document.getElementById('projectSelect');
  const templateSelect = document.getElementById('templateSelect');
  const messagePreview = document.getElementById('messagePreview');
  const messageDispatchForm = document.getElementById('messageDispatchForm');
  const confirmModal = document.getElementById('confirmModal'); // Assuming HTML element for confirmation modal exists
  const confirmButton = document.getElementById('confirmButton'); // Assuming HTML element for confirm button in modal exists

  projectSelect.addEventListener('change', function() {
    document.getElementById('projectId').value = this.value;
    fetch(`/api/templates/getTemplatesByProjectId/${this.value}`)
      .then(response => response.json())
      .then(data => {
        templateSelect.innerHTML = '<option value="" selected>Select a Template</option>';
        data.templates.forEach(template => {
          const option = document.createElement('option');
          option.value = template._id;
          option.textContent = template.content; // Assuming template object has _id and content
          templateSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error fetching templates:', error.message);
        console.error(error.stack);
        alert('Failed to load templates. Please try again.');
      });
  });

  templateSelect.addEventListener('change', function() {
    const selectedTemplate = this.options[this.selectedIndex];
    messagePreview.value = selectedTemplate.textContent || '';
  });

  messageDispatchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const projectId = document.getElementById('projectId').value;
    const templateId = templateSelect.value;
    const messageContent = messagePreview.value;

    if (!projectId || !templateId || !messageContent) {
      alert('Please select a project, a template, and ensure message content is available.');
      return;
    }

    fetch(`/project/${projectId}/confirmAndDispatchMessages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateId, messageContent }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Display messages for confirmation
      // Assuming data is an array of message objects
      const messagesList = document.getElementById('messagesList'); // Assuming HTML element for listing messages in modal exists
      messagesList.innerHTML = ''; // Clear previous messages
      data.forEach(message => {
        const messageItem = document.createElement('li');
        messageItem.textContent = `To: ${message.phone}, Message: ${message.message}`;
        messagesList.appendChild(messageItem);
      });
      // Show confirmation modal
      $(confirmModal).modal('show'); // Using Bootstrap's modal component
    })
    .catch(error => {
      console.error('Error preparing messages for confirmation:', error.message);
      console.error(error.stack);
      alert('Failed to prepare messages for confirmation');
    });
  });

  confirmButton.addEventListener('click', function() {
    const confirmedMessages = []; // Collect confirmed messages from the modal
    const messagesListItems = document.querySelectorAll('#messagesList li');
    messagesListItems.forEach(item => {
      confirmedMessages.push({phone: item.dataset.phone, message: item.textContent}); // Assuming data-phone attribute exists
    });

    const projectId = document.getElementById('projectId').value;
    fetch(`/project/${projectId}/dispatchConfirmedMessages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirmedMessages }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Confirmed messages dispatched successfully', data);
      alert('Confirmed messages dispatched successfully');
      $(confirmModal).modal('hide'); // Hide confirmation modal
    })
    .catch(error => {
      console.error('Error dispatching confirmed messages:', error.message);
      console.error(error.stack);
      alert('Failed to dispatch confirmed messages');
    });
  });

  function refreshStatistics() {
    const projectId = document.querySelector('#projectId').value;
    if (!projectId) {
      console.error('Project ID is missing. Please ensure the project ID is correctly set in the dispatch page.');
      return;
    }

    fetch(`/api/realtime-statistics/${projectId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        document.querySelector('#totalMessagesSent').textContent = data.totalMessagesSent;
        document.querySelector('#totalMessagesDelivered').textContent = data.totalMessagesDelivered;
        document.querySelector('#totalResponsesReceived').textContent = data.totalResponsesReceived;
      })
      .catch(error => {
        console.error('Error fetching real-time statistics:', error.message);
        console.error(error.stack);
      });
  }

  setInterval(refreshStatistics, 5000); // Refresh statistics every 5 seconds
});