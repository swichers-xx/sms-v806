document.addEventListener('DOMContentLoaded', function() {
  const projectId = window.location.pathname.split('/')[2]; // Assumes URL pattern is '/project/:projectId/inbox'
  function refreshConversations() {
    fetch(`/api/conversations/${projectId}`)
      .then(response => response.json())
      .then(data => {
        const conversations = data.conversations;
        let html = '';
        conversations.forEach(conversation => {
          html += `<li class="list-group-item">
            <strong>Contact: </strong>${conversation.contactId.phone}<br>
            <strong>Last message: </strong>${conversation.messages[conversation.messages.length - 1].body}<br>
            <strong>Status: </strong>${conversation.messages[conversation.messages.length - 1].status}<br>
            <strong>Turn: </strong>${conversation.turn}
          </li>`;
        });
        document.querySelector('.list-group').innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading new messages:', error.message);
        console.error(error.stack);
      });
  }

  setInterval(refreshConversations, 5000); // Refresh every 5 seconds
});