# 🍽️ Cumpas Crave

Cumpas Crave is a full-stack food ordering platform designed for university campuses. The application allows students to browse cafés, explore menus, place orders, and manage their accounts through a modern web interface.

## Features

- User authentication and authorization
- Browse campus cafés
- View food and beverage menus
- Shopping cart functionality
- Place and manage orders
- User profile management
- Responsive React frontend
- RESTful Express API
- MongoDB database integration

## Tech Stack

### Frontend
- React.js
- React Router
- Axios
- Material UI
- Context API

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt

## Project Structure

```
cumpas_Crave_fixed/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
└── README.md
```

## Installation

### Clone the repository

```bash
git clone https://github.com/your-username/cumpas-crave.git
```

Move into the project directory.

```bash
cd cumpas_Crave_fixed
```

## Backend Setup

Navigate to the server directory.

```bash
cd server
```

Install dependencies.

```bash
npm install
```

Create an environment file.

```bash
cp .env.example .env
```

Start the backend server.

```bash
npm start
```

or

```bash
npm run dev
```

## Frontend Setup

Open a new terminal.

```bash
cd client
```

Install dependencies.

```bash
npm install
```

Run the development server.

```bash
npm start
```

The application will be available at:

```
http://localhost:3000
```

## API

The backend exposes REST APIs for:

- Authentication
- User management
- Café management
- Menu management
- Shopping cart
- Orders

## Environment Variables

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

## Screenshots

Add screenshots of:

- Home page
- Login page
- Café list
- Menu page
- Shopping cart
- Checkout page

## Future Improvements

- Online payment integration
- Order notifications
- Admin dashboard
- Ratings and reviews
- Favorite cafés
- Search and filtering
- Email verification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

## License

This project is developed for educational purposes.

## Authors

Developed by **YANET BELAY**