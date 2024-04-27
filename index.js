const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const multer = require("multer");

const app = express();
const port = 3030;

app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "files/books/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
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

// app.get("/downloadFile/:filename", (req, res) => {
//   const file = path.join(__dirname, "files/books", req.params.filename);
//   res.download(file);
// });

app.post("/uploadFile", upload.single("file"), (req, res) => {
  res.send("Fayl muvaffaqiyatli yuklandi");
});

app.post("/uploadPic", uploadPic.single("image"), (req, res) => {
  res.send("Surat muvaffaqiyatli yuklandi");
});

app.get("/books", (req, res) => {
  fs.readFile("collection/books/books.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server xatosi");
      return;
    }
    res.json(JSON.parse(data));
    console.log(data);
  });
});

app.listen(port, () => {
  console.log(`Server http://localhost:${port} portida ishga tushdi`);
});
