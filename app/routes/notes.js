var express = require("express");
var router = express.Router();
const Note = require("../models/note.js");
const withAuth = require("../middleware/auth.js");
const isOwner = (user, note) => {
  if (JSON.stringify(user.id) == JSON.stringify(note.author.id)) return true;
  else return false;
};

router.post("/", withAuth, async function (req, res) {
  const { title, body } = req.body;
  try {
    let note = new Note({ title: title, body: body, author: req.user._id });
    await note.save();
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ error: "Problem creating a note" });
  }
});

router.get("/:id", withAuth, async (req, res) => {
  const { query } = req.query;

  try {
    let notes = await Note.find({ author: req.user._id }).find({
      $text: { $search: query },
    });
    res.json(notes);
  } catch (error) {
    res.json({ error: error }).status(500);
  }
});

router.get("/:id", withAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let note = await Note.findById(id);
    if (isOwner(req.user, note)) res.json(note);
    else res.status(403).json({ error: "Permission denied" });
  } catch (error) {
    res.status(500).json({ error: "Problem to get a note" });
  }
});

router.get("/", withAuth, async (req, res) => {
  try {
    let notes = await Note.find({ author: req.user._id });
    res.json(notes);
  } catch (error) {
    res.json({ error: error }).status(500);
  }
});

router.put("/:id", withAuth, async (req, res) => {
  const { title, body } = req.body;
  const { id } = req.params;
  try {
    let note = await Note.findById(id);
    if (isOwner(req.user, note)) {
      let note = await Note.findOneAndUpdate(
        id,
        { $set: { title: title, body: body } },
        { upsert: true, new: true }
      );
      res.json(note);
    } else res.status(403).json({ error: "Permission denied" });
  } catch (error) {
    res.status(500).json({ error: "Problem to update a note" });
  }
});

router.delete("/:id", withAuth, async (req, res) => {
  const id = req.params;
  try {
    let note = await Note.findById(id);
    if (isOwner(req.user, note)) {
      await Note.delete();
      res.json({ message: "Note deleted" });
    } else {
      res.status(403).json({ error: "Permission denied" });
    }
  } catch (error) {
    res.status(500).json({ error: "Problem to delete a note" });
  }
});

module.exports = router;
