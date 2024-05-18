const express = require("express");
const fs = require("fs").promises; // fs modulini promise qilamiz
const cors = require("cors");
const path = require("path");
const url = require("url");
const multer = require("multer");

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

// STORAGE FOR BOOKS
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "files/books/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// STORAGE FOR PICS
const storagePic = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "files/pics/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
const uploadPic = multer({ storage: storagePic });

// *FILES
app.use("/files/pics", express.static(path.join(__dirname, "files/pics")));

async function readData(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Faylni o'qishda xatolik yuz berdi: ${error}`);
    return [];
  }
}

async function writeData(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log("Ma'lumotlar saqlandi");
  } catch (error) {
    console.error(`Faylni yozishda xatolik yuz berdi: ${error}`);
  }
}

async function findBookById(id) {
  try {
    const bookData = await fs.readFile("collection/books/books.json", "utf8");
    const books = JSON.parse(bookData);
    return books.find((book) => book.id === id);
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function deleteFanFromKafedra(kafedraId, fanId) {
  try {
    let kafedralar = await readData("collection/kafedra/kafedra.json");
    const kafedraIndex = kafedralar.findIndex((k) => k.id === kafedraId);

    if (kafedraIndex === -1) {
      throw new Error("Bunday ID bilan kafedra topilmadi");
    }

    const fanlar = kafedralar[kafedraIndex].fanlar;
    const fanIndex = fanlar.findIndex((f) => f.id === fanId);

    if (fanIndex === -1) {
      throw new Error("Bunday ID bilan fan topilmadi");
    }

    fanlar.splice(fanIndex, 1);

    await writeData("collection/kafedra/kafedra.json", kafedralar);
    console.log("Fan muvaffaqiyatli o'chirildi");
    return "Fan muvaffaqiyatli o'chirildi";
  } catch (error) {
    console.error(`Fan o'chirishda xatolik yuz berdi: ${error.message}`);
    throw error;
  }
}

app.post("/uploadFile", upload.single("file"), (req, res) => {
  res.send("Fayl muvaffaqiyatli yuklandi");
});

app.post("/uploadPic", uploadPic.single("image"), (req, res) => {
  res.send("Surat muvaffaqiyatli yuklandi");
});

// *BOOKS
app.get("/books", async (req, res) => {
  const data = await readData("collection/books/books.json");
  res.json(data);
});

app.post("/books", async (req, res) => {
  try {
    const books = await readData("collection/books/books.json");
    const newBook = { ...req.body, id: books.length + 1 };
    books.push(newBook);
    await writeData("collection/books/books.json", books);
    res.send("Ma'lumotlar saqlandi");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

app.put("/books/:id", async (req, res) => {
  try {
    const books = await readData("collection/books/books.json");
    const id = parseInt(req.params.id);
    const index = books.findIndex((book) => book.id === id);

    if (index === -1) {
      res.status(404).send("Bunday ID bilan kitob topilmadi");
      return;
    }

    books[index] = { ...books[index], ...req.body };
    await writeData("collection/books/books.json", books);
    console.log("Kitob muvaffaqiyatli yangilandi");
    res.send("Kitob muvaffaqiyatli o'yangilandi");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

app.get("/book/:id", async (req, res) => {
  try {
    const data = await readData("collection/books/books.json");
    const bookId = parseInt(req.params.id);
    const book = data.find((book) => book.id === bookId);
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

app.use("/files/books", express.static(path.join(__dirname, "files/books")));

// *CATEGORY
app.get("/categories", async (req, res) => {
  try {
    const categories = await readData("collection/categories/categories.json");
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

app.post("/categories", async (req, res) => {
  try {
    const categories = await readData("collection/categories/categories.json");
    const newCategory = { id: categories.length + 1, ...req.body };
    categories.push(newCategory);
    await writeData("collection/categories/categories.json", categories);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

app.delete("/categories/:id", async (req, res) => {
  try {
    const categories = await readData("collection/categories/categories.json");
    const id = parseInt(req.params.id);
    const index = categories.findIndex((category) => category.id === id);

    if (index === -1) {
      res.status(404).send("Bunday ID bilan kategoriya topilmadi");
      return;
    }

    categories.splice(index, 1);
    await writeData("collection/categories/categories.json", categories);
    console.log("Kategoriya muvaffaqiyatli o'chirildi");
    res.send("Kategoriya muvaffaqiyatli o'chirildi");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

// * KAFEDRA (Toplam)
app.get("/toplam", async (req, res) => {
  const data = await readData("collection/kafedra/kafedra.json");
  res.json(data);
});

app.get("/toplam/:kafedraId", async (req, res) => {
  try {
    const kafedraId = parseInt(req.params.kafedraId);
    const kafedralar = await readData("collection/kafedra/kafedra.json");
    const kafedra = kafedralar.find((k) => k.id === kafedraId);

    if (!kafedra) {
      res.status(404).send("Bunday ID bilan kafedra topilmadi");
      return;
    }

    for (let i = 0; i < kafedra.fanlar.length; i++) {
      for (let j = 0; j < kafedra.fanlar[i].books.length; j++) {
        const bookId = kafedra.fanlar[i].books[j];
        const book = await findBookById(bookId);
        kafedra.fanlar[i].books[j] = book;
      }
    }

    res.json(kafedra);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

app.post("/toplam", async (req, res) => {
  try {
    const kafedralar = await readData("collection/kafedra/kafedra.json");
    const newId =
      kafedralar.length > 0 ? kafedralar[kafedralar.length - 1].id + 1 : 1;
    const newKafedra = { id: newId, ...req.body };
    kafedralar.push(newKafedra);
    await writeData("collection/kafedra/kafedra.json", kafedralar);
    res.send("Ma'lumotlar saqlandi");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

// Kafedrani ochirish
app.delete("/toplam/:kafedraId", async (req, res) => {
  const kafedraId = parseInt(req.params.kafedraId);
  const kafedraData = await readData("collection/kafedra/kafedra.json");
  const kafedraIndex = kafedraData.findIndex((kaf) => kaf.id === kafedraId);

  if (kafedraIndex === -1) {
    throw new Error("Kafedra topilmadi");
  }
  try {
    kafedraData.splice(kafedraIndex, 1)[0];
    writeData("collection/kafedra/kafedra.json", kafedraData);
    res.send("Kafedra muvaffaqiyatli o'chirildi");
  } catch (error) {
    res.status(500).send("Kafedra o'chirishda xatolik yuz berdi");
  }
});

// Kafedrani tahrirlash
app.put("/toplam/:kafedraId", async (req, res) => {
  const kafedraId = parseInt(req.params.kafedraId);
  const kafedraData = await readData("collection/kafedra/kafedra.json");
  const kafedraIndex = kafedraData.findIndex((kaf) => kaf.id === kafedraId);

  if (kafedraIndex === -1) {
    throw new Error("Kafedra topilmadi");
  }
  const { name, desc } = req.body;

  try {
    kafedraData[kafedraIndex].name = name;
    kafedraData[kafedraIndex].desc = desc;
    writeData("collection/kafedra/kafedra.json", kafedraData);
  } catch (error) {}

  console.log(kafedraData);
  res.json(kafedraData[kafedraIndex]);
});

// Fan qoshish
app.post("/toplam/:kafedraId", async (req, res) => {
  try {
    const kafedraId = parseInt(req.params.kafedraId);
    const { name, books } = req.body;

    const kafedralar = await readData("collection/kafedra/kafedra.json");
    const kafedraIndex = kafedralar.findIndex((k) => k.id === kafedraId);

    if (kafedraIndex === -1) {
      res.status(404).send("Bunday ID bilan kafedra topilmadi");
      return;
    }

    const newFanId =
      kafedralar[kafedraIndex].fanlar.length > 0
        ? kafedralar[kafedraIndex].fanlar[
            kafedralar[kafedraIndex].fanlar.length - 1
          ].id + 1
        : 1;

    const newFan = { id: newFanId, name, books };
    kafedralar[kafedraIndex].fanlar.push(newFan);

    await writeData("collection/kafedra/kafedra.json", kafedralar);
    res.send("Ma'lumotlar saqlandi");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server xatosi");
  }
});

// Kafedra ichidagi fanlardan birortasini ochirish
app.delete("/toplam/:kafedraId/:fanId", async (req, res) => {
  const kafedraId = parseInt(req.params.kafedraId);
  const fanId = parseInt(req.params.fanId);

  try {
    await deleteFanFromKafedra(kafedraId, fanId);
    res.send("Fan muvaffaqiyatli o'chirildi");
  } catch (error) {
    res.status(500).send("Fan o'chirishda xatolik yuz berdi");
  }
});

// *DEFAULT
app.get("/", (req, res) => {
  res.send(
    `
    <html>
      <head>
        <title>
          backend => Ochiq elektron malumotlar bazasi 
        </title>
      </head>
      <body>
        <center><h1 style="color: red;">Ochiq Elektron Adabiyot Baza</h1></center>
      </body>
    </html>
    `
  );
});

app.listen(port, () => {
  console.log(`Server http://localhost:${port} portida ishga tushdi`);
});
