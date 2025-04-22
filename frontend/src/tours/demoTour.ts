import { Step } from 'react-joyride';

// Define the tour steps for the demo
const demoTour: Step[] = [
  {
    target: '#api-key-form',
    content: 'Start by entering your Bot ID and API Key to authenticate with the Agentive API. For testing, you can use the sandbox credentials.',
    title: 'Enter API Credentials',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '#purchase-credits-section',
    content: 'Purchase credits to power your AI agents. Credits are used for API calls and are consumed based on your usage.',
    title: 'Purchase Credits',
    placement: 'bottom',
  },
  {
    target: '#usage-dashboard',
    content: 'Monitor your API usage, credit balance, and request history in real-time with our interactive dashboard.',
    title: 'Check Usage',
    placement: 'top',
  },
  {
    target: '#webhook-form',
    content: 'Register webhooks to receive real-time notifications when events occur in your Agentive account.',
    title: 'Register Webhooks',
    placement: 'bottom',
  },
  {
    target: '#sandbox-toggle',
    content: 'Toggle between live and sandbox environments to test your integration without affecting your production data.',
    title: 'Sandbox Mode',
    placement: 'top',
  },
];

export default demoTour;
