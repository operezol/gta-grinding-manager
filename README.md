# 🎮 GTA Grinding Manager

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A comprehensive full-stack web application for optimizing GTA Online farming sessions with real-time analytics, persistent data storage, and efficiency tracking.

![GTA Grinding Manager](./screenshot.png)

## 🚀 Features

- **📊 Real-time Activity Tracking** - Monitor your grinding sessions as they happen
- **💾 Persistent Database** - SQLite storage for historical statistics and analysis
- **📈 Efficiency Analytics** - Analyze profitability and time efficiency by activity and category
- **⏰ Cooldown Management** - Automatic notifications for activity cooldowns
- **📱 Responsive Dashboard** - Interactive UI with data visualization
- **🔌 REST API** - Full API for external tool integration
- **🎯 Activity Categories** - Organize activities by type (Heists, Businesses, Missions, etc.)

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite3** - Lightweight database
- **Winston** - Logging library
- **CORS** - Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js 14.18.0 or higher
- pnpm (recommended) or npm

### Setup

```bash
# Clone the repository
git clone https://github.com/operezol/gta-grinding-manager.git
cd gta-grinding-manager

# Install backend dependencies
pnpm install

# Install frontend dependencies
cd frontend
pnpm install
cd ..
```

## 🚀 Usage

### Development Mode

```bash
# Start both frontend and backend concurrently
pnpm run dev
```

This will start:
- Backend server on `http://localhost:3000`
- Frontend dev server on `http://localhost:5173`

### Production Mode

```bash
# Build frontend
pnpm run build

# Start production server
pnpm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
gta-grinding-manager/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main app component
│   ├── package.json
│   └── vite.config.ts
├── server-simple.js      # Express backend server
├── activities.db         # SQLite database
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Activities

- `GET /api/activities` - Get all activities
- `POST /api/activities` - Create new activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Statistics

- `GET /api/stats/summary` - Get overall statistics
- `GET /api/stats/by-category` - Get stats by category
- `GET /api/stats/efficiency` - Get efficiency metrics

## 💡 Use Cases

- **Optimize Grinding Routes** - Identify most profitable activities
- **Track Session Performance** - Monitor earnings over time
- **Plan Cooldown Rotations** - Never waste time waiting
- **Analyze Efficiency** - Compare $/hour across activities
- **Historical Data** - Review past sessions and trends

## 🎯 Roadmap

- [ ] Add charts and graphs for visual analytics
- [ ] Implement user authentication
- [ ] Add activity templates and presets
- [ ] Export data to CSV/JSON
- [ ] Mobile app version
- [ ] Multi-user support
- [ ] Integration with GTA Online API (if available)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Oriol Pérez Olivares**

- GitHub: [@operezol](https://github.com/operezol)
- Email: oriolperezolivares@gmail.com

## 🙏 Acknowledgments

- Built for the GTA Online grinding community
- Inspired by the need for efficient session management
- Thanks to all contributors and users

---

<div align="center">
Made with ❤️ for GTA Online grinders
</div>
