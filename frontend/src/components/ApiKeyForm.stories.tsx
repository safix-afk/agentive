import type { Meta, StoryObj } from '@storybook/react';
import ApiKeyForm from './ApiKeyForm';

const meta: Meta<typeof ApiKeyForm> = {
  title: 'Components/ApiKeyForm',
  component: ApiKeyForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ApiKeyForm>;

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  args: {
    className: 'max-w-sm mx-auto bg-gray-50 dark:bg-gray-800',
  },
};

export const WithID: Story = {
  args: {
    id: 'api-key-form',
  },
};

export const WithSubmitHandler: Story = {
  args: {
    onSubmit: (botId, apiKey) => {
      console.log('Form submitted with:', { botId, apiKey });
      alert(`Submitted: Bot ID: ${botId}, API Key: ${apiKey}`);
    },
  },
};
