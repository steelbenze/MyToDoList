const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB" ,{useNewUrlParser:true});
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const itemsSchema ={
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your tosolist!"
});

const item2 = new Item({
  name: "Hit this + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema ={
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
    Item.find({})
      .then(foundItems => {
        if (foundItems.length === 0){
          Item.insertMany(defaultItems)
            .then(insertedItems => {
              console.log('Successfully saved default items to DB.');
            })
            .catch(err => {
              console.error('Error:', err);
            });
            res.redirect("/");
        }
        else{
          res.render("list", { listTitle: "Today", newListItems: foundItems });
        }

      })
      .catch(err => {
        console.error('Error:', err);
      });

  });

app.get("/:customListName", async function(req, res) {
      const customListName = _.capitalize(req.params.customListName);

      try {
        const foundList = await List.findOne({ name: customListName });

            if (!foundList) {
                    //Create a new list
          const newlist = new List({
            name: customListName,
            items: defaultItems
          });

                    newlist.save();
                    res.redirect("/" + customListName);
            }
            else{
                //Show an existing list
                res.render("list",{ listTitle: foundList.name , newListItems: foundList.items });
              }
       }
       catch (err) {
          console.error('Error:', err);
      }
  });

app.post("/", async function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    try {
        if (listName === "Today") {
          await item.save();
          console.log("Added new item.");
          res.redirect("/");
        }
        else {
          const foundList = await List.findOne({ name: listName });
          foundList.items.push(item);
          await foundList.save();
          console.log("Added new item.");
          res.redirect("/" + listName);
        }
    }
    catch (err) {
      console.error('Error:', err);
    }
  });


app.post("/delete", async function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId)
        .then(checkedItemId => {
          console.log('Successfully deleted item.');
          res.redirect("/");
        })
        .catch(err => {
          console.error('Error:', err);
        });
    }
    else{
      try {
        await List.findOneAndUpdate(
          { name: listName },
          { $pull: { items: { _id: checkedItemId } } }
);
        res.redirect("/" + listName);
      } catch (err) {
        console.error('Error:', err);
      }

    }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000..");
});
