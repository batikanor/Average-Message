# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json files for dependency installation
COPY package*.json ./

# Install Next.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Accept NEXT_PUBLIC_API_URL as build argument and set as environment variable
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG APP_ID
ENV APP_ID=$APP_ID

# Build the static site (creates /app/out)
RUN npm run build

# Expose the port Next.js runs on
EXPOSE ${FRONTEND_INTERNAL_PORT}

# Start the Next.js application
CMD ["npm", "run", "dev"]
