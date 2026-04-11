import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken, sendOTPEmail, triggerBrevo } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
import { saveOTP, verifyOTP } from "../lib/otp.js";

export const signup = async (req, res) => {
  const { email, fullName, password } = req.body;
  try {
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = { email, fullName, password: hashedPassword };
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await saveOTP(email, otp, userData);
    await sendOTPEmail(email, otp);

    res.status(201).json({ message: "OTP sent", email });
  } catch (error) {
    console.log("Error in signup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyUserOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOTP(email, otp);

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    const newUser = new User({
      email: result.userData.email,
      fullName: result.userData.fullName,
      password: result.userData.password,
      isVerified: true,
    });

    await newUser.save();

    generateToken(newUser._id, res);
    await triggerBrevo(newUser.email, newUser.fullName);

    res.status(200).json({
      _id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Verify your email first" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userid = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userid,
      { profilePic: uploadResponse.secure_url },
      { returnDocument: "after" }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateProfile :", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth :", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
