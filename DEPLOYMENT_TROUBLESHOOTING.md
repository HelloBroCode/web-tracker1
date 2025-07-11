# Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Database Connection Issues

**Error**: `could not translate host name "dpg-xxx" to address: Name or service not known`

**Solutions**:
- Ensure the PostgreSQL database service is created and running on Render
- Check that the DATABASE_URL environment variable is properly set
- Verify the database service is in the same region as your web service
- Wait a few minutes after creating the database service before deploying the web service

### 2. Application Startup Failures

**Error**: Application fails to start due to database initialization

**Solutions**:
- The application now includes retry logic for database connections
- Check the `/health` endpoint to verify database connectivity
- If issues persist, manually run the database initialization script

### 3. Environment Variables

**Ensure these environment variables are set in Render**:
- `DATABASE_URL`: Automatically set when linking to a database service
- `RENDER`: Set to "true" for production
- `SECRET_KEY`: Automatically generated by Render
- `OPENAI_API_KEY`: Set manually in Render dashboard

### 4. Manual Database Initialization

If the automatic database initialization fails, you can manually initialize the database:

```bash
# Run the initialization script
python init_db.py
```

### 5. Health Check

Use the health check endpoint to verify application status:
```
GET /health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00"
}
```

### 6. Render-Specific Configuration

**render.yaml**:
- Includes health check path: `/health`
- Configures proper gunicorn settings
- Links to PostgreSQL database service

**Procfile**:
- Uses gunicorn with proper binding and timeout settings
- Includes worker configuration for better performance

### 7. Database Service Setup

1. Create a PostgreSQL database service in Render
2. Ensure the database service is in the same region as your web service
3. Link the database service to your web service
4. The DATABASE_URL will be automatically provided

### 8. Common Render Issues

**Service not starting**:
- Check build logs for dependency issues
- Verify all required environment variables are set
- Ensure the start command is correct

**Database connection timeouts**:
- Increase gunicorn timeout settings
- Check database service status
- Verify network connectivity between services

### 9. Local Testing

Before deploying, test locally with PostgreSQL:
```bash
# Install PostgreSQL locally or use Docker
# Set DATABASE_URL environment variable
# Run the application
python app.py
```

### 10. Logs and Debugging

**Check Render logs**:
- Build logs: Check for dependency installation issues
- Runtime logs: Check for application startup issues
- Database logs: Check for connection issues

**Common log locations**:
- Render dashboard → Your service → Logs
- Real-time logs available during deployment 