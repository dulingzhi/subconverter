@echo off
REM Build and run Docker container (Windows)
docker-compose up --build -d

echo Container started. Check status with: docker-compose ps
echo View logs with: docker-compose logs -f
