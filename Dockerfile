FROM node:20

WORKDIR /app

# The build system strips the top-level folder from your zip and places your Dockerfile at the root
COPY . .

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

WORKDIR /app
