import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import User from "../models/User";
import {sendEmailWithTempPassword } from "../utils/emailService";
import bcrypt from "bcryptjs"

const router = express.Router();

// Register a new user
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  console.log("🚀 Incoming registration request:", req.body);  // ✅ Debugging Line
  
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
    admin,
    current,
    doctors = [],
    emrProviders = [],  // ✅ Correct field
    selectedDevices = [],
  } = req.body;

  // 🚀 Log the parsed values before saving
  console.log("🛠 Parsed registration data:");
  console.log("   - Username:", username);
  console.log("   - Email:", email);
  console.log("   - Doctors:", doctors);
  console.log("   - emrProviders:", emrProviders);
  console.log("   - selectedDevices:", selectedDevices);

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { drsId }] });
    if (existingUser) {
      console.log("❌ User already exists:", existingUser);
      res.status(400).json({
        message: "Username, Email, or Drs ID already exists.",
      });
      return;
    }

    const userCurrent = typeof current === "boolean" ? current : false;
    const userAdmin = typeof admin === "boolean" ? admin : true;

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
      admin: userAdmin,
      current: userCurrent,
      firstTime: true,
      doctors: Array.isArray(doctors) ? doctors : [], 
      emrProviders: Array.isArray(emrProviders) ? emrProviders : [], 
      selectedDevices: Array.isArray(selectedDevices) ? selectedDevices : [], 
    });

    await newUser.save();

    console.log("✅ User registered successfully:", newUser);

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
        current: newUser.current,
        admin: newUser.admin,
        firstTime: newUser.firstTime,
        doctors: newUser.doctors || [],
        emrProviders: newUser.emrProviders || [],  
        selectedDevices: newUser.selectedDevices || [],
      },
    });
  } catch (err) {
    console.error("❌ Error in registration route:", err);
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

        // Ensure we return structured EMR and device data
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
          current: completeUser.current,
          admin: completeUser.admin,
          firstTime: completeUser.firstTime,
          doctors: completeUser.doctors || [],
          emrProviders: completeUser.emrProviders || [],
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
    let updatedUser = await User.findById(id);

    if (!updatedUser) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    console.log("🔍 Original user before update:", updatedUser);

    // ✅ Dynamically update user fields (excluding `doctors`, `selectedDevices`, and `emrProviders`)
    Object.keys(updatedFields).forEach((key) => {
      if (key !== "doctors" && key !== "selectedDevices" && key !== "emrProviders") {
        (updatedUser as any)[key] = updatedFields[key];
      }
    });

    // ✅ Ensure `emrProviders` is properly formatted as an array of objects
    if (Array.isArray(updatedFields.emrProviders)) {
      updatedUser.set(
        "emrProviders",
        updatedFields.emrProviders.map((provider: { 
          name: string; 
          incomingFormat: string; 
          outgoingFormat: string; 
          inputFolder: string; 
          outputFolder: string; 
        }) => ({
          name: provider.name || "Unknown",
          incomingFormat: provider.incomingFormat || "Unknown",
          outgoingFormat: provider.outgoingFormat || "Unknown",
          inputFolder: provider.inputFolder || "",
          outputFolder: provider.outputFolder || "",
        }))
      );
      updatedUser.markModified("emrProviders");
    } else {
      updatedUser.set("emrProviders", []);
    }

    // ✅ Ensure `selectedDevices` is properly formatted
    if (Array.isArray(updatedFields.selectedDevices)) {
      updatedUser.set(
        "selectedDevices",
        updatedFields.selectedDevices.map((device: { manufacturer: string; device: string; deviceId?: string; format?: string }) => ({
          manufacturer: device.manufacturer,
          device: device.device,
          deviceId: device.deviceId || `${device.manufacturer}-${device.device}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          format: device.format || "GDT",
        }))
      );
      updatedUser.markModified("selectedDevices");
    }

    // ✅ Process doctors: Ensure valid entries and create new user profiles if needed
    if (Array.isArray(updatedFields.doctors)) {
      updatedUser.set(
        "doctors",
        updatedFields.doctors.filter((doc: { firstName: string; lastName: string; drsId: string; email: string }) => doc.drsId)
      );
      updatedUser.markModified("doctors");
    }

    await updatedUser.save();
    console.log("✅ Updated user saved:", updatedUser);

    // ✅ Process doctor updates separately (Creating new doctor profiles if they don't exist)
    await Promise.all(
      updatedFields.doctors.map(async (doctor: { 
        firstName: string; 
        lastName: string; 
        drsId: string; 
        email: string; 
      }) => {
        if (!doctor.email || !doctor.drsId) {
          console.warn(`Skipping doctor ${doctor.lastName ?? "Unknown"}, missing email or drsId.`);
          return;
        }

        // ✅ Check if doctor already exists
        const existingDoctor = await User.findOne({ email: doctor.email }).select("+password");

        let updatedFieldsForDoctor: {
          firstName: string;
          lastName: string;
          drsId: string;
          username: string;
          practice: string;
          doctors: typeof updatedUser.doctors;
          selectedDevices: typeof updatedUser.selectedDevices;
          emrProviders: typeof updatedUser.emrProviders;
          address: string;
          town: string;
          country: string;
          countryCode: string;
          phone: string;  
          jobTitle: string;
          current: boolean;
          admin: boolean;
          firstTime: boolean;
          password?: string;
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
          emrProviders: updatedUser.emrProviders,
          address: updatedUser.address ?? "",
          town: updatedUser.town ?? "",
          country: updatedUser.country ?? "",
          countryCode: updatedUser.countryCode ?? "",
          phone: updatedUser.phone ?? "",  
          jobTitle: updatedUser.jobTitle ?? "",
          current: true,
          admin: existingDoctor ? existingDoctor.admin : false,
          firstTime: existingDoctor ? existingDoctor.firstTime : true,
        };
        

        // ✅ Preserve existing password if doctor exists
        if (existingDoctor?.password) {
          updatedFieldsForDoctor.password = existingDoctor.password;
        } else {
          // ✅ Create new doctor user with a temporary password
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
        emrProviders: updatedUser.emrProviders || [],
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

  console.log("🛠️ Received update profile request:", req.body);

  if (!id) {
    console.log("❌ Error: No user ID provided.");
    res.status(400).json({ message: "User ID is required." });
    return;
  }

  try {
    console.log("🔍 Searching for user with ID:", id);
    let user = await User.findById(id);

    if (!user) {
      console.log("❌ User not found.");
      res.status(404).json({ message: "User not found." });
      return;
    }

    console.log("🛠️ Found user before update:", user);

    // ✅ Update user fields if provided
    if (username) { user.username = username; user.markModified("username"); }
    if (firstName) { user.firstName = firstName; user.markModified("firstName"); }
    if (lastName) { user.lastName = lastName; user.markModified("lastName"); }
    if (jobTitle) { user.jobTitle = jobTitle; user.markModified("jobTitle"); }
    if (address) { user.address = address; user.markModified("address"); }
    if (town) { user.town = town; user.markModified("town"); }
    if (country) { user.country = country; user.markModified("country"); }
    if (phone) { user.phone = phone; user.markModified("phone"); }
    if (practice) { user.practice = practice; user.markModified("practice"); }

    console.log("🚀 Saving user with updated fields:", user);

    await user.save();

    console.log("✅ User saved successfully:", user);

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




