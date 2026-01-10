const express = require("express");
const upload = require("./multer.js");
const { uploadImage } = require("./controller.js");

const router = express.Router();

router.post("/upload", upload.single("image"), uploadImage);

module.exports = router;
