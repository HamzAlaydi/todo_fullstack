const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connect to mongoose
mongoose.connect(
  "mongodb+srv://hamza:Test123@cluster0.qiqiwus.mongodb.net/todolistDBretryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
// create itemsSchema
const itemsSchema = {
  name: {
    type: String,
    required: [true, "Please check your data entry, no name specified!"],
  },
};
// create Item model
const Item = mongoose.model("Item", itemsSchema);

// create item documents
const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "To add new item, type it in the box below and click +",
});
const item3 = new Item({
  name: "to delete an item, click the checkbox",
});

const defaultItems = [item1, item2, item3];

/////////////////////////////////////////
// create lists schema
const listsSchema = {
  name: String,
  items: [itemsSchema],
};

// cerate lists model
const List = mongoose.model("List", listsSchema);

app.get("/", (req, res) => {
  Item.find().then((result, err) => {
    err && console.log(err);
    if (result.length === 0) {
      Item.insertMany(defaultItems).then((result, err) =>
        err ? console.log(err) : console.log("inserted" + result)
      );
      res.redirect("/");
    } else {
      // const day = date.getDate();
      res.render("list", { listTitle: "TODAY", items: result });
    }
  });
});

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  const list = new List({
    name: customListName,
    items: defaultItems,
  });
  List.findOne({ name: customListName }).then((result, err) => {
    err && console.log(err);
    if (!result) {
      list.save().then((result, err) => {
        err ? console.log(err) : console.log("inserted" + result);
      });
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: result.name, items: result.items });
    }
  });
});

// post request
app.post("/", function (req, res) {
  const { list } = req.body;
  console.log(req.body.newItem);
  console.log(list);

  const item = new Item({
    name: req.body.newItem,
  });
  if (list === "TODAY") {
    item.save().then((result, err) => {
      err ? console.log(err) : item.save();
      res.redirect("/");
    });
  } else {
    List.findOne({ name: list }).then((result, err) => {
      err && console.log(err);
      result.items.push(item);
      result.save();
      console.log(result);
    });
    res.redirect("/" + list);
  }
});
app.post("/delete", (req, res) => {
  const selectedItem = req.body.checkbox;
  const { listName } = req.body;
  console.log({ listName });
  console.log({ selectedItem });
  if (listName === "TODAY") {
    Item.findByIdAndRemove(selectedItem).then((selectedItem, err) => {
      err ? console.log(err) : console.log("deleted" + selectedItem);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: selectedItem } } }
    ).then((result, err) => {
      err && console.log(err);
      console.log(result);
    });
    res.redirect("/" + listName);
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
