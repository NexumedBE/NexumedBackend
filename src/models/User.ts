import mongoose, { CallbackError, Document } from "mongoose";
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
  current: boolean;
  admin: boolean;
  firstTime: boolean;
  doctors?: { 
    firstName: string; 
    lastName: string; 
    drsId: string; 
    email: string 
  }[];
  emrProviders?: {
    name: string; 
    incomingFormat: string;  
    outgoingFormat: string;  
    inputFolder?: string;  
    outputFolder?: string; 
  }[];
  selectedDevices?: {
    manufacturer: string; 
    device: string;  
    deviceId: string; 
    format: string;  
  }[];
}

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  drsId: { type: String, required: true, unique: true },
  practice: { type: String, required: true },
  address: { type: String, default: "" },
  town: { type: String, default: "" },
  country: { type: String, default: "" },
  countryCode: { type: String, default: "" },
  phone: { type: String, default: "" },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  jobTitle: { type: String, default: "" },
  current: { type: Boolean, default: false, required: true },
  admin: { type: Boolean, default: false, required: true },
  firstTime: { type: Boolean, default: true }, 
  doctors: {
    type: [
      {
        firstName: String,
        lastName: String,
        drsId: String,
        email: String,
      }
    ],
    default: [], 
  },
  emrProviders: {
    type: [
      {
        name: { type: String, required: true },
        incomingFormat: { type: String, required: true },
        outgoingFormat: { type: String, required: true },
        inputFolder: { type: String, default: "" },
        outputFolder: { type: String, default: "" }
      }
    ],
    default: [],
  },
  selectedDevices: {
    type: [
      {
        manufacturer: { type: String, required: true },
        device: { type: String, required: true },
        deviceId: { type: String, required: true},
        format: { type: String, required: true },
      }
    ],
    default: [],
  },
});

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

const User = mongoose.model<IUser>("User", UserSchema);
export default User;






