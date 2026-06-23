# Use the mockoon/cli:latest as the base image
FROM mockoon/cli:latest

# Set the working directory
WORKDIR /app

# Copy the data folder from the host to the container
COPY ./data /data

# Fix: Only run the port 3002 NID environment file
CMD ["-d", "/data/environment_port_3002.json"]