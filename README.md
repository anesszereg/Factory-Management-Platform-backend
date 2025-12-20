# Factory Management Platform - Backend API

RESTful API backend for the Factory Management Platform, built with Node.js, Express, TypeScript, and Prisma ORM.

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: CORS enabled

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL 14+ (or Neon cloud database)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anesszereg/Factory-Management-Platform-backend.git
   cd Factory-Management-Platform-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/factory_management"
   PORT=8000
   NODE_ENV=development
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be running at `http://localhost:8000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── dailyExpenseController.ts
│   │   ├── dailyProductionController.ts
│   │   ├── dashboardController.ts
│   │   ├── furnitureModelController.ts
│   │   ├── materialConsumptionController.ts
│   │   ├── materialPurchaseController.ts
│   │   ├── productionOrderController.ts
│   │   └── rawMaterialController.ts
│   ├── services/          # Business logic
│   │   ├── dailyExpenseService.ts
│   │   ├── dailyProductionService.ts
│   │   ├── dashboardService.ts
│   │   ├── furnitureModelService.ts
│   │   ├── materialConsumptionService.ts
│   │   ├── materialPurchaseService.ts
│   │   ├── productionOrderService.ts
│   │   └── rawMaterialService.ts
│   ├── routes/            # API routes
│   │   ├── dailyExpenses.ts
│   │   ├── dailyProduction.ts
│   │   ├── dashboard.ts
│   │   ├── furnitureModels.ts
│   │   ├── materialConsumption.ts
│   │   ├── materialPurchases.ts
│   │   ├── productionOrders.ts
│   │   └── rawMaterials.ts
│   └── server.ts          # Express app setup
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment template
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server health status

### Furniture Models
- `GET /api/furniture-models` - List all models
- `POST /api/furniture-models` - Create new model
- `GET /api/furniture-models/:id` - Get model by ID
- `PUT /api/furniture-models/:id` - Update model
- `DELETE /api/furniture-models/:id` - Delete model

### Production Orders
- `GET /api/production-orders` - List all orders
- `POST /api/production-orders` - Create new order
- `GET /api/production-orders/:id` - Get order details
- `PUT /api/production-orders/:id` - Update order
- `DELETE /api/production-orders/:id` - Delete order

### Daily Production
- `GET /api/daily-production` - List production entries
- `POST /api/daily-production` - Record daily production
- `GET /api/daily-production/:id` - Get production entry
- `PUT /api/daily-production/:id` - Update production entry
- `DELETE /api/daily-production/:id` - Delete production entry

### Raw Materials
- `GET /api/raw-materials` - List all materials
- `POST /api/raw-materials` - Add new material
- `GET /api/raw-materials/:id` - Get material details
- `PUT /api/raw-materials/:id` - Update material
- `DELETE /api/raw-materials/:id` - Delete material

### Material Purchases
- `GET /api/material-purchases` - List purchases
- `POST /api/material-purchases` - Record purchase
- `GET /api/material-purchases/:id` - Get purchase details
- `PUT /api/material-purchases/:id` - Update purchase
- `DELETE /api/material-purchases/:id` - Delete purchase

### Material Consumption
- `GET /api/material-consumption` - List consumption records
- `POST /api/material-consumption` - Record consumption
- `GET /api/material-consumption/:id` - Get consumption details
- `PUT /api/material-consumption/:id` - Update consumption
- `DELETE /api/material-consumption/:id` - Delete consumption

### Daily Expenses
- `GET /api/daily-expenses` - List expenses
- `POST /api/daily-expenses` - Add expense
- `GET /api/daily-expenses/:id` - Get expense details
- `PUT /api/daily-expenses/:id` - Update expense
- `DELETE /api/daily-expenses/:id` - Delete expense

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🗄️ Database Schema

### Main Tables
- **furniture_models** - Furniture product definitions
- **production_orders** - Production orders with status tracking
- **daily_production** - Daily production records by step
- **raw_materials** - Material inventory
- **material_purchases** - Purchase history
- **material_consumption** - Material usage records
- **daily_expenses** - Daily expense tracking

### Production Steps
1. CUTTING - Initial material cutting
2. MONTAGE - Assembly phase
3. FINITION - Finishing touches
4. PAINT - Painting/coating
5. PACKAGING - Final packaging

### Expense Categories
- ELECTRICITY
- WATER
- TRANSPORT
- SALARIES
- MAINTENANCE
- OTHER

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Production
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production server

# Database
npx prisma migrate dev   # Create and apply new migration
npx prisma migrate deploy # Apply migrations (production)
npx prisma generate      # Generate Prisma Client
npx prisma studio        # Open Prisma Studio (database GUI)

# Prisma Commands
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

## 🌍 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Server port | `8000` |
| `NODE_ENV` | Environment | `development` or `production` |

## 🚀 Deployment

### Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your repository
5. Configure:
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add `DATABASE_URL`, `PORT`, `NODE_ENV`

### Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Deploy from GitHub
5. Add environment variables

### Database Options

**Free PostgreSQL Hosting:**
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - PostgreSQL with extras
- [Railway](https://railway.app) - PostgreSQL + hosting

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test API endpoint
curl http://localhost:8000/api/furniture-models
```

## 🔒 Security Notes

- CORS is enabled for all origins (configure for production)
- Environment variables should never be committed
- Use strong database passwords
- Enable SSL for production databases

## 📝 API Response Format

### Success Response
```json
{
  "id": 1,
  "name": "Oak Table",
  "createdAt": "2025-12-20T00:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Email: anesszereg1@gmail.com

## 🔗 Related

- [Frontend Repository](https://github.com/anesszereg/Factory-Management-Platform)
- [Deployment Guide](../DEPLOYMENT.md)
