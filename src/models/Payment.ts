import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    stripeId: string;
    amount: number;
    currency: string;
    status: string;
    createdAt?: Date;
}

const PaymentSchema = new Schema<IPayment>({
    stripeId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
}, { timestamps: true });

const PaymentModel = mongoose.model<IPayment>('Payment', PaymentSchema);

export default PaymentModel;
