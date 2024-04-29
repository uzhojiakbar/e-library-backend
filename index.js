const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const url = require("url");

const multer = require("multer");

const app = express();
const port = 3030;

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

app.post("/uploadFile", upload.single("file"), (req, res) => {
  res.send("Fayl muvaffaqiyatli yuklandi");
});

app.post("/uploadPic", uploadPic.single("image"), (req, res) => {
  res.send("Surat muvaffaqiyatli yuklandi");
});

// *BOOKS
app.get("/books", (req, res) => {
  fs.readFile("collection/books/books.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server xatosi");
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.post("/books", (req, res) => {
  // console.log(req.body);
  fs.readFile("collection/books/books.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Qandaydur xatolik");
      return;
    }
    let books = [];
    if (data) {
      books = JSON.parse(data);
    }

    books.push({ ...req.body, id: books[books.length - 1].id + 1 });

    fs.writeFile(
      "collection/books/books.json",
      JSON.stringify(books, null, 2),
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Server xatosi");
          return;
        }
        res.send("Ma'lumotlar saqlandi");
      }
    );
  });
});

app.put("/books/:id", (req, res) => {
  fs.readFile("collection/books/books.json", "utf8", (err, data) => {
    if (err) {
      console.error("Faylni o'qishda xatolik yuz berdi:", err);
      res.status(500).send("Faylni o'qishda xatolik yuz berdi");
      return;
    }

    let books = JSON.parse(data);
    const id = parseInt(req.params.id);
    const index = books.findIndex((book) => book.id === id);

    let res = { ...books[index], ...req.body };
    books[index] = res;
    console.log(books);

    fs.writeFile(
      "collection/books/books.json",
      JSON.stringify(books, null, 2),
      (err) => {
        if (err) {
          console.error("Faylni yozishda xatolik yuz berdi:", err);
          res.status(500).send("Faylni yozishda xatolik yuz berdi");
          return;
        }
        console.log("Kitob muvaffaqiyatli yangilandi");
        res.send("Kitob muvaffaqiyatli o'yangilandi");
      }
    );
  });
});

app.get("/book/:id", (req, res) => {
  fs.readFile("collection/books/books.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server xatosi");
      return;
    }
    const bookId = url.parse(req.url, true).pathname.slice(6);
    var book = {};
    JSON.parse(data).map((v) => {
      if (v.id == bookId) {
        book = v;
      }
    });
    res.json(book);
  });
});

app.use("/files/books", express.static(path.join(__dirname, "files/books")));

// *CATEGORY
app.get("/categories", (req, res) => {
  fs.readFile("collection/categories/categories.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server xatosi");
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.post("/categories", (req, res) => {
  // console.log(req.body);
  fs.readFile("collection/categories/categories.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Qandaydur xatolik");
      return;
    }
    let ctg = [];
    if (data) {
      ctg = JSON.parse(data);
    }

    ctg.push({ id: ctg[ctg.length - 1].id + 1, ...req.body });
    console.log(req.body);

    fs.writeFile(
      "collection/categories/categories.json",
      JSON.stringify(ctg, null, 2),
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Server xatosi");
          return;
        }
        res.send("Ma'lumotlar saqlandi");
      }
    );
  });
});

app.delete("/categories/:id", (req, res) => {
  fs.readFile("collection/categories/categories.json", "utf8", (err, data) => {
    if (err) {
      console.error("Faylni o'qishda xatolik yuz berdi:", err);
      res.status(500).send("Faylni o'qishda xatolik yuz berdi");
      return;
    }

    let ctgs = JSON.parse(data);
    const id = parseInt(req.params.id);
    const index = ctgs.findIndex((ctg) => ctg.id === id);

    if (index === -1) {
      res.status(404).send("Bunday ID bilan kitob topilmadi");
      return;
    }

    ctgs.splice(index, 1);

    fs.writeFile(
      "collection/categories/categories.json",
      JSON.stringify(ctgs, null, 2),
      (err) => {
        if (err) {
          console.error("Faylni yozishda xatolik yuz berdi:", err);
          res.status(500).send("Faylni yozishda xatolik yuz berdi");
          return;
        }
        console.log("Kitob muvaffaqiyatli o'chirildi");
        res.send("Kitob muvaffaqiyatli o'chirildi");
      }
    );
  });
});

// * KAFEDRA (Toplam)

app.get("/kafedra", (req, res) => {
  fs.readFile("collection/kafedra/kafedra.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server xatosi");
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.post("/kafedra", (req, res) => {
  fs.readFile("collection/kafedra/kafedra.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Qandaydur xatolik");
      return;
    }
    let kafedra = [];
    if (data) {
      kafedra = JSON.parse(data);
    }
    const newId = kafedra.length > 0 ? kafedra[kafedra.length - 1].id + 1 : 1;

    kafedra.push({ id: newId, ...req.body });
    console.log(kafedra);
    console.log(req.body);

    fs.writeFile(
      "collection/kafedra/kafedra.json",
      JSON.stringify(kafedra, null, 2),
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Server xatosi");
          return;
        }
        res.send("Ma'lumotlar saqlandi");
      }
    );
  });
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
