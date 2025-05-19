# Customizable Bicycle E-commerce

## Introduction

This project is a technical solution for Marcus, a bicycle shop owner who wants to sell highly customizable bicycles online. The system is designed to be extensible, so Marcus can eventually sell other sports-related products (such as skis, surfboards, roller skates, etc.) using the same platform. The main challenge is to allow customers to fully customize their bicycles, enforce compatibility rules, manage inventory, and support dynamic pricing based on selected options and combinations.

---

## How This Solution Meets the Exercise Requirements

| Requirement | Solution Overview |
|-------------|------------------|
| **1. Data model** | Relational model with entities for Product, Part Category, Option, Compatibility Rule, Price Rule, Inventory, Cart, and Order. See details below. |
| **2. Main user actions** | Users can browse products, customize bicycles with real-time validation, add to cart, and checkout. |
| **3. Product page** | UI allows sequential selection of options, shows only compatible/available options, and updates price dynamically. |
| **4. Add to cart** | When adding to cart, the selected configuration is validated and persisted. |
| **5. Admin workflows** | Admins can create/edit products, manage options, set compatibility and price rules, and update inventory. |
| **6. New product creation** | Admin UI/API allows creation of new products and associated part categories. |
| **7. Adding a new part choice** | Admin can add new options (e.g., rim color) via UI/API; database updates accordingly. |
| **8. Setting prices** | Admin can set base and conditional prices for options and combinations. |

---

## Project Features

- Full bicycle customization with compatibility and inventory validation
- Dynamic price calculation, including special pricing rules for option combinations
- Admin panel for product, option, and rule management
- Shopping cart and order management
- Extensible to other sports products

---

## Data Model

The system uses a relational data model optimized for customizable products:

**Entities:**
- **Product**: Represents a sellable item (e.g., bicycle, ski, etc.)
- **Part Category**: Groups of parts (e.g., frame, wheels, chain)
- **Option**: Specific choices for each part (e.g., frame type: full-suspension, diamond)
- **Compatibility Rule**: Defines prohibited or required combinations between options
- **Price Rule**: Defines special prices for specific option combinations
- **Inventory**: Tracks stock for each option
- **Cart**: Stores user selections before purchase
- **Order**: Records completed purchases

**Relationships:**
- Product 1:N Part Category
- Part Category 1:N Option
- Option N:M Compatibility Rule
- Option N:M Price Rule

**Example Table Structure:**
- `products (id, name, description, base_price, ...)`
- `part_categories (id, product_id, name, ...)`
- `options (id, part_category_id, name, base_price, in_stock, ...)`
- `compatibility_rules (id, option_id, incompatible_option_id, type)`
- `price_rules (id, option_id, condition_option_id, conditional_price)`
- `inventory (option_id, in_stock)`
- `cart (id, user_id, created_at, ...)`
- `cart_items (id, cart_id, product_id, selected_options, quantity)`
- `orders (id, user_id, cart_snapshot, total_price, created_at, ...)`

---

## Main User Actions

1. **Explore Products**: Users browse the catalog, filter by type, and view product details.
2. **Customize Bicycle**: Users select options for each part. The UI only shows compatible and in-stock options. Price updates in real time.
3. **Add to Cart**: The selected configuration is validated for compatibility and stock before being added to the cart.
4. **Cart Management**: Users can review, modify, or remove items from the cart, and proceed to checkout.

---

## Product Page & Price Calculation

- The product page presents a step-by-step configurator.
- Available options are filtered based on current selections and compatibility rules (e.g., "mountain wheels" only allow "full-suspension" frames).
- Out-of-stock options are disabled.
- Price is calculated by summing the base prices of selected options, plus any conditional price rules (e.g., "matte finish" + "full-suspension frame" = €50).

---

## Add to Cart Action

- When the user clicks "Add to Cart":
  - The backend validates the selected options for compatibility and stock.
  - If valid, the configuration is saved in the cart (including product, selected options, and quantity).
  - The cart is persisted in the database and associated with the user (or session).

---

## Administrative Workflows

- **Product Management**: Create/edit products and their part categories.
- **Option Management**: Add/edit options for each part category, set stock status.
- **Compatibility Rules**: Define which options are incompatible or required together.
- **Price Rules**: Set special prices for specific option combinations.
- **Inventory**: Mark options as in or out of stock.
- **Sales Analysis**: Review orders and popular configurations.

---

## Creating New Products and Options

- **New Product**: Admin provides product name, description, base price, and defines part categories.
- **New Option**: Admin adds a new option (e.g., rim color) to a part category via the admin UI/API. The database updates the `options` table.

---

## Setting Prices and Price Rules

- Admin can set the base price for each option.
- Admin can define conditional price rules (e.g., "matte finish" + "full-suspension frame" = €50) via the admin UI/API, which updates the `price_rules` table.

---

## Technical Decisions & Trade-offs

- **Relational Database (PostgreSQL)**: Chosen for its ability to model complex relationships and enforce data integrity, especially for compatibility and pricing rules.
- **Backend/Frontend Separation**: Enables independent scaling and parallel development.
- **Dockerization**: Ensures consistent environments for development and production.
- **Extensibility**: The model supports adding new product types and options without major changes.
- **Validation Logic**: Compatibility and pricing logic is centralized in the backend for consistency and security.

---

## Project Structure

```
/
├── backend/               # FastAPI API
│   ├── app/
│   │   ├── api/           # API routes (products, cart, admin)
│   │   ├── models/        # Data models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── db/            # Database setup
│   │   ├── core/          # Core functionality
│   │   └── main.py        # Entry point
│   ├── tests/             # Test cases
│   └── Dockerfile
├── frontend/              # Next.js Application
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   ├── api/           # API clients
│   │   ├── store/         # State management
│   │   ├── hooks/         # Custom React hooks
│   │   ├── config/        # Configuration
│   │   └── types/         # TypeScript types
│   └── Dockerfile
├── docker-compose.yml     # Docker configuration
├── scripts/               # Useful scripts (e.g., setup.sh)
└── README.md
```

---

## How to Run the Project

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start (Recommended)

Use the provided setup script to build and start all services:

```bash
./scripts/setup.sh
```

This will:
- Check Docker and Docker Compose installation
- Create required Docker volumes
- Build and start all containers (database, backend, frontend)
- Print URLs for accessing the frontend and backend

### Manual Start

1. Clone the repository:
```bash
cd factorial-technical-test
```
2. Start with Docker Compose:
```bash
docker compose up -d
```
3. Access the application:
   - Frontend: http://localhost:3000
   - API Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Running Backend Tests

```bash
docker compose exec backend pytest
```

---

## Example API Endpoints

- **Get all products:** `GET /api/v1/products/`
- **Get product details:** `GET /api/v1/products/{product_id}`
- **Get available options for a product:** `GET /api/v1/products/{product_id}/options`
- **Validate compatibility:** `POST /api/v1/products/validate-compatibility`
- **Calculate price:** `POST /api/v1/products/calculate-price`
- **Cart management:** `GET /api/v1/cart`, `POST /api/v1/cart/items`
- **Admin (create product):** `POST /api/v1/admin/products`
- **Admin (add option):** `POST /api/v1/admin/part-types/{part_type_id}/options`
- **Admin (set price rule):** `POST /api/v1/admin/options/{option_id}/conditional-prices`

---

## Future Improvements

- User authentication and role-based access control
- Customer accounts and order history
- Enhanced admin analytics
- Support for more product types
- Improved error handling and UI feedback

---

