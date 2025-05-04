# Educational Platform Backend

This is the backend server for an educational platform with features for both students and teachers.

## Features

### Student Features
- User registration and login
- Student profile management
- Browse and search for online resources
- Filter resources by subject, grade level, etc.
- Request consultations with teachers
- AI-assisted learning with DeepSeek R1 model integration

### Teacher Features
- Teacher profile management with verification
- Upload educational resources (videos, documents, etc.)
- Accept or reject student consultation requests
- Manage consultation schedules

## Technical Stack

- Java 11
- Spring Boot 2.7.9
- Spring Security with JWT authentication
- Spring Data JPA
- MySQL Database
- WebFlux for reactive programming (AI service)
- WebSockets for real-time communication

## Setup and Running

### Prerequisites
- Java 11 or higher
- Maven
- MySQL Database

### Configuration

1. Update the `application.properties` file with your MySQL database credentials:
```properties
spring.datasource.url=jdbc:mysql://your-database-host:3306/your-database-name
spring.datasource.username=your-username
spring.datasource.password=your-password
```

2. Configure DeepSeek AI API credentials:
```properties
deepseek.api.url=https://api.deepseek.com
deepseek.api.key=your-deepseek-api-key
```

### Running the application

1. Build the application:
```bash
mvn clean install
```

2. Run the application:
```bash
mvn spring-boot:run
```

The server will start on port 8080 by default.

## API Documentation

Once the application is running, API documentation is available at:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Main API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Resource Management
- `GET /api/resources/public` - Get all public resources
- `GET /api/resources/public/search` - Search resources
- `GET /api/resources/public/filter` - Filter resources

### Teacher Endpoints
- `GET /api/teachers/public` - Get all verified teachers
- `GET /api/teachers/public/search` - Search for teachers
- `PUT /api/teachers/{id}` - Update teacher profile

### Consultation
- `POST /api/consultations/request` - Request consultation
- `GET /api/consultations/student` - Get student's consultations
- `GET /api/consultations/teacher` - Get teacher's consultations
- `PUT /api/consultations/{id}/status` - Update consultation status

### AI Learning
- `POST /api/ai-learning/sessions` - Start a learning session
- `POST /api/ai-learning/sessions/{sessionId}/query` - Send query to AI
- `POST /api/ai-learning/quick-query` - Get a quick AI response 