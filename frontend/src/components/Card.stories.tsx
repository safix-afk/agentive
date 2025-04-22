import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
    },
    subtitle: {
      control: 'text',
    },
    hover: {
      control: 'boolean',
    },
    icon: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  args: {
    children: (
      <div className="p-4">
        <p>This is a basic card with default styling.</p>
      </div>
    ),
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Card Title',
    children: (
      <div className="p-4">
        <p>This card has a title.</p>
      </div>
    ),
  },
};

export const WithTitleAndSubtitle: Story = {
  args: {
    title: 'Card Title',
    subtitle: 'This is a subtitle for the card',
    children: (
      <div className="p-4">
        <p>This card has both a title and subtitle.</p>
      </div>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Card with Icon',
    icon: '📊',
    children: (
      <div className="p-4">
        <p>This card includes an icon next to the title.</p>
      </div>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    title: 'Hoverable Card',
    hover: true,
    children: (
      <div className="p-4">
        <p>Hover over this card to see the hover effect.</p>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    title: 'Interactive Card',
    hover: true,
    onClick: () => alert('Card clicked!'),
    children: (
      <div className="p-4">
        <p>Click this card to trigger an action.</p>
      </div>
    ),
  },
};

export const FullExample: Story = {
  args: {
    title: 'Complete Example',
    subtitle: 'This card demonstrates all features',
    icon: '🚀',
    hover: true,
    onClick: () => alert('Card clicked!'),
    children: (
      <div className="p-4">
        <p className="mb-4">This card includes all available features: title, subtitle, icon, hover effect, and click interaction.</p>
        <button className="px-4 py-2 bg-primary-950 text-white rounded-md">Button Inside Card</button>
      </div>
    ),
  },
};
