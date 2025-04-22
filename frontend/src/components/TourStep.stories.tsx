import type { Meta, StoryObj } from '@storybook/react';
import TourStep from './TourStep';

const meta: Meta<typeof TourStep> = {
  title: 'Components/TourStep',
  component: TourStep,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
    },
    content: {
      control: 'text',
    },
    isActive: {
      control: 'boolean',
    },
    isFirst: {
      control: 'boolean',
    },
    isLast: {
      control: 'boolean',
    },
    step: {
      control: 'number',
    },
    totalSteps: {
      control: 'number',
    },
    onClose: { action: 'closed' },
    onNext: { action: 'next clicked' },
    onBack: { action: 'back clicked' },
  },
};

export default meta;

type Story = StoryObj<typeof TourStep>;

export const Default: Story = {
  args: {
    title: 'Welcome to Agentive',
    content: 'This is the first step of the tour. Click Next to continue.',
    isActive: true,
    step: 1,
    totalSteps: 5,
  },
};

export const MiddleStep: Story = {
  args: {
    title: 'API Key Form',
    content: 'Enter your Bot ID and API Key to authenticate with the Agentive API.',
    isActive: true,
    isFirst: false,
    isLast: false,
    step: 2,
    totalSteps: 5,
  },
};

export const LastStep: Story = {
  args: {
    title: 'You\'re All Set!',
    content: 'You\'ve completed the tour and are ready to start using Agentive.',
    isActive: true,
    isFirst: false,
    isLast: true,
    step: 5,
    totalSteps: 5,
  },
};

export const Inactive: Story = {
  args: {
    title: 'Hidden Step',
    content: 'This step is not active and should not be visible.',
    isActive: false,
    step: 3,
    totalSteps: 5,
  },
};
