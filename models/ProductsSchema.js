const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  gst: Number,
  finalPrice: Number,
  dateOfManufactured: Date,
  dateOfExpiry: Date,
  piecesAvailable: Number,
  imageUrl:String ,
  DeliveryFee:Number,
  Category:String
});

module.exports = mongoose.model("Product", ProductSchema, "Products");
