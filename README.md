# Tea Stall Management System

A complete tea stall management system built with React, Express.js, and PostgreSQL.

## Features

- **Dashboard**: Real-time sales statistics and order overview
- **Inventory Management**: Track stock levels with low-stock alerts
- **Order Processing**: Create, track, and manage customer orders
- **Billing System**: Generate and print professional receipts
- **Mobile Responsive**: Works on phones, tablets, and computers

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tea-stall-app)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
DATABASE_URL=your_postgresql_connection_string
```

3. Push database schema:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Shadcn/ui components

## Sample Items Included

The system comes pre-loaded with authentic tea stall items:
- Various teas (Masala, Ginger, Black, Green, Cardamom)
- Popular snacks (Samosas, Pakoras, Bread Omelette)
- Refreshing beverages (Cold Coffee, Lemonade, Fresh Juice, Lassi)

## Environment Variables

```env
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

## Deployment

This app is ready to deploy on:
- Vercel (Recommended)
- Netlify
- Railway
- Render

For Vercel deployment, the app will automatically:
- Build the frontend and backend
- Set up PostgreSQL database
- Configure environment variables
- Provide a live URL

## License

MIT License - Feel free to use for your tea stall business!