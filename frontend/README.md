# Agentive Frontend

This is the frontend dashboard for the Agentive agent-first API platform. It provides a modern, interactive interface for managing your agent API integrations, purchasing credits, monitoring usage, and configuring webhooks.

## Features

- **Interactive Demo Tour**: Guided experience to showcase platform capabilities
- **API Credentials Management**: Securely store and manage your Bot ID and API Key
- **Credit Purchase Interface**: Easily purchase API credits with multiple package options
- **Usage Dashboard**: Visualize your API usage with interactive charts and statistics
- **Webhook Management**: Register, test, and delete webhook subscriptions
- **Sandbox Environment**: Test the API in a safe sandbox mode without affecting production
- **API Documentation**: Browse comprehensive API documentation

## Getting Started

### Prerequisites

- Node.js 16.0.0 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-organization/agentive-frontend.git
cd agentive-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file from the example:
```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` to set your API base URL:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/v1
```

### Running in Development Mode

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Running Storybook

To view and develop components in isolation, you can use Storybook:

```bash
npm run storybook
# or
yarn storybook
```

This will start the Storybook server at [http://localhost:6006](http://localhost:6006).

## Building for Production

1. Build the application:
```bash
npm run build
# or
yarn build
```

2. Start the production server:
```bash
npm run start
# or
yarn start
```

## Building Storybook

To build Storybook for static deployment:

```bash
npm run build-storybook
# or
yarn build-storybook
```

This will create a `storybook-static` directory with static files that can be deployed to any static hosting service.

## Project Structure

- `/public`: Static assets like images and icons
- `/src/components`: Reusable UI components
- `/src/pages`: Next.js pages for each route
- `/src/styles`: Global styles and Tailwind configuration
- `/src/utils`: Utility functions and API client
- `/src/tours`: Tour configuration for the guided demo

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library for React
- **React Joyride**: Tour guide for web applications
- **Axios**: HTTP client for API requests
- **Headless UI**: Unstyled, accessible UI components
- **Storybook**: Tool for developing UI components in isolation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
