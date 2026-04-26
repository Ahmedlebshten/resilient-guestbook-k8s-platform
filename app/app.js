const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'guestbook',
  port: 5432,
});

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    const messages = result.rows;

    let messageList = messages.map(m => `
      <div class="bg-gray-800 p-4 rounded-lg mb-3 border-l-4 border-blue-500 shadow-md">
        <p class="text-blue-400 font-bold text-sm">${new Date(m.created_at).toLocaleString()}</p>
        <p class="text-gray-200 font-semibold mt-1">${m.name}</p>
        <p class="text-gray-400 mt-2 italic">"${m.message}"</p>
      </div>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cloud Native GuestBook</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-white min-h-screen font-sans">
        <div class="container mx-auto px-4 py-10 max-w-2xl">
          <header class="text-center mb-10">
            <h1 class="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Cloud Native Guestbook
            </h1>
            <p class="text-gray-400 mt-2">Powered by Kubernetes & PostgreSQL Operator</p>
          </header>

          <section class="bg-gray-800 p-6 rounded-xl shadow-2xl mb-10 border border-gray-700">
            <form action="/send" method="POST" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Your Name</label>
                <input type="text" name="name" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Message</label>
                <textarea name="message" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white h-24"></textarea>
              </div>
              <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.01]">
                Send Message 🚀
              </button>
            </form>
          </section>

          <section>
            <h2 class="text-2xl font-bold mb-6 flex items-center">
              <span class="bg-blue-500 w-2 h-8 rounded-full mr-3"></span> Latest Messages
            </h2>
            <div id="messages">${messageList || '<p class="text-gray-500 text-center py-10">No messages yet. Be the first!</p>'}</div>
          </section>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Database not ready yet. Please check your Operator setup!");
  }
});

// recieve and store messages
app.post('/send', async (req, res) => {
  const { name, message } = req.body;
  try {
    await pool.query('INSERT INTO messages (name, message) VALUES ($1, $2)', [name, message]);
    res.redirect('/');
  } catch (err) {
    res.send("Error saving message: " + err.message);
  }
});

// create table if not exists (in case it doesn't exist) so it doesnt crash 
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database table initialized.");
  } catch (err) {
    console.log("Waiting for database...");
  }
};

app.listen(port, () => {
  console.log(`App running on port ${port}`);
  initDB();
});