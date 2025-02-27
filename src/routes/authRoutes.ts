import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import User from "../models/User";
import {sendEmailWithTempPassword } from "../utils/emailService";
import bcrypt from "bcryptjs"

const router = express.Router();

// Register a new user
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const {
    username,
    email,
    password,
    drsId,
    practice,
    address = "",
    town = "",
    country = "",
    countryCode = "",
    phone = "",
    firstName = "",
    lastName = "",
    jobTitle = "",
    deviceCompany = "",
    emrProvider = "",
    admin, // ✅ Receive admin from request
    current, 
    doctors = [],
    selectedDevices = [],
  } = req.body;

  console.log("Incoming registration request:", req.body);

  if (!username || !email || !password || !drsId || !practice) {
    console.log("Validation failed: Missing required fields.");
    res.status(400).json({
      message: "Username, Email, Drs ID, Password, and Practice are required.",
    });
    return;
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { drsId }] });
    if (existingUser) {
      console.log("User already exists:", existingUser);
      res.status(400).json({
        message: "Username, Email, or Drs ID already exists.",
      });
      return;
    }

    const userCurrent = typeof current === "boolean" ? current : false;
    const userAdmin = typeof admin === "boolean" ? admin : false; // ✅ Fix admin assignment

    const newUser = new User({
      username,
      email,
      password,
      drsId,
      practice,
      address,
      town,
      country,
      countryCode,
      phone,
      firstName,
      lastName,
      jobTitle,
      deviceCompany,
      emrProvider,
      admin: userAdmin, // ✅ Ensure admin is set properly
      current: userCurrent, 
      firstTime: true,
      doctors,
      selectedDevices,
    });

    await newUser.save();

    console.log("User registered successfully:", newUser);

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        drsId: newUser.drsId,
        practice: newUser.practice,
        address: newUser.address,
        town: newUser.town,
        country: newUser.country,
        countryCode: newUser.countryCode,
        phone: newUser.phone,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        jobTitle: newUser.jobTitle,
        deviceCompany: newUser.deviceCompany || "",
        emrProvider: newUser.emrProvider || "",
        current: newUser.current,
        admin: newUser.admin, // ✅ Ensure admin is included in response
        firstTime: newUser.firstTime, 
        doctors: newUser.doctors || [],
        selectedDevices: newUser.selectedDevices || [],
      },
    });
  } catch (err) {
    console.error("Error in registration route:", err);
    res.status(500).json({
      message: "Error registering user.",
      error: (err as Error).message,
    });
  }
});




// Login user
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", async (err: Error | null, user: any, info: { message?: string }) => {
    if (err) {
      console.error("Authentication error:", err);
      return res.status(500).json({ message: "Server error.", error: err.message });
    }

    if (!user) {
      console.log("Login failed: Invalid credentials");
      return res.status(401).json({ message: info?.message || "Invalid credentials." });
    }

    req.logIn(user, async (err) => {
      if (err) {
        console.error("Session error during login:", err);
        return res.status(500).json({ message: "Error logging in.", error: err.message });
      }

      try {
        // Fetch full user data excluding the password
        const completeUser = await User.findById(user._id).select("-password");

        if (!completeUser) {
          console.log("User not found in database");
          return res.status(404).json({ message: "User not found." });
        }

        // Prepare user data response object
        const userResponse = {
          id: completeUser._id,
          username: completeUser.username,
          email: completeUser.email,
          drsId: completeUser.drsId,
          practice: completeUser.practice, 
          address: completeUser.address || "",
          country: completeUser.country || "",
          firstName: completeUser.firstName || "",
          jobTitle: completeUser.jobTitle || "",
          lastName: completeUser.lastName || "",
          phone: completeUser.phone || "",
          town: completeUser.town || "",
          deviceCompany: completeUser.deviceCompany || "",
          emrProvider: completeUser.emrProvider || "",
          current: completeUser.current,
          admin: completeUser.admin, // ✅ Ensure admin is included
          firstTime: completeUser.firstTime,
          doctors: completeUser.doctors || [],
          selectedDevices: completeUser.selectedDevices || [],
        };
        
        

        console.log("User logged in successfully:", userResponse);

        res.status(200).json({
          message: "Login successful.",
          user: userResponse,
        });
      } catch (error) {
        console.error("Error retrieving user profile:", error);
        res.status(500).json({ message: "Failed to fetch user profile." });
      }
    });
  })(req, res, next);
});

// Logout logic
router.post("/logout", (req, res) => {
  console.log("Logout request received. Session:", req.session);

  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).json({ message: "Logout failed." });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Session destruction failed." });
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      console.log("Session cleared and logout successful.");
      res.status(200).json({ message: "Logout successful." });
    });
  });
});

