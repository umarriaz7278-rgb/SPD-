# SPD - Software Project Dashboard

A comprehensive dashboard for managing bilties, chalans, and warehouse operations for SPD (Software Project Dashboard).

## Features

- **Dashboard**: Real-time overview of operations.
- **Bilty Management**: Create and track bilties easily.
- **Warehouse Operations**: Manage inventory and stocks across multiple warehouses (Karachi, Lahore, etc.).
- **Chalan Management**: Generate and manage transit chalans.
- **Transit Tracking**: Track shipments in real-time.
- **Financials**: Maintain Cash Ledgers, Party Ledgers, and Lahore-specific financial records.
- **Broker Management**: Record and manage broker information.
- **Claims**: Track and manage claims for shortages or damages.

## Tech Stack

- **Frontend**: React (v19), Vite (v8)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend/Database**: Supabase
- **Routing**: React Router (v7)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/umarriaz7278-rgb/SPD-.git
   cd SPD-
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Build and Deployment

To build for production:
```bash
npm run build
```

This project is configured for easy deployment on **Vercel**. Simply connect your GitHub repository to Vercel and it will auto-deploy.

## Support

For any issues or questions, please contact the development team.
