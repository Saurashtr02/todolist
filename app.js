//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");




main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://soulmongerc8:mongoDBPass02@cluster0.m1bbind.mongodb.net/todoListDB?retryWrites=true&w=majority/');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  
  const itemSchema = {
    name : String
  };
  
  const Item = mongoose.model("Item", itemSchema);
  
  const item1 = new Item({
    name : "Welcome to your to-do list"
  });
  
  const item2 = new Item({
    name : "hit + to add item"
  });
  
  const item3 = new Item({
    name : "<-- click to delete an item"
  });
  
  const defaultItems = [item1,item2,item3];

  const listSchema = mongoose.Schema({
    name: String,
    items: [itemSchema]
  })

  const List = mongoose.model("List",listSchema);
  

  
  const app = express();
  
  app.set('view engine', 'ejs');
  
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(express.static("public"));
  
  // const items = ["Buy Food", "Cook Food", "Eat Food"];
  // const workItems = [];
  
  app.get("/", async function(req, res) {
    
    const day = date.getDate();

    const foundItems = await Item.find({});

    if(foundItems.length === 0){
      Item.insertMany(defaultItems);
      res.redirect("/");
    }
    else{
      // foundItems.forEach(function(item){
      //   console.log(item);
      // })

      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });

  app.get("/:customListName", async function(req,res){
    // console.log(req.params.customListName);
    const cstmListName = _.capitalize(req.params.customListName);

    const foundList = await List.findOne({name:cstmListName});
    if(foundList){
      res.render("list", {listTitle: cstmListName, newListItems: foundList.items});
    }
    else{
      const list = new List({
        name : cstmListName,
        items : defaultItems
      })
  
      list.save();
      res.redirect("/"+cstmListName);
    }

  })
  
  app.post("/", async function(req, res){
    
    const itemName = req.body.newItem;
    const listName = req.body.list;


    const newItem = new Item({
      name:itemName
    })

    if(listName === "Today"){
      newItem.save();
      res.redirect("/");
    }
    else{
      const foundList = await List.findOne({name:listName});
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    }


    
  //   if (req.body.list === "Work") {
  //     workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function(req,res){
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItem).then(function(err){
     if(!err){
       console.log("item successfully deleted");
     }
    }).catch(function(err){
     console.log(err);
    });

    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name:listName}, {$pull :{items: {_id: checkedItem}}}).then(function(foundList){
        res.redirect("/" + listName);
    }).catch(function(err){
      console.log(err);
    })
  }

})


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port ==""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});

}