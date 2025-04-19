const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs").promises;
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

async function getData() {
  try {
    const data = await fs.readFile("./data.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    return { users: [], posts: [] };
  }
}

async function saveData(data) {
  await fs.writeFile("./data.json", JSON.stringify(data, null, 2));
}

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const data = await getData();
  if (data.users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "User exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  data.users.push({ username, password: hashedPassword, role: "admin" });
  await saveData(data);
  res.status(201).json({ message: "User created" });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const data = await getData();
  const user = data.users.find((u) => u.username === username);
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({ message: "Login successful", role: user.role });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.post("/api/posts", async (req, res) => {
  const { title, content, private } = req.body;
  const data = await getData();
  const post = {
    id: data.posts.length + 1,
    title,
    content,
    date: new Date().toISOString(),
    private,
  };
  data.posts.push(post);
  await saveData(data);
  res.status(201).json({ message: "Post created" });
});

app.get("/api/posts", async (req, res) => {
  const data = await getData();
  const publicPosts = data.posts.filter((p) => !p.private);
  res.json(publicPosts);
});

app.get("/", (req, res) => {
  res.send("Welcome to Ibtida's Journal Backend");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));