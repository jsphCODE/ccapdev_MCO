const express = require('express'); const app = express();
const PORT = 3000;
const users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role:
'Admin' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User' }, 
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role:
'Moderator' }
];
// Get all users 
app.get('/api/users', (req, res) => {
    res.json(users);
});
// Get one specific user by ID 
app.get('/api/users/:id', (req, res) => {
const userId = parseInt(req.params.id);
const user = users.find(u => u.id === userId);
  if (user) {
    res.json(user);
} else {
    res.status(404).json({ message: `User with ID ${userId} not found` }); }
});
app.use(express.static(__dirname));
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    });;