// Update user drs and devices
router.put("/update", async (req: Request, res: Response): Promise<void> => {
  const { id, ...updatedFields } = req.body;

  if (!id) {
    res.status(400).json({ message: "User ID is required." });
    return;
  }

  try {
    // ✅ Fetch the user instead of using `findByIdAndUpdate`
    let updatedUser = await User.findById(id);

    if (!updatedUser) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    console.log("🔍 Original user before update:", updatedUser);

    // ✅ Update fields dynamically
    Object.keys(updatedFields).forEach((key) => {
      (updatedUser as any)[key] = updatedFields[key];
    });

    // ✅ Ensure doctors are properly updated (Fix: Use `.set()` for Mongoose DocumentArray)
    if (Array.isArray(updatedUser.doctors)) {
      updatedUser.set("doctors", updatedUser.doctors.filter((doc) => doc.drsId)); // Ensure valid IDs
      updatedUser.markModified("doctors"); // 🚀 Ensure changes are saved
    }

    // ✅ Ensure `selectedDevices` is properly updated
    if (Array.isArray(updatedUser.selectedDevices)) {
      updatedUser.set("selectedDevices", updatedUser.selectedDevices);
      updatedUser.markModified("selectedDevices"); // 🚀 Ensure changes are saved
    }

    await updatedUser.save(); // 🚀 Save updated user to the database

    console.log("✅ Updated user saved:", updatedUser);

    // ✅ Process doctor updates separately
    await Promise.all(
      updatedUser.doctors.map(async (doctor) => {
        if (!doctor.email || !doctor.drsId) {
          console.warn(`Skipping doctor ${doctor.lastName ?? "Unknown"}, missing email or drsId.`);
          return;
        }

        // ✅ Select password explicitly
        const existingDoctor = await User.findOne({ email: doctor.email }).select("+password");

        let updatedFieldsForDoctor: {
          firstName: string;
          lastName: string;
          drsId: string;
          username: string;
          practice: string;
          address: string;
          doctors: typeof updatedUser.doctors;
          selectedDevices: typeof updatedUser.selectedDevices;
          emrProvider: string;
          firstTime: boolean;
          password?: string;
          town: string;
          country: string;
          countryCode: string;
          jobTitle: string;
          current: boolean;
          admin: boolean;
        } = {
          firstName: doctor.firstName ?? "Unknown",
          lastName: doctor.lastName ?? "Unknown",
          drsId: doctor.drsId,
          username: existingDoctor
            ? existingDoctor.username
            : `${doctor.email.split("@")[0]}${Math.floor(100000000 + Math.random() * 900000000)}`,
          practice: updatedUser.practice,
          doctors: updatedUser.doctors,
          selectedDevices: updatedUser.selectedDevices,
          emrProvider: updatedUser.emrProvider,
          address: updatedUser.address,
          town: updatedUser.town,
          country: updatedUser.country,
          countryCode: updatedUser.countryCode,
          jobTitle: updatedUser.jobTitle,
          current: updatedUser.current,
          admin: existingDoctor
            ? existingDoctor.admin
            : false,
          firstTime: false,
        };

        // ✅ Preserve existing password if doctor exists
        if (existingDoctor?.password) {
          updatedFieldsForDoctor.password = existingDoctor.password;
        }

        if (!existingDoctor) {
          const { hashedPassword } = await sendEmailWithTempPassword(
            doctor.email,
            doctor.lastName ?? "Unknown",
            doctor.drsId ?? ""
          );
          updatedFieldsForDoctor.password = hashedPassword;
        }

        await User.findOneAndUpdate(
          { email: doctor.email },
          updatedFieldsForDoctor,
          { upsert: true, new: true, runValidators: false }
        );
      })
    );

    console.log("🔵 Sending updated user back to frontend:", updatedUser);

    // ✅ Return updated user
    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        drsId: updatedUser.drsId,
        practice: updatedUser.practice || "",
        address: updatedUser.address || "",
        town: updatedUser.town || "",
        country: updatedUser.country || "",
        countryCode: updatedUser.countryCode || "",
        phone: updatedUser.phone || "",
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        jobTitle: updatedUser.jobTitle || "",
        deviceCompany: updatedUser.deviceCompany || "",
        emrProvider: updatedUser.emrProvider || "",
        current: updatedUser.current,
        admin: updatedUser.admin,
        firstTime: updatedUser.firstTime,
        doctors: updatedUser.doctors || [],
        selectedDevices: updatedUser.selectedDevices || [],
      },
    });
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    res.status(500).json({ message: "Error updating profile.", error: (error as Error).message });
  }
});


//update profile
router.put("/update-profile", async (req: Request, res: Response): Promise<void> => {
  const { id, username, firstName, lastName, jobTitle, address, town, country, phone, practice } = req.body;

  if (!id) {
    res.status(400).json({ message: "User ID is required." });
    return;
  }

  try {
    // ✅ Fetch user instead of using `findByIdAndUpdate`
    let user = await User.findById(id);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    console.log("🔍 Updating profile for user:", user);

    // ✅ Update only profile fields
    user.username = username || user.username;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.jobTitle = jobTitle || user.jobTitle;
    user.address = address || user.address;
    user.town = town || user.town;
    user.country = country || user.country;
    user.phone = phone || user.phone;
    user.practice = practice || user.practice;

    await user.save(); // 🚀 Save updated user

    console.log("✅ Profile updated successfully:", user);

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email, // Keep email static (read-only)
        drsId: user.drsId, // Keep Drs ID static (read-only)
        jobTitle: user.jobTitle || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        address: user.address || "",
        town: user.town || "",
        country: user.country || "",
        phone: user.phone || "",
        practice: user.practice || "",
      },
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile.", error: (error as Error).message });
  }
});

router.put(
  "/update-subscription",
  async (req: Request, res: Response): Promise<void> => {
    const { email, current } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    try {
      const user = await User.findOneAndUpdate(
        { email },
        { current: true, admin: true },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }

      res.status(200).json({
        message: "User subscription updated successfully.",
        user: { email: user.email, current: user.current },
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Error updating subscription." });
    }
  }
);

router.post("/change-password", async (req: Request, res: Response): Promise<void> => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    res.status(400).json({ message: "All fields are required." });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Current password is incorrect." });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { email },
      { $set: { password: hashedNewPassword } },
      { new: true, runValidators: false } as any 
    );

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password." });
  }
});



export default router;




