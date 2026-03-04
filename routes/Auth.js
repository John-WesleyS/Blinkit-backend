const express = require("express");
const router = express.Router();

const { UserSignin, UserLogin } = require("../controllers/UserauthController");
const {AdminLogin,AdminSignin}=require("../controllers/AdminAuthController")


router.post("/signin", UserSignin);
router.post("/login", UserLogin);

router.post("/AdminSignin",AdminSignin)
router.post("/AdminLogin",AdminLogin)

module.exports = router;