# 🏖️ Cancún Beach Simulator

A lightweight, multiplayer 3D beach simulation game set in Cancún. Players can explore the beach, interact with NPCs, and chat in real-time. Built with **Three.js**, **Socket.IO**, and **PostgreSQL**.

> 🕹️ [Playable Demo](https://cancun-beach-simulator.onrender.com)

![Cancun Beach Simulator](/public/back.png)

---

## 🎮 Features

- First-person exploration using **WASD** or **touch controls**.
- Real-time multiplayer support with **Socket.IO**.
- Interactable NPCs with AI-generated responses.
- Dynamic environment:
  - Ocean, sand, streets, palm trees, and beach umbrellas.
  - Iconic colorful **Cancún letters** as a backdrop.
- Player tracking stored in **PostgreSQL**.
- Works on **desktop** and **mobile**.

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Three.js  
- **Backend:** Node.js, Express.js, Socket.IO  
- **Database:** PostgreSQL  
- **AI:** AI generated NPC responses via backend API 

---

## 🚀 Getting Started

### 1. Clone the repository
```
git clone https://github.com/your-username/cancun-beach-simulator.git
cd cancun-beach-simulator
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a .env file for local development:

```
OPENAI_API_KEY=sk-XXXXXXXXXXXXX

# Local PostgreSQL
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=cancun_beach
DB_HOST=localhost
DB_PORT=5432
```

### 4. Start the server
```bash
npm start
```

The server will automatically create the players table if it doesn't exist.

### 5. Open in browser
Visit http://localhost:3000 to start exploring Cancún Beach.

## 💡 Usage
- Movement: W, A, S, D  
- Look: Arrow keys (← →)  
- Interact with NPC: E  
- Close chat: ESC  
- Mobile: Use touch controls to move and rotate  
- When a player joins, their name and IP are stored in the database.

## 📂 Project Structure
```
/public         # Static frontend files (HTML, CSS, JS)
/server.js      # Node.js + Express + Socket.IO server
/db.js          # PostgreSQL connection and table setup
```

## 📝 License
This project is open source and available under the MIT License.
