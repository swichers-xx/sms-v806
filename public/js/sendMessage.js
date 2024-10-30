document.addEventListener('DOMContentLoaded', function() {
    const sendMessageForm = document.getElementById('sendMessageForm');
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    const messageTemplateSelect = document.getElementById('messageTemplate');
    const customMessageTextarea = document.getElementById('customMessage');
    const projectIdInput = document.getElementById('projectId');

    sendMessageForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const projectId = projectIdInput.value;
        const templateId = messageTemplateSelect.value;
        const customMessage = customMessageTextarea.value;
        const body = templateId ? { templateId } : { message: customMessage };

        fetch(`/project/${projectId}/dispatchMessages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Message sent successfully', data);
            alert('Message sent successfully');
        })
        .catch(error => {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        });
    });

    saveTemplateBtn.addEventListener('click', function() {
        const projectId = projectIdInput.value;
        const templateContent = customMessageTextarea.value;
        if (!templateContent) {
            alert('Template content cannot be empty.');
            return;
        }
        const templateName = prompt('Enter a name for the new template:');
        if (!templateName) {
            alert('Template name is required.');
            return;
        }

        fetch(`/project/${projectId}/saveTemplate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ templateName: templateName, content: templateContent, projectId }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Template saved successfully', data);
            alert('Template saved successfully');
        })
        .catch(error => {
            console.error('Error saving template:', error);
            alert('Failed to save template');
        });
    });
});