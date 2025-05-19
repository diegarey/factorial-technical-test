# Customizable Bicycle E-commerce 🚲

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## 📋 Table of Contents
- [Introduction](#introduction)
- [How This Solution Meets the Exercise Requirements](#how-this-solution-meets-the-exercise-requirements)
- [Project Features](#project-features)
- [Data Model](#data-model)
- [Main User Actions](#main-user-actions)
- [Product Page & Price Calculation](#product-page--price-calculation)
- [Add to Cart Action](#add-to-cart-action)
- [Administrative Workflows](#administrative-workflows)
- [Creating New Products and Options](#creating-new-products-and-options)
- [Setting Prices and Price Rules](#setting-prices-and-price-rules)
- [Technical Decisions & Trade-offs](#technical-decisions--trade-offs)
- [Project Structure](#project-structure)
- [How to Run the Project](#how-to-run-the-project)
- [Example API Endpoints](#example-api-endpoints)
- [API Request & Response Examples](#api-request--response-examples)
- [Future Improvements](#future-improvements)
- [Troubleshooting](#troubleshooting)
- [Development Notes](#development-notes)
- [Contact](#contact)

## 🚀 Introduction

This project is a technical solution for Marcus, a bicycle shop owner who wants to sell highly customizable bicycles online. The system is designed to be extensible, so Marcus can eventually sell other sports-related products (such as skis, surfboards, roller skates, etc.) using the same platform. The main challenge is to allow customers to fully customize their bicycles, enforce compatibility rules, manage inventory, and support dynamic pricing based on selected options and combinations.

---

## 📊 How This Solution Meets the Exercise Requirements

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

## ✨ Project Features

- 🔧 Full bicycle customization with compatibility and inventory validation
- 💰 Dynamic price calculation, including special pricing rules for option combinations
- 👨‍💼 Admin panel for product, option, and rule management
- 🛒 Shopping cart and order management
- 🔄 Extensible to other sports products

---

## 🗃️ Data Model

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

**Entity Relationship Diagram (simplified):**

```
Product
  ↓ 1:N
Part Category
  ↓ 1:N
Option ←→ Option (via Compatibility Rule) N:M
  ↓
  ↓ N:M
Option ←→ Option (via Price Rule) N:M
```

**Example Table Structure:**
- `products (id, name, description, base_price, image, featured)`
- `part_categories (id, product_id, name, display_order)`
- `options (id, part_category_id, name, base_price, in_stock, image)`
- `compatibility_rules (id, option_id, depends_on_option_id, type)` where `type` can be 'requires' or 'excludes'
- `price_rules (id, option_id, condition_option_id, conditional_price)`
- `cart (id, user_id, created_at, updated_at)`
- `cart_items (id, cart_id, product_id, selected_options, quantity, price)`

---

## 👥 Main User Actions

1. **Explore Products**: Users browse the catalog, filter by type, and view product details.
2. **Customize Bicycle**: Users select options for each part. The UI only shows compatible and in-stock options. Price updates in real time.
3. **Add to Cart**: The selected configuration is validated for compatibility and stock before being added to the cart.
4. **Cart Management**: Users can review, modify, or remove items from the cart, and proceed to checkout.

**Customer Flow Diagram:**
```
   Browse           Select Parts           Validate             Checkout
   Catalog          & Options              & Add to Cart        Process
┌──────────┐       ┌───────────┐          ┌──────────┐       ┌──────────┐
│ Products │ ───▶  │ Customize │  ───▶    │   Cart   │ ───▶  │   Order  │
└──────────┘       └───────────┘          └──────────┘       └──────────┘
```

---

## 🛠️ Product Page & Price Calculation

- The product page presents a step-by-step configurator.
- Available options are filtered based on current selections and compatibility rules (e.g., "mountain wheels" only allow "full-suspension" frames).
- Out-of-stock options are disabled.
- Price is calculated by summing the base prices of selected options, plus any conditional price rules (e.g., "matte finish" + "full-suspension frame" = €50).

**Price Calculation Example:**
```
Base Product: Mountain Bike (Base Price: €200)
Selected Options:
- Full-suspension frame: +€130
- Matte finish: +€25 (standard)
  * But with full-suspension frame: +€50 (conditional price rule)
- Road wheels: +€80
- Blue rim: +€20
- Single-speed chain: +€43

Total: €200 (base) + €130 + €50 + €80 + €20 + €43 = €523
```

---

## 🛒 Add to Cart Action

- When the user clicks "Add to Cart":
  - The backend validates the selected options for compatibility and stock.
  - If valid, the configuration is saved in the cart (including product, selected options, and quantity).
  - The cart is persisted in the database and associated with the user (or session).

**Backend Process:**
1. Validate all selected options against compatibility rules
2. Check if all selected options are in stock
3. Calculate the final price including any conditional pricing
4. Create/update cart and cart item records
5. Return success response or validation errors

---

## 👨‍💼 Administrative Workflows

- **Product Management**: Create/edit products and their part categories.
- **Option Management**: Add/edit options for each part category, set stock status.
- **Compatibility Rules**: Define which options are incompatible or required together.
- **Price Rules**: Set special prices for specific option combinations.
- **Inventory**: Mark options as in or out of stock.
- **Sales Analysis**: Review orders and popular configurations.

**Admin Interface Capabilities:**
- Create and manage product catalog
- Define part categories and their display order
- Add/edit/remove options for each part
- Set up compatibility rules between options
- Configure special pricing rules for option combinations
- Update inventory status
- View and manage orders

---

## 🆕 Creating New Products and Options

- **New Product**: Admin provides product name, description, base price, and defines part categories.
- **New Option**: Admin adds a new option (e.g., rim color) to a part category via the admin UI/API. The database updates the `options` table.

**Example: Adding a New Rim Color**
1. Admin navigates to the Part Categories section and selects "Rim Color"
2. Clicks "Add New Option"
3. Provides details:
   - Name: "Green"
   - Base Price: €15
   - In Stock: Yes
   - Image: [uploads image]
4. Clicks "Save"
5. The system adds a new record to the `options` table
6. The new rim color is now available for customers to select

---

## 💰 Setting Prices and Price Rules

- Admin can set the base price for each option.
- Admin can define conditional price rules (e.g., "matte finish" + "full-suspension frame" = €50) via the admin UI/API, which updates the `price_rules` table.

**Example: Creating a Conditional Price Rule**
1. Admin navigates to the Price Rules section
2. Clicks "Add New Price Rule"
3. Selects the following:
   - Primary Option: "Matte Finish"
   - Conditional Option: "Full-suspension Frame"
   - Conditional Price: €50
4. Clicks "Save"
5. The system adds a new record to the `price_rules` table
6. When a customer selects both options, the price will use the conditional price instead of the base price

---

## 🧩 Technical Decisions & Trade-offs

- **Relational Database (PostgreSQL)**: Chosen for its ability to model complex relationships and enforce data integrity, especially for compatibility and pricing rules.
- **Backend/Frontend Separation**: Enables independent scaling and parallel development.
- **Dockerization**: Ensures consistent environments for development and production.
- **Extensibility**: The model supports adding new product types and options without major changes.
- **Validation Logic**: Compatibility and pricing logic is centralized in the backend for consistency and security.

**Why PostgreSQL?**
- Complex queries for compatibility rules and price calculations
- Transactional integrity for cart and order operations
- Rich data types and constraints
- Excellent performance for relational data
- Robust ecosystem and tooling

**Why FastAPI?**
- High performance for API endpoints
- Built-in data validation with Pydantic
- Automatic OpenAPI documentation
- Async support for scalability
- Type safety with Python type hints

**Why Next.js?**
- Server-side rendering for better SEO
- Optimized performance with automatic code splitting
- Excellent developer experience
- Built-in API routes
- Strong TypeScript support

---

## 📁 Project Structure

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

## 🏃‍♂️ How to Run the Project

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

## 🔌 Example API Endpoints

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

## 🗃️ Database Initialization

The project includes a data initialization system that loads sample products and options into the database. This process is implemented in the file `backend/app/db/init_db.py`.

### Key Features:

- **Initial Cleanup**: Removes all existing data to ensure a clean initialization
- **Predefined Products**: Loads various types of products (bicycles, skis, surfboards, skates, etc.)
- **Hierarchical Structure**: Defines customizable parts (frames, wheels, brakes, etc.) for each product
- **Customization Options**: For each part, creates multiple options with their base prices
- **Compatibility Rules**: Establishes relationships between options (requires/excludes)
- **Conditional Pricing**: Defines special prices when certain options are combined

### Examples of Initialized Products:

- **Bicycles**: Mountain Bike, Road Bike, Urban, Hybrid, Electric, BMX, etc.
- **Sports Products**: Skis, Surfboards, Skates, Snowboard, etc.

The database is initialized automatically when the container starts for the first time or can be reinitialized through admin endpoints.

To manually run the initialization:

```bash
docker compose exec backend python -c "from app.db.database import get_db; from app.db.init_db import init_db; init_db(next(get_db()))"
```

---

## 🔮 Future Improvements

- User authentication and role-based access control
- Customer accounts and order history
- Enhanced admin analytics
- Support for more product types
- Improved error handling and UI feedback
- Internationalization and multi-currency support
- Integration with payment gateways
- Marketing features (discounts, promotions, etc.)

