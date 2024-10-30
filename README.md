# API Endpoints and Test Commands

## Auth Routes
- **GET /auth/register**
  ```sh
  curl -X GET http://localhost:3006/auth/register
  ```

- **POST /auth/register**
  ```sh
  curl -X POST http://localhost:3006/auth/register -H "Content-Type: application/json" -d '{"username": "testuser", "password": "testpassword"}'
  ```

- **GET /auth/login**
  ```sh
  curl -X GET http://localhost:3006/auth/login
  ```

- **POST /auth/login**
  ```sh
  curl -X POST http://localhost:3006/auth/login -H "Content-Type: application/json" -d '{"username": "testuser", "password": "testpassword"}'
  ```

- **GET /auth/logout**
  ```sh
  curl -X GET http://localhost:3006/auth/logout
  ```

## Dashboard Routes
- **GET /dashboard**
  ```sh
  curl -X GET http://localhost:3006/dashboard
  ```

- **GET /api/dashboard/stats**
  ```sh
  curl -X GET http://localhost:3006/api/dashboard/stats
  ```

## Project Routes
- **POST /uploadCsv**
  ```sh
  curl -X POST http://localhost:3006/uploadCsv -F "file=@path/to/your/file.csv" -F "projectId=your_project_id"
  ```

- **GET /dispatch**
  ```sh
  curl -X GET http://localhost:3006/dispatch
  ```

- **POST /dispatchMessages**
  ```sh
  curl -X POST http://localhost:3006/dispatchMessages -H "Content-Type: application/json" -d '{"projectId": "your_project_id", "messageTemplateId": "your_template_id", "message": "Your message content"}'
  ```

- **GET /{projectId}/inbox**
  ```sh
  curl -X GET http://localhost:3006/your_project_id/inbox
  ```

- **GET /{projectId}/inboxPartial**
  ```sh
  curl -X GET http://localhost:3006/your_project_id/inboxPartial
  ```

- **GET /create**
  ```sh
  curl -X GET http://localhost:3006/create
  ```

- **POST /submit**
  ```sh
  curl -X POST http://localhost:3006/submit -F "projectName=Your Project Name" -F "originationNumber=Your Origination Number" -F "rotationSchedule=Your Rotation Schedule" -F "file=@path/to/your/file.csv"
  ```

- **GET /{projectId}/reports**
  ```sh
  curl -X GET http://localhost:3006/your_project_id/reports
  ```

- **GET /{projectId}/details**
  ```sh
  curl -X GET http://localhost:3006/your_project_id/details
  ```

- **GET /{projectId}/sendMessage**
  ```sh
  curl -X GET http://localhost:3006/your_project_id/sendMessage
  ```

- **GET /purchaseOriginationNumber**
  ```sh
  curl -X GET http://localhost:3006/purchaseOriginationNumber
  ```

- **GET /setRotationSchedule**
  ```sh
  curl -X GET http://localhost:3006/setRotationSchedule
  ```

## Template Routes
- **POST /createInitialMessageTemplate**
  ```sh
  curl -X POST http://localhost:3006/createInitialMessageTemplate -H "Content-Type: application/json" -d '{"content": "Your message content", "projectId": "your_project_id"}'
  ```

- **POST /createResponseTemplate**
  ```sh
  curl -X POST http://localhost:3006/createResponseTemplate -H "Content-Type: application/json" -d '{"content": "Your message content", "projectId": "your_project_id"}'
  ```

- **POST /saveTemplate**
  ```sh
  curl -X POST http://localhost:3006/saveTemplate -H "Content-Type: application/json" -d '{"content": "Your message content", "projectId": "your_project_id", "type": "initial"}'
  ```

- **GET /getTemplatesByProjectId/{projectId}**
  ```sh
  curl -X GET http://localhost:3006/getTemplatesByProjectId/your_project_id
  ```

- **POST /createCustomTemplate**
  ```sh
  curl -X POST http://localhost:3006/createCustomTemplate -H "Content-Type: application/json" -d '{"projectId": "your_project_id", "blocks": [{"type": "greeting", "content": ["Hello", "World"]}, {"type": "message", "content": ["How are you?"]]}'
  ```

## Inbox Routes
- **GET /project/{projectId}/inbox**
  ```sh
  curl -X GET http://localhost:3006/project/your_project_id/inbox
  ```

- **GET /project/{projectId}/inboxPartial**
  ```sh
  curl -X GET http://localhost:3006/project/your_project_id/inboxPartial
