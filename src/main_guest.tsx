import React from 'react';
import { createRoot } from 'react-dom/client';
import GuestApp from './GuestApp';

const root = createRoot(document.getElementById('root')!);
root.render(<GuestApp />);
