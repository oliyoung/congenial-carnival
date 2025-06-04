import type { Meta, StoryObj } from '@storybook/react';
import Breadcrumbs from './breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
    title: 'Components/Breadcrumbs',
    component: Breadcrumbs,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
    args: {},
};