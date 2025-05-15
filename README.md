# Customizable Bicycle E-commerce

E-commerce system for Marcus that allows selling highly customizable bicycles with:
- Frontend in Next.js
- Backend in FastAPI
- PostgreSQL database
- All dockerized

## Project Description

This project is a solution for Marcus's bicycle shop, enabling online sales of fully customizable bicycles. The system is designed with scalability to allow future sales of other sports items such as skis, surfboards, skates, etc.

### Key Functionality
- Customers can fully customize their bicycles by choosing different options for each part
- Some combinations are prohibited due to real physical limitations
- Inventory control to mark options as "temporarily out of stock"
- Dynamic price calculation based on selected options, including special pricing rules for certain combinations

## Main Features
- Bicycle customization with compatibility verification
- Inventory control
- Dynamic pricing based on configurations
- Admin panel
- Shopping cart

## Data Model

The system uses a relational data model optimized for product customization:

### Main Entities
- **Product**: Available bicycle types (and future products like skis, etc.)
- **Part Category**: Part groupings (frame, wheels, chain, etc.)
- **Option**: Specific options for each category (e.g., frame types: Full-suspension, Diamond, Step-through)
- **Compatibility Rule**: Defines prohibited combinations between options
- **Price Rule**: Defines special prices for specific combinations
- **Inventory**: Stock control for each option
- **Cart**: Stores user selections
- **Order**: Record of completed purchases

### Key Relationships
- Product -> Part Category (1:N)
- Part Category -> Option (1:N)
- Option <-> Compatibility Rule (N:M)
- Option <-> Price Rule (N:M)

## Architecture

### Backend (FastAPI)
- REST API routes for products, parts, options, and cart
- Parts compatibility validation
- Dynamic price calculation based on configurations
- Data management through SQLAlchemy

### Frontend (Next.js)
- Interfaces for exploring products
- Bicycle configurator with real-time validation
- Shopping cart
- Responsive design with Tailwind CSS

### Database (PostgreSQL)
- Relational storage for products, parts, and dependencies
- Cart and order records

## Main User Actions

### 1. Explore Products
- Browse bicycle catalog
- Filter by type and characteristics

### 2. Bicycle Customization
- Sequential selection of options for each part
- Real-time compatibility validation
- Dynamic price updates based on selections
- Display of available/unavailable options

### 3. Cart Management
- Add configuration to cart
- Review and modify items
- Checkout process

## Administrative Workflows

### 1. Product Management
- Creation of new product types (bicycles, skis, etc.)
- Definition of associated part categories

### 2. Options Management
- Add new options for each category (e.g., new rim colors)
- Configure stock availability

### 3. Rules Configuration
- Define compatibility rules between options
- Set special pricing rules for specific combinations

### 4. Sales Analysis
- Order review
- Popular configuration statistics

## Example Cases Included

### Compatibility Rules
- If "Fat Bike Wheels" is chosen → "Red Rim" is not available
- If "Mountain Wheels" is chosen → Only "Full-suspension" frame is available

### Special Price Rules
- If "Matte" + "Diamond Frame" is chosen → 35€
- If "Matte" + "Full-suspension Frame" is chosen → 50€

### Inventory Control
- If an option is out of stock → it cannot be selected

## Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd factorial-technical-test
```

2. Start with Docker:
```bash
docker compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - API Backend: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Running Tests

### Backend Tests
```bash
docker compose exec backend pytest
```

## Project Structure

```
/
├── backend/               # FastAPI API
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── models/        # Data models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── main.py        # Entry point
│   └── Dockerfile
├── frontend/              # Next.js Application
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   ├── api/           # API clients
│   │   └── types/         # TypeScript types
│   └── Dockerfile
├── docker-compose.yml     # Docker configuration
└── scripts/               # Useful scripts
```

## Technical Decisions

### PostgreSQL Choice
- The relational nature of the data model requires a robust relational system
- Compatibility rules and special prices are efficiently implemented through SQL queries

### Backend/Frontend Separation
- Allows independent scalability
- Facilitates parallel development of frontend and backend

### Dockerization
- Ensures consistency between development and production environments
- Simplifies deployment
