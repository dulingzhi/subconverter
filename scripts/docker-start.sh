#!/bin/bash

# Build and run Docker container
docker-compose up --build -d

echo "Container started. Check status with: docker-compose ps"
echo "View logs with: docker-compose logs -f"
