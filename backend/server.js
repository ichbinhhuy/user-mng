const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose
  .connect("mongodb+srv://20215394:20215394@cluster0.llfliw8.mongodb.net/it4409")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Error:", err));

// Schema 
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên không được để trống"],
    minlength: [2, "Tên phải có ít nhất 2 ký tự"]
  },
  age: {
    type: Number,
    required: [true, "Tuổi không được để trống"],
    min: [0, "Tuổi phải >= 0"]
  },
  email: {
    type: String,
    required: [true, "Email không được để trống"],
    match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    unique: true
  },
  address: {
    type: String
  }
});

const User = mongoose.model("User", UserSchema);

// GET 
app.get("/api/users", async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    // Giới hạn page/limit
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const skip = (page - 1) * limit;

    // Promise.all 
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({ page, limit, total, totalPages, data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST 
app.post("/api/users", async (req, res) => {
  try {
    const { name, age, email, address } = req.body;

    const newUser = await User.create({
      name: name?.trim(),
      age: parseInt(age),
      email: email?.trim(),
      address: address?.trim()
    });

    res.status(201).json({ message: "Tạo người dùng thành công", data: newUser });
  } catch (err) {
    // Xử lý lỗi trùng email
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT 
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const { name, age, email, address } = req.body;

    // Chỉ cập nhật trường được truyền vào
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (age !== undefined) updateData.age = parseInt(age);
    if (email !== undefined) updateData.email = email.trim();
    if (address !== undefined) updateData.address = address.trim();

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({ message: "Cập nhật người dùng thành công", data: updatedUser });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});