
import mongoose, { CallbackError } from "mongoose";
import bcrypt from "bcryptjs";

// Define the user schema interface
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  drsId: string;
  practice: string;
  address?: string;
  town?: string;
  country?: string;
  countryCode?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  deviceCompany?: string;
  emrProvider?: string;
  current: boolean;
  admin:boolean;
  firstTime: boolean;
  doctors?: { firstName: string; lastName: string; drsId: string; email: string }[];
  selectedDevices?: { manufacturer: string; device: string }[];
}

// Define the schema with all required and optional fields
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  drsId: { type: String, required: true, unique: true },
  practice: { type: String, required: true},
  address: { type: String, default: "" },
  town: { type: String, default: "" },
  country: { type: String, default: "" },
  countryCode: { type: String, default: "" },
  phone: { type: String, default: "" },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  jobTitle: { type: String, default: "" },
  deviceCompany: { type: String, default: "" },
  emrProvider: { type: String, default: "" },
  current: { type: Boolean, default: false, required: true },
  admin: { type: Boolean, default: false, required: true },
  firstTime: { type: Boolean, default: true }, 
  doctors: [
    {
      firstName: String,
      lastName: String,
      drsId: String,
      email: String,
    }
  ],
  selectedDevices: [
    {
      manufacturer: String,
      device: String,
    }
  ],
});

// Hash the password before saving
UserSchema.pre("save", async function (next) {
  const user = this as any;

  if (!user.isModified("password")) return next();

  try {
    user.password = await bcrypt.hash(user.password, 10);
    return next();
  } catch (err) {
    console.error("Error hashing password:", err);
    return next(err as CallbackError);
  }
});

const User = mongoose.model("User", UserSchema);
export default User;